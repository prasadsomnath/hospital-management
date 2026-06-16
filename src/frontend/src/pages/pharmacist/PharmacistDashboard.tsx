import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Clock,
  Layers,
  Minus,
  PackageOpen,
  Pill,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AnalyzeItem {
  name: string;
  code: string;
  qty: number;
  manufacturer: string;
  currentStock: number;
  unitPrice: number;
  minStockLevel: number;
  expiryDate?: string;
  rackLocation?: string;
  avgDailyVelocity?: number;
  daysOfStockLeft?: number;
  tier?: "FAST" | "MODERATE" | "SLOW";
}

interface ReorderAlert {
  name: string;
  code: string;
  currentStock: number;
  minStockLevel: number;
  avgDailyVelocity: number;
  daysOfStockLeft: number;
  tier: "FAST" | "MODERATE" | "SLOW";
  urgency: "CRITICAL" | "WARNING" | "OK";
  rackLocation: string;
}

const parseUtc = (dateStr: string | number) => {
  if (!dateStr) return new Date();
  if (typeof dateStr === "number") return new Date(dateStr);
  let normalized = dateStr.replace(" ", "T");
  if (
    !normalized.endsWith("Z") &&
    !normalized.includes("+") &&
    !normalized.includes("-", 10)
  ) {
    normalized = normalized + "Z";
  }
  return new Date(normalized);
};

export default function PharmacistDashboard() {
  const { user } = useAuthStore();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [dispensedCount, setDispensedCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [totalMedicinesCount, setTotalMedicinesCount] = useState<number>(0);

  // Analytics State
  const [fastMoving, setFastMoving] = useState<AnalyzeItem[]>([]);
  const [moderateMoving, setModerateMoving] = useState<AnalyzeItem[]>([]);
  const [slowMoving, setSlowMoving] = useState<AnalyzeItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [timeframe, setTimeframe] = useState<"TODAY" | "7DAYS" | "30DAYS">(
    "TODAY",
  );
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDashboardStats = async (showToast = false) => {
    const hospitalCode = user?.hospitalCode || "HSP001";
    try {
      setLoading(true);

      // 1. Fetch Pending Prescriptions count
      const rxRes = await apiFetch<any>(
        "/pharmacy/prescriptions?status=PENDING",
        {
          headers: { "X-Hospital-Code": hospitalCode },
        },
      );
      const pendingList = rxRes?.content || rxRes || [];
      setPendingCount(pendingList.length);

      // 2. Fetch all Medicines in system
      const medRes = await apiFetch<any>("/pharmacy/medicines", {
        headers: { "X-Hospital-Code": hospitalCode },
      });
      const medicinesList = medRes?.content || medRes || [];
      setTotalMedicinesCount(medicinesList.length);

      // Count low stock items
      const lowStock = medicinesList.filter(
        (m: any) =>
          m.lowStockWarning || m.stockQuantity <= (m.minStockLevel || 10),
      );
      setLowStockCount(lowStock.length);

      // 3. Fetch all Transactions
      const txRes = await apiFetch<any>("/pharmacy/transactions", {
        headers: { "X-Hospital-Code": hospitalCode },
      });
      const transactionsList = txRes?.content || txRes || [];

      // Keep last 5 transactions for the activity feed
      const sortedTx = [...transactionsList].sort((a, b) => {
        return (
          parseUtc(b.createdAt || 0).getTime() -
          parseUtc(a.createdAt || 0).getTime()
        );
      });
      setRecentTransactions(sortedTx.slice(0, 5));

      const todayStr = new Date().toDateString();

      // Today's total sold count
      const todaySold = transactionsList
        .filter(
          (tx: any) =>
            (tx.transactionType === "STOCK_OUT" ||
              tx.transactionType === "DISPENSED") &&
            parseUtc(tx.createdAt).toDateString() === todayStr,
        )
        .reduce((sum: number, tx: any) => sum + (tx.quantity || 0), 0);
      setDispensedCount(todaySold);

      // ============================================================
      // VELOCITY SCORING: Always use last 30 days for stable metric
      // ============================================================
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30DaysTxns = transactionsList.filter((tx: any) => {
        const isOut =
          tx.transactionType === "STOCK_OUT" ||
          tx.transactionType === "DISPENSED";
        if (!isOut) return false;
        return parseUtc(tx.createdAt).getTime() >= thirtyDaysAgo.getTime();
      });

      // Also filter for the selected timeframe panel display
      const timeframeTxns = transactionsList.filter((tx: any) => {
        const isOut =
          tx.transactionType === "STOCK_OUT" ||
          tx.transactionType === "DISPENSED";
        if (!isOut) return false;
        const txDate = parseUtc(tx.createdAt);
        const diffTime = Math.abs(new Date().getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (timeframe === "TODAY") return txDate.toDateString() === todayStr;
        if (timeframe === "7DAYS") return diffDays <= 7;
        return diffDays <= 30;
      });

      // Build base sales map from medicine catalog
      const salesMap: Record<string, AnalyzeItem> = {};
      medicinesList.forEach((med: any) => {
        salesMap[med.name] = {
          name: med.name,
          code: med.medicineCode || "MED-N/A",
          qty: 0,
          manufacturer: med.manufacturer || "N/A",
          currentStock: med.stockQuantity || 0,
          unitPrice: med.sellingPrice || med.unitPrice || 0.0,
          minStockLevel: med.minStockLevel || 10,
          expiryDate: med.expiryDate,
          rackLocation: med.rackLocation || "—",
        };
      });

      // Accumulate 30-day quantities for velocity calculation
      const velocityMap: Record<string, number> = {};
      last30DaysTxns.forEach((tx: any) => {
        const n = tx.medicineName;
        velocityMap[n] = (velocityMap[n] || 0) + (tx.quantity || 0);
      });

      // Accumulate timeframe quantities for panel display
      timeframeTxns.forEach((tx: any) => {
        const name = tx.medicineName;
        if (salesMap[name]) {
          salesMap[name].qty += tx.quantity || 0;
        } else {
          salesMap[name] = {
            name,
            code: tx.medicineCode || "MED-N/A",
            qty: tx.quantity || 0,
            manufacturer: "General Pharma",
            currentStock: 0,
            unitPrice: 10.0,
            minStockLevel: 10,
            rackLocation: "—",
          };
        }
      });

      // Compute velocity metrics for each medicine
      const enrichedArray = Object.values(salesMap).map((item) => {
        const totalSold30 = velocityMap[item.name] || 0;
        const avgDailyVelocity = Number.parseFloat(
          (totalSold30 / 30).toFixed(2),
        );
        const daysOfStockLeft =
          avgDailyVelocity > 0
            ? Math.round(item.currentStock / avgDailyVelocity)
            : 9999;

        // 3-tier classification
        let tier: "FAST" | "MODERATE" | "SLOW";
        if (avgDailyVelocity > 3 || daysOfStockLeft < 7) {
          tier = "FAST";
        } else if (avgDailyVelocity >= 1 || daysOfStockLeft <= 21) {
          tier = "MODERATE";
        } else {
          tier = "SLOW";
        }

        return { ...item, avgDailyVelocity, daysOfStockLeft, tier };
      });

      // Separate into tiers
      const fast = enrichedArray
        .filter((i) => i.tier === "FAST" && i.qty > 0)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3);
      setFastMoving(fast);

      const moderate = enrichedArray
        .filter((i) => i.tier === "MODERATE")
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3);
      setModerateMoving(moderate);

      const slow = enrichedArray
        .filter((i) => i.tier === "SLOW")
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, 3);
      setSlowMoving(slow);

      // Build reorder alerts
      const alerts: ReorderAlert[] = enrichedArray
        .filter(
          (item) =>
            item.daysOfStockLeft! < 14 ||
            item.currentStock <= (item.minStockLevel || 10) * 1.5,
        )
        .map((item) => {
          const urgency: "CRITICAL" | "WARNING" | "OK" =
            item.daysOfStockLeft! < 7 || item.currentStock <= item.minStockLevel
              ? "CRITICAL"
              : "WARNING";
          return {
            name: item.name,
            code: item.code,
            currentStock: item.currentStock,
            minStockLevel: item.minStockLevel || 10,
            avgDailyVelocity: item.avgDailyVelocity!,
            daysOfStockLeft: item.daysOfStockLeft!,
            tier: item.tier!,
            urgency,
            rackLocation: item.rackLocation || "—",
          };
        })
        .sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft)
        .slice(0, 8);
      setReorderAlerts(alerts);

      if (showToast) {
        toast.success("Command Center stats synchronized");
      }
    } catch (err) {
      console.warn("Failed to fetch dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.hospitalCode) {
      fetchDashboardStats();
    }
  }, [user, timeframe]);

  const getMaxSales = () => {
    if (fastMoving.length === 0) return 1;
    return Math.max(...fastMoving.map((f) => f.qty));
  };

  const getFriendlyTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    const date = parseUtc(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getTierConfig = (tier?: string) => {
    if (tier === "FAST")
      return {
        label: "FAST",
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-800/40",
        dot: "bg-rose-500",
      };
    if (tier === "MODERATE")
      return {
        label: "MODERATE",
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800/40",
        dot: "bg-amber-500",
      };
    return {
      label: "SLOW",
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-900/30",
      border: "border-slate-200 dark:border-slate-700/40",
      dot: "bg-slate-400",
    };
  };

  const criticalCount = reorderAlerts.filter(
    (a) => a.urgency === "CRITICAL",
  ).length;

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto"
      data-ocid="pharmacist.dashboard"
    >
      {/* Banner / Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500/80 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground font-display flex items-center gap-2 tracking-tight">
              Pharmacy Command Center
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Real-time drug velocity, dispense telemetry, and inventory flow
              controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Timeframe selector */}
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-inner gap-1">
            <button
              onClick={() => setTimeframe("TODAY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === "TODAY"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe("7DAYS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === "7DAYS"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe("30DAYS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === "30DAYS"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={() => fetchDashboardStats(true)}
            className={`p-2 border border-border bg-card rounded-xl hover:bg-muted text-foreground transition-all duration-300 flex items-center justify-center ${loading ? "animate-spin" : ""}`}
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Dynamic 4-KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Dispenses */}
        <Link
          to="/pharmacist/prescriptions"
          className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-rose-500/[0.02] hover:border-rose-500/20 shadow-glass-sm group"
        >
          <div className="p-3 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-all">
            <ClipboardList className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Pending Prescriptions
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {pendingCount}
            </h2>
          </div>
        </Link>

        {/* Stock Sold Today */}
        <div className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 shadow-glass-sm">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Stock Sold Today
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {dispensedCount}{" "}
              <span className="text-xs text-muted-foreground font-bold">
                units
              </span>
            </h2>
          </div>
        </div>

        {/* Low Stock / Reorder Alerts */}
        <Link
          to="/pharmacist/stock-intelligence"
          className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-amber-500/[0.02] hover:border-amber-500/20 shadow-glass-sm group"
        >
          <div
            className={`p-3 rounded-xl transition-all ${criticalCount > 0 ? "bg-rose-500/10 group-hover:bg-rose-500/20 animate-pulse" : lowStockCount > 0 ? "bg-amber-500/10 group-hover:bg-amber-500/20" : "bg-slate-100"}`}
          >
            <Clock
              className={`w-5 h-5 ${criticalCount > 0 ? "text-rose-500" : lowStockCount > 0 ? "text-amber-500" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Reorder Alerts
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {reorderAlerts.length}
              {criticalCount > 0 && (
                <span className="text-xs text-rose-500 font-bold ml-1">
                  ({criticalCount} critical)
                </span>
              )}
            </h2>
          </div>
        </Link>

        {/* Total Catalog Items */}
        <Link
          to="/pharmacist/stock-intelligence"
          className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-violet-500/[0.02] hover:border-violet-500/20 shadow-glass-sm group"
        >
          <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-all">
            <Layers className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Active Catalog
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {totalMedicinesCount}{" "}
              <span className="text-xs text-muted-foreground font-bold">
                drugs
              </span>
            </h2>
          </div>
        </Link>
      </div>

      {/* ── REORDER REMINDERS STRIP ── */}
      {reorderAlerts.length > 0 && (
        <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
          <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-background flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <h3 className="font-extrabold text-sm tracking-tight font-display text-foreground">
                Reorder Reminders
              </h3>
              <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full ml-1">
                {reorderAlerts.length} items need attention
              </span>
            </div>
            <Link
              to="/pharmacist/stock-intelligence"
              className="text-[10px] text-primary font-extrabold uppercase tracking-wider flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Full Analysis <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-border">
            {reorderAlerts.map((alert) => (
              <div
                key={alert.code}
                className={`flex-shrink-0 w-52 rounded-xl border p-3 transition-all ${
                  alert.urgency === "CRITICAL"
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                      alert.urgency === "CRITICAL"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {alert.urgency === "CRITICAL" ? "⚠ CRITICAL" : "⚡ WARNING"}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getTierConfig(alert.tier).color} ${getTierConfig(alert.tier).bg}`}
                  >
                    {alert.tier}
                  </span>
                </div>
                <h4
                  className="font-bold text-xs text-foreground leading-snug truncate"
                  title={alert.name}
                >
                  {alert.name}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {alert.code}
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      Stock left
                    </span>
                    <span
                      className={`text-[10px] font-black ${alert.currentStock <= alert.minStockLevel ? "text-rose-600" : "text-amber-600"}`}
                    >
                      {alert.currentStock} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      Days cover
                    </span>
                    <span
                      className={`text-[10px] font-black ${alert.daysOfStockLeft < 7 ? "text-rose-600" : "text-amber-600"}`}
                    >
                      {alert.daysOfStockLeft === 9999
                        ? "∞"
                        : `~${alert.daysOfStockLeft}d`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      Velocity
                    </span>
                    <span className="text-[10px] font-bold text-foreground">
                      {alert.avgDailyVelocity.toFixed(1)} u/day
                    </span>
                  </div>
                  {alert.rackLocation !== "—" && (
                    <div className="mt-1.5 text-[9px] bg-background/60 px-2 py-1 rounded text-muted-foreground font-mono">
                      📍 Rack: {alert.rackLocation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VELOCITY ANALYTICS PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3 Column: Velocity Tier Panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FAST MOVING */}
            <div className="glass-elevated rounded-2xl border border-rose-200/50 dark:border-rose-800/20 overflow-hidden shadow-glass-sm flex flex-col">
              <div className="p-3 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-500" />
                  <h3 className="font-extrabold text-xs tracking-tight font-display text-rose-700 dark:text-rose-400">
                    Fast Moving
                  </h3>
                </div>
                <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.5 rounded tracking-wider">
                  High Velocity
                </span>
              </div>
              <div className="divide-y divide-border/40 flex-1">
                {fastMoving.length === 0 ? (
                  <div className="p-5 text-center text-muted-foreground text-[11px] font-semibold">
                    No fast-moving drugs
                    <br />
                    <span className="text-[10px] font-normal text-slate-400">
                      in selected timeframe.
                    </span>
                  </div>
                ) : (
                  fastMoving.map((item, idx) => {
                    const pct = Math.round((item.qty / getMaxSales()) * 100);
                    return (
                      <div
                        key={item.name}
                        className="p-3 hover:bg-rose-50/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-[9px] font-bold text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/30 px-1 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <h4
                              className="font-bold text-[11px] text-foreground mt-0.5 leading-snug truncate max-w-[100px]"
                              title={item.name}
                            >
                              {item.name}
                            </h4>
                            <p className="text-[9px] text-muted-foreground">
                              ~
                              {item.daysOfStockLeft === 9999
                                ? "∞"
                                : item.daysOfStockLeft}
                              d cover left
                            </p>
                          </div>
                          <span className="text-[10px] font-black text-rose-600">
                            +{item.qty}u
                          </span>
                        </div>
                        <div className="w-full bg-rose-100 dark:bg-rose-900/20 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-2 border-t border-rose-100 dark:border-rose-900/20 text-center">
                <Link
                  to="/pharmacist/prescriptions"
                  className="text-[10px] text-rose-500 font-extrabold uppercase inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  Dispense Queue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* MODERATE MOVING */}
            <div className="glass-elevated rounded-2xl border border-amber-200/50 dark:border-amber-800/20 overflow-hidden shadow-glass-sm flex flex-col">
              <div className="p-3 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <h3 className="font-extrabold text-xs tracking-tight font-display text-amber-700 dark:text-amber-400">
                    Moderate
                  </h3>
                </div>
                <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 rounded tracking-wider">
                  Watch
                </span>
              </div>
              <div className="divide-y divide-border/40 flex-1">
                {moderateMoving.length === 0 ? (
                  <div className="p-5 text-center text-muted-foreground text-[11px] font-semibold">
                    No moderate-velocity
                    <br />
                    <span className="text-[10px] font-normal text-slate-400">
                      drugs found.
                    </span>
                  </div>
                ) : (
                  moderateMoving.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 hover:bg-amber-50/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4
                            className="font-bold text-[11px] text-foreground leading-snug truncate max-w-[100px]"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-muted-foreground">
                            {item.avgDailyVelocity?.toFixed(1)} u/day ·{" "}
                            {item.daysOfStockLeft === 9999
                              ? "∞"
                              : item.daysOfStockLeft}
                            d left
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-amber-600">
                          {item.currentStock}u
                        </span>
                      </div>
                      <div className="w-full bg-amber-100 dark:bg-amber-900/20 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, ((item.qty || 1) / Math.max(...moderateMoving.map((m) => m.qty || 1))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-amber-100 dark:border-amber-900/20 text-center">
                <Link
                  to="/pharmacist/stock-intelligence"
                  className="text-[10px] text-amber-500 font-extrabold uppercase inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  Full Intel <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* SLOW MOVING */}
            <div className="glass-elevated rounded-2xl border border-slate-200/50 dark:border-slate-700/20 overflow-hidden shadow-glass-sm flex flex-col">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                  <h3 className="font-extrabold text-xs tracking-tight font-display text-slate-600 dark:text-slate-400">
                    Slow / Stagnant
                  </h3>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded tracking-wider">
                  Overstock Risk
                </span>
              </div>
              <div className="divide-y divide-border/40 flex-1">
                {slowMoving.length === 0 ? (
                  <div className="p-5 text-center text-muted-foreground text-[11px] font-semibold">
                    No stagnant drugs
                    <br />
                    <span className="text-[10px] font-normal text-slate-400">
                      catalog clear.
                    </span>
                  </div>
                ) : (
                  slowMoving.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4
                            className="font-bold text-[11px] text-foreground leading-snug truncate max-w-[100px]"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-muted-foreground">
                            0–{item.qty} sold ·{" "}
                            {item.avgDailyVelocity?.toFixed(1)} u/day
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.qty === 0 ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-400"}`}
                          >
                            {item.qty === 0 ? "No sales" : `${item.qty}u sold`}
                          </span>
                          <p className="text-[9px] font-bold text-muted-foreground mt-1">
                            Stock:{" "}
                            <span
                              className={
                                item.currentStock > 100
                                  ? "text-amber-600 font-extrabold"
                                  : "text-foreground"
                              }
                            >
                              {item.currentStock}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800/20 text-center">
                <Link
                  to="/pharmacist/inventory"
                  className="text-[10px] text-slate-500 font-extrabold uppercase inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  Manage Stock <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Legend / Guideline */}
          <div className="glass-elevated p-4 rounded-2xl border border-border shadow-glass-sm bg-gradient-to-r from-slate-50/40 via-background to-slate-50/40 dark:from-slate-900/10 dark:to-slate-900/10">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-violet-500/10 rounded-xl shrink-0 mt-0.5">
                <BarChart3 className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs tracking-tight text-foreground uppercase">
                  Velocity Classification Guide
                </h4>
                <div className="flex gap-4 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] text-muted-foreground">
                      <b className="text-foreground">Fast</b> — &gt;3 units/day
                      or &lt;7 days cover left → Reorder urgently
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-muted-foreground">
                      <b className="text-foreground">Moderate</b> — 1–3
                      units/day or 7–21 days cover → Monitor closely
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[10px] text-muted-foreground">
                      <b className="text-foreground">Slow</b> — &lt;1 unit/day
                      or &gt;21 days cover → Overstock risk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3 Column: Transaction Telemetry Feed & Low Stock Sidebar */}
        <div className="space-y-6">
          {/* RECENT ACTIVITY TELEMETRY */}
          <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
            <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="font-extrabold text-sm tracking-tight font-display text-foreground">
                Dispense Telemetry Log
              </h3>
            </div>

            <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto divide-y divide-border/40 select-none">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs font-semibold">
                  No inventory transactions recorded.
                </div>
              ) : (
                recentTransactions.map((tx, idx) => {
                  const isStockOut =
                    tx.transactionType === "STOCK_OUT" ||
                    tx.transactionType === "DISPENSED";
                  return (
                    <div
                      key={tx.id || idx}
                      className={`pt-3.5 first:pt-0 flex gap-3 items-start ${idx > 0 ? "border-t border-border/40" : ""}`}
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${isStockOut ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}
                      >
                        {isStockOut ? "Out" : "In"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4
                            className="font-bold text-xs text-foreground truncate max-w-[120px]"
                            title={tx.medicineName}
                          >
                            {tx.medicineName}
                          </h4>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {getFriendlyTime(tx.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex justify-between">
                          <span>
                            Qty: <b>{tx.quantity} units</b>
                          </span>
                          <span className="font-mono text-[9px] truncate max-w-[90px]">
                            {tx.referenceNo || "OPD-99"}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* QUICK LINKS CARD — replaces duplicate 'Critical Refill Alerts' panel */}
          <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
            <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-500" />
              <h3 className="font-extrabold text-sm tracking-tight font-display text-foreground">
                Medicine Management
              </h3>
            </div>
            <div className="p-4 space-y-2.5">
              <Link
                to="/pharmacist/all-medicines"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-teal-500/5 hover:border-teal-500/20 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-all">
                    <Pill className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      All Medicines
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      View catalog · Add stock
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-teal-500 transition-colors" />
              </Link>

              <Link
                to="/pharmacist/stock-intelligence"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-violet-500/5 hover:border-violet-500/20 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-all">
                    <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Stock Intelligence
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Velocity · Expiry · Overstock
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
              </Link>

              <Link
                to="/pharmacist/prescriptions"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-rose-500/5 hover:border-rose-500/20 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-all">
                    <ClipboardList className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Prescriptions
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Dispense queue · Print receipt
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  AlertTriangle,
  BarChart3,
  Box,
  CalendarX2,
  ChevronDown,
  ChevronUp,
  Minus,
  PackageOpen,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type VelocityTier = "FAST" | "MODERATE" | "SLOW";
type Urgency = "CRITICAL" | "WARNING" | "OK";
type SortKey = "name" | "stock" | "velocity" | "days" | "expiry" | "tier";

interface DrugIntel {
  id: number;
  medicineCode: string;
  name: string;
  category: string;
  manufacturer: string;
  strength: string;
  currentStock: number;
  minStockLevel: number;
  sellingPrice: number;
  rackLocation: string;
  expiryDate?: string;

  // Computed
  avgDailyVelocity: number;
  totalSold30Days: number;
  daysOfStockLeft: number;
  tier: VelocityTier;
  urgency: Urgency;
  expiryDaysLeft: number;
}

const parseUtc = (dateStr: string | number) => {
  if (!dateStr) return new Date();
  if (typeof dateStr === "number") return new Date(dateStr);
  let n = String(dateStr).replace(" ", "T");
  if (!n.endsWith("Z") && !n.includes("+") && !n.includes("-", 10)) n += "Z";
  return new Date(n);
};

const classifyTier = (velocity: number, daysLeft: number): VelocityTier => {
  if (velocity > 3 || daysLeft < 7) return "FAST";
  if (velocity >= 1 || daysLeft <= 21) return "MODERATE";
  return "SLOW";
};

const classifyUrgency = (
  stock: number,
  minStock: number,
  daysLeft: number,
): Urgency => {
  if (stock <= minStock || daysLeft < 7) return "CRITICAL";
  if (stock <= minStock * 1.5 || daysLeft < 14) return "WARNING";
  return "OK";
};

const daysUntil = (dateStr?: string): number => {
  if (!dateStr) return 9999;
  const exp = new Date(dateStr);
  const diff = exp.getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

// ─── Tier Tag Component ────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: VelocityTier }) {
  if (tier === "FAST")
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-1.5 py-0.5 rounded-full tracking-wider">
        <Zap className="w-2.5 h-2.5" /> Fast
      </span>
    );
  if (tier === "MODERATE")
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-full tracking-wider">
        <BarChart3 className="w-2.5 h-2.5" /> Moderate
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40 px-1.5 py-0.5 rounded-full tracking-wider">
      <TrendingDown className="w-2.5 h-2.5" /> Slow
    </span>
  );
}

function ExpiryBadge({ days }: { days: number }) {
  if (days === 9999)
    return <span className="text-[10px] text-muted-foreground">N/A</span>;
  if (days < 0)
    return (
      <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 px-1.5 py-0.5 rounded-full">
        EXPIRED
      </span>
    );
  if (days <= 30)
    return (
      <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 px-1.5 py-0.5 rounded-full">
        🔴 {days}d left
      </span>
    );
  if (days <= 90)
    return (
      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-1.5 py-0.5 rounded-full">
        🟡 {days}d left
      </span>
    );
  return (
    <span className="text-[10px] text-muted-foreground font-mono">{days}d</span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PharmacistStockIntelligence() {
  const { user } = useAuthStore();
  const [drugs, setDrugs] = useState<DrugIntel[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<VelocityTier | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("urgency" as SortKey);
  const [sortAsc, setSortAsc] = useState(true);

  const fetchAll = async (showToast = false) => {
    const hospitalCode = user?.hospitalCode || "HSP001";
    setLoading(true);
    try {
      const [medRes, txRes] = await Promise.all([
        apiFetch<any>("/pharmacy/medicines", {
          headers: { "X-Hospital-Code": hospitalCode },
        }),
        apiFetch<any>("/pharmacy/transactions", {
          headers: { "X-Hospital-Code": hospitalCode },
        }),
      ]);

      const medicines: any[] = medRes?.content || medRes || [];
      const transactions: any[] = txRes?.content || txRes || [];

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const outTxns = transactions.filter(
        (tx) =>
          (tx.transactionType === "STOCK_OUT" ||
            tx.transactionType === "DISPENSED") &&
          parseUtc(tx.createdAt).getTime() >= thirtyDaysAgo,
      );

      // velocity map per medicine name
      const velocityMap: Record<string, number> = {};
      outTxns.forEach((tx) => {
        velocityMap[tx.medicineName] =
          (velocityMap[tx.medicineName] || 0) + (tx.quantity || 0);
      });

      const computed: DrugIntel[] = medicines.map((med: any) => {
        const totalSold30 = velocityMap[med.name] || 0;
        const avgDailyVelocity = Number.parseFloat(
          (totalSold30 / 30).toFixed(3),
        );
        const stock = med.stockQuantity ?? 0;
        const minStock = med.minStockLevel ?? 10;
        const daysOfStockLeft =
          avgDailyVelocity > 0 ? Math.round(stock / avgDailyVelocity) : 9999;
        const tier = classifyTier(avgDailyVelocity, daysOfStockLeft);
        const urgency = classifyUrgency(stock, minStock, daysOfStockLeft);
        const expiryDaysLeft = daysUntil(med.expiryDate);

        return {
          id: med.id,
          medicineCode: med.medicineCode,
          name: med.name,
          category: med.category || "—",
          manufacturer: med.manufacturer || "—",
          strength: med.strength || "—",
          currentStock: stock,
          minStockLevel: minStock,
          sellingPrice: med.sellingPrice || med.unitPrice || 0,
          rackLocation: med.rackLocation || "—",
          expiryDate: med.expiryDate,
          avgDailyVelocity,
          totalSold30Days: totalSold30,
          daysOfStockLeft,
          tier,
          urgency,
          expiryDaysLeft,
        };
      });

      setDrugs(computed);
      if (showToast) toast.success("Stock Intelligence data refreshed");
    } catch (err) {
      console.warn("Failed to load stock intelligence:", err);
      toast.error("Failed to load pharmacy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.hospitalCode) fetchAll();
  }, [user]);

  // ── Derived summary KPIs ───────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const critical = drugs.filter((d) => d.urgency === "CRITICAL").length;
    const expiringSoon = drugs.filter(
      (d) => d.expiryDaysLeft >= 0 && d.expiryDaysLeft <= 90,
    ).length;
    const avgCover = drugs.length
      ? Math.round(
          drugs
            .filter((d) => d.daysOfStockLeft < 9999)
            .reduce((s, d) => s + d.daysOfStockLeft, 0) /
            Math.max(drugs.filter((d) => d.daysOfStockLeft < 9999).length, 1),
        )
      : 0;
    return {
      total: drugs.length,
      critical,
      avgCover,
      expiringSoon,
    };
  }, [drugs]);

  // ── Overstock list ─────────────────────────────────────────────────────────
  const overstockList = useMemo(
    () =>
      drugs
        .filter(
          (d) =>
            d.tier === "SLOW" && d.currentStock > d.avgDailyVelocity * 30 * 5,
        )
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, 8),
    [drugs],
  );

  // ── Expiry radar ───────────────────────────────────────────────────────────
  const expiryRadar = useMemo(
    () =>
      drugs
        .filter((d) => d.expiryDaysLeft <= 90)
        .sort((a, b) => a.expiryDaysLeft - b.expiryDaysLeft)
        .slice(0, 10),
    [drugs],
  );

  // ── Filtered + sorted main table ───────────────────────────────────────────
  const tableData = useMemo(() => {
    let list = drugs;
    if (search.trim())
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.medicineCode.toLowerCase().includes(search.toLowerCase()) ||
          d.category.toLowerCase().includes(search.toLowerCase()),
      );
    if (filterTier !== "ALL") list = list.filter((d) => d.tier === filterTier);

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "stock") cmp = a.currentStock - b.currentStock;
      else if (sortKey === "velocity")
        cmp = a.avgDailyVelocity - b.avgDailyVelocity;
      else if (sortKey === "days") cmp = a.daysOfStockLeft - b.daysOfStockLeft;
      else if (sortKey === "expiry") cmp = a.expiryDaysLeft - b.expiryDaysLeft;
      else if (sortKey === "tier") {
        const order = { FAST: 0, MODERATE: 1, SLOW: 2 };
        cmp = order[a.tier] - order[b.tier];
      } else {
        const order = { CRITICAL: 0, WARNING: 1, OK: 2 };
        cmp = order[a.urgency] - order[b.urgency];
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [drugs, search, filterTier, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <Minus className="w-3 h-3 text-muted-foreground/30" />;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
    );
  };

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto"
      data-ocid="pharmacist.stock-intelligence"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-rose-500/80 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground font-display flex items-center gap-2 tracking-tight">
              Stock Intelligence
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Velocity analysis, reorder radar, expiry warnings, and dead-stock
              detection.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchAll(true)}
          className={`flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-all ${loading ? "opacity-70 pointer-events-none" : ""}`}
        >
          <RefreshCw
            className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`}
          />
          Refresh Data
        </button>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-elevated p-4 rounded-2xl border border-border shadow-glass-sm flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 rounded-xl">
            <Box className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Total Drugs
            </p>
            <h2 className="text-2xl font-black text-foreground">
              {kpis.total}
            </h2>
          </div>
        </div>

        <div
          className={`glass-elevated p-4 rounded-2xl border shadow-glass-sm flex items-center gap-3 ${kpis.critical > 0 ? "border-rose-200 dark:border-rose-800/40 bg-rose-50/30 dark:bg-rose-950/10" : "border-border"}`}
        >
          <div
            className={`p-2.5 rounded-xl ${kpis.critical > 0 ? "bg-rose-500/10 animate-pulse" : "bg-slate-100 dark:bg-slate-800"}`}
          >
            <ShieldAlert
              className={`w-5 h-5 ${kpis.critical > 0 ? "text-rose-500" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Critical Alerts
            </p>
            <h2
              className={`text-2xl font-black ${kpis.critical > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}
            >
              {kpis.critical}
            </h2>
          </div>
        </div>

        <div className="glass-elevated p-4 rounded-2xl border border-border shadow-glass-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Avg Days Cover
            </p>
            <h2 className="text-2xl font-black text-foreground">
              {kpis.avgCover === 0 ? "∞" : `${kpis.avgCover}d`}
            </h2>
          </div>
        </div>

        <div
          className={`glass-elevated p-4 rounded-2xl border shadow-glass-sm flex items-center gap-3 ${kpis.expiringSoon > 0 ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10" : "border-border"}`}
        >
          <div
            className={`p-2.5 rounded-xl ${kpis.expiringSoon > 0 ? "bg-amber-500/10" : "bg-slate-100 dark:bg-slate-800"}`}
          >
            <CalendarX2
              className={`w-5 h-5 ${kpis.expiringSoon > 0 ? "text-amber-500" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Expiring ≤90d
            </p>
            <h2
              className={`text-2xl font-black ${kpis.expiringSoon > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
            >
              {kpis.expiringSoon}
            </h2>
          </div>
        </div>
      </div>

      {/* ── Full Velocity Classification Table ── */}
      <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-border/60 bg-muted/5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            <h2 className="font-extrabold text-sm tracking-tight text-foreground font-display">
              Drug Velocity Classification
            </h2>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tableData.length} drugs
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Tier filter */}
            <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/60 text-[11px] gap-0.5">
              {(["ALL", "FAST", "MODERATE", "SLOW"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                    filterTier === t
                      ? t === "FAST"
                        ? "bg-rose-500 text-white"
                        : t === "MODERATE"
                          ? "bg-amber-500 text-white"
                          : t === "SLOW"
                            ? "bg-slate-500 text-white"
                            : "bg-violet-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "ALL" ? "All Tiers" : t}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search drug…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[11px] border border-border bg-background rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                {[
                  { key: "name" as SortKey, label: "Drug Name" },
                  { key: "tier" as SortKey, label: "Tier" },
                  { key: "stock" as SortKey, label: "Stock" },
                  { key: "velocity" as SortKey, label: "Velocity (u/day)" },
                  { key: "days" as SortKey, label: "Days Cover" },
                  { key: "expiry" as SortKey, label: "Expiry" },
                  { key: "urgency" as SortKey, label: "Status" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Rack
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground font-medium text-sm"
                  >
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-500" />
                    Loading stock intelligence…
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground font-medium text-sm"
                  >
                    <PackageOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                    No drugs match your filters.
                  </td>
                </tr>
              ) : (
                tableData.map((drug) => (
                  <tr
                    key={drug.id}
                    className={`border-b border-border/30 hover:bg-muted/5 transition-colors ${
                      drug.urgency === "CRITICAL"
                        ? "bg-rose-50/20 dark:bg-rose-950/10"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-foreground">{drug.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                          {drug.medicineCode} · {drug.category}
                          {drug.strength !== "—" && ` · ${drug.strength}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={drug.tier} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-black ${drug.currentStock <= drug.minStockLevel ? "text-rose-600" : drug.currentStock <= drug.minStockLevel * 1.5 ? "text-amber-600" : "text-foreground"}`}
                      >
                        {drug.currentStock}
                      </span>
                      <span className="text-muted-foreground text-[9px] ml-0.5">
                        u
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Min: {drug.minStockLevel}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${drug.avgDailyVelocity > 3 ? "text-rose-600" : drug.avgDailyVelocity >= 1 ? "text-amber-600" : "text-muted-foreground"}`}
                      >
                        {drug.avgDailyVelocity > 0
                          ? drug.avgDailyVelocity.toFixed(2)
                          : "—"}
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {drug.totalSold30Days}u / 30d
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {drug.daysOfStockLeft === 9999 ? (
                        <span className="text-muted-foreground font-bold">
                          ∞
                        </span>
                      ) : (
                        <span
                          className={`font-black text-sm ${drug.daysOfStockLeft < 7 ? "text-rose-600" : drug.daysOfStockLeft < 14 ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          ~{drug.daysOfStockLeft}d
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge days={drug.expiryDaysLeft} />
                    </td>
                    <td className="px-4 py-3">
                      {drug.urgency === "CRITICAL" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-100 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/30 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-2.5 h-2.5" /> CRITICAL
                        </span>
                      ) : drug.urgency === "WARNING" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 px-2 py-0.5 rounded-full">
                          ⚡ WARNING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/20 px-2 py-0.5 rounded-full">
                          ✓ OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground font-mono">
                      {drug.rackLocation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Overstock Risk & Expiry Radar Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overstock Risk */}
        <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/5 flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-slate-500" />
            <h2 className="font-extrabold text-sm tracking-tight text-foreground font-display">
              Overstock Risk
            </h2>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Dead-stock detection
            </span>
          </div>
          <div className="divide-y divide-border/40">
            {overstockList.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm font-semibold">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-500/60" />
                No overstock detected — catalog looks healthy!
              </div>
            ) : (
              overstockList.map((drug) => (
                <div
                  key={drug.id}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {drug.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {drug.medicineCode} · {drug.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-amber-600 text-sm">
                      {drug.currentStock} units
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {drug.avgDailyVelocity > 0
                        ? `${drug.avgDailyVelocity.toFixed(2)} u/day`
                        : "0 sales velocity"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiry Radar */}
        <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/5 flex items-center gap-2">
            <CalendarX2 className="w-4 h-4 text-amber-500" />
            <h2 className="font-extrabold text-sm tracking-tight text-foreground font-display">
              Expiry Radar
            </h2>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Drugs expiring within 90 days
            </span>
          </div>
          <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
            {expiryRadar.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm font-semibold">
                <CalendarX2 className="w-6 h-6 mx-auto mb-2 text-emerald-500/60" />
                No drugs expiring within 90 days — inventory is safe!
              </div>
            ) : (
              expiryRadar.map((drug) => (
                <div
                  key={drug.id}
                  className={`px-4 py-3 flex items-center justify-between gap-4 transition-colors hover:bg-muted/5 ${drug.expiryDaysLeft < 0 ? "bg-rose-50/20 dark:bg-rose-950/10" : drug.expiryDaysLeft <= 30 ? "bg-rose-50/10 dark:bg-rose-950/5" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {drug.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {drug.medicineCode} · Stock:{" "}
                      <b>{drug.currentStock} units</b>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <ExpiryBadge days={drug.expiryDaysLeft} />
                    {drug.expiryDate && (
                      <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                        {new Date(drug.expiryDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

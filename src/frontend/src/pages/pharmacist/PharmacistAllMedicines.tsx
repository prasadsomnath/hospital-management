import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Minus,
  PackageOpen,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type StockStatus = "IN_STOCK" | "LOW" | "OUT_OF_STOCK";
type SortKey =
  | "name"
  | "stock"
  | "minStock"
  | "velocity"
  | "days"
  | "expiry"
  | "status";
type FilterStatus = "ALL" | "IN_STOCK" | "LOW" | "OUT_OF_STOCK";

interface Medicine {
  id: number;
  medicineCode: string;
  name: string;
  category: string;
  manufacturer: string;
  strength: string;
  stockQuantity: number;
  minStockLevel: number;
  sellingPrice: number;
  unitPrice: number;
  rackLocation: string;
  expiryDate?: string;
  // Computed
  avgDailyVelocity: number;
  totalSold30Days: number;
  daysOfStockLeft: number;
  status: StockStatus;
  expiryDaysLeft: number;
  stockPercent: number; // 0-100 vs a reasonable "full" threshold
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseUtc = (dateStr: string | number) => {
  if (!dateStr) return new Date();
  if (typeof dateStr === "number") return new Date(dateStr);
  let n = String(dateStr).replace(" ", "T");
  if (!n.endsWith("Z") && !n.includes("+") && !n.includes("-", 10)) n += "Z";
  return new Date(n);
};

const daysUntil = (dateStr?: string): number => {
  if (!dateStr) return 9999;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const computeStatus = (stock: number, minStock: number): StockStatus => {
  if (stock === 0) return "OUT_OF_STOCK";
  if (stock <= minStock * 1.5) return "LOW";
  return "IN_STOCK";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "OUT_OF_STOCK")
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 whitespace-nowrap">
        <X className="w-2.5 h-2.5" /> Out of Stock
      </span>
    );
  if (status === "LOW")
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 whitespace-nowrap">
        <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 whitespace-nowrap">
      <CheckCircle2 className="w-2.5 h-2.5" /> In Stock
    </span>
  );
}

function ExpiryChip({ days }: { days: number }) {
  if (days === 9999)
    return <span className="text-[10px] text-muted-foreground">—</span>;
  if (days < 0)
    return (
      <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 px-1.5 py-0.5 rounded-full">
        EXPIRED
      </span>
    );
  if (days <= 30)
    return (
      <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 px-1.5 py-0.5 rounded-full">
        🔴 {days}d
      </span>
    );
  if (days <= 90)
    return (
      <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-1.5 py-0.5 rounded-full">
        🟡 {days}d
      </span>
    );
  return (
    <span className="text-[10px] text-muted-foreground font-mono">{days}d</span>
  );
}

// ─── Add Stock Modal ───────────────────────────────────────────────────────────

interface AddStockModalProps {
  medicine: Medicine;
  hospitalCode: string;
  onClose: () => void;
  onSuccess: (medicineId: number, addedQty: number) => void;
}

function AddStockModal({
  medicine,
  hospitalCode,
  onClose,
  onSuccess,
}: AddStockModalProps) {
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number.parseInt(qty, 10);
    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    setLoading(true);
    try {
      await apiFetch<any>("/pharmacy/transactions", {
        method: "POST",
        headers: { "X-Hospital-Code": hospitalCode },
        body: JSON.stringify({
          medicineId: medicine.id,
          medicineName: medicine.name,
          medicineCode: medicine.medicineCode,
          transactionType: "STOCK_IN",
          quantity,
          notes: notes || `Manual stock-in for ${medicine.name}`,
          referenceNo: `STOCK-IN-${Date.now()}`,
        }),
      });
      toast.success(`Added ${quantity} units of ${medicine.name}`);
      onSuccess(medicine.id, quantity);
      onClose();
    } catch (err) {
      toast.error("Failed to add stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-500/5 to-background flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Plus className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">
                Add Stock
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px] truncate">
                {medicine.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Stock Info */}
        <div className="px-5 py-3 bg-muted/20 flex gap-6 text-xs">
          <div>
            <p className="text-muted-foreground font-medium">Current Stock</p>
            <p
              className={`font-black text-base mt-0.5 ${
                medicine.status === "OUT_OF_STOCK"
                  ? "text-rose-600"
                  : medicine.status === "LOW"
                    ? "text-amber-600"
                    : "text-foreground"
              }`}
            >
              {medicine.stockQuantity} units
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Min Level</p>
            <p className="font-black text-base mt-0.5 text-foreground">
              {medicine.minStockLevel} units
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Code</p>
            <p className="font-mono text-[11px] mt-1 text-muted-foreground">
              {medicine.medicineCode}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Quantity to Add <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 100"
              className="w-full px-3 py-2.5 border border-border bg-background rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-muted-foreground/50"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Supplier, batch no., etc."
              className="w-full px-3 py-2.5 border border-border bg-background rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-muted-foreground/50"
            />
          </div>

          {qty && Number.parseInt(qty) > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-xs">
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                After adding:{" "}
                <span className="font-black">
                  {medicine.stockQuantity + Number.parseInt(qty)} units
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Adding…" : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PharmacistAllMedicines() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortAsc, setSortAsc] = useState(true);
  const [addStockFor, setAddStockFor] = useState<Medicine | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hospitalCode = user?.hospitalCode || "HSP001";

  // ── Fetch all medicine data ─────────────────────────────────────────────────
  const fetchData = useCallback(
    async (showToast = false) => {
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

        const rawMeds: any[] = medRes?.content || medRes || [];
        const rawTx: any[] = txRes?.content || txRes || [];

        // Build 30-day velocity map
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const velocityMap: Record<string, number> = {};
        rawTx.forEach((tx: any) => {
          const isOut =
            tx.transactionType === "STOCK_OUT" ||
            tx.transactionType === "DISPENSED";
          if (!isOut) return;
          if (parseUtc(tx.createdAt).getTime() < thirtyDaysAgo) return;
          velocityMap[tx.medicineName] =
            (velocityMap[tx.medicineName] || 0) + (tx.quantity || 0);
        });

        const computed: Medicine[] = rawMeds.map((med: any) => {
          const stock = med.stockQuantity ?? 0;
          const minStock = med.minStockLevel ?? 10;
          const totalSold30 = velocityMap[med.name] || 0;
          const avgDailyVelocity = Number.parseFloat(
            (totalSold30 / 30).toFixed(3),
          );
          const daysOfStockLeft =
            avgDailyVelocity > 0 ? Math.round(stock / avgDailyVelocity) : 9999;
          const status = computeStatus(stock, minStock);
          const expiryDaysLeft = daysUntil(med.expiryDate);

          // Stock percent: relative to max(currentStock, minStock*3, 100)
          const fullThreshold = Math.max(minStock * 3, 100, stock);
          const stockPercent = Math.min(
            100,
            Math.round((stock / fullThreshold) * 100),
          );

          return {
            id: med.id,
            medicineCode: med.medicineCode || "—",
            name: med.name,
            category: med.category || "—",
            manufacturer: med.manufacturer || "—",
            strength: med.strength || "—",
            stockQuantity: stock,
            minStockLevel: minStock,
            sellingPrice: med.sellingPrice || med.unitPrice || 0,
            unitPrice: med.unitPrice || 0,
            rackLocation: med.rackLocation || "—",
            expiryDate: med.expiryDate,
            avgDailyVelocity,
            totalSold30Days: totalSold30,
            daysOfStockLeft,
            status,
            expiryDaysLeft,
            stockPercent,
          };
        });

        setMedicines(computed);
        if (showToast) toast.success("Medicines data refreshed");
      } catch (err) {
        toast.error("Failed to load medicines");
        console.warn("PharmacistAllMedicines fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [hospitalCode],
  );

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    if (user?.hospitalCode) {
      fetchData();
      refreshTimerRef.current = setInterval(() => fetchData(), 60_000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [user, fetchData]);

  // Optimistic stock update after Add Stock success
  const handleStockAdded = (medicineId: number, addedQty: number) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== medicineId) return m;
        const newStock = m.stockQuantity + addedQty;
        const status = computeStatus(newStock, m.minStockLevel);
        const fullThreshold = Math.max(m.minStockLevel * 3, 100, newStock);
        const stockPercent = Math.min(
          100,
          Math.round((newStock / fullThreshold) * 100),
        );
        return { ...m, stockQuantity: newStock, status, stockPercent };
      }),
    );
  };

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const inStock = medicines.filter((m) => m.status === "IN_STOCK").length;
    const low = medicines.filter((m) => m.status === "LOW").length;
    const out = medicines.filter((m) => m.status === "OUT_OF_STOCK").length;
    return { total: medicines.length, inStock, low, out };
  }, [medicines]);

  // ── Filtered + sorted table ────────────────────────────────────────────────
  const tableData = useMemo(() => {
    let list = medicines;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.medicineCode.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.manufacturer.toLowerCase().includes(q),
      );
    }

    if (filterStatus !== "ALL") {
      list = list.filter((m) => m.status === filterStatus);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "stock") cmp = a.stockQuantity - b.stockQuantity;
      else if (sortKey === "minStock") cmp = a.minStockLevel - b.minStockLevel;
      else if (sortKey === "velocity")
        cmp = a.avgDailyVelocity - b.avgDailyVelocity;
      else if (sortKey === "days") cmp = a.daysOfStockLeft - b.daysOfStockLeft;
      else if (sortKey === "expiry") cmp = a.expiryDaysLeft - b.expiryDaysLeft;
      else {
        const order: Record<StockStatus, number> = {
          OUT_OF_STOCK: 0,
          LOW: 1,
          IN_STOCK: 2,
        };
        cmp = order[a.status] - order[b.status];
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [medicines, search, filterStatus, sortKey, sortAsc]);

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {addStockFor && (
        <AddStockModal
          medicine={addStockFor}
          hospitalCode={hospitalCode}
          onClose={() => setAddStockFor(null)}
          onSuccess={handleStockAdded}
        />
      )}

      <div
        className="space-y-6 max-w-7xl mx-auto"
        data-ocid="pharmacist.all-medicines"
      >
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500/80 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground font-display flex items-center gap-2 tracking-tight">
                All Medicines
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Complete medicine catalog with live stock levels, daily
                depletion tracking &amp; quick restock.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-all ${
              loading ? "opacity-70 pointer-events-none" : ""
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total */}
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`glass-elevated p-4 rounded-2xl border shadow-glass-sm flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              filterStatus === "ALL"
                ? "border-teal-400/60 dark:border-teal-700/60 ring-2 ring-teal-500/20"
                : "border-border"
            }`}
          >
            <div className="p-2.5 bg-teal-500/10 rounded-xl">
              <Box className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Total Drugs
              </p>
              <h2 className="text-2xl font-black text-foreground">
                {kpis.total}
              </h2>
            </div>
          </button>

          {/* In Stock */}
          <button
            onClick={() => setFilterStatus("IN_STOCK")}
            className={`glass-elevated p-4 rounded-2xl border shadow-glass-sm flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              filterStatus === "IN_STOCK"
                ? "border-emerald-400/60 dark:border-emerald-700/60 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10"
                : "border-border"
            }`}
          >
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                In Stock
              </p>
              <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {kpis.inStock}
              </h2>
            </div>
          </button>

          {/* Low Stock */}
          <button
            onClick={() => setFilterStatus("LOW")}
            className={`glass-elevated p-4 rounded-2xl border shadow-glass-sm flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              filterStatus === "LOW"
                ? "border-amber-400/60 dark:border-amber-700/60 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10"
                : kpis.low > 0
                  ? "border-amber-200/50 dark:border-amber-800/20"
                  : "border-border"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${kpis.low > 0 ? "bg-amber-500/10" : "bg-muted"}`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${kpis.low > 0 ? "text-amber-500" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Low Stock
              </p>
              <h2
                className={`text-2xl font-black ${kpis.low > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
              >
                {kpis.low}
              </h2>
            </div>
          </button>

          {/* Out of Stock */}
          <button
            onClick={() => setFilterStatus("OUT_OF_STOCK")}
            className={`glass-elevated p-4 rounded-2xl border shadow-glass-sm flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              filterStatus === "OUT_OF_STOCK"
                ? "border-rose-400/60 dark:border-rose-700/60 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10"
                : kpis.out > 0
                  ? "border-rose-200/50 dark:border-rose-800/20 bg-rose-50/10 dark:bg-rose-950/5"
                  : "border-border"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${kpis.out > 0 ? "bg-rose-500/10 animate-pulse" : "bg-muted"}`}
            >
              <AlertCircle
                className={`w-5 h-5 ${kpis.out > 0 ? "text-rose-500" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Out of Stock
              </p>
              <h2
                className={`text-2xl font-black ${kpis.out > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}
              >
                {kpis.out}
              </h2>
            </div>
          </button>
        </div>

        {/* ── Table ── */}
        <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-border/60 bg-muted/5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-500" />
              <h2 className="font-extrabold text-sm tracking-tight text-foreground font-display">
                Medicine Catalog
              </h2>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {tableData.length}{" "}
                {filterStatus !== "ALL" ? "filtered" : "medicines"}
              </span>
              {filterStatus !== "ALL" && (
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medicine, code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[11px] border border-border bg-background rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500/40 font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/10">
                  {(
                    [
                      { key: "name" as SortKey, label: "Medicine" },
                      { key: "status" as SortKey, label: "Status" },
                      { key: "stock" as SortKey, label: "Stock Level" },
                      { key: "velocity" as SortKey, label: "Daily Depletion" },
                      { key: "days" as SortKey, label: "Days Left" },
                      { key: "expiry" as SortKey, label: "Expiry" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
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
                  <th className="px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-20 text-center text-muted-foreground font-medium text-sm"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-500" />
                      Loading medicine catalog…
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-20 text-center text-muted-foreground font-medium text-sm"
                    >
                      <PackageOpen className="w-7 h-7 mx-auto mb-2 text-muted-foreground/30" />
                      {search
                        ? `No medicines found for "${search}"`
                        : "No medicines match the selected filter."}
                    </td>
                  </tr>
                ) : (
                  tableData.map((med) => (
                    <tr
                      key={med.id}
                      className={`border-b border-border/30 transition-colors hover:bg-muted/5 ${
                        med.status === "OUT_OF_STOCK"
                          ? "bg-rose-50/20 dark:bg-rose-950/10"
                          : med.status === "LOW"
                            ? "bg-amber-50/10 dark:bg-amber-950/5"
                            : ""
                      }`}
                    >
                      {/* Medicine Name */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <div>
                          <p className="font-bold text-foreground leading-snug">
                            {med.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                            {med.medicineCode}
                            {med.category !== "—" && ` · ${med.category}`}
                            {med.strength !== "—" && ` · ${med.strength}`}
                          </p>
                          {med.manufacturer !== "—" && (
                            <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                              {med.manufacturer}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <StatusBadge status={med.status} />
                      </td>

                      {/* Stock Level with bar */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[80px]">
                            {/* Progress bar */}
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-1">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  med.status === "OUT_OF_STOCK"
                                    ? "bg-rose-500 w-0"
                                    : med.status === "LOW"
                                      ? "bg-amber-400"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width:
                                    med.status === "OUT_OF_STOCK"
                                      ? "0%"
                                      : `${med.stockPercent}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span
                                className={`font-black text-sm ${
                                  med.status === "OUT_OF_STOCK"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : med.status === "LOW"
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-foreground"
                                }`}
                              >
                                {med.stockQuantity}
                                <span className="text-[9px] font-bold text-muted-foreground ml-0.5">
                                  u
                                </span>
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                min {med.minStockLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Daily Depletion */}
                      <td className="px-4 py-3">
                        {med.avgDailyVelocity > 0 ? (
                          <div>
                            <p
                              className={`font-bold ${
                                med.avgDailyVelocity > 3
                                  ? "text-rose-600"
                                  : med.avgDailyVelocity >= 1
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {med.avgDailyVelocity.toFixed(1)}
                              <span className="text-[9px] font-normal ml-0.5">
                                u/day
                              </span>
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {med.totalSold30Days}u sold / 30d
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            No sales data
                          </span>
                        )}
                      </td>

                      {/* Days Left */}
                      <td className="px-4 py-3">
                        {med.daysOfStockLeft === 9999 ? (
                          <span className="font-bold text-muted-foreground text-base">
                            ∞
                          </span>
                        ) : (
                          <span
                            className={`font-black text-base ${
                              med.daysOfStockLeft < 7
                                ? "text-rose-600 dark:text-rose-400"
                                : med.daysOfStockLeft < 14
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            ~{med.daysOfStockLeft}
                            <span className="text-[10px] font-bold ml-0.5">
                              days
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3">
                        <ExpiryChip days={med.expiryDaysLeft} />
                        {med.expiryDate && med.expiryDaysLeft !== 9999 && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                            {new Date(med.expiryDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        )}
                      </td>

                      {/* Rack */}
                      <td className="px-4 py-3 text-[10px] text-muted-foreground font-mono">
                        {med.rackLocation}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setAddStockFor(med)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all hover:scale-[1.03] active:scale-[0.97] ${
                            med.status === "OUT_OF_STOCK"
                              ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-500/20"
                              : med.status === "LOW"
                                ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20"
                                : "bg-card border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          Add Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && tableData.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border/40 bg-muted/5 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {tableData.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">{kpis.total}</span>{" "}
                medicines
              </p>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                <p className="text-[10px] text-muted-foreground">
                  Click column headers to sort · Auto-refreshes every 60s
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Legend Guide ── */}
        <div className="glass-elevated p-4 rounded-2xl border border-border shadow-glass-sm bg-gradient-to-r from-teal-50/30 via-background to-teal-50/30 dark:from-teal-950/10 dark:to-teal-950/10">
          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">
                <b className="text-foreground">In Stock</b> — above 1.5× min
                level
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-muted-foreground">
                <b className="text-foreground">Low Stock</b> — at or below 1.5×
                min level → reorder
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[10px] text-muted-foreground">
                <b className="text-foreground">Out of Stock</b> — zero units
                remaining
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-[10px] text-muted-foreground">
                <b className="text-foreground">Days Left</b> — estimated from
                30-day sales velocity
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

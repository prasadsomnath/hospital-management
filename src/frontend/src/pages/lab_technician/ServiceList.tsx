import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { getLocalDateString } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  type DiagnosticItem,
  useLabTechnicianStore,
} from "@/store/lab-technician-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Edit,
  Eye,
  Filter,
  FlaskConical,
  IndianRupee,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Service badge colours ──────────────────────────────────────────────────────
const MODULE_LABELS: Record<string, string> = {
  xray: "X-Ray",
  "ct-scan": "CT Scan",
  usg: "USG",
  lab: "Lab",
  "other-services": "Other",
};

const MODULE_COLORS: Record<string, string> = {
  xray: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "ct-scan": "bg-violet-500/10 text-violet-600 border-violet-500/30",
  usg: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  lab: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  "other-services": "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  Cash: <Banknote className="w-3 h-3" />,
  Card: <CreditCard className="w-3 h-3" />,
  UPI: <QrCode className="w-3 h-3" />,
  Cheque: <Receipt className="w-3 h-3" />,
};

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Card: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  UPI: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  Cheque: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

function StatusBadge({ net, paid }: { net: number; paid: number }) {
  const isPaid = net > 0 && paid >= net;
  const isPartial = paid > 0 && paid < net;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        isPaid
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/35"
          : isPartial
            ? "bg-amber-500/10 text-amber-600 border-amber-500/35"
            : "bg-rose-500/10 text-rose-600 border-rose-500/35"
      }`}
    >
      {isPaid ? "Paid" : isPartial ? "Partial" : "Pending"}
    </Badge>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  prefix = "",
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="bg-card border border-border/70 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground font-display mt-0.5">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ServiceList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    records,
    selectedRecordId,
    setSelectedRecordId,
    updateRecord,
    addPayment,
    fetchRecords,
    procedureCatalog,
    fetchProcedureCatalog,
  } = useLabTechnicianStore();

  useEffect(() => {
    fetchRecords();
    fetchProcedureCatalog();
  }, []);

  const today = getLocalDateString();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [billingTypeFilter, setBillingTypeFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setPage(0);
  }, [
    fromDate,
    toDate,
    billingTypeFilter,
    serviceFilter,
    records.length,
    searchQuery,
  ]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [selectedPaymentIdx, setSelectedPaymentIdx] = useState<number | null>(
    null,
  );
  const [deleteItemConfirmOpen, setDeleteItemConfirmOpen] = useState(false);
  const [deletePaymentConfirmOpen, setDeletePaymentConfirmOpen] =
    useState(false);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // ── Transfer lists ────────────────────────────────────────────────────────
  const [availableReports, setAvailableReports] = useState<DiagnosticItem[]>(
    [],
  );
  const [selectedReports, setSelectedReports] = useState<DiagnosticItem[]>([]);
  const [selectedAvailableIdx, setSelectedAvailableIdx] = useState<
    number | null
  >(null);
  const [selectedSelectedIdx, setSelectedSelectedIdx] = useState<number | null>(
    null,
  );
  const [modalSearch, setModalSearch] = useState("");

  // ── Payment form ─────────────────────────────────────────────────────────
  const [payAmount, setPayAmount] = useState(0);
  const [payType, setPayType] = useState("Cash");
  const [payCheque, setPayCheque] = useState("");

  // ── Discount form ─────────────────────────────────────────────────────────
  const [discAmount, setDiscAmount] = useState(0);

  // ── Filter records ────────────────────────────────────────────────────────
  const filteredRecords = records.filter((r) => {
    const recDate = r.date ? r.date.substring(0, 10) : "";
    if (fromDate && recDate < fromDate) return false;
    if (toDate && recDate > toDate) return false;
    if (billingTypeFilter !== "ALL") {
      const isIPD = r.wardBed !== "OPD" && r.admitted === true;
      if (billingTypeFilter === "IPD" && !isIPD) return false;
      if (billingTypeFilter === "OPD" && isIPD) return false;
    }
    if (serviceFilter !== "ALL") {
      const normalizedModule = r.module.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedFilter = serviceFilter
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (normalizedModule !== normalizedFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !r.patientName?.toLowerCase().includes(q) &&
        !r.patientNo?.toLowerCase().includes(q) &&
        !r.id?.toString().toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const paginatedRecords = filteredRecords.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );
  const activeRecord =
    filteredRecords.find((r) => r.id === selectedRecordId) || null;

  // ── Stat aggregates ───────────────────────────────────────────────────────
  const totalBilled = filteredRecords.reduce((s, r) => s + (r.net || 0), 0);
  const totalCollected = filteredRecords.reduce((s, r) => s + (r.paid || 0), 0);
  const totalDue = filteredRecords.reduce((s, r) => s + (r.due || 0), 0);

  // ── Sync transfer lists ───────────────────────────────────────────────────
  useEffect(() => {
    if (activeRecord) {
      const moduleType = activeRecord.module || "xray";
      const pool =
        procedureCatalog[moduleType] || procedureCatalog["xray"] || [];
      const selectedNames = activeRecord.items.map((i) => i.item);
      setAvailableReports(pool.filter((p) => !selectedNames.includes(p.item)));
      setSelectedReports([...activeRecord.items]);
      setSelectedAvailableIdx(null);
      setSelectedSelectedIdx(null);
      setModalSearch("");
    }
  }, [showItemModal, activeRecord, procedureCatalog]);

  useEffect(() => {
    if (activeRecord) setDiscAmount(activeRecord.discount || 0);
  }, [showDiscountModal, activeRecord]);

  const selectedReportsTotal = selectedReports.reduce(
    (sum, item) => sum + item.rate,
    0,
  );

  // ── Transfer actions ──────────────────────────────────────────────────────
  const handleTransferToSelected = () => {
    const visible = availableReports.filter((r) =>
      r.item.toLowerCase().includes(modalSearch.toLowerCase()),
    );
    if (selectedAvailableIdx !== null && visible[selectedAvailableIdx]) {
      const target = visible[selectedAvailableIdx];
      setSelectedReports([...selectedReports, target]);
      setAvailableReports(
        availableReports.filter((r) => r.item !== target.item),
      );
      setSelectedAvailableIdx(null);
    }
  };
  const handleTransferToAvailable = () => {
    if (selectedSelectedIdx !== null && selectedReports[selectedSelectedIdx]) {
      const target = selectedReports[selectedSelectedIdx];
      setAvailableReports([...availableReports, target]);
      setSelectedReports(
        selectedReports.filter((_, i) => i !== selectedSelectedIdx),
      );
      setSelectedSelectedIdx(null);
    }
  };
  const handleTransferAllToSelected = () => {
    setSelectedReports([...selectedReports, ...availableReports]);
    setAvailableReports([]);
    setSelectedAvailableIdx(null);
  };
  const handleTransferAllToAvailable = () => {
    setAvailableReports([...availableReports, ...selectedReports]);
    setSelectedReports([]);
    setSelectedSelectedIdx(null);
  };

  // ── Save actions ──────────────────────────────────────────────────────────
  const handleSaveItems = () => {
    if (!activeRecord) return;
    const total = selectedReportsTotal;
    const discount = activeRecord.discount || 0;
    const net = Math.max(0, total - discount);
    const paid = activeRecord.payments.reduce((sum, p) => sum + p.amount, 0);
    const due = Math.max(0, net - paid);
    updateRecord(activeRecord.id, { items: selectedReports, total, net, due });
    setShowItemModal(false);
    toast.success("Service items updated successfully.");
  };

  const handleSavePayment = () => {
    if (!activeRecord) return;
    if (payAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    addPayment(activeRecord.id, payAmount, payType, payCheque);
    setShowPaymentModal(false);
    setPayAmount(0);
    setPayCheque("");
    toast.success("Payment receipt logged successfully.");
  };

  const handleSaveDiscount = () => {
    if (!activeRecord) return;
    const total = activeRecord.total || 0;
    const net = Math.max(0, total - discAmount);
    const paid = activeRecord.payments.reduce((sum, p) => sum + p.amount, 0);
    const due = Math.max(0, net - paid);
    updateRecord(activeRecord.id, { discount: discAmount, net, due });
    setShowDiscountModal(false);
    toast.success("Discount adjustment applied.");
  };

  const handleDeleteItem = () => {
    if (!activeRecord || selectedItemIdx === null) {
      toast.error("Please select a procedural item to delete.");
      return;
    }
    setDeleteItemConfirmOpen(true);
  };

  const confirmDeleteItem = () => {
    setDeleteItemConfirmOpen(false);
    if (!activeRecord || selectedItemIdx === null) return;
    const nextItems = activeRecord.items.filter(
      (_, idx) => idx !== selectedItemIdx,
    );
    const total = nextItems.reduce((sum, i) => sum + i.rate, 0);
    const net = Math.max(0, total - activeRecord.discount);
    const paid = activeRecord.payments.reduce((sum, p) => sum + p.amount, 0);
    const due = Math.max(0, net - paid);
    updateRecord(activeRecord.id, { items: nextItems, total, net, due });
    setSelectedItemIdx(null);
    toast.success("Procedural item deleted.");
  };

  const handleDeletePayment = () => {
    if (!activeRecord || selectedPaymentIdx === null) {
      toast.error("Please select a payment receipt to delete.");
      return;
    }
    setDeletePaymentConfirmOpen(true);
  };

  const confirmDeletePayment = () => {
    setDeletePaymentConfirmOpen(false);
    if (!activeRecord || selectedPaymentIdx === null) return;
    const nextPayments = activeRecord.payments.filter(
      (_, idx) => idx !== selectedPaymentIdx,
    );
    const paid = nextPayments.reduce((sum, p) => sum + p.amount, 0);
    const due = Math.max(0, activeRecord.net - paid);
    updateRecord(activeRecord.id, { payments: nextPayments, paid, due });
    setSelectedPaymentIdx(null);
    toast.success("Payment receipt removed.");
  };

  // ── Print Bill ────────────────────────────────────────────────────────────
  const handlePrintBill = () => {
    if (!activeRecord) {
      toast.error("Please select a record first.");
      return;
    }
    const hospitalName = user?.hospitalCode || "Hospital";
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Lab Bill – ${activeRecord.id}</title>
<style>
  body{font-family:Inter,sans-serif;padding:32px;color:#0f172a;max-width:700px;margin:0 auto}
  h1{font-size:22px;font-weight:800;margin:0}
  .sub{font-size:12px;color:#64748b;margin-top:2px}
  .divider{border:none;border-top:1px solid #e2e8f0;margin:16px 0}
  .row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}
  .label{color:#64748b}
  .val{font-weight:600}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
  th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:700;text-transform:uppercase;font-size:10px;color:#475569}
  td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
  .total-row td{font-weight:700;background:#f8fafc}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}
  .paid{background:#d1fae5;color:#065f46}
  .partial{background:#fef3c7;color:#92400e}
  .pending{background:#fee2e2;color:#991b1b}
  .footer{margin-top:32px;text-align:center;font-size:11px;color:#94a3b8}
</style></head><body>
<h1>${hospitalName}</h1>
<p class="sub">Diagnostics & Lab Services Bill</p>
<hr class="divider"/>
<div class="row"><span class="label">Bill No</span><span class="val">${activeRecord.id}</span></div>
<div class="row"><span class="label">Patient Name</span><span class="val">${activeRecord.patientName}</span></div>
<div class="row"><span class="label">Patient No</span><span class="val">${activeRecord.patientNo}</span></div>
<div class="row"><span class="label">Service</span><span class="val">${MODULE_LABELS[activeRecord.module] || activeRecord.module?.toUpperCase()}</span></div>
<div class="row"><span class="label">Date</span><span class="val">${activeRecord.date}</span></div>
<div class="row"><span class="label">Referring Doctor</span><span class="val">${activeRecord.reportingDoctor || activeRecord.ref || "—"}</span></div>
<hr class="divider"/>
<table>
  <thead><tr><th>Procedure / Item</th><th>Rate (₹)</th></tr></thead>
  <tbody>
    ${activeRecord.items.map((it) => `<tr><td>${it.item}</td><td>₹${it.rate.toLocaleString()}</td></tr>`).join("")}
    <tr class="total-row"><td>Subtotal</td><td>₹${activeRecord.total.toLocaleString()}</td></tr>
    <tr class="total-row"><td>Discount</td><td>– ₹${activeRecord.discount.toLocaleString()}</td></tr>
    <tr class="total-row"><td>Net Payable</td><td>₹${activeRecord.net.toLocaleString()}</td></tr>
    <tr class="total-row"><td>Amount Paid</td><td style="color:#059669">₹${activeRecord.paid.toLocaleString()}</td></tr>
    <tr class="total-row"><td>Balance Due</td><td style="color:#dc2626">₹${activeRecord.due.toLocaleString()}</td></tr>
  </tbody>
</table>
${
  activeRecord.payments.length > 0
    ? `
<hr class="divider"/>
<p style="font-size:11px;font-weight:700;margin-bottom:6px;text-transform:uppercase;color:#64748b">Payment Receipts</p>
<table>
  <thead><tr><th>Date</th><th>Receipt No</th><th>Amount</th><th>Mode</th></tr></thead>
  <tbody>
    ${activeRecord.payments.map((p) => `<tr><td>${p.date}</td><td>${p.recpNo}</td><td>₹${p.amount.toLocaleString()}</td><td>${p.type}</td></tr>`).join("")}
  </tbody>
</table>`
    : ""
}
<div class="footer">Generated on ${new Date().toLocaleString("en-IN")} • ${hospitalName}</div>
</body></html>`;
    const w = window.open("", "_blank", "width=760,height=900");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 500);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) {
        if (e.key === "F10" && showItemModal) {
          e.preventDefault();
          handleSaveItems();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowItemModal(false);
          setShowPaymentModal(false);
          setShowDiscountModal(false);
        }
        return;
      }
      if (e.key === "F5") {
        e.preventDefault();
        fetchRecords();
        toast.success("Records refreshed.");
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (showItemModal || showPaymentModal || showDiscountModal) {
          setShowItemModal(false);
          setShowPaymentModal(false);
          setShowDiscountModal(false);
        } else {
          navigate({ to: "/lab-technician" });
        }
      }
      if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePrintBill();
      }
      if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (!activeRecord) {
          toast.error("Select a record first.");
          return;
        }
        toast.info("Opening standard invoice print preview.");
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (!activeRecord) {
          toast.error("Select a record first.");
          return;
        }
        toast.success("Bill shared via WhatsApp.");
      }
      if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        if (!activeRecord) {
          toast.error("Select a record first.");
          return;
        }
        setShowDiscountModal(true);
      }
      if (e.key.toLowerCase() === "e" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!activeRecord) {
          toast.error("Select a record first.");
          return;
        }
        setShowItemModal(true);
      }
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        if (!activeRecord) {
          toast.error("Select a record first.");
          return;
        }
        handleDeleteItem();
      }
      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (!activeRecord) {
          toast.error("Select a record first.");
          return;
        }
        setShowPaymentModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showItemModal,
    showPaymentModal,
    showDiscountModal,
    selectedReportsTotal,
    selectedAvailableIdx,
    selectedSelectedIdx,
    activeRecord,
  ]);

  // ── Derived discount preview ───────────────────────────────────────────────
  const discPreviewNet = activeRecord
    ? Math.max(0, (activeRecord.total || 0) - discAmount)
    : 0;

  // ── Service filter chips ──────────────────────────────────────────────────
  const SERVICE_CHIPS = [
    { label: "All", value: "ALL" },
    { label: "X-Ray", value: "xray" },
    { label: "CT Scan", value: "ctscan" },
    { label: "USG", value: "usg" },
    { label: "Lab", value: "lab" },
    { label: "Other", value: "otherservices" },
  ];

  return (
    <>
      <div className="space-y-6" data-ocid="lab.service_list.page">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-sm">
              <FlaskConical className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
                Diagnostics &amp; Lab Billing
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage diagnostic service billing, procedural items, discounts
                &amp; payment receipts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs px-3.5 py-1.5 rounded-lg bg-muted/20"
            >
              {today}
            </Badge>
            <Button
              onClick={() => {
                fetchRecords();
                toast.success("Records refreshed.");
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-bold flex items-center gap-1.5 h-9 shadow-md shadow-primary/10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh{" "}
              <kbd className="text-[10px] opacity-75">F5</kbd>
            </Button>
            <Button
              onClick={() => navigate({ to: "/lab-technician" })}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted/50 rounded-lg text-xs font-bold flex items-center gap-1.5 h-9"
            >
              <X className="w-3.5 h-3.5" /> Exit{" "}
              <kbd className="text-[10px] opacity-75">Esc</kbd>
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Records"
            value={filteredRecords.length}
            icon={Activity}
            color="bg-teal-500/10 text-teal-600"
          />
          <StatCard
            label="Total Billed"
            value={totalBilled}
            icon={TrendingUp}
            color="bg-indigo-500/10 text-indigo-600"
            prefix="₹"
          />
          <StatCard
            label="Collected"
            value={totalCollected}
            icon={IndianRupee}
            color="bg-emerald-500/10 text-emerald-600"
            prefix="₹"
          />
          <StatCard
            label="Outstanding Due"
            value={totalDue}
            icon={Receipt}
            color="bg-rose-500/10 text-rose-600"
            prefix="₹"
          />
        </div>

        {/* ── Filters ── */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            {/* From date */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> From Date
              </span>
              <DateTimePicker
                type="date"
                value={fromDate}
                onChange={setFromDate}
                className="h-9 px-3 bg-background border border-input text-foreground rounded-lg text-xs font-semibold w-[145px]"
              />
            </div>
            {/* To date */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> To Date
              </span>
              <DateTimePicker
                type="date"
                value={toDate}
                onChange={setToDate}
                className="h-9 px-3 bg-background border border-input text-foreground rounded-lg text-xs font-semibold w-[145px]"
              />
            </div>
            {/* Type filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-primary" /> Type
              </span>
              <select
                value={billingTypeFilter}
                onChange={(e) => setBillingTypeFilter(e.target.value)}
                className="h-9 px-3 bg-background border border-input text-foreground rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-ring min-w-[100px] cursor-pointer"
              >
                <option value="ALL">[ALL]</option>
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
              </select>
            </div>
            {/* Search */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Search className="w-3 h-3 text-primary" /> Search
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Patient name, ID or record no..."
                  className="h-9 pl-9 pr-4 w-full bg-background border border-input text-foreground rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>
            </div>
          </div>

          {/* Service chip filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mr-1">
              Service:
            </span>
            {SERVICE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setServiceFilter(chip.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  serviceFilter === chip.value
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Records Table ── */}
        <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3 bg-muted/20">
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-500" />
                Service Bill Records
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click a row to select it and manage procedural items &amp;
                payments below
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "Print Bill",
                  icon: <Printer className="w-3.5 h-3.5" />,
                  kbd: "V",
                  onClick: handlePrintBill,
                },
                {
                  label: "Preview Bill",
                  icon: <Eye className="w-3.5 h-3.5" />,
                  kbd: "W",
                  onClick: () => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    toast.info("Opening bill preview...");
                  },
                },
                {
                  label: "WhatsApp",
                  icon: <MessageCircle className="w-3.5 h-3.5" />,
                  kbd: "Y",
                  onClick: () => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    toast.success("Bill shared via WhatsApp.");
                  },
                },
                {
                  label: "Discount",
                  icon: <IndianRupee className="w-3.5 h-3.5" />,
                  kbd: "U",
                  onClick: () => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    setShowDiscountModal(true);
                  },
                },
              ].map((act) => (
                <Button
                  key={act.label}
                  onClick={act.onClick}
                  disabled={!activeRecord}
                  variant="outline"
                  className="h-8 border-border text-foreground hover:border-teal-500/40 hover:bg-teal-500/5 font-semibold text-xs flex items-center gap-1.5 px-3 rounded-lg disabled:opacity-40"
                >
                  {act.icon}
                  <span>{act.label}</span>
                  <kbd className="hidden sm:inline-block text-[9px] bg-muted/65 px-1 py-0.5 rounded border border-border text-muted-foreground font-mono">
                    {act.kbd}
                  </kbd>
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Record No</th>
                  <th className="px-4 py-3">Patient No</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Ref. Doctor</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Disc</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border border-border/40">
                          <FlaskConical className="w-7 h-7 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-semibold">
                          No billing records found
                        </p>
                        <p className="text-xs max-w-[280px] text-center">
                          Try adjusting filters or search query
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((row, idx) => {
                    const isSelected = row.id === selectedRecordId;
                    const modKey = row.module?.toLowerCase() || "xray";
                    const modLabel =
                      MODULE_LABELS[modKey] || row.module?.toUpperCase();
                    const modColor =
                      MODULE_COLORS[modKey] || MODULE_COLORS["xray"];
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRecordId(row.id)}
                        className={`cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "bg-teal-500/8 border-l-4 border-l-teal-500 font-medium"
                            : "hover:bg-muted/20 border-l-4 border-l-transparent"
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center font-bold text-muted-foreground/70">
                          {page * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 border ${modColor}`}
                          >
                            {modLabel}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {row.date}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {row.id}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">
                          {row.patientNo}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">
                          {row.patientName}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">
                          {row.reportingDoctor || row.ref || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          ₹{(row.total || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-amber-600">
                          ₹{(row.discount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                          ₹{(row.net || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600">
                          ₹{(row.paid || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-500">
                          ₹{(row.due || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge
                            net={row.net || 0}
                            paid={row.paid || 0}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControl
            currentPage={page}
            totalPages={Math.ceil(filteredRecords.length / pageSize)}
            totalElements={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="px-5 py-3 border-t border-border/60 bg-card/25"
          />
        </div>

        {/* ── Selected Record Detail Panel ── */}
        {activeRecord && (
          <div className="bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-teal-500/20 rounded-2xl p-4 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs flex-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Patient
                </p>
                <p className="font-bold text-foreground">
                  {activeRecord.patientName}
                </p>
                <p className="font-mono text-muted-foreground">
                  {activeRecord.patientNo}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Service
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold px-2 py-0.5 border ${MODULE_COLORS[activeRecord.module?.toLowerCase()] || ""}`}
                >
                  {MODULE_LABELS[activeRecord.module?.toLowerCase()] ||
                    activeRecord.module?.toUpperCase()}
                </Badge>
              </div>
              {activeRecord.phone && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {activeRecord.phone}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Ref. Doctor
                </p>
                <p className="font-semibold text-foreground">
                  {activeRecord.reportingDoctor || activeRecord.ref || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Ward / Bed
                </p>
                <p className="font-semibold text-foreground">
                  {activeRecord.wardBed || "OPD"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 ml-auto">
              <div className="flex gap-3 text-xs">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    Net
                  </p>
                  <p className="font-bold text-foreground text-base">
                    ₹{(activeRecord.net || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">
                    Paid
                  </p>
                  <p className="font-bold text-emerald-600 text-base">
                    ₹{(activeRecord.paid || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-rose-500 font-bold uppercase">
                    Due
                  </p>
                  <p className="font-bold text-rose-500 text-base">
                    ₹{(activeRecord.due || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <StatusBadge
                net={activeRecord.net || 0}
                paid={activeRecord.paid || 0}
              />
            </div>
          </div>
        )}

        {/* ── Detail Panels ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Procedural Items */}
          <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-foreground text-sm">
                  Procedural Items
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Scan/lab procedures linked to the selected record
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    setShowItemModal(true);
                  }}
                  disabled={!activeRecord}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold gap-1 rounded-lg disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" /> Add{" "}
                  <kbd className="hidden sm:inline text-[9px] opacity-70 font-mono">
                    E
                  </kbd>
                </Button>
                <Button
                  onClick={() => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    setShowItemModal(true);
                  }}
                  disabled={!activeRecord}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 border-border text-foreground hover:bg-muted/40 text-xs font-bold gap-1 rounded-lg disabled:opacity-40"
                >
                  <Edit className="w-3 h-3" /> Edit{" "}
                  <kbd className="hidden sm:inline text-[9px] opacity-70 font-mono">
                    K
                  </kbd>
                </Button>
                <Button
                  onClick={handleDeleteItem}
                  disabled={!activeRecord || selectedItemIdx === null}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold gap-1 rounded-lg disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" /> Delete{" "}
                  <kbd className="hidden sm:inline text-[9px] opacity-70 font-mono">
                    T
                  </kbd>
                </Button>
              </div>
            </div>
            <div
              className="overflow-auto flex-1"
              style={{ minHeight: "260px", maxHeight: "320px" }}
            >
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Procedure / Item Name</th>
                    <th className="px-4 py-2.5 text-right">Rate (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {!activeRecord || activeRecord.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="w-8 h-8 text-muted-foreground/30" />
                          <p className="text-xs font-medium">
                            No procedures linked
                          </p>
                          <p className="text-[10px]">
                            Select a record &amp; click Add to attach procedures
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeRecord.items.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedItemIdx(idx)}
                        className={`cursor-pointer transition-colors ${selectedItemIdx === idx ? "bg-teal-500/8 text-teal-700 dark:text-teal-400 font-semibold border-l-2 border-l-teal-500" : "hover:bg-muted/15"}`}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.item}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                          ₹{item.rate.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer totals */}
            {activeRecord && activeRecord.items.length > 0 && (
              <div className="border-t border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">
                  {activeRecord.items.length} item(s)
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Total:{" "}
                    <span className="text-foreground font-mono">
                      ₹{(activeRecord.total || 0).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-amber-600">
                    Disc:{" "}
                    <span className="font-mono">
                      ₹{(activeRecord.discount || 0).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-teal-600">
                    Net:{" "}
                    <span className="font-mono">
                      ₹{(activeRecord.net || 0).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Payment Receipts */}
          <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-foreground text-sm">
                  Payment Receipts Log
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Historical payment receipts for the selected entry
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    setShowPaymentModal(true);
                  }}
                  disabled={!activeRecord}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold gap-1 rounded-lg disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" /> Add{" "}
                  <kbd className="hidden sm:inline text-[9px] opacity-70 font-mono">
                    L
                  </kbd>
                </Button>
                <Button
                  onClick={handleDeletePayment}
                  disabled={!activeRecord || selectedPaymentIdx === null}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold gap-1 rounded-lg disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
                <Button
                  onClick={() => {
                    if (!activeRecord) {
                      toast.error("Select a record first.");
                      return;
                    }
                    toast.info("Receipt printed.");
                  }}
                  disabled={!activeRecord}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 border-border text-foreground hover:bg-muted/40 text-xs font-bold gap-1 rounded-lg disabled:opacity-40"
                >
                  <Printer className="w-3 h-3" /> Print
                </Button>
              </div>
            </div>
            <div
              className="overflow-auto flex-1"
              style={{ minHeight: "260px", maxHeight: "320px" }}
            >
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Receipt No</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5">Mode</th>
                    <th className="px-4 py-2.5">Cheque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {!activeRecord || activeRecord.payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <IndianRupee className="w-8 h-8 text-muted-foreground/30" />
                          <p className="text-xs font-medium">
                            No receipts logged yet
                          </p>
                          <p className="text-[10px]">
                            Click Add to record a payment
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeRecord.payments.map((p, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedPaymentIdx(idx)}
                        className={`cursor-pointer transition-colors ${selectedPaymentIdx === idx ? "bg-teal-500/8 font-semibold border-l-2 border-l-teal-500" : "hover:bg-muted/15"}`}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.date}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.time}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {p.recpNo}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          ₹{p.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1 w-fit ${PAYMENT_COLORS[p.type] || "border-border"}`}
                          >
                            {PAYMENT_ICONS[p.type] || null}
                            {p.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[80px]">
                          {p.cheque || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer totals */}
            {activeRecord && activeRecord.payments.length > 0 && (
              <div className="border-t border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">
                  {activeRecord.payments.length} receipt(s)
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600">
                    Collected:{" "}
                    <span className="font-mono">
                      ₹{(activeRecord.paid || 0).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-rose-500">
                    Due:{" "}
                    <span className="font-mono">
                      ₹{(activeRecord.due || 0).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Procedure Items
      ══════════════════════════════════════════════════════════════════════ */}
      {showItemModal && activeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                <span className="font-bold text-sm tracking-wide">
                  Add / Edit Procedure Items
                </span>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Record banner */}
              <div className="grid grid-cols-3 gap-4 bg-muted/20 border border-border/60 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground font-bold uppercase text-[10px] block tracking-wider">
                    Record No
                  </span>
                  <span className="font-mono font-bold text-teal-600 text-base">
                    {activeRecord.id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold uppercase text-[10px] block tracking-wider">
                    Patient
                  </span>
                  <span className="font-bold text-foreground text-base">
                    {activeRecord.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold uppercase text-[10px] block tracking-wider">
                    Service
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-2 py-0.5 border ${MODULE_COLORS[activeRecord.module?.toLowerCase()] || ""}`}
                  >
                    {MODULE_LABELS[activeRecord.module?.toLowerCase()] ||
                      activeRecord.module?.toUpperCase()}{" "}
                    PRICE LIST
                  </Badge>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search available procedures..."
                  className="h-9 pl-9 pr-4 w-full bg-background border border-input text-foreground rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Double list transfer */}
              <div className="grid grid-cols-9 gap-3">
                {/* Available */}
                <div className="col-span-4 border border-border/85 rounded-xl overflow-hidden flex flex-col bg-muted/10">
                  <div className="bg-muted p-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Available
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-background text-xs font-bold"
                    >
                      {
                        availableReports.filter((r) =>
                          r.item
                            .toLowerCase()
                            .includes(modalSearch.toLowerCase()),
                        ).length
                      }
                    </Badge>
                  </div>
                  <div className="overflow-y-auto h-[240px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Procedure</th>
                          <th className="px-3 py-2 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {availableReports
                          .filter((r) =>
                            r.item
                              .toLowerCase()
                              .includes(modalSearch.toLowerCase()),
                          )
                          .map((item, idx) => (
                            <tr
                              key={idx}
                              onClick={() => setSelectedAvailableIdx(idx)}
                              onDoubleClick={() => {
                                setSelectedReports([...selectedReports, item]);
                                setAvailableReports(
                                  availableReports.filter(
                                    (r) => r.item !== item.item,
                                  ),
                                );
                                setSelectedAvailableIdx(null);
                              }}
                              className={`cursor-pointer transition-colors ${selectedAvailableIdx === idx ? "bg-teal-500/15 font-bold text-teal-700 dark:text-teal-400" : "hover:bg-teal-500/5"}`}
                            >
                              <td className="px-3 py-2.5 font-medium">
                                {item.item}
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono font-semibold">
                                ₹{item.rate}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transfer buttons */}
                <div className="col-span-1 flex flex-col justify-center items-center gap-2.5">
                  {[
                    {
                      action: handleTransferToSelected,
                      icon: <ChevronRight className="w-5 h-5" />,
                      disabled: selectedAvailableIdx === null,
                    },
                    {
                      action: handleTransferToAvailable,
                      icon: <ChevronLeft className="w-5 h-5" />,
                      disabled: selectedSelectedIdx === null,
                    },
                    {
                      action: handleTransferAllToSelected,
                      icon: <ChevronsRight className="w-5 h-5" />,
                      disabled: availableReports.length === 0,
                    },
                    {
                      action: handleTransferAllToAvailable,
                      icon: <ChevronsLeft className="w-5 h-5" />,
                      disabled: selectedReports.length === 0,
                    },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={btn.action}
                      disabled={btn.disabled}
                      className="w-10 h-10 p-0 flex items-center justify-center border border-border rounded-lg shadow-sm hover:bg-teal-500 hover:text-white hover:border-teal-500 disabled:opacity-30 transition-all bg-background text-foreground"
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>

                {/* Selected */}
                <div className="col-span-4 border border-border/85 rounded-xl overflow-hidden flex flex-col bg-muted/10">
                  <div className="bg-muted p-2.5 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Selected
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-background text-xs font-bold"
                    >
                      {selectedReports.length}
                    </Badge>
                  </div>
                  <div className="overflow-y-auto h-[200px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Procedure</th>
                          <th className="px-3 py-2 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedReports.map((item, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedSelectedIdx(idx)}
                            onDoubleClick={() => {
                              setAvailableReports([...availableReports, item]);
                              setSelectedReports(
                                selectedReports.filter((_, i) => i !== idx),
                              );
                              setSelectedSelectedIdx(null);
                            }}
                            className={`cursor-pointer transition-colors ${selectedSelectedIdx === idx ? "bg-teal-500/15 font-bold text-teal-700 dark:text-teal-400" : "hover:bg-teal-500/5"}`}
                          >
                            <td className="px-3 py-2.5 font-medium">
                              {item.item}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold">
                              ₹{item.rate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-muted/30 p-2.5 border-t border-border flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">
                      Total selected:
                    </span>
                    <div className="bg-background border border-border rounded-lg px-3 py-1 font-mono text-teal-600 shadow-inner">
                      ₹{selectedReportsTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 px-5 py-3.5 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                onClick={handleSaveItems}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 gap-1.5 shadow-md rounded-lg"
              >
                Save <kbd className="text-[10px] opacity-75 font-mono">F10</kbd>
              </Button>
              <Button
                onClick={() => setShowItemModal(false)}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted font-bold h-9 rounded-lg"
              >
                Cancel{" "}
                <kbd className="text-[10px] opacity-75 font-mono">Esc</kbd>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Payment Receipt
      ══════════════════════════════════════════════════════════════════════ */}
      {showPaymentModal && activeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="bg-muted/20 px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-bold text-sm text-foreground font-display">
                  Record Payment Receipt
                </span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="hover:bg-muted p-1.5 rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Due amount */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Outstanding Due
                </span>
                <span className="font-mono text-xl font-black text-rose-500">
                  ₹{(activeRecord.due || 0).toLocaleString()}
                </span>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  value={payAmount || ""}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  placeholder="Enter payment amount"
                  autoFocus
                  className="h-11 px-4 w-full bg-background border border-input text-foreground rounded-xl font-mono text-base outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Payment mode chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Cash", "Card", "UPI", "Cheque"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayType(mode)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-bold transition-all ${
                        payType === mode
                          ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-400 shadow-sm"
                          : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <span className="w-6 h-6 flex items-center justify-center">
                        {mode === "Cash" ? (
                          <Banknote className="w-4 h-4" />
                        ) : mode === "Card" ? (
                          <CreditCard className="w-4 h-4" />
                        ) : mode === "UPI" ? (
                          <QrCode className="w-4 h-4" />
                        ) : (
                          <Receipt className="w-4 h-4" />
                        )}
                      </span>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {payType === "Cheque" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Cheque / Reference Details
                  </label>
                  <input
                    type="text"
                    value={payCheque}
                    onChange={(e) => setPayCheque(e.target.value)}
                    placeholder="Bank name, cheque number"
                    className="h-10 px-4 w-full bg-background border border-input text-foreground rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="bg-muted/20 px-5 py-3.5 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                onClick={handleSavePayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-5 rounded-lg shadow-md shadow-emerald-500/20"
              >
                Save Receipt
              </Button>
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="font-bold h-9 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Discount
      ══════════════════════════════════════════════════════════════════════ */}
      {showDiscountModal && activeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="bg-muted/20 px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-bold text-sm text-foreground font-display">
                  Discount Adjustment
                </span>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="hover:bg-muted p-1.5 rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Summary */}
              <div className="bg-muted/20 border border-border/60 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Total</span>
                  <span className="font-mono font-bold">
                    ₹{(activeRecord.total || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{(activeRecord.paid || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Discount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={discAmount || ""}
                  onChange={(e) => setDiscAmount(Number(e.target.value))}
                  placeholder="Enter discount"
                  autoFocus
                  className="h-11 px-4 w-full bg-background border border-input text-foreground rounded-xl font-mono text-base outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Live preview */}
              <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  Net Payable after discount
                </span>
                <span className="font-mono text-lg font-black text-teal-600">
                  ₹{discPreviewNet.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-muted/20 px-5 py-3.5 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                onClick={handleSaveDiscount}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 px-5 rounded-lg shadow-md shadow-amber-500/20"
              >
                Apply
              </Button>
              <Button
                onClick={() => setShowDiscountModal(false)}
                variant="outline"
                className="font-bold h-9 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CUSTOM DELETE CONFIRMATION MODALS
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteItemConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteItemConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-400" />
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/10">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground font-display">
                  Remove Procedure Item
                </h2>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove the selected procedure and
                  recalculate billing totals.
                </p>
              </div>
              <p className="text-xs text-red-500/80 font-medium">
                ⚠️ This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl font-semibold"
                  onClick={() => setDeleteItemConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-10 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
                  onClick={confirmDeleteItem}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletePaymentConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletePaymentConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-400" />
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/10">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground font-display">
                  Remove Payment Receipt
                </h2>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove the selected payment receipt and
                  recalculate the due amount.
                </p>
              </div>
              <p className="text-xs text-red-500/80 font-medium">
                ⚠️ This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl font-semibold"
                  onClick={() => setDeletePaymentConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-10 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
                  onClick={confirmDeletePayment}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import { getLocalDateString } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import type {
  BillItemRequest,
  BillResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  IndianRupee,
  Edit,
  FileText,
  Loader2,
  MessageSquare,
  Minus,
  Percent,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  CreditCard,
  Smartphone,
  QrCode,
  Banknote,
  CheckCircle2,
  ArrowLeft,
  Lock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type TabType = "OPD" | "IPD" | "SERVICE";

const today = getLocalDateString();

const IPD_PACKAGES = [
  { name: "Children Ward", price: 300 },
  { name: "General Ward", price: 850 },
  { name: "Gynaec Charges", price: 2750 },
  { name: "ICU Package", price: 3650 },
  { name: "Normal Delivery", price: 2750 },
  { name: "Semi Special Room", price: 850 },
  { name: "Special Room", price: 2000 },
];

const SERVICE_CATALOG = [
  { name: "Chest Xray PA", price: 1500, category: "Radiology" },
  { name: "Chest Xray AP", price: 1500, category: "Radiology" },
  { name: "Abdomen Xray", price: 1200, category: "Radiology" },
  { name: "Blood Test CBC", price: 500, category: "Lab" },
  { name: "Urine Analysis", price: 300, category: "Lab" },
  { name: "ECG", price: 400, category: "Cardiology" },
];

// ── Add Bill Dialog ───────────────────────────────────────────────────────────
function AddBillDialog({
  billType,
  hospitalCode,
  onCreated,
}: {
  billType: TabType;
  hospitalCode: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patSearch, setPatSearch] = useState("");
  const [selectedPat, setSelectedPat] = useState<PatientResponse | null>(null);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [items, setItems] = useState<BillItemRequest[]>([
    { itemName: "", rate: 0, qty: 1 },
  ]);
  const [discount, setDiscount] = useState<number | string>("");
  const [paidAmount, setPaidAmount] = useState<number | string>("");
  const [billDate, setBillDate] = useState(today);
  const [showSugg, setShowSugg] = useState(false);
  const [showOPDSugg, setShowOPDSugg] = useState(false);

  // Fetch patients from API whenever dialog opens
  useEffect(() => {
    if (!open) return;
    setPatientsLoading(true);
    receptionApi
      .getPatients(hospitalCode)
      .then((list) => {
        setPatients(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        toast.error("Failed to load patient list");
        setPatients([]);
      })
      .finally(() => setPatientsLoading(false));
  }, [open, hospitalCode]);

  // Prefill from booked appointment redirect
  useEffect(() => {
    const rawPrefill = sessionStorage.getItem("billing-prefill-appt");
    if (!rawPrefill) return;

    try {
      const data = JSON.parse(rawPrefill);
      
      // Prevent other dialog instances from intercepting if billType is specified
      if (data.billType && data.billType !== billType) {
        return;
      }
      
      // If not open yet, open it and set the items
      if (!open) {
        setOpen(true);
        setPatSearch(data.patientName || "");
        if (billType === "OPD") {
          setItems([
            {
              itemName: `Consultation - ${data.doctorName || "Doctor"}`,
              rate: Number(data.consultationFee) || 0,
              qty: 1,
              category: "Consultation"
            }
          ]);
        } else {
          setItems([
            {
              itemName: "General Admission Charges",
              rate: Number(data.consultationFee) || 0,
              qty: 1,
              category: "IPD"
            }
          ]);
        }
        return; // wait for next tick with open=true to load patients
      }

      // If open is true and patients are loaded, try to find patientNo
      if (open && !patientsLoading && patients.length > 0) {
        const found = patients.find(
          (p) => p.patientNo.toLowerCase() === data.patientNo?.toLowerCase()
        );
        if (found) {
          setSelectedPat(found);
          setPatSearch(found.name);
        }
        sessionStorage.removeItem("billing-prefill-appt");
      } else if (open && !patientsLoading && patients.length === 0) {
        // If loaded but empty
        sessionStorage.removeItem("billing-prefill-appt");
      }
    } catch (err) {
      console.warn("Failed to parse billing prefill", err);
      sessionStorage.removeItem("billing-prefill-appt");
    }
  }, [open, patients, patientsLoading, billType]);

  const filteredPats = patients.filter((p) => {
    if (patSearch.length === 0) return false;
    const q = patSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientNo.toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q) ||
      (p.alternativeNum ?? "").toLowerCase().includes(q)
    );
  });

  const filteredOPDPats = patients.filter((p) => {
    if (!patSearch.trim()) return true;
    const q = patSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientNo.toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q) ||
      (p.alternativeNum ?? "").toLowerCase().includes(q)
    );
  });

  const totalAmount = items.reduce((s, i) => s + i.rate * i.qty, 0);
  const netAmount = Math.max(0, totalAmount - (Number(discount) || 0));
  const dueAmount = Math.max(0, netAmount - (Number(paidAmount) || 0));

  function addItem() {
    setItems([...items, { itemName: "", rate: 0, qty: 1 }]);
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, key: keyof BillItemRequest, value: any) {
    setItems(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  }
  function addCatalogItem(name: string, price: number, category: string) {
    setItems([...items, { itemName: name, rate: price, qty: 1, category }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalPatientNo = "";
    let finalPatientName = "";

    if (billType === "OPD") {
      if (!patSearch.trim()) {
        return toast.error("Patient name is required");
      }
      finalPatientName = patSearch.trim();
      // Try to find an existing patient with this name
      const existing = patients.find(
        (p) => p.name.toLowerCase() === finalPatientName.toLowerCase(),
      );
      if (existing) {
        finalPatientNo = existing.patientNo;
      } else {
        finalPatientNo = `OPD-${Date.now().toString().slice(-6)}`;
      }
    } else {
      if (!selectedPat) return toast.error("Select a patient first");
      finalPatientNo = selectedPat.patientNo;
      finalPatientName = selectedPat.name;
    }

    // Strip out completely blank placeholder rows (no name + zero rate)
    const validItems = items.filter(
      (i) => i.itemName.trim() !== "" || i.rate > 0,
    );

    if (validItems.length === 0)
      return toast.error("Add at least one bill item");
    if (validItems.some((i) => !i.itemName.trim() || i.rate <= 0))
      return toast.error("Fill all bill items with a name and valid rate");

    setSubmitting(true);
    try {
      await receptionApi.createBill(
        {
          billType,
          billDate,
          patientNo: finalPatientNo,
          patientName: finalPatientName,
          discount: Number(discount) || 0,
          paidAmount: Number(paidAmount) || 0,
          billItems: validItems,
        },
        hospitalCode,
      );
      toast.success(`${billType} bill created successfully!`);
      setOpen(false);
      setSelectedPat(null);
      setPatSearch("");
      setItems([{ itemName: "", rate: 0, qty: 1 }]);
      setDiscount("");
      setPaidAmount("");
      onCreated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={`h-8 px-3 text-xs gap-1.5 ${
            billType === "OPD"
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : billType === "IPD"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Add {billType} Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-500" />
            Create {billType} Bill
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Patient + Date */}
          <div className="grid grid-cols-2 gap-4">
            {billType === "OPD" ? (
              <div className="relative">
                <Label className="text-xs font-semibold">
                  Patient Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="Search or enter patient name…"
                    value={patSearch}
                    className="h-8 text-xs pr-8"
                    onChange={(e) => {
                      setPatSearch(e.target.value);
                      if (selectedPat && selectedPat.name !== e.target.value) {
                        setSelectedPat(null);
                      }
                      setShowOPDSugg(true);
                    }}
                    onFocus={() => setShowOPDSugg(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowOPDSugg(false);
                      }, 200);
                    }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOPDSugg(!showOPDSugg)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                {showOPDSugg && !patientsLoading && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredOPDPats.length > 0 ? (
                      filteredOPDPats.map((p) => (
                        <button
                          key={p.patientNo}
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted/30 flex justify-between items-center gap-2"
                          onClick={() => {
                            setSelectedPat(p);
                            setPatSearch(p.name);
                            setShowOPDSugg(false);
                          }}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate text-foreground">{p.name}</span>
                            {(p.phone || p.alternativeNum) && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                📞 {p.phone || p.alternativeNum}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono shrink-0 text-muted-foreground">
                            {p.patientNo}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                        No matches found. Press submit to register &ldquo;{patSearch}&rdquo; as a custom patient.
                      </div>
                    )}
                  </div>
                )}
                {selectedPat ? (
                  <p className="text-[10px] mt-1 text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Registered Patient: {selectedPat.patientNo} — {selectedPat.name}
                  </p>
                ) : (
                  patSearch.trim() && (
                    <p className="text-[10px] mt-1 text-amber-600 font-semibold flex items-center gap-1">
                      💡 Custom Patient: Will generate temporary OPD ID
                    </p>
                  )
                )}
              </div>
            ) : (
              <div className="relative">
                <Label className="text-xs font-semibold">
                  Patient <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder={
                      patientsLoading
                        ? "Loading patients…"
                        : "Search by name or patient no…"
                    }
                    value={patSearch}
                    className="pl-8 h-8 text-xs"
                    disabled={patientsLoading}
                    onChange={(e) => {
                      setPatSearch(e.target.value);
                      setSelectedPat(null);
                      setShowSugg(true);
                    }}
                    onFocus={() => setShowSugg(true)}
                    autoComplete="off"
                  />
                  {patientsLoading && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                  )}
                </div>
                {showSugg && !patientsLoading && patSearch.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPats.length > 0 ? (
                      filteredPats.map((p) => (
                        <button
                          key={p.patientNo}
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted/30 flex justify-between items-center gap-2"
                          onClick={() => {
                            setSelectedPat(p);
                            setPatSearch(p.name);
                            setShowSugg(false);
                          }}
                        >
                          <span className="font-medium truncate">{p.name}</span>
                          <span className="text-muted-foreground font-mono shrink-0">
                            {p.patientNo}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                        No patients found for &ldquo;{patSearch}&rdquo;
                      </div>
                    )}
                  </div>
                )}
                {selectedPat && (
                  <p className="text-[10px] mt-1 text-emerald-600 font-semibold">
                    ✓ {selectedPat.patientNo} — {selectedPat.name}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Bill Date</Label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          {/* Service catalog (for SERVICE & IPD) */}
          {(billType === "SERVICE" || billType === "IPD") && (
            <div>
              <Label className="text-xs font-semibold mb-1 block">
                {billType === "IPD" ? "Package / Catalog" : "Service Catalog"}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(billType === "IPD"
                  ? IPD_PACKAGES.map((p) => ({
                      name: p.name,
                      price: p.price,
                      category: "IPD",
                    }))
                  : SERVICE_CATALOG
                ).map((svc) => (
                  <button
                    key={svc.name}
                    type="button"
                    onClick={() =>
                      addCatalogItem(svc.name, svc.price, svc.category)
                    }
                    className="text-[10px] px-2 py-1 rounded border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {svc.name} — ₹{svc.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bill items table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-semibold">Bill Items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 gap-1"
                onClick={addItem}
              >
                <Plus className="w-3 h-3" /> Add Row
              </Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">
                      Item Name
                    </th>
                    <th className="px-2 py-1.5 text-right font-semibold w-20">
                      Rate (₹)
                    </th>
                    <th className="px-2 py-1.5 text-right font-semibold w-16">
                      Qty
                    </th>
                    <th className="px-2 py-1.5 text-right font-semibold w-20">
                      Total
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1">
                        <Input
                          value={item.itemName}
                          onChange={(e) =>
                            updateItem(idx, "itemName", e.target.value)
                          }
                          placeholder="Item name"
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) =>
                            updateItem(idx, "rate", Number(e.target.value))
                          }
                          className="h-7 text-xs text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(idx, "qty", Number(e.target.value))
                          }
                          className="h-7 text-xs text-right"
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-mono font-semibold">
                        ₹{(item.rate * item.qty).toLocaleString()}
                      </td>
                      <td className="px-1">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary + Payment */}
          <div className="grid grid-cols-3 gap-3 bg-muted/20 border border-border rounded-lg p-3">
            <div>
              <Label className="text-[10px] font-semibold">Total Amount</Label>
              <p className="font-bold text-sm mt-0.5">
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-xs">Discount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="h-7 text-xs mt-0.5"
              />
            </div>
            <div>
              <Label className="text-xs">Paid Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="h-7 text-xs mt-0.5"
              />
            </div>
            <div className="col-span-3 flex justify-between items-center pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Net:{" "}
                <b className="text-foreground">₹{netAmount.toLocaleString()}</b>
              </span>
              <span
                className={`text-xs font-semibold ${dueAmount > 0 ? "text-rose-500" : "text-emerald-500"}`}
              >
                Due: ₹{dueAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[100px]"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Create Bill"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Bill Row ──────────────────────────────────────────────────────────────────
function BillStatusBadge({ bill }: { bill: BillResponse }) {
  const isPaid = bill.dueAmount === 0;
  const isPartial = bill.paidAmount > 0 && bill.dueAmount > 0;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full transition-all duration-300 ${
        isPaid
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.06)]"
          : isPartial
            ? "bg-amber-500/10 text-amber-600 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.06)]"
            : "bg-rose-500/10 text-rose-600 border-rose-500/35 shadow-[0_0_8px_rgba(244,63,94,0.06)]"
      }`}
    >
      {isPaid ? "Paid" : isPartial ? "Partial" : "Pending"}
    </Badge>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Billing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const code = user?.hospitalCode || "HSP001";
  const role = user?.role;

  // Receptionists can access OPD billing via /receptionist/opd-billing
  const isReceptionistOPD =
    role === "receptionist" && currentPath === "/receptionist/opd-billing";

  const defaultTab: TabType =
    isReceptionistOPD
      ? "OPD"
      : role === "receptionist"
        ? "IPD"
        : role === "pharmacist"
          ? "OPD"
          : role === "lab_technician"
            ? "SERVICE"
            : "OPD";

  const [activeTabState, setActiveTabState] = useState<TabType>(defaultTab);

  // Only admin can switch tabs freely; receptionists are locked to their designated tab
  const activeTab = role === "admin" ? activeTabState : defaultTab;
  const setActiveTab = (tab: TabType) => {
    if (role === "admin") {
      setActiveTabState(tab);
    }
  };

  useEffect(() => {
    setActiveTabState(defaultTab);
  }, [role, defaultTab]);

  const isAuthorized =
    role === "admin" ||
    role === "receptionist" ||
    role === "pharmacist" ||
    role === "lab_technician";

  const pageTitle =
    role === "admin"
      ? "Billing Overview"
      : isReceptionistOPD
        ? "OPD Billing"
        : role === "receptionist"
          ? "IPD Billing"
          : role === "pharmacist"
            ? "OPD Billing"
            : role === "lab_technician"
              ? "Service List"
              : "Financials & Billing";

  const pageDesc =
    role === "admin"
      ? "View-Only Financials & Billing Matrix"
      : isReceptionistOPD
        ? "Manage Out-Patient Department Billing"
        : role === "receptionist"
          ? "Manage In-Patient Department Billing"
          : role === "pharmacist"
            ? "Manage Out-Patient Department Billing"
            : role === "lab_technician"
              ? "Manage Diagnostics & Lab Services Catalog"
              : "OPD, IPD, and Service Billing";

  if (!role || !isAuthorized) {
    return (
      <div
        className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-4"
        data-ocid="billing.unauthorized"
      >
        <div className="max-w-md w-full glass-elevated border border-border rounded-2xl p-8 shadow-glass-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-destructive/5 rounded-full blur-2xl"></div>
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6 relative">
            <ShieldAlert className="w-8 h-8 text-destructive animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You do not have the required permissions to view the billing and
            financials module. Please contact your system administrator if you
            believe this is an error.
          </p>
          <Button
            onClick={() => navigate({ to: "/" })}
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-xl shadow-glass-sm py-2 h-10 transition-all duration-300"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payingBill, setPayingBill] = useState<BillResponse | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paymentStep, setPaymentStep] = useState<"AMOUNT" | "METHOD" | "CASH" | "UPI" | "CARD" | "PROCESSING" | "SUCCESS">("AMOUNT");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [chosenMethod, setChosenMethod] = useState("");
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, fromDate, toDate, search]);

  // Selection & action state
  const [selectedBill, setSelectedBill] = useState<BillResponse | null>(null);
  const [editingBill, setEditingBill] = useState<BillResponse | null>(null);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editPaid, setEditPaid] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editItems, setEditItems] = useState<BillItemRequest[]>([]);
  const [deletingBill, setDeletingBill] = useState<BillResponse | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [previewBill, setPreviewBill] = useState<BillResponse | null>(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "SERVICE") {
        // Concurrent requests: fetch lab records and reception service bills
        const [labRes, recList] = await Promise.all([
          apiFetch<any[]>("/lab/records", {
            headers: { "X-Hospital-Code": code },
          }).catch((err) => {
            console.error("Failed to fetch lab records:", err);
            return [];
          }),
          receptionApi.getBills(code, "SERVICE", fromDate, toDate).catch((err) => {
            console.error("Failed to fetch reception service bills:", err);
            return [];
          }),
        ]);

        const labRecords = Array.isArray(labRes) ? labRes : (labRes as any)?.content || [];
        const recBills = Array.isArray(recList) ? recList : [];

        // Apply date filtering to lab records
        let filteredLab = [...labRecords];
        if (fromDate) {
          filteredLab = filteredLab.filter(
            (r: any) => r.date && r.date.substring(0, 10) >= fromDate,
          );
        }
        if (toDate) {
          filteredLab = filteredLab.filter(
            (r: any) => r.date && r.date.substring(0, 10) <= toDate,
          );
        }

        // Map lab DiagnosticRecord to BillResponse
        const mappedLab: BillResponse[] = filteredLab.map((r: any) => ({
          id: r.id, // Can be string or number
          billType: "SERVICE",
          billDate: r.date ? r.date.substring(0, 10) : "",
          patientNo: r.patientNo,
          patientName: r.patientName,
          billNumber: r.id,
          totalAmount: r.total || 0,
          discount: r.discount || 0,
          netAmount: r.net || 0,
          paidAmount: r.paid || 0,
          dueAmount: r.due || 0,
          billPrinted: r.billPrint === "Yes" ? "Y" : "N",
          billed: true,
          paymentMode:
            r.payments && r.payments.length > 0
              ? r.payments[0].type.toUpperCase()
              : undefined,
          hospitalCode: code,
          billItems: (r.items || []).map((it: any, index: number) => ({
            id: it.id || index,
            itemName: it.item,
            rate: it.rate,
            qty: 1,
            total: it.rate,
            category: r.module,
          })),
          createdAt: r.date,
          updatedAt: r.date,
        }));

        // Combine both sources and sort descending by billDate
        const combined = [...mappedLab, ...recBills].sort((a, b) => {
          return new Date(b.billDate).getTime() - new Date(a.billDate).getTime();
        });

        setBills(combined);
      } else {
        const list = await receptionApi.getBills(
          code,
          activeTab,
          fromDate,
          toDate,
        );
        setBills(Array.isArray(list) ? list : []);
      }
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, [code, activeTab, fromDate, toDate]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  useEffect(() => {
    const fetchHospitalDetails = async () => {
      try {
        const info = await apiFetch<any>(`/super-admin/hospitals/code/${code}`);
        if (info) {
          setHospitalInfo(info);
        }
      } catch (err) {
        console.warn("Could not retrieve hospital details:", err);
      }
    };
    fetchHospitalDetails();
  }, [code]);

  useEffect(() => {
    receptionApi
      .getPatients(code)
      .then((list) => {
        setPatients(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [code]);

  const patientPhoneMap = new Map<string, string>();
  patients.forEach((p) => {
    if (p.patientNo) {
      const phoneNum = p.phone || p.mobile || "";
      if (phoneNum) {
        patientPhoneMap.set(p.patientNo, phoneNum);
      }
    }
  });

  const filteredBills = bills.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const phone = patientPhoneMap.get(b.patientNo) || "";
    return (
      b.patientName.toLowerCase().includes(q) ||
      b.patientNo.toLowerCase().includes(q) ||
      b.billNumber.toLowerCase().includes(q) ||
      phone.includes(q)
    );
  });

  function handlePayment() {
    if (!payingBill || !payAmount) return;
    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0 || amt > payingBill.dueAmount) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    setPaymentStep("METHOD");
  }

  async function executePaymentRegistration(method: string) {
    if (!payingBill || !payAmount) return;
    setChosenMethod(method);
    setPaymentStep("PROCESSING");

    // Simulate gateway processing for 2 seconds
    setTimeout(async () => {
      try {
        const updatedBill = await receptionApi.updateBillPayment(
          payingBill.billNumber,
          Number(payAmount),
          code,
          method,
        );
        setTransactionId("TXN-" + Math.floor(10000000 + Math.random() * 90000000));
        setPaymentStep("SUCCESS");
        toast.success("Payment authorized successfully!");
        // Immediately patch the local bills list so the MODE column updates right away
        setBills((prev) =>
          prev.map((b) =>
            b.id === updatedBill.id
              ? { ...b, paymentMode: updatedBill.paymentMode, paidAmount: updatedBill.paidAmount, dueAmount: updatedBill.dueAmount }
              : b,
          ),
        );
        // Also refresh selectedBill if it's the same record
        setSelectedBill((prev) =>
          prev?.id === updatedBill.id ? { ...prev, paymentMode: updatedBill.paymentMode, paidAmount: updatedBill.paidAmount, dueAmount: updatedBill.dueAmount } : prev,
        );
        loadBills();
      } catch (err: any) {
        toast.error(err?.message || "Payment processing failed");
        setPaymentStep("METHOD");
      }
    }, 2000);
  }

  function openEdit(bill: BillResponse) {
    setEditingBill(bill);
    setEditDiscount(bill.discount ?? 0);
    setEditPaid(bill.paidAmount ?? 0);
    setEditItems(
      (bill.billItems || []).map((it) => ({
        itemName: it.itemName,
        rate: it.rate,
        qty: it.qty,
        category: it.category || "General",
      }))
    );
  }

  function updateEditItem(idx: number, field: keyof BillItemRequest, val: any) {
    const updated = [...editItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditItems(updated);
  }

  function removeEditItem(idx: number) {
    setEditItems(editItems.filter((_, i) => i !== idx));
  }

  function addEditItem() {
    setEditItems([
      ...editItems,
      { itemName: "", rate: 0, qty: 1, category: "General" },
    ]);
  }

  const editTotalAmount = editItems.reduce(
    (acc, it) => acc + Number(it.rate) * Number(it.qty),
    0
  );
  const editNetAmount = Math.max(0, editTotalAmount - editDiscount);

  async function handleEditSave() {
    if (!editingBill) return;
    if (editItems.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }
    setEditSubmitting(true);
    try {
      await receptionApi.updateBill(
        editingBill.billNumber,
        {
          billType: editingBill.billType,
          billDate: editingBill.billDate,
          patientNo: editingBill.patientNo,
          patientName: editingBill.patientName,
          discount: editDiscount,
          paidAmount: editingBill.paidAmount,
          billPrinted: editingBill.billPrinted,
          billed: editingBill.billed,
          billItems: editItems,
        },
        code,
      );
      toast.success("Bill updated successfully!");
      setEditingBill(null);
      setSelectedBill(null);
      loadBills();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update bill");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingBill) return;
    setDeleteSubmitting(true);
    try {
      await receptionApi.deleteBill(deletingBill.billNumber, code);
      toast.success(`Bill ${deletingBill.billNumber} deleted successfully.`);
      setDeletingBill(null);
      setSelectedBill(null);
      loadBills();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete bill");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function handlePrint(bill: BillResponse) {
    const items = bill.billItems ?? [];

    // Fetch patient details to get referredBy doctor and resolve full name from admin-service
    let referredBy = "Self";
    try {
      const patient = await receptionApi.getPatient(bill.patientNo, code);
      if (patient && patient.referredBy) {
        referredBy = patient.referredBy;
        
        // Resolve doctor full name
        try {
          const docs = await apiFetch<any>("/admin/doctors", {
            params: { page: 0, size: 1000 },
            headers: { "X-Hospital-Code": code },
          });
          const docsList = Array.isArray(docs) ? docs : docs.content || [];
          const match = docsList.find((d: any) => {
            const docFullName = `Dr. ${d.firstName} ${d.lastName || ""}`.trim().toLowerCase();
            const refLower = referredBy.toLowerCase();
            return docFullName.includes(refLower) || refLower.includes(d.firstName.toLowerCase()) || refLower.includes(d.lastName?.toLowerCase() || "_none_");
          });
          if (match) {
            referredBy = `Dr. ${match.firstName} ${match.lastName || ""}`.trim();
          }
        } catch (e) {
          console.warn("Could not resolve referredBy doctor full name", e);
        }
      }
    } catch (err) {
      console.warn("Could not retrieve patient referredBy details:", err);
    }

    // Parse hospital name from code
    let fallbackHospitalName = "Apollo Hospital Bangalore";
    if (code.toLowerCase() === "hsp001")
      fallbackHospitalName = "Apollo Hospital Bangalore";
    else if (code.toLowerCase() === "hsp002")
      fallbackHospitalName = "Skyllx Hospital";
    else if (code.toLowerCase().includes("mar"))
      fallbackHospitalName = "Margadarsi Hospital";

    let hospitalName =
      hospitalInfo?.hospitalName || hospitalInfo?.name || fallbackHospitalName;

    if (hospitalName === "Charlie General Hospital") {
      hospitalName = "Apollo Hospital Bangalore";
    }

    const hospitalPhone = hospitalInfo?.phone || "+91 9292929292";
    const hospitalEmail =
      hospitalInfo?.email || `support@${code.toLowerCase()}.com`;
    const hospitalAddress =
      hospitalInfo?.address || "123 Healthcare Ave, Medical District";

    const isPaid = bill.dueAmount === 0;
    const isPartial = bill.paidAmount > 0 && bill.dueAmount > 0;
    const statusText = isPaid ? "PAID" : isPartial ? "PARTIAL" : "PENDING";
    const statusClass = isPaid ? "paid" : isPartial ? "partial" : "pending";

    const html = `
      <html>
      <head>
        <title>Invoice - ${bill.billNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            font-size: 13px; 
            line-height: 1.5;
            padding: 32px; 
            color: #1f2937; 
            background: #fff;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .hospital-info h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: -0.5px;
          }
          .hospital-info p {
            margin: 3px 0 0;
            color: #4b5563;
            font-size: 11px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.3px;
          }
          .invoice-title .status {
            display: inline-block;
            margin-top: 6px;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .status.paid { background: #d1fae5; color: #065f46; }
          .status.partial { background: #fef3c7; color: #92400e; }
          .status.pending { background: #fee2e2; color: #991b1b; }
          
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
            background: #f9fafb;
            border: 1px solid #f3f4f6;
            border-radius: 12px;
            padding: 16px;
          }
          .meta-block h4 {
            margin: 0 0 6px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
          }
          .meta-block p {
            margin: 0;
            font-size: 13px;
            color: #1f2937;
          }
          .meta-block .value {
            font-weight: 600;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 12px; 
          }
          th { 
            background: #f3f4f6; 
            color: #374151;
            padding: 10px 14px; 
            text-align: left; 
            font-size: 11px; 
            font-weight: 600;
            text-transform: uppercase; 
            letter-spacing: 0.5px;
          }
          td { 
            padding: 12px 14px; 
            border-bottom: 1px solid #f3f4f6; 
            color: #4b5563;
          }
          .right { text-align: right; }
          .font-mono { font-family: monospace; }
          
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
          }
          .summary-table {
            width: 300px;
          }
          .summary-table td {
            padding: 6px 10px;
            border: none;
          }
          .summary-table tr.total-row td {
            border-top: 2px solid #f3f4f6;
            padding-top: 10px;
            font-weight: 700;
            color: #111827;
            font-size: 15px;
          }
          
          .footer {
            margin-top: 60px;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
          }
          @media print { 
            body { padding: 0; } 
            .meta-grid { background: #fff !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <h1>${hospitalName}</h1>
            <p>Hospital Code: <b>${code}</b> &nbsp;|&nbsp; Tel: ${hospitalPhone}</p>
            <p>Email: ${hospitalEmail} &nbsp;|&nbsp; Address: ${hospitalAddress}</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <span class="status ${statusClass}">${statusText}</span>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-block">
            <h4>Patient Information</h4>
            <p><span class="value">${bill.patientName}</span></p>
            <p>Patient ID: <span class="value font-mono">${bill.patientNo}</span></p>
            <p>Referred By: <span class="value">${referredBy}</span></p>
          </div>
          <div class="meta-block" style="text-align: right;">
            <h4>Invoice details</h4>
            <p>Invoice No: <span class="value font-mono">${bill.billNumber}</span></p>
            <p>Date: <span class="value">${bill.billDate}</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Item / Service</th>
              <th class="right" style="width: 100px;">Rate (₹)</th>
              <th class="right" style="width: 80px;">Qty</th>
              <th class="right" style="width: 120px;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: 500; color: #111827;">${it.itemName}</td>
                <td class="right font-mono">₹${it.rate?.toLocaleString()}</td>
                <td class="right font-mono">${it.qty}</td>
                <td class="right font-mono" style="font-weight: 600; color: #111827;">₹${it.total?.toLocaleString()}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="right font-mono">₹${bill.totalAmount?.toLocaleString()}</td>
            </tr>
            ${
              bill.discount > 0
                ? `
              <tr style="color: #0d9488;">
                <td>Discount:</td>
                <td class="right font-mono">-₹${bill.discount?.toLocaleString()}</td>
              </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td>Net Amount:</td>
              <td class="right font-mono">₹${bill.netAmount?.toLocaleString()}</td>
            </tr>
            <tr style="color: #059669; font-weight: 500;">
              <td>Paid:</td>
              <td class="right font-mono">₹${bill.paidAmount?.toLocaleString()}</td>
            </tr>
            ${
              bill.dueAmount > 0
                ? `
              <tr style="color: #e11d48; font-weight: 600;">
                <td>Outstanding Due:</td>
                <td class="right font-mono">₹${bill.dueAmount?.toLocaleString()}</td>
              </tr>
            `
                : ""
            }
          </table>
        </div>

        <div class="footer">
          <p>Thank you for choosing ${hospitalName}. Wishing you a speedy recovery!</p>
          <p style="margin-top: 4px; font-size: 10px;">This is a computer-generated invoice receipt and does not require a physical signature.</p>
        </div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (!win) return toast.error("Pop-up blocked — allow pop-ups to print");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const ActionBtn = ({
    icon: Icon,
    label,
    letter,
    variant = "outline",
    onClick,
    disabled = false,
  }: any) => (
    <Button
      variant={variant}
      size="sm"
      disabled={disabled}
      className="h-8 px-2 text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/5 hover:text-primary transition-all duration-200"
      onClick={onClick}
    >
      {letter && (
        <span className="text-muted-foreground/70 font-mono hidden xl:inline-block">
          {letter}
        </span>
      )}
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline-block">{label}</span>
    </Button>
  );

  const totalRevenue = bills.reduce((sum, b) => sum + (b.netAmount || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalDue = bills.reduce((sum, b) => sum + (b.dueAmount || 0), 0);
  const totalDiscount = bills.reduce((sum, b) => sum + (b.discount || 0), 0);

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="billing.page"
    >
      {/* Header */}
      <div className="flex-none space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <IndianRupee className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-sm text-muted-foreground">{pageDesc}</p>
          </div>
        </div>
      </div>

      {/* Financial Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-none">
        {/* Card 1: Total Revenue */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/45 backdrop-blur-sm p-4 hover:border-emerald-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-foreground font-mono">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">Net billed</span>{" "}
              amount in this period
            </p>
          </div>
        </div>

        {/* Card 2: Collections (Paid) */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/45 backdrop-blur-sm p-4 hover:border-blue-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Collections
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <IndianRupee className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-foreground font-mono">
              ₹{totalPaid.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-blue-500 font-semibold">
                Total received
              </span>{" "}
              cash payments
            </p>
          </div>
        </div>

        {/* Card 3: Outstanding (Due) */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/45 backdrop-blur-sm p-4 hover:border-rose-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all duration-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform duration-300">
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-foreground font-mono text-rose-500">
              ₹{totalDue.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-rose-500 font-semibold">
                Uncollected balance
              </span>{" "}
              from ledger
            </p>
          </div>
        </div>

        {/* Card 4: Discounts Given */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/45 backdrop-blur-sm p-4 hover:border-amber-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Discounts Given
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
              <Percent className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-foreground font-mono">
              ₹{totalDiscount.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-amber-500 font-semibold">
                Total reductions
              </span>{" "}
              approved
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabType)}
        className="flex-1 flex flex-col min-h-0"
      >
        {role === "admin" && (
          <TabsList className="grid w-[500px] grid-cols-3 bg-muted/40 p-1 rounded-xl border border-border/80 shadow-glass-inner h-10">
            <TabsTrigger
              value="OPD"
              className="rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-glass-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs"
            >
              <Receipt className="w-3.5 h-3.5 mr-2 text-emerald-500" /> OPD
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="IPD"
              className="rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-glass-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs"
            >
              <FileText className="w-3.5 h-3.5 mr-2 text-blue-500" /> IPD
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="SERVICE"
              className="rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-glass-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs"
            >
              <Activity className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Service
              List
            </TabsTrigger>
          </TabsList>
        )}

        {(role === "admin"
          ? (["OPD", "IPD", "SERVICE"] as TabType[])
          : [activeTab]
        ).map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="flex-1 flex flex-col min-h-0 mt-4 outline-none data-[state=inactive]:hidden"
          >
            {/* Toolbar */}
            <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-1.5 shadow-glass-sm border border-border items-center justify-between mb-4">
              <div className="flex flex-wrap gap-1.5">
                {role !== "admin" && (
                  <>
                    <AddBillDialog
                      billType={tab}
                      hospitalCode={code}
                      onCreated={() => {
                        loadBills();
                        setSelectedBill(null);
                      }}
                    />
                    <ActionBtn
                      letter="2"
                      icon={Edit}
                      label="Edit"
                      disabled={!selectedBill || (selectedBill.paidAmount ?? 0) > 0}
                      onClick={() =>
                        selectedBill
                          ? openEdit(selectedBill)
                          : toast.info("Click a bill row first")
                      }
                    />
                    <ActionBtn
                      letter="3"
                      icon={Trash2}
                      label="Delete"
                      disabled={!selectedBill || (selectedBill.paidAmount ?? 0) > 0}
                      onClick={() =>
                        selectedBill
                          ? setDeletingBill(selectedBill)
                          : toast.info("Click a bill row first")
                      }
                    />
                  </>
                )}
                <ActionBtn
                  letter="4"
                  icon={Printer}
                  label="Print Bill"
                  disabled={!selectedBill}
                  onClick={() =>
                    selectedBill
                      ? handlePrint(selectedBill)
                      : toast.info("Click a bill row first")
                  }
                />
                <ActionBtn
                  letter="5"
                  icon={Search}
                  label="Preview Bill"
                  disabled={!selectedBill}
                  onClick={() =>
                    selectedBill
                      ? setPreviewBill(selectedBill)
                      : toast.info("Click a bill row first")
                  }
                />
                <ActionBtn
                  letter="8"
                  icon={MessageSquare}
                  label="WhatsApp"
                  onClick={() => toast.info("WhatsApp")}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm flex flex-col min-w-0">
              <div className="p-3 border-b border-border bg-muted/20 flex flex-wrap gap-4 items-end">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs">From Date</Label>
                  <DateTimePicker
                    type="date"
                    value={fromDate}
                    onChange={setFromDate}
                    className="h-8 text-xs w-[150px]"
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-xs">To Date</Label>
                  <DateTimePicker
                    type="date"
                    value={toDate}
                    onChange={setToDate}
                    className="h-8 text-xs w-[150px]"
                  />
                </div>
                <div className="space-y-1 flex flex-col w-[220px]">
                  <Label className="text-xs font-semibold">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search name, bill no, phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>
                <Button
                  className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3.5 border-0 shadow-xs cursor-pointer transition-all self-end"
                  onClick={() => {
                    loadBills();
                    toast.success("Filters applied successfully");
                  }}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-4 text-xs gap-1.5"
                  onClick={loadBills}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <span className="text-xs text-muted-foreground self-end pb-1">
                  {filteredBills.length} record{filteredBills.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto relative">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs font-medium tracking-wide">
                      Loading billing ledger...
                    </span>
                  </div>
                ) : bills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mb-4 relative shadow-glass-sm">
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg"></div>
                      <Receipt className="w-7 h-7 text-muted-foreground/60 relative z-10" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      No billing records found
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                      We couldn't find any {tab.toLowerCase()} bills
                      {fromDate && toDate ? (
                        <>
                          {" "}for the selected period from{" "}
                          <span className="font-semibold">{fromDate}</span> to{" "}
                          <span className="font-semibold">{toDate}</span>.
                        </>
                      ) : (
                        " currently in the system."
                      )}
                    </p>
                    {role !== "admin" && (
                      <div className="mt-4">
                        <AddBillDialog
                          billType={tab}
                          hospitalCode={code}
                          onCreated={() => {
                            loadBills();
                            setSelectedBill(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/80 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          #
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Bill No.
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Date
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Pat. No.
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Patient Name
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">
                          Total
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">
                          Discount
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">
                          Net
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">
                          Paid
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] text-right">
                          Due
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Mode
                        </th>
                        {role !== "admin" && (
                          <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredBills
                        .slice(page * pageSize, (page + 1) * pageSize)
                        .map((bill, i) => (
                          <tr
                            key={bill.id}
                            onClick={() =>
                              setSelectedBill((prev) =>
                                prev?.id === bill.id ? null : bill,
                              )
                            }
                            className={`cursor-pointer transition-all duration-200 border-l-4 ${
                              selectedBill?.id === bill.id
                                ? "bg-primary/10 border-l-primary"
                                : "border-l-transparent hover:bg-muted/25"
                            }`}
                          >
                            <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px]">
                              {page * pageSize + i + 1}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-primary font-bold">
                              {bill.billNumber}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {bill.billDate}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-muted-foreground">
                              {bill.patientNo}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-foreground">
                              {bill.patientName}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-foreground font-medium">
                              ₹{bill.totalAmount?.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                              {bill.discount > 0
                                ? `-₹${bill.discount.toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                              ₹{bill.netAmount?.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-600 font-semibold">
                              ₹{bill.paidAmount?.toLocaleString("en-IN")}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right font-mono font-semibold ${
                                bill.dueAmount > 0
                                  ? "text-rose-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {bill.dueAmount > 0
                                ? `₹${bill.dueAmount.toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <BillStatusBadge bill={bill} />
                            </td>
                            <td className="px-4 py-2.5">
                              {bill.paymentMode ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full transition-all duration-300 ${
                                    bill.paymentMode === "CASH"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : bill.paymentMode === "UPI"
                                        ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                                        : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  }`}
                                >
                                  {bill.paymentMode === "UPI" ? "QR CODE" : bill.paymentMode}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[10px] font-medium">—</span>
                              )}
                            </td>
                            {role !== "admin" && (
                              <td className="px-4 py-2.5">
                                {bill.dueAmount > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[10px] px-2.5 gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/50 shadow-glass-sm rounded-full transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Stop row selection trigger
                                      setPayingBill(bill);
                                      setPayAmount(String(bill.dueAmount));
                                      setPaymentStep("AMOUNT");
                                      setCardNumber("");
                                      setCardExpiry("");
                                      setCardCvv("");
                                    }}
                                  >
                                    <IndianRupee className="w-3 h-3 animate-pulse" />{" "}
                                    Pay
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-5 py-3 border-t border-border mt-auto">
<PaginationControl
                currentPage={page}
                totalPages={Math.ceil(filteredBills.length / pageSize)}
                totalElements={filteredBills.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                
              />
</div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Payment Dialog */}
      <Dialog
        open={!!payingBill}
        onOpenChange={(o) => {
          if (!o) {
            setPayingBill(null);
            setPaymentStep("AMOUNT");
          }
        }}
      >
        <DialogContent className={`w-full max-w-sm transition-all duration-300 ${paymentStep === "CARD" ? "max-w-md" : ""}`}>
          {/* STEP AMOUNT: Standard recording form */}
          {paymentStep === "AMOUNT" && (
            <>
              <DialogHeader>
                <DialogTitle>Record Payment — {payingBill?.billNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1 border border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patient</span>
                    <span className="font-semibold text-foreground">{payingBill?.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Amount</span>
                    <span className="font-medium">₹{payingBill?.netAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹{payingBill?.paidAmount}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border/30 pt-1 mt-1">
                    <span>Due</span>
                    <span className="text-rose-500">₹{payingBill?.dueAmount}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Payment Amount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={payingBill?.dueAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="mt-1 font-mono font-bold"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPayingBill(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
                    onClick={handlePayment}
                  >
                    Confirm Payment
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* STEP METHOD: Payment Methods Selection Screen */}
          {paymentStep === "METHOD" && (
            <>
              <DialogHeader className="flex flex-row items-center gap-2 space-y-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setPaymentStep("AMOUNT")}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Select Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center p-3 bg-muted/40 rounded-xl border border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">Total Payable</span>
                  <span className="text-base font-bold font-mono text-primary">₹{Number(payAmount).toLocaleString("en-IN")}</span>
                </div>
                
                <div className="space-y-2.5">
                  {/* CASH METHOD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPaymentStep("CASH")}
                    className="w-full text-left p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Cash Payment</p>
                      <p className="text-[10px] text-emerald-600/80 mt-0.5">Collect physical cash at counter</p>
                    </div>
                  </button>

                  {/* UPI / QR CODE METHOD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPaymentStep("UPI")}
                    className="w-full text-left p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-indigo-800 dark:text-indigo-400">UPI / QR Code</p>
                      <p className="text-[10px] text-indigo-600/80 mt-0.5">Generate dynamic QR for instant scan</p>
                    </div>
                  </button>

                  {/* CARD METHOD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPaymentStep("CARD")}
                    className="w-full text-left p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-400">Card / Razorpay</p>
                      <p className="text-[10px] text-blue-600/80 mt-0.5">Secure credit/debit card swipe</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP CASH: Cash checkout page */}
          {paymentStep === "CASH" && (
            <>
              <DialogHeader className="flex flex-row items-center gap-2 space-y-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setPaymentStep("METHOD")}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Record Cash Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Due Cash Amount:</span>
                    <span className="font-bold text-emerald-600">₹{payAmount}</span>
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider text-center">
                    Collect physical cash at counter
                  </p>
                  <div className="text-center font-bold text-sm py-2 px-4 border border-border bg-background rounded-lg text-foreground/80">
                    Received: ₹{payAmount}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setPaymentStep("METHOD")}>
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                    onClick={() => executePaymentRegistration("CASH")}
                  >
                    Confirm Cash Received
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* STEP UPI: Dynamic QR Code Simulator */}
          {paymentStep === "UPI" && (
            <>
              <DialogHeader className="flex flex-row items-center gap-2 space-y-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setPaymentStep("METHOD")}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Dynamic UPI QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 flex flex-col items-center">
                <div className="text-center bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl w-full">
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">Payable: ₹{payAmount}</p>
                </div>

                {/* GORGEOUS QR CODE CONTAINER */}
                <div className="relative p-4 bg-white dark:bg-zinc-950 border-2 border-indigo-500/30 rounded-2xl shadow-glass-inner group transition-all duration-300">
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xs animate-pulse -z-10"></div>
                  
                  {/* Premium Vector QR */}
                  <svg width="130" height="130" viewBox="0 0 100 100" className="mx-auto text-indigo-600 dark:text-indigo-400">
                    <rect x="0" y="0" width="22" height="22" fill="currentColor" />
                    <rect x="3" y="3" width="16" height="16" fill="white" />
                    <rect x="6" y="6" width="10" height="10" fill="currentColor" />
                    
                    <rect x="78" y="0" width="22" height="22" fill="currentColor" />
                    <rect x="81" y="3" width="16" height="16" fill="white" />
                    <rect x="84" y="6" width="10" height="10" fill="currentColor" />
                    
                    <rect x="0" y="78" width="22" height="22" fill="currentColor" />
                    <rect x="3" y="81" width="16" height="16" fill="white" />
                    <rect x="6" y="84" width="10" height="10" fill="currentColor" />
                    
                    <rect x="35" y="10" width="8" height="8" fill="currentColor" />
                    <rect x="50" y="25" width="12" height="12" fill="currentColor" />
                    <rect x="15" y="45" width="18" height="8" fill="currentColor" />
                    <rect x="42" y="52" width="8" height="18" fill="currentColor" />
                    <rect x="68" y="68" width="12" height="8" fill="currentColor" />
                    <rect x="30" y="80" width="16" height="12" fill="currentColor" />
                    <rect x="60" y="40" width="14" height="14" fill="currentColor" />
                  </svg>
                </div>

                <div className="flex flex-col items-center gap-2 w-full mt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Waiting for customer payment...</span>
                  </div>
                  
                  {/* QUICK PAY SIMULATOR BUTTON */}
                  <Button
                    size="sm"
                    className="w-full mt-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md border-0"
                    onClick={() => executePaymentRegistration("UPI")}
                  >
                    Simulate Successful Scan & Pay
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* STEP CARD: Razorpay checkout form */}
          {paymentStep === "CARD" && (
            <>
              <div className="relative border-b border-border/80 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-full"
                    onClick={() => setPaymentStep("METHOD")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle className="text-sm font-semibold tracking-tight text-foreground/80 flex items-center gap-1.5">
                    <span className="font-mono bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20 text-[10px]">Razorpay</span> Secure Terminal
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <Lock className="w-3 h-3 text-emerald-500" /> Secure SSL
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <div className="flex justify-between items-center p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                  <span className="text-xs text-blue-800 dark:text-blue-400 font-medium">Card Checkout Amount</span>
                  <span className="text-sm font-bold font-mono text-blue-600">₹{payAmount}</span>
                </div>

                <div className="space-y-3.5 p-3.5 border border-border/80 rounded-xl bg-muted/15 relative">
                  <div>
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Card Number</Label>
                    <div className="relative mt-1">
                      <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="pl-9 h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expiry</Label>
                      <Input
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="mt-1 h-8 text-xs text-center font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CVV</Label>
                      <Input
                        type="password"
                        placeholder="***"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="mt-1 h-8 text-xs text-center font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 h-9 text-xs" onClick={() => setPaymentStep("METHOD")}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 shadow-md"
                    onClick={() => executePaymentRegistration("CARD")}
                  >
                    Pay ₹{payAmount} via Razorpay
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* STEP PROCESSING: Transaction authorization page */}
          {paymentStep === "PROCESSING" && (
            <div className="py-10 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-md">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-foreground">Authorizing Transaction</h3>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                  {chosenMethod === "CARD"
                    ? "Securing 256-bit connection with Razorpay Payment Gateway..."
                    : chosenMethod === "UPI"
                      ? "Verifying UPI ledger signature and settling balance..."
                      : "Logging cash transaction in safe ledger..."}
                </p>
              </div>
            </div>
          )}

          {/* STEP SUCCESS: Receipt success screen */}
          {paymentStep === "SUCCESS" && (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Payment Received</h3>
                <p className="text-xs text-muted-foreground">Authorized & Settled Successfully</p>
              </div>

              <div className="bg-muted/40 rounded-xl p-3.5 text-xs space-y-1.5 border border-border/40 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Receipt Bill:</span>
                  <span className="font-bold font-mono">{payingBill?.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Amount Received:</span>
                  <span className="font-bold font-mono text-emerald-600">₹{payAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Payment Mode:</span>
                  <span className="font-bold uppercase">{chosenMethod}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-1.5 mt-1 text-[10px]">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono font-bold text-primary">{transactionId}</span>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-9 shadow-md"
                onClick={() => {
                  setPayingBill(null);
                  setPaymentStep("AMOUNT");
                  setCardNumber("");
                  setCardExpiry("");
                  setCardCvv("");
                }}
              >
                Close & Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog
        open={!!editingBill}
        onOpenChange={(o) => !o && setEditingBill(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-primary" />
              Edit Bill — {editingBill?.billNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4 pt-2 min-h-0">
            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1 shrink-0">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient</span>
                <span className="font-semibold">
                  {editingBill?.patientName} ({editingBill?.patientNo})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="font-mono text-emerald-600">
                  ₹{editingBill?.paidAmount?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bill items table */}
            <div className="shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold">Bill Items</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 gap-1"
                  onClick={addEditItem}
                >
                  <Plus className="w-3 h-3" /> Add Row
                </Button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold">
                        Item Name
                      </th>
                      <th className="px-2 py-1.5 text-right font-semibold w-20">
                        Rate (₹)
                      </th>
                      <th className="px-2 py-1.5 text-right font-semibold w-16">
                        Qty
                      </th>
                      <th className="px-2 py-1.5 text-right font-semibold w-20">
                        Total
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {editItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1">
                          <Input
                            value={item.itemName}
                            onChange={(e) =>
                              updateEditItem(idx, "itemName", e.target.value)
                            }
                            placeholder="Item name"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            value={item.rate || ""}
                            onChange={(e) =>
                              updateEditItem(idx, "rate", Number(e.target.value))
                            }
                            className="h-7 text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) =>
                              updateEditItem(idx, "qty", Number(e.target.value))
                            }
                            className="h-7 text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-1 text-right font-mono font-semibold">
                          ₹{(Number(item.rate) * Number(item.qty)).toLocaleString()}
                        </td>
                        <td className="px-1">
                          <button
                            type="button"
                            onClick={() => removeEditItem(idx)}
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <Label className="text-xs">Discount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            
            <div className="bg-muted/20 rounded p-2 text-xs flex justify-between shrink-0">
              <span className="text-muted-foreground">Net after discount</span>
              <span className="font-bold font-mono text-primary">
                ₹{editNetAmount.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2 shrink-0">
            <Button variant="ghost" onClick={() => setEditingBill(null)}>
              Cancel
            </Button>
            <Button
              disabled={editSubmitting}
              onClick={handleEditSave}
              className="min-w-[90px]"
            >
              {editSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deletingBill}
        onOpenChange={(o) => !o && setDeletingBill(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> Delete Bill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
              <p className="font-semibold">
                Are you sure you want to delete bill{" "}
                <span className="font-mono">{deletingBill?.billNumber}</span>?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Patient: {deletingBill?.patientName} — Net: ₹
                {deletingBill?.netAmount?.toLocaleString()}
              </p>
              <p className="text-xs text-destructive mt-2 font-medium">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeletingBill(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteSubmitting}
                onClick={handleDelete}
                className="min-w-[90px]"
              >
                {deleteSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Yes, Delete"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Bill Dialog */}
      <Dialog
        open={!!previewBill}
        onOpenChange={(o) => !o && setPreviewBill(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              Bill Preview — {previewBill?.billNumber}
            </DialogTitle>
          </DialogHeader>
          {previewBill && (
            <div className="space-y-4 pt-1">
              {/* Bill Header Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-sm">{previewBill.patientName}</p>
                  <p className="text-muted-foreground font-mono">
                    {previewBill.patientNo}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-right">
                  <p className="font-bold font-mono text-primary">
                    {previewBill.billNumber}
                  </p>
                  <p className="text-muted-foreground">
                    {previewBill.billDate}
                  </p>
                  <p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        previewBill.billType === "IPD"
                          ? "bg-blue-500/10 text-blue-600"
                          : previewBill.billType === "OPD"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-indigo-500/10 text-indigo-600"
                      }`}
                    >
                      {previewBill.billType}
                    </span>
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-right">Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(previewBill.billItems ?? []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-medium">{it.itemName}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {it.rate?.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {it.qty}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {it.total?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-muted/20 border border-border rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-mono">
                    ₹{previewBill.totalAmount?.toLocaleString()}
                  </span>
                </div>
                {previewBill.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-mono text-rose-500">
                      -₹{previewBill.discount?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="font-bold">Net Amount</span>
                  <span className="font-bold font-mono text-sm">
                    ₹{previewBill.netAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-mono text-emerald-600">
                    ₹{previewBill.paidAmount?.toLocaleString()}
                  </span>
                </div>
                {previewBill.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode</span>
                    <span className="font-semibold uppercase text-primary text-[11px]">
                      {previewBill.paymentMode === "UPI" ? "QR CODE" : previewBill.paymentMode}
                    </span>
                  </div>
                )}
                {previewBill.dueAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due</span>
                    <span className="font-mono text-rose-500 font-semibold">
                      ₹{previewBill.dueAmount?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 border-t border-border pt-2">
                <Button variant="outline" onClick={() => setPreviewBill(null)}>
                  Close
                </Button>
                <Button
                  className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => {
                    handlePrint(previewBill);
                    setPreviewBill(null);
                  }}
                >
                  <Printer className="w-3.5 h-3.5" /> Print Bill
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

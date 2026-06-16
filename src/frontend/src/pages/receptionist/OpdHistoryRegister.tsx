import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type {
  AppointmentResponse,
  BillResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { OPDRegistrationModal } from "./OPDRegistrationModal";

// ─── Combined OPD Visit Row ────────────────────────────────────────────────────
interface OpdVisitRow {
  id: string; // appointment id or bill number
  source: "appointment" | "bill";
  visitDate: string;
  patientNo: string;
  patientName: string;
  doctorName?: string;
  visitType: string; // "OPD" | "Consultation" | "Follow-up"
  status: string;
  tokenNo?: string;
  billNumber?: string;
  amount?: number;
  notes?: string;
  createdAt?: string;
}

// ─── Merge helpers ─────────────────────────────────────────────────────────────

function fromAppointment(a: AppointmentResponse): OpdVisitRow {
  return {
    id: `apt-${a.id}`,
    source: "appointment",
    visitDate: a.appointmentDate,
    patientNo: a.patientNo,
    patientName: a.patientName,
    doctorName: a.doctorName,
    visitType: a.appointmentType || "Consultation",
    status: a.status,
    tokenNo: a.tokenNo,
    notes: a.notes,
    createdAt: a.createdAt,
  };
}

function fromBill(b: BillResponse): OpdVisitRow {
  return {
    id: `bill-${b.billNumber}`,
    source: "bill",
    visitDate: b.billDate,
    patientNo: b.patientNo,
    patientName: b.patientName,
    visitType: "OPD Billing",
    status: b.dueAmount > 0 ? "Due Pending" : "Settled",
    billNumber: b.billNumber,
    amount: b.netAmount,
    createdAt: b.createdAt,
  };
}

// ─── Status colour helper ──────────────────────────────────────────────────────

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "scheduled")
    return "bg-blue-500/15 text-blue-500 border-blue-500/30";
  if (s === "examined" || s === "settled" || s === "completed")
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s === "cancelled")
    return "bg-rose-500/15 text-rose-500 border-rose-500/30";
  if (s.includes("due") || s.includes("pending"))
    return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  return "bg-zinc-200/50 text-zinc-500 border-zinc-300/30";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OpdHistoryRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [rows, setRows] = useState<OpdVisitRow[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // "ALL" | "appointment" | "bill"

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingRow, setViewingRow] = useState<OpdVisitRow | null>(null);

  // Registration modal
  const [opdModalOpen, setOpdModalOpen] = useState(false);

  const handleSaveOPD = async (formData: any) => {
    const loadingToast = toast.loading("Saving OPD Registration...");
    try {
      let patientNo = formData.patientNo;
      // Check if patient exists
      const patientExists =
        patientNo &&
        patients.some(
          (p) => p.patientNo.toLowerCase() === patientNo.toLowerCase(),
        );

      if (!patientExists) {
        // Split name into first and last name
        const nameParts = formData.patientName.trim().split(/\s+/);
        const firstName = nameParts[0] || "Unknown";
        const lastName = nameParts.slice(1).join(" ") || "";

        const birthYear =
          new Date().getFullYear() - Number.parseInt(formData.age || "0");
        const dob = formData.age ? `${birthYear}-01-01` : null;

        const patientReq = {
          firstName,
          lastName: lastName || null,
          dob,
          gender: formData.sex || "Male",
          referredBy: formData.referredBy || null,
          phone: formData.phone || null,
          mobile: formData.mobileForSms || null,
          email: formData.email || null,
          address: formData.address || null,
          category: "OPD",
        };

        const regPatient = await receptionApi.registerPatient(patientReq, code);
        patientNo = regPatient.patientNo;
        toast.success(`Registered new patient with ID: ${patientNo}`);
      }

      // Now book OPD visit
      const timeSlot = new Date().toTimeString().slice(0, 5); // e.g. "14:35"
      const apptType = formData.treatment || "Consultation";
      const notes =
        `[OPD] Indication: ${formData.indication || ""} | History: ${formData.history || ""} | Advice: ${formData.advice || ""} | Notes: ${formData.notes || ""}`.trim();

      const chosenDoc = doctors.find(
        (d) => (d.doctorCode || String(d.id)) === formData.reportingDr,
      );
      await receptionApi.bookAppointment(
        {
          patientNo,
          doctorId: formData.reportingDr,
          appointmentDate: formData.date,
          timeSlot,
          appointmentType: apptType,
          visitType: "OPD",
          notes,
          dueAmount: chosenDoc?.consultationFee ?? 0,
        },
        code,
      );

      toast.success("OPD Visit booked successfully!");
      // Reload data
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to complete OPD registration");
      throw err; // throw so the modal doesn't close
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [aptList, billList, patList, docList] = await Promise.all([
        receptionApi.getAppointments(code, undefined, undefined),
        receptionApi.getBills(
          code,
          "OPD",
          fromDate || undefined,
          toDate || undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          headers: { "X-Hospital-Code": code },
          params: { size: 1000, page: 0 },
        }),
      ]);

      // /admin/doctors returns a Spring Page object: { content: [...], totalPages, ... }
      const doctorsArray: any[] = Array.isArray(docList)
        ? docList
        : Array.isArray(docList?.content)
          ? docList.content
          : [];
      const doctorNamesMap = new Map<string, string>();
      for (const d of doctorsArray) {
        const rawName =
          d.name ||
          [d.firstName, d.lastName].filter(Boolean).join(" ") ||
          d.doctorCode ||
          "Doctor";
        const name = rawName.toLowerCase().startsWith("dr.")
          ? rawName
          : `Dr. ${rawName}`;
        if (d.doctorCode) {
          doctorNamesMap.set(d.doctorCode.toLowerCase(), name);
        }
        if (d.id) {
          doctorNamesMap.set(String(d.id).toLowerCase(), name);
        }
      }

      const aptRows = (Array.isArray(aptList) ? aptList : []).map((a) => {
        const row = fromAppointment(a);
        const docId = a.doctorId?.toLowerCase();
        const docNameFromBackend = a.doctorName || "";
        const docNameClean = docNameFromBackend
          .replace(/^dr\.\s+/i, "")
          .trim()
          .toLowerCase();

        if (docId && doctorNamesMap.has(docId)) {
          row.doctorName = doctorNamesMap.get(docId);
        } else if (doctorNamesMap.has(docNameClean)) {
          row.doctorName = doctorNamesMap.get(docNameClean);
        }
        return row;
      });

      const billRows = (Array.isArray(billList) ? billList : []).map(fromBill);

      // Merge — deduplicate by patientNo+date to avoid double counting if both exist
      const merged = [...aptRows, ...billRows];

      const patientsArray = Array.isArray(patList) ? patList : [];
      const patientsMap = new Map(
        patientsArray.map((p) => [p.patientNo.toLowerCase(), p]),
      );

      // Filter: only display patients registered under OPD (category "OPD").
      // To support legacy data, we also allow empty or undefined category, but exclude explicitly "IPD" category.
      const opdRows = merged.filter((row) => {
        const p = patientsMap.get(row.patientNo.toLowerCase());
        if (!p) return true; // Keep if patient details are not loaded/found to prevent blank rows
        const cat = p.category?.toUpperCase();
        return cat === "OPD" || !cat;
      });

      setRows(opdRows);
      setPatients(patientsArray);
      setDoctors(doctorsArray);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load OPD history");
    } finally {
      setLoading(false);
    }
  }, [code, fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, doctorFilter, sourceFilter, fromDate, toDate]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.patientName.toLowerCase().includes(q) ||
      r.patientNo.toLowerCase().includes(q) ||
      (r.doctorName || "").toLowerCase().includes(q) ||
      (r.billNumber || "").toLowerCase().includes(q) ||
      (r.tokenNo || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      r.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesDoctor =
      doctorFilter === "ALL" ||
      (r.doctorName || "").toLowerCase().includes(doctorFilter.toLowerCase());

    const matchesSource = sourceFilter === "ALL" || r.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesDoctor && matchesSource;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // ── Unique doctor list for filter dropdown ────────────────────────────────────
  const uniqueDoctors = Array.from(
    new Set(rows.map((r) => r.doctorName).filter(Boolean)),
  ) as string[];

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalVisits = filtered.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayVisits = filtered.filter((r) => r.visitDate === todayStr).length;
  const pendingDue = filtered.filter(
    (r) =>
      r.status.toLowerCase().includes("pending") ||
      r.status.toLowerCase().includes("due"),
  ).length;

  // ── Print handler ─────────────────────────────────────────────────────────────
  const handlePrint = (row: OpdVisitRow) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>OPD Visit Slip - ${row.patientName}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 2rem; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { font-size: 1.75rem; margin: 0; text-transform: uppercase; color: #0d9488; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #6b7280; font-weight: 500; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
            .field { border-bottom: 1px solid #f3f4f6; padding: 0.5rem 0; font-size: 0.875rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
            .field-value { margin-top: 0.25rem; font-size: 0.95rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .footer { margin-top: 4rem; display: flex; justify-content: space-between; font-size: 0.875rem; }
            .sig-line { border-top: 1px solid #9ca3af; width: 200px; text-align: center; padding-top: 0.5rem; font-weight: 600; margin-top: 3rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OPD Visit Record</h1>
            <p>OUT-PATIENT DEPARTMENT • CLINICAL REGISTRY</p>
            <div style="margin-top: 1rem;">
              <span class="badge">OPD Visit • ${row.visitDate}</span>
            </div>
          </div>

          <div class="grid">
            <div class="field">
              <div class="field-label">Patient ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #0d9488;">${row.patientNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Name</div>
              <div class="field-value">${row.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">Visit Date</div>
              <div class="field-value">${row.visitDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Visit Type</div>
              <div class="field-value" style="font-weight: 700;">${row.visitType}</div>
            </div>
            <div class="field">
              <div class="field-label">Consulting Doctor</div>
              <div class="field-value">${row.doctorName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Token No.</div>
              <div class="field-value" style="font-family: monospace;">${row.tokenNo || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Status</div>
              <div class="field-value" style="font-weight: bold;">${row.status}</div>
            </div>
            ${
              row.billNumber
                ? `<div class="field">
              <div class="field-label">Bill Number</div>
              <div class="field-value" style="font-family: monospace;">${row.billNumber}</div>
            </div>`
                : "<div></div>"
            }
            ${
              row.amount !== undefined
                ? `<div class="field">
              <div class="field-label">Bill Amount</div>
              <div class="field-value" style="font-weight: bold;">₹ ${row.amount.toFixed(2)}</div>
            </div>`
                : ""
            }
            ${
              row.notes
                ? `<div class="field full-width">
              <div class="field-label">Notes</div>
              <div class="field-value">${row.notes}</div>
            </div>`
                : ""
            }
          </div>

          <div class="footer">
            <div>
              <div class="sig-line">Patient / Guardian Signature</div>
            </div>
            <div>
              <div class="sig-line">Consulting Medical Officer</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDoctorFilter("ALL");
    setSourceFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="opd.history.register.page"
    >
      {/* Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shadow-inner">
            <ClipboardList className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              OPD History Register
            </h1>
            <p className="text-xs text-muted-foreground">
              Complete log of all Out-Patient visits, appointments, and OPD
              billing records
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-500" />
            <span>
              Total:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">{totalVisits}</b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>
              Today: <b className="text-blue-500">{todayVisits}</b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              Due/Pending: <b className="text-amber-500">{pendingDue}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg mt-1">
        {/* Actions panel */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              className="h-8 px-3 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 font-medium"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium border-0 cursor-pointer"
              onClick={() => setOpdModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Register OPD
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-teal-600 hover:bg-teal-500/10 font-bold text-xs dark:text-teal-400"
            onClick={() =>
              navigate({
                to:
                  user?.role === "doctor"
                    ? "/doctor"
                    : user?.role === "admin"
                      ? "/admin"
                      : "/receptionist",
              })
            }
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="flex flex-wrap gap-3 items-end">
            {/* From Date */}
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                From Date
              </Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                To Date
              </Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            {/* Status filter */}
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Visit Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Examined">Examined</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Settled">Settled</SelectItem>
                  <SelectItem value="Due Pending">Due Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Doctor filter */}
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Doctor
              </Label>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Doctors</SelectItem>
                  {uniqueDoctors.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source filter */}
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Record Type
              </Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="appointment">Appointments</SelectItem>
                  <SelectItem value="bill">OPD Bills</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Patient name, ID, doctor, token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-4 text-xs gap-1.5"
              onClick={handleReset}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Srl</th>
                <th className="px-3.5 py-3">Visit Date</th>
                <th className="px-3.5 py-3">Patient</th>
                <th className="px-3.5 py-3">Doctor</th>
                <th className="px-3.5 py-3">Visit Type</th>
                <th className="px-3.5 py-3">Token / Bill No.</th>
                <th className="px-3.5 py-3">Amount</th>
                <th className="px-3.5 py-3 text-center">Type</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {paginated.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    setViewingRow(row);
                    setDetailOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewingRow(row);
                      setDetailOpen(true);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer transition-all hover:bg-teal-500/5 dark:hover:bg-teal-900/10"
                >
                  <td className="px-3.5 py-3 text-zinc-400 font-mono">
                    {page * pageSize + i + 1}
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                    {row.visitDate}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {row.patientName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ID: {row.patientNo}
                      </span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-medium">
                    {row.doctorName || <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-3.5 py-3 font-semibold text-foreground">
                    {row.visitType}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-zinc-500 text-[10px]">
                    {row.tokenNo
                      ? `Token: ${row.tokenNo}`
                      : row.billNumber
                        ? `Bill: ${row.billNumber}`
                        : "—"}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                    {row.amount !== undefined ? (
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        ₹{row.amount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        row.source === "appointment"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                      }`}
                    >
                      {row.source === "appointment" ? "Visit" : "Bill"}
                    </Badge>
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusColor(row.status)}`}
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td
                    className="px-3.5 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="View Details"
                        onClick={() => {
                          setViewingRow(row);
                          setDetailOpen(true);
                        }}
                        className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Print Visit Slip"
                        onClick={() => handlePrint(row)}
                        className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching OPD visit history…"
                          : "No OPD visits found for the selected filters"}
                      </span>
                      <span className="text-[10px] text-zinc-400 max-w-sm text-center">
                        OPD visits are recorded when patients book appointments
                        or when OPD bills are raised.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-border mt-auto">
<PaginationControl
          currentPage={page}
          totalPages={Math.ceil(filtered.length / pageSize)}
          totalElements={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>

        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
          <span>
            Click any row to view full visit details. Use Printer icon to print
            visit slip.
          </span>
          <span>OPD History Register v1.0</span>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-500 animate-pulse" />
              OPD Visit Details
            </DialogTitle>
          </DialogHeader>

          {viewingRow && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              {/* Patient Section */}
              <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <h3 className="font-bold text-teal-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                  PATIENT INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-400">
                      Patient ID
                    </p>
                    <p className="font-mono font-bold text-teal-600 dark:text-teal-400">
                      {viewingRow.patientNo}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-400">
                      Patient Name
                    </p>
                    <p className="font-semibold text-foreground">
                      {viewingRow.patientName}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-400">
                      Visit Date
                    </p>
                    <p className="font-medium">{viewingRow.visitDate}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-400">
                      Visit Type
                    </p>
                    <p className="font-semibold">{viewingRow.visitType}</p>
                  </div>
                  {viewingRow.doctorName && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase font-bold text-zinc-400">
                        Consulting Doctor
                      </p>
                      <p className="font-medium text-foreground">
                        {viewingRow.doctorName}
                      </p>
                    </div>
                  )}
                  {viewingRow.tokenNo && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase font-bold text-zinc-400">
                        Token No.
                      </p>
                      <p className="font-mono font-bold">
                        {viewingRow.tokenNo}
                      </p>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-400">
                      Status
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusColor(viewingRow.status)}`}
                    >
                      {viewingRow.status}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-400">
                      Record Type
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        viewingRow.source === "appointment"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                      }`}
                    >
                      {viewingRow.source === "appointment"
                        ? "Appointment Visit"
                        : "OPD Bill"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Billing section if bill exists */}
              {(viewingRow.billNumber || viewingRow.amount !== undefined) && (
                <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <h3 className="font-bold text-purple-600 uppercase tracking-widest text-[9px] border-b border-purple-200 dark:border-purple-800/30 pb-1">
                    BILLING INFORMATION
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingRow.billNumber && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-bold text-zinc-400">
                          Bill Number
                        </p>
                        <p className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {viewingRow.billNumber}
                        </p>
                      </div>
                    )}
                    {viewingRow.amount !== undefined && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-bold text-zinc-400">
                          Net Amount
                        </p>
                        <p className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                          ₹ {viewingRow.amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes section */}
              {viewingRow.notes && (
                <div className="space-y-2 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
                  <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-[9px]">
                    NOTES
                  </h3>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium italic">
                    {viewingRow.notes}
                  </p>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint(viewingRow)}
                  className="flex-1 h-8 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Visit Slip
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDetailOpen(false)}
                  className="flex-1 h-8 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OPDRegistrationModal
        open={opdModalOpen}
        onClose={() => setOpdModalOpen(false)}
        onSave={handleSaveOPD}
      />
    </div>
  );
}

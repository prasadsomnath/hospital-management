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
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Baby,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileCheck,
  FileText,
  Gift,
  Info,
  LogOut,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Skull,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface RegistryLog {
  id: string;
  patientNo: string;
  patientName: string;
  registerType: string; // "MLC", "OT", "Maternity", "Consent", "Death", "Birth", "Free Patient", "Discharge", "3C", "Insurance"
  date: string;
  status: string;
  details: string;
  raw: any;
}

interface GroupedPatient {
  patientNo: string;
  patientName: string;
  logs: RegistryLog[];
}

// Helper to safely execute api fetch
const safeFetch = async (apiCall: () => Promise<any>) => {
  try {
    const res = await apiCall();
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error("Failed fetching registry entries:", err);
    return [];
  }
};

// Colors mapping for register badges
export function getRegisterBadgeStyles(type: string) {
  const t = type.toLowerCase();
  if (t.includes("mlc"))
    return "bg-rose-500/15 text-rose-500 border-rose-500/30";
  if (t.includes("ot"))
    return "bg-indigo-500/15 text-indigo-500 border-indigo-500/30";
  if (t.includes("maternity"))
    return "bg-purple-500/15 text-purple-500 border-purple-500/30";
  if (t.includes("consent"))
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  if (t.includes("death"))
    return "bg-slate-500/15 text-slate-500 border-slate-500/30";
  if (t.includes("birth"))
    return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (t.includes("free"))
    return "bg-green-500/15 text-green-500 border-green-500/30";
  if (t.includes("discharge"))
    return "bg-cyan-500/15 text-cyan-500 border-cyan-500/30";
  if (t.includes("3c"))
    return "bg-orange-500/15 text-orange-500 border-orange-500/30";
  if (t.includes("insurance"))
    return "bg-sky-500/15 text-sky-500 border-sky-500/30";
  return "bg-zinc-200/50 text-zinc-500 border-zinc-300/30";
}

export function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "open" || s.includes("pending") || s.includes("due"))
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  if (
    s === "signed" ||
    s === "approved" ||
    s === "settled" ||
    s === "delivered" ||
    s === "stable" ||
    s === "success" ||
    s === "handed over" ||
    s === "released"
  )
    return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (s === "failed" || s === "critical")
    return "bg-rose-500/15 text-rose-500 border-rose-500/30";
  return "bg-blue-500/15 text-blue-500 border-blue-500/30";
}

export default function RegisterHistory() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [patientsList, setPatientsList] = useState<GroupedPatient[]>([]);
  const [loading, setLoading] = useState(false);

  // Expanded patient row IDs
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [registerFilter, setRegisterFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState<RegistryLog | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        mlc,
        ot,
        maternity,
        consent,
        death,
        birth,
        free,
        discharge,
        threec,
        insurance,
      ] = await Promise.all([
        safeFetch(() => receptionApi.getMlcEntries(code)),
        safeFetch(() => receptionApi.getOtEntries(code)),
        safeFetch(() => receptionApi.getEddEntries(code)),
        safeFetch(() => receptionApi.getConsentEntries(code)),
        safeFetch(() => receptionApi.getDeathEntries(code)),
        safeFetch(() => receptionApi.getBirthEntries(code)),
        safeFetch(() => receptionApi.getFreePatientEntries(code)),
        safeFetch(() => receptionApi.getDischargeEntries(code)),
        safeFetch(() => receptionApi.getThreeCEntries(code)),
        safeFetch(() => receptionApi.getInsuranceBillEntries(code)),
      ]);

      const allLogs: RegistryLog[] = [];

      // Map registers
      mlc.forEach((e: any) => {
        allLogs.push({
          id: `mlc-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "MLC Register",
          date: e.admissionDateTime ? e.admissionDateTime.split("T")[0] : "—",
          status: e.status || "Open",
          details: `Injury: ${e.injuryType} | Brought by: ${e.broughtBy} | Police: ${e.policeStationName || "N/A"} (FIR: ${e.firNumber || "N/A"})`,
          raw: e,
        });
      });

      ot.forEach((e: any) => {
        allLogs.push({
          id: `ot-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "OT Register",
          date: e.startDateTime ? e.startDateTime.split("T")[0] : "—",
          status: e.outcome || "Scheduled",
          details: `Procedure: ${e.procedureName} (${e.procedureType}) | Surgeon: ${e.surgeonName || "N/A"} | Anaesthetist: ${e.anaesthetistName || "N/A"}`,
          raw: e,
        });
      });

      maternity.forEach((e: any) => {
        allLogs.push({
          id: `edd-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "Maternity Register",
          date: e.lmpDate || "—",
          status: e.status || "Active",
          details: `LMP: ${e.lmpDate} | EDD: ${e.eddByLmp} | G${e.gravida} P${e.para} L${e.living} A${e.abortion} | Doctor: ${e.assignedDoctorName || "N/A"}`,
          raw: e,
        });
      });

      consent.forEach((e: any) => {
        allLogs.push({
          id: `consent-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "Consent Register",
          date: e.consentDateTime ? e.consentDateTime.split("T")[0] : "—",
          status: "Signed",
          details: `Procedure: ${e.procedureName} | Consent Type: ${e.consentType} | Signed By: ${e.signedBy} | Relationship: ${e.relationship || "Self"}`,
          raw: e,
        });
      });

      death.forEach((e: any) => {
        allLogs.push({
          id: `death-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "Death Register",
          date: e.deathDateTime ? e.deathDateTime.split("T")[0] : "—",
          status: e.handoverStatus || "Recorded",
          details: `Primary Cause: ${e.primaryCause} | Certified By: ${e.certifyingDoctorName || "N/A"} | Handed to: ${e.handoverToName || "N/A"} (${e.handoverToRelationship || "N/A"})`,
          raw: e,
        });
      });

      birth.forEach((e: any) => {
        allLogs.push({
          id: `birth-${e.id}`,
          patientNo: e.motherPatientNo,
          patientName: e.motherName,
          registerType: "Birth Register",
          date: e.birthDateTime ? e.birthDateTime.split("T")[0] : "—",
          status: "Delivered",
          details: `Baby: ${e.babyName} | Gender: ${e.gender} | Weight: ${e.birthWeight || "—"} kg | Delivery: ${e.deliveryType} | Doctor: ${e.deliveringDoctorName || "N/A"}`,
          raw: e,
        });
      });

      free.forEach((e: any) => {
        allLogs.push({
          id: `free-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "Free Patient Register",
          date: e.approvalDate || "—",
          status: "Approved",
          details: `Scheme: ${e.schemeName} | Services Covered: ${e.servicesCovered} | Authorised By: ${e.authorisedByName || "N/A"}`,
          raw: e,
        });
      });

      discharge.forEach((e: any) => {
        allLogs.push({
          id: `discharge-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "Discharge Register",
          date: e.dischargeDateTime ? e.dischargeDateTime.split("T")[0] : "—",
          status:
            e.billSettled === "Yes" || e.billSettled === true
              ? "Settled"
              : "Pending Bill",
          details: `Admission: ${e.admissionDate} | Diagnosis: ${e.diagnosis} | Discharge Type: ${e.dischargeType} | Doctor: ${e.treatingDoctorName || "N/A"}`,
          raw: e,
        });
      });

      threec.forEach((e: any) => {
        allLogs.push({
          id: `threec-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "3C Register",
          date: e.arrivalDateTime ? e.arrivalDateTime.split("T")[0] : "—",
          status: e.status || "Under Observation",
          details: `Complaint: ${e.chiefComplaint} | Triage Level: ${e.triageLevel} | Brought by: ${e.broughtBy} | BP: ${e.bp || "N/A"}, Pulse: ${e.pulse || "N/A"}`,
          raw: e,
        });
      });

      insurance.forEach((e: any) => {
        allLogs.push({
          id: `ins-${e.id}`,
          patientNo: e.patientNo,
          patientName: e.patientName,
          registerType: "Insurance Register",
          date: e.submissionDate || "—",
          status: e.claimStatus || "Submitted",
          details: `Insurer: ${e.insurerName} | Policy: ${e.policyNumber} | Claim: ₹${e.claimAmount} | Approved: ₹${e.approvedAmount}`,
          raw: e,
        });
      });

      // Group logs by patient
      const groups: Record<string, GroupedPatient> = {};
      allLogs.forEach((log) => {
        const pNo = log.patientNo || "UNKNOWN";
        if (!groups[pNo]) {
          groups[pNo] = {
            patientNo: pNo,
            patientName: log.patientName || "Unknown Patient",
            logs: [],
          };
        }
        groups[pNo].logs.push(log);
      });

      const list = Object.values(groups);

      // Sort logs inside each patient group
      list.forEach((gp) => {
        gp.logs.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      });

      // Sort patients by latest activity
      list.sort((a, b) => {
        const dateA = a.logs[0]?.date ? new Date(a.logs[0].date).getTime() : 0;
        const dateB = b.logs[0]?.date ? new Date(b.logs[0].date).getTime() : 0;
        return dateB - dateA;
      });

      setPatientsList(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Registry logs.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filtered = patientsList.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.patientName.toLowerCase().includes(q) ||
      p.patientNo.toLowerCase().includes(q);

    const matchesRegister =
      registerFilter === "ALL" ||
      p.logs.some((l) => l.registerType === registerFilter);

    return matchesSearch && matchesRegister;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Toggle rows
  const toggleRow = (patientNo: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [patientNo]: !prev[patientNo],
    }));
  };

  const handlePrintRegistrySlip = (log: RegistryLog) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Registry Log Slip - ${log.patientName}</title>
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
            <h1>Patient Registry Record</h1>
            <p>HEALTHMATRIX360 WORKSPACE CLINICAL RECORD</p>
            <div style="margin-top: 1rem;">
              <span class="badge">${log.registerType} • Record Slip</span>
            </div>
          </div>

          <div class="grid">
            <div class="field">
              <div class="field-label">Patient ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #0d9488;">${log.patientNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Name</div>
              <div class="field-value">${log.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">Registry Date</div>
              <div class="field-value">${log.date}</div>
            </div>
            <div class="field">
              <div class="field-label">Registry Type</div>
              <div class="field-value" style="font-weight: 700;">${log.registerType}</div>
            </div>
            <div class="field">
              <div class="field-label">Status</div>
              <div class="field-value" style="font-weight: bold;">${log.status}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Registry Details</div>
              <div class="field-value">${log.details}</div>
            </div>
          </div>

          <div class="footer">
            <div>
              <div class="sig-line">Medical Record Officer</div>
            </div>
            <div>
              <div class="sig-line">Authorised Signatory</div>
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

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col animate-fade-in"
      data-ocid="register.history.page"
    >
      {/* Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shadow-inner">
            <ClipboardList className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Patient Register History
            </h1>
            <p className="text-xs text-muted-foreground">
              Centralized patient registry logs including MLC, OT, Maternity,
              Consent, 3C, and Insurance records.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-teal-600 hover:bg-teal-500/10 font-bold text-xs dark:text-teal-400 self-end md:self-auto"
          onClick={() => navigate({ to: "/receptionist" })}
        >
          <LogOut className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Button>
      </div>

      {/* Main card panel */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg mt-1">
        {/* Actions panel */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-wrap gap-2 items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="h-8 px-3 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 font-medium"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Logs
          </Button>
          <span className="text-[10px] text-zinc-400 font-mono">
            Showing {filtered.length} patients with logs
          </span>
        </div>

        {/* Filters panel */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="space-y-1 relative flex-1 min-w-[240px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Patient
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search by Patient Name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            {/* Registry Filter */}
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Registry Category
              </Label>
              <Select value={registerFilter} onValueChange={setRegisterFilter}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Registries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Registries</SelectItem>
                  <SelectItem value="MLC Register">MLC Register</SelectItem>
                  <SelectItem value="OT Register">OT Register</SelectItem>
                  <SelectItem value="Maternity Register">
                    Maternity Register
                  </SelectItem>
                  <SelectItem value="Consent Register">
                    Consent Register
                  </SelectItem>
                  <SelectItem value="Death Register">Death Register</SelectItem>
                  <SelectItem value="Birth Register">Birth Register</SelectItem>
                  <SelectItem value="Free Patient Register">
                    Free Patient Register
                  </SelectItem>
                  <SelectItem value="Discharge Register">
                    Discharge Register
                  </SelectItem>
                  <SelectItem value="3C Register">
                    3C Register (Emergency)
                  </SelectItem>
                  <SelectItem value="Insurance Register">
                    Insurance Register
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-4 text-xs gap-1.5"
              onClick={() => {
                setSearchQuery("");
                setRegisterFilter("ALL");
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Patient grouped logs list */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-5 py-3 w-12">Srl</th>
                <th className="px-5 py-3">Patient ID & Name</th>
                <th className="px-5 py-3 text-center w-36">Total Visits</th>
                <th className="px-5 py-3">Visit Registers</th>
                <th className="px-5 py-3 w-40">Latest Activity</th>
                <th className="px-5 py-3 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {paginated.map((gp, i) => {
                const isExpanded = !!expandedRows[gp.patientNo];
                const distinctRegisters = Array.from(
                  new Set(gp.logs.map((l) => l.registerType)),
                );

                return (
                  <>
                    <tr
                      key={gp.patientNo}
                      onClick={() => toggleRow(gp.patientNo)}
                      className="cursor-pointer transition-all hover:bg-teal-500/5 dark:hover:bg-teal-900/5 font-medium"
                    >
                      <td className="px-5 py-4 text-zinc-400 font-mono">
                        {page * pageSize + i + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            {gp.patientName}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {gp.patientNo}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge
                          variant="secondary"
                          className="font-bold font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25"
                        >
                          {gp.logs.length} Log{gp.logs.length > 1 ? "s" : ""}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {distinctRegisters.map((reg) => (
                            <Badge
                              key={reg}
                              variant="outline"
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getRegisterBadgeStyles(
                                reg,
                              )}`}
                            >
                              {reg.replace(" Register", "")}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-zinc-500 text-[11px] whitespace-nowrap">
                        {gp.logs[0]?.date || "—"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(gp.patientNo);
                          }}
                          className="h-8 px-2 text-xs font-semibold gap-1 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 border-0 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              Hide Logs <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Show Logs <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Collapsible logs sub-table */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/50 dark:bg-zinc-900/20">
                        <td
                          colSpan={6}
                          className="p-0 border-t border-b border-zinc-200 dark:border-zinc-800"
                        >
                          <div className="px-10 py-4 space-y-2 border-l-4 border-teal-500 animate-fade-in">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                              Visit Log Directory for {gp.patientName}
                            </h4>
                            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[9px] font-mono tracking-wider font-bold">
                                  <tr>
                                    <th className="px-4 py-2.5 w-32">Date</th>
                                    <th className="px-4 py-2.5 w-48">
                                      Registry Category
                                    </th>
                                    <th className="px-4 py-2.5">
                                      Specific Details
                                    </th>
                                    <th className="px-4 py-2.5 w-28 text-center">
                                      Status
                                    </th>
                                    <th className="px-4 py-2.5 w-24 text-center">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                  {gp.logs.map((log) => (
                                    <tr
                                      key={log.id}
                                      onClick={() => {
                                        setViewingLog(log);
                                        setDetailOpen(true);
                                      }}
                                      className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 cursor-pointer"
                                    >
                                      <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">
                                        {log.date}
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge
                                          variant="outline"
                                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getRegisterBadgeStyles(
                                            log.registerType,
                                          )}`}
                                        >
                                          {log.registerType}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                                        {log.details}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <Badge
                                          variant="outline"
                                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusColor(
                                            log.status,
                                          )}`}
                                        >
                                          {log.status}
                                        </Badge>
                                      </td>
                                      <td
                                        className="px-4 py-3 text-center"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            title="View Record Details"
                                            onClick={() => {
                                              setViewingLog(log);
                                              setDetailOpen(true);
                                            }}
                                            className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Print Record Slip"
                                            onClick={() =>
                                              handlePrintRegistrySlip(log)
                                            }
                                            className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Loading patient register logs..."
                          : "No patients with registry logs found matching the filters"}
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
      </div>

      {/* Raw Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-500" />
              Registry Log Metadata
            </DialogTitle>
          </DialogHeader>

          {viewingLog && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <h3 className="font-bold text-teal-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                  PATIENT DETAILS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 font-bold block text-[9px] uppercase">
                      ID
                    </span>
                    <span className="font-semibold font-mono text-teal-600">
                      {viewingLog.patientNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block text-[9px] uppercase">
                      Name
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {viewingLog.patientName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <h3 className="font-bold text-teal-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                  REGISTRY METADATA: {viewingLog.registerType.toUpperCase()}
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  {Object.entries(viewingLog.raw).map(([key, val]) => {
                    if (val === null || val === undefined) return null;
                    if (typeof val === "object") return null;
                    // Format key nicely (camelCase to Title Case)
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());

                    return (
                      <div key={key}>
                        <span className="text-zinc-400 font-bold block text-[9px] uppercase">
                          {label}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

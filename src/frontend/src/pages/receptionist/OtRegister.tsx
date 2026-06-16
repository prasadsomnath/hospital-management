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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type {
  OtRegisterResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Edit,
  FileText,
  Info,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function OtRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [otEntries, setOtEntries] = useState<OtRegisterResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] = useState<OtRegisterResponse | null>(
    null,
  );

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formIpNo, setFormIpNo] = useState("");
  const [formProcedureName, setFormProcedureName] = useState("");
  const [formProcedureType, setFormProcedureType] = useState("Elective");
  const [formStartDateTime, setFormStartDateTime] = useState("");
  const [formEndDateTime, setFormEndDateTime] = useState("");
  const [formSurgeonId, setFormSurgeonId] = useState("");
  const [formAnaesthetistId, setFormAnaesthetistId] = useState("");
  const [formScrubNurse, setFormScrubNurse] = useState("");
  const [formOtRoomNo, setFormOtRoomNo] = useState("");
  const [formAnaesthesiaType, setFormAnaesthesiaType] = useState("GA");
  const [formPreOpDiagnosis, setFormPreOpDiagnosis] = useState("");
  const [formPostOpDiagnosis, setFormPostOpDiagnosis] = useState("");
  const [formOutcome, setFormOutcome] = useState("Successful");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [otList, patList, docList] = await Promise.all([
        receptionApi.getOtEntries(
          code,
          outcomeFilter !== "ALL" ? outcomeFilter : undefined,
          typeFilter !== "ALL" ? typeFilter : undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setOtEntries(Array.isArray(otList) ? otList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load OT register logs");
    } finally {
      setLoading(false);
    }
  }, [code, outcomeFilter, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, outcomeFilter, typeFilter]);

  // Suggestions for Patient Lookup
  const filteredPatientSuggestions = patients.filter((p) => {
    if (p.category?.toUpperCase() !== "IPD") return false;
    if (!formPatientSearch) return false;
    const q = formPatientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientNo.toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      (p.alternativeNum || "").includes(q)
    );
  });

  const handlePatientSelect = (p: PatientResponse) => {
    setFormPatientNo(p.patientNo);
    setFormPatientName(p.name);
    setFormPatientSearch(p.name);
  };

  const handleNewEntry = () => {
    setFormPatientSearch("");
    setFormPatientNo("");
    setFormPatientName("");
    setFormIpNo("");
    setFormProcedureName("");
    setFormProcedureType("Elective");

    // Initial start / end times
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const startStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    const endStr = new Date(now.getTime() - tzOffset + 3600000)
      .toISOString()
      .slice(0, 16); // 1hr later
    setFormStartDateTime(startStr);
    setFormEndDateTime(endStr);

    setFormSurgeonId("");
    setFormAnaesthetistId("");
    setFormScrubNurse("");
    setFormOtRoomNo("");
    setFormAnaesthesiaType("GA");
    setFormPreOpDiagnosis("");
    setFormPostOpDiagnosis("");
    setFormOutcome("Successful");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select an OT entry to edit.");
      return;
    }
    const entry = otEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormPatientSearch(entry.patientName);
    setFormIpNo(entry.ipNo || "");
    setFormProcedureName(entry.procedureName);
    setFormProcedureType(entry.procedureType);
    setFormStartDateTime(
      entry.startDateTime ? entry.startDateTime.slice(0, 16) : "",
    );
    setFormEndDateTime(entry.endDateTime ? entry.endDateTime.slice(0, 16) : "");
    setFormSurgeonId(entry.surgeonId || "");
    setFormAnaesthetistId(entry.anaesthetistId || "");
    setFormScrubNurse(entry.scrubNurse || "");
    setFormOtRoomNo(entry.otRoomNo || "");
    setFormAnaesthesiaType(entry.anaesthesiaType || "GA");
    setFormPreOpDiagnosis(entry.preOpDiagnosis || "");
    setFormPostOpDiagnosis(entry.postOpDiagnosis || "");
    setFormOutcome(entry.outcome);
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (!formProcedureName.trim()) {
      toast.error("Please enter procedure name.");
      return;
    }
    if (!formStartDateTime || !formEndDateTime) {
      toast.error("Please fill OT start and end times.");
      return;
    }

    const matchedSurgeon = doctors.find((d) => d.doctorCode === formSurgeonId);
    const surgeonName = matchedSurgeon
      ? `Dr. ${matchedSurgeon.firstName} ${matchedSurgeon.lastName || ""}`.trim()
      : "";

    const matchedAnaesthetist = doctors.find(
      (d) => d.doctorCode === formAnaesthetistId,
    );
    const anaesthetistName = matchedAnaesthetist
      ? `Dr. ${matchedAnaesthetist.firstName} ${matchedAnaesthetist.lastName || ""}`.trim()
      : "";

    const payload = {
      patientNo: formPatientNo,
      patientName: formPatientName,
      ipNo: formIpNo || null,
      procedureName: formProcedureName,
      procedureType: formProcedureType,
      startDateTime: formStartDateTime,
      endDateTime: formEndDateTime,
      surgeonId: formSurgeonId || null,
      surgeonName: surgeonName || null,
      anaesthetistId: formAnaesthetistId || null,
      anaesthetistName: anaesthetistName || null,
      scrubNurse: formScrubNurse || null,
      otRoomNo: formOtRoomNo || null,
      anaesthesiaType: formAnaesthesiaType,
      preOpDiagnosis: formPreOpDiagnosis || null,
      postOpDiagnosis: formPostOpDiagnosis || null,
      outcome: formOutcome,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateOtEntry(selectedRowId, payload, code);
        toast.success("OT log entry updated successfully.");
      } else {
        await receptionApi.createOtEntry(payload, code);
        toast.success("New OT surgery log recorded successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save OT entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select an OT entry to delete.");
      return;
    }
    if (!confirm("Are you sure you want to delete this OT surgical entry?")) {
      return;
    }

    try {
      await receptionApi.deleteOtEntry(selectedRowId, code);
      toast.success("OT surgery log deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete OT entry.");
    }
  };

  const handlePrintSlip = (entry: OtRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const start = new Date(entry.startDateTime).toLocaleString();
    const end = new Date(entry.endDateTime).toLocaleString();

    const htmlContent = `
      <html>
        <head>
          <title>OT Clearance Report - ${entry.otNo}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 2rem; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { font-size: 1.75rem; margin: 0; text-transform: uppercase; color: #0d9488; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #6b7280; font-weight: 500; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
            .field { border-bottom: 1px solid #f3f4f6; padding: 0.5rem 0; font-size: 0.875rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; }
            .field-value { margin-top: 0.25rem; font-size: 0.95rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .block-text { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem; font-family: serif; }
            .signatures { margin-top: 5rem; display: flex; justify-content: space-between; font-size: 0.875rem; }
            .sig-line { border-top: 1px solid #9ca3af; width: 220px; text-align: center; padding-top: 0.5rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Operation Theatre Registry</h1>
            <p>Accredited Surgical Case Report &bull; Certificate No: ${entry.otNo}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">OT Procedure Number</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #0d9488;">${entry.otNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Outcome Status</div>
              <div class="field-value" style="font-weight: 700;">${entry.outcome}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient ID (Linked)</div>
              <div class="field-value" style="font-family: monospace;">${entry.patientNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Name</div>
              <div class="field-value">${entry.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">IP Number</div>
              <div class="field-value">${entry.ipNo || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Procedure / Operation</div>
              <div class="field-value" style="font-weight: bold;">${entry.procedureName} (${entry.procedureType})</div>
            </div>
            <div class="field">
              <div class="field-label">OT Start Time</div>
              <div class="field-value">${start}</div>
            </div>
            <div class="field">
              <div class="field-label">OT End Time</div>
              <div class="field-value">${end}</div>
            </div>
            <div class="field">
              <div class="field-label">Surgeon</div>
              <div class="field-value">${entry.surgeonName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Anaesthetist</div>
              <div class="field-value">${entry.anaesthetistName || "—"} (${entry.anaesthesiaType})</div>
            </div>
            <div class="field">
              <div class="field-label">Scrub Nurse</div>
              <div class="field-value">${entry.scrubNurse || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">OT Room / Theater</div>
              <div class="field-value">Theater Room ${entry.otRoomNo || "—"}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Pre-Operative Diagnosis</div>
              <div class="block-text">${entry.preOpDiagnosis || "No Pre-Op Diagnosis logged."}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Post-Operative Diagnosis</div>
              <div class="block-text">${entry.postOpDiagnosis || "No Post-Op Diagnosis logged."}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">Surgical Nurse Coordinator</div>
            <div class="sig-line">Treating Surgeon Signature</div>
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

  const filteredOtEntries = otEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.otNo.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      e.procedureName.toLowerCase().includes(q)
    );
  });

  const paginatedOtEntries = filteredOtEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="ot.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shadow-inner">
            <Activity className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              OT Patients (Operation Theatre)
            </h1>
            <p className="text-xs text-muted-foreground">
              Official log for surgical procedures, theater bookings, outcomes,
              and clinical coordinators
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-500" />
            <span>
              Total Operations:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredOtEntries.length}
              </b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              Emergency:{" "}
              <b className="text-rose-500 font-bold">
                {
                  filteredOtEntries.filter(
                    (e) => e.procedureType === "Emergency",
                  ).length
                }
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Card Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg mt-1">
        {/* Actions panel */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-wrap gap-2 items-center justify-between">
          {user?.role === "receptionist" ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                onClick={handleNewEntry}
                className="h-8.5 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" /> Book OT Surgery
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditEntry}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const entry = otEntries.find((e) => e.id === selectedRowId);
                  if (entry) {
                    setViewingEntry(entry);
                    setDetailOpen(true);
                  }
                }}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <FileText className="w-3.5 h-3.5" /> View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteEntry}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1.5 rounded-lg">
                View-Only Mode
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const entry = otEntries.find((e) => e.id === selectedRowId);
                  if (entry) {
                    setViewingEntry(entry);
                    setDetailOpen(true);
                  }
                }}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <FileText className="w-3.5 h-3.5" /> View Details
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8.5 text-rose-500 hover:bg-rose-500/10 font-bold text-xs"
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
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Outcome Status
              </Label>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Outcomes</SelectItem>
                  <SelectItem value="Successful">Successful</SelectItem>
                  <SelectItem value="Complicated">Complicated</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                OT Booking Type
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Bookings</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Procedures / Patient
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search OT No, Patient Name, ID, Procedure..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-8.5 px-4 text-xs gap-1.5"
              onClick={() => {
                setSearchQuery("");
                setOutcomeFilter("ALL");
                setTypeFilter("ALL");
              }}
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
                <th className="px-3.5 py-3">OT Number</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">Procedure (Type)</th>
                <th className="px-3.5 py-3">Schedule Time</th>
                <th className="px-3.5 py-3">Room No.</th>
                <th className="px-3.5 py-3">Surgeon</th>
                <th className="px-3.5 py-3">Anaesthesia</th>
                <th className="px-3.5 py-3 text-center">Outcome</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedOtEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedStart = new Date(
                  row.startDateTime,
                ).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                });
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRowId(isSelected ? null : row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedRowId(isSelected ? null : row.id);
                      }
                    }}
                    tabIndex={0}
                    className={`cursor-pointer transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 ${
                      isSelected
                        ? "bg-teal-500/10 hover:bg-teal-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {row.otNo}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.patientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {row.patientNo}{" "}
                          {row.ipNo ? `&bull; IP: ${row.ipNo}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.procedureName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`w-max text-[8px] px-1 py-0.2 rounded font-bold uppercase border ${
                            row.procedureType === "Emergency"
                              ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                              : "bg-teal-500/20 text-teal-400 border-teal-500/30"
                          }`}
                        >
                          {row.procedureType}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {formattedStart}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {row.otRoomNo || "—"}
                    </td>
                    <td className="px-3.5 py-3 font-semibold">
                      {row.surgeonName || "—"}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-500">
                      {row.anaesthesiaType}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.outcome === "Successful"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : row.outcome === "Complicated"
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                              : "bg-zinc-500/20 text-zinc-500 border-zinc-500/30"
                        }`}
                      >
                        {row.outcome}
                      </Badge>
                    </td>
                    <td
                      className="px-3.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="View Case details"
                          onClick={() => {
                            setViewingEntry(row);
                            setDetailOpen(true);
                          }}
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Print Case slip"
                          onClick={() => handlePrintSlip(row)}
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOtEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching surgical records..."
                          : "No OT Surgical logs logged yet"}
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
          totalPages={Math.ceil(filteredOtEntries.length / pageSize)}
          totalElements={filteredOtEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* OT Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-500 animate-pulse" />
              {selectedRowId !== null
                ? "Modify OT Procedure Schedule"
                : "Book OT Surgery Schedule"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient Linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-teal-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION A — Patient Linking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2 relative">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Lookup Patient *
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="Search name, phone, patient number..."
                      value={formPatientSearch}
                      onChange={(e) => setFormPatientSearch(e.target.value)}
                      className="pl-7 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  {filteredPatientSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredPatientSuggestions.map((p) => (
                        <div
                          key={p.patientNo}
                          onClick={() => handlePatientSelect(p)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handlePatientSelect(p);
                            }
                          }}
                          tabIndex={0}
                          className="px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {p.patientNo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    IP No.
                  </Label>
                  <Input
                    placeholder="In-Patient No."
                    value={formIpNo}
                    onChange={(e) => setFormIpNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Surgical Info */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-teal-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Procedure & Staff Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Procedure Name *
                  </Label>
                  <Input
                    placeholder="Surgical Procedure"
                    value={formProcedureName}
                    onChange={(e) => setFormProcedureName(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Procedure Type *
                  </Label>
                  <Select
                    value={formProcedureType}
                    onValueChange={setFormProcedureType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Elective">Elective</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Anaesthesia Type *
                  </Label>
                  <Select
                    value={formAnaesthesiaType}
                    onValueChange={setFormAnaesthesiaType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Anaesthesia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GA">GA (Gen. Anaesthesia)</SelectItem>
                      <SelectItem value="SA">
                        SA (Spinal Anaesthesia)
                      </SelectItem>
                      <SelectItem value="LA">LA (Local Anaesthesia)</SelectItem>
                      <SelectItem value="Epidural">Epidural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    OT Start Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formStartDateTime}
                    onChange={(e) => setFormStartDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    OT End Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formEndDateTime}
                    onChange={(e) => setFormEndDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    OT Room / Theatre No.
                  </Label>
                  <Input
                    placeholder="Theatre Room No."
                    value={formOtRoomNo}
                    onChange={(e) => setFormOtRoomNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Surgeon *
                  </Label>
                  <Select
                    value={formSurgeonId}
                    onValueChange={setFormSurgeonId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Surgeon" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.doctorCode} value={doc.doctorCode}>
                          Dr. {doc.firstName} {doc.lastName || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Anaesthetist
                  </Label>
                  <Select
                    value={formAnaesthetistId}
                    onValueChange={setFormAnaesthetistId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Anaesthetist" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.doctorCode} value={doc.doctorCode}>
                          Dr. {doc.firstName} {doc.lastName || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Scrub Nurse
                  </Label>
                  <Input
                    placeholder="Scrub Nurse Name"
                    value={formScrubNurse}
                    onChange={(e) => setFormScrubNurse(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    OT Outcome *
                  </Label>
                  <Select value={formOutcome} onValueChange={setFormOutcome}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Successful">Successful</SelectItem>
                      <SelectItem value="Complicated">Complicated</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Pre-Operative Diagnosis
                  </Label>
                  <Textarea
                    placeholder="Diagnosis before surgery"
                    value={formPreOpDiagnosis}
                    onChange={(e) => setFormPreOpDiagnosis(e.target.value)}
                    className="text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Post-Operative Diagnosis
                  </Label>
                  <Textarea
                    placeholder="Diagnosis confirmed after surgery"
                    value={formPostOpDiagnosis}
                    onChange={(e) => setFormPostOpDiagnosis(e.target.value)}
                    className="text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Remarks
                  </Label>
                  <Textarea
                    placeholder="OT notes, complications, post-op recovery details..."
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                Save Schedule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* OT Detail View Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          {viewingEntry && (
            <>
              <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-row items-center justify-between">
                <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500" />
                  Surgical Case File — {viewingEntry.otNo}
                </DialogTitle>
                <div
                  className="flex gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 border-zinc-200 dark:border-zinc-800"
                    onClick={() => handlePrintSlip(viewingEntry)}
                  >
                    <Printer className="w-3 h-3" /> Print Certificate
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-5 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      OT Procedure Code
                    </span>
                    <span className="text-sm font-mono font-black text-teal-600 dark:text-teal-400">
                      {viewingEntry.otNo}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Outcome Status
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        viewingEntry.outcome === "Successful"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : viewingEntry.outcome === "Complicated"
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            : "bg-zinc-500/20 text-zinc-500 border-zinc-500/30"
                      }`}
                    >
                      {viewingEntry.outcome}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Patient Name / ID
                    </span>
                    <span className="font-bold text-foreground block">
                      {viewingEntry.patientName} ({viewingEntry.patientNo})
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      IP Number
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.ipNo || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Procedure / Booking Type
                    </span>
                    <span className="font-bold block">
                      {viewingEntry.procedureName} ({viewingEntry.procedureType}
                      )
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Theatre Location
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      OT Theatre Room {viewingEntry.otRoomNo || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Start Time
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {new Date(viewingEntry.startDateTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      End Time
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {new Date(viewingEntry.endDateTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Operating Surgeon
                    </span>
                    <span className="font-semibold block">
                      {viewingEntry.surgeonName || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Anaesthetist / Type
                    </span>
                    <span className="font-semibold block">
                      {viewingEntry.anaesthetistName || "—"} (
                      {viewingEntry.anaesthesiaType})
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Scrub Nurse
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.scrubNurse || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Pre-Operative Diagnosis
                    </span>
                    <p className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 italic">
                      {viewingEntry.preOpDiagnosis ||
                        "No Pre-Op Diagnosis logged."}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Post-Operative Diagnosis
                    </span>
                    <p className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 italic">
                      {viewingEntry.postOpDiagnosis ||
                        "No Post-Op Diagnosis logged."}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Surgical Remarks
                    </span>
                    <p className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {viewingEntry.remarks || "No surgical notes recorded."}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailOpen(false)}
                  >
                    Close File
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

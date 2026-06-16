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
  PatientResponse,
  ThreeCRegisterResponse,
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
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ThreeCRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [threeCEntries, setThreeCEntries] = useState<ThreeCRegisterResponse[]>(
    [],
  );
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<ThreeCRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [triageFilter, setTriageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formAge, setFormAge] = useState<number | "">("");
  const [formGender, setFormGender] = useState("Male");
  const [formCaseType, setFormCaseType] = useState("Casualty");
  const [formArrivalDateTime, setFormArrivalDateTime] = useState("");
  const [formTriageLevel, setFormTriageLevel] = useState("Green");
  const [formChiefComplaint, setFormChiefComplaint] = useState("");
  const [formAssignedDoctorId, setFormAssignedDoctorId] = useState("");
  const [formReferredFrom, setFormReferredFrom] = useState("");
  const [formBroughtBy, setFormBroughtBy] = useState("Self");
  const [formBp, setFormBp] = useState("");
  const [formPulse, setFormPulse] = useState<number | "">("");
  const [formTemperature, setFormTemperature] = useState<number | "">("");
  const [formSpo2, setFormSpo2] = useState<number | "">("");
  const [formActionsTaken, setFormActionsTaken] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, patList, docList] = await Promise.all([
        receptionApi.getThreeCEntries(
          code,
          triageFilter !== "ALL" ? triageFilter : undefined,
          statusFilter !== "ALL" ? statusFilter : undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setThreeCEntries(Array.isArray(list) ? list : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load 3C Casualty register logs");
    } finally {
      setLoading(false);
    }
  }, [code, triageFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, triageFilter, statusFilter]);

  const filteredPatientSuggestions = patients.filter((p) => {
    if (p.category?.toUpperCase() !== "IPD") return false;
    if (!formPatientSearch) return false;
    const q = formPatientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.patientNo.toLowerCase().includes(q)
    );
  });

  const handlePatientSelect = (p: PatientResponse) => {
    setFormPatientNo(p.patientNo);
    setFormPatientName(p.name);
    setFormPatientSearch(p.name);
    if (p.age !== undefined && p.age !== null) {
      setFormAge(p.age);
    }
    if (p.gender) {
      setFormGender(p.gender);
    }
  };

  const handleNewEntry = () => {
    setFormPatientSearch("");
    setFormPatientNo("");
    setFormPatientName("");
    setFormAge("");
    setFormGender("Male");
    setFormCaseType("Casualty");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const nowStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormArrivalDateTime(nowStr);

    setFormTriageLevel("Green");
    setFormChiefComplaint("");
    setFormAssignedDoctorId("");
    setFormReferredFrom("");
    setFormBroughtBy("Self");
    setFormBp("");
    setFormPulse("");
    setFormTemperature("");
    setFormSpo2("");
    setFormActionsTaken("");
    setFormStatus("Active");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select a 3C record to edit.");
      return;
    }
    const entry = threeCEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo || "");
    setFormPatientName(entry.patientName);
    setFormPatientSearch(
      entry.patientNo
        ? `${entry.patientName} (${entry.patientNo})`
        : entry.patientName,
    );
    setFormAge(entry.age ?? "");
    setFormGender(entry.gender || "Male");
    setFormCaseType(entry.caseType || "Casualty");
    setFormArrivalDateTime(
      entry.arrivalDateTime ? entry.arrivalDateTime.slice(0, 16) : "",
    );
    setFormTriageLevel(entry.triageLevel || "Green");
    setFormChiefComplaint(entry.chiefComplaint);
    setFormAssignedDoctorId(entry.assignedDoctorId || "");
    setFormReferredFrom(entry.referredFrom || "");
    setFormBroughtBy(entry.broughtBy || "Self");
    setFormBp(entry.bp || "");
    setFormPulse(entry.pulse ?? "");
    setFormTemperature(entry.temperature ?? "");
    setFormSpo2(entry.spo2 ?? "");
    setFormActionsTaken(entry.actionsTaken || "");
    setFormStatus(entry.status || "Active");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim()) {
      toast.error("Please enter patient name.");
      return;
    }
    if (!formArrivalDateTime) {
      toast.error("Please enter arrival date & time.");
      return;
    }
    if (!formChiefComplaint.trim()) {
      toast.error("Please enter chief complaint details.");
      return;
    }
    if (!formBroughtBy.trim()) {
      toast.error("Please enter brought by details.");
      return;
    }

    const matchedDoc = doctors.find(
      (d) => d.doctorCode === formAssignedDoctorId,
    );
    const assignedDoctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      caseType: formCaseType,
      patientNo: formPatientNo || null,
      patientName: formPatientName,
      age: formAge === "" ? null : Number(formAge),
      gender: formGender || null,
      arrivalDateTime: formArrivalDateTime,
      triageLevel: formTriageLevel,
      chiefComplaint: formChiefComplaint,
      assignedDoctorId: formAssignedDoctorId || null,
      assignedDoctorName: assignedDoctorName || null,
      referredFrom: formReferredFrom || null,
      broughtBy: formBroughtBy,
      bp: formBp || null,
      pulse: formPulse === "" ? null : Number(formPulse),
      temperature: formTemperature === "" ? null : Number(formTemperature),
      spo2: formSpo2 === "" ? null : Number(formSpo2),
      actionsTaken: formActionsTaken || null,
      status: formStatus,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateThreeCEntry(selectedRowId, payload, code);
        toast.success("3C register entry updated successfully.");
      } else {
        await receptionApi.createThreeCEntry(payload, code);
        toast.success("New 3C Casualty entry logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save 3C entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select a 3C record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this 3C entry?")) {
      return;
    }

    try {
      await receptionApi.deleteThreeCEntry(selectedRowId, code);
      toast.success("3C record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete 3C entry.");
    }
  };

  const handlePrintSlip = (entry: ThreeCRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const arrivalTime = new Date(entry.arrivalDateTime).toLocaleString();

    const htmlContent = `
      <html>
        <head>
          <title>Triage Tag - ${entry.threeCId}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 2rem; line-height: 1.4; }
            .badge-triage {
              padding: 0.5rem 1.5rem;
              font-size: 1.5rem;
              font-weight: 900;
              text-align: center;
              border-radius: 0.25rem;
              color: white;
              margin-bottom: 1.5rem;
              display: inline-block;
              width: 100%;
              box-sizing: border-box;
            }
            .triage-Red { background-color: #ef4444; border: 2px solid #b91c1c; }
            .triage-Yellow { background-color: #f59e0b; border: 2px solid #b45309; color: #000; }
            .triage-Green { background-color: #10b981; border: 2px solid #047857; }
            
            .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
            .header h1 { font-size: 1.5rem; margin: 0; text-transform: uppercase; color: #111827; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
            .field { border-bottom: 1px solid #e5e7eb; padding: 0.4rem 0; font-size: 0.85rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.7rem; text-transform: uppercase; }
            .field-value { margin-top: 0.15rem; font-size: 0.95rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .vitals-box {
              background: #f9fafb;
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              padding: 0.75rem;
              display: flex;
              justify-content: space-around;
              margin-bottom: 1.5rem;
              font-weight: bold;
              font-size: 1rem;
            }
            .legal-text { font-size: 0.75rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 2rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Casualty & Critical Care Triage Tag</h1>
            <p>TCC Registry Wing &bull; Case ID: ${entry.threeCId}</p>
          </div>

          <div class="badge-triage triage-${entry.triageLevel}">
            TRIAGE STATUS: ${entry.triageLevel.toUpperCase()}
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">Case Registration ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700;">${entry.threeCId}</div>
            </div>
            <div class="field">
              <div class="field-label">Triage Triage Wing / Care Type</div>
              <div class="field-value" style="font-weight: 700;">${entry.caseType}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Name</div>
              <div class="field-value" style="font-weight: 700; font-size: 1.1rem;">${entry.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">Age & Gender</div>
              <div class="field-value">${entry.age || "—"} Yrs / ${entry.gender || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Arrival Date & Time</div>
              <div class="field-value">${arrivalTime}</div>
            </div>
            <div class="field">
              <div class="field-label">Brought By</div>
              <div class="field-value">${entry.broughtBy}</div>
            </div>
            <div class="field">
              <div class="field-label">Assigned Medical Specialist</div>
              <div class="field-value">${entry.assignedDoctorName || "Triage Officer"}</div>
            </div>
            <div class="field">
              <div class="field-label">Referred From</div>
              <div class="field-value">${entry.referredFrom || "Walk-In"}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Chief Complaint</div>
              <div class="field-value" style="background: #fffbeb; padding: 0.5rem; border-radius: 0.25rem; font-weight: 600;">${entry.chiefComplaint}</div>
            </div>
          </div>

          <div class="field-label" style="margin-bottom: 0.25rem;">Patient Vitals at Intake</div>
          <div class="vitals-box">
            <div>BP: ${entry.bp || "—"}</div>
            <div>PR: ${entry.pulse ? `${entry.pulse} bpm` : "—"}</div>
            <div>Temp: ${entry.temperature ? `${entry.temperature} °F` : "—"}</div>
            <div>SpO₂: ${entry.spo2 ? `${entry.spo2}%` : "—"}</div>
          </div>

          <div class="grid">
            <div class="field full-width">
              <div class="field-label">Immediate Actions Taken</div>
              <div class="field-value" style="font-size: 0.9rem;">${entry.actionsTaken || "None recorded."}</div>
            </div>
          </div>

          <div class="legal-text">
            This card represents primary Casualty triage assessment. Handover details and clinical state transitions must be logged immediately.
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

  const filteredThreeCEntries = threeCEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.threeCId.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      (e.patientNo && e.patientNo.toLowerCase().includes(q)) ||
      e.chiefComplaint.toLowerCase().includes(q) ||
      e.caseType.toLowerCase().includes(q)
    );
  });

  const paginatedThreeCEntries = filteredThreeCEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="threec.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/20 dark:bg-zinc-700/20 flex items-center justify-center shadow-inner">
            <Activity className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              3C Patients (Casualty / Critical / Cut & Burn)
            </h1>
            <p className="text-xs text-muted-foreground">
              Official emergency wing intake ledger. Supports walk-ins, triage
              classification, vitals mapping, and duty doctor assignments.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>
              Total Cases:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredThreeCEntries.length}
              </b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              Red (Critical):{" "}
              <b className="text-rose-500 font-bold">
                {
                  filteredThreeCEntries.filter((e) => e.triageLevel === "Red")
                    .length
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
                className="h-8.5 px-3 text-xs bg-zinc-800 hover:bg-zinc-900 text-white gap-1.5 font-semibold dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Log Triage Case
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
                  const entry = threeCEntries.find(
                    (e) => e.id === selectedRowId,
                  );
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
                  const entry = threeCEntries.find(
                    (e) => e.id === selectedRowId,
                  );
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
                Triage Level
              </Label>
              <Select value={triageFilter} onValueChange={setTriageFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  <SelectItem value="Red">Red (Critical/Resus)</SelectItem>
                  <SelectItem value="Yellow">Yellow (Urgent)</SelectItem>
                  <SelectItem value="Green">Green (Stable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Case Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Case Records
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Triage ID, Patient Name, Complaint, Wing..."
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
                setTriageFilter("ALL");
                setStatusFilter("ALL");
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
                <th className="px-3.5 py-3">Triage ID</th>
                <th className="px-3.5 py-3">Wing Type</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">Triage Level</th>
                <th className="px-3.5 py-3">Arrival Time</th>
                <th className="px-3.5 py-3">Intake Vitals</th>
                <th className="px-3.5 py-3">Complaint</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedThreeCEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedTime = new Date(
                  row.arrivalDateTime,
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
                        ? "bg-zinc-500/10 hover:bg-zinc-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {row.threeCId}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-foreground">
                      {row.caseType}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.patientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {row.age || "—"} Yrs / {row.gender || "—"}{" "}
                          {row.patientNo
                            ? `&bull; Linked: ${row.patientNo}`
                            : `&bull; Walk-In`}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 font-bold uppercase rounded border ${
                          row.triageLevel === "Red"
                            ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                            : row.triageLevel === "Yellow"
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                        }`}
                      >
                        {row.triageLevel}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[10px]">
                      <div className="flex flex-col text-zinc-700 dark:text-zinc-300">
                        <span>BP: {row.bp || "—"}</span>
                        <span>
                          PR: {row.pulse ? `${row.pulse} bpm` : "—"} &bull;
                          SpO₂: {row.spo2 ? `${row.spo2}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[150px]">
                      {row.chiefComplaint}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.status === "Active"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : row.status === "Stable"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}
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
                          title="View Intake Dossier"
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
                          title="Print Triage Tag"
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

              {filteredThreeCEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching emergency cases..."
                          : "No emergency cases registered yet"}
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
          totalPages={Math.ceil(filteredThreeCEntries.length / pageSize)}
          totalElements={filteredThreeCEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Emergency intake form modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-700 dark:text-zinc-300 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Intake Registry Record"
                : "Log Critical Triage Case"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION A — Patient Link / Walk-in Mapping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2 relative">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Lookup Registered Patient (Optional)
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="Search registered patient name or ID..."
                      value={formPatientSearch}
                      onChange={(e) => {
                        setFormPatientSearch(e.target.value);
                        setFormPatientName(e.target.value);
                      }}
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
                    Patient ID (If Linked)
                  </Label>
                  <Input
                    value={formPatientNo}
                    readOnly
                    placeholder="Walk-In (No ID)"
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Intake Name *
                  </Label>
                  <Input
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    placeholder="Patient Name"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Intake Age
                  </Label>
                  <Input
                    type="number"
                    value={formAge}
                    onChange={(e) =>
                      setFormAge(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    placeholder="Age (Yrs)"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Gender
                  </Label>
                  <Select value={formGender} onValueChange={setFormGender}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Emergency Intake Details */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Triage & Intake Coordinates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Wing / Case Type *
                  </Label>
                  <Select value={formCaseType} onValueChange={setFormCaseType}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Wing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casualty">Casualty Wing</SelectItem>
                      <SelectItem value="Critical Care">
                        Critical Care Wing
                      </SelectItem>
                      <SelectItem value="Cut & Burn">
                        Cut & Burn Wing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Arrival Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formArrivalDateTime}
                    onChange={(e) => setFormArrivalDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Triage Severity *
                  </Label>
                  <Select
                    value={formTriageLevel}
                    onValueChange={setFormTriageLevel}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Triage Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Red">
                        Red (Immediate Resuscitation)
                      </SelectItem>
                      <SelectItem value="Yellow">
                        Yellow (Urgent Intervention)
                      </SelectItem>
                      <SelectItem value="Green">
                        Green (Stable / Non-Urgent)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Duty Doctor Assigned
                  </Label>
                  <Select
                    value={formAssignedDoctorId}
                    onValueChange={setFormAssignedDoctorId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Doctor" />
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
                    Referred From / Source
                  </Label>
                  <Input
                    placeholder="e.g. Walk-In, Other Clinic..."
                    value={formReferredFrom}
                    onChange={(e) => setFormReferredFrom(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Brought By Details *
                  </Label>
                  <Input
                    placeholder="e.g. Ambulance / Self / Relative..."
                    value={formBroughtBy}
                    onChange={(e) => setFormBroughtBy(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Intake Vitals mapping */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION C — Vitals at Entry
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Blood Pressure
                  </Label>
                  <Input
                    placeholder="e.g. 120/80"
                    value={formBp}
                    onChange={(e) => setFormBp(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Pulse Rate (bpm)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 72"
                    value={formPulse}
                    onChange={(e) =>
                      setFormPulse(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Temperature (°F)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 98.6"
                    value={formTemperature}
                    onChange={(e) =>
                      setFormTemperature(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    SpO₂ (%)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 98"
                    value={formSpo2}
                    onChange={(e) =>
                      setFormSpo2(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Complaint and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold text-zinc-500">
                  Chief Complaint *
                </Label>
                <Textarea
                  placeholder="Primary reasons for emergency arrival..."
                  value={formChiefComplaint}
                  onChange={(e) => setFormChiefComplaint(e.target.value)}
                  className="h-20 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold text-zinc-500">
                  Immediate Actions Taken
                </Label>
                <Textarea
                  placeholder="First-aid, IV fluid details, oxygen therapy, medications given at intake..."
                  value={formActionsTaken}
                  onChange={(e) => setFormActionsTaken(e.target.value)}
                  className="h-20 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            {/* Case status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold text-zinc-500">
                  Initial State Status *
                </Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">
                      Active Triage (Evaluating)
                    </SelectItem>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Admitted">
                      Admitted to In-Patient (IPD)
                    </SelectItem>
                    <SelectItem value="Discharged">Discharged Home</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold text-zinc-500">
                  Remarks / Extra Notes
                </Label>
                <Input
                  placeholder="e.g. Police informed, MLC linked..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-9 px-4 text-xs font-medium border-zinc-200 dark:border-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                {selectedRowId !== null
                  ? "Save Modifications"
                  : "Register Intake"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3C Detail Dossier Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Casualty Triage Wing Intake Dossier — {viewingEntry?.threeCId}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Patient details
                  </h4>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {viewingEntry.patientName}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {viewingEntry.age || "—"} Yrs / {viewingEntry.gender || "—"}
                  </p>
                  <p className="text-zinc-500 font-mono mt-0.5">
                    {viewingEntry.patientNo
                      ? `ID: ${viewingEntry.patientNo}`
                      : "Walk-In Patient"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Triage Severity
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 mt-1 font-extrabold uppercase rounded border ${
                      viewingEntry.triageLevel === "Red"
                        ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                        : viewingEntry.triageLevel === "Yellow"
                          ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                    }`}
                  >
                    {viewingEntry.triageLevel} Category
                  </Badge>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-1.5 font-mono">
                    Case Code: {viewingEntry.threeCId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Arrival & Wing
                  </h4>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Wing Location:</strong> {viewingEntry.caseType}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Arrival Time:</strong>{" "}
                    {new Date(viewingEntry.arrivalDateTime).toLocaleString()}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Brought By:</strong> {viewingEntry.broughtBy}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Duty Doctor:</strong>{" "}
                    {viewingEntry.assignedDoctorName || "Triage Officer"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Referred From:</strong>{" "}
                    {viewingEntry.referredFrom || "Direct Walk-In"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Vitals at Intake
                  </h4>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-1 font-mono text-[11px] font-bold">
                    <p className="text-zinc-800 dark:text-zinc-200">
                      Blood Pressure: {viewingEntry.bp || "—"}
                    </p>
                    <p className="text-zinc-800 dark:text-zinc-200">
                      Pulse Rate:{" "}
                      {viewingEntry.pulse ? `${viewingEntry.pulse} bpm` : "—"}
                    </p>
                    <p className="text-zinc-800 dark:text-zinc-200">
                      Temperature:{" "}
                      {viewingEntry.temperature
                        ? `${viewingEntry.temperature} °F`
                        : "—"}
                    </p>
                    <p className="text-zinc-800 dark:text-zinc-200">
                      Oxygen Saturation:{" "}
                      {viewingEntry.spo2 ? `${viewingEntry.spo2}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                  Chief Complaint
                </h4>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <p className="text-zinc-850 font-semibold">
                    {viewingEntry.chiefComplaint}
                  </p>
                </div>
              </div>

              {viewingEntry.actionsTaken && (
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Actions / Triage Interventions
                  </h4>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {viewingEntry.actionsTaken}
                    </p>
                  </div>
                </div>
              )}

              {viewingEntry.remarks && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
                    Remarks
                  </h4>
                  <p className="text-zinc-700 dark:text-zinc-300 italic">
                    {viewingEntry.remarks}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                  className="h-9 px-4 text-xs font-medium border-zinc-200 dark:border-zinc-800"
                >
                  Close Dossier
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePrintSlip(viewingEntry)}
                  className="h-9 px-4 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold gap-1.5 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  <Printer className="w-4 h-4" /> Print Triage Tag
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

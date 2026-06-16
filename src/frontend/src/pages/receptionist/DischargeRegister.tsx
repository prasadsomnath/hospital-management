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
  DischargeRegisterResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
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

export default function DischargeRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [dischargeEntries, setDischargeEntries] = useState<
    DischargeRegisterResponse[]
  >([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<DischargeRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formIpNo, setFormIpNo] = useState("");
  const [formAdmissionDate, setFormAdmissionDate] = useState("");
  const [formDischargeDateTime, setFormDischargeDateTime] = useState("");
  const [formTreatingDoctorId, setFormTreatingDoctorId] = useState("");
  const [formWardBed, setFormWardBed] = useState("");
  const [formDiagnosis, setFormDiagnosis] = useState("");
  const [formProcedureDone, setFormProcedureDone] = useState("");
  const [formDischargeType, setFormDischargeType] = useState("Recovered");
  const [formFollowUpDate, setFormFollowUpDate] = useState("");
  const [formFinalBillAmount, setFormFinalBillAmount] = useState<number | "">(
    "",
  );
  const [formBillSettled, setFormBillSettled] = useState("Yes");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dischargeList, patList, docList] = await Promise.all([
        receptionApi.getDischargeEntries(code),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setDischargeEntries(Array.isArray(dischargeList) ? dischargeList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Discharge register logs");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

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
  };

  const handleNewEntry = () => {
    setFormPatientSearch("");
    setFormPatientNo("");
    setFormPatientName("");
    setFormIpNo("");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 10);
    setFormAdmissionDate(todayStr);

    const nowStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormDischargeDateTime(nowStr);

    setFormTreatingDoctorId("");
    setFormWardBed("");
    setFormDiagnosis("");
    setFormProcedureDone("");
    setFormDischargeType("Recovered");
    setFormFollowUpDate("");
    setFormFinalBillAmount("");
    setFormBillSettled("Yes");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select a Discharge record to edit.");
      return;
    }
    const entry = dischargeEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormPatientSearch(entry.patientName);
    setFormIpNo(entry.ipNo);
    setFormAdmissionDate(entry.admissionDate || "");
    setFormDischargeDateTime(
      entry.dischargeDateTime ? entry.dischargeDateTime.slice(0, 16) : "",
    );
    setFormTreatingDoctorId(entry.treatingDoctorId || "");
    setFormWardBed(entry.wardBed || "");
    setFormDiagnosis(entry.diagnosis);
    setFormProcedureDone(entry.procedureDone || "");
    setFormDischargeType(entry.dischargeType || "Recovered");
    setFormFollowUpDate(entry.followUpDate || "");
    setFormFinalBillAmount(entry.finalBillAmount ?? "");
    setFormBillSettled(entry.billSettled || "Yes");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (!formIpNo.trim()) {
      toast.error("Please enter the IP Number.");
      return;
    }
    if (!formAdmissionDate) {
      toast.error("Please select the Admission date.");
      return;
    }
    if (!formDischargeDateTime) {
      toast.error("Please select the Discharge date & time.");
      return;
    }
    const admissionStr = formAdmissionDate.split("T")[0];
    const dischargeStr = formDischargeDateTime.split("T")[0];
    const admission = new Date(admissionStr);
    const discharge = new Date(dischargeStr);
    const diffTime = discharge.getTime() - admission.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      toast.error("IPD patient stay cannot be negative.");
      return;
    }
    if (!formDiagnosis.trim()) {
      toast.error("Please enter the Final Diagnosis.");
      return;
    }
    if (formFinalBillAmount === "") {
      toast.error("Please enter the Final Bill Amount.");
      return;
    }

    const matchedDoc = doctors.find(
      (d) => d.doctorCode === formTreatingDoctorId,
    );
    const treatingDoctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      ipNo: formIpNo,
      patientNo: formPatientNo,
      patientName: formPatientName,
      admissionDate: formAdmissionDate,
      dischargeDateTime: formDischargeDateTime,
      treatingDoctorId: formTreatingDoctorId || null,
      treatingDoctorName: treatingDoctorName || null,
      wardBed: formWardBed || null,
      diagnosis: formDiagnosis,
      procedureDone: formProcedureDone || null,
      dischargeType: formDischargeType,
      followUpDate: formFollowUpDate || null,
      finalBillAmount: Number(formFinalBillAmount),
      billSettled: formBillSettled,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateDischargeEntry(selectedRowId, payload, code);
        toast.success("Discharge register entry updated successfully.");
      } else {
        await receptionApi.createDischargeEntry(payload, code);
        toast.success("New Discharge entry logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Discharge entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select a Discharge record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this Discharge entry?")) {
      return;
    }

    try {
      await receptionApi.deleteDischargeEntry(selectedRowId, code);
      toast.success("Discharge record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete Discharge entry.");
    }
  };

  const handlePrintSlip = (entry: DischargeRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const admissionDate = new Date(entry.admissionDate).toLocaleDateString();
    const dischargeTime = new Date(entry.dischargeDateTime).toLocaleString();
    const followUpDateStr = entry.followUpDate
      ? new Date(entry.followUpDate).toLocaleDateString()
      : "As advised";

    const htmlContent = `
      <html>
        <head>
          <title>Discharge Slip - ${entry.dischargeId}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 3rem; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
            .header h1 { font-size: 1.85rem; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #4b5563; font-weight: 600; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem; }
            .field { border-bottom: 1px solid #e5e7eb; padding: 0.5rem 0; font-size: 0.9rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; }
            .field-value { margin-top: 0.25rem; font-size: 1rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .block-text { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 1rem; font-size: 0.95rem; }
            .legal-text { font-size: 0.8rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 2rem; margin-top: 4rem; }
            .signatures { margin-top: 6rem; display: flex; justify-content: space-between; font-size: 0.9rem; }
            .sig-line { border-top: 1px solid #111827; width: 250px; text-align: center; padding-top: 0.5rem; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Discharge Summary Slip</h1>
            <p>Official Patient Vital Statistics Registry &bull; Discharge ID: ${entry.dischargeId}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">Registry Case ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #ef4444;">${entry.dischargeId}</div>
            </div>
            <div class="field">
              <div class="field-label">Discharge Type</div>
              <div class="field-value" style="font-weight: 700;">${entry.dischargeType}</div>
            </div>
            <div class="field">
              <div class="field-label">IP Number</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700;">${entry.ipNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient ID (Linked)</div>
              <div class="field-value" style="font-family: monospace;">${entry.patientNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Name</div>
              <div class="field-value" style="font-weight: 700;">${entry.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">Admission Date</div>
              <div class="field-value">${admissionDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Discharge Date & Time</div>
              <div class="field-value" style="font-weight: bold;">${dischargeTime}</div>
            </div>
            <div class="field">
              <div class="field-label">Treating Doctor</div>
              <div class="field-value">${entry.treatingDoctorName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Ward / Bed</div>
              <div class="field-value">${entry.wardBed || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Follow-up Date</div>
              <div class="field-value" style="color: #2563eb; font-weight: 700;">${followUpDateStr}</div>
            </div>
            <div class="field">
              <div class="field-label">Final Bill Clearance</div>
              <div class="field-value">
                Amount: <strong>₹${Number(entry.finalBillAmount).toFixed(2)}</strong> &bull; Settled: <strong>${entry.billSettled}</strong>
              </div>
            </div>
            <div class="field full-width">
              <div class="field-label">Final Diagnosis</div>
              <div class="block-text" style="font-weight: 600;">${entry.diagnosis}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Procedure Completed</div>
              <div class="block-text">${entry.procedureDone || "No procedures noted."}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Remarks / Discharge Advice</div>
              <div class="field-value" style="font-style: italic;">${entry.remarks || "No additional remarks."}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">Patient / Receiver Signature</div>
            <div class="sig-line">Treating Medical Specialist</div>
          </div>

          <div class="legal-text">
            This slip acts as the official discharge release documentation. Follow-up appointments and treatment instructions must be adhered to.
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

  const filteredDischargeEntries = dischargeEntries.filter((e) => {
    if (e.admissionDate && e.dischargeDateTime) {
      const admissionStr = e.admissionDate.split("T")[0];
      const dischargeStr = e.dischargeDateTime.split("T")[0];
      const admission = new Date(admissionStr);
      const discharge = new Date(dischargeStr);
      const diffTime = discharge.getTime() - admission.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      e.dischargeId.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      e.ipNo.toLowerCase().includes(q) ||
      e.diagnosis.toLowerCase().includes(q)
    );
  });

  const paginatedDischargeEntries = filteredDischargeEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="discharge.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/20 dark:bg-zinc-700/20 flex items-center justify-center shadow-inner">
            <Calendar className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Discharge Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Official hospital registry of inpatient releases, discharge types
              (Recovered/LAMA/Referred), follow-up advice, and final bill
              clearance status
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>
              Total Discharges:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredDischargeEntries.length}
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
                <Plus className="w-4 h-4" /> Log Discharge
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
                  const entry = dischargeEntries.find(
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
                  const entry = dischargeEntries.find(
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
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Discharge Records
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Discharge ID, Patient Name, ID, IP No, Diagnosis..."
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
                <th className="px-3.5 py-3">Discharge ID</th>
                <th className="px-3.5 py-3">IP Number</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">Admission Date</th>
                <th className="px-3.5 py-3">Discharge Date & Time</th>
                <th className="px-3.5 py-3">Discharge Type</th>
                <th className="px-3.5 py-3">Follow-Up</th>
                <th className="px-3.5 py-3 text-right">Bill Amount</th>
                <th className="px-3.5 py-3 text-center">Settled</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedDischargeEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedTime = new Date(
                  row.dischargeDateTime,
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
                      {row.dischargeId}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-zinc-800 dark:text-zinc-200 font-bold">
                      {row.ipNo}
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
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {new Date(row.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="px-3.5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 font-bold uppercase rounded border ${
                          row.dischargeType === "Recovered"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : row.dischargeType === "Expired"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        {row.dischargeType}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-3 font-mono whitespace-nowrap">
                      {row.followUpDate
                        ? new Date(row.followUpDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-bold text-foreground">
                      ₹{Number(row.finalBillAmount).toFixed(2)}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.billSettled === "Yes"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : row.billSettled === "Partial"
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                              : "bg-rose-500/20 text-rose-500 border-rose-500/30"
                        }`}
                      >
                        {row.billSettled}
                      </Badge>
                    </td>
                    <td
                      className="px-3.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="View Dossier"
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
                          title="Print Discharge Slip"
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

              {filteredDischargeEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching discharges..."
                          : "No Discharge records registered yet"}
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
          totalPages={Math.ceil(filteredDischargeEntries.length / pageSize)}
          totalElements={filteredDischargeEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Discharge Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-700 dark:text-zinc-300 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Discharge Registry Record"
                : "Register New Discharge"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
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
                      placeholder="Search patient name or ID..."
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
                    Patient ID
                  </Label>
                  <Input
                    value={formPatientNo}
                    readOnly
                    placeholder="Selected ID"
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Admission & discharge info */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Admission & Discharge Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    IP Number *
                  </Label>
                  <Input
                    placeholder="e.g. IPN-98765"
                    value={formIpNo}
                    onChange={(e) => setFormIpNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Admission Date *
                  </Label>
                  <Input
                    type="date"
                    value={formAdmissionDate}
                    onChange={(e) => setFormAdmissionDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Discharge Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formDischargeDateTime}
                    onChange={(e) => setFormDischargeDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Discharge Type *
                  </Label>
                  <Select
                    value={formDischargeType}
                    onValueChange={setFormDischargeType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recovered">Recovered</SelectItem>
                      <SelectItem value="Referred">
                        Referred (Higher Facility)
                      </SelectItem>
                      <SelectItem value="LAMA">
                        LAMA (Left Against Medical Advice)
                      </SelectItem>
                      <SelectItem value="Absconded">Absconded</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Treating Doctor
                  </Label>
                  <Select
                    value={formTreatingDoctorId}
                    onValueChange={setFormTreatingDoctorId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Treating Doctor" />
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
                    Ward / Bed Room
                  </Label>
                  <Input
                    placeholder="e.g. ICU Room 3"
                    value={formWardBed}
                    onChange={(e) => setFormWardBed(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Follow-up Date
                  </Label>
                  <Input
                    type="date"
                    value={formFollowUpDate}
                    onChange={(e) => setFormFollowUpDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Notes & Billing */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION C — Clinical Advice & Bill Clearance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Final Bill Amount *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Total Bill Amount (₹)"
                    value={formFinalBillAmount}
                    onChange={(e) =>
                      setFormFinalBillAmount(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Bill Settled *
                  </Label>
                  <Select
                    value={formBillSettled}
                    onValueChange={setFormBillSettled}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes (Fully Settled)</SelectItem>
                      <SelectItem value="Partial">
                        Partial Settlement
                      </SelectItem>
                      <SelectItem value="No">No (Due Outstanding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Final Diagnosis *
                  </Label>
                  <Input
                    placeholder="Primary medical diagnosis at discharge..."
                    value={formDiagnosis}
                    onChange={(e) => setFormDiagnosis(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Procedures Done (if any)
                  </Label>
                  <Input
                    placeholder="Surgical procedures or key treatments completed..."
                    value={formProcedureDone}
                    onChange={(e) => setFormProcedureDone(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Remarks / Discharge Advice
              </Label>
              <Textarea
                placeholder="Follow-up instructions, medication advice or administrative notes..."
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                className="h-20 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
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
                {selectedRowId !== null ? "Save Changes" : "Confirm Discharge"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discharge Detail Dossier Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Discharge Registry Record Summary — {viewingEntry?.dischargeId}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Patient Details
                  </h4>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {viewingEntry.patientName}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Patient ID: {viewingEntry.patientNo}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 font-bold">
                    IP Number: {viewingEntry.ipNo}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Registry Metadata
                  </h4>
                  <p className="text-sm font-mono font-bold text-rose-500 mt-1">
                    {viewingEntry.dischargeId}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Admission:{" "}
                    {new Date(viewingEntry.admissionDate).toLocaleDateString()}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Discharge:{" "}
                    {new Date(viewingEntry.dischargeDateTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Care Details
                  </h4>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Treating Doctor:</strong>{" "}
                    {viewingEntry.treatingDoctorName || "—"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Ward / Bed:</strong> {viewingEntry.wardBed || "—"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Discharge Status:</strong>{" "}
                    {viewingEntry.dischargeType}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Follow-Up Date:</strong>{" "}
                    {viewingEntry.followUpDate
                      ? new Date(viewingEntry.followUpDate).toLocaleDateString()
                      : "As Advised"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Finance Clearance
                  </h4>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Final Bill:</strong> ₹
                    {Number(viewingEntry.finalBillAmount).toFixed(2)}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Settled:</strong> {viewingEntry.billSettled}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                  Diagnosis & Clinical Info
                </h4>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {viewingEntry.diagnosis}
                  </p>
                  {viewingEntry.procedureDone && (
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                      <strong>Procedure Done:</strong>{" "}
                      {viewingEntry.procedureDone}
                    </p>
                  )}
                </div>
              </div>

              {viewingEntry.remarks && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
                    Discharge Advice / Remarks
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
                  Close Summary
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePrintSlip(viewingEntry)}
                  className="h-9 px-4 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold gap-1.5 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  <Printer className="w-4 h-4" /> Print Summary Slip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

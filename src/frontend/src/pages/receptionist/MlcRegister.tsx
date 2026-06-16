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
  MlcRegisterResponse,
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
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function MlcRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [mlcEntries, setMlcEntries] = useState<MlcRegisterResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] = useState<MlcRegisterResponse | null>(
    null,
  );

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [injuryFilter, setInjuryFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formAge, setFormAge] = useState<number | "">("");
  const [formGender, setFormGender] = useState("Male");
  const [formAdmissionDateTime, setFormAdmissionDateTime] = useState("");
  const [formInjuryType, setFormInjuryType] = useState("Road Accident");
  const [formBroughtBy, setFormBroughtBy] = useState("Relative");
  const [formPoliceStation, setFormPoliceStation] = useState("");
  const [formFirNumber, setFormFirNumber] = useState("");
  const [formInformingDoctor, setFormInformingDoctor] = useState("");
  const [formTreatingDoctorId, setFormTreatingDoctorId] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formStatus, setFormStatus] = useState("Open");

  // Load backend data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mlcList, patList, docList] = await Promise.all([
        receptionApi.getMlcEntries(
          code,
          statusFilter !== "ALL" ? statusFilter : undefined,
          injuryFilter !== "ALL" ? injuryFilter : undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setMlcEntries(Array.isArray(mlcList) ? mlcList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load MLC register logs");
    } finally {
      setLoading(false);
    }
  }, [code, statusFilter, injuryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle pagination reset on filter change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, injuryFilter]);

  // Suggestion filters for Patient Lookup
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
    setFormAge(p.age || "");
    setFormGender(p.gender || "Male");
    setFormPatientSearch(p.name);
  };

  // Open creation modal
  const handleNewEntry = () => {
    setFormPatientSearch("");
    setFormPatientNo("");
    setFormPatientName("");
    setFormAge("");
    setFormGender("Male");
    // Default to current local time in format YYYY-MM-DDTHH:MM
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormAdmissionDateTime(localISOTime);
    setFormInjuryType("Road Accident");
    setFormBroughtBy("Relative");
    setFormPoliceStation("");
    setFormFirNumber("");
    setFormInformingDoctor("");
    setFormTreatingDoctorId("");
    setFormRemarks("");
    setFormStatus("Open");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  // Open editing modal
  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select an MLC entry to edit.");
      return;
    }
    const entry = mlcEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormAge(entry.age ?? "");
    setFormGender(entry.gender || "Male");
    setFormPatientSearch(entry.patientName);
    setFormAdmissionDateTime(
      entry.admissionDateTime ? entry.admissionDateTime.slice(0, 16) : "",
    );
    setFormInjuryType(entry.injuryType);
    setFormBroughtBy(entry.broughtBy);
    setFormPoliceStation(entry.policeStationName || "");
    setFormFirNumber(entry.firNumber || "");
    setFormInformingDoctor(entry.informingDoctor || "");
    setFormTreatingDoctorId(entry.treatingDoctorId || "");
    setFormRemarks(entry.remarks || "");
    setFormStatus(entry.status);

    setDialogOpen(true);
  };

  // Save entry (Create or Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (!formAdmissionDateTime) {
      toast.error("Please select date & time of admission.");
      return;
    }

    const matchedDoc = doctors.find(
      (d) => d.doctorCode === formTreatingDoctorId,
    );
    const treatingDoctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      patientNo: formPatientNo,
      patientName: formPatientName,
      age: formAge ? Number(formAge) : null,
      gender: formGender,
      admissionDateTime: formAdmissionDateTime,
      injuryType: formInjuryType,
      broughtBy: formBroughtBy,
      policeStationName: formPoliceStation || null,
      firNumber: formFirNumber || null,
      informingDoctor: formInformingDoctor || null,
      treatingDoctorId: formTreatingDoctorId || null,
      treatingDoctorName: treatingDoctorName || null,
      remarks: formRemarks || null,
      status: formStatus,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateMlcEntry(selectedRowId, payload, code);
        toast.success("Medico-Legal Case entry updated successfully.");
      } else {
        await receptionApi.createMlcEntry(payload, code);
        toast.success("New Medico-Legal Case entry recorded successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save MLC entry.");
    }
  };

  // Delete entry
  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select an MLC entry to delete.");
      return;
    }
    if (
      !confirm("Are you sure you want to delete this Medico-Legal Case entry?")
    ) {
      return;
    }

    try {
      await receptionApi.deleteMlcEntry(selectedRowId, code);
      toast.success("Medico-Legal Case record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete MLC entry.");
    }
  };

  // View details modal
  const handleViewDetails = (entry: MlcRegisterResponse) => {
    setViewingEntry(entry);
    setDetailOpen(true);
  };

  // Print Case Report Certificate
  const handlePrintSlip = (entry: MlcRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const formattedDate = new Date(entry.admissionDateTime).toLocaleString(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );

    const docName = entry.treatingDoctorName || "—";

    const htmlContent = `
      <html>
        <head>
          <title>MLC Report - ${entry.mlcNo}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 2rem; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { font-size: 1.75rem; margin: 0; text-transform: uppercase; color: #b91c1c; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #6b7280; font-weight: 500; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
            .badge-danger { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
            .field { border-bottom: 1px solid #f3f4f6; padding: 0.5rem 0; font-size: 0.875rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
            .field-value { margin-top: 0.25rem; font-size: 0.95rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .remarks { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-top: 0.5rem; font-style: italic; }
            .signatures { margin-top: 4rem; display: flex; justify-content: space-between; font-size: 0.875rem; }
            .sig-line { border-top: 1px solid #9ca3af; width: 220px; text-align: center; padding-top: 0.5rem; font-weight: 600; margin-top: 3rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medico-Legal Case Certificate</h1>
            <p>INSTITUTIONAL ACCREDITED RECORD &bull; ACCIDENT / EMERGENCY WING</p>
            <div style="margin-top: 1rem;">
              <span class="badge badge-danger">MLC Record &bull; ${entry.mlcNo}</span>
            </div>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">MLC Number</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #b91c1c;">${entry.mlcNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Case Status</div>
              <div class="field-value" style="font-weight: bold; color: ${entry.status === "Open" ? "#d97706" : "#059669"}">${entry.status}</div>
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
              <div class="field-label">Age / Gender</div>
              <div class="field-value">${entry.age ?? "N/A"} Yrs / ${entry.gender}</div>
            </div>
            <div class="field">
              <div class="field-label">Date & Time of Admission</div>
              <div class="field-value">${formattedDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Type of Injury</div>
              <div class="field-value" style="font-weight: 700;">${entry.injuryType}</div>
            </div>
            <div class="field">
              <div class="field-label">Brought By</div>
              <div class="field-value">${entry.broughtBy}</div>
            </div>
            <div class="field">
              <div class="field-label">Police Station Jurisdiction</div>
              <div class="field-value">${entry.policeStationName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">FIR Number</div>
              <div class="field-value">${entry.firNumber || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Informing Doctor</div>
              <div class="field-value">${entry.informingDoctor || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Treating Doctor</div>
              <div class="field-value">${docName}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Clinical Remarks & Injuries Description</div>
              <div class="remarks">${entry.remarks || "No clinical remarks recorded."}</div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Informing / Treating Medical Officer</div>
            </div>
            <div>
              <div class="sig-line">Receiving Police Representative</div>
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

  // Client side filtering for table
  const filteredMlcEntries = mlcEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.mlcNo.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      (e.firNumber || "").toLowerCase().includes(q);
    return matchesSearch;
  });

  const paginatedMlcEntries = filteredMlcEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="mlc.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              MLC Patients (Medico-Legal Cases)
            </h1>
            <p className="text-xs text-muted-foreground">
              Official ledger for recording, updating, and exporting
              institutional Medico-Legal Cases
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <span>
              Total Cases:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredMlcEntries.length}
              </b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              Open Cases:{" "}
              <b className="text-amber-500">
                {filteredMlcEntries.filter((e) => e.status === "Open").length}
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
                className="h-8.5 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add MLC Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditEntry}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Entry
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const entry = mlcEntries.find((e) => e.id === selectedRowId);
                  if (entry) handleViewDetails(entry);
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
                  const entry = mlcEntries.find((e) => e.id === selectedRowId);
                  if (entry) handleViewDetails(entry);
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
                Case Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cases</SelectItem>
                  <SelectItem value="Open">Open Cases</SelectItem>
                  <SelectItem value="Closed">Closed Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Injury Type
              </Label>
              <Select value={injuryFilter} onValueChange={setInjuryFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Injury Types</SelectItem>
                  <SelectItem value="Assault">Assault</SelectItem>
                  <SelectItem value="Road Accident">Road Accident</SelectItem>
                  <SelectItem value="Poisoning">Poisoning</SelectItem>
                  <SelectItem value="Burns">Burns</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Case Logs
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search MLC No, Patient Name, ID, FIR..."
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
                setStatusFilter("ALL");
                setInjuryFilter("ALL");
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
                <th className="px-3.5 py-3">MLC Number</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">Admission Time</th>
                <th className="px-3.5 py-3">Injury Type</th>
                <th className="px-3.5 py-3">Brought By</th>
                <th className="px-3.5 py-3">FIR Number</th>
                <th className="px-3.5 py-3">Treating Doctor</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedMlcEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedDate = new Date(
                  row.admissionDateTime,
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
                        ? "bg-rose-500/10 hover:bg-rose-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {row.mlcNo}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.patientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {row.patientNo} &bull; {row.age ?? "N/A"} Yrs
                          &bull; {row.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {formattedDate}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-bold">{row.injuryType}</span>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400">
                      {row.broughtBy}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-zinc-500">
                      {row.firNumber || "—"}
                    </td>
                    <td className="px-3.5 py-3 text-foreground font-semibold">
                      {row.treatingDoctorName || "—"}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.status === "Open"
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
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
                          title="View Detail Case Report"
                          onClick={() => handleViewDetails(row)}
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Print MLC Certificate"
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

              {filteredMlcEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching Medico-Legal registers..."
                          : "No Medico-Legal Cases logged yet"}
                      </span>
                      <span className="text-[10px] text-zinc-400 max-w-sm">
                        Use the "Add MLC Record" form to log official cases,
                        link registered patients, and record accident details.
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
          totalPages={Math.ceil(filteredMlcEntries.length / pageSize)}
          totalElements={filteredMlcEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>

        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
          <span>
            Click row once to select for Edit / Trash operations. Details &
            Print available under Actions.
          </span>
          <span>Medico-Legal Case Registry Module v1.0</span>
        </div>
      </div>

      {/* MLC Registration Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              {selectedRowId !== null
                ? "Modify MLC Case Details"
                : "Record New Medico-Legal Case"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* SECTION 1 — Patient Lookup */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-rose-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
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
                  {/* Suggestions Dropdown */}
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
                            ID: {p.patientNo} &bull;{" "}
                            {p.phone || p.alternativeNum || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Linked ID
                  </Label>
                  <Input
                    readOnly
                    placeholder="Auto-linked"
                    value={formPatientNo}
                    className="h-8.5 text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900/50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Age
                  </Label>
                  <Input
                    readOnly
                    placeholder="Auto-linked"
                    value={formAge}
                    className="h-8.5 text-xs bg-zinc-100 dark:bg-zinc-900/50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Gender
                  </Label>
                  <Input
                    readOnly
                    placeholder="Auto-linked"
                    value={formGender}
                    className="h-8.5 text-xs bg-zinc-100 dark:bg-zinc-900/50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Admission Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formAdmissionDateTime}
                    onChange={(e) => setFormAdmissionDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2 — Legal & Injury Info */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-rose-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Legal & Incident Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Type of Injury *
                  </Label>
                  <Select
                    value={formInjuryType}
                    onValueChange={setFormInjuryType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Injury" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Road Accident">
                        Road Accident (RTA)
                      </SelectItem>
                      <SelectItem value="Assault">Assault</SelectItem>
                      <SelectItem value="Poisoning">Poisoning</SelectItem>
                      <SelectItem value="Burns">Burns</SelectItem>
                      <SelectItem value="Other">Other Injuries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Brought By *
                  </Label>
                  <Select
                    value={formBroughtBy}
                    onValueChange={setFormBroughtBy}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Brought By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Police">Police</SelectItem>
                      <SelectItem value="Ambulance">Ambulance (EMS)</SelectItem>
                      <SelectItem value="Self">Self / Walk-in</SelectItem>
                      <SelectItem value="Relative">
                        Relative / Friend
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Police Station Name
                  </Label>
                  <Input
                    placeholder="Station Jurisdiction"
                    value={formPoliceStation}
                    onChange={(e) => setFormPoliceStation(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    FIR Number
                  </Label>
                  <Input
                    placeholder="FIR/Entry Code"
                    value={formFirNumber}
                    onChange={(e) => setFormFirNumber(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Informing Doctor
                  </Label>
                  <Input
                    placeholder="Dr. Name"
                    value={formInformingDoctor}
                    onChange={(e) => setFormInformingDoctor(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Treating Doctor *
                  </Label>
                  <Select
                    value={formTreatingDoctorId}
                    onValueChange={setFormTreatingDoctorId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc: any) => (
                        <SelectItem key={doc.doctorCode} value={doc.doctorCode}>
                          Dr. {doc.firstName} {doc.lastName || ""} (
                          {doc.departmentName ||
                            doc.specialization ||
                            "General Medicine"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Case status *
                  </Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open Case</SelectItem>
                      <SelectItem value="Closed">
                        Closed / Discharged Case
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Incident Remarks & description
                  </Label>
                  <Textarea
                    placeholder="Describe external injuries, details of assault/accident..."
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Form Footer Buttons */}
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
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Save Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MLC Detail View Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          {viewingEntry && (
            <>
              <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-row items-center justify-between">
                <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Medico-Legal Case File — {viewingEntry.mlcNo}
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
                      MLC Number
                    </span>
                    <span className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                      {viewingEntry.mlcNo}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Case Status
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        viewingEntry.status === "Open"
                          ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {viewingEntry.status}
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
                      Demographics
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.age ?? "N/A"} Yrs / {viewingEntry.gender}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Admission Date & Time
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {new Date(
                        viewingEntry.admissionDateTime,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Injury Type
                    </span>
                    <span className="font-bold block">
                      {viewingEntry.injuryType}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Brought By
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.broughtBy}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      FIR Details / Station
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.firNumber || "No FIR"} &bull;{" "}
                      {viewingEntry.policeStationName || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Informing Doctor
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.informingDoctor || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Treating Doctor
                    </span>
                    <span className="font-semibold block">
                      {viewingEntry.treatingDoctorName || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block font-sans">
                      Incident & Injury Description
                    </span>
                    <p className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 font-serif leading-relaxed italic">
                      {viewingEntry.remarks || "No descriptions logged."}
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

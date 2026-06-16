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
  DeathRegisterResponse,
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
  Skull,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function DeathRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [deathEntries, setDeathEntries] = useState<DeathRegisterResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<DeathRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [mannerFilter, setMannerFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formAge, setFormAge] = useState<number | "">("");
  const [formGender, setFormGender] = useState("Male");
  const [formIpNo, setFormIpNo] = useState("");
  const [formWardBed, setFormWardBed] = useState("");
  const [formDeathDateTime, setFormDeathDateTime] = useState("");
  const [formPrimaryCause, setFormPrimaryCause] = useState("");
  const [formSecondaryCause, setFormSecondaryCause] = useState("");
  const [formManner, setFormManner] = useState("Natural");
  const [formCertifyingDoctorId, setFormCertifyingDoctorId] = useState("");
  const [formMlcLinked, setFormMlcLinked] = useState("No");
  const [formMlcNo, setFormMlcNo] = useState("");
  const [formHandoverStatus, setFormHandoverStatus] = useState("Pending");
  const [formHandoverToName, setFormHandoverToName] = useState("");
  const [formHandoverToRelationship, setFormHandoverToRelationship] =
    useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deathList, patList, docList] = await Promise.all([
        receptionApi.getDeathEntries(
          code,
          mannerFilter !== "ALL" ? mannerFilter : undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setDeathEntries(Array.isArray(deathList) ? deathList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Death register logs");
    } finally {
      setLoading(false);
    }
  }, [code, mannerFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, mannerFilter]);

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
    setFormIpNo("");
    setFormWardBed("");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const nowStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormDeathDateTime(nowStr);

    setFormPrimaryCause("");
    setFormSecondaryCause("");
    setFormManner("Natural");
    setFormCertifyingDoctorId("");
    setFormMlcLinked("No");
    setFormMlcNo("");
    setFormHandoverStatus("Pending");
    setFormHandoverToName("");
    setFormHandoverToRelationship("");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select a Death record to edit.");
      return;
    }
    const entry = deathEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormPatientSearch(entry.patientName);
    setFormAge(entry.age ?? "");
    setFormGender(entry.gender || "Male");
    setFormIpNo(entry.ipNo || "");
    setFormWardBed(entry.wardBed || "");
    setFormDeathDateTime(
      entry.deathDateTime ? entry.deathDateTime.slice(0, 16) : "",
    );
    setFormPrimaryCause(entry.primaryCause);
    setFormSecondaryCause(entry.secondaryCause || "");
    setFormManner(entry.manner);
    setFormCertifyingDoctorId(entry.certifyingDoctorId || "");
    setFormMlcLinked(entry.mlcLinked || "No");
    setFormMlcNo(entry.mlcNo || "");
    setFormHandoverStatus(entry.handoverStatus || "Pending");
    setFormHandoverToName(entry.handoverToName || "");
    setFormHandoverToRelationship(entry.handoverToRelationship || "");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (!formPrimaryCause.trim()) {
      toast.error("Please enter the primary cause of death.");
      return;
    }
    if (!formDeathDateTime) {
      toast.error("Please enter date & time of death.");
      return;
    }

    const matchedPat = patients.find((p) => p.patientNo === formPatientNo);
    if (matchedPat && matchedPat.createdAt) {
      const admissionStr = matchedPat.createdAt.split("T")[0];
      const deathStr = formDeathDateTime.split("T")[0];
      const admission = new Date(admissionStr);
      const death = new Date(deathStr);
      const diffTime = death.getTime() - admission.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        toast.error("IPD patient stay cannot be negative.");
        return;
      }
    }

    const matchedDoc = doctors.find(
      (d) => d.doctorCode === formCertifyingDoctorId,
    );
    const certifyingDoctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      patientNo: formPatientNo,
      patientName: formPatientName,
      age: formAge === "" ? null : Number(formAge),
      gender: formGender || null,
      ipNo: formIpNo || null,
      wardBed: formWardBed || null,
      deathDateTime: formDeathDateTime,
      primaryCause: formPrimaryCause,
      secondaryCause: formSecondaryCause || null,
      manner: formManner,
      certifyingDoctorId: formCertifyingDoctorId || null,
      certifyingDoctorName: certifyingDoctorName || null,
      mlcLinked: formMlcLinked,
      mlcNo: formMlcLinked === "Yes" ? formMlcNo : null,
      handoverStatus: formHandoverStatus,
      handoverToName:
        formHandoverStatus === "Handed Over" ? formHandoverToName : null,
      handoverToRelationship:
        formHandoverStatus === "Handed Over"
          ? formHandoverToRelationship
          : null,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateDeathEntry(selectedRowId, payload, code);
        toast.success("Death register entry updated successfully.");
      } else {
        await receptionApi.createDeathEntry(payload, code);
        toast.success("New Death entry logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Death entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select a Death record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this Death entry?")) {
      return;
    }

    try {
      await receptionApi.deleteDeathEntry(selectedRowId, code);
      toast.success("Death record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete Death entry.");
    }
  };

  const handlePrintSlip = (entry: DeathRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const deathTime = new Date(entry.deathDateTime).toLocaleString();

    const htmlContent = `
      <html>
        <head>
          <title>Death Report - ${entry.deathId}</title>
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
            .block-text { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 1rem; font-size: 0.95rem; font-family: serif; }
            .legal-text { font-size: 0.8rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 2rem; margin-top: 4rem; }
            .signatures { margin-top: 6rem; display: flex; justify-content: space-between; font-size: 0.9rem; }
            .sig-line { border-top: 1px solid #111827; width: 250px; text-align: center; padding-top: 0.5rem; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Certificate of Death / Death registry</h1>
            <p>Official Vital Records System &bull; Record ID: ${entry.deathId}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">Registry Case ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #ef4444;">${entry.deathId}</div>
            </div>
            <div class="field">
              <div class="field-label">Manner of Death</div>
              <div class="field-value" style="font-weight: 700;">${entry.manner}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient ID (Linked)</div>
              <div class="field-value" style="font-family: monospace;">${entry.patientNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Deceased Name</div>
              <div class="field-value" style="font-weight: 700;">${entry.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">Age & Gender</div>
              <div class="field-value">${entry.age || "—"} Years / ${entry.gender || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">IP Number</div>
              <div class="field-value">${entry.ipNo || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Date & Time of Death</div>
              <div class="field-value" style="font-weight: bold;">${deathTime}</div>
            </div>
            <div class="field">
              <div class="field-label">Ward / Bed Room</div>
              <div class="field-value">${entry.wardBed || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Certifying Physician</div>
              <div class="field-value">${entry.certifyingDoctorName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">MLC Status</div>
              <div class="field-value">${entry.mlcLinked === "Yes" ? `MLC Linked (No. ${entry.mlcNo})` : "Non-MLC Case"}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Primary Cause of Death</div>
              <div class="block-text" style="font-weight: bold; font-size: 1.05rem;">${entry.primaryCause}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Secondary / Contributory Causes</div>
              <div class="block-text">${entry.secondaryCause || "No secondary causes listed."}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Body Handover Details</div>
              <div class="field-value">
                Status: <strong>${entry.handoverStatus}</strong> 
                ${entry.handoverStatus === "Handed Over" ? `&bull; Receiver: ${entry.handoverToName} (${entry.handoverToRelationship})` : ""}
              </div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">Receiving Relative Signature</div>
            <div class="sig-line">Certifying Medical Officer</div>
          </div>

          <div class="legal-text">
            This certificate serves as the official clinical declaration of death for hospital records. It must be registered with the municipal vital statistics registry within 21 days.
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

  const filteredDeathEntries = deathEntries.filter((e) => {
    const matchedPat = patients.find((p) => p.patientNo === e.patientNo);
    if (matchedPat && matchedPat.createdAt && e.deathDateTime) {
      const admissionStr = matchedPat.createdAt.split("T")[0];
      const deathStr = e.deathDateTime.split("T")[0];
      const admission = new Date(admissionStr);
      const death = new Date(deathStr);
      const diffTime = death.getTime() - admission.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      e.deathId.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      e.primaryCause.toLowerCase().includes(q)
    );
  });

  const paginatedDeathEntries = filteredDeathEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="death.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/20 dark:bg-zinc-700/20 flex items-center justify-center shadow-inner">
            <Skull className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Death Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Official hospital registry of clinical deaths, cause certificates,
              MLC associations, and body releases
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Skull className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>
              Total Logged:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredDeathEntries.length}
              </b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              MLC Cases:{" "}
              <b className="text-rose-500 font-bold">
                {
                  filteredDeathEntries.filter((e) => e.mlcLinked === "Yes")
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
                <Plus className="w-4 h-4" /> Log Death Entry
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
                  const entry = deathEntries.find(
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
                  const entry = deathEntries.find(
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
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Manner of Death
              </Label>
              <Select value={mannerFilter} onValueChange={setMannerFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Manners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Manners</SelectItem>
                  <SelectItem value="Natural">Natural</SelectItem>
                  <SelectItem value="Accidental">Accidental</SelectItem>
                  <SelectItem value="Homicide">Homicide</SelectItem>
                  <SelectItem value="Suicide">Suicide</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Death Records
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Registry ID, Patient Name, ID, Primary Cause..."
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
                setMannerFilter("ALL");
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
                <th className="px-3.5 py-3">Registry ID</th>
                <th className="px-3.5 py-3">Deceased Details</th>
                <th className="px-3.5 py-3">Age & Gender</th>
                <th className="px-3.5 py-3">Date & Time of Death</th>
                <th className="px-3.5 py-3">Primary Cause</th>
                <th className="px-3.5 py-3">Manner</th>
                <th className="px-3.5 py-3 text-center">MLC Status</th>
                <th className="px-3.5 py-3 text-center">Handover</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedDeathEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedTime = new Date(
                  row.deathDateTime,
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
                      {row.deathId}
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
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                      {row.age !== undefined && row.age !== null
                        ? `${row.age} Yrs`
                        : "—"}{" "}
                      / {row.gender || "—"}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {row.primaryCause}
                    </td>
                    <td className="px-3.5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 font-bold uppercase rounded border ${
                          row.manner === "Natural"
                            ? "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                      >
                        {row.manner}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      {row.mlcLinked === "Yes" ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] px-1.5 font-bold rounded"
                        >
                          MLC: {row.mlcNo || "Linked"}
                        </Badge>
                      ) : (
                        <span className="text-zinc-400 text-[10px]">
                          Non-MLC
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.handoverStatus === "Handed Over"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                        }`}
                      >
                        {row.handoverStatus}
                      </Badge>
                    </td>
                    <td
                      className="px-3.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="View Dossier details"
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
                          title="Print Death slip"
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

              {filteredDeathEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching death records..."
                          : "No Death records registered yet"}
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
          totalPages={Math.ceil(filteredDeathEntries.length / pageSize)}
          totalElements={filteredDeathEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Death Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Skull className="w-4 h-4 text-zinc-700 dark:text-zinc-300 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Death Registry Record"
                : "Register New Death Record"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient Linking */}
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
                      placeholder="Search name, patient number..."
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
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Age at Death *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Age (Yrs)"
                    value={formAge}
                    onChange={(e) =>
                      setFormAge(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Gender *
                  </Label>
                  <Select value={formGender} onValueChange={setFormGender}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Ward / Bed Room
                  </Label>
                  <Input
                    placeholder="Ward / Bed"
                    value={formWardBed}
                    onChange={(e) => setFormWardBed(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Demise Information */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Clinical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Date & Time of Demise *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formDeathDateTime}
                    onChange={(e) => setFormDeathDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Manner of Death *
                  </Label>
                  <Select value={formManner} onValueChange={setFormManner}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Manner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Accidental">Accidental</SelectItem>
                      <SelectItem value="Homicide">Homicide</SelectItem>
                      <SelectItem value="Suicide">Suicide</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Certifying Practitioner
                  </Label>
                  <Select
                    value={formCertifyingDoctorId}
                    onValueChange={setFormCertifyingDoctorId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Doctor" />
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
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Primary Cause of Death *
                  </Label>
                  <Input
                    placeholder="Immediate Cause of Demise"
                    value={formPrimaryCause}
                    onChange={(e) => setFormPrimaryCause(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Secondary Cause(s)
                  </Label>
                  <Input
                    placeholder="Contributory clinical conditions"
                    value={formSecondaryCause}
                    onChange={(e) => setFormSecondaryCause(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* MLC Linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION C — Medico-Legal Case Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    MLC Case Association *
                  </Label>
                  <Select
                    value={formMlcLinked}
                    onValueChange={setFormMlcLinked}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="MLC Linked?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">
                        No (Clinical / Natural)
                      </SelectItem>
                      <SelectItem value="Yes">
                        Yes (Medico-Legal Case)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formMlcLinked === "Yes" && (
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-[9px] uppercase font-bold text-zinc-500">
                      MLC Number *
                    </Label>
                    <Input
                      placeholder="Associated MLC reference code (e.g. MLC-2026-0005)"
                      value={formMlcNo}
                      onChange={(e) => setFormMlcNo(e.target.value)}
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Handover release info */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION D — Body Handover / Release
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Handover Status *
                  </Label>
                  <Select
                    value={formHandoverStatus}
                    onValueChange={setFormHandoverStatus}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">
                        Pending (In Mortuary)
                      </SelectItem>
                      <SelectItem value="Handed Over">
                        Handed Over / Released
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formHandoverStatus === "Handed Over" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-zinc-500">
                        Receiver Name *
                      </Label>
                      <Input
                        placeholder="Relative / Police Name"
                        value={formHandoverToName}
                        onChange={(e) => setFormHandoverToName(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-zinc-500">
                        Relationship *
                      </Label>
                      <Input
                        placeholder="Relationship (e.g. Son, Daughter, Police Officer)"
                        value={formHandoverToRelationship}
                        onChange={(e) =>
                          setFormHandoverToRelationship(e.target.value)
                        }
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Additional Remarks / Mortuary Notes
              </Label>
              <Textarea
                rows={3}
                placeholder="Log special notes, personal belongings released, police statements or cremation instructions..."
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8.5 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                Save Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail View Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Death Dossier File — {viewingEntry?.deathId}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Registry Death ID
                  </h4>
                  <p className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {viewingEntry.deathId}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Manner of Death
                  </h4>
                  <Badge
                    variant="outline"
                    className="bg-zinc-500/10 text-zinc-700 border-zinc-500/20 text-[10px] px-2 font-bold uppercase rounded mt-0.5 dark:text-zinc-300"
                  >
                    {viewingEntry.manner}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Deceased Name
                  </h4>
                  <p className="text-sm font-bold text-foreground">
                    {viewingEntry.patientName}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Deceased ID & IP No.
                  </h4>
                  <p className="text-sm font-medium font-mono text-zinc-700 dark:text-zinc-300">
                    {viewingEntry.patientNo}{" "}
                    {viewingEntry.ipNo ? `(IP: ${viewingEntry.ipNo})` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Age / Gender
                  </h4>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {viewingEntry.age !== undefined && viewingEntry.age !== null
                      ? `${viewingEntry.age} Yrs`
                      : "—"}{" "}
                    / {viewingEntry.gender || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Date & Time of Demise
                  </h4>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {new Date(viewingEntry.deathDateTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Ward / Bed Room
                  </h4>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {viewingEntry.wardBed || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Certifying Physician
                  </h4>
                  <p className="text-sm font-semibold text-foreground">
                    {viewingEntry.certifyingDoctorName || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    MLC Linked Status
                  </h4>
                  <p className="text-sm font-medium text-zinc-750 text-rose-500 font-bold">
                    {viewingEntry.mlcLinked === "Yes"
                      ? `Linked (MLC No: ${viewingEntry.mlcNo})`
                      : "Non-MLC"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Body Handover Release
                  </h4>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {viewingEntry.handoverStatus}{" "}
                    {viewingEntry.handoverStatus === "Handed Over"
                      ? `(Released to: ${viewingEntry.handoverToName} - ${viewingEntry.handoverToRelationship})`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Primary Cause of Death
                  </h4>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {viewingEntry.primaryCause}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Secondary / Contributory Causes
                  </h4>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {viewingEntry.secondaryCause ||
                      "No secondary causes listed."}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                  Mortuary / Release Notes
                </h4>
                <div className="mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 rounded-lg p-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {viewingEntry.remarks ||
                    "No additional comments or clinical remarks registered."}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePrintSlip(viewingEntry)}
                  className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 gap-1.5"
                >
                  <Printer className="w-4 h-4 text-zinc-700 dark:text-zinc-350" />{" "}
                  Print Certificate
                </Button>
                <Button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="h-8.5 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  ConsentRegisterResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Edit,
  FileCheck,
  FileText,
  Info,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ConsentRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [consentEntries, setConsentEntries] = useState<
    ConsentRegisterResponse[]
  >([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<ConsentRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formIpOpNo, setFormIpOpNo] = useState("");
  const [formProcedureName, setFormProcedureName] = useState("");
  const [formConsentType, setFormConsentType] = useState("Surgical");
  const [formSignedBy, setFormSignedBy] = useState("Patient");
  const [formGuardianName, setFormGuardianName] = useState("");
  const [formRelationship, setFormRelationship] = useState("");
  const [formDoctorId, setFormDoctorId] = useState("");
  const [formWitnessName, setFormWitnessName] = useState("");
  const [formConsentDateTime, setFormConsentDateTime] = useState("");
  const [formDocumentUrl, setFormDocumentUrl] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [consentList, patList, docList] = await Promise.all([
        receptionApi.getConsentEntries(
          code,
          typeFilter !== "ALL" ? typeFilter : undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setConsentEntries(Array.isArray(consentList) ? consentList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Consent register logs");
    } finally {
      setLoading(false);
    }
  }, [code, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, typeFilter]);

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
    setFormIpOpNo("");
    setFormProcedureName("");
    setFormConsentType("Surgical");
    setFormSignedBy("Patient");
    setFormGuardianName("");
    setFormRelationship("");
    setFormDoctorId("");
    setFormWitnessName("");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const nowStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormConsentDateTime(nowStr);

    setFormDocumentUrl("");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select a Consent entry to edit.");
      return;
    }
    const entry = consentEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormPatientSearch(entry.patientName);
    setFormIpOpNo(entry.ipOpNo || "");
    setFormProcedureName(entry.procedureName);
    setFormConsentType(entry.consentType);
    setFormSignedBy(entry.signedBy);
    setFormGuardianName(entry.guardianName || "");
    setFormRelationship(entry.relationship || "");
    setFormDoctorId(entry.doctorId || "");
    setFormWitnessName(entry.witnessName || "");
    setFormConsentDateTime(
      entry.consentDateTime ? entry.consentDateTime.slice(0, 16) : "",
    );
    setFormDocumentUrl(entry.documentUrl || "");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mock storage setting a document URL
      setFormDocumentUrl("/documents/consent_stub.pdf");
      toast.success("Document attached successfully (Mock Upload)");
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (!formProcedureName.trim()) {
      toast.error("Please enter procedure / treatment name.");
      return;
    }
    if (!formConsentDateTime) {
      toast.error("Please enter date & time of consent.");
      return;
    }

    const matchedDoc = doctors.find((d) => d.doctorCode === formDoctorId);
    const doctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      patientNo: formPatientNo,
      patientName: formPatientName,
      ipOpNo: formIpOpNo || null,
      procedureName: formProcedureName,
      consentType: formConsentType,
      signedBy: formSignedBy,
      guardianName: formSignedBy === "Guardian" ? formGuardianName : null,
      relationship: formSignedBy === "Guardian" ? formRelationship : null,
      doctorId: formDoctorId || null,
      doctorName: doctorName || null,
      witnessName: formWitnessName || null,
      consentDateTime: formConsentDateTime,
      documentUrl: formDocumentUrl || null,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateConsentEntry(selectedRowId, payload, code);
        toast.success("Consent entry updated successfully.");
      } else {
        await receptionApi.createConsentEntry(payload, code);
        toast.success("New Consent record added successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Consent entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select a Consent record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this Consent record?")) {
      return;
    }

    try {
      await receptionApi.deleteConsentEntry(selectedRowId, code);
      toast.success("Consent record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete Consent entry.");
    }
  };

  const handlePrintSlip = (entry: ConsentRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const consentTime = new Date(entry.consentDateTime).toLocaleString();

    const htmlContent = `
      <html>
        <head>
          <title>Consent Form - ${entry.consentNo}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 2.5rem; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { font-size: 1.75rem; margin: 0; text-transform: uppercase; color: #4f46e5; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #6b7280; font-weight: 500; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
            .field { border-bottom: 1px solid #f3f4f6; padding: 0.5rem 0; font-size: 0.875rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; }
            .field-value { margin-top: 0.25rem; font-size: 0.95rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .block-text { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; font-size: 0.9rem; font-style: italic; }
            .legal-text { border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 1rem; background-color: #fafafa; font-size: 0.8rem; color: #374151; margin-bottom: 2rem; }
            .signatures { margin-top: 5rem; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; font-size: 0.875rem; }
            .sig-line { border-top: 1px solid #9ca3af; text-align: center; padding-top: 0.5rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Informed Consent Agreement</h1>
            <p>Official Hospital Registry &bull; Consent No: ${entry.consentNo}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">Consent Certificate Number</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #4f46e5;">${entry.consentNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Consent Type</div>
              <div class="field-value" style="font-weight: 700;">${entry.consentType} Consent</div>
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
              <div class="field-label">IP/OP Number</div>
              <div class="field-value">${entry.ipOpNo || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Procedure / Treatment Name</div>
              <div class="field-value" style="font-weight: bold;">${entry.procedureName}</div>
            </div>
            <div class="field">
              <div class="field-label">Signed By</div>
              <div class="field-value">${entry.signedBy} ${entry.signedBy === "Guardian" ? `(${entry.guardianName} - ${entry.relationship})` : ""}</div>
            </div>
            <div class="field">
              <div class="field-label">Date & Time of Signing</div>
              <div class="field-value">${consentTime}</div>
            </div>
            <div class="field">
              <div class="field-label">Treating Practitioner</div>
              <div class="field-value">${entry.doctorName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Witness Name</div>
              <div class="field-value">${entry.witnessName || "—"}</div>
            </div>
          </div>

          <div class="legal-text">
            <strong>Statement of Consent:</strong> I hereby authorize and direct the clinical staff and assigned doctors to perform the procedure or treatment named above. The nature and purpose of this procedure, possible alternatives, and potential complications have been fully explained to me. I sign this document voluntarily to signify my understanding and informed agreement.
          </div>
          
          <div class="field full-width" style="margin-bottom: 2rem;">
            <div class="field-label">Special Directives / Remarks</div>
            <div class="block-text">${entry.remarks || "No additional directives logged."}</div>
          </div>

          <div class="signatures">
            <div class="sig-line">Signee Signature / Thumb Impression</div>
            <div class="sig-line">Witness Signature</div>
            <div class="sig-line">Doctor / Specialist Signature</div>
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

  const filteredConsentEntries = consentEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.consentNo.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      e.procedureName.toLowerCase().includes(q)
    );
  });

  const paginatedConsentEntries = filteredConsentEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="consent.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shadow-inner">
            <FileCheck className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Consent Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Official archive of informed surgical, anesthesia, and medical
              treatment consents
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-500" />
            <span>
              Total Signed Consents:{" "}
              <b className="text-indigo-600 dark:text-indigo-400">
                {filteredConsentEntries.length}
              </b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              Surgical Consents:{" "}
              <b className="text-indigo-500 font-bold">
                {
                  filteredConsentEntries.filter(
                    (e) => e.consentType === "Surgical",
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
                className="h-8.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Consent Form
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
                  const entry = consentEntries.find(
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
                  const entry = consentEntries.find(
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
                Consent Type
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Surgical">Surgical</SelectItem>
                  <SelectItem value="Anaesthesia">Anaesthesia</SelectItem>
                  <SelectItem value="Blood Transfusion">
                    Blood Transfusion
                  </SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Consent Records
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Consent No, Patient Name, ID, Procedure..."
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
                <th className="px-3.5 py-3">Consent No.</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">Procedure / Treatment</th>
                <th className="px-3.5 py-3">Consent Type</th>
                <th className="px-3.5 py-3">Signed By</th>
                <th className="px-3.5 py-3">Doctor</th>
                <th className="px-3.5 py-3">Consent Date</th>
                <th className="px-3.5 py-3 text-center">Document</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedConsentEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedTime = new Date(
                  row.consentDateTime,
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
                        ? "bg-indigo-500/10 hover:bg-indigo-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {row.consentNo}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.patientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {row.patientNo}{" "}
                          {row.ipOpNo ? `&bull; IP/OP: ${row.ipOpNo}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      {row.procedureName}
                    </td>
                    <td className="px-3.5 py-3">
                      <Badge
                        variant="outline"
                        className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-[9px] px-1.5 font-bold uppercase rounded"
                      >
                        {row.consentType}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400">
                      <div className="flex flex-col">
                        <span>{row.signedBy}</span>
                        {row.signedBy === "Guardian" && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {row.guardianName} ({row.relationship})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-foreground">
                      {row.doctorName || "—"}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-500 font-mono whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td
                      className="px-3.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.documentUrl ? (
                        <a
                          href={row.documentUrl}
                          download="consent_stub.pdf"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 transition-all"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </a>
                      ) : (
                        <span className="text-zinc-400 italic">No File</span>
                      )}
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
                          title="Print Consent certificate"
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

              {filteredConsentEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-indigo-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching consent records..."
                          : "No Consent forms recorded yet"}
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
          totalPages={Math.ceil(filteredConsentEntries.length / pageSize)}
          totalElements={filteredConsentEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Consent Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-500 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Consent Ledger Record"
                : "Record Informed Consent Agreement"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient Linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-indigo-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
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
                    IP/OP No.
                  </Label>
                  <Input
                    placeholder="Case Registry Number"
                    value={formIpOpNo}
                    onChange={(e) => setFormIpOpNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Consent Details */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-indigo-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Consent Details & Procedure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Procedure / Treatment Name *
                  </Label>
                  <Input
                    placeholder="Clinical Procedure requiring Consent"
                    value={formProcedureName}
                    onChange={(e) => setFormProcedureName(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Consent Category *
                  </Label>
                  <Select
                    value={formConsentType}
                    onValueChange={setFormConsentType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Consent Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Surgical">Surgical</SelectItem>
                      <SelectItem value="Anaesthesia">Anaesthesia</SelectItem>
                      <SelectItem value="Blood Transfusion">
                        Blood Transfusion
                      </SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Consent Signed By *
                  </Label>
                  <Select value={formSignedBy} onValueChange={setFormSignedBy}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Signed By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patient">Patient</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formSignedBy === "Guardian" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-zinc-500">
                        Guardian Name *
                      </Label>
                      <Input
                        placeholder="Name of Guardian"
                        value={formGuardianName}
                        onChange={(e) => setFormGuardianName(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-zinc-500">
                        Relationship *
                      </Label>
                      <Input
                        placeholder="Relationship (e.g. Spouse, Parent)"
                        value={formRelationship}
                        onChange={(e) => setFormRelationship(e.target.value)}
                        className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Treating Practitioner
                  </Label>
                  <Select value={formDoctorId} onValueChange={setFormDoctorId}>
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
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Witness Name
                  </Label>
                  <Input
                    placeholder="Name of Witness"
                    value={formWitnessName}
                    onChange={(e) => setFormWitnessName(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Consent Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formConsentDateTime}
                    onChange={(e) => setFormConsentDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Scan Copy Upload
                  </Label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 h-8.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-[10px] font-semibold text-zinc-500">
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {formDocumentUrl ? "Doc Attached" : "Upload Image/PDF"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleMockUpload}
                      />
                    </label>
                    {formDocumentUrl && (
                      <span className="text-[10px] text-emerald-500 font-bold font-mono">
                        Mock OK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Additional Remarks / Directives
              </Label>
              <Textarea
                rows={3}
                placeholder="Log special notes, allergies, patient directives, or withdrawal conditions..."
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
                className="h-8.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
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
              <FileText className="w-4 h-4 text-indigo-500" />
              Consent Record Dossier — {viewingEntry?.consentNo}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Consent Number
                  </h4>
                  <p className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {viewingEntry.consentNo}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Consent Type
                  </h4>
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-[10px] px-2 font-bold uppercase rounded mt-0.5"
                  >
                    {viewingEntry.consentType}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Patient Name
                  </h4>
                  <p className="text-sm font-bold text-foreground">
                    {viewingEntry.patientName}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Patient ID / IP-OP No.
                  </h4>
                  <p className="text-sm font-medium font-mono text-zinc-700 dark:text-zinc-300">
                    {viewingEntry.patientNo}{" "}
                    {viewingEntry.ipOpNo ? `(${viewingEntry.ipOpNo})` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Procedure / Treatment
                  </h4>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {viewingEntry.procedureName}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Signed By
                  </h4>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {viewingEntry.signedBy}{" "}
                    {viewingEntry.signedBy === "Guardian"
                      ? `(Guardian: ${viewingEntry.guardianName} - ${viewingEntry.relationship})`
                      : ""}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Consent Date & Time
                  </h4>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {new Date(viewingEntry.consentDateTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Witness Name
                  </h4>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {viewingEntry.witnessName || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Attending Doctor
                  </h4>
                  <p className="text-sm font-semibold text-foreground">
                    {viewingEntry.doctorName || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                    Attached Document Scan
                  </h4>
                  <p className="text-xs mt-1">
                    {viewingEntry.documentUrl ? (
                      <a
                        href={viewingEntry.documentUrl}
                        download="consent_stub.pdf"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-bold hover:underline"
                      >
                        <FileText className="w-4 h-4" /> Download Scanned
                        Consent Form PDF
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic">
                        No document uploaded.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase">
                  Directives & Observations
                </h4>
                <div className="mt-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 rounded-lg p-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {viewingEntry.remarks ||
                    "No clinical remarks recorded for this consent form."}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePrintSlip(viewingEntry)}
                  className="h-8.5 text-xs border-zinc-200 dark:border-zinc-800 gap-1.5"
                >
                  <Printer className="w-4 h-4 text-indigo-500" /> Print Slip
                </Button>
                <Button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="h-8.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
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

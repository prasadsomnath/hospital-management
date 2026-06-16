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
  BirthRegisterResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Baby,
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

export default function BirthRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [birthEntries, setBirthEntries] = useState<BirthRegisterResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<BirthRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formMotherPatientNo, setFormMotherPatientNo] = useState("");
  const [formMotherName, setFormMotherName] = useState("");
  const [formBabyName, setFormBabyName] = useState("");
  const [formGender, setFormGender] = useState("Male");
  const [formBirthDateTime, setFormBirthDateTime] = useState("");
  const [formBirthWeight, setFormBirthWeight] = useState<number | "">("");
  const [formDeliveryType, setFormDeliveryType] = useState("Normal");
  const [formFatherName, setFormFatherName] = useState("");
  const [formFatherPhone, setFormFatherPhone] = useState("");
  const [formWard, setFormWard] = useState("");
  const [formBedNo, setFormBedNo] = useState("");
  const [formDeliveringDoctorId, setFormDeliveringDoctorId] = useState("");
  const [formApgarScore1min, setFormApgarScore1min] = useState<number | "">("");
  const [formApgarScore5min, setFormApgarScore5min] = useState<number | "">("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [birthList, patList, docList] = await Promise.all([
        receptionApi.getBirthEntries(code),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setBirthEntries(Array.isArray(birthList) ? birthList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Birth register logs");
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
    setFormMotherPatientNo(p.patientNo);
    setFormMotherName(p.name);
    setFormPatientSearch(p.name);
    if (!formBabyName) {
      setFormBabyName(`Baby of ${p.name}`);
    }
  };

  const handleNewEntry = () => {
    setFormPatientSearch("");
    setFormMotherPatientNo("");
    setFormMotherName("");
    setFormBabyName("");
    setFormGender("Male");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const nowStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormBirthDateTime(nowStr);

    setFormBirthWeight("");
    setFormDeliveryType("Normal");
    setFormFatherName("");
    setFormFatherPhone("");
    setFormWard("");
    setFormBedNo("");
    setFormDeliveringDoctorId("");
    setFormApgarScore1min("");
    setFormApgarScore5min("");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select a Birth record to edit.");
      return;
    }
    const entry = birthEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormMotherPatientNo(entry.motherPatientNo);
    setFormMotherName(entry.motherName);
    setFormPatientSearch(entry.motherName);
    setFormBabyName(entry.babyName);
    setFormGender(entry.gender || "Male");
    setFormBirthDateTime(
      entry.birthDateTime ? entry.birthDateTime.slice(0, 16) : "",
    );
    setFormBirthWeight(entry.birthWeight ?? "");
    setFormDeliveryType(entry.deliveryType || "Normal");
    setFormFatherName(entry.fatherName || "");
    setFormFatherPhone(entry.fatherPhone || "");
    setFormWard(entry.ward || "");
    setFormBedNo(entry.bedNo || "");
    setFormDeliveringDoctorId(entry.deliveringDoctorId || "");
    setFormApgarScore1min(entry.apgarScore1min ?? "");
    setFormApgarScore5min(entry.apgarScore5min ?? "");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMotherPatientNo) {
      toast.error("Please select a registered mother patient.");
      return;
    }
    if (!formBabyName.trim()) {
      toast.error("Please enter the baby name.");
      return;
    }
    if (!formBirthDateTime) {
      toast.error("Please enter date & time of birth.");
      return;
    }

    const matchedDoc = doctors.find(
      (d) => d.doctorCode === formDeliveringDoctorId,
    );
    const deliveringDoctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      babyName: formBabyName,
      gender: formGender,
      birthDateTime: formBirthDateTime,
      birthWeight: formBirthWeight === "" ? null : Number(formBirthWeight),
      deliveryType: formDeliveryType,
      motherPatientNo: formMotherPatientNo,
      motherName: formMotherName,
      fatherName: formFatherName || null,
      fatherPhone: formFatherPhone || null,
      ward: formWard || null,
      bedNo: formBedNo || null,
      deliveringDoctorId: formDeliveringDoctorId || null,
      deliveringDoctorName: deliveringDoctorName || null,
      apgarScore1min:
        formApgarScore1min === "" ? null : Number(formApgarScore1min),
      apgarScore5min:
        formApgarScore5min === "" ? null : Number(formApgarScore5min),
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateBirthEntry(selectedRowId, payload, code);
        toast.success("Birth register entry updated successfully.");
      } else {
        await receptionApi.createBirthEntry(payload, code);
        toast.success("New Birth entry logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Birth entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select a Birth record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this Birth entry?")) {
      return;
    }

    try {
      await receptionApi.deleteBirthEntry(selectedRowId, code);
      toast.success("Birth record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete Birth entry.");
    }
  };

  const handlePrintSlip = (entry: BirthRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const birthTime = new Date(entry.birthDateTime).toLocaleString();

    const htmlContent = `
      <html>
        <head>
          <title>Birth Certificate - ${entry.birthId}</title>
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
            .cert-body { border: 4px double #d1d5db; padding: 2rem; border-radius: 0.5rem; }
            .legal-text { font-size: 0.8rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 2rem; margin-top: 4rem; }
            .signatures { margin-top: 6rem; display: flex; justify-content: space-between; font-size: 0.9rem; }
            .sig-line { border-top: 1px solid #111827; width: 250px; text-align: center; padding-top: 0.5rem; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="cert-body">
            <div class="header">
              <h1>Certificate of Birth</h1>
              <p>Official Vital Records Registry &bull; Record ID: ${entry.birthId}</p>
            </div>
            
            <div class="grid">
              <div class="field">
                <div class="field-label">Baby Name</div>
                <div class="field-value" style="font-weight: 700; font-size: 1.2rem; color: #1e3a8a;">${entry.babyName}</div>
              </div>
              <div class="field">
                <div class="field-label">Gender</div>
                <div class="field-value" style="font-weight: 700;">${entry.gender}</div>
              </div>
              <div class="field">
                <div class="field-label">Date & Time of Birth</div>
                <div class="field-value" style="font-weight: bold;">${birthTime}</div>
              </div>
              <div class="field">
                <div class="field-label">Birth Weight</div>
                <div class="field-value">${entry.birthWeight ? `${entry.birthWeight} kg` : "—"}</div>
              </div>
              <div class="field">
                <div class="field-label">Delivery Type</div>
                <div class="field-value">${entry.deliveryType}</div>
              </div>
              <div class="field">
                <div class="field-label">Mother's Name (ID)</div>
                <div class="field-value">${entry.motherName} (${entry.motherPatientNo})</div>
              </div>
              <div class="field">
                <div class="field-label">Father's Name</div>
                <div class="field-value">${entry.fatherName || "—"}</div>
              </div>
              <div class="field">
                <div class="field-label">Father's Phone</div>
                <div class="field-value">${entry.fatherPhone || "—"}</div>
              </div>
              <div class="field">
                <div class="field-label">Delivering Physician</div>
                <div class="field-value">${entry.deliveringDoctorName || "—"}</div>
              </div>
              <div class="field">
                <div class="field-label">Ward / Bed Room</div>
                <div class="field-value">${entry.ward || "—"} / ${entry.bedNo || "—"}</div>
              </div>
              <div class="field">
                <div class="field-label">APGAR Score (1m / 5m)</div>
                <div class="field-value">1 Min: ${entry.apgarScore1min ?? "—"} &bull; 5 Min: ${entry.apgarScore5min ?? "—"}</div>
              </div>
              <div class="field">
                <div class="field-label">Registry Birth ID</div>
                <div class="field-value" style="font-family: monospace; font-weight: 700; color: #ef4444;">${entry.birthId}</div>
              </div>
              <div class="field full-width">
                <div class="field-label">Remarks / Notes</div>
                <div class="field-value" style="font-style: italic;">${entry.remarks || "No additional remarks."}</div>
              </div>
            </div>

            <div class="signatures">
              <div class="sig-line">Registrar of Births</div>
              <div class="sig-line">Delivering Doctor Signature</div>
            </div>

            <div class="legal-text">
              This certificate is issued under the Hospital Birth Registration system and acts as the official birth record declaration.
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

  const filteredBirthEntries = birthEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.birthId.toLowerCase().includes(q) ||
      e.babyName.toLowerCase().includes(q) ||
      e.motherName.toLowerCase().includes(q) ||
      e.motherPatientNo.toLowerCase().includes(q)
    );
  });

  const paginatedBirthEntries = filteredBirthEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="birth.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/20 dark:bg-zinc-700/20 flex items-center justify-center shadow-inner">
            <Baby className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Birth Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Official hospital registry of live births, delivery statistics,
              and maternity records
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Baby className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>
              Total Births:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredBirthEntries.length}
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
                <Plus className="w-4 h-4" /> Log Birth Entry
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
                  const entry = birthEntries.find(
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
                  const entry = birthEntries.find(
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
                Search Birth Records
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Birth ID, Baby Name, Mother Name or ID..."
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
                <th className="px-3.5 py-3">Birth ID</th>
                <th className="px-3.5 py-3">Baby Name</th>
                <th className="px-3.5 py-3">Gender</th>
                <th className="px-3.5 py-3">Date & Time of Birth</th>
                <th className="px-3.5 py-3">Birth Weight (kg)</th>
                <th className="px-3.5 py-3">Mother Details</th>
                <th className="px-3.5 py-3">Delivering Doctor</th>
                <th className="px-3.5 py-3">APGAR Score</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedBirthEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedTime = new Date(
                  row.birthDateTime,
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
                      {row.birthId}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-foreground">
                      {row.babyName}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                      {row.gender}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300 font-mono">
                      {row.birthWeight ? `${row.birthWeight} kg` : "—"}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.motherName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Mother ID: {row.motherPatientNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300">
                      {row.deliveringDoctorName || "—"}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300 font-mono">
                      1m: {row.apgarScore1min ?? "—"} / 5m:{" "}
                      {row.apgarScore5min ?? "—"}
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
                            setViewingEntry(row);
                            setDetailOpen(true);
                          }}
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Print Certificate"
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

              {filteredBirthEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching birth records..."
                          : "No Birth records registered yet"}
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
          totalPages={Math.ceil(filteredBirthEntries.length / pageSize)}
          totalElements={filteredBirthEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Birth Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Baby className="w-4 h-4 text-zinc-700 dark:text-zinc-300 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Birth Registry Record"
                : "Register New Birth Record"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Mother linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION A — Mother's Details (Patient Linking)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2 relative">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Lookup Mother Patient *
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="Search mother's name or patient ID..."
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
                    Mother Patient ID
                  </Label>
                  <Input
                    value={formMotherPatientNo}
                    readOnly
                    placeholder="Selected ID"
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Baby & Birth details */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Baby & Birth Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Baby Name *
                  </Label>
                  <Input
                    placeholder="e.g. Baby of Jane Doe"
                    value={formBabyName}
                    onChange={(e) => setFormBabyName(e.target.value)}
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
                    Date & Time of Birth *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formBirthDateTime}
                    onChange={(e) => setFormBirthDateTime(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Birth Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3.25"
                    value={formBirthWeight}
                    onChange={(e) =>
                      setFormBirthWeight(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Delivery Type *
                  </Label>
                  <Select
                    value={formDeliveryType}
                    onValueChange={setFormDeliveryType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Delivery Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Caesarean">Caesarean</SelectItem>
                      <SelectItem value="Instrumental">Instrumental</SelectItem>
                      <SelectItem value="Assisted">Assisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Delivering Doctor
                  </Label>
                  <Select
                    value={formDeliveringDoctorId}
                    onValueChange={setFormDeliveringDoctorId}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Delivering Doctor" />
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
                    APGAR Score (1 Min)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="Score (0-10)"
                    value={formApgarScore1min}
                    onChange={(e) =>
                      setFormApgarScore1min(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    APGAR Score (5 Min)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="Score (0-10)"
                    value={formApgarScore5min}
                    onChange={(e) =>
                      setFormApgarScore5min(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Ward / Room
                  </Label>
                  <Input
                    placeholder="e.g. Maternity Ward"
                    value={formWard}
                    onChange={(e) => setFormWard(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Bed No.
                  </Label>
                  <Input
                    placeholder="e.g. M-12"
                    value={formBedNo}
                    onChange={(e) => setFormBedNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Family details */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION C — Family Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Father's Name
                  </Label>
                  <Input
                    placeholder="Father's full name"
                    value={formFatherName}
                    onChange={(e) => setFormFatherName(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Father's Contact Phone
                  </Label>
                  <Input
                    placeholder="Father's phone number"
                    value={formFatherPhone}
                    onChange={(e) => setFormFatherPhone(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Remarks / Extra Notes
              </Label>
              <Textarea
                placeholder="Birth remarks, special delivery events or health conditions..."
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
                {selectedRowId !== null
                  ? "Save Modifications"
                  : "Log Birth Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Birth Detail Dossier Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Birth Record Registry Dossier — {viewingEntry?.birthId}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Baby Details
                  </h4>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {viewingEntry.babyName}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Gender: {viewingEntry.gender}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Weight:{" "}
                    {viewingEntry.birthWeight
                      ? `${viewingEntry.birthWeight} kg`
                      : "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Registry Metadata
                  </h4>
                  <p className="text-sm font-mono font-bold text-rose-500 mt-1">
                    {viewingEntry.birthId}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Logged:{" "}
                    {new Date(viewingEntry.createdAt || "").toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Birth Delivery Info
                  </h4>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Birth Date:</strong>{" "}
                    {new Date(viewingEntry.birthDateTime).toLocaleString()}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Delivery Type:</strong> {viewingEntry.deliveryType}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Delivering Doctor:</strong>{" "}
                    {viewingEntry.deliveringDoctorName || "—"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Ward / Bed No:</strong> {viewingEntry.ward || "—"} /{" "}
                    {viewingEntry.bedNo || "—"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>APGAR Scores:</strong> 1m:{" "}
                    {viewingEntry.apgarScore1min ?? "—"} / 5m:{" "}
                    {viewingEntry.apgarScore5min ?? "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Maternal & Family Info
                  </h4>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Mother's Name:</strong> {viewingEntry.motherName}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Mother's Patient ID:</strong>{" "}
                    {viewingEntry.motherPatientNo}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Father's Name:</strong>{" "}
                    {viewingEntry.fatherName || "—"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Father's Phone:</strong>{" "}
                    {viewingEntry.fatherPhone || "—"}
                  </p>
                </div>
              </div>

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
                  <Printer className="w-4 h-4" /> Print Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

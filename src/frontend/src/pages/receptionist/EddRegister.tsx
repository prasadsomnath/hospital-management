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
  EddRegisterResponse,
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
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function EddRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [eddEntries, setEddEntries] = useState<EddRegisterResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] = useState<EddRegisterResponse | null>(
    null,
  );

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formIpOpNo, setFormIpOpNo] = useState("");
  const [formLmpDate, setFormLmpDate] = useState("");
  const [formEddByLmp, setFormEddByLmp] = useState("");
  const [formEddByUsg, setFormEddByUsg] = useState("");
  const [formGravida, setFormGravida] = useState<number | "">(0);
  const [formPara, setFormPara] = useState<number | "">(0);
  const [formLiving, setFormLiving] = useState<number | "">(0);
  const [formAbortion, setFormAbortion] = useState<number | "">(0);
  const [formAssignedDoctorId, setFormAssignedDoctorId] = useState("");
  const [formWardBed, setFormWardBed] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formStatus, setFormStatus] = useState("Active");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eddList, patList, docList] = await Promise.all([
        receptionApi.getEddEntries(
          code,
          statusFilter !== "ALL" ? statusFilter : undefined,
        ),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setEddEntries(Array.isArray(eddList) ? eddList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load EDD register logs");
    } finally {
      setLoading(false);
    }
  }, [code, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  // Gestational Age Helper Weeks/Days
  const getGestationalAge = (lmpStr: string): string => {
    if (!lmpStr) return "N/A";
    try {
      const lmp = new Date(lmpStr);
      const now = new Date();
      const diff = now.getTime() - lmp.getTime();
      if (diff < 0) return "LMP date in future";
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      return `${weeks} weeks, ${days} days`;
    } catch {
      return "Error calculating";
    }
  };

  // Auto calculate EDD on LMP Date change
  useEffect(() => {
    if (formLmpDate) {
      try {
        const lmp = new Date(formLmpDate);
        const eddTime = lmp.getTime() + 280 * 24 * 60 * 60 * 1000;
        const eddDate = new Date(eddTime);
        const yyyy = eddDate.getFullYear();
        const mm = String(eddDate.getMonth() + 1).padStart(2, "0");
        const dd = String(eddDate.getDate()).padStart(2, "0");
        setFormEddByLmp(`${yyyy}-${mm}-${dd}`);
      } catch (e) {
        console.error(e);
      }
    } else {
      setFormEddByLmp("");
    }
  }, [formLmpDate]);

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
    setFormLmpDate("");
    setFormEddByLmp("");
    setFormEddByUsg("");
    setFormGravida(0);
    setFormPara(0);
    setFormLiving(0);
    setFormAbortion(0);
    setFormAssignedDoctorId("");
    setFormWardBed("");
    setFormRemarks("");
    setFormStatus("Active");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select an EDD entry to edit.");
      return;
    }
    const entry = eddEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormPatientSearch(entry.patientName);
    setFormIpOpNo(entry.ipOpNo || "");
    setFormLmpDate(entry.lmpDate);
    setFormEddByLmp(entry.eddByLmp);
    setFormEddByUsg(entry.eddByUsg || "");
    setFormGravida(entry.gravida ?? 0);
    setFormPara(entry.para ?? 0);
    setFormLiving(entry.living ?? 0);
    setFormAbortion(entry.abortion ?? 0);
    setFormAssignedDoctorId(entry.assignedDoctorId || "");
    setFormWardBed(entry.wardBed || "");
    setFormRemarks(entry.remarks || "");
    setFormStatus(entry.status);

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (!formLmpDate) {
      toast.error("Please select Last Menstrual Period (LMP) date.");
      return;
    }

    const matchedDoc = doctors.find(
      (d) => d.doctorCode === formAssignedDoctorId,
    );
    const assignedDoctorName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "";

    const payload = {
      patientNo: formPatientNo,
      patientName: formPatientName,
      ipOpNo: formIpOpNo || null,
      lmpDate: formLmpDate,
      eddByLmp: formEddByLmp,
      eddByUsg: formEddByUsg || null,
      gravida: formGravida === "" ? 0 : Number(formGravida),
      para: formPara === "" ? 0 : Number(formPara),
      living: formLiving === "" ? 0 : Number(formLiving),
      abortion: formAbortion === "" ? 0 : Number(formAbortion),
      assignedDoctorId: formAssignedDoctorId || null,
      assignedDoctorName: assignedDoctorName || null,
      wardBed: formWardBed || null,
      remarks: formRemarks || null,
      status: formStatus,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateEddEntry(selectedRowId, payload, code);
        toast.success("Maternity tracker record updated successfully.");
      } else {
        await receptionApi.createEddEntry(payload, code);
        toast.success("Maternity log record logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save EDD entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select an EDD record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this maternity log?")) {
      return;
    }

    try {
      await receptionApi.deleteEddEntry(selectedRowId, code);
      toast.success("Maternity tracker log deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete EDD entry.");
    }
  };

  const handlePrintSlip = (entry: EddRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const ga = getGestationalAge(entry.lmpDate);

    const htmlContent = `
      <html>
        <head>
          <title>Maternity EDD Summary - ${entry.eddId}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 2.5rem; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { font-size: 1.75rem; margin: 0; text-transform: uppercase; color: #db2777; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #6b7280; font-weight: 500; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
            .field { border-bottom: 1px solid #f3f4f6; padding: 0.5rem 0; font-size: 0.875rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; }
            .field-value { margin-top: 0.25rem; font-size: 0.95rem; font-weight: 500; }
            .block-table { grid-column: span 2; display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem; background-color: #fdf2f8; text-align: center; }
            .block-cell { display: flex; flex-col; font-weight: bold; }
            .remarks { grid-column: span 2; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem; font-style: italic; }
            .signatures { margin-top: 5rem; display: flex; justify-content: space-between; font-size: 0.875rem; }
            .sig-line { border-top: 1px solid #9ca3af; width: 220px; text-align: center; padding-top: 0.5rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Maternity & Obstetrics Ledger</h1>
            <p>Antenatal Care Tracker ANC &bull; Case ID: ${entry.eddId}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">ANC Case Number</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #db2777;">${entry.eddId}</div>
            </div>
            <div class="field">
              <div class="field-label">Pregnancy Status</div>
              <div class="field-value" style="font-weight: 750; color: #db2777;">${entry.status}</div>
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
              <div class="field-label">Gestational Age (Current)</div>
              <div class="field-value" style="font-weight: bold; color: #374151;">${ga}</div>
            </div>
            <div class="field">
              <div class="field-label">LMP Date</div>
              <div class="field-value">${entry.lmpDate}</div>
            </div>
            <div class="field">
              <div class="field-label">EDD by LMP (Calculated)</div>
              <div class="field-value" style="font-weight: bold; color: #db2777;">${entry.eddByLmp}</div>
            </div>
            <div class="field">
              <div class="field-label">EDD by USG (Ultrasound)</div>
              <div class="field-value">${entry.eddByUsg || "Not scheduled / Not updated"}</div>
            </div>
            <div class="field">
              <div class="field-label">Assigned Obstetrician</div>
              <div class="field-value">${entry.assignedDoctorName || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Ward Room / Bed Allocated</div>
              <div class="field-value">${entry.wardBed || "Not allocated"}</div>
            </div>
            
            <div class="block-table">
              <div>
                <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase;">Gravida (G)</div>
                <div style="font-size: 1.15rem; color: #db2777; margin-top: 0.25rem;">${entry.gravida ?? 0}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase;">Para (P)</div>
                <div style="font-size: 1.15rem; color: #db2777; margin-top: 0.25rem;">${entry.para ?? 0}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase;">Living (L)</div>
                <div style="font-size: 1.15rem; color: #db2777; margin-top: 0.25rem;">${entry.living ?? 0}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase;">Abortion (A)</div>
                <div style="font-size: 1.15rem; color: #db2777; margin-top: 0.25rem;">${entry.abortion ?? 0}</div>
              </div>
            </div>
            
            <div class="field full-width">
              <div class="field-label">Notes & Medical Observations</div>
              <div class="remarks">${entry.remarks || "No clinical remarks recorded."}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">OB-GYN Ward Nurse In-Charge</div>
            <div class="sig-line">Obstetrician / Medical Officer</div>
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

  const filteredEddEntries = eddEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.eddId.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      (e.assignedDoctorName || "").toLowerCase().includes(q)
    );
  });

  const paginatedEddEntries = filteredEddEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="edd.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center shadow-inner">
            <Baby className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Maternity / EDD Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Antenatal Care ANC tracking repository for obstetric cases, LMP,
              ultrasound timelines, and delivery indices
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Baby className="w-4 h-4 text-pink-500" />
            <span>
              Active Pregnancies:{" "}
              <b className="text-pink-600 dark:text-pink-400">
                {filteredEddEntries.filter((e) => e.status === "Active").length}
              </b>
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <div className="px-1">
            <span>
              Delivered ANC:{" "}
              <b className="text-emerald-500 font-bold">
                {
                  filteredEddEntries.filter((e) => e.status === "Delivered")
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
                className="h-8.5 px-3 text-xs bg-pink-600 hover:bg-pink-700 text-white gap-1.5 font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add ANC Record
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
                  const entry = eddEntries.find((e) => e.id === selectedRowId);
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
                  const entry = eddEntries.find((e) => e.id === selectedRowId);
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
                Pregnancy status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Pregnancies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All ANC Cases</SelectItem>
                  <SelectItem value="Active">Active Prenatal</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Obstetrics Cases
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search ANC Case No, Patient Name, Obstetrician..."
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
                <th className="px-3.5 py-3">ANC Case No.</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">LMP Date</th>
                <th className="px-3.5 py-3">EDD by LMP</th>
                <th className="px-3.5 py-3">Gestational Age</th>
                <th className="px-3.5 py-3">Obstetrician</th>
                <th className="px-3.5 py-3 text-center">G - P - L - A</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedEddEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const ga = getGestationalAge(row.lmpDate);
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
                        ? "bg-pink-500/10 hover:bg-pink-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-pink-600 dark:text-pink-400">
                      {row.eddId}
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
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300">
                      {row.lmpDate}
                    </td>
                    <td className="px-3.5 py-3 text-pink-600 dark:text-pink-400 font-bold">
                      {row.eddByLmp}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      {ga}
                    </td>
                    <td className="px-3.5 py-3 text-foreground font-semibold">
                      {row.assignedDoctorName || "—"}
                    </td>
                    <td className="px-3.5 py-2 text-center font-bold text-zinc-600 font-mono">
                      {row.gravida}-{row.para}-{row.living}-{row.abortion}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.status === "Active"
                            ? "bg-pink-500/20 text-pink-500 border-pink-500/30"
                            : row.status === "Delivered"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-500 border-amber-500/30"
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
                          title="View Case ANC file"
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
                          title="Print ANC EDD sheet"
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

              {filteredEddEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-pink-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching pregnancy tracker records..."
                          : "No Obstetrics ANC logs logged yet"}
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
          totalPages={Math.ceil(filteredEddEntries.length / pageSize)}
          totalElements={filteredEddEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* ANC Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Baby className="w-4 h-4 text-pink-500 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Antenatal ANC Record"
                : "Register Antenatal ANC Case"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient Linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-pink-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
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
                    placeholder="Case Identifier No."
                    value={formIpOpNo}
                    onChange={(e) => setFormIpOpNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* ANC Parameters */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-pink-600 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Pregnancy Timelines & Index
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    LMP Date *
                  </Label>
                  <Input
                    type="date"
                    value={formLmpDate}
                    onChange={(e) => setFormLmpDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    EDD by LMP (Auto)
                  </Label>
                  <Input
                    readOnly
                    type="date"
                    value={formEddByLmp}
                    className="h-8.5 text-xs font-bold text-pink-600 bg-zinc-100 dark:bg-zinc-900/50 cursor-not-allowed border-zinc-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    EDD by USG
                  </Label>
                  <Input
                    type="date"
                    value={formEddByUsg}
                    onChange={(e) => setFormEddByUsg(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Assigned OB-GYN
                  </Label>
                  <Select
                    value={formAssignedDoctorId}
                    onValueChange={setFormAssignedDoctorId}
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

                {/* Obstetrics Index */}
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Gravida (G)
                  </Label>
                  <Input
                    type="number"
                    value={formGravida}
                    onChange={(e) =>
                      setFormGravida(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Para (P)
                  </Label>
                  <Input
                    type="number"
                    value={formPara}
                    onChange={(e) =>
                      setFormPara(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Living (L)
                  </Label>
                  <Input
                    type="number"
                    value={formLiving}
                    onChange={(e) =>
                      setFormLiving(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Abortion (A)
                  </Label>
                  <Input
                    type="number"
                    value={formAbortion}
                    onChange={(e) =>
                      setFormAbortion(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Ward & Bed Number
                  </Label>
                  <Input
                    placeholder="e.g. Ward A - Bed 3"
                    value={formWardBed}
                    onChange={(e) => setFormWardBed(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    ANC Case Status *
                  </Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active Case</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-4">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Maternity Notes & Remarks
                  </Label>
                  <Textarea
                    placeholder="Maternal health logs, allergies, medical checks description..."
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
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold"
              >
                Save Case
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ANC Detail View Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          {viewingEntry && (
            <>
              <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-row items-center justify-between">
                <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-500" />
                  Maternal ANC file — {viewingEntry.eddId}
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
                    <Printer className="w-3 h-3" /> Print Summary
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-5 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      ANC Case ID
                    </span>
                    <span className="text-sm font-mono font-black text-pink-600 dark:text-pink-400">
                      {viewingEntry.eddId}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Pregnancy Status
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        viewingEntry.status === "Active"
                          ? "bg-pink-500/20 text-pink-500 border-pink-500/30"
                          : viewingEntry.status === "Delivered"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-500 border-amber-500/30"
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
                      IP/OP Number
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.ipOpNo || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      LMP Date
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.lmpDate}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      EDD by LMP
                    </span>
                    <span className="font-bold text-pink-600 block">
                      {viewingEntry.eddByLmp}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      EDD by USG
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.eddByUsg || "No ultrasound EDD recorded."}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Gestational Age
                    </span>
                    <span className="font-bold block">
                      {getGestationalAge(viewingEntry.lmpDate)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Assigned Doctor
                    </span>
                    <span className="font-semibold block">
                      {viewingEntry.assignedDoctorName || "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Ward Allocation
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 block">
                      {viewingEntry.wardBed || "No ward/bed allocated"}
                    </span>
                  </div>

                  {/* Obstetric index detail box */}
                  <div className="col-span-2 p-3 rounded-lg border border-pink-100 bg-pink-50/50 dark:border-pink-900/30 dark:bg-pink-950/10 grid grid-cols-4 text-center font-mono font-bold">
                    <div>
                      <div className="text-[8px] uppercase text-zinc-400">
                        Gravida (G)
                      </div>
                      <div className="text-base text-pink-600 mt-1">
                        {viewingEntry.gravida ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase text-zinc-400">
                        Para (P)
                      </div>
                      <div className="text-base text-pink-600 mt-1">
                        {viewingEntry.para ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase text-zinc-400">
                        Living (L)
                      </div>
                      <div className="text-base text-pink-600 mt-1">
                        {viewingEntry.living ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase text-zinc-400">
                        Abortion (A)
                      </div>
                      <div className="text-base text-pink-600 mt-1">
                        {viewingEntry.abortion ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      Maternity Observations ANC Notes
                    </span>
                    <p className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-serif leading-relaxed italic">
                      {viewingEntry.remarks ||
                        "No clinical ANC remarks logged."}
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

import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  FileImage,
  FileText,
  Filter,
  Layers,
  Loader2,
  Play,
  Search,
  Send,
  Syringe,
  Upload,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface DiagnosticRequest {
  id: number;
  patientId?: string;
  patientNo: string;
  patientName: string;
  age?: string;
  gender?: string;
  place?: string;
  phone?: string;
  address?: string;
  doctorId?: string;
  reportingDoctorId: string;
  referredDoctorId?: string;
  clinicianNotes?: string;
  notes?: string;
  serviceType: string;
  priceList?: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "SENT_TO_DOCTOR";
  createdAt?: string;
}

interface DiagnosticReport {
  id?: number;
  requestId: number;
  technicianId: string;
  reportFile: string;
  findings: string;
  impression: string;
  conclusion: string;
  technicianNotes: string;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  REQUESTED:
    "bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30",
  IN_PROGRESS:
    "bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/30",
  COMPLETED:
    "bg-teal-500/20 text-teal-500 dark:text-teal-400 border-teal-500/30",
  SENT_TO_DOCTOR:
    "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/30",
};

export default function LabDashboard() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "REQUESTED" | "IN_PROGRESS" | "SENT_TO_DOCTOR" | "ALL"
  >("REQUESTED");

  // Modal Report preparation state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<DiagnosticRequest | null>(null);
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [reportFileUrl, setReportFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    patientVerified: false,
    modalityVerified: false,
    resultsFilled: false,
    techSignoff: false,
  });

  const hospitalCode = user?.hospitalCode || "HSP001";

  // Fetch all diagnostic requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<DiagnosticRequest[]>(
        "/lab/diagnostic-requests",
        {
          headers: { "X-Hospital-Code": hospitalCode },
        },
      );
      // Sort descending by id so newest requests show first
      const sorted = (data || []).sort((a, b) => b.id - a.id);
      setRequests(sorted);
    } catch (error) {
      console.error("Failed to fetch diagnostic requests:", error);
      toast.error("Failed to load diagnostic requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [hospitalCode]);

  // Handle opening the report preparation modal
  const openReportModal = async (req: DiagnosticRequest) => {
    setSelectedRequest(req);
    setFindings("");
    setImpression("");
    setConclusion("");
    setTechnicianNotes("");
    setReportFileUrl("");
    setSelectedFile(null);
    setChecklist({
      patientVerified: false,
      modalityVerified: false,
      resultsFilled: false,
      techSignoff: false,
    });

    // If status is REQUESTED, transition it to IN_PROGRESS on the backend
    if (req.status === "REQUESTED") {
      try {
        await apiFetch<DiagnosticRequest>(
          `/lab/diagnostic-requests/${req.id}/status?status=IN_PROGRESS`,
          {
            method: "PUT",
            headers: { "X-Hospital-Code": hospitalCode },
          },
        );
        // Update request status locally
        setRequests((prev) =>
          prev.map((item) =>
            item.id === req.id ? { ...item, status: "IN_PROGRESS" } : item,
          ),
        );
      } catch (err) {
        console.error("Failed to update status to IN_PROGRESS:", err);
      }
    }

    // Try to load existing report details if it's already in progress or completed
    if (req.status !== "REQUESTED") {
      try {
        const report = await apiFetch<DiagnosticReport>(
          `/lab/diagnostic-reports/request/${req.id}`,
          {
            headers: { "X-Hospital-Code": hospitalCode },
          },
        );
        if (report) {
          setFindings(report.findings || "");
          setImpression(report.impression || "");
          setConclusion(report.conclusion || "");
          setTechnicianNotes(report.technicianNotes || "");
          setReportFileUrl(report.reportFile || "");
        }
      } catch (err) {
        console.warn("No existing report found for request ID:", req.id);
      }
    }

    setIsReportModalOpen(true);
  };

  // Convert uploaded file to base64 Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setReportFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReport = async (
    submitStatus: "IN_PROGRESS" | "SENT_TO_DOCTOR",
  ) => {
    if (!selectedRequest) return;

    // Check validation if sending to doctor
    if (submitStatus === "SENT_TO_DOCTOR") {
      if (!findings.trim() && !reportFileUrl) {
        toast.error(
          "Please provide findings or attach a diagnostic file report",
        );
        return;
      }
      if (
        !checklist.patientVerified ||
        !checklist.modalityVerified ||
        !checklist.resultsFilled ||
        !checklist.techSignoff
      ) {
        toast.error(
          "Please complete the validation checklist before sending the report to the doctor",
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: DiagnosticReport = {
        requestId: selectedRequest.id,
        technicianId: user?.name || "Lab Technician",
        reportFile: reportFileUrl,
        findings,
        impression,
        conclusion,
        technicianNotes,
        status: submitStatus,
      };

      await apiFetch<DiagnosticReport>("/lab/diagnostic-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hospital-Code": hospitalCode,
        },
        body: JSON.stringify(payload),
      });

      // Update requests locally
      setRequests((prev) =>
        prev.map((item) =>
          item.id === selectedRequest.id
            ? { ...item, status: submitStatus }
            : item,
        ),
      );

      toast.success(
        submitStatus === "SENT_TO_DOCTOR"
          ? "Report successfully sent to doctor"
          : "Draft report saved successfully",
      );
      setIsReportModalOpen(false);
    } catch (error) {
      console.error("Failed to save diagnostic report:", error);
      toast.error("Failed to save report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requests based on search query and selected filter tab
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const nameMatch =
        r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patientNo.toLowerCase().includes(searchQuery.toLowerCase());

      const statusMatch = statusFilter === "ALL" || r.status === statusFilter;

      return nameMatch && statusMatch;
    });
  }, [requests, searchQuery, statusFilter]);

  // Aggregate counts for Stats Cards
  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let sent = 0;

    requests.forEach((r) => {
      if (r.status === "REQUESTED") pending++;
      else if (r.status === "IN_PROGRESS") inProgress++;
      else if (r.status === "SENT_TO_DOCTOR" || r.status === "COMPLETED")
        sent++;
    });

    return { pending, inProgress, sent };
  }, [requests]);

  return (
    <div className="space-y-6" data-ocid="lab.dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">
              Diagnostics Workspace
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Welcome back, {user?.name || "Lab Technician"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Pending Requests"
          value={stats.pending}
          icon={Clock}
          accentColor="text-amber-500"
          trend={{ value: `${stats.pending} awaiting scan`, up: false }}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Play}
          accentColor="text-blue-500"
          trend={{ value: `${stats.inProgress} drafts saved`, up: true }}
        />
        <StatCard
          label="Dispatched to Doctor"
          value={stats.sent}
          icon={Send}
          accentColor="text-emerald-500"
          trend={{ value: `${stats.sent} reports finalized`, up: true }}
        />
      </div>

      {/* Workstation Modalities Quick Grid */}
      <div className="glass-elevated rounded-2xl p-5 border border-border shadow-glass-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Modality Scan Workstations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/lab-technician/xray"
            className="flex flex-col p-4 bg-background border border-border hover:border-primary/40 rounded-xl shadow-2xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs mt-3 text-foreground">
              X-Ray Room
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Review and interpret structural bone and lung radiography scans.
            </p>
          </Link>
          <Link
            to="/lab-technician/ct-scan"
            className="flex flex-col p-4 bg-background border border-border hover:border-primary/40 rounded-xl shadow-2xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs mt-3 text-foreground">
              CT Workstation
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Analyze multi-slice contrast reconstructions and log reports.
            </p>
          </Link>
          <Link
            to="/lab-technician/usg"
            className="flex flex-col p-4 bg-background border border-border hover:border-primary/40 rounded-xl shadow-2xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-650 group-hover:scale-110 transition-transform">
              <Waves className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs mt-3 text-foreground">
              USG Imaging
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Fetal scans, obstetrics measurements, and abdominal ultrasound
              scans.
            </p>
          </Link>
          <Link
            to="/lab-technician/lab"
            className="flex flex-col p-4 bg-background border border-border hover:border-primary/40 rounded-xl shadow-2xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <Syringe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs mt-3 text-foreground">
              Pathology Lab
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Hemoglobin, Potassium, Creatinine, and chemical clinical panels.
            </p>
          </Link>
          <Link
            to="/lab-technician/service-list"
            className="flex flex-col p-4 bg-background border border-border hover:border-primary/40 rounded-xl shadow-2xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs mt-3 text-foreground">
              UDR Registry
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Outpatient procedurals (Echo, ECG, Daycare, OT, Physiotherapy).
            </p>
          </Link>
        </div>
      </div>

      {/* Diagnostics Queue Panel */}
      <div className="glass-elevated rounded-2xl border border-border overflow-hidden shadow-glass-sm flex flex-col">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Incoming Diagnostics Request Queue
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select doctor orders to process, draft findings, and dispatch
              files.
            </p>
          </div>
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
            <input
              type="text"
              placeholder="Search patient name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 w-full bg-background border border-input text-foreground rounded-lg text-xs outline-none focus:ring-1 focus:ring-ring transition-smooth"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-border bg-muted/5 p-1 select-none flex-wrap gap-1">
          <Button
            variant={statusFilter === "REQUESTED" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("REQUESTED")}
            className="text-xs font-semibold h-7 rounded-md"
          >
            Pending ({requests.filter((r) => r.status === "REQUESTED").length})
          </Button>
          <Button
            variant={statusFilter === "IN_PROGRESS" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("IN_PROGRESS")}
            className="text-xs font-semibold h-7 rounded-md"
          >
            In Progress (
            {requests.filter((r) => r.status === "IN_PROGRESS").length})
          </Button>
          <Button
            variant={statusFilter === "SENT_TO_DOCTOR" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("SENT_TO_DOCTOR")}
            className="text-xs font-semibold h-7 rounded-md"
          >
            Dispatched (
            {
              requests.filter(
                (r) =>
                  r.status === "SENT_TO_DOCTOR" || r.status === "COMPLETED",
              ).length
            }
            )
          </Button>
          <Button
            variant={statusFilter === "ALL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
            className="text-xs font-semibold h-7 rounded-md"
          >
            All Requests ({requests.length})
          </Button>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Patient Name / No</th>
                <th className="px-5 py-3">Age / Sex</th>
                <th className="px-5 py-3">Scan / Modality</th>
                <th className="px-5 py-3">Clinician Notes</th>
                <th className="px-5 py-3">Doctor Assigned</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span>Syncing live diagnostic orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 opacity-30 text-amber-500" />
                      <p className="font-semibold text-sm">
                        No diagnostic orders found
                      </p>
                      <p className="text-xs">
                        Incoming scan requests from doctors will populate this
                        queue.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-muted/25 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-primary">
                      #{req.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-foreground">
                        {req.patientName}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {req.patientNo}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground font-semibold">
                      {req.age || "—"} / {req.gender || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">
                      {req.serviceType}
                    </td>
                    <td
                      className="px-5 py-3.5 max-w-[200px] truncate text-muted-foreground italic"
                      title={req.clinicianNotes}
                    >
                      {req.clinicianNotes || "No specific clinical notes"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      Dr. {req.reportingDoctorId || "Referred Doctor"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold ${STATUS_STYLES[req.status] || ""}`}
                      >
                        {req.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {req.status === "REQUESTED" ? (
                        <Button
                          size="sm"
                          onClick={() => openReportModal(req)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-7 px-3 text-[10px] gap-1 shadow-2xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Start Scan
                        </Button>
                      ) : req.status === "IN_PROGRESS" ? (
                        <Button
                          size="sm"
                          onClick={() => openReportModal(req)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-7 px-3 text-[10px] gap-1 shadow-2xs"
                        >
                          <FileText className="w-3 h-3" />
                          Draft Report
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReportModal(req)}
                          className="h-7 px-3 text-[10px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 font-bold"
                        >
                          <CheckCircle className="w-3 h-3" />
                          View Sent
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          REPORT PREPARATION & ATTACHMENT MODAL
          ========================================== */}
      {isReportModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-100 border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] transition-all animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="h-16 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white px-6 flex items-center justify-between select-none shadow-sm">
              <h3 className="font-bold flex items-center gap-2 font-display text-sm tracking-wide uppercase">
                <FileText className="w-5 h-5 text-white" />
                <span>
                  Prepare Diagnostic Report: {selectedRequest.serviceType}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-slate-50/20">
              {/* Demographics Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                    Patient Name
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                    Patient ID
                  </span>
                  <span className="font-bold text-slate-850 dark:text-slate-300 font-mono">
                    {selectedRequest.patientNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                    Age / Gender
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.age || "30"} /{" "}
                    {selectedRequest.gender || "Male"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                    Assigned Doctor
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Dr. {selectedRequest.reportingDoctorId}
                  </span>
                </div>
                {selectedRequest.clinicianNotes && (
                  <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                      Clinician Instructions / Notes
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                      "{selectedRequest.clinicianNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Findings & Observations
                  </Label>
                  <Textarea
                    rows={4}
                    disabled={selectedRequest.status === "SENT_TO_DOCTOR"}
                    placeholder="Enter detailed observations and findings..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    className="text-xs focus:ring-teal-500 bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Impression
                    </Label>
                    <Textarea
                      rows={3}
                      disabled={selectedRequest.status === "SENT_TO_DOCTOR"}
                      placeholder="e.g., Pneumothorax of the right upper lung..."
                      value={impression}
                      onChange={(e) => setImpression(e.target.value)}
                      className="text-xs focus:ring-teal-500 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Conclusion / Recommendation
                    </Label>
                    <Textarea
                      rows={3}
                      disabled={selectedRequest.status === "SENT_TO_DOCTOR"}
                      placeholder="Suggest follow-up CT scans, medications, or consults..."
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      className="text-xs focus:ring-teal-500 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Technician Internal Notes
                  </Label>
                  <Textarea
                    rows={2}
                    disabled={selectedRequest.status === "SENT_TO_DOCTOR"}
                    placeholder="Internal remarks not visible on printouts (optional)..."
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    className="text-xs focus:ring-teal-500 bg-background"
                  />
                </div>

                {/* PDF / File Attachment Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Attach Diagnostic Findings PDF / Image
                  </Label>
                  {selectedRequest.status !== "SENT_TO_DOCTOR" ? (
                    <div className="border border-dashed border-border hover:border-primary/40 rounded-xl p-4 flex flex-col items-center justify-center bg-muted/5 relative transition-all">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {!selectedFile && !reportFileUrl ? (
                        <div className="text-center space-y-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 mx-auto">
                            <Upload className="w-5 h-5 animate-pulse" />
                          </div>
                          <p className="text-xs font-semibold">
                            Click or drag & drop file to attach (PDF/Image)
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Supported: PDF, PNG, JPG, WebP up to 5MB
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-background border border-border rounded-lg relative z-20 w-full max-w-md">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 flex-shrink-0">
                              <FileImage className="w-4 h-4" />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {selectedFile
                                  ? selectedFile.name
                                  : "Attached Report File"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Attached Base64 Payload ready
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedFile(null);
                              setReportFileUrl("");
                            }}
                            className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : reportFileUrl ? (
                    <div className="p-3 bg-muted/40 border border-border rounded-xl flex items-center gap-3">
                      <FileImage className="w-6 h-6 text-teal-600" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">
                          Attached Report Document
                        </p>
                        <a
                          href={reportFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-teal-600 hover:text-teal-700 font-bold underline mt-0.5 block"
                        >
                          View / Download Attached File
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No file attachment submitted for this report.
                    </p>
                  )}
                </div>
              </div>

              {/* Pre-Examined Validation Checklists */}
              {selectedRequest.status !== "SENT_TO_DOCTOR" && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Verify Report Completeness (All Checklists Mandatory to
                    Send):
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      {
                        key: "patientVerified",
                        label: "Patient Identity matches the original order",
                      },
                      {
                        key: "modalityVerified",
                        label: "Test modality matches the scan taken",
                      },
                      {
                        key: "resultsFilled",
                        label: "Observations & Impression are fully filled",
                      },
                      {
                        key: "techSignoff",
                        label: `Technician signature verified (${user?.name || "?"})`,
                      },
                    ].map((chk) => (
                      <label
                        key={chk.key}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={
                            checklist[chk.key as keyof typeof checklist] ||
                            false
                          }
                          onChange={(e) => {
                            setChecklist({
                              ...checklist,
                              [chk.key]: e.target.checked,
                            });
                          }}
                          className="w-4.5 h-4.5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                        <span>{chk.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="h-16 bg-white dark:bg-slate-950 border-t border-slate-150 dark:border-slate-850 px-6 flex items-center justify-between select-none shadow-glass-sm shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReportModalOpen(false)}
                className="h-9 font-semibold text-slate-700"
              >
                Cancel
              </Button>
              {selectedRequest.status !== "SENT_TO_DOCTOR" ? (
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleSaveReport("IN_PROGRESS")}
                    className="h-9 font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save Draft"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      isSubmitting ||
                      !checklist.patientVerified ||
                      !checklist.modalityVerified ||
                      !checklist.resultsFilled ||
                      !checklist.techSignoff
                    }
                    onClick={() => handleSaveReport("SENT_TO_DOCTOR")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Verify & Send to Doctor"
                    )}
                  </Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold py-1 px-3"
                >
                  Finalized & Dispatched to Doctor
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

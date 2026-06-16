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
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api-config";
import { getCookie } from "@/lib/cookies";
import { useAuthStore } from "@/store/auth-store";
import {
  Download,
  Eye,
  FileText,
  FlaskConical,
  Loader2,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LabReport {
  id: string;
  patientId: string;
  patientName: string;
  testType: string;
  date: string;
  status: "Pending" | "Ready" | "Reviewed";
  result?: string;
  notes?: string;
  fileUrl?: string;
}

// Status styles for Badge
const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  Ready: "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30",
  Reviewed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const getFullFileUrl = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

function ReportViewDialog({
  report,
  onClose,
  patients,
  onViewPdf,
}: {
  report: LabReport | null;
  onClose: () => void;
  patients: any[];
  onViewPdf: (url: string | undefined) => void;
}) {
  if (!report) return null;
  const patient = patients.find(
    (p) => (p.patientNo || p.id) === report.patientId,
  );
  const patientName = patient
    ? patient.firstName
      ? `${patient.firstName} ${patient.lastName || ""}`.trim()
      : patient.name || "Patient"
    : "Patient";
  const patientIdVal = patient
    ? patient.patientNo || patient.id
    : report.patientId;
  const patientGender = patient?.gender || "Not recorded";
  const patientAge = patient?.dob
    ? new Date().getFullYear() - new Date(patient.dob).getFullYear()
    : patient?.age || "Not recorded";
  const patientBlood = patient?.bloodGroup || "O+";
  const patientCondition =
    patient?.importantNotes ||
    patient?.permanentDiagnosis ||
    patient?.condition ||
    "Stable";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="doctor.report_view.dialog"
        className="max-w-md bg-card border border-border rounded-xl shadow-glass-lg p-5 backdrop-blur-md"
      >
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-bold text-foreground font-display tracking-tight">
            Lab Report Details
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Container to prevent cutting off footer */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-500/20">
          {/* Header Info Banner */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/50">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <FlaskConical className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {report.testType}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Date: {report.date}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 border font-semibold ml-auto ${STATUS_STYLES[report.status] ?? ""}`}
            >
              {report.status}
            </Badge>
          </div>

          {/* Patient Card Section */}
          {patient && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Patient Demographics
              </span>
              <div className="p-3 bg-muted/20 border border-border/40 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    {patientName}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {patientIdVal}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] border-t border-border/30 pt-2 text-muted-foreground">
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">
                      Gender
                    </span>
                    <span className="font-medium text-foreground">
                      {patientGender}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">
                      Age
                    </span>
                    <span className="font-medium text-foreground">
                      {patientAge} yrs
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">
                      Blood
                    </span>
                    <span className="font-bold text-foreground">
                      {patientBlood}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-muted-foreground/60">
                      Condition
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {patientCondition}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Findings Card Section */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
              Findings & Medical Interpretation
            </span>
            {report.result ? (
              <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-lg">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-300 leading-relaxed italic">
                  "{report.result}"
                </p>
              </div>
            ) : (
              <div className="p-3 bg-muted/10 border border-dashed border-border rounded-lg text-center">
                <p className="text-xs text-muted-foreground italic">
                  Findings details not yet uploaded by diagnostic lab
                  technician.
                </p>
              </div>
            )}
          </div>

          {/* Clinician Instructions Card Section */}
          {report.notes && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Clinician Instructions / Remarks
              </span>
              <div className="bg-muted/30 border border-border/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {report.notes}
                </p>
              </div>
            </div>
          )}

          {/* File Attachment Card Section */}
          {report.fileUrl && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Secure File Attachment
              </span>
              <div className="flex items-center gap-3 p-2.5 bg-muted/20 border border-border/40 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground truncate">
                    {report.testType.toLowerCase().replace(" ", "_")}
                    _findings.pdf
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground truncate">
                    {getFullFileUrl(report.fileUrl)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewPdf(report.fileUrl)}
                  className="h-6 text-[9px] border-teal-500/20 hover:border-teal-500 text-teal-500 font-bold px-2 rounded"
                >
                  Open File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions outside the scrollable body */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            className="border-border text-muted-foreground h-8 text-xs font-semibold px-3"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            className="gap-1.5 bg-teal-500 hover:bg-teal-600 text-white font-bold h-8 text-xs shadow-md transition-all duration-300 px-3"
            onClick={() => {
              if (report.fileUrl) {
                onViewPdf(report.fileUrl);
              } else {
                alert("Mock PDF download — no file generated in demo mode.");
              }
            }}
          >
            <Download className="w-3.5 h-3.5" /> View File Attachment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Fallback mock reports used when backend returns no data
const MOCK_REPORTS: LabReport[] = [
  {
    id: "mock-r1",
    patientId: "P10001",
    patientName: "Arjun Sharma",
    testType: "Blood Panel",
    date: new Date().toISOString().split("T")[0],
    status: "Ready",
    result: "Complete Blood Count Report",
    notes: "All parameters within normal limits.",
  },
  {
    id: "mock-r2",
    patientId: "P10002",
    patientName: "Priya Menon",
    testType: "Chest X-Ray",
    date: new Date().toISOString().split("T")[0],
    status: "Reviewed",
    result: "Chest PA View",
    notes: "No active consolidation observed.",
  },
  {
    id: "mock-r3",
    patientId: "P10003",
    patientName: "Rahul Gupta",
    testType: "Lipid Profile",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
    result: "Lipid Profile Report",
    notes: "Sample collected. Processing in lab.",
  },
  {
    id: "mock-r4",
    patientId: "P10004",
    patientName: "Sunita Verma",
    testType: "ECG",
    date: new Date().toISOString().split("T")[0],
    status: "Ready",
    result: "12-Lead ECG Tracing",
    notes: "Normal sinus rhythm. No ST changes.",
  },
  {
    id: "mock-r5",
    patientId: "P10005",
    patientName: "Deepak Nair",
    testType: "Ultrasound Abdomen",
    date: new Date().toISOString().split("T")[0],
    status: "Ready",
    result: "USG Abdomen & Pelvis",
    notes: "No significant hepatic or splenic changes.",
  },
];

export default function Reports() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewing, setViewing] = useState<LabReport | null>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, typeFilter]);

  // Live Integrated States
  const [patients, setPatients] = useState<any[]>([]);
  const [reports, setReports] = useState<LabReport[]>(MOCK_REPORTS);
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields - Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPatientId, setUploadPatientId] = useState("");
  const [uploadType, setUploadType] = useState("Blood Panel");
  const [uploadName, setUploadName] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please upload a PDF file only!");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please upload a PDF file only!");
      }
    }
  };

  const viewPdfReport = async (fileUrl: string | undefined) => {
    if (!fileUrl) return;

    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      if (fileUrl.includes("/uploads/placeholder.pdf")) {
        const newTab = window.open("", "_blank");
        if (newTab) {
          newTab.document.write(`
            <html>
              <head>
                <title>Lab Report - Mock Vault View</title>
                <style>
                  body {
                    margin: 0;
                    padding: 40px;
                    background: #f8fafc;
                    color: #0f172a;
                    font-family: system-ui, -apple-system, sans-serif;
                    display: flex;
                    justify-content: center;
                  }
                  .report-card {
                    width: 100%;
                    max-width: 800px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    padding: 40px;
                  }
                  .header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #0d9488;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                  }
                  .clinic-info h2 { margin: 0; color: #0d9488; font-size: 24px; font-weight: 800; }
                  .clinic-info p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
                  .report-title { text-align: right; }
                  .report-title h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
                  .report-title p { margin: 4px 0 0; color: #64748b; font-size: 11px; font-family: monospace; }
                  .patient-meta {
                    display: grid;
                    grid-template-cols: repeat(4, 1fr);
                    gap: 20px;
                    background: #f1f5f9;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    font-size: 12px;
                  }
                  .meta-item span { display: block; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
                  .meta-item font { font-weight: 600; color: #0f172a; }
                  .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    font-size: 13px;
                  }
                  .table th {
                    text-align: left;
                    background: #0d9488;
                    color: white;
                    padding: 10px 14px;
                    font-weight: 600;
                  }
                  .table td {
                    padding: 12px 14px;
                    border-bottom: 1px solid #e2e8f0;
                  }
                  .normal { color: #059669; font-weight: 600; }
                  .abnormal { color: #dc2626; font-weight: 600; }
                  .footer {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #64748b;
                  }
                </style>
              </head>
              <body>
                <div class="report-card">
                  <div class="header">
                    <div class="clinic-info">
                      <h2>Apollo HealthMatrix360</h2>
                      <p>Advanced Diagnostic & Medical Research Centre</p>
                    </div>
                    <div class="report-title">
                      <h3>LABORATORY REPORT</h3>
                      <p>Ref: ARCHIVE-MOCK-VAULT</p>
                    </div>
                  </div>
                  
                  <div class="patient-meta">
                    <div class="meta-item">
                      <span>Patient Name</span>
                      <font>Patient (Vinay HP)</font>
                    </div>
                    <div class="meta-item">
                      <span>Patient ID</span>
                      <font>P10001</font>
                    </div>
                    <div class="meta-item">
                      <span>Date Printed</span>
                      <font>${new Date().toLocaleDateString()}</font>
                    </div>
                    <div class="meta-item">
                      <span>Status</span>
                      <font style="color: #0d9488;">COMPLETED</font>
                    </div>
                  </div>

                  <h4 style="margin: 0 0 16px; color: #0d9488; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">PATHOLOGY / BIOCHEMISTRY RESULTS</h4>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Test Investigation</th>
                        <th>Observed Value</th>
                        <th>Reference Range</th>
                        <th>Unit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Fasting Blood Sugar (FBS)</td>
                        <td>94.0</td>
                        <td>70 - 100</td>
                        <td>mg/dL</td>
                        <td class="normal">Normal</td>
                      </tr>
                      <tr>
                        <td>Hemoglobin (Hb)</td>
                        <td>14.8</td>
                        <td>13.0 - 17.0</td>
                        <td>g/dL</td>
                        <td class="normal">Normal</td>
                      </tr>
                      <tr>
                        <td>Total Cholesterol</td>
                        <td class="abnormal">220.0</td>
                        <td>&lt; 200</td>
                        <td>mg/dL</td>
                        <td class="abnormal">High</td>
                      </tr>
                      <tr>
                        <td>Serum Creatinine</td>
                        <td>0.9</td>
                        <td>0.6 - 1.2</td>
                        <td>mg/dL</td>
                        <td class="normal">Normal</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; font-size: 12px; margin-top: 20px;">
                    <strong style="color: #b45309; display: block; margin-bottom: 4px;">Clinician Notes:</strong>
                    <span style="color: #78350f;">Observed slightly elevated cholesterol levels. Patient is advised to maintain a low-fat diet and follow up in 4 weeks. All other parameters are within normal thresholds.</span>
                  </div>

                  <div class="footer">
                    <div>Report generated electronically. No signature required.</div>
                    <div style="font-weight: bold; color: #0d9488;">Apollo Medical Archives</div>
                  </div>
                </div>
              </body>
            </html>
          `);
          newTab.document.close();
        }
        return;
      }
      window.open(fileUrl, "_blank");
      return;
    }

    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Loading Lab Report...</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: #0f172a;
                color: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
              }
              .loader {
                border: 3px solid #334155;
                border-top: 3px solid #0d9488;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .text {
                font-size: 14px;
                font-weight: 500;
                letter-spacing: -0.01em;
              }
            </style>
          </head>
          <body>
            <div style="text-align: center;">
              <div class="loader"></div>
              <div class="text">Decrypting Secure Vault Attachment...</div>
            </div>
          </body>
        </html>
      `);
    }

    try {
      const token = getCookie("auth-token");
      const code = user?.hospitalCode || "HSP001";
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-Hospital-Code": code,
      };

      const response = await fetch(`${API_BASE_URL}${fileUrl}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (fileUrl.includes("placeholder.pdf")) {
          if (newTab) {
            newTab.document.write(`
              <html>
                <head>
                  <title>Lab Report - Mock Vault View</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 40px;
                      background: #f8fafc;
                      color: #0f172a;
                      font-family: system-ui, -apple-system, sans-serif;
                      display: flex;
                      justify-content: center;
                    }
                    .report-card {
                      width: 100%;
                      max-width: 800px;
                      background: white;
                      border: 1px solid #e2e8f0;
                      border-radius: 12px;
                      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                      padding: 40px;
                    }
                    .header {
                      display: flex;
                      justify-content: space-between;
                      border-bottom: 2px solid #0d9488;
                      padding-bottom: 20px;
                      margin-bottom: 30px;
                    }
                    .clinic-info h2 { margin: 0; color: #0d9488; font-size: 24px; font-weight: 800; }
                    .clinic-info p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
                    .report-title { text-align: right; }
                    .report-title h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
                    .report-title p { margin: 4px 0 0; color: #64748b; font-size: 11px; font-family: monospace; }
                    .patient-meta {
                      display: grid;
                      grid-template-cols: repeat(4, 1fr);
                      gap: 20px;
                      background: #f1f5f9;
                      padding: 20px;
                      border-radius: 8px;
                      margin-bottom: 30px;
                      font-size: 12px;
                    }
                    .meta-item span { display: block; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
                    .meta-item font { font-weight: 600; color: #0f172a; }
                    .table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-bottom: 30px;
                      font-size: 13px;
                    }
                    .table th {
                      text-align: left;
                      background: #0d9488;
                      color: white;
                      padding: 10px 14px;
                      font-weight: 600;
                    }
                    .table td {
                      padding: 12px 14px;
                      border-bottom: 1px solid #e2e8f0;
                    }
                    .normal { color: #059669; font-weight: 600; }
                    .abnormal { color: #dc2626; font-weight: 600; }
                    .footer {
                      border-top: 1px solid #e2e8f0;
                      padding-top: 20px;
                      margin-top: 40px;
                      display: flex;
                      justify-content: space-between;
                      font-size: 11px;
                      color: #64748b;
                    }
                  </style>
                </head>
                <body>
                  <div class="report-card">
                    <div class="header">
                      <div class="clinic-info">
                        <h2>Apollo HealthMatrix360</h2>
                        <p>Advanced Diagnostic & Medical Research Centre</p>
                      </div>
                      <div class="report-title">
                        <h3>LABORATORY REPORT</h3>
                        <p>Ref: ARCHIVE-MOCK-VAULT</p>
                      </div>
                    </div>
                    
                    <div class="patient-meta">
                      <div class="meta-item">
                        <span>Patient Name</span>
                        <font>Patient (Vinay HP)</font>
                      </div>
                      <div class="meta-item">
                        <span>Patient ID</span>
                        <font>P10001</font>
                      </div>
                      <div class="meta-item">
                        <span>Date Printed</span>
                        <font>${new Date().toLocaleDateString()}</font>
                      </div>
                      <div class="meta-item">
                        <span>Status</span>
                        <font style="color: #0d9488;">COMPLETED</font>
                      </div>
                    </div>

                    <h4 style="margin: 0 0 16px; color: #0d9488; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">PATHOLOGY / BIOCHEMISTRY RESULTS</h4>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Test Investigation</th>
                          <th>Observed Value</th>
                          <th>Reference Range</th>
                          <th>Unit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Fasting Blood Sugar (FBS)</td>
                          <td>94.0</td>
                          <td>70 - 100</td>
                          <td>mg/dL</td>
                          <td class="normal">Normal</td>
                        </tr>
                        <tr>
                          <td>Hemoglobin (Hb)</td>
                          <td>14.8</td>
                          <td>13.0 - 17.0</td>
                          <td>g/dL</td>
                          <td class="normal">Normal</td>
                        </tr>
                        <tr>
                          <td>Total Cholesterol</td>
                          <td class="abnormal">220.0</td>
                          <td>&lt; 200</td>
                          <td>mg/dL</td>
                          <td class="abnormal">High</td>
                        </tr>
                        <tr>
                          <td>Serum Creatinine</td>
                          <td>0.9</td>
                          <td>0.6 - 1.2</td>
                          <td>mg/dL</td>
                          <td class="normal">Normal</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; font-size: 12px; margin-top: 20px;">
                      <strong style="color: #b45309; display: block; margin-bottom: 4px;">Clinician Notes:</strong>
                      <span style="color: #78350f;">Observed slightly elevated cholesterol levels. Patient is advised to maintain a low-fat diet and follow up in 4 weeks. All other parameters are within normal thresholds.</span>
                    </div>

                    <div class="footer">
                      <div>Report generated electronically. No signature required.</div>
                      <div style="font-weight: bold; color: #0d9488;">Apollo Medical Archives</div>
                    </div>
                  </div>
                </body>
              </html>
            `);
            newTab.document.close();
          }
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (newTab) {
        newTab.location.href = blobUrl;
      }
    } catch (err: any) {
      console.error("Failed to fetch secure PDF from vault:", err);
      if (newTab) {
        newTab.document.body.innerHTML = `
          <div style="text-align: center; color: #ef4444; padding: 20px; font-family: sans-serif;">
            <h3>Failed to view secure report</h3>
            <p style="font-size: 13px; color: #94a3b8;">${err.message || "Network error. Please check microservice status."}</p>
          </div>
        `;
      }
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      // 1. Fetch dynamic patient registry
      const patientList = await apiFetch<any>("/doctor/patients", {
        headers: { "X-Hospital-Code": code },
      });
      const activePatients = Array.isArray(patientList)
        ? patientList
        : patientList?.content || [];
      setPatients(activePatients);

      // 2. Fetch reports for each patient in parallel
      const allReports: LabReport[] = [];
      const fetchPromises = activePatients.map(async (p) => {
        try {
          const patientNo = p.patientNo || p.id;
          const patientName = p.firstName
            ? `${p.firstName} ${p.lastName || ""}`.trim()
            : p.name || "Patient";
          const reportsData = await apiFetch<any>(
            `/doctor/reports/${patientNo}`,
            {
              headers: { "X-Hospital-Code": code },
            },
          );
          const patientReports = Array.isArray(reportsData)
            ? reportsData
            : reportsData?.content || [];
          if (patientReports && Array.isArray(patientReports)) {
            patientReports.forEach((rep) => {
              allReports.push({
                id:
                  rep.id?.toString() || `br-${rep.patientNo}-${Math.random()}`,
                patientId: rep.patientNo,
                patientName: patientName,
                testType: rep.reportType || "Lab Report",
                date:
                  rep.uploadedDate || new Date().toISOString().split("T")[0],
                status: "Ready",
                result: rep.reportName,
                notes: `Attachment registered in secure vault.`,
                fileUrl: rep.fileUrl,
              });
            });
          }
        } catch (e) {
          console.warn(
            `Failed to fetch reports for patient ${p.patientNo}:`,
            e,
          );
        }
      });

      await Promise.all(fetchPromises);

      // Use backend data if available, otherwise fall back to mock reports
      if (allReports.length > 0) {
        setReports(allReports);
      } else {
        setReports(MOCK_REPORTS);
      }
    } catch (e) {
      console.warn("Failed to fetch reports from live backend.", e);
      setReports(MOCK_REPORTS);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPatientId || !uploadType || !uploadName) {
      toast.error("Please fill in all required fields!");
      return;
    }

    setIsSubmitting(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      const docName = user?.name
        ? user.name.startsWith("Dr. ")
          ? user.name
          : `Dr. ${user.name}`
        : "Dr. Marcus Chen";

      if (selectedFile) {
        const formData = new FormData();
        formData.append("patientNo", uploadPatientId);
        formData.append("reportName", uploadName);
        formData.append("reportType", uploadType);
        formData.append("doctorName", docName);
        formData.append("file", selectedFile);

        await apiFetch<any>("/doctor/reports", {
          method: "POST",
          headers: { "X-Hospital-Code": code },
          body: formData,
        });
      } else {
        const fileLink =
          uploadFileUrl ||
          `https://s3.hospital.local/reports/${uploadType.toLowerCase().replace(" ", "_")}_${Date.now()}.pdf`;

        const queryParams = `patientNo=${encodeURIComponent(uploadPatientId)}&reportName=${encodeURIComponent(uploadName)}&reportType=${encodeURIComponent(uploadType)}&fileUrl=${encodeURIComponent(fileLink)}&doctorName=${encodeURIComponent(docName)}`;

        await apiFetch<any>(`/doctor/reports?${queryParams}`, {
          method: "POST",
          headers: { "X-Hospital-Code": code },
        });
      }

      toast.success("Lab report registered and uploaded successfully!");
      setShowUploadModal(false);

      // Reset fields
      setUploadName("");
      setUploadFileUrl("");
      setSelectedFile(null);

      // Reload reports
      fetchReports();
    } catch (err: any) {
      console.error("Failed to upload report to backend:", err);
      toast.error(
        err.message ||
          "Failed to upload lab report. Please check backend network.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.testType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType = typeFilter === "all" || r.testType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const pending = reports.filter((r) => r.status === "Pending").length;
  const ready = reports.filter((r) => r.status === "Ready").length;
  const TEST_TYPES = Array.from(new Set(reports.map((r) => r.testType)));

  return (
    <div className="space-y-6" data-ocid="doctor.reports.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Lab Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {reports.length} reports total · {pending} pending · {ready} ready
            for review
          </p>
        </div>

        <Button
          onClick={() => {
            // Select first patient in list by default
            const firstPat = patients[0]?.patientNo || patients[0]?.id || "p1";
            setUploadPatientId(firstPat);
            setShowUploadModal(true);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5 shadow-md rounded-lg text-xs h-8.5"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Lab Report</span>
        </Button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          {
            label: "Total Reports",
            value: reports.length,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Pending",
            value: pending,
            color: "bg-muted/40 text-muted-foreground",
          },
          {
            label: "Ready",
            value: ready,
            color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
          },
          {
            label: "Reviewed",
            value: reports.filter((r) => r.status === "Reviewed").length,
            color: "bg-emerald-500/10 text-emerald-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${s.color} glass-elevated`}
          >
            <span>{s.label}:</span>
            <span className="font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="doctor.reports.search_input"
            placeholder="Search by patient or test type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/20 border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            data-ocid="doctor.reports.status.select"
            className="w-36 bg-muted/20 border-border"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Ready">Ready</SelectItem>
            <SelectItem value="Reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            data-ocid="doctor.reports.type.select"
            className="w-44 bg-muted/20 border-border"
          >
            <SelectValue placeholder="Test Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            {TEST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm bg-card/10">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">
                Synchronizing Secure Medical Vault...
              </span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  {["Patient", "Test Type", "Date", "Status", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((r, i) => (
                  <tr
                    key={r.id}
                    data-ocid={`doctor.reports.item.${page * pageSize + i + 1}`}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {r.patientName ? r.patientName[0] : "P"}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          {r.patientName || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground">{r.testType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.date}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_STYLES[r.status] ?? ""}`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-ocid={`doctor.reports.view.${page * pageSize + i + 1}`}
                          className="h-7 px-2.5 text-xs gap-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-950/20 font-medium"
                          onClick={() => setViewing(r)}
                          disabled={r.status === "Pending"}
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-ocid={`doctor.reports.download.${page * pageSize + i + 1}`}
                          className="h-7 px-2.5 text-xs gap-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-950/20 font-medium"
                          onClick={() => {
                            if (r.fileUrl) {
                              viewPdfReport(r.fileUrl);
                            } else {
                              alert(
                                "Mock PDF download — no file generated in demo mode.",
                              );
                            }
                          }}
                          disabled={r.status === "Pending"}
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div
                        data-ocid="doctor.reports.empty_state"
                        className="flex flex-col items-center gap-2"
                      >
                        <FlaskConical className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          No reports match your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <PaginationControl
          currentPage={page}
          totalPages={Math.ceil(filtered.length / pageSize)}
          totalElements={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="px-4 border-t border-border/60 bg-card/20 py-2.5"
        />
      </div>

      {/* MODAL: UPLOAD LAB REPORT */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-glass-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-500" />
                <h3 className="text-sm font-bold text-foreground font-display">
                  Upload / Register Lab Report
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => setShowUploadModal(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <form onSubmit={handleUploadReport} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Select Patient *</Label>
                <Select
                  value={uploadPatientId}
                  onValueChange={setUploadPatientId}
                  required
                >
                  <SelectTrigger className="h-8.5 text-xs bg-muted/10 border-border">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Merge Dynamic Patients + Fallback Mock Patients */}
                    {patients.map((p) => {
                      const idVal = p.patientNo || p.id;
                      const pName = p.firstName
                        ? `${p.firstName} ${p.lastName || ""}`.trim()
                        : p.name || "Patient";
                      return (
                        <SelectItem key={idVal} value={idVal}>
                          {pName} ({idVal})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Test / Report Type *</Label>
                  <Select
                    value={uploadType}
                    onValueChange={setUploadType}
                    required
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-muted/10 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blood Panel">Blood Panel</SelectItem>
                      <SelectItem value="ECG">ECG Scan</SelectItem>
                      <SelectItem value="Lipid Profile">
                        Lipid Profile
                      </SelectItem>
                      <SelectItem value="BP Monitoring">
                        BP Monitoring
                      </SelectItem>
                      <SelectItem value="Ultrasound Abdomen">
                        Ultrasound Abdomen
                      </SelectItem>
                      <SelectItem value="X-Ray Knee">X-Ray Knee</SelectItem>
                      <SelectItem value="MRI Femur">MRI Femur</SelectItem>
                      <SelectItem value="Chest X-Ray">Chest X-Ray</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Report / File Title *</Label>
                  <Input
                    placeholder="E.g. Full Hematology Report"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    required
                    className="h-8.5 text-xs bg-muted/10 border-border"
                  />
                </div>
              </div>

              {/* Premium Drag & Drop PDF Uploader */}
              <div className="space-y-1.5">
                <Label className="text-xs">Attachment PDF File *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 transition-all duration-300 text-center relative ${
                    dragActive
                      ? "border-teal-500 bg-teal-500/10 scale-[1.01]"
                      : "border-border bg-muted/5 hover:border-muted-foreground/30 hover:bg-muted/10"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {!selectedFile ? (
                    <div className="space-y-2 pointer-events-none">
                      <div className="mx-auto w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-500">
                        <Upload className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Drag & drop report PDF, or{" "}
                          <span className="text-teal-500 hover:text-teal-600">
                            browse
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          PDF files only up to 50MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-background border border-border/80 rounded-md relative z-20">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-500 flex-shrink-0">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional legacy S3 URL fallback */}
              {!selectedFile && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    No PDF file? You can optionally provide an external URL
                    below.
                  </span>
                  <Input
                    placeholder="https://s3.hospital.local/vault/report-12.pdf"
                    value={uploadFileUrl}
                    onChange={(e) => setUploadFileUrl(e.target.value)}
                    className="h-8.5 text-xs bg-muted/10 border-border font-mono font-normal"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="h-8 text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Findings</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReportViewDialog
        report={viewing}
        onClose={() => setViewing(null)}
        patients={patients}
        onViewPdf={viewPdfReport}
      />
    </div>
  );
}

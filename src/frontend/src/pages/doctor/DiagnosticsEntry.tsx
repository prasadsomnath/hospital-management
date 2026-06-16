import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Sliders,
  Sparkles,
  Trash2,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PaginationControl } from "@/components/ui/pagination-control";

// Initial Diagnostics / X-ray Reports Data
const INITIAL_REPORTS = [
  {
    no: "XR1001",
    patNo: "p1",
    patientName: "Evelyn Reed",
    testName: "Chest X-Ray PA View",
    category: "X-Ray",
    total: "1500",
    discount: "0",
    net: "1500",
    paid: "1500",
    due: "0",
    ward: "ICU-01",
    billPrint: "Y",
    ref: "Dr. Evelyn Reed",
    status: "Finalized",
    date: "2026-05-20",
    observations:
      "Lungs are hyperinflated but clear of focal consolidation. Cardiomegaly is present with mild vascular congestion. No pleural effusion or pneumothorax identified.",
    scanType: "chest",
    receiptNo: "R9123",
    paymentType: "Cash",
  },
  {
    no: "XR1002",
    patNo: "p3",
    patientName: "John Williams",
    testName: "Knee Joint AP/LAT",
    category: "X-Ray",
    total: "2000",
    discount: "200",
    net: "1800",
    paid: "0",
    due: "1800",
    ward: "G-101",
    billPrint: "N",
    ref: "Dr. Marcus Chen",
    status: "Draft",
    date: "2026-05-20",
    observations:
      "Mild narrowing of the medial joint compartment. Osteophyte formation at the superior patella. No acute fracture or dislocation seen.",
    scanType: "knee",
    receiptNo: "R9124",
    paymentType: "UPI",
  },
  {
    no: "MR2004",
    patNo: "p5",
    patientName: "Michael Torres",
    testName: "Lumbar Spine MRI",
    category: "MRI",
    total: "6500",
    discount: "500",
    net: "6000",
    paid: "6000",
    due: "0",
    ward: "P-201",
    billPrint: "Y",
    ref: "Dr. Robert Halen",
    status: "Review",
    date: "2026-05-19",
    observations:
      "L4-L5 disc protrusion causing mild mass effect on the ventral surface of the thecal sac. L5-S1 facet arthropathy noted.",
    scanType: "spine",
    receiptNo: "R9129",
    paymentType: "Card",
  },
];

const getScanSvgMarkup = (scanType: string, scanView: string) => {
  if (scanType === "chest") {
    if (scanView === "PA") {
      return `
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M 50 10 L 50 90" stroke-dasharray="3,3" />
          <path d="M 50 25 C 25 25, 20 40, 50 45" />
          <path d="M 50 25 C 75 25, 80 40, 50 45" />
          <path d="M 50 35 C 20 35, 15 55, 50 60" />
          <path d="M 50 35 C 80 35, 85 55, 50 60" />
          <path d="M 50 48 C 15 48, 10 70, 50 75" />
          <path d="M 50 48 C 85 48, 90 70, 50 75" />
          <path d="M 50 62 C 18 62, 12 85, 50 88" />
          <path d="M 50 62 C 82 62, 88 85, 50 88" />
          <path d="M 30 18 C 40 18, 45 22, 50 22" />
          <path d="M 70 18 C 60 18, 55 22, 50 22" />
          <ellipse cx="32" cy="50" rx="12" ry="24" stroke="rgba(15, 118, 110, 0.2)" fill="rgba(15, 118, 110, 0.05)" stroke-width="0.5" />
          <ellipse cx="68" cy="50" rx="12" ry="24" stroke="rgba(15, 118, 110, 0.2)" fill="rgba(15, 118, 110, 0.05)" stroke-width="0.5" />
          <path d="M 45 48 C 40 58, 55 65, 58 55 C 60 48, 48 44, 45 48" stroke="rgba(15, 118, 110, 0.4)" fill="rgba(15, 118, 110, 0.1)" stroke-width="1" />
        </svg>
      `;
    } else if (scanView === "LAT") {
      return `
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M 35 15 C 20 25, 20 75, 35 85" />
          <path d="M 35 15 C 55 10, 65 30, 60 50 C 55 65, 65 80, 50 85" />
          <path d="M 35 30 L 58 35 M 35 42 L 56 46 M 35 54 L 56 56 M 35 66 L 52 66" />
          <path d="M 50 10 Q 45 40, 48 90" stroke-dasharray="3,3" />
        </svg>
      `;
    } else {
      return `
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M 50 15 L 20 30 L 50 45 L 80 30 Z" stroke="rgba(15, 118, 110, 0.4)" />
          <path d="M 50 35 L 20 50 L 50 65 L 80 50 Z" stroke="rgba(15, 118, 110, 0.7)" />
          <path d="M 50 55 L 20 70 L 50 85 L 80 70 Z" />
          <path d="M 20 30 L 20 70 M 50 45 L 50 85 M 80 30 L 80 70" stroke-dasharray="2,2" stroke="rgba(15, 118, 110, 0.3)" />
        </svg>
      `;
    }
  } else if (scanType === "spine") {
    if (scanView === "SAG") {
      return `
        <svg viewBox="0 0 100 100" style="width: 100px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="42" y="15" width="16" height="8" rx="2" fill="rgba(15, 118, 110, 0.05)" />
          <rect x="42" y="27" width="16" height="8" rx="2" fill="rgba(15, 118, 110, 0.05)" />
          <rect x="40" y="39" width="20" height="9" rx="2" fill="rgba(15, 118, 110, 0.05)" />
          <rect x="38" y="52" width="24" height="10" rx="2" fill="rgba(15, 118, 110, 0.05)" />
          <rect x="36" y="66" width="28" height="11" rx="2" fill="rgba(15, 118, 110, 0.05)" />
          <circle cx="50" cy="50" r="4" stroke="#ef4444" fill="#ef4444" stroke-width="0.5" />
          <path d="M 47 10 L 47 90 M 53 10 L 53 90" stroke="rgba(15, 118, 110, 0.3)" stroke-width="1" />
        </svg>
      `;
    } else if (scanView === "AXI") {
      return `
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="50" cy="50" r="16" stroke="rgba(15, 118, 110, 0.3)" fill="rgba(15, 118, 110, 0.05)" />
          <path d="M 34 50 C 20 50, 25 35, 40 38" />
          <path d="M 66 50 C 80 50, 75 35, 60 38" />
          <path d="M 40 38 C 50 30, 50 30, 60 38" />
          <path d="M 50 66 L 50 85" />
          <path d="M 38 60 L 25 75" />
          <path d="M 62 60 L 75 75" />
          <circle cx="50" cy="50" r="4" stroke="#ef4444" fill="#ef4444" stroke-width="0.5" />
        </svg>
      `;
    } else {
      return `
        <svg viewBox="0 0 100 100" style="width: 120px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M 42 10 L 58 10 M 42 90 L 58 90" stroke-dasharray="2,2" />
          <rect x="45" y="20" width="10" height="10" rx="1" />
          <rect x="44" y="34" width="12" height="10" rx="1" />
          <rect x="43" y="48" width="14" height="10" rx="1" />
          <rect x="42" y="62" width="16" height="10" rx="1" />
          <path d="M 45 25 C 20 20, 20 40, 43 53" />
          <path d="M 55 25 C 80 20, 80 40, 57 53" />
          <circle cx="50" cy="53" r="3" stroke="#ef4444" fill="#ef4444" />
        </svg>
      `;
    }
  } else {
    // knee
    if (scanView === "AP") {
      return `
        <svg viewBox="0 0 100 100" style="width: 130px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M 40 10 L 40 38 C 40 45, 32 46, 36 52 C 40 56, 50 52, 50 48 C 50 52, 60 56, 64 52 C 68 46, 60 45, 60 38 L 60 10" />
          <path d="M 42 90 L 42 66 C 42 60, 36 59, 39 56 C 42 54, 50 55, 50 58 C 50 55, 58 54, 61 56 C 64 59, 58 60, 58 66 L 58 90" />
          <path d="M 68 90 L 68 62 C 68 59, 65 59, 66 58 C 67 57, 69 58, 69 60 L 69 90" stroke-width="1" />
          <line x1="38" y1="54" x2="62" y2="54" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1" stroke-dasharray="1,1" />
        </svg>
      `;
    } else if (scanView === "LAT") {
      return `
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M 40 10 L 40 45 C 40 52, 50 62, 45 70 L 45 90" />
          <path d="M 52 10 L 52 42 C 52 46, 56 48, 54 52 C 50 60, 56 72, 52 90" />
          <circle cx="46" cy="53" r="5" stroke="rgba(239, 68, 68, 0.6)" fill="rgba(239, 68, 68, 0.1)" stroke-width="1" />
        </svg>
      `;
    } else {
      return `
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; color: #0f766e;" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M 35 10 L 45 42 C 48 48, 42 54, 48 62 L 40 90" />
          <path d="M 55 10 L 53 38 C 52 42, 58 48, 52 56 L 58 90" />
          <circle cx="48" cy="50" r="4" stroke="#ef4444" fill="#ef4444" stroke-width="0.5" />
        </svg>
      `;
    }
  }
};

const parseObservations = (observationsStr: string, category = "Imaging") => {
  let findings = "";
  let impression = "";
  let technicalNotes = "";

  try {
    const parsed = JSON.parse(observationsStr);
    findings = parsed.findings || "";
    impression = parsed.impression || "";
    technicalNotes = parsed.technicalNotes || "";
  } catch (e) {
    findings = observationsStr || "";
    impression = "Normal study. No acute pathology identified.";
    technicalNotes = `Standard ${category} protocol performed.`;
  }

  return { findings, impression, technicalNotes };
};

export default function DiagnosticsEntry({
  title = "X-RAY",
}: { title?: string }) {
  const _navigate = useNavigate();
  const { user } = useAuthStore();

  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [patientReportFile, setPatientReportFile] = useState<string | null>(
    null,
  );
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Load hospital details
  useEffect(() => {
    const fetchHospitalDetails = async () => {
      const code = user?.hospitalCode || "HSP001";
      try {
        const info = await apiFetch<any>(`/super-admin/hospitals/code/${code}`);
        if (info) {
          setHospitalInfo(info);
        }
      } catch (err) {
        console.warn(
          "Could not retrieve hospital details in DiagnosticsEntry:",
          err,
        );
      }
    };
    if (user) {
      fetchHospitalDetails();
    }
  }, [user]);

  const handlePrintReport = async () => {
    if (!selectedReport) return;
    setIsPrinting(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      let patientDetails: any = null;
      try {
        patientDetails = await apiFetch<any>(
          `/reception/patients/${selectedReport.patNo}`,
          {
            headers: { "X-Hospital-Code": code },
          },
        );
      } catch (_) {
        /* silent */
      }

      let hospitalName =
        hospitalInfo?.hospitalName ||
        hospitalInfo?.name ||
        "Apollo Hospital Bangalore";
      if (hospitalName === "Charlie General Hospital")
        hospitalName = "Apollo Hospital Bangalore";
      const hospitalPhone = hospitalInfo?.phone || "+91 9292929292";
      const hospitalEmail =
        hospitalInfo?.email || `support@${code.toLowerCase()}.com`;
      const hospitalAddress =
        hospitalInfo?.address || "123 Healthcare Ave, Medical District";

      const patientName =
        selectedReport.patientName || patientDetails?.name || "Unknown Patient";
      const patientPhone2 =
        patientDetails?.phone || patientDetails?.alternativeNum || "—";
      const patientAge =
        patientDetails?.age ||
        (patientDetails?.dob
          ? `${new Date().getFullYear() - new Date(patientDetails.dob).getFullYear()} yrs`
          : "—");
      const patientGender = patientDetails?.gender || "—";
      const reportDate =
        selectedReport.date || new Date().toISOString().split("T")[0];

      const { findings, impression, technicalNotes } = parseObservations(
        selectedReport.observations,
        selectedReport.category,
      );

      // Scan visualization in printout
      let scanVisualHtml = "";
      if (patientReportFile) {
        if (
          patientReportFile.startsWith("data:image/") ||
          patientReportFile.match(/\.(jpeg|jpg|gif|png|webp)/i)
        ) {
          scanVisualHtml = `
            <div style="text-align: center; margin: 16px 0;">
              <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Patient Diagnostic Scan (Image)</div>
              <img src="${patientReportFile}" alt="Diagnostic Scan" style="max-height: 280px; max-width: 100%; border: 1.5px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" />
            </div>
          `;
        } else {
          scanVisualHtml = `
            <div style="text-align: center; margin: 16px 0; padding: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc;">
              <span style="font-size: 11px; font-weight: 600; color: #64748b;">Clinical Attachment: <a href="${patientReportFile}" target="_blank" style="color: #0f766e; text-decoration: underline;">Open Diagnostic PDF Document</a></span>
            </div>
          `;
        }
      } else {
        const svgMarkup = getScanSvgMarkup(selectedReport.scanType, scanView);
        scanVisualHtml = `
          <div style="text-align: center; margin: 16px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
            <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">PACS Console Reference Vector (${scanView} View)</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: inline-flex; align-items: center; justify-content: center; width: 180px; height: 160px;">
              ${svgMarkup}
            </div>
          </div>
        `;
      }

      let statusBg = "#fef3c7";
      let statusColor = "#d97706";
      let statusBorder = "#fde68a";
      if (selectedReport.status === "Finalized") {
        statusBg = "#d1fae5";
        statusColor = "#065f46";
        statusBorder = "#a7f3d0";
      } else if (selectedReport.status === "Draft") {
        statusBg = "#e0e7ff";
        statusColor = "#3730a3";
        statusBorder = "#c7d2fe";
      }

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Diagnostic Report – ${selectedReport.no}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff;line-height:1.5}
    .page{max-width:780px;margin:0 auto;padding:40px}
    .header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:18px;border-bottom:3px solid #0f766e;margin-bottom:22px;gap:16px}
    .logo-circle{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:900;letter-spacing:-1px;flex-shrink:0}
    .logo-row{display:flex;align-items:center;gap:10px}
    h1{font-size:20px;font-weight:800;color:#0f766e;letter-spacing:-0.5px;line-height:1}
    .sub{font-size:9.5px;color:#64748b;margin-top:3px;line-height:1.6}
    .rx-badge{text-align:right;flex-shrink:0}
    .doc-type{font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
    .rx-no{font-size:17px;font-weight:900;color:#0f766e;font-family:monospace}
    .stamp{display:inline-block;margin-top:6px;background:${statusBg};color:${statusColor};border:1.5px solid ${statusBorder};font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:3px 12px;border-radius:999px}
    
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
    .info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
    .card-title{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
    .irow{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;font-size:11.5px}
    .lbl{color:#64748b;font-weight:500}.val{color:#1e293b;font-weight:600;text-align:right}
    
    .sec-title{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#0f766e;margin-top:20px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
    
    .observations-box{background:#f8fafc;border-left:4px solid #0f766e;border-radius:0 8px 8px 0;padding:16px;font-size:12px;color:#334155;font-style:italic;line-height:1.6;margin-bottom:24px}
    
    .billing-table{width:100%;border-collapse:collapse;margin-top:10px}
    .billing-table th{background:#f1f5f9;color:#475569;font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:8px 12px;text-align:left;border:1px solid #e2e8f0}
    .billing-table td{padding:8px 12px;font-size:11.5px;color:#334155;border:1px solid #e2e8f0}
    .billing-table td.r, .billing-table th.r{text-align:right}
    
    .footer{margin-top:40px;border-top:1.5px dashed #cbd5e1;padding-top:14px}
    .fgrid{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
    .fleft{font-size:10px;color:#94a3b8;line-height:1.7}
    .fleft strong{color:#475569;font-weight:700}
    .sign-block{text-align:center;min-width:160px}
    .sign-line{border-top:1px solid #334155;margin-bottom:4px;margin-top:40px}
    .sign-lbl{font-size:9px;letter-spacing:0.5px;color:#64748b;text-transform:uppercase;font-weight:600}
    .gen-note{margin-top:16px;text-align:center;font-size:9px;color:#b0bec5;letter-spacing:0.3px}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{padding:20px}
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="hosp-brand">
      <div class="logo-row">
        <div class="logo-circle">H+</div>
        <div>
          <h1>${hospitalName}</h1>
          <div class="sub">${hospitalAddress}</div>
          <div class="sub">&#9742; ${hospitalPhone} &nbsp;|&nbsp; &#9993; ${hospitalEmail}</div>
        </div>
      </div>
    </div>
    <div class="rx-badge">
      <div class="doc-type">Diagnostic Report</div>
      <div class="rx-no">${selectedReport.no}</div>
      <div><span class="stamp">${selectedReport.status}</span></div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="card-title">Patient Profile</div>
      <div class="irow"><span class="lbl">Patient Name</span><span class="val">${patientName}</span></div>
      <div class="irow"><span class="lbl">Patient ID</span><span class="val" style="font-family:monospace">${selectedReport.patNo || "—"}</span></div>
      <div class="irow"><span class="lbl">Age / Gender</span><span class="val">${patientAge} / ${patientGender}</span></div>
      <div class="irow"><span class="lbl">Contact Info</span><span class="val">${patientPhone2}</span></div>
    </div>
    <div class="info-card">
      <div class="card-title">Investigation Metadata</div>
      <div class="irow"><span class="lbl">Modality Category</span><span class="val">${selectedReport.category}</span></div>
      <div class="irow"><span class="lbl">Procedure Type</span><span class="val">${selectedReport.testName}</span></div>
      <div class="irow"><span class="lbl">Referrer</span><span class="val">${selectedReport.ref}</span></div>
      <div class="irow"><span class="lbl">Date of Scan</span><span class="val">${reportDate}</span></div>
    </div>
  </div>

  <div class="sec-title">Imaging Visualization</div>
  ${scanVisualHtml}

  <div class="sec-title">Technical Notes / Protocol</div>
  <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 10px 14px; font-size: 11.5px; color: #475569; margin-bottom: 15px; border-radius: 0 6px 6px 0;">
    ${technicalNotes || "Standard protocol performed."}
  </div>

  <div class="sec-title">Clinical Findings</div>
  <div class="observations-box" style="margin-bottom: 15px;">
    ${findings || "No specific findings recorded."}
  </div>

  <div class="sec-title">Diagnostic Impression & Conclusion</div>
  <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 14px; font-size: 12px; font-weight: 600; color: #115e59; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
    ${impression || "Normal study. No acute pathology identified."}
  </div>

  <div class="sec-title">Billing & Payment Summary</div>
  <table class="billing-table">
    <thead>
      <tr>
        <th>Receipt No</th>
        <th>Procedure Description</th>
        <th class="r">Net Fee</th>
        <th class="r">Paid Amount</th>
        <th class="r">Due Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-family:monospace">${selectedReport.receiptNo || "—"}</td>
        <td>${selectedReport.testName}</td>
        <td class="r" style="font-family:monospace">&#8377;${Number(selectedReport.net).toLocaleString("en-IN")}</td>
        <td class="r" style="font-family:monospace; color:#10b981">&#8377;${Number(selectedReport.paid).toLocaleString("en-IN")}</td>
        <td class="r" style="font-family:monospace; color:#ef4444">&#8377;${Number(selectedReport.due).toLocaleString("en-IN")}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="fgrid">
      <div class="fleft">
        <strong>${hospitalName} Medical Imaging Dept.</strong><br/>
        ${hospitalAddress}<br/>
        PACS System Verified Record &nbsp;|&nbsp; Support: ${hospitalPhone}
      </div>
      <div class="sign-block">
        <div style="font-size:11px; font-weight:600; color:#1e293b">${selectedReport.ref}</div>
        <div class="sign-line"></div>
        <div class="sign-lbl">Attending Radiologist / Referrer</div>
      </div>
    </div>
    <p class="gen-note">This is a verified computer-generated medical record powered by HealthMatrix360 Clinical PACS Vault.</p>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`;

      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) {
        toast.error("Pop-up blocked — please allow pop-ups and try again");
        return;
      }
      win.document.write(html);
      win.document.close();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate print report");
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    if (!selectedReport || !selectedReport.id) {
      setPatientReportFile(null);
      return;
    }
    const idStr = String(selectedReport.id);

    // For LABREQ- entries (lab diagnostic requests) use the pre-fetched report file
    if (idStr.startsWith("LABREQ-")) {
      setPatientReportFile(selectedReport._linkedReportFile || null);
      return;
    }

    // For LAB- billing records there is no report file
    if (idStr.startsWith("LAB-")) {
      setPatientReportFile(null);
      return;
    }

    // For regular doctor diagnostic orders fetch from the lab reports endpoint
    const fetchReportFile = async () => {
      try {
        const code = user?.hospitalCode || "HSP001";
        const res = await apiFetch<any>(
          `/lab/diagnostic-reports/request/${selectedReport.id}`,
          {
            headers: { "X-Hospital-Code": code },
          },
        );
        if (res?.reportFile) {
          setPatientReportFile(res.reportFile);
        } else {
          setPatientReportFile(null);
        }
      } catch (_e) {
        setPatientReportFile(null);
      }
    };
    fetchReportFile();
  }, [selectedReport, user]);

  // Filters state
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterDate, filterType, searchQuery]);

  // Scan view adjustment states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isInverted, setIsInverted] = useState(false);
  const [scanView, setScanView] = useState("PA");
  const [isScanFullscreen, setIsScanFullscreen] = useState(false);
  const [scanZoom, setScanZoom] = useState(100);
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsScanFullscreen(false);
        setScanZoom(100);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close fullscreen when patient changes
  const prevReportNoRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      selectedReport &&
      prevReportNoRef.current !== null &&
      prevReportNoRef.current !== selectedReport.no
    ) {
      setIsScanFullscreen(false);
      setScanZoom(100);
    }
    prevReportNoRef.current = selectedReport?.no ?? null;
  }, [selectedReport]);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      // 1. Fetch dynamic active patient list
      const patientList = await apiFetch<any>("/doctor/patients", {
        headers: { "X-Hospital-Code": code },
      });
      const activePatients = Array.isArray(patientList)
        ? patientList
        : patientList?.content || [];
      setPatients(activePatients);

      // 1.5 Fetch doctor list & lab records for billing and referrer lookups
      let doctorMap: Record<string, string> = {};
      let records: any[] = [];
      try {
        const [docsRes, recordsRes] = await Promise.all([
          apiFetch<any>("/admin/doctors", {
            params: { page: 0, size: 200 },
            headers: {
              "X-Hospital-Code": code,
              "X-Hospital-Id": user?.hospitalId || "1",
            },
          }),
          apiFetch<any>("/lab/records", {
            headers: { "X-Hospital-Code": code },
            params: { page: 0, size: 1000 },
          }),
        ]);

        const docList = Array.isArray(docsRes)
          ? docsRes
          : docsRes?.content || [];
        docList.forEach((doc: any) => {
          const fullName = `Dr. ${doc.firstName} ${doc.lastName || ""}`.trim();
          doctorMap[String(doc.id)] = fullName;
          if (doc.doctorCode) {
            doctorMap[doc.doctorCode] = fullName;
            doctorMap[doc.doctorCode.toUpperCase()] = fullName;
            doctorMap[doc.doctorCode.toLowerCase()] = fullName;
          }
          if (doc.email) {
            doctorMap[doc.email] = fullName;
          }
          const nameKey = `${doc.firstName} ${doc.lastName || ""}`
            .trim()
            .toLowerCase();
          doctorMap[nameKey] = fullName;
          doctorMap[`dr. ${nameKey}`] = fullName;
        });

        records = Array.isArray(recordsRes)
          ? recordsRes
          : recordsRes?.content || [];
      } catch (err) {
        console.warn(
          "Failed to fetch lookups for billing / doctor names:",
          err,
        );
      }

      // 2. Fetch diagnostic orders for each patient in parallel
      const allOrders: any[] = [];
      const fetchPromises = activePatients.map(async (p) => {
        try {
          const patientNo = p.patientNo || p.id;
          const patientName = p.firstName
            ? `${p.firstName} ${p.lastName || ""}`.trim()
            : p.name || "Patient";
          const ordersData = await apiFetch<any>(
            `/doctor/diagnostics/${patientNo}`,
            {
              headers: { "X-Hospital-Code": code },
            },
          );
          const orders = Array.isArray(ordersData)
            ? ordersData
            : ordersData?.content || [];
          if (orders && Array.isArray(orders)) {
            orders.forEach((o) => {
              const test = o.testName || "Chest X-Ray PA View";
              const sType = test.toLowerCase().includes("knee")
                ? "knee"
                : test.toLowerCase().includes("spine")
                  ? "spine"
                  : "chest";

              const category = o.department || "X-Ray";

              // Find matching billing / referrer record from lab-service
              const matchedRecord = records.find(
                (r: any) =>
                  r.patientNo === patientNo &&
                  r.module?.toLowerCase() === category.toLowerCase(),
              );

              // Map doctor ID to Doctor Name
              const refId = matchedRecord?.refId;
              const refName = matchedRecord?.ref;
              let doctorName = "";

              if (refId && doctorMap[refId]) {
                doctorName = doctorMap[refId];
              } else if (refId && doctorMap[refId.toLowerCase()]) {
                doctorName = doctorMap[refId.toLowerCase()];
              } else if (refId && doctorMap[refId.toUpperCase()]) {
                doctorName = doctorMap[refId.toUpperCase()];
              } else if (refName && doctorMap[refName.toLowerCase()]) {
                doctorName = doctorMap[refName.toLowerCase()];
              } else if (refName && doctorMap[`dr. ${refName.toLowerCase()}`]) {
                doctorName = doctorMap[`dr. ${refName.toLowerCase()}`];
              } else if (
                refName &&
                refName.trim().length > 0 &&
                !refName.match(/^DR-?\d+$/i)
              ) {
                doctorName = refName.startsWith("Dr.")
                  ? refName
                  : `Dr. ${refName}`;
              } else {
                const remarksMatch = o.remarks?.match(
                  /referred by[:\s]+([\w\s.-]+)/i,
                )?.[1];
                if (remarksMatch && remarksMatch.trim().length > 0) {
                  doctorName = remarksMatch.startsWith("Dr.")
                    ? remarksMatch
                    : `Dr. ${remarksMatch}`;
                }
              }

              if (!doctorName) {
                doctorName =
                  doctorMap[user?.id || ""] ||
                  doctorMap[user?.email || ""] ||
                  "Dr. Evelyn Reed";
              }

              allOrders.push({
                id: o.id,
                no: `DG${o.id}`,
                patNo: o.patientNo,
                patientName: patientName,
                testName: test,
                category: category,
                total: matchedRecord ? String(matchedRecord.total) : "1500",
                discount: matchedRecord ? String(matchedRecord.discount) : "0",
                net: matchedRecord ? String(matchedRecord.net) : "1500",
                paid: matchedRecord ? String(matchedRecord.paid) : "1500",
                due: matchedRecord ? String(matchedRecord.due) : "0",
                ward:
                  matchedRecord?.wardBed ||
                  (p.status === "Admitted" ? "Ward 2B" : "OPD General"),
                billPrint: matchedRecord?.billPrint || "Y",
                ref: doctorName,
                status:
                  o.status === "PENDING"
                    ? "Draft"
                    : o.status === "COMPLETED"
                      ? "Finalized"
                      : "Review",
                date: o.orderedDate || new Date().toISOString().split("T")[0],
                observations:
                  o.remarks ||
                  "Scan registered. Diagnostics observations pending interpretation.",
                scanType: sType,
                receiptNo: matchedRecord?.id || `R${o.id}`,
                paymentType: matchedRecord?.payments?.[0]?.type || "Cash",
              });
            });
          }
        } catch (e) {
          console.warn(
            `Failed to fetch diagnostics for patient ${p.patientNo}:`,
            e,
          );
        }
      });

      await Promise.all(fetchPromises);

      // 3. Merge lab diagnostic requests sent by this doctor to the lab technician.
      //    These are created via "Send Request Lab" and processed by the lab tech.
      //    They should appear in the Diagnostics workstation alongside doctor orders.
      try {
        const [labRequestsRes, labReportsRes] = await Promise.all([
          apiFetch<any[]>("/lab/diagnostic-requests", {
            headers: { "X-Hospital-Code": code },
          }),
          apiFetch<any[]>("/lab/diagnostic-reports", {
            headers: { "X-Hospital-Code": code },
          }),
        ]);

        const labRequests = Array.isArray(labRequestsRes) ? labRequestsRes : [];
        const labReports = Array.isArray(labReportsRes) ? labReportsRes : [];

        // Build a quick lookup: requestId -> report
        const reportByRequestId: Record<number, any> = {};
        labReports.forEach((rep: any) => {
          if (rep.requestId) reportByRequestId[rep.requestId] = rep;
        });

        // Determine which service types belong to this workstation
        const titleUpper = title.toUpperCase();
        const serviceTypeMatches = (serviceType: string): boolean => {
          const st = serviceType?.toLowerCase() || "";
          if (titleUpper === "X-RAY")
            return (
              st.includes("x-ray") || st.includes("xray") || st === "x ray"
            );
          if (titleUpper === "USG") return st.includes("usg");
          if (titleUpper === "CT-SCAN" || titleUpper === "CT SCAN")
            return (
              st.includes("ct") ||
              st.includes("ct-scan") ||
              st.includes("ctscan")
            );
          if (titleUpper === "LAB")
            return st.includes("lab") || st.includes("laboratory");
          // OTHER SERVICES: MRI, Echo, OT, Physiotherapy, Day Care, CT Scan
          return (
            st.includes("mri") ||
            st.includes("echo") ||
            st.includes("ot") ||
            st.includes("physio") ||
            st.includes("day care") ||
            st.includes("daycare") ||
            st.includes("datcare") ||
            st.includes("ct")
          );
        };

        const existingPatNos = new Set(
          allOrders.map((o) => `${o.patNo}-${o.testName}`),
        );

        // Filter requests that match this workstation's service type
        const matchingRequests = labRequests.filter((req: any) =>
          serviceTypeMatches(req.serviceType),
        );

        matchingRequests.forEach((req: any) => {
          const dedupeKey = `${req.patientNo}-${req.serviceType}`;
          if (existingPatNos.has(dedupeKey)) return;

          const linkedReport = reportByRequestId[req.id];
          const sType = req.serviceType?.toLowerCase().includes("knee")
            ? "knee"
            : req.serviceType?.toLowerCase().includes("spine")
              ? "spine"
              : "chest";

          // Map status
          let status = "Draft";
          if (req.status === "SENT_TO_DOCTOR" || req.status === "REVIEWED") {
            status = "Finalized";
          } else if (
            req.status === "COMPLETED" ||
            req.status === "IN_PROGRESS"
          ) {
            status = "Review";
          }

          // Build observations from linked report if available
          const observations = linkedReport
            ? JSON.stringify({
                findings: linkedReport.findings || "",
                impression: linkedReport.impression || "",
                technicalNotes:
                  linkedReport.technicianNotes ||
                  `${req.serviceType} performed.`,
              })
            : req.clinicianNotes ||
              "Scan registered. Diagnostics observations pending interpretation.";

          // Resolve referring doctor name
          const refId = req.reportingDoctorId || req.referredDoctorId;
          let doctorName =
            doctorMap[refId] ||
            doctorMap[String(refId).toLowerCase()] ||
            doctorMap[String(refId).toUpperCase()] ||
            "";
          if (!doctorName && refId && !String(refId).match(/^DR-?\d+$/i)) {
            doctorName = String(refId).startsWith("Dr.")
              ? String(refId)
              : `Dr. ${refId}`;
          }
          if (!doctorName) {
            doctorName =
              doctorMap[user?.id || ""] || doctorMap[user?.email || ""] || "";
          }

          allOrders.push({
            id: `LABREQ-${req.id}`,
            no: `LR${req.id}`,
            patNo: req.patientNo,
            patientName: req.patientName,
            testName: req.serviceType,
            category: req.serviceType,
            total: "0",
            discount: "0",
            net: "0",
            paid: "0",
            due: "0",
            ward: req.place || "OPD General",
            billPrint: "Y",
            ref: doctorName,
            status,
            date:
              req.createdAt?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            observations,
            scanType: sType,
            receiptNo: `LR${req.id}`,
            paymentType: "Cash",
            // Attach the raw linked report so the report file viewer can use it
            _linkedReportFile: linkedReport?.reportFile || null,
          });
          existingPatNos.add(dedupeKey);
        });
      } catch (labErr) {
        console.warn("Failed to merge lab diagnostic requests:", labErr);
      }

      // Use backend data if available, otherwise keep INITIAL_REPORTS as fallback
      if (allOrders.length > 0) {
        setReports(allOrders);
        setSelectedReport(allOrders[0] || null);
      } else {
        setReports(INITIAL_REPORTS);
        setSelectedReport(INITIAL_REPORTS[0] || null);
      }
    } catch (e) {
      console.warn("Failed to fetch diagnostics from backend.", e);
      setReports(INITIAL_REPORTS);
      setSelectedReport(INITIAL_REPORTS[0] || null);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [user]);

  const handleRefresh = () => {
    fetchDiagnostics();
    toast.success("Refreshed all diagnostic scans from clinical vault!");
  };

  const handleUpdateStatus = (no: string, newStatus: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.no === no) {
          const updated = { ...r, status: newStatus };
          if (selectedReport?.no === no) {
            setSelectedReport(updated);
          }
          toast.success(`Diagnostic report ${no} marked as ${newStatus}`);
          return updated;
        }
        return r;
      }),
    );
  };

  const handleSaveObservationsField = (
    no: string,
    field: "findings" | "impression" | "technicalNotes",
    value: string,
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.no === no) {
          let currentObj = {
            findings: "",
            impression: "",
            technicalNotes: "",
          };
          try {
            currentObj = JSON.parse(r.observations);
          } catch (e) {
            currentObj.findings = r.observations;
            currentObj.impression =
              "Normal study. No acute pathology identified.";
            currentObj.technicalNotes = `Standard ${r.category || "imaging"} protocol performed.`;
          }

          currentObj[field] = value;
          const updatedStr = JSON.stringify(currentObj);

          const updated = { ...r, observations: updatedStr };
          if (selectedReport?.no === no) {
            setSelectedReport(updated);
          }
          return updated;
        }
        return r;
      }),
    );
  };

  const handleDeleteEntry = async (id: number | string) => {
    try {
      setIsDeleting(true);
      const code = user?.hospitalCode || "HSP001";
      const idStr = String(id);
      if (idStr.startsWith("LABREQ-")) {
        const realId = idStr.replace("LABREQ-", "");
        await apiFetch<void>(`/lab/diagnostic-requests/${realId}`, {
          method: "DELETE",
          headers: { "X-Hospital-Code": code },
        });
      } else if (idStr.startsWith("LAB-")) {
        const realId = idStr.replace("LAB-", "");
        await apiFetch<void>(`/lab/records/${realId}`, {
          method: "DELETE",
          headers: { "X-Hospital-Code": code },
        });
      } else {
        await apiFetch<void>(`/doctor/diagnostics/${id}`, {
          method: "DELETE",
          headers: { "X-Hospital-Code": code },
        });
      }
      toast.success("Diagnostic entry deleted successfully.");
      setDeleteTargetId(null);
      fetchDiagnostics();
    } catch (err: any) {
      console.error("Failed to delete diagnostic entry:", err);
      toast.error("Failed to delete diagnostic entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  const uniqueCategories = Array.from(
    new Set(reports.map((r) => r.category).filter(Boolean)),
  ) as string[];

  const filteredReports = reports.filter((r) => {
    const matchesDate = !filterDate || r.date === filterDate;
    const matchesType = filterType === "ALL" || r.category === filterType;
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.no.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesType && matchesSearch;
  });

  const startIndex = page * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="diagnostics.page"
    >
      {/* Header */}
      <div className="flex-none flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              {title} Workstation
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Universal Diagnostic Entry, Digital Imaging Viewer & Reports
              (Screens 35, 36)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-1.5 text-xs border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Workstation
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Panel: Diagnostic Logs (60% width) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          {/* Filters Area */}
          <div className="p-3 border-b border-border bg-slate-50/50 flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  Date of Diagnostic
                </Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1 min-w-[120px]">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  Modality Category
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Modalities</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[200px] relative">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  Search Patient / Report #
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Add Entry Modal Button */}
          </div>

          {/* Diagnostic Log Table */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">
                  Querying secure DICOM log archive...
                </span>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="px-4 py-3 font-semibold text-slate-500 w-16">
                      No.
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500">
                      Patient
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500">
                      Modality Procedure
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Net Fee
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">Paid</th>
                    <th className="px-4 py-3 font-semibold text-right">Due</th>
                    <th className="px-4 py-3 font-semibold">Ward/Bed</th>
                    <th className="px-4 py-3 font-semibold">Referrer</th>
                    <th className="px-4 py-3 font-semibold text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReports.map((row) => (
                    <tr
                      key={row.no}
                      className={`hover:bg-teal-50/20 cursor-pointer transition-colors ${selectedReport?.no === row.no ? "bg-teal-50/40" : ""}`}
                      onClick={() => {
                        setSelectedReport(row);
                        // Reset scan views on patient change
                        setBrightness(100);
                        setContrast(100);
                        setIsInverted(false);
                        setScanView(
                          row.scanType === "spine"
                            ? "SAG"
                            : row.scanType === "chest"
                              ? "PA"
                              : "AP",
                        );
                      }}
                    >
                      <td className="px-4 py-3.5 font-mono text-teal-600 font-bold">
                        {row.no}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {row.patientName}
                        </div>
                        <div className="text-[9px] text-muted-foreground font-mono">
                          {row.patNo}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-foreground">
                          {row.testName}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 bg-slate-50"
                        >
                          {row.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        ₹{row.net}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-500">
                        ₹{row.paid}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-500">
                        ₹{row.due}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{row.ward}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {row.ref}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            row.status === "Finalized"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : row.status === "Review"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-indigo-500/10 text-indigo-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-12 text-slate-400 font-medium"
                      >
                        No matching diagnostic logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-2 border-t border-border/20 bg-slate-50/30 flex-none">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(filteredReports.length / pageSize)}
              totalElements={filteredReports.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(0);
              }}
            />
          </div>
        </div>

        {/* Right Panel: Radiology Diagnostics Console (40% width) */}
        {selectedReport && (
          <div className="w-full lg:w-[440px] flex-none bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              {/* Header metadata */}
              <div className="flex items-start justify-between border-b border-border pb-2">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Console View
                  </span>
                  <h3 className="font-bold text-foreground text-sm mt-1">
                    {selectedReport.patientName}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    Report Ref: {selectedReport.no} · Location:{" "}
                    {selectedReport.ward}
                  </p>
                </div>
                <Select
                  value={selectedReport.status}
                  onValueChange={(val) =>
                    handleUpdateStatus(selectedReport.no, val)
                  }
                >
                  <SelectTrigger className="h-7 w-28 text-[10px] font-bold uppercase bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="Draft"
                      className="text-[10px] uppercase font-bold"
                    >
                      DRAFT
                    </SelectItem>
                    <SelectItem
                      value="Review"
                      className="text-[10px] uppercase font-bold text-amber-600"
                    >
                      IN REVIEW
                    </SelectItem>
                    <SelectItem
                      value="Finalized"
                      className="text-[10px] uppercase font-bold text-emerald-600"
                    >
                      FINALIZED
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 1. MOCK RADIOLOGY SCAN VIEWER */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3 h-3 text-teal-600" /> Digital Scan Image
                    ({scanView})
                  </span>
                  <div className="flex gap-1.5 items-center">
                    {/* Angle Selector Tabs */}
                    <div className="flex border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 overflow-hidden text-[8px] font-bold uppercase">
                      {selectedReport.scanType === "chest" &&
                        ["PA", "LAT", "3D"].map((view) => (
                          <button
                            key={view}
                            type="button"
                            className={`px-1.5 py-0.5 border-r border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800 ${scanView === view ? "bg-teal-500 text-white hover:bg-teal-600 border-teal-500" : "text-slate-600 dark:text-slate-400"}`}
                            onClick={() => setScanView(view)}
                          >
                            {view}
                          </button>
                        ))}
                      {selectedReport.scanType === "spine" &&
                        ["SAG", "AXI", "COR"].map((view) => (
                          <button
                            key={view}
                            type="button"
                            className={`px-1.5 py-0.5 border-r border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800 ${scanView === view ? "bg-teal-500 text-white hover:bg-teal-600 border-teal-500" : "text-slate-600 dark:text-slate-400"}`}
                            onClick={() => setScanView(view)}
                          >
                            {view}
                          </button>
                        ))}
                      {selectedReport.scanType === "knee" &&
                        ["AP", "LAT", "OBL"].map((view) => (
                          <button
                            key={view}
                            type="button"
                            className={`px-1.5 py-0.5 border-r border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800 ${scanView === view ? "bg-teal-500 text-white hover:bg-teal-600 border-teal-500" : "text-slate-600 dark:text-slate-400"}`}
                            onClick={() => setScanView(view)}
                          >
                            {view}
                          </button>
                        ))}
                    </div>

                    <button
                      type="button"
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-slate-300 hover:bg-slate-100 ${isInverted ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600" : "bg-white"}`}
                      onClick={() => setIsInverted(!isInverted)}
                    >
                      Invert
                    </button>
                    <button
                      type="button"
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-white border border-slate-300 hover:bg-slate-100"
                      onClick={() => {
                        setBrightness(100);
                        setContrast(100);
                        setIsInverted(false);
                        setScanView(
                          selectedReport.scanType === "spine"
                            ? "SAG"
                            : selectedReport.scanType === "chest"
                              ? "PA"
                              : "AP",
                        );
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      title="View fullscreen"
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-teal-600 text-white border border-teal-600 hover:bg-teal-700 flex items-center gap-1"
                      onClick={() => setIsScanFullscreen(true)}
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      Full
                    </button>
                  </div>
                </div>
                {/* Chest X-ray SVG / Spine MRI SVG / Knee SVG */}
                <div className="relative rounded-lg overflow-hidden border border-slate-950 bg-slate-950 h-36 flex items-center justify-center p-2">
                  <div
                    className="w-full h-full flex items-center justify-center transition-all duration-200"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? "invert(100%)" : ""}`,
                    }}
                  >
                    {patientReportFile ? (
                      patientReportFile.startsWith("data:image/") ||
                      patientReportFile.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                        <img
                          src={patientReportFile}
                          alt="Patient Diagnostic Scan"
                          className="max-w-full max-h-[120px] object-contain rounded"
                        />
                      ) : (
                        <iframe
                          src={patientReportFile}
                          title="Diagnostic Scan PDF"
                          className="w-full h-full border-0 bg-white rounded"
                        />
                      )
                    ) : selectedReport.scanType === "chest" ? (
                      scanView === "PA" ? (
                        <svg
                          viewBox="0 0 100 100"
                          className="w-24 h-24 opacity-75 text-cyan-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M 50 10 L 50 90" strokeDasharray="3,3" />
                          <path d="M 50 25 C 25 25, 20 40, 50 45" />
                          <path d="M 50 25 C 75 25, 80 40, 50 45" />
                          <path d="M 50 35 C 20 35, 15 55, 50 60" />
                          <path d="M 50 35 C 80 35, 85 55, 50 60" />
                          <path d="M 50 48 C 15 48, 10 70, 50 75" />
                          <path d="M 50 48 C 85 48, 90 70, 50 75" />
                          <path d="M 50 62 C 18 62, 12 85, 50 88" />
                          <path d="M 50 62 C 82 62, 88 85, 50 88" />
                          <path d="M 30 18 C 40 18, 45 22, 50 22" />
                          <path d="M 70 18 C 60 18, 55 22, 50 22" />
                          <ellipse
                            cx="32"
                            cy="50"
                            rx="12"
                            ry="24"
                            className="stroke-cyan-500/20 fill-cyan-500/5"
                            strokeWidth="0.5"
                          />
                          <ellipse
                            cx="68"
                            cy="50"
                            rx="12"
                            ry="24"
                            className="stroke-cyan-500/20 fill-cyan-500/5"
                            strokeWidth="0.5"
                          />
                          <path
                            d="M 45 48 C 40 58, 55 65, 58 55 C 60 48, 48 44, 45 48"
                            className="stroke-cyan-300/40 fill-cyan-300/10"
                            strokeWidth="1"
                          />
                        </svg>
                      ) : scanView === "LAT" ? (
                        <svg
                          viewBox="0 0 100 100"
                          className="w-24 h-24 opacity-75 text-cyan-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M 35 15 C 20 25, 20 75, 35 85" />
                          <path d="M 35 15 C 55 10, 65 30, 60 50 C 55 65, 65 80, 50 85" />
                          <path d="M 35 30 L 58 35 M 35 42 L 56 46 M 35 54 L 56 56 M 35 66 L 52 66" />
                          <path
                            d="M 50 10 Q 45 40, 48 90"
                            strokeDasharray="3,3"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 100 100"
                          className="w-24 h-24 opacity-75 text-cyan-300"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M 50 15 L 20 30 L 50 45 L 80 30 Z"
                            className="stroke-cyan-500/40"
                          />
                          <path
                            d="M 50 35 L 20 50 L 50 65 L 80 50 Z"
                            className="stroke-cyan-500/70"
                          />
                          <path d="M 50 55 L 20 70 L 50 85 L 80 70 Z" />
                          <path
                            d="M 20 30 L 20 70 M 50 45 L 50 85 M 80 30 L 80 70"
                            strokeDasharray="2,2"
                            className="stroke-cyan-600/30"
                          />
                        </svg>
                      )
                    ) : selectedReport.scanType === "spine" ? (
                      scanView === "SAG" ? (
                        <svg
                          viewBox="0 0 100 100"
                          className="w-18 h-24 opacity-75 text-amber-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="42"
                            y="15"
                            width="16"
                            height="8"
                            rx="2"
                            className="fill-amber-500/5"
                          />
                          <rect
                            x="42"
                            y="27"
                            width="16"
                            height="8"
                            rx="2"
                            className="fill-amber-500/5"
                          />
                          <rect
                            x="40"
                            y="39"
                            width="20"
                            height="9"
                            rx="2"
                            className="fill-amber-500/5"
                          />
                          <rect
                            x="38"
                            y="52"
                            width="24"
                            height="10"
                            rx="2"
                            className="fill-amber-500/5"
                          />
                          <rect
                            x="36"
                            y="66"
                            width="28"
                            height="11"
                            rx="2"
                            className="fill-amber-500/5"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="4"
                            className="stroke-red-500 fill-red-500 animate-pulse"
                            strokeWidth="0.5"
                          />
                          <path
                            d="M 47 10 L 47 90 M 53 10 L 53 90"
                            stroke="rgba(245, 158, 11, 0.3)"
                            strokeWidth="1"
                          />
                        </svg>
                      ) : scanView === "AXI" ? (
                        <svg
                          viewBox="0 0 100 100"
                          className="w-24 h-24 opacity-75 text-amber-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="16"
                            className="stroke-amber-500/30 fill-amber-500/5"
                          />
                          <path d="M 34 50 C 20 50, 25 35, 40 38" />
                          <path d="M 66 50 C 80 50, 75 35, 60 38" />
                          <path d="M 40 38 C 50 30, 50 30, 60 38" />
                          <path d="M 50 66 L 50 85" />
                          <path d="M 38 60 L 25 75" />
                          <path d="M 62 60 L 75 75" />
                          <circle
                            cx="50"
                            cy="50"
                            r="4"
                            className="stroke-red-500 fill-red-500 animate-pulse"
                            strokeWidth="0.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 100 100"
                          className="w-20 h-28 opacity-75 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M 42 10 L 58 10 M 42 90 L 58 90"
                            strokeDasharray="2,2"
                          />
                          <rect x="45" y="20" width="10" height="10" rx="1" />
                          <rect x="44" y="34" width="12" height="10" rx="1" />
                          <rect x="43" y="48" width="14" height="10" rx="1" />
                          <rect x="42" y="62" width="16" height="10" rx="1" />
                          <path d="M 45 25 C 20 20, 20 40, 43 53" />
                          <path d="M 55 25 C 80 20, 80 40, 57 53" />
                          <circle
                            cx="50"
                            cy="53"
                            r="3"
                            className="stroke-red-500 fill-red-500 animate-pulse"
                          />
                        </svg>
                      )
                    ) : scanView === "AP" ? (
                      <svg
                        viewBox="0 0 100 100"
                        className="w-22 h-24 opacity-75 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M 40 10 L 40 38 C 40 45, 32 46, 36 52 C 40 56, 50 52, 50 48 C 50 52, 60 56, 64 52 C 68 46, 60 45, 60 38 L 60 10" />
                        <path d="M 42 90 L 42 66 C 42 60, 36 59, 39 56 C 42 54, 50 55, 50 58 C 50 55, 58 54, 61 56 C 64 59, 58 60, 58 66 L 58 90" />
                        <path
                          d="M 68 90 L 68 62 C 68 59, 65 59, 66 58 C 67 57, 69 58, 69 60 L 69 90"
                          strokeWidth="1"
                        />
                        <line
                          x1="38"
                          y1="54"
                          x2="62"
                          y2="54"
                          stroke="rgba(239, 68, 68, 0.4)"
                          strokeWidth="1"
                          strokeDasharray="1,1"
                        />
                      </svg>
                    ) : scanView === "LAT" ? (
                      <svg
                        viewBox="0 0 100 100"
                        className="w-24 h-24 opacity-75 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M 40 10 L 40 45 C 40 52, 50 62, 45 70 L 45 90" />
                        <path d="M 52 10 L 52 42 C 52 46, 56 48, 54 52 C 50 60, 56 72, 52 90" />
                        <circle
                          cx="46"
                          cy="53"
                          r="5"
                          className="stroke-red-500/60 fill-red-500/10"
                          strokeWidth="1"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 100 100"
                        className="w-24 h-24 opacity-75 text-emerald-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M 35 10 L 45 42 C 48 48, 42 54, 48 62 L 40 90" />
                        <path d="M 55 10 L 53 38 C 52 42, 58 48, 52 56 L 58 90" />
                        <circle
                          cx="48"
                          cy="50"
                          r="4"
                          className="stroke-red-500 fill-red-500 animate-pulse"
                          strokeWidth="0.5"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="absolute bottom-1 right-2 font-mono text-[8px] text-slate-500 font-bold uppercase">
                    DICOM Render v1
                  </span>
                  {/* Fullscreen expand trigger */}
                  <button
                    type="button"
                    title="View fullscreen"
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-800/70 hover:bg-teal-600 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setIsScanFullscreen(true)}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
                {/* ======= FULLSCREEN SCAN OVERLAY ======= */}
                {isScanFullscreen && (
                  <div
                    className="fixed inset-0 z-[9999] bg-black/96 flex flex-col"
                    // biome-ignore lint/a11y/useKeyWithClickEvents: handled via window keydown
                    onClick={(e) => {
                      if (e.target === e.currentTarget)
                        setIsScanFullscreen(false);
                    }}
                  >
                    {/* Top bar */}
                    <div className="flex-none flex items-center justify-between px-6 py-3 bg-slate-950/90 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                          {selectedReport.patientName} &mdash;{" "}
                          {selectedReport.testName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {selectedReport.patNo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* View tabs */}
                        <div className="flex border border-slate-700 rounded overflow-hidden text-[9px] font-bold uppercase">
                          {selectedReport.scanType === "chest" &&
                            ["PA", "LAT", "3D"].map((v) => (
                              <button
                                key={v}
                                type="button"
                                className={`px-2 py-1 border-r border-slate-700 last:border-0 ${
                                  scanView === v
                                    ? "bg-teal-500 text-white"
                                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                                }`}
                                onClick={() => setScanView(v)}
                              >
                                {v}
                              </button>
                            ))}
                          {selectedReport.scanType === "spine" &&
                            ["SAG", "AXI", "COR"].map((v) => (
                              <button
                                key={v}
                                type="button"
                                className={`px-2 py-1 border-r border-slate-700 last:border-0 ${
                                  scanView === v
                                    ? "bg-teal-500 text-white"
                                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                                }`}
                                onClick={() => setScanView(v)}
                              >
                                {v}
                              </button>
                            ))}
                          {selectedReport.scanType === "knee" &&
                            ["AP", "LAT", "OBL"].map((v) => (
                              <button
                                key={v}
                                type="button"
                                className={`px-2 py-1 border-r border-slate-700 last:border-0 ${
                                  scanView === v
                                    ? "bg-teal-500 text-white"
                                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                                }`}
                                onClick={() => setScanView(v)}
                              >
                                {v}
                              </button>
                            ))}
                        </div>
                        <button
                          type="button"
                          className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${
                            isInverted
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                          }`}
                          onClick={() => setIsInverted(!isInverted)}
                        >
                          Invert
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded text-[9px] font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800"
                          onClick={() => {
                            setBrightness(100);
                            setContrast(100);
                            setIsInverted(false);
                          }}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white transition-colors"
                          onClick={() => setIsScanFullscreen(false)}
                        >
                          <Minimize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Scan content — fills the remaining space */}
                    <div
                      className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden px-4 py-4"
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                          isInverted ? "invert(100%)" : ""
                        }`,
                      }}
                      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: zoom wheel handler
                      onWheel={(e) => {
                        e.preventDefault();
                        setScanZoom((z) =>
                          Math.min(
                            400,
                            Math.max(25, z + (e.deltaY < 0 ? 10 : -10)),
                          ),
                        );
                      }}
                    >
                      {/* Inner wrapper — only this scales, not the filter parent */}
                      <div
                        style={{
                          transform: `scale(${scanZoom / 100})`,
                          transformOrigin: "center center",
                          transition: "transform 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {patientReportFile ? (
                          patientReportFile.startsWith("data:image/") ||
                          patientReportFile.match(
                            /\.(jpeg|jpg|gif|png|webp)/i,
                          ) ? (
                            <img
                              src={patientReportFile}
                              alt="Patient Diagnostic Scan (Fullscreen)"
                              className="max-w-[90vw] max-h-[calc(100vh-160px)] object-contain select-none"
                              draggable={false}
                            />
                          ) : (
                            <iframe
                              src={patientReportFile}
                              title="Diagnostic Scan PDF Fullscreen"
                              className="w-[90vw] h-[calc(100vh-160px)] border-0 bg-white"
                            />
                          )
                        ) : (
                          // Render same SVG anatomy at large scale
                          <div
                            className="opacity-90"
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled SVG output
                            dangerouslySetInnerHTML={{
                              __html: getScanSvgMarkup(
                                selectedReport.scanType,
                                scanView,
                              ).replace(
                                /style="width: 140px; height: 140px;/g,
                                'style="width: 480px; height: 480px;',
                              ),
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Bottom controls: Brightness, Contrast, Zoom */}
                    <div className="flex-none flex items-center justify-center gap-6 px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex-wrap">
                      {/* Brightness */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="text-[10px] text-slate-400 font-bold uppercase w-20 flex items-center gap-1">
                          <Sliders className="w-3 h-3" /> Brightness
                        </span>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={brightness}
                          onChange={(e) =>
                            setBrightness(Number.parseInt(e.target.value))
                          }
                          className="w-28 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <span className="text-[10px] font-mono text-teal-400 w-10">
                          {brightness}%
                        </span>
                      </div>
                      {/* Contrast */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="text-[10px] text-slate-400 font-bold uppercase w-20 flex items-center gap-1">
                          <Sliders className="w-3 h-3" /> Contrast
                        </span>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={contrast}
                          onChange={(e) =>
                            setContrast(Number.parseInt(e.target.value))
                          }
                          className="w-28 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <span className="text-[10px] font-mono text-teal-400 w-10">
                          {contrast}%
                        </span>
                      </div>
                      {/* Zoom controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Zoom
                        </span>
                        <button
                          type="button"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                          disabled={scanZoom <= 25}
                          onClick={() =>
                            setScanZoom((z) => Math.max(25, z - 10))
                          }
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 font-mono text-[10px] font-bold min-w-[40px] text-center"
                          onClick={() => setScanZoom(100)}
                          title="Reset zoom"
                        >
                          {scanZoom}%
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                          disabled={scanZoom >= 400}
                          onClick={() =>
                            setScanZoom((z) => Math.min(400, z + 10))
                          }
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="range"
                          min="25"
                          max="400"
                          step="5"
                          value={scanZoom}
                          onChange={(e) =>
                            setScanZoom(Number.parseInt(e.target.value))
                          }
                          className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                      </div>
                      <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">
                        DICOM Render v1 &mdash; Fullscreen
                      </span>
                    </div>
                  </div>
                )}{" "}
              </div>

              {/* Precision Sliders side-by-side */}
              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-100 dark:bg-slate-950 border border-border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-slate-500" /> Brightness
                    </span>
                    <span className="font-mono text-slate-800">
                      {brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) =>
                      setBrightness(Number.parseInt(e.target.value))
                    }
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-slate-500" /> Contrast
                    </span>
                    <span className="font-mono text-slate-800">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) =>
                      setContrast(Number.parseInt(e.target.value))
                    }
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. CLINICAL OBSERVATIONS */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-teal-600" />{" "}
                Diagnostic Interpretation & Notes
              </span>

              {(() => {
                const { findings, impression, technicalNotes } =
                  parseObservations(
                    selectedReport.observations,
                    selectedReport.category,
                  );
                return (
                  <>
                    {/* Technical Notes */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">
                        Technical Notes / Protocol
                      </Label>
                      <div className="bg-white dark:bg-slate-950 rounded-lg border border-border overflow-hidden">
                        <Textarea
                          rows={1}
                          key={`${selectedReport.no}-tech`}
                          defaultValue={technicalNotes}
                          onBlur={(e) =>
                            handleSaveObservationsField(
                              selectedReport.no,
                              "technicalNotes",
                              e.target.value,
                            )
                          }
                          placeholder="Protocol, technique or technical notes..."
                          className="text-xs border-0 focus-visible:ring-0 leading-relaxed placeholder:text-slate-400 min-h-[35px] resize-none font-medium italic"
                        />
                      </div>
                    </div>

                    {/* Findings */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">
                        Findings
                      </Label>
                      <div className="bg-white dark:bg-slate-950 rounded-lg border border-border overflow-hidden">
                        <Textarea
                          rows={2}
                          key={`${selectedReport.no}-find`}
                          defaultValue={findings}
                          onBlur={(e) =>
                            handleSaveObservationsField(
                              selectedReport.no,
                              "findings",
                              e.target.value,
                            )
                          }
                          placeholder="Detailed clinical findings..."
                          className="text-xs border-0 focus-visible:ring-0 leading-relaxed placeholder:text-slate-400 min-h-[50px] resize-none font-medium italic"
                        />
                      </div>
                    </div>

                    {/* Impression */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase">
                        Impression / Conclusion
                      </Label>
                      <div className="bg-white dark:bg-slate-950 rounded-lg border border-border overflow-hidden">
                        <Textarea
                          rows={1}
                          key={`${selectedReport.no}-imp`}
                          defaultValue={impression}
                          onBlur={(e) =>
                            handleSaveObservationsField(
                              selectedReport.no,
                              "impression",
                              e.target.value,
                            )
                          }
                          placeholder="Diagnostic impression or conclusion..."
                          className="text-xs border-0 focus-visible:ring-0 leading-relaxed font-semibold placeholder:text-slate-400 min-h-[35px] resize-none font-semibold italic text-teal-800 dark:text-teal-400"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="p-1.5 border border-slate-100 bg-slate-50 dark:bg-slate-800 flex items-center justify-between rounded-lg">
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Signed off by Dr. Reed
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  Auto-Saving
                </span>
              </div>
            </div>

            {/* Print & share controls */}
            <div className="flex gap-2 pt-3 border-t border-border mt-3">
              <Button
                disabled={isPrinting}
                className="flex-1 text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-sm"
                onClick={handlePrintReport}
              >
                {isPrinting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                )}
                Print Patient Report
              </Button>
              <Button
                variant="outline"
                type="button"
                className="text-xs font-semibold border-slate-200 hover:bg-slate-100"
                onClick={() =>
                  toast.success(
                    `Report WhatsApp share link copied for ${selectedReport.patientName}`,
                  )
                }
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                type="button"
                className="text-xs font-semibold shadow-sm"
                onClick={() => setDeleteTargetId(selectedReport.id)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete Entry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTargetId(null)}
      >
        <DialogContent className="sm:max-w-md border-0 bg-white/90 backdrop-blur-xl dark:bg-slate-900/90 shadow-2xl rounded-2xl overflow-hidden p-0 gap-0">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center border border-rose-100 dark:border-rose-900/30 animate-pulse flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Delete Diagnostic Entry?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedReport?.patientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modality:</span>
                <span className="font-mono bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-teal-600 dark:text-teal-400 font-bold">
                  {selectedReport?.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Procedure:</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {selectedReport?.testName}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Deleting this entry will remove the diagnostic record, clinician
              observations, and any associated scan reports from the clinical
              vault.
            </p>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button
              variant="outline"
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteTargetId(null)}
              className="text-xs font-semibold h-9 border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 bg-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={isDeleting}
              onClick={() =>
                deleteTargetId && handleDeleteEntry(deleteTargetId)
              }
              className="text-xs font-semibold h-9 px-4 shadow-md bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Yes, Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { apiFetch } from "@/lib/api";
import { getLocalDateString } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  type DiagnosticRecord,
  type Patient,
  useLabTechnicianStore,
} from "@/store/lab-technician-store";
import {
  Activity,
  Barcode,
  CheckSquare,
  ChevronDown,
  CreditCard,
  Edit,
  FileText,
  MessageCircle,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Stethoscope,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface DiagnosticWorkspaceProps {
  module: string;
}

export function DiagnosticWorkspace({ module }: DiagnosticWorkspaceProps) {
  // Retrieve global shared state from our store
  const {
    patients,
    doctors,
    records,
    servicePatients,
    selectedRecordId,
    globalDate,
    defaultReportingDr,
    setSelectedRecordId,
    setGlobalDate,
    setDefaultReportingDr,
    addPatient,
    addDoctor,
    addRecord,
    updateRecord,
    deleteRecord,
    addProcedureItem,
    addPayment,
    fetchDoctors,
    fetchServicePatients,
    fetchRecords,
    fetchPatients,
    opdRxList,
    fetchOpdRxList,
    fetchProcedureCatalog,
  } = useLabTechnicianStore();

  const { user } = useAuthStore();

  // New Workflow States
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "records" | "queue" | "doctor-requests"
  >("records");
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [selectedQueuePatient, setSelectedQueuePatient] = useState<any>(null);
  const [checklistStates, setChecklistStates] = useState<
    Record<string, boolean>
  >({});

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportRecord, setReportRecord] = useState<DiagnosticRecord | null>(
    null,
  );
  const [reportAnalyte, setReportAnalyte] = useState("Haemoglobin");
  const [reportResult, setReportResult] = useState("");
  const [reportTechName, setReportTechName] = useState("");
  const [reportTechId, setReportTechId] = useState("");
  const [reportTimestamp, setReportTimestamp] = useState("");
  const [reportDrAcknowledgement, setReportDrAcknowledgement] = useState(false);
  const [reportChecklists, setReportChecklists] = useState<
    Record<string, boolean>
  >({
    patientIdMatch: false,
    modalityMatch: false,
    resultsFilled: false,
    criticalFlagged: false,
    techSignoff: false,
    timestampLogged: false,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Doctor requests state
  const [doctorRequests, setDoctorRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedDoctorRequest, setSelectedDoctorRequest] = useState<any>(null);

  // Advanced structured report drafting state
  const [reportFindings, setReportFindings] = useState("");
  const [reportImpression, setReportImpression] = useState("");
  const [reportConclusion, setReportConclusion] = useState("");
  const [reportTechNotes, setReportTechNotes] = useState("");
  const [reportFileUrl, setReportFileUrl] = useState("");
  const [reportSelectedFile, setReportSelectedFile] = useState<File | null>(
    null,
  );
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const MODALITY_CHECKLISTS: Record<string, string[]> = {
    lab: [
      "Sample type matches order",
      "Fasting status confirmed if glucose / lipid panel",
      "Correct tube colour / collection protocol",
      "Note haemolysis or insufficient sample volume",
    ],
    xray: [
      "Metallic objects removed",
      "Pregnancy status checked (females aged 12–55)",
      "Positioning confirmed per order (PA / AP / lateral)",
      "Radiation dose logged",
    ],
    "ct-scan": [
      "Fasting 4h+ if contrast ordered",
      "Creatinine / eGFR checked if contrast",
      "Iodine / contrast allergy confirmed",
      "IV access established if contrast",
      "Patient consent signed",
    ],
    "udr-mri": [
      "Metal implant / pacemaker screening done",
      "Claustrophobia assessed",
      "Gadolinium allergy checked if contrast",
      "Jewellery / hearing aids removed",
    ],
    usg: [
      "Bladder full or empty per scan type",
      "Correct probe selected (linear / convex / phased array)",
      "Gel and patient positioning confirmed",
    ],
    "udr-echo": [
      "Lead placement verified (ECG: 10 electrodes)",
      "Artefact check before recording",
      "Patient at rest ≥5 min before ECG",
    ],
  };

  const getModalityChecklist = () => {
    if (module === "lab") return MODALITY_CHECKLISTS.lab;
    if (module === "xray") return MODALITY_CHECKLISTS.xray;
    if (module === "ct-scan" || module === "udr-ct")
      return MODALITY_CHECKLISTS["ct-scan"];
    if (module === "udr-mri") return MODALITY_CHECKLISTS["udr-mri"];
    if (module === "usg") return MODALITY_CHECKLISTS.usg;
    if (
      module === "udr-echo" ||
      module.toLowerCase().includes("echo") ||
      module.toLowerCase().includes("ecg")
    ) {
      return MODALITY_CHECKLISTS["udr-echo"];
    }
    return [
      "Verify patient identity matches order",
      "Confirm procedure and site positioning",
      "Confirm patient consent obtained",
      "Verify equipment parameters checked",
    ];
  };

  const filteredQueue = servicePatients.filter((sp) => {
    const appForLower = (sp.appFor || "").toLowerCase();
    if (module === "xray")
      return appForLower.includes("x-ray") || appForLower.includes("xray");
    if (module === "ct-scan" || module === "udr-ct")
      return appForLower.includes("ct");
    if (module === "usg")
      return appForLower.includes("usg") || appForLower.includes("ultrasound");
    if (module === "udr-mri") return appForLower.includes("mri");
    if (
      module === "udr-echo" ||
      appForLower.includes("echo") ||
      appForLower.includes("ecg")
    )
      return appForLower.includes("echo") || appForLower.includes("ecg");
    if (module === "udr-daycare")
      return (
        appForLower.includes("day care") || appForLower.includes("daycare")
      );
    if (module === "udr-ot") return appForLower.includes("ot");
    if (module === "udr-physio")
      return (
        appForLower.includes("physiotherapy") || appForLower.includes("physio")
      );
    if (module === "other-services") return appForLower.includes("other");
    if (module === "lab")
      return (
        appForLower.includes("lab") ||
        appForLower.includes("blood") ||
        appForLower.includes("urine") ||
        appForLower.includes("cbc") ||
        appForLower.includes("lipid") ||
        appForLower.includes("glucose")
      );
    return true;
  });

  const isServiceMatchingModule = (
    serviceType: string,
    workspaceModule: string,
  ) => {
    if (!serviceType) return false;
    const sType = serviceType.toLowerCase();
    const wMod = workspaceModule.toLowerCase();

    if (wMod === "xray") {
      return sType.includes("x-ray") || sType.includes("xray");
    }
    if (wMod === "ct-scan" || wMod === "udr-ct") {
      return sType.includes("ct");
    }
    if (wMod === "usg") {
      return sType.includes("usg") || sType.includes("ultrasound");
    }
    if (wMod === "udr-mri") {
      return sType.includes("mri");
    }
    if (wMod === "udr-echo" || wMod.includes("echo") || wMod.includes("ecg")) {
      return sType.includes("echo") || sType.includes("ecg");
    }
    if (wMod === "udr-daycare") {
      return sType.includes("day care") || sType.includes("daycare");
    }
    if (wMod === "udr-ot") {
      return sType.includes("ot");
    }
    if (wMod === "udr-physio") {
      return sType.includes("physio") || sType.includes("physiotherapy");
    }
    if (wMod === "lab") {
      return (
        sType.includes("lab") ||
        sType.includes("blood") ||
        sType.includes("urine") ||
        sType.includes("cbc") ||
        sType.includes("lipid") ||
        sType.includes("glucose")
      );
    }
    if (wMod === "other-services") {
      return sType.includes("other") || sType.includes("diagnostic");
    }
    return false;
  };

  const fetchDoctorRequests = async () => {
    setLoadingRequests(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      const data = await apiFetch<any[]>("/lab/diagnostic-requests", {
        headers: { "X-Hospital-Code": code },
      });
      const sorted = (data || []).sort((a, b) => b.id - a.id);
      setDoctorRequests(sorted);
    } catch (error) {
      console.error("Failed to fetch diagnostic requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const filteredDoctorRequests = React.useMemo(() => {
    return doctorRequests.filter((req) =>
      isServiceMatchingModule(req.serviceType, module),
    );
  }, [doctorRequests, module]);

  const handleStartQueueTest = (pat: any) => {
    setSelectedQueuePatient(pat);
    setSelectedDoctorRequest(null);
    const checklist = getModalityChecklist();
    const initialStates: Record<string, boolean> = {};
    checklist.forEach((item) => {
      initialStates[item] = false;
    });
    setChecklistStates(initialStates);
    setIsChecklistOpen(true);
  };

  const handleStartDoctorRequest = async (req: any) => {
    setSelectedDoctorRequest(req);
    setSelectedQueuePatient(null);

    try {
      const code = user?.hospitalCode || "HSP001";
      await apiFetch<any>(
        `/lab/diagnostic-requests/${req.id}/status?status=IN_PROGRESS`,
        {
          method: "PUT",
          headers: { "X-Hospital-Code": code },
        },
      );
      await fetchDoctorRequests();
      toast.success("Request status marked as In Progress.");
    } catch (err) {
      console.error("Failed to transition doctor request status:", err);
    }

    const checklist = getModalityChecklist();
    const initialStates: Record<string, boolean> = {};
    checklist.forEach((item) => {
      initialStates[item] = false;
    });
    setChecklistStates(initialStates);
    setIsChecklistOpen(true);
  };

  const handleConfirmChecklist = () => {
    const checklist = getModalityChecklist();
    const allChecked = checklist.every((item) => checklistStates[item]);
    if (!allChecked) {
      toast.error(
        "Please complete all checklist items before starting the test.",
      );
      return;
    }
    setIsChecklistOpen(false);

    if (selectedDoctorRequest) {
      openAddRecordWithDoctorRequest(selectedDoctorRequest);
    } else if (selectedQueuePatient) {
      openAddRecordWithPatient(selectedQueuePatient);
    }
  };

  const openAddRecordWithPatient = (pat: any) => {
    setFormMode("add");
    setFormDate(getLocalDateString());
    setFormRecordNo("Next");
    setFormReportingDr(defaultReportingDr || "Dr. Self");
    setFormPatientNo(pat.patientNo || String(pat.id || ""));
    setFormPatientName(pat.name);

    const fullPat = patients.find(
      (p) => p.patientNo === pat.patientNo || p.name === pat.name,
    );
    setFormAge(fullPat?.age || "30");
    setFormSeg(fullPat?.gender || "Male");
    setFormAddress(fullPat?.address || "");
    setFormPlace(fullPat?.place || "");
    setFormPhone(fullPat?.phone || "");
    setFormMobileSMS(fullPat?.phone || "");
    setFormIndication(pat.appFor || "Routine Modality Scan");
    setFormHistory("None");
    setFormTreatment("None");
    setFormAdvice("None");
    setFormLmpDate("");
    setFormWeeks("");
    setFormReferredBy("REC");
    setFormRefId("");
    setFormEmail("");
    setFormNotes(
      `Pre-test checklist completed for ${module.toUpperCase()}. Queue ID: ${pat.id}`,
    );
    setFormFreeOfCost(false);
    setFormAdmitted(false);
    setFormInchargeDr("");
    setFormWardBed("");
    setIsAddRecordOpen(true);
  };

  const openAddRecordWithDoctorRequest = (req: any) => {
    setFormMode("add");
    setFormDate(getLocalDateString());
    setFormRecordNo("Next");
    const docName = req.reportingDoctorId
      ? `Dr. ${req.reportingDoctorId}`
      : "Dr. Self";
    setFormReportingDr(docName);
    setFormReferredBy(req.doctorId || req.reportingDoctorId || "REC");

    setFormPatientNo(req.patientNo);
    setFormPatientName(req.patientName);

    const fullPat = patients.find(
      (p) => p.patientNo === req.patientNo || p.name === req.patientName,
    );
    setFormAge(req.age || fullPat?.age || "30");
    setFormSeg(req.gender || fullPat?.gender || "Male");
    setFormAddress(req.address || fullPat?.address || "");
    setFormPlace(req.place || fullPat?.place || "");
    setFormPhone(req.phone || fullPat?.phone || "");
    setFormMobileSMS(req.phone || fullPat?.phone || "");
    setFormIndication(req.serviceType || "Routine Modality Scan");
    setFormHistory(req.clinicianNotes || "None");
    setFormTreatment("None");
    setFormAdvice("None");
    setFormLmpDate("");
    setFormWeeks("");
    setFormRefId(String(req.id));
    setFormEmail(req.email || "");
    setFormNotes(
      `Pre-test checklist completed for ${module.toUpperCase()}. Doctor Request ID: ${req.id}. Clinician Notes: ${req.clinicianNotes || "None"}`,
    );
    setFormFreeOfCost(false);
    setFormAdmitted(false);
    setFormInchargeDr("");
    setFormWardBed("");
    setIsAddRecordOpen(true);
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setReportSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setReportFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openReportModal = async (rec: DiagnosticRecord) => {
    setReportRecord(rec);

    setReportFindings("");
    setReportImpression("");
    setReportConclusion("");
    setReportTechNotes("");
    setReportFileUrl("");
    setReportSelectedFile(null);
    setReportDrAcknowledgement(false);
    setValidationErrors([]);

    setReportTechName(user?.name || "");
    setReportTechId(user?.id || user?.name || "");
    setReportTimestamp(new Date().toISOString().slice(0, 16));
    setReportChecklists({
      patientIdMatch: false,
      modalityMatch: false,
      resultsFilled: false,
      criticalFlagged: false,
      techSignoff: false,
      timestampLogged: false,
    });

    let existingResult = "";
    let existingAnalyte = module === "lab" ? "Haemoglobin" : "SpO2";

    if (rec.notes && rec.notes.includes("[Report: Examined]")) {
      const matchRes = rec.notes.match(/Result:\s*([^,]+)/);
      if (matchRes) existingResult = matchRes[1].trim();
      const matchAna = rec.notes.match(/Analyte:\s*([^,]+)/);
      if (matchAna) existingAnalyte = matchAna[1].trim();
    }

    setReportAnalyte(existingAnalyte);
    setReportResult(existingResult);

    if (rec.refId && !isNaN(Number(rec.refId))) {
      try {
        const code = user?.hospitalCode || "HSP001";
        const report = await apiFetch<any>(
          `/lab/diagnostic-reports/request/${rec.refId}`,
          {
            headers: { "X-Hospital-Code": code },
          },
        );
        if (report) {
          setReportFindings(report.findings || "");
          setReportImpression(report.impression || "");
          setReportConclusion(report.conclusion || "");
          setReportTechNotes(report.technicianNotes || "");
          setReportFileUrl(report.reportFile || "");
        }
      } catch (err) {
        console.warn("No existing report found for request ID:", rec.refId);
      }
    }

    setIsReportModalOpen(true);
  };

  const analyteRanges: Record<string, string> = {
    Haemoglobin: "12 - 16 g/dL",
    Potassium: "3.5 - 5.0 mEq/L",
    Sodium: "135 - 145 mEq/L",
    "Blood glucose": "70 - 100 mg/dL",
    "Platelet count": "150,000 - 450,000 /µL",
    INR: "0.8 - 1.2",
    Creatinine: "0.6 - 1.2 mg/dL",
    SpO2: "95% - 100%",
  };

  const getReportCriticalStatus = () => {
    const val = Number.parseFloat(reportResult);
    if (isNaN(val)) return false;

    if (reportAnalyte === "Haemoglobin") return val < 7 || val > 20;
    if (reportAnalyte === "Potassium") return val < 2.5 || val > 6.5;
    if (reportAnalyte === "Sodium") return val < 120 || val > 160;
    if (reportAnalyte === "Blood glucose") return val < 50 || val > 500;
    if (reportAnalyte === "Platelet count") return val < 20000;
    if (reportAnalyte === "INR") return val > 5;
    if (reportAnalyte === "Creatinine") return val > 10;
    if (reportAnalyte === "SpO2") return val < 85;

    return false;
  };

  const handleVerifyAndReleaseReport = async () => {
    if (!reportRecord) return;

    const errors: string[] = [];
    if (!reportResult.trim()) {
      errors.push("Result value must be filled out.");
    }
    if (!reportTechName.trim() || !reportTechId.trim()) {
      errors.push("Technician sign-off (Name & ID) is required.");
    }
    if (!reportTimestamp) {
      errors.push("Report timestamp must be recorded.");
    }

    if (!reportChecklists.patientIdMatch)
      errors.push("Verification: Patient ID must match the original order.");
    if (!reportChecklists.modalityMatch)
      errors.push("Verification: Test name and modality match.");
    if (!reportChecklists.resultsFilled)
      errors.push(
        "Verification: Result values must be filled with reference ranges.",
      );
    if (!reportChecklists.criticalFlagged)
      errors.push(
        "Verification: Critical values must be flagged if applicable.",
      );
    if (!reportChecklists.techSignoff)
      errors.push("Verification: Technician sign-off must be present.");
    if (!reportChecklists.timestampLogged)
      errors.push("Verification: Report timestamp must be recorded.");

    const critical = getReportCriticalStatus();
    if (critical && !reportDrAcknowledgement) {
      errors.push(
        "Critical value escalation warning: Doctor acknowledgement must be confirmed and checked before report release.",
      );
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(
        "Cannot release report. Complete all checklists and validations.",
      );
      return;
    }

    if (reportRecord.refId && !isNaN(Number(reportRecord.refId))) {
      setIsSubmittingReport(true);
      try {
        const payload = {
          requestId: Number(reportRecord.refId),
          technicianId: reportTechName || user?.name || "Lab Technician",
          reportFile: reportFileUrl,
          findings: reportFindings,
          impression: reportImpression,
          conclusion: reportConclusion,
          technicianNotes: reportTechNotes,
          status: "SENT_TO_DOCTOR",
        };

        const code = user?.hospitalCode || "HSP001";
        await apiFetch<any>("/lab/diagnostic-reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Hospital-Code": code,
          },
          body: JSON.stringify(payload),
        });
        toast.success(
          "Diagnostic report successfully saved and sent to doctor.",
        );
      } catch (err) {
        console.error("Failed to post diagnostic report to microservice:", err);
        toast.error("Failed to post report to backend microservice.");
      } finally {
        setIsSubmittingReport(false);
      }
    }

    const range = analyteRanges[reportAnalyte] || "N/A";
    const criticalText = critical ? " [CRITICAL ALERT ESCALATED]" : "";
    let reportNotes = `[Report: Examined] Analyte: ${reportAnalyte}, Result: ${reportResult}, Range: ${range}, Verified By: ${reportTechName} (${reportTechId}) at ${reportTimestamp}.${criticalText}`;

    if (reportFindings) reportNotes += `\nFindings: ${reportFindings}`;
    if (reportImpression) reportNotes += `\nImpression: ${reportImpression}`;
    if (reportConclusion) reportNotes += `\nConclusion: ${reportConclusion}`;

    await updateRecord(reportRecord.id, {
      notes: reportNotes,
      billPrint: "Yes",
    });

    await fetchDoctorRequests();

    setIsReportModalOpen(false);
    toast.success(`Report released successfully and marked as Examined.`);
  };

  // Synthesized/virtual records from completed/reviewed doctor requests
  const allRecords = React.useMemo(() => {
    // Start with all real records from store
    const storeRecs = [...records];
    
    // Create synthesized records from completed doctor requests
    const synthesized: DiagnosticRecord[] = [];
    const processedRequests = doctorRequests.filter((req) => {
      // Must match service type for the current module
      const isMatch = isServiceMatchingModule(req.serviceType, module);
      const isProcessed = ["SENT_TO_DOCTOR", "REVIEWED", "COMPLETED"].includes(req.status);
      return isMatch && isProcessed;
    });

    for (const req of processedRequests) {
      // Check if we already have a real record with this refId in store
      const hasReal = storeRecs.some((r) => r.refId === String(req.id) && r.module === module);
      if (!hasReal) {
        let prefix = "VR-REC";
        if (module === "xray") prefix = "VR-XR";
        else if (module === "ct-scan") prefix = "VR-CT";
        else if (module === "usg") prefix = "VR-USG";
        else if (module === "other-services") prefix = "VR-OTH";
        else if (module === "lab") prefix = "VR-LAB";
        else if (module.startsWith("udr-")) prefix = "VR-UDR";

        const docName = req.reportingDoctorId
          ? `Dr. ${req.reportingDoctorId}`
          : "Dr. Self";

        synthesized.push({
          id: `${prefix}-${req.id}`,
          module: module,
          patientNo: req.patientNo,
          patientName: req.patientName,
          date: getLocalDateString(), // default to current date
          total: 0,
          discount: 0,
          net: 0,
          paid: 0,
          due: 0,
          wardBed: "OPD",
          billPrint: "Yes",
          ref: req.doctorId || "REC",
          reportingDoctor: docName,
          age: req.age || "30",
          gender: req.gender || "Male",
          address: req.address || "",
          place: req.place || "",
          phone: req.phone || "",
          indication: req.serviceType || "Routine Modality Scan",
          history: req.clinicianNotes || "None",
          treatment: "None",
          advice: "None",
          admitted: false,
          inchargeDr: "",
          items: [],
          payments: [],
          refId: String(req.id),
          email: req.email || "",
          notes: `[Report: Examined] Synthesized from Doctor Request #${req.id} (Status: ${req.status})`,
        });
      }
    }

    return [...storeRecs, ...synthesized];
  }, [records, doctorRequests, module]);

  // Selected diagnostics record details helper
  const selectedRecord = allRecords.find((r) => r.id === selectedRecordId);

  // Filters and UI states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filterType, setFilterType] = useState<"ALL" | "TODAY">("ALL");

  useEffect(() => {
    setPage(0);
  }, [globalDate, allRecords.length, filterType]);

  // Mount-time data fetch
  useEffect(() => {
    fetchDoctors();
    fetchServicePatients();
    fetchRecords(module);
    fetchPatients();
    fetchOpdRxList();
    fetchProcedureCatalog();
    fetchDoctorRequests();
    setPage(0);
  }, [module]);

  const [isPatientSearchOpen, setIsPatientSearchOpen] =
    useState<boolean>(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>("");
  const [newDocCode, setNewDocCode] = useState<string>("");

  const [isDrDropdownOpen, setIsDrDropdownOpen] = useState<boolean>(false);
  const [isPatientNoDropdownOpen, setIsPatientNoDropdownOpen] =
    useState<boolean>(false);
  const [isPatientNameDropdownOpen, setIsPatientNameDropdownOpen] =
    useState<boolean>(false);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = document.getElementById(
        "reporting-dr-select-container",
      );
      if (container && !container.contains(e.target as Node)) {
        setIsDrDropdownOpen(false);
      }

      const patNoContainer = document.getElementById(
        "patient-no-select-container",
      );
      if (patNoContainer && !patNoContainer.contains(e.target as Node)) {
        setIsPatientNoDropdownOpen(false);
      }

      const patNameContainer = document.getElementById(
        "patient-name-select-container",
      );
      if (patNameContainer && !patNameContainer.contains(e.target as Node)) {
        setIsPatientNameDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Record ADD/EDIT Modal Form State
  const [isAddRecordOpen, setIsAddRecordOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // Form Fields
  const [formDate, setFormDate] = useState<string>(getLocalDateString());
  const [formRecordNo, setFormRecordNo] = useState<string>("Next");
  const [formReportingDr, setFormReportingDr] = useState<string>("");
  const [formSaveDrDefault, setFormSaveDrDefault] = useState<boolean>(true);
  const [formPatientNo, setFormPatientNo] = useState<string>("");
  const [formPatientName, setFormPatientName] = useState<string>("");
  const [formPriceList, setFormPriceList] = useState<string>("");
  const [formAge, setFormAge] = useState<string>("");
  const [formSeg, setFormSeg] = useState<string>("Male");
  const [formAddress, setFormAddress] = useState<string>("");
  const [formPlace, setFormPlace] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formMobileSMS, setFormMobileSMS] = useState<string>("");
  const [formIndication, setFormIndication] = useState<string>("");
  const [formHistory, setFormHistory] = useState<string>("");
  const [formTreatment, setFormTreatment] = useState<string>("");
  const [formAdvice, setFormAdvice] = useState<string>("");

  // LMP Fields (USG specific)
  const [formLmpDate, setFormLmpDate] = useState<string>("");
  const [formWeeks, setFormWeeks] = useState<string>("");

  // Form Right Panel (Referred By)
  const [formReferredBy, setFormReferredBy] = useState<string>("");
  const [formRefId, setFormRefId] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formFreeOfCost, setFormFreeOfCost] = useState<boolean>(false);
  const [formAdmitted, setFormAdmitted] = useState<boolean>(false);
  const [formInchargeDr, setFormInchargeDr] = useState<string>("");
  const [formWardBed, setFormWardBed] = useState<string>("");



  // Left Section Item entry panels
  const [entryItemName, setEntryItemName] = useState<string>("");
  const [entryItemRate, setEntryItemRate] = useState<number>(0);
  // Payment Section
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payReceiptType, setPayReceiptType] = useState<string>("Cash");
  const [payCheque, setPayCheque] = useState<string>("N/A");



  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(formReportingDr.toLowerCase()),
  );

  const filteredPatientsByNo = patients.filter((pat) =>
    pat.patientNo.toLowerCase().includes(formPatientNo.toLowerCase()),
  );

  const filteredPatientsByName = patients.filter((pat) =>
    pat.name.toLowerCase().includes(formPatientName.toLowerCase()),
  );

  const handleSendReport = async () => {
    if (!selectedRecord) {
      toast.error("Please select a record from the table first.");
      return;
    }
    try {
      await useLabTechnicianStore.getState().sendReportToDoctor(selectedRecord);
      toast.success(
        `Successfully sent report to Dr. ${selectedRecord.reportingDoctor}`,
      );
    } catch (e) {
      toast.error("Failed to send report to doctor.");
    }
  };

  // Set Default Price List on module change
  useEffect(() => {
    let pList = "X-RAY PRICE LIST";
    if (module === "ct-scan" || module === "udr-ct") pList = "CTG/USG";
    else if (module === "usg") pList = "USG PRICE LIST";
    else if (module === "udr-daycare") pList = "DAY CARE";
    else if (module === "udr-mri") pList = "MRI PRICE LIST";
    else if (module === "udr-ot") pList = "OT PRICE LIST";
    else if (module === "other-services") pList = "OTHER PRICE LIST";
    else if (module === "lab") pList = "LAB PRICE LIST";
    setFormPriceList(pList);
  }, [module]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.getAttribute("contenteditable") === "true");

      // ESC should always close modals if typing or not
      if (e.key === "Escape") {
        if (isPatientSearchOpen) {
          e.preventDefault();
          setIsPatientSearchOpen(false);
        } else if (isAddDoctorOpen) {
          e.preventDefault();
          setIsAddDoctorOpen(false);
        } else if (isAddRecordOpen) {
          e.preventDefault();
          setIsAddRecordOpen(false);
        }
        return;
      }

      // Other shortcuts only if not typing
      if (isTyping) return;

      // F3 or D - Patient Find
      if (e.key === "F3" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        setIsPatientSearchOpen(true);
      }
      // F5 - Refresh
      if (e.key === "F5") {
        e.preventDefault();
        toast.success("Data reloaded successfully");
      }
      // F10 - Save Form
      if (e.key === "F10" && isAddRecordOpen) {
        e.preventDefault();
        handleSaveRecord();
      }
      // F2 - Add New Doctor
      if (e.key === "F2") {
        e.preventDefault();
        setIsAddDoctorOpen(true);
      }
      // A - Add Record
      if (e.key === "a" || e.key === "A") {
        if (!isAddRecordOpen) {
          e.preventDefault();
          openAddRecord();
        }
      }
      // S - Edit Record
      if (e.key === "s" || e.key === "S") {
        if (!isAddRecordOpen) {
          e.preventDefault();
          openEditRecord();
        }
      }
      // C - Delete Record
      if (e.key === "c" || e.key === "C") {
        if (!isAddRecordOpen) {
          e.preventDefault();
          handleDeleteRecord();
        }
      }
      // Q - Consent Print
      if (e.key === "q" || e.key === "Q") {
        if (!isAddRecordOpen) {
          e.preventDefault();
          toast.success("Consent Form printed.");
        }
      }
      // R - Label Print
      if (e.key === "r" || e.key === "R") {
        if (!isAddRecordOpen) {
          e.preventDefault();
          toast.success("Diagnostics label generated.");
        }
      }
      // X - WhatsApp Dispatch
      if (e.key === "x" || e.key === "X") {
        if (!isAddRecordOpen) {
          e.preventDefault();
          toast.success("WhatsApp receipt dispatch queue.");
        }
      }
      // F9 - BarCode
      if (e.key === "F9") {
        e.preventDefault();
        toast.success("Printed test barcode stickers.");
      }
      // F4 - Print UDR
      if (e.key === "F4") {
        e.preventDefault();
        toast.success("Generating Custom report templates.");
      }
      // F7 - Send to Doctor
      if (e.key === "F7") {
        e.preventDefault();
        handleSendReport();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAddRecordOpen,
    isPatientSearchOpen,
    isAddDoctorOpen,
    formPatientNo,
    formPatientName,
    formAge,
    formReferredBy,
    formReportingDr,
    selectedRecordId,
  ]);

  // Patient Autocomplete Search Trigger
  const handleSelectPatient = (pat: Patient) => {
    setFormPatientNo(pat.patientNo);
    setFormPatientName(pat.name);
    setFormAge(pat.age);
    setFormSeg(pat.gender);
    setFormAddress(pat.address || "");
    setFormPlace(pat.place || "");
    setFormPhone(pat.phone || "");
    setFormMobileSMS(pat.phone || "");
    setIsPatientSearchOpen(false);
    toast.success(`Loaded patient: ${pat.name}`);
  };

  // Add new doctor
  const handleAddNewDoctor = () => {
    if (!newDocName.trim() || !newDocCode.trim()) {
      toast.error("Doctor name and code are mandatory!");
      return;
    }
    const newDoc = {
      name: newDocName.trim(),
      code: newDocCode.trim().toUpperCase(),
    };
    addDoctor(newDoc);
    setFormReferredBy(newDoc.code);
    setIsAddDoctorOpen(false);
    setNewDocName("");
    setNewDocCode("");
    toast.success(`Successfully registered Dr. ${newDoc.name}`);
  };

  // Save Record Form
  const handleSaveRecord = async () => {
    if (!formPatientNo.trim() || !formPatientName.trim() || !formAge.trim()) {
      toast.error("Mandatory fields: Patient No, Patient Name, and Age!");
      return;
    }

    if (formSaveDrDefault) {
      setDefaultReportingDr(formReportingDr);
    }

    let prefix = "REC";
    if (module === "xray") prefix = "XR";
    else if (module === "ct-scan") prefix = "CT";
    else if (module === "usg") prefix = "USG";
    else if (module === "other-services") prefix = "OTH";
    else if (module === "lab") prefix = "LAB";
    else if (module.startsWith("udr-")) prefix = "UDR";

    if (formMode === "add") {
      const newId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newRecord: DiagnosticRecord = {
        id: newId,
        module: module,
        patientNo: formPatientNo,
        patientName: formPatientName,
        date: formDate,
        total: 0,
        discount: 0,
        net: 0,
        paid: 0,
        due: 0,
        wardBed: "OPD",
        billPrint: "No",
        ref: formReferredBy,
        reportingDoctor: formReportingDr,
        age: formAge,
        gender: formSeg,
        address: formAddress,
        place: formPlace,
        phone: formPhone,
        indication: formIndication,
        history: formHistory,
        treatment: formTreatment,
        advice: formAdvice,
        admitted: false,
        inchargeDr: "",
        items: [],
        payments: [],
        lmpDate: formLmpDate || undefined,
        weeks: formWeeks,
        refId: formRefId,
        email: formEmail,
        notes: formNotes,
      };

      await addRecord(newRecord);
      await fetchDoctorRequests();
      toast.success(`Successfully saved clinical record ${newId}`);
    } else {
      // Edit record
      if (!selectedRecordId) return;
      await updateRecord(selectedRecordId, {
        patientNo: formPatientNo,
        patientName: formPatientName,
        date: formDate,
        reportingDoctor: formReportingDr,
        age: formAge,
        gender: formSeg,
        address: formAddress,
        place: formPlace,
        phone: formPhone,
        indication: formIndication,
        history: formHistory,
        treatment: formTreatment,
        advice: formAdvice,
        admitted: false,
        inchargeDr: "",
        wardBed: "OPD",
        ref: formReferredBy,
        lmpDate: formLmpDate || undefined,
        weeks: formWeeks,
        refId: formRefId,
        email: formEmail,
        notes: formNotes,
      });
      await fetchDoctorRequests();
      toast.success(`Updated clinical record ${selectedRecordId}`);
    }

    setIsAddRecordOpen(false);
  };

  // Open add record modal
  const openAddRecord = () => {
    setFormMode("add");
    setFormDate(getLocalDateString());
    setFormRecordNo("Next");
    setFormReportingDr(defaultReportingDr);
    setFormPatientNo("");
    setFormPatientName("");
    setFormAge("");
    setFormSeg("Male");
    setFormAddress("");
    setFormPlace("");
    setFormPhone("");
    setFormMobileSMS("");
    setFormIndication("Routine");
    setFormHistory("None");
    setFormTreatment("None");
    setFormAdvice("None");
    setFormLmpDate("");
    setFormWeeks("");
    setFormReferredBy("");
    setFormRefId("");
    setFormEmail("");
    setFormNotes("");
    setFormFreeOfCost(false);
    setIsAddRecordOpen(true);
  };

  // Open edit record modal
  const openEditRecord = () => {
    if (!selectedRecord) {
      toast.error("Please select a record from the table first.");
      return;
    }
    setFormMode("edit");
    setFormDate(selectedRecord.date);
    setFormRecordNo(selectedRecord.id);
    setFormReportingDr(selectedRecord.reportingDoctor);
    setFormPatientNo(selectedRecord.patientNo);
    setFormPatientName(selectedRecord.patientName);
    setFormAge(selectedRecord.age);
    setFormSeg(selectedRecord.gender);
    setFormAddress(selectedRecord.address || "");
    setFormPlace(selectedRecord.place || "");
    setFormPhone(selectedRecord.phone || "");
    setFormMobileSMS(selectedRecord.phone || "");
    setFormIndication(selectedRecord.indication || "");
    setFormHistory(selectedRecord.history || "");
    setFormTreatment(selectedRecord.treatment || "");
    setFormAdvice(selectedRecord.advice || "");
    setFormLmpDate(selectedRecord.lmpDate || "");
    setFormWeeks(selectedRecord.weeks || "");
    setFormReferredBy(selectedRecord.ref || "");
    setFormRefId(selectedRecord.refId || "");
    setFormEmail(selectedRecord.email || "");
    setFormNotes(selectedRecord.notes || "");
    setFormFreeOfCost(selectedRecord.total === 0);
    setIsAddRecordOpen(true);
  };

  // Delete active clinical record
  const handleDeleteRecord = () => {
    if (!selectedRecordId) {
      toast.error("Please select a record first");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRecord = () => {
    setDeleteConfirmOpen(false);
    if (!selectedRecordId) return;
    deleteRecord(selectedRecordId);
    toast.success("Record deleted successfully from database.");
  };

  // Add Item to Right Panel entry table
  const handleAddItemEntry = () => {
    if (!entryItemName.trim() || entryItemRate <= 0) {
      toast.error("Enter a valid procedure item and rate.");
      return;
    }
    if (!selectedRecordId) {
      toast.error("Please select a record first");
      return;
    }
    addProcedureItem(selectedRecordId, entryItemName.trim(), entryItemRate);
    setEntryItemName("");
    setEntryItemRate(0);
    toast.success("Item added successfully.");
  };

  // Add Payment Section entry
  const handleAddPaymentEntry = () => {
    if (payAmount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }
    if (!selectedRecordId) {
      toast.error("Please select a record first");
      return;
    }
    addPayment(selectedRecordId, payAmount, payReceiptType, payCheque);
    setPayAmount(0);
    setPayCheque("N/A");
    toast.success("Payment recorded successfully.");
  };

  // Diagnostic records filter
  const filteredRecords = allRecords.filter((r) => {
    if (r.module !== module) return false;
    if (filterType === "TODAY") {
      return r.date === globalDate;
    }
    return true;
  });
  const paginatedRecords = filteredRecords.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  // Helper: get module label
  const moduleLabel =
    module === "xray"
      ? "X-Ray"
      : module === "ct-scan"
        ? "CT Scan"
        : module === "usg"
          ? "USG"
          : module === "lab"
            ? "Laboratory"
            : module === "other-services"
              ? "Other Services"
              : module.replace("udr-", "UDR ").replace("-", " ");

  return (
    <>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-display">
                {moduleLabel} Workspace
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Procedure entry, billing &amp; receipt management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-semibold border border-primary/20">
              {filteredRecords.length} Record
              {filteredRecords.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="glass-elevated p-2.5 rounded-xl flex flex-wrap gap-1.5 shadow-glass-sm border border-border items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              onClick={() => toast.success("Refreshed record catalog")}
              variant="outline"
              className="h-8 gap-1.5 text-xs border-border"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh <kbd className="text-[9px] opacity-60 font-mono">F5</kbd>
            </Button>
            <Button
              size="sm"
              onClick={openAddRecord}
              className="h-8 gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD{" "}
              <kbd className="text-[9px] opacity-70 font-mono bg-white/20 px-1 py-0.5 rounded">
                A
              </kbd>
            </Button>
            <Button
              size="sm"
              onClick={openEditRecord}
              variant="outline"
              className="h-8 gap-1.5 text-xs border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit <kbd className="text-[9px] opacity-60 font-mono">S</kbd>
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteRecord}
              variant="outline"
              className="h-8 gap-1.5 text-xs border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete <kbd className="text-[9px] opacity-60 font-mono">C</kbd>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPatientSearchOpen(true)}
              variant="outline"
              className="h-8 gap-1.5 text-xs border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
            >
              <Search className="w-3.5 h-3.5" />
              Find <kbd className="text-[9px] opacity-60 font-mono">D</kbd>
            </Button>
            <Button
              size="sm"
              onClick={handleSendReport}
              disabled={!selectedRecord}
              className="h-8 gap-1.5 text-xs bg-indigo-650 hover:bg-indigo-700 text-white border-0 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Send Report{" "}
              <kbd className="text-[9px] opacity-70 font-mono bg-white/20 px-1 py-0.5 rounded">
                F7
              </kbd>
            </Button>

            <div className="w-px h-6 bg-border self-center mx-0.5" />

            <Button
              size="sm"
              onClick={() => toast.success("Consent Form printed.")}
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Consent <kbd className="text-[9px] opacity-50 font-mono">Q</kbd>
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Diagnostics label generated.")}
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              <Tag className="w-3.5 h-3.5" />
              Label <kbd className="text-[9px] opacity-50 font-mono">R</kbd>
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Printed test barcode stickers.")}
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              <Barcode className="w-3.5 h-3.5" />
              BarCode <kbd className="text-[9px] opacity-50 font-mono">F9</kbd>
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.success("Generating Custom report templates.")
              }
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print UDR{" "}
              <kbd className="text-[9px] opacity-50 font-mono">F4</kbd>
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("WhatsApp receipt dispatch queue.")}
              variant="outline"
              className="h-8 gap-1.5 text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp <kbd className="text-[9px] opacity-50 font-mono">X</kbd>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-elevated rounded-xl p-3.5 shadow-glass-sm border border-border flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Filter Date:
            </span>
            <input
              type="date"
              value={globalDate}
              onChange={(e) => setGlobalDate(e.target.value)}
              className="h-8 px-3 border border-input rounded-lg text-xs font-semibold text-foreground bg-background outline-none focus:ring-1 focus:ring-ring focus:border-primary transition-smooth"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "ALL" | "TODAY")}
            className="h-8 px-3 border border-input rounded-lg text-xs font-semibold text-foreground outline-none bg-background focus:ring-1 focus:ring-ring focus:border-primary transition-smooth cursor-pointer"
          >
            <option value="ALL">[ALL MODALITY RECORDS]</option>
            <option value="TODAY">Today's Entries Only</option>
          </select>
          <div className="flex-1" />
          {selectedRecord && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Selected:{" "}
                <b className="text-foreground font-mono">{selectedRecord.id}</b>
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  selectedRecord.due > 0
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/25"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                }`}
              >
                {selectedRecord.due > 0
                  ? `Due ₹${selectedRecord.due.toLocaleString()}`
                  : "Fully Paid"}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Records Table */}
          <div
            className="lg:col-span-8 glass-elevated border border-border rounded-xl shadow-glass-sm overflow-hidden flex flex-col"
            style={{ height: 530 }}
          >
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={
                    activeWorkspaceTab === "records" ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => setActiveWorkspaceTab("records")}
                  className={`text-xs font-semibold h-7 rounded-md px-3 ${activeWorkspaceTab === "records" ? "bg-primary text-white" : ""}`}
                >
                  Recorded Procedures
                </Button>
                <Button
                  variant={activeWorkspaceTab === "queue" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveWorkspaceTab("queue")}
                  className={`text-xs font-semibold h-7 rounded-md px-3 ${activeWorkspaceTab === "queue" ? "bg-primary text-white" : ""}`}
                >
                  Active Waitlist (Queue)
                </Button>
                <Button
                  variant={
                    activeWorkspaceTab === "doctor-requests"
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() => setActiveWorkspaceTab("doctor-requests")}
                  className={`text-xs font-semibold h-7 rounded-md px-3 ${activeWorkspaceTab === "doctor-requests" ? "bg-primary text-white" : ""}`}
                >
                  Doctor Requests
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {activeWorkspaceTab === "records"
                  ? `${filteredRecords.length} records completed`
                  : activeWorkspaceTab === "doctor-requests"
                    ? `${filteredDoctorRequests.length} pending requests`
                    : `${filteredQueue.length} pending patients`}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 select-none">
                  {activeWorkspaceTab === "records" ? (
                    <tr>
                      <th className="px-4 py-3">No. ID</th>
                      <th className="px-4 py-3">Pat. No</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3 text-right">Total (₹)</th>
                      <th className="px-4 py-3 text-right">Net (₹)</th>
                      <th className="px-4 py-3 text-right">Status</th>
                      <th className="px-4 py-3 text-right">Due</th>
                      <th className="px-4 py-3">Ward/Bed</th>
                      <th className="px-4 py-3">Ref</th>
                    </tr>
                  ) : activeWorkspaceTab === "doctor-requests" ? (
                    <tr>
                      <th className="px-4 py-3">Request ID</th>
                      <th className="px-4 py-3">Pat. No</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3 text-right">Requested Test</th>
                      <th className="px-4 py-3 text-right">Clinician Notes</th>
                      <th className="px-4 py-3 text-right">Ordering Doctor</th>
                      <th className="px-4 py-3 text-right">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3">Pat. No</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3 text-right">Modality/Test</th>
                      <th className="px-4 py-3 text-right">Time</th>
                      <th className="px-4 py-3 text-right">Status</th>
                      <th className="px-4 py-3 text-right">Due (₹)</th>
                      <th className="px-4 py-3">Billing</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activeWorkspaceTab === "records" ? (
                    paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-10 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Activity className="w-8 h-8 opacity-30" />
                            <p className="text-sm font-semibold">
                              No diagnostic records yet
                            </p>
                            <p className="text-xs">
                              Press{" "}
                              <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">
                                A
                              </kbd>{" "}
                              or click <b>ADD</b> to create the first entry.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((row) => {
                        const recordStatus = row.notes?.includes(
                          "[Report: Examined]",
                        )
                          ? "Examined"
                          : "Active Queue";
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecordId(row.id)}
                            className={`cursor-pointer transition-all duration-150 ${
                              selectedRecordId === row.id
                                ? "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary font-medium"
                                : "hover:bg-muted/20 border-l-4 border-l-transparent"
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-primary">
                              {row.id}
                            </td>
                            <td className="px-4 py-3 font-medium text-muted-foreground">
                              {row.patientNo}
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {row.patientName}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              ₹{row.total.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                              ₹{row.net.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge
                                variant="outline"
                                className={
                                  recordStatus === "Examined"
                                    ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                                }
                              >
                                {recordStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {row.due > 0 ? (
                                <span className="font-mono font-bold text-rose-500">
                                  ₹{row.due.toLocaleString()}
                                </span>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/25 font-bold"
                                >
                                  Paid
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.wardBed}
                            </td>
                            <td className="px-4 py-3 font-bold text-muted-foreground">
                              {row.ref}
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : activeWorkspaceTab === "doctor-requests" ? (
                    loadingRequests ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-10 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                            <span>Syncing live diagnostic orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDoctorRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Activity className="w-8 h-8 opacity-30" />
                            <p className="text-sm font-semibold">
                              No diagnostic requests received from Doctors
                            </p>
                            <p className="text-xs">
                              Incoming doctor requested panels will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredDoctorRequests.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-muted/20 border-l-4 border-l-transparent transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-primary">
                            #{row.id}
                          </td>
                          <td className="px-4 py-3 font-medium text-muted-foreground">
                            {row.patientNo}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {row.patientName}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">
                            {row.serviceType}
                          </td>
                          <td
                            className="px-4 py-3 text-right max-w-[150px] truncate text-muted-foreground italic"
                            title={row.clinicianNotes}
                          >
                            {row.clinicianNotes || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            Dr.{" "}
                            {row.reportingDoctorId ||
                              row.doctorId ||
                              "Referred Doctor"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold ${
                                row.status === "REQUESTED"
                                  ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                                  : row.status === "IN_PROGRESS"
                                    ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                                    : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                              }`}
                            >
                              {row.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.status === "REQUESTED" ? (
                              <Button
                                size="sm"
                                onClick={() => handleStartDoctorRequest(row)}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-7 px-3 text-[10px]"
                              >
                                Process Request
                              </Button>
                            ) : row.status === "IN_PROGRESS" ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const matchingRec = allRecords.find(
                                    (r) => r.refId === String(row.id),
                                  );
                                  if (matchingRec) {
                                    openReportModal(matchingRec);
                                  } else {
                                    handleStartDoctorRequest(row);
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-7 px-3 text-[10px]"
                              >
                                Draft Report
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const matchingRec = allRecords.find(
                                    (r) => r.refId === String(row.id),
                                  );
                                  if (matchingRec) {
                                    openReportModal(matchingRec);
                                  } else {
                                    toast.error(
                                      "No clinical record found for this request.",
                                    );
                                  }
                                }}
                                className="h-7 px-3 text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 font-bold"
                              >
                                View Sent
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Activity className="w-8 h-8 opacity-30" />
                          <p className="text-sm font-semibold">
                            No patients in waitlist for this modality
                          </p>
                          <p className="text-xs">
                            Queue will appear once reception bookings are made.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-muted/20 border-l-4 border-l-transparent transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          Token #{row.token || row.srl}
                        </td>
                        <td className="px-4 py-3 font-medium text-muted-foreground">
                          {row.patientNo}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {row.appFor}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {row.time}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant="outline"
                            className="bg-amber-500/20 text-amber-500 border-amber-500/30"
                          >
                            Active Waitlist
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          ₹{row.due?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.billingType}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleStartQueueTest(row)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-7 px-3 text-[10px]"
                          >
                            Start Test
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControl
              currentPage={page}
              totalPages={
                activeWorkspaceTab === "records"
                  ? Math.ceil(filteredRecords.length / pageSize)
                  : activeWorkspaceTab === "doctor-requests"
                    ? Math.ceil(filteredDoctorRequests.length / pageSize)
                    : Math.ceil(filteredQueue.length / pageSize)
              }
              totalElements={
                activeWorkspaceTab === "records"
                  ? filteredRecords.length
                  : activeWorkspaceTab === "doctor-requests"
                    ? filteredDoctorRequests.length
                    : filteredQueue.length
              }
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              className="px-4 py-2 border-t border-border/40 bg-muted/5 mt-0"
            />
          </div>

          {/* Right Side Panels */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Procedure Items Panel */}
            <div className="glass-elevated border border-border rounded-xl shadow-glass-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">
                    Procedure &amp; Items
                  </h4>
                </div>
                {selectedRecordId && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedRecordId}
                  </Badge>
                )}
              </div>
              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Item Name..."
                    value={entryItemName}
                    onChange={(e) => setEntryItemName(e.target.value)}
                    className="h-8 px-2.5 border border-input bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-smooth"
                  />
                  <input
                    type="number"
                    placeholder="Rate (₹)"
                    value={entryItemRate || ""}
                    onChange={(e) => setEntryItemRate(Number(e.target.value))}
                    className="h-8 px-2.5 border border-input bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-ring font-mono font-bold transition-smooth"
                  />
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleAddItemEntry}
                    className="flex-1 h-7 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.warning("Editing procedure catalog")}
                    className="h-7 text-xs px-2"
                  >
                    Edit Catalog
                  </Button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden max-h-[130px] overflow-y-auto bg-background/50">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">
                          Item
                        </th>
                        <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-[10px]">
                          Rate (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedRecord?.items?.map((it, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium text-foreground">
                            {it.item}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                            ₹{it.rate.toLocaleString()}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td
                            colSpan={2}
                            className="p-4 text-center text-muted-foreground text-[11px]"
                          >
                            No items selected
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payment Panel */}
            <div className="glass-elevated border border-border rounded-xl shadow-glass-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <h4 className="text-xs font-semibold text-foreground">
                  Payment &amp; Receipts
                </h4>
              </div>
              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={payAmount || ""}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="h-8 w-full px-2.5 border border-input bg-background text-foreground rounded-lg text-xs outline-none focus:border-emerald-500 font-mono font-bold focus:ring-1 focus:ring-emerald-500 transition-smooth"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                      Mode
                    </label>
                    <select
                      value={payReceiptType}
                      onChange={(e) => setPayReceiptType(e.target.value)}
                      className="h-8 w-full px-1.5 border border-input bg-background text-foreground rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-smooth"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleAddPaymentEntry}
                    className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  >
                    Entry Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Receipt preview compiled.")}
                    className="h-7 text-xs px-2"
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Receipt printed.")}
                    className="h-7 text-xs px-2"
                  >
                    Print
                  </Button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden max-h-[130px] overflow-y-auto bg-background/50">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">
                          Time
                        </th>
                        <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">
                          Rc No
                        </th>
                        <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-[10px]">
                          Paid (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedRecord?.payments?.map((pm, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">
                            {pm.time}
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {pm.recpNo}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                            ₹{pm.amount.toLocaleString()}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-4 text-center text-muted-foreground text-[11px]"
                          >
                            No payment records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="glass-elevated border border-border rounded-xl p-3 shadow-glass-sm flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!selectedRecord) {
                  toast.error("Please select a diagnostic record first.");
                  return;
                }
                openReportModal(selectedRecord);
              }}
              disabled={!selectedRecord}
              className="h-8 gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              <FileText className="w-3.5 h-3.5" /> Draft Report
            </Button>
            <Button
              size="sm"
              onClick={handleSendReport}
              disabled={!selectedRecord}
              className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Send to Doctor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info(
                  `Status: ${selectedRecord && selectedRecord.due > 0 ? "Pending Balance" : "Completed"}`,
                )
              }
              className="h-8 text-xs"
            >
              Status
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("Report emailed successfully.")}
              className="h-8 text-xs"
            >
              Email
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Active Record:{" "}
            <span className="font-mono font-semibold text-foreground">
              {selectedRecord?.id || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          ADD/EDIT CLINICAL DIAGNOSTICS RECORD MODAL FORM
          ========================================== */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white text-slate-950 border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] transition-all animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="h-16 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white px-6 flex items-center justify-between select-none shadow-sm">
              <h3 className="font-bold flex items-center gap-2 font-display text-sm tracking-wide uppercase">
                <div className="p-1 bg-white/10 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span>
                  {formMode === "add" ? "Add New" : "Edit"} Diagnostic Service
                  Entry
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRecordOpen(false)}
                className="p-2 hover:bg-white/10 active:bg-white/20 rounded-xl text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin bg-slate-50/30">
              {/* Left Section — Patient Details (8 columns wide) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Section header */}
                <div className="flex items-center gap-2 select-none border-b border-slate-100 pb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-black">
                    1
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Patient Details & Admission Parameters
                  </h4>
                </div>

                {/* Details card wrapper */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    <div className="sm:col-span-4 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 font-medium text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Record No
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formRecordNo}
                        className="h-10 w-full px-3 border border-slate-200 bg-slate-100/70 text-slate-600 rounded-xl text-xs font-bold outline-none cursor-not-allowed"
                      />
                    </div>

                    <div
                      className="sm:col-span-5 space-y-1.5 relative"
                      id="reporting-dr-select-container"
                    >
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Reporting Dr{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="flex gap-2 items-center relative">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search or enter doctor..."
                            value={formReportingDr}
                            onFocus={() => setIsDrDropdownOpen(true)}
                            onChange={(e) => {
                              setFormReportingDr(e.target.value);
                              setIsDrDropdownOpen(true);
                            }}
                            className="h-10 w-full px-3 pr-8 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 font-semibold text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setIsDrDropdownOpen(!isDrDropdownOpen)
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none group shrink-0 py-1">
                          <input
                            type="checkbox"
                            id="saveDrCheck"
                            checked={formSaveDrDefault}
                            onChange={(e) =>
                              setFormSaveDrDefault(e.target.checked)
                            }
                            className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 transition-colors cursor-pointer"
                          />
                          <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-slate-650 transition-colors">
                            Save
                          </span>
                        </label>

                        {/* Floating Searchable Dropdown Overlay */}
                        {isDrDropdownOpen && (
                          <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                            {filteredDoctors.length > 0 ? (
                              filteredDoctors.map((doc) => (
                                <button
                                  key={doc.code}
                                  type="button"
                                  onClick={() => {
                                    setFormReportingDr(doc.name);
                                    setIsDrDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50/50 active:bg-teal-50 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors flex items-center justify-between cursor-pointer border-0 bg-transparent"
                                >
                                  <span>{doc.name}</span>
                                  <span className="text-[9px] font-bold font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                                    {doc.code}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-center text-xs text-slate-400 italic">
                                No matching doctors. Type to enter custom name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    <div
                      className="sm:col-span-5 space-y-1.5 relative"
                      id="patient-no-select-container"
                    >
                      <label className="text-[10px] font-bold text-slate-650 uppercase tracking-wider">
                        Patient No{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="flex gap-2 relative">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Pat. No..."
                            value={formPatientNo}
                            onFocus={() => setIsPatientNoDropdownOpen(true)}
                            onChange={(e) => {
                              setFormPatientNo(e.target.value);
                              setIsPatientNoDropdownOpen(true);
                            }}
                            className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 font-mono font-bold text-slate-800"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPatientSearchOpen(true)}
                          className="h-10 px-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-98 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer border-0 shrink-0"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Find</span>
                          <kbd className="px-1.5 py-0.5 bg-white/20 text-white rounded font-mono text-[9px] font-bold leading-none">
                            F3
                          </kbd>
                        </button>

                        {/* Patient No Dropdown Overlay */}
                        {isPatientNoDropdownOpen && (
                          <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                            {filteredPatientsByNo.length > 0 ? (
                              filteredPatientsByNo.map((pat) => (
                                <button
                                  key={pat.id}
                                  type="button"
                                  onClick={() => {
                                    handleSelectPatient(pat);
                                    setIsPatientNoDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50/50 active:bg-teal-50 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors flex items-center justify-between cursor-pointer border-0 bg-transparent"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">
                                      {pat.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      Age: {pat.age} · Sex: {pat.gender}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-bold font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                                    #{pat.patientNo}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-center text-xs text-slate-400 italic">
                                No matching patient numbers. Type to enter.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="sm:col-span-4 space-y-1.5 relative"
                      id="patient-name-select-container"
                    >
                      <label className="text-[10px] font-bold text-slate-650 uppercase tracking-wider">
                        Patient Name{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Full Name..."
                          value={formPatientName}
                          onFocus={() => setIsPatientNameDropdownOpen(true)}
                          onChange={(e) => {
                            setFormPatientName(e.target.value);
                            setIsPatientNameDropdownOpen(true);
                          }}
                          className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs font-semibold outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 text-slate-800 animate-none min-w-0"
                        />

                        {/* Patient Name Dropdown Overlay */}
                        {isPatientNameDropdownOpen && (
                          <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                            {filteredPatientsByName.length > 0 ? (
                              filteredPatientsByName.map((pat) => (
                                <button
                                  key={pat.id}
                                  type="button"
                                  onClick={() => {
                                    handleSelectPatient(pat);
                                    setIsPatientNameDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-teal-50/50 active:bg-teal-50 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors flex items-center justify-between cursor-pointer border-0 bg-transparent"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">
                                      {pat.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      Age: {pat.age} · Sex: {pat.gender}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-bold font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                                    #{pat.patientNo}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-center text-xs text-slate-400 italic">
                                No matching patient names. Type to enter.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Price List
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formPriceList}
                        className="h-10 w-full px-3 border border-slate-200 bg-slate-100/70 text-slate-600 rounded-xl text-xs font-semibold outline-none cursor-not-allowed min-w-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        Age <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Age..."
                        value={formAge}
                        onChange={(e) => setFormAge(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 text-slate-800 font-medium min-w-0"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Seg (Gender)
                      </label>
                      <select
                        value={formSeg}
                        onChange={(e) => setFormSeg(e.target.value)}
                        className="h-10 w-full px-2 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 font-semibold text-slate-800 cursor-pointer min-w-0"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Place
                      </label>
                      <input
                        type="text"
                        placeholder="City / Village..."
                        value={formPlace}
                        onChange={(e) => setFormPlace(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 font-semibold text-slate-800 cursor-pointer min-w-0"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Phone
                      </label>
                      <PhoneInput
                        value={formPhone}
                        onChange={setFormPhone}
                        className="h-10 text-xs bg-slate-50/20 border-slate-200"
                        placeholder="Contact No..."
                      />
                    </div>
                  </div>

                  {/* USG specific fields (LMP and Weeks) */}
                  {module === "usg" && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 bg-purple-50/30 p-4 rounded-2xl border border-purple-100/80 shadow-xs animate-in slide-in-from-top-1 duration-200">
                      <div className="sm:col-span-6 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-purple-750">
                          LMP Date
                        </label>
                        <input
                          type="date"
                          value={formLmpDate}
                          onChange={(e) => setFormLmpDate(e.target.value)}
                          className="h-10 w-full px-3 border border-purple-200 hover:border-purple-350 focus:border-purple-600 focus:ring-4 focus:ring-purple-550/10 rounded-xl text-xs outline-none bg-white transition-all font-medium text-purple-900 min-w-0"
                        />
                      </div>
                      <div className="sm:col-span-6 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-purple-750">
                          Gestation Weeks
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12 Weeks..."
                          value={formWeeks}
                          onChange={(e) => setFormWeeks(e.target.value)}
                          className="h-10 w-full px-3 border border-purple-200 hover:border-purple-350 focus:border-purple-600 focus:ring-4 focus:ring-purple-550/10 rounded-xl text-xs outline-none bg-white transition-all font-medium text-purple-900 min-w-0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    <div className="sm:col-span-7 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="Street/Avenue..."
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 text-slate-800 font-medium min-w-0"
                      />
                    </div>
                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Mobile For SMS
                      </label>
                      <PhoneInput
                        value={formMobileSMS}
                        onChange={setFormMobileSMS}
                        className="h-10 text-xs bg-slate-50/20 border-slate-200"
                        placeholder="SMS Dispatch No..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-5">
                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Indication
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Abdominal Pain..."
                        value={formIndication}
                        onChange={(e) => setFormIndication(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all font-semibold text-slate-800 min-w-0"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        History
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hypertension..."
                        value={formHistory}
                        onChange={(e) => setFormHistory(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all font-semibold text-slate-800 min-w-0"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Treatment
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Analgesics..."
                        value={formTreatment}
                        onChange={(e) => setFormTreatment(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all font-semibold text-slate-800 min-w-0"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Advice
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rest, Dietary restrictions..."
                        value={formAdvice}
                        onChange={(e) => setFormAdvice(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all font-semibold text-slate-800 min-w-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section — Referred By (4 columns wide) */}
              <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-slate-100 lg:pl-6">
                {/* Section header */}
                <div className="flex items-center select-none border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-black">
                      2
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Referred By
                    </h4>
                  </div>
                </div>

                {/* Referred by content card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-650 uppercase tracking-wider">
                      Referred Doctor{" "}
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter referred doctor name..."
                      value={formReferredBy}
                      onChange={(e) => setFormReferredBy(e.target.value)}
                      className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all duration-200 font-bold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Ref. ID
                      </label>
                      <input
                        type="text"
                        placeholder="Code/ID..."
                        value={formRefId}
                        onChange={(e) => setFormRefId(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all text-slate-800 font-medium min-w-0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Ref. Email
                      </label>
                      <input
                        type="email"
                        placeholder="Doctor email..."
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all text-slate-800 font-medium min-w-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Clinician Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Ref. comments..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="h-10 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl text-xs outline-none bg-slate-50/20 hover:bg-slate-50/50 focus:bg-white transition-all text-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50/80 transition-all cursor-pointer select-none group w-full">
                      <input
                        type="checkbox"
                        id="freeCostCheck"
                        checked={formFreeOfCost}
                        onChange={(e) => setFormFreeOfCost(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-650 group-hover:text-slate-800 transition-colors">
                        Free Of Cost (Disables amounts)
                      </span>
                    </label>
                  </div>
                </div>


              </div>

              {/* 12-Column Full Width OPD Prescription Details View Panel */}
              {formPatientNo &&
                (() => {
                  const patientPrescriptions = opdRxList.filter((rx) => {
                    return (
                      (rx.patientName &&
                        rx.patientName.toLowerCase() ===
                          formPatientName.toLowerCase()) ||
                      (rx.opdNo &&
                        rx.opdNo.toLowerCase() === formPatientNo.toLowerCase())
                    );
                  });

                  if (patientPrescriptions.length === 0) return null;

                  return (
                    <div className="lg:col-span-12 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-200/50 rounded-2xl p-5 shadow-xs mt-6 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 border-b border-teal-100 pb-3 mb-4 select-none">
                        <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center border border-teal-500/25">
                          <span className="text-xs">💊</span>
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-400 font-display">
                          Clinician OPD Prescription View (Read-Only)
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast.error(
                              "OPD Rx is read-only for your role. Contact the treating doctor via the HMS messaging system.",
                            );
                            alert(
                              "OPD Rx is read-only for your role. Contact the treating doctor via the HMS messaging system.",
                            );
                          }}
                          className="h-6 text-[10px] ml-4 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                          Modify Rx
                        </Button>
                        <span className="text-[10px] bg-teal-500/15 text-teal-700 px-2 py-0.5 rounded-full font-bold ml-auto font-mono">
                          {patientPrescriptions.length} Prescription(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {patientPrescriptions.map((rx, idx) => (
                          <div
                            key={rx.opdNo || idx}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between border-b border-slate-50 dark:border-slate-850 pb-2">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display">
                                    {rx.tradeName}
                                  </h5>
                                  <p className="text-[9px] text-slate-400 font-medium font-mono mt-0.5">
                                    Ref: {rx.opdNo} · Clinician: {rx.examBy}
                                  </p>
                                </div>
                                <span className="text-[10px] font-bold text-teal-650 bg-teal-500/10 px-2.5 py-0.5 rounded-lg font-mono">
                                  {rx.duration}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block">
                                    Dosage (AM-Noon-PM-HS)
                                  </span>
                                  <span className="font-bold text-slate-750 dark:text-slate-350">
                                    {rx.am}-{rx.noon}-{rx.pm}-{rx.hs}
                                  </span>
                                </div>
                                <div className="border-l border-slate-205 h-6"></div>
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block">
                                    Package Unit
                                  </span>
                                  <span className="font-bold text-slate-750 dark:text-slate-350">
                                    {rx.unit}
                                  </span>
                                </div>
                              </div>

                              {rx.instruction && (
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">
                                    Pharmacist & Lab Instructions:
                                  </span>
                                  <p className="text-[10px] text-slate-600 leading-relaxed italic bg-amber-500/5 border border-amber-500/15 p-2 rounded-lg font-semibold">
                                    "{rx.instruction}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* Modal Footer */}
            <div className="h-18 bg-white border-t border-slate-100 px-6 flex items-center justify-between select-none shadow-glass-sm z-10">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <span className="text-amber-500 text-sm">⚠️</span>
                <span>
                  <span className="font-bold text-slate-700 uppercase">
                    BOLD
                  </span>{" "}
                  labeled fields denote mandatory fields.
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRecordOpen(false)}
                  className="h-10 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-750 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <span>Cancel</span>
                  <kbd className="px-1.5 py-0.5 bg-white text-slate-400 border border-slate-200 rounded-md font-mono text-[9px] font-bold leading-none">
                    Esc
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecord}
                  className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-98 flex items-center gap-1.5 transition-all cursor-pointer border-0"
                >
                  <span>Save Record</span>
                  <kbd className="px-1.5 py-0.5 bg-white/20 text-white rounded-md font-mono text-[9px] font-bold leading-none">
                    F10
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 1 — PATIENT SEARCH POPUP (F3) */}
      {isPatientSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white text-slate-950 border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[70vh] transition-all animate-in zoom-in-95 duration-200">
            <div className="h-14 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white px-5 flex items-center justify-between select-none shadow-sm">
              <h4 className="font-bold text-xs uppercase flex items-center gap-1.5 tracking-wider font-display">
                <div className="p-1 bg-white/10 rounded-lg">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <span>Search Patient Register (F3)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsPatientSearchOpen(false)}
                className="p-1.5 hover:bg-white/10 active:bg-white/20 rounded-lg text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar-thin bg-slate-50/20">
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest select-none pb-1 border-b border-slate-100">
                Select Patient to Auto-fill
              </p>

              <div className="space-y-2">
                {patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="p-3.5 bg-white border border-slate-100 hover:border-teal-200/80 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-200 hover:shadow-xs active:scale-99 hover:bg-teal-50/5 group"
                  >
                    <div>
                      <h5 className="text-xs font-black text-slate-800 group-hover:text-teal-700 transition-colors">
                        {p.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Age: {p.age} · Sex: {p.gender} · Place: {p.place}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-black text-teal-650 bg-teal-500/10 px-2.5 py-1 rounded-lg shrink-0 transition-colors group-hover:bg-teal-500/20">
                      Pat. #{p.patientNo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-14 bg-white border-t border-slate-100 flex items-center justify-end px-5 shadow-glass-sm">
              <button
                type="button"
                onClick={() => setIsPatientSearchOpen(false)}
                className="h-9 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2 — REGISTER REFERRAL DOCTOR (F2) */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white text-slate-950 border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transition-all animate-in zoom-in-95 duration-200">
            <div className="h-14 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white px-5 flex items-center justify-between select-none shadow-sm">
              <h4 className="font-bold text-xs uppercase flex items-center gap-1.5 tracking-wider font-display">
                <div className="p-1 bg-white/10 rounded-lg">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <span>Register Referral Dr. (F2)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddDoctorOpen(false)}
                className="p-1.5 hover:bg-white/10 active:bg-white/20 rounded-lg text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-slate-50/20">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Doctor's Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma..."
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="h-9.5 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 rounded-lg text-xs outline-none bg-white transition-all duration-200 font-medium text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Unique Code (DR Initials)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MTR..."
                  value={newDocCode}
                  onChange={(e) => setNewDocCode(e.target.value)}
                  className="h-9.5 w-full px-3 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 rounded-lg text-xs font-bold outline-none bg-white transition-all duration-200 uppercase text-slate-800"
                />
              </div>
            </div>

            <div className="h-14 bg-white border-t border-slate-100 flex items-center justify-end px-5 gap-3 shadow-glass-sm">
              <button
                type="button"
                onClick={() => setIsAddDoctorOpen(false)}
                className="h-9.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewDoctor}
                className="h-9.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer border-0"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Clinical Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete clinical record "{selectedRecordId}
            "? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteRecord}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PRE-TEST CHECKLIST MODAL */}
      {isChecklistOpen && selectedQueuePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white text-slate-950 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-all duration-200">
            {/* Modal Header */}
            <div className="h-14 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 flex items-center justify-between shadow-sm">
              <h3 className="font-bold flex items-center gap-2 font-display text-sm tracking-wide uppercase">
                <span>Pre-Test Checklist: {module.toUpperCase()}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChecklistOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
                <p>
                  <strong>Patient ID:</strong> {selectedQueuePatient.patientNo}
                </p>
                <p>
                  <strong>Patient Name:</strong> {selectedQueuePatient.name}
                </p>
                <p>
                  <strong>Scan / Test Ordered:</strong>{" "}
                  {selectedQueuePatient.appFor}
                </p>
                <p>
                  <strong>Time in Waitlist:</strong> {selectedQueuePatient.time}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Mandatory Modality Checklist Items:
                </span>
                <div className="space-y-2">
                  {getModalityChecklist().map((item) => (
                    <label
                      key={item}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checklistStates[item] || false}
                        onChange={(e) => {
                          setChecklistStates({
                            ...checklistStates,
                            [item]: e.target.checked,
                          });
                        }}
                        className="w-4.5 h-4.5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 mt-0.5 cursor-pointer"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="h-16 bg-white border-t border-slate-100 px-5 flex items-center justify-end gap-3 shadow-glass-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChecklistOpen(false)}
                className="h-9 font-semibold text-slate-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmChecklist}
                disabled={
                  !getModalityChecklist().every((item) => checklistStates[item])
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 disabled:opacity-50"
              >
                Confirm & Start Procedure
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT DRAFTING MODAL */}
      {isReportModalOpen && reportRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white text-slate-950 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col transition-all duration-200 max-h-[90vh]">
            {/* Modal Header */}
            <div className="h-14 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 flex items-center justify-between shadow-sm">
              <h3 className="font-bold flex items-center gap-2 font-display text-sm tracking-wide uppercase">
                <span>Draft Structured Report: {moduleLabel}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
              {/* Header Context */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="text-slate-500">Patient ID</p>
                  <p className="font-bold text-slate-800">
                    {reportRecord.patientNo}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Patient Name</p>
                  <p className="font-bold text-slate-800">
                    {reportRecord.patientName}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-slate-500">Age / Gender</p>
                  <p className="font-bold text-slate-800">
                    {reportRecord.age} yrs / {reportRecord.gender}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-slate-500">Ordering Doctor</p>
                  <p className="font-bold text-slate-800">
                    {reportRecord.reportingDoctor || "Dr. Self"}
                  </p>
                </div>
              </div>

              {/* Form Entry */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Test Analyte / Scan Modality
                    </label>
                    <select
                      value={reportAnalyte}
                      onChange={(e) => setReportAnalyte(e.target.value)}
                      className="h-10 w-full px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                    >
                      {module === "lab" ? (
                        <>
                          <option value="Haemoglobin">Haemoglobin</option>
                          <option value="Potassium">Potassium</option>
                          <option value="Sodium">Sodium</option>
                          <option value="Blood glucose">Blood glucose</option>
                          <option value="Platelet count">Platelet count</option>
                          <option value="INR">INR</option>
                          <option value="Creatinine">Creatinine</option>
                          <option value="Other">Other Analyte</option>
                        </>
                      ) : (
                        <>
                          <option value="SpO2">SpO2 (Pulse Oximetry)</option>
                          <option value="Imaging Scan">Imaging Findings</option>
                          <option value="Other">Other Scan</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                      <span>Reference Range</span>
                      <span className="font-mono text-teal-650 font-bold">
                        {analyteRanges[reportAnalyte] || "N/A"}
                      </span>
                    </label>
                    <div className="h-10 px-3 bg-teal-50 border border-teal-100 rounded-xl text-xs font-semibold text-teal-800 flex items-center justify-center">
                      Reference:{" "}
                      {analyteRanges[reportAnalyte] ||
                        "No standard range / Custom Interpretation"}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Result Value / Interpretation
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter result values, e.g. 14.2 g/dL or standard scan remarks..."
                    value={reportResult}
                    onChange={(e) => setReportResult(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Findings
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detailed clinical findings..."
                      value={reportFindings}
                      onChange={(e) => setReportFindings(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Impression
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Diagnostic impression..."
                      value={reportImpression}
                      onChange={(e) => setReportImpression(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Conclusion
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Summary/Conclusion..."
                      value={reportConclusion}
                      onChange={(e) => setReportConclusion(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Technician Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Internal technician notes..."
                      value={reportTechNotes}
                      onChange={(e) => setReportTechNotes(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* File Attachment Upload */}
                <div className="space-y-2.5 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Attach Diagnostic Scan / Report File</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReportFileChange}
                      className="hidden"
                      id="report-file-upload-input"
                    />
                    <label
                      htmlFor="report-file-upload-input"
                      className="flex items-center justify-center gap-2 h-10 px-4 border border-dashed border-slate-300 hover:border-primary rounded-xl text-xs font-semibold text-slate-700 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      <Upload className="w-4 h-4 text-slate-550" />
                      <span>
                        {reportSelectedFile
                          ? "Change File"
                          : "Choose File (Max 5MB)"}
                      </span>
                    </label>
                    {reportSelectedFile && (
                      <span className="text-[11px] font-medium text-slate-600 truncate max-w-[200px]">
                        {reportSelectedFile.name}
                      </span>
                    )}
                  </div>
                  {reportFileUrl && (
                    <div className="mt-3 p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {reportFileUrl.startsWith("data:image/") ? (
                          <img
                            src={reportFileUrl}
                            alt="Attachment preview"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-150"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-teal-700">
                              PDF
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-bold text-slate-700">
                            Scan Attached Successfully
                          </p>
                          <p className="text-[9px] text-muted-foreground font-mono">
                            Base64 ready for doctor dispatch
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReportFileUrl("");
                          setReportSelectedFile(null);
                        }}
                        className="h-7 w-7 p-0 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Real-time Critical Warning Escalation */}
                {getReportCriticalStatus() && (
                  <div className="bg-rose-500/10 border-2 border-rose-500/30 text-rose-700 p-4 rounded-xl space-y-3 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚨</span>
                      <p className="font-black text-xs uppercase tracking-wider">
                        [CRITICAL] Value Threshold Escalation
                      </p>
                    </div>
                    <p className="text-[11px] leading-relaxed font-semibold">
                      [CRITICAL] Notify treating doctor{" "}
                      <strong>
                        {reportRecord.reportingDoctor || "Dr. Self"}
                      </strong>{" "}
                      immediately via HMS alert. Do not release the report until
                      doctor acknowledgement is recorded in the system.
                    </p>
                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer select-none group w-full border border-rose-500/20 bg-white dark:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={reportDrAcknowledgement}
                        onChange={(e) =>
                          setReportDrAcknowledgement(e.target.checked)
                        }
                        className="w-4.5 h-4.5 rounded text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-black text-rose-700 select-none">
                        Doctor acknowledgement received and recorded in HMS
                        (Required to Release)
                      </span>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Technician Name Sign-Off
                    </label>
                    <input
                      type="text"
                      value={reportTechName}
                      onChange={(e) => setReportTechName(e.target.value)}
                      className="h-10 w-full px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Technician ID Sign-Off
                    </label>
                    <input
                      type="text"
                      value={reportTechId}
                      onChange={(e) => setReportTechId(e.target.value)}
                      className="h-10 w-full px-3 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Report Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={reportTimestamp}
                    onChange={(e) => setReportTimestamp(e.target.value)}
                    className="h-10 w-full px-3 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Pre-Examined Validation Checklists */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Verify Report Completeness (All Checklists Mandatory):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    {
                      key: "patientIdMatch",
                      label: "Patient ID matches the original order",
                    },
                    {
                      key: "modalityMatch",
                      label: "Test name and modality match",
                    },
                    {
                      key: "resultsFilled",
                      label: "Result values filled with reference ranges",
                    },
                    {
                      key: "criticalFlagged",
                      label: "Critical values flagged if applicable",
                    },
                    {
                      key: "techSignoff",
                      label: `Technician sign-off present (${reportTechName || "?"} / ${reportTechId || "?"})`,
                    },
                    {
                      key: "timestampLogged",
                      label: "Report timestamp recorded",
                    },
                  ].map((chk) => (
                    <label
                      key={chk.key}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={
                          reportChecklists[
                            chk.key as keyof typeof reportChecklists
                          ] || false
                        }
                        onChange={(e) => {
                          setReportChecklists({
                            ...reportChecklists,
                            [chk.key]: e.target.checked,
                          });
                        }}
                        className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Validation Errors Box */}
              {validationErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-wider">
                    Incomplete Items Checklist:
                  </p>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5 font-semibold">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="h-16 bg-white border-t border-slate-100 px-6 flex items-center justify-end gap-3 shadow-glass-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReportModalOpen(false)}
                className="h-9 font-semibold text-slate-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleVerifyAndReleaseReport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-5 border-0"
              >
                Verify & Mark Examined
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

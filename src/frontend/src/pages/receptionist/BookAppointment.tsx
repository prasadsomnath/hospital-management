import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import { getLocalDateString } from "@/lib/utils";
import type {
  AppointmentResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  BedDouble,
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  FolderOpen,
  ListChecks,
  Loader2,
  MessageSquare,
  Pencil,
  PhoneForwarded,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  Upload,
  UserPlus,
  XCircle
} from "lucide-react";
import { PaginationControl } from "@/components/ui/pagination-control";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";



const MORNING_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"];
const AFTERNOON_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];

export function parseAppointmentNotes(notes: string) {
  const roomRegex = /\[Room:\s*([^\]|]+)(?:\s*\|\s*Bed:\s*([^\]|]+))?(?:\s*\|\s*Type:\s*([^\]|]+))?\]/;
  const nurseRegex = /\[Nurse:\s*([^\]]+)\]/;
  
  const roomMatch = notes.match(roomRegex);
  const nurseMatch = notes.match(nurseRegex);
  
  const roomNumber = roomMatch ? roomMatch[1].trim() : "";
  const bedNo = roomMatch && roomMatch[2] ? roomMatch[2].trim() : "";
  const roomType = roomMatch && roomMatch[3] ? roomMatch[3].trim() : "";
  const assignedNurse = nurseMatch ? nurseMatch[1].trim() : "";
  
  let cleanNotes = notes;
  cleanNotes = cleanNotes.replace(/\[IPD\]\s*/, "");
  cleanNotes = cleanNotes.replace(/\[OPD\]\s*/, "");
  cleanNotes = cleanNotes.replace(roomRegex, "");
  cleanNotes = cleanNotes.replace(nurseRegex, "");
  cleanNotes = cleanNotes.trim();
  
  return {
    roomNumber,
    bedNo,
    roomType,
    assignedNurse,
    cleanNotes
  };
}

const EMPTY_FORM = {
  patientSearch: "",
  patientNo: "",
  doctorId: "",
  date: getLocalDateString(),
  timeSlot: "",
  type: "",
  notes: "",
  visitType: "OPD" as "OPD" | "IPD",
  toDate: "",
  // IPD Room & Bed allocation
  roomId: "",
  floor: "",
  bedNo: "",
  roomNumber: "",
  roomType: "",
  assignedNurse: "",
  dueAmount: "",
};


const TYPE_MAP_UI: Record<string, string> = {
  ICU: "ICU",
  GENERAL: "General",
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-Private",
};

const ROOM_TYPE_COLORS: Record<string, string> = {
  ICU: "border-red-500/40 bg-red-500/8 text-red-600 dark:text-red-400",
  General: "border-primary/40 bg-primary/8 text-primary",
  Private: "border-purple-500/40 bg-purple-500/8 text-purple-600 dark:text-purple-400",
  "Semi-Private": "border-emerald-500/40 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400",
};

const ROOM_TYPE_ACTIVE: Record<string, string> = {
  ICU: "bg-red-500 text-white border-red-500",
  General: "bg-primary text-primary-foreground border-primary",
  Private: "bg-purple-500 text-white border-purple-500",
  "Semi-Private": "bg-emerald-500 text-white border-emerald-500",
};

// Pagination variables
const DEFAULT_PAGE_SIZE = 10;

// ── Sub-components ────────────────────────────────────────────────────────────
function TipBtn({
  icon: Icon,
  label,
  tooltip,
  variant = "outline",
  className = "",
  onClick,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  tooltip: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={`h-8 px-2.5 text-xs flex items-center gap-1.5 ${className}`}
          disabled={disabled}
          onClick={() => {
            onClick?.();
            if (!onClick) toast.info(label);
          }}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusBadge({
  status,
  onClick,
  visitType,
}: {
  status: string;
  onClick?: () => void;
  visitType?: string;
}) {
  const map: Record<string, string> = {
    Paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    Pending:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition-colors",
    Cancelled:
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] ?? "bg-muted text-muted-foreground"}`}
      onClick={(e) => {
        if (status === "Pending" && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      title={status === "Pending" ? (visitType === "IPD" ? "Click to open IPD Billing" : "Click to open OPD Billing") : undefined}
    >
      {status}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BookAppointment() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // ── form state ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const suggRef = useRef<HTMLDivElement>(null);

  // Helper for current local datetime string (type="datetime-local" input compatible)
  const getLocalDatetimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  // ── register fields state ──
  const [mlcFields, setMlcFields] = useState({
    injuryType: "Road Accident",
    broughtBy: "Relative",
    policeStationName: "",
    firNumber: "",
    informingDoctor: "",
    remarks: "",
  });

  const [maternityFields, setMaternityFields] = useState({
    ipOpNo: "",
    lmpDate: "",
    eddByLmp: "",
    eddByUsg: "",
    gravida: 0,
    para: 0,
    living: 0,
    abortion: 0,
    wardBed: "",
    remarks: "",
    status: "Active",
  });

  const [otFields, setOtFields] = useState({
    ipNo: "",
    procedureName: "",
    procedureType: "Elective",
    startDateTime: "",
    endDateTime: "",
    surgeonId: "",
    scrubNurse: "",
    otRoomNo: "",
    anaesthesiaType: "GA",
    anaesthetistId: "",
    preOpDiagnosis: "",
    postOpDiagnosis: "",
    outcome: "Successful",
    remarks: "",
  });

  const [consentFields, setConsentFields] = useState({
    ipOpNo: "",
    procedureName: "",
    consentType: "Surgical",
    signedBy: "Patient",
    guardianName: "",
    relationship: "",
    doctorId: "",
    witnessName: "",
    consentDateTime: "",
    documentUrl: "",
    remarks: "",
  });

  const [deathFields, setDeathFields] = useState({
    ipNo: "",
    wardBed: "",
    deathDateTime: "",
    primaryCause: "",
    secondaryCause: "",
    manner: "Natural",
    mlcLinked: "No",
    mlcNo: "",
    handoverStatus: "Pending",
    handoverToName: "",
    handoverToRelationship: "",
    certifyingDoctorId: "",
    remarks: "",
  });

  const [birthFields, setBirthFields] = useState({
    babyName: "",
    gender: "Male",
    birthDateTime: "",
    birthWeight: "",
    deliveryType: "Normal",
    fatherName: "",
    fatherPhone: "",
    ward: "",
    bedNo: "",
    deliveringDoctorId: "",
    apgarScore1min: "",
    apgarScore5min: "",
    remarks: "",
  });

  const [freePatientFields, setFreePatientFields] = useState({
    ipOpNo: "",
    schemeName: "BPL",
    servicesCovered: "",
    authorisedById: "",
    approvalDate: "",
    remarks: "",
  });

  const [freePatientServices, setFreePatientServices] = useState<string[]>([]);

  const [dischargeFields, setDischargeFields] = useState({
    ipNo: "",
    admissionDate: "",
    dischargeDateTime: "",
    wardBed: "",
    diagnosis: "",
    procedureDone: "",
    dischargeType: "Recovered",
    followUpDate: "",
    finalBillAmount: "",
    billSettled: "Yes",
    treatingDoctorId: "",
    remarks: "",
  });

  const [threeCFields, setThreeCFields] = useState({
    caseType: "Casualty",
    arrivalDateTime: "",
    triageLevel: "Green",
    chiefComplaint: "",
    referredFrom: "",
    broughtBy: "Self",
    bp: "",
    pulse: "",
    temperature: "",
    spo2: "",
    actionsTaken: "",
    assignedDoctorId: "",
    status: "Active",
    remarks: "",
  });

  const [insuranceBillFields, setInsuranceBillFields] = useState({
    billNo: "",
    ipNo: "",
    insurerName: "",
    policyNumber: "",
    tpaName: "",
    schemeType: "Cashless",
    claimAmount: "",
    approvedAmount: "",
    balanceToPatient: "0",
    claimStatus: "Submitted",
    submissionDate: "",
    settlementDate: "",
    remarks: "",
  });

  // Auto-calculate Maternity EDD from LMP Date
  useEffect(() => {
    if (maternityFields.lmpDate) {
      try {
        const lmp = new Date(maternityFields.lmpDate);
        const eddTime = lmp.getTime() + 280 * 24 * 60 * 60 * 1000;
        const eddDate = new Date(eddTime);
        const yyyy = eddDate.getFullYear();
        const mm = String(eddDate.getMonth() + 1).padStart(2, "0");
        const dd = String(eddDate.getDate()).padStart(2, "0");
        setMaternityFields((prev) => ({ ...prev, eddByLmp: `${yyyy}-${mm}-${dd}` }));
      } catch (e) {
        console.error(e);
      }
    } else {
      setMaternityFields((prev) => ({ ...prev, eddByLmp: "" }));
    }
  }, [maternityFields.lmpDate]);

  // Auto-calculate Insurance Balance to Patient
  useEffect(() => {
    const claim = Number(insuranceBillFields.claimAmount) || 0;
    const approved = Number(insuranceBillFields.approvedAmount) || 0;
    const balance = Math.max(0, claim - approved);
    setInsuranceBillFields((prev) => {
      if (prev.balanceToPatient === String(balance)) return prev;
      return { ...prev, balanceToPatient: String(balance) };
    });
  }, [insuranceBillFields.claimAmount, insuranceBillFields.approvedAmount]);

  const handleFreePatientServiceChange = (service: string, checked: boolean) => {
    if (service === "All") {
      if (checked) {
        setFreePatientServices(["All", "Consultation", "OT", "Medicine", "Lab", "Ward"]);
      } else {
        setFreePatientServices([]);
      }
    } else {
      let updated = [...freePatientServices];
      if (checked) {
        updated.push(service);
        const subServices = ["Consultation", "OT", "Medicine", "Lab", "Ward"];
        const allChecked = subServices.every((s) => updated.includes(s));
        if (allChecked && !updated.includes("All")) {
          updated.push("All");
        }
      } else {
        updated = updated.filter((s) => s !== service && s !== "All");
      }
      setFreePatientServices(updated);
    }
  };

  const initializeRegisterFields = () => {
    const curDatetime = getLocalDatetimeString();
    const curDate = getLocalDateString();
    setMlcFields({
      injuryType: "Road Accident",
      broughtBy: "Relative",
      policeStationName: "",
      firNumber: "",
      informingDoctor: "",
      remarks: "",
    });
    setMaternityFields({
      ipOpNo: "",
      lmpDate: "",
      eddByLmp: "",
      eddByUsg: "",
      gravida: 0,
      para: 0,
      living: 0,
      abortion: 0,
      wardBed: "",
      remarks: "",
      status: "Active",
    });
    setOtFields({
      ipNo: "",
      procedureName: "",
      procedureType: "Elective",
      startDateTime: curDatetime,
      endDateTime: curDatetime,
      surgeonId: "",
      scrubNurse: "",
      otRoomNo: "",
      anaesthesiaType: "GA",
      anaesthetistId: "",
      preOpDiagnosis: "",
      postOpDiagnosis: "",
      outcome: "Successful",
      remarks: "",
    });
    setConsentFields({
      ipOpNo: "",
      procedureName: "",
      consentType: "Surgical",
      signedBy: "Patient",
      guardianName: "",
      relationship: "",
      doctorId: "",
      witnessName: "",
      consentDateTime: curDatetime,
      documentUrl: "",
      remarks: "",
    });
    setDeathFields({
      ipNo: "",
      wardBed: "",
      deathDateTime: curDatetime,
      primaryCause: "",
      secondaryCause: "",
      manner: "Natural",
      mlcLinked: "No",
      mlcNo: "",
      handoverStatus: "Pending",
      handoverToName: "",
      handoverToRelationship: "",
      certifyingDoctorId: "",
      remarks: "",
    });
    setBirthFields({
      babyName: "",
      gender: "Male",
      birthDateTime: curDatetime,
      birthWeight: "",
      deliveryType: "Normal",
      fatherName: "",
      fatherPhone: "",
      ward: "",
      bedNo: "",
      deliveringDoctorId: "",
      apgarScore1min: "",
      apgarScore5min: "",
      remarks: "",
    });
    setFreePatientFields({
      ipOpNo: "",
      schemeName: "BPL",
      servicesCovered: "",
      authorisedById: "",
      approvalDate: curDate,
      remarks: "",
    });
    setFreePatientServices([]);
    setDischargeFields({
      ipNo: "",
      admissionDate: curDate,
      dischargeDateTime: curDatetime,
      wardBed: "",
      diagnosis: "",
      procedureDone: "",
      dischargeType: "Recovered",
      followUpDate: "",
      finalBillAmount: "",
      billSettled: "Yes",
      treatingDoctorId: "",
      remarks: "",
    });
    setThreeCFields({
      caseType: "Casualty",
      arrivalDateTime: curDatetime,
      triageLevel: "Green",
      chiefComplaint: "",
      referredFrom: "",
      broughtBy: "Self",
      bp: "",
      pulse: "",
      temperature: "",
      spo2: "",
      actionsTaken: "",
      assignedDoctorId: "",
      status: "Active",
      remarks: "",
    });
    setInsuranceBillFields({
      billNo: "",
      ipNo: "",
      insurerName: "",
      policyNumber: "",
      tpaName: "",
      schemeType: "Cashless",
      claimAmount: "",
      approvedAmount: "",
      balanceToPatient: "0",
      claimStatus: "Submitted",
      submissionDate: curDate,
      settlementDate: "",
      remarks: "",
    });
  };

  const resetRegisterFields = () => {
    setMlcFields({
      injuryType: "Road Accident",
      broughtBy: "Relative",
      policeStationName: "",
      firNumber: "",
      informingDoctor: "",
      remarks: "",
    });
    setMaternityFields({
      ipOpNo: "",
      lmpDate: "",
      eddByLmp: "",
      eddByUsg: "",
      gravida: 0,
      para: 0,
      living: 0,
      abortion: 0,
      wardBed: "",
      remarks: "",
      status: "Active",
    });
    setOtFields({
      ipNo: "",
      procedureName: "",
      procedureType: "Elective",
      startDateTime: "",
      endDateTime: "",
      surgeonId: "",
      scrubNurse: "",
      otRoomNo: "",
      anaesthesiaType: "GA",
      anaesthetistId: "",
      preOpDiagnosis: "",
      postOpDiagnosis: "",
      outcome: "Successful",
      remarks: "",
    });
    setConsentFields({
      ipOpNo: "",
      procedureName: "",
      consentType: "Surgical",
      signedBy: "Patient",
      guardianName: "",
      relationship: "",
      doctorId: "",
      witnessName: "",
      consentDateTime: "",
      documentUrl: "",
      remarks: "",
    });
    setDeathFields({
      ipNo: "",
      wardBed: "",
      deathDateTime: "",
      primaryCause: "",
      secondaryCause: "",
      manner: "Natural",
      mlcLinked: "No",
      mlcNo: "",
      handoverStatus: "Pending",
      handoverToName: "",
      handoverToRelationship: "",
      certifyingDoctorId: "",
      remarks: "",
    });
    setBirthFields({
      babyName: "",
      gender: "Male",
      birthDateTime: "",
      birthWeight: "",
      deliveryType: "Normal",
      fatherName: "",
      fatherPhone: "",
      ward: "",
      bedNo: "",
      deliveringDoctorId: "",
      apgarScore1min: "",
      apgarScore5min: "",
      remarks: "",
    });
    setFreePatientFields({
      ipOpNo: "",
      schemeName: "BPL",
      servicesCovered: "",
      authorisedById: "",
      approvalDate: "",
      remarks: "",
    });
    setFreePatientServices([]);
    setDischargeFields({
      ipNo: "",
      admissionDate: "",
      dischargeDateTime: "",
      wardBed: "",
      diagnosis: "",
      procedureDone: "",
      dischargeType: "Recovered",
      followUpDate: "",
      finalBillAmount: "",
      billSettled: "Yes",
      treatingDoctorId: "",
      remarks: "",
    });
    setThreeCFields({
      caseType: "Casualty",
      arrivalDateTime: "",
      triageLevel: "Green",
      chiefComplaint: "",
      referredFrom: "",
      broughtBy: "Self",
      bp: "",
      pulse: "",
      temperature: "",
      spo2: "",
      actionsTaken: "",
      assignedDoctorId: "",
      status: "Active",
      remarks: "",
    });
    setInsuranceBillFields({
      billNo: "",
      ipNo: "",
      insurerName: "",
      policyNumber: "",
      tpaName: "",
      schemeType: "Cashless",
      claimAmount: "",
      approvedAmount: "",
      balanceToPatient: "0",
      claimStatus: "Submitted",
      submissionDate: "",
      settlementDate: "",
      remarks: "",
    });
  };

  // ── filters ──
  const [filterDate, setFilterDate] = useState(() => {
    const saved = sessionStorage.getItem("book-appt-filter-date");
    return saved !== null ? saved : getLocalDateString();
  });
  const [filterDr, setFilterDr] = useState(() => {
    return sessionStorage.getItem("book-appt-filter-dr") || "ALL";
  });
  const [filterVisitType, setFilterVisitType] = useState<string>(() => {
    return sessionStorage.getItem("book-appt-filter-visit") || "ALL";
  });
  const [showExaminedOnly, setShowExaminedOnly] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // ── edit dialog state ──
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentResponse | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    timeSlot: "",
    type: "",
    notes: "",
    visitType: "OPD" as "OPD" | "IPD",
    toDate: "",
    status: "",
    roomId: "",
    floor: "",
    roomNumber: "",
    bedNo: "",
    roomType: "",
    assignedNurse: "",
    dueAmount: "",
    // Discharge fields
    dischargeIpNo: "",
    dischargeDiagnosis: "General Discharge",
    dischargeProcedureDone: "",
    dischargeType: "Normal",
    dischargeFinalBillAmount: "" as number | "",
    dischargeBillSettled: "Yes",
    dischargeRemarks: "",
    dischargeFollowUpDate: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── data ──
  const [nurses, setNurses] = useState<any[]>([]);
  const [loadingNurses, setLoadingNurses] = useState(false);


  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [dialogAppointments, setDialogAppointments] = useState<AppointmentResponse[]>([]);
  const [editDialogAppointments, setEditDialogAppointments] = useState<AppointmentResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const getDocName = (drId: string, fallback: string) => {
    const matched = doctors.find((d) => d.doctorCode === drId || String(d.id) === drId);
    if (matched) {
      const raw = matched.name || `${matched.firstName} ${matched.lastName || ""}`.trim();
      return raw.toLowerCase().startsWith("dr.") ? raw : `Dr. ${raw}`;
    }
    return fallback;
  };
  const [dialogDeptId, setDialogDeptId] = useState<string>("");
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  // ── IPD Room & Bed state ──
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const inpatients: any[] = [];
  const [globalAppointments, setGlobalAppointments] = useState<any[]>([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("All");

  const [beds, setBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  const [editBeds, setEditBeds] = useState<any[]>([]);
  const [loadingEditBeds, setLoadingEditBeds] = useState(false);

  // Fetch beds for Add Dialog when roomId changes
  useEffect(() => {
    if (form.roomId) {
      setLoadingBeds(true);
      apiFetch<any[]>(`/admin/beds/room/${form.roomId}`, {
        headers: { "X-Hospital-Code": code },
      })
        .then((res) => {
          const fetched = Array.isArray(res) ? res : [];
          if (fetched.length === 0) {
            // Fallback: generate synthetic beds from room's totalBeds
            const room = availableRooms.find((r) => r.id === form.roomId);
            if (room && room.totalBeds > 0) {
              const synth = Array.from({ length: room.totalBeds }, (_, i) => ({
                id: `synth-${i + 1}`,
                bedNumber: `${room.number}-B${i + 1}`,
                status: "AVAILABLE",
              }));
              setBeds(synth);
            } else {
              setBeds([]);
            }
          } else {
            setBeds(fetched);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch beds for room:", err);
          // Fallback on error too
          const room = availableRooms.find((r) => r.id === form.roomId);
          if (room && room.totalBeds > 0) {
            const synth = Array.from({ length: room.totalBeds }, (_, i) => ({
              id: `synth-${i + 1}`,
              bedNumber: `${room.number}-B${i + 1}`,
              status: "AVAILABLE",
            }));
            setBeds(synth);
          } else {
            setBeds([]);
          }
        })
        .finally(() => {
          setLoadingBeds(false);
        });
    } else {
      setBeds([]);
    }
  }, [form.roomId, code, availableRooms]);

  // Fetch beds for Edit Dialog when editForm.roomId changes
  useEffect(() => {
    if (editForm.roomId) {
      setLoadingEditBeds(true);
      apiFetch<any[]>(`/admin/beds/room/${editForm.roomId}`, {
        headers: { "X-Hospital-Code": code },
      })
        .then((res) => {
          const fetched = Array.isArray(res) ? res : [];
          if (fetched.length === 0) {
            const room = availableRooms.find((r) => r.id === editForm.roomId);
            if (room && room.totalBeds > 0) {
              const synth = Array.from({ length: room.totalBeds }, (_, i) => ({
                id: `synth-${i + 1}`,
                bedNumber: `${room.number}-B${i + 1}`,
                status: "AVAILABLE",
              }));
              setEditBeds(synth);
            } else {
              setEditBeds([]);
            }
          } else {
            setEditBeds(fetched);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch beds for edit room:", err);
          const room = availableRooms.find((r) => r.id === editForm.roomId);
          if (room && room.totalBeds > 0) {
            const synth = Array.from({ length: room.totalBeds }, (_, i) => ({
              id: `synth-${i + 1}`,
              bedNumber: `${room.number}-B${i + 1}`,
              status: "AVAILABLE",
            }));
            setEditBeds(synth);
          } else {
            setEditBeds([]);
          }
        })
        .finally(() => {
          setLoadingEditBeds(false);
        });
    } else {
      setEditBeds([]);
    }
  }, [editForm.roomId, code, availableRooms]);

  // Resolve roomId for Edit Dialog once availableRooms is loaded and matches roomNumber
  useEffect(() => {
    if (editDialogOpen && editForm.roomNumber && availableRooms.length > 0 && !editForm.roomId) {
      const match = availableRooms.find((r) => r.number === editForm.roomNumber);
      if (match) {
        setEditForm((p) => ({ ...p, roomId: match.id, floor: String(match.floor || "1") }));
      }
    }
  }, [editDialogOpen, editForm.roomNumber, availableRooms, editForm.roomId]);

  // ── load patients (for search) ──
  useEffect(() => {
    receptionApi
      .getPatients(code)
      .then((list) => {
        if (Array.isArray(list)) setPatients(list);
      })
      .catch((err) => {
        console.error("Failed to load patients for search:", err);
        toast.error("Failed to load patients list: " + (err.message || err));
      });
  }, [code]);

  // ── load departments, doctors and hospital details ──
  useEffect(() => {
    const fetchRegistryData = async () => {
      try {
        const [deptsData, docsData, hospitalData] = await Promise.all([
          apiFetch<any>("/admin/departments", {
            params: { page: 0, size: 1000 },
            headers: { "X-Hospital-Code": code },
          }),
          apiFetch<any>("/admin/doctors", {
            params: { page: 0, size: 1000 },
            headers: { "X-Hospital-Code": code },
          }),
          apiFetch<any>(`/super-admin/hospitals/code/${code}`).catch(
            () => null,
          ),
        ]);
        const deptsList = Array.isArray(deptsData)
          ? deptsData
          : (deptsData?.content ?? []);
        const docsList = Array.isArray(docsData)
          ? docsData
          : (docsData?.content ?? []);
        setDepartments(deptsList);
        setDoctors(docsList);
        if (hospitalData) setHospitalInfo(hospitalData);
      } catch (err) {
        console.error(
          "Failed to load departments, doctors or hospital details:",
          err,
        );
      }
    };
    fetchRegistryData();
  }, [code]);

  // ── fetch active nurses ──
  const fetchNurses = useCallback(async () => {
    setLoadingNurses(true);
    try {
      const res = await apiFetch<any>("/admin/nurses", {
        headers: {
          "X-Hospital-Code": code,
        },
        params: {
          page: 0,
          size: 1000,
        },
      });

      const credentials = res?.content || [];
      const mapped = credentials.map((n: any) => {
        const fullName = `${n.firstName} ${n.middleName || ""} ${n.lastName || ""}`.trim().replace(/\s+/g, " ");
        return {
          id: String(n.id),
          name: fullName,
          firstName: n.firstName,
          middleName: n.middleName || "",
          lastName: n.lastName,
          email: n.email,
          phone: n.mobile || "N/A",
          gender: n.gender || "",
          experience: n.experience || "",
          qualification: n.qualification || "",
          hospitalCode: n.hospitalCode,
          status: n.isActive ? "Active" : "Inactive",
          joinDate: n.createdAt ? n.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        };
      });

      const activeNurses = mapped.filter((n: any) => n.status === "Active");
      setNurses(activeNurses);
    } catch (e: any) {
      console.error("Failed to fetch nurses, using local fallback:", e);
      const saved = localStorage.getItem("medicore-nurses");
      if (saved) {
        const localNurses = JSON.parse(saved);
        const activeLocalNurses = localNurses.filter((n: any) => n.status === "Active");
        setNurses(activeLocalNurses);
      } else {
        setNurses([]);
      }
    } finally {
      setLoadingNurses(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      fetchNurses();
    }
  }, [code, fetchNurses]);


  // ── fetch available rooms for IPD ──
  const fetchAvailableRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await apiFetch<any>("/admin/rooms", {
        headers: { "X-Hospital-Code": code },
        params: { size: 200 },
      });
      const list = res.content || res || [];
      const mapped = list
        .filter((r: any) => r.isActive !== false)
        .map((r: any) => ({
          id: String(r.id),
          number: r.roomNumber,
          type: TYPE_MAP_UI[r.roomType] || "General",
          floor: r.floor || "1",
          totalBeds: r.totalBeds ?? 1,
          availableBeds: r.availableBeds ?? 0,
          departmentId: r.departmentId,
        }));
      setAvailableRooms(mapped);
    } catch (err) {
      console.warn("Could not load rooms:", err);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [code]);

  // ── fetch all global appointments to block occupied beds ──
  const fetchGlobalAppointments = useCallback(async () => {
    try {
      const list = await receptionApi.getAppointments(code, "", "ALL");
      setGlobalAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Could not load global appointments:", err);
      setGlobalAppointments([]);
    }
  }, [code]);

  // fetch rooms whenever the dialog opens in IPD mode
  useEffect(() => {
    if ((addDialogOpen && form.visitType === "IPD") || (editDialogOpen && editForm.visitType === "IPD")) {
      fetchAvailableRooms();
      fetchGlobalAppointments();
    }
  }, [addDialogOpen, editDialogOpen, form.visitType, editForm.visitType, fetchAvailableRooms, fetchGlobalAppointments]);

  // ── load appointments ──
  const loadAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      const list = await receptionApi.getAppointments(
        code,
        filterDate,
        filterDr,
      );
      setAppointments(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoadingAppts(false);
    }
  }, [code, filterDate, filterDr, refreshTrigger]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    sessionStorage.setItem("book-appt-filter-date", filterDate);
  }, [filterDate]);

  useEffect(() => {
    sessionStorage.setItem("book-appt-filter-dr", filterDr);
  }, [filterDr]);

  useEffect(() => {
    sessionStorage.setItem("book-appt-filter-visit", filterVisitType);
  }, [filterVisitType]);

  // Fetch existing appointments for the selected doctor & date in the Add dialog
  useEffect(() => {
    if (addDialogOpen && form.doctorId && form.date) {
      receptionApi
        .getAppointments(code, form.date, form.doctorId)
        .then((list) => {
          setDialogAppointments(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    } else {
      setDialogAppointments([]);
    }
  }, [addDialogOpen, form.doctorId, form.date, code]);

  // Fetch existing appointments for the selected doctor & date in the Edit dialog
  useEffect(() => {
    if (editDialogOpen && editingAppt?.doctorId && editForm.date) {
      receptionApi
        .getAppointments(code, editForm.date, editingAppt.doctorId)
        .then((list) => {
          setEditDialogAppointments(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    } else {
      setEditDialogAppointments([]);
    }
  }, [editDialogOpen, editingAppt?.doctorId, editForm.date, code]);

  // ── close suggestions on outside click ──
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (suggRef.current && !suggRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── patient search suggestions ──
  const filteredPatients = patients.filter(
    (p) =>
      form.patientSearch.length > 0 &&
      (p.name.toLowerCase().includes(form.patientSearch.toLowerCase()) ||
        p.patientNo.toLowerCase().includes(form.patientSearch.toLowerCase()) ||
        p.phone?.toLowerCase().includes(form.patientSearch.toLowerCase()) ||
        p.alternativeNum?.toLowerCase().includes(form.patientSearch.toLowerCase())),
  );

  const selectedPatient = patients.find((p) => p.patientNo === form.patientNo);

  // ── derived stats ──
  const examinedCnt = appointments.filter(
    (a) => a.status === "Completed",
  ).length;
  const pendingCnt = appointments.filter(
    (a) => a.status === "Scheduled" || a.status === "Checked-In",
  ).length;
  const totalAppts = appointments.length;

  const displayedAppointments = (showExaminedOnly
    ? appointments.filter((a) => a.status === "Completed")
    : appointments).filter((a) => {
      if (filterVisitType === "ALL") return true;
      if (filterVisitType === "IPD") return a.visitType === "IPD" || a.appointmentType === "IPD";
      if (filterVisitType === "OPD") return a.visitType === "OPD" || a.appointmentType === "OPD" || (!a.visitType && a.appointmentType !== "IPD");
      return true;
    });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function selectPatient(patientNo: string, name: string) {
    setForm((prev) => ({ ...prev, patientNo, patientSearch: name }));
    setShowSuggestions(false);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.patientNo) e.patientNo = "Please select a patient";
    if (!form.doctorId) e.doctorId = "Please select a doctor";
    if (form.visitType === "OPD" && !form.timeSlot) e.timeSlot = "Please select a time slot";
    if (!form.type) e.type = "Please select appointment type";
    
    const todayStr = new Date().toLocaleDateString("sv-SE");
    if (!form.date) {
      e.date = "Please select a date";
    } else if (form.date < todayStr) {
      e.date = "Back dates are not allowed";
    }

    if (form.visitType === "OPD" && form.timeSlot && dialogAppointments.some((appt) => appt.timeSlot === form.timeSlot)) {
      e.timeSlot = "This slot is already booked for the selected doctor and date";
    }

    // Active register validations
    if (form.type === "MLC") {
      if (!mlcFields.injuryType) e.type = "Injury Type is required for MLC";
      if (!mlcFields.broughtBy.trim()) e.type = "Brought By is required for MLC";
    } else if (form.type === "Maternity") {
      if (!maternityFields.lmpDate) e.type = "LMP Date is required for Maternity";
    } else if (form.type === "OT") {
      if (!otFields.procedureName.trim()) e.type = "Procedure Name is required for OT";
      if (!otFields.startDateTime) e.type = "Start Date & Time is required for OT";
    } else if (form.type === "Consent") {
      if (!consentFields.procedureName.trim()) e.type = "Procedure Name is required for Consent";
      if (!consentFields.consentType.trim()) e.type = "Consent Category is required for Consent";
      if (!consentFields.signedBy.trim()) e.type = "Signed By is required for Consent";
      if (consentFields.signedBy === "Guardian") {
        if (!consentFields.guardianName.trim() || !consentFields.relationship.trim()) {
          e.type = "Please enter guardian details (Name & Relationship) for Consent";
        }
      }
      if (!consentFields.consentDateTime) e.type = "Consent Date & Time is required for Consent";
    } else if (form.type === "Death") {
      if (!deathFields.deathDateTime) e.type = "Date & Time of Death is required for Death Register";
      if (!deathFields.primaryCause.trim()) e.type = "Primary Cause of Death is required";
      if (deathFields.mlcLinked === "Yes" && !deathFields.mlcNo.trim()) e.type = "MLC Number is required since MLC is linked";
      if (deathFields.handoverStatus === "Handed Over") {
        if (!deathFields.handoverToName.trim() || !deathFields.handoverToRelationship.trim()) {
          e.type = "Please enter body receiver credentials (Name & Relationship) for Death Register";
        }
      }
      if (form.visitType === "IPD" && deathFields.deathDateTime) {
        const admissionStr = form.date.split("T")[0];
        const deathStr = deathFields.deathDateTime.split("T")[0];
        const admission = new Date(admissionStr);
        const death = new Date(deathStr);
        const diffTime = death.getTime() - admission.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          e.type = "IPD patient stay cannot be negative.";
        }
      }
    } else if (form.type === "Birth") {
      if (!birthFields.babyName.trim()) e.type = "Baby Name is required for Birth Register";
      if (!birthFields.birthDateTime) e.type = "Birth Date & Time is required";
    } else if (form.type === "Free Patient") {
      if (!freePatientFields.schemeName.trim()) e.type = "Scheme / Sponsor Name is required";
      if (freePatientServices.length === 0) e.type = "Please select at least one service waiver";
      if (!freePatientFields.approvalDate) e.type = "Approval Date is required";
    } else if (form.type === "Discharge") {
      if (!dischargeFields.ipNo.trim()) e.type = "IP Number is required for Discharge";
      if (!dischargeFields.admissionDate) e.type = "Admission Date is required";
      if (!dischargeFields.dischargeDateTime) e.type = "Discharge Date & Time is required";
      if (!dischargeFields.diagnosis.trim()) e.type = "Diagnosis is required";
      if (dischargeFields.finalBillAmount === "") e.type = "Final Bill Amount is required";
      if (form.visitType === "IPD" && dischargeFields.admissionDate && dischargeFields.dischargeDateTime) {
        const admissionStr = dischargeFields.admissionDate.split("T")[0];
        const dischargeStr = dischargeFields.dischargeDateTime.split("T")[0];
        const admission = new Date(admissionStr);
        const discharge = new Date(dischargeStr);
        const diffTime = discharge.getTime() - admission.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          e.type = "IPD patient stay cannot be negative.";
        }
      }
    } else if (form.type === "3C") {
      if (!threeCFields.arrivalDateTime) e.type = "Arrival Date & Time is required";
      if (!threeCFields.broughtBy.trim()) e.type = "Brought By is required";
      if (!threeCFields.chiefComplaint.trim()) e.type = "Chief Complaint is required";
    } else if (form.type === "Insurance Bill") {
      if (!insuranceBillFields.billNo.trim()) e.type = "Bill Number is required";
      if (!insuranceBillFields.insurerName.trim()) e.type = "Insurer Name is required";
      if (!insuranceBillFields.policyNumber.trim()) e.type = "Policy Number is required";
      if (!insuranceBillFields.schemeType.trim()) e.type = "Scheme Type is required";
      if (insuranceBillFields.claimAmount === "") e.type = "Claim Amount is required";
      if (!insuranceBillFields.submissionDate) e.type = "Submission Date is required";
    }
    
    setErrors(e);
    
    const keys = Object.keys(e);
    if (keys.length > 0) {
      toast.error(e[keys[0]]);
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // For IPD, warn if no room selected but don't block
    if (form.visitType === "IPD" && !form.roomId) {
      toast.warning("No room/bed selected — booking without room allocation.");
    }
    setSubmitting(true);
    try {
      // Build notes with visit type and room/bed info
      let notesStr = form.notes || "";
      let prefix = `[${form.visitType}]`;
      if (form.visitType === "IPD" && form.roomNumber && form.bedNo) {
        prefix += ` [Room: ${form.roomNumber} | Bed: ${form.bedNo} | Type: ${form.roomType}]`;
      } else if (form.visitType === "IPD" && form.roomNumber) {
        prefix += ` [Room: ${form.roomNumber} | Type: ${form.roomType}]`;
      }
      if (form.visitType === "IPD" && form.assignedNurse) {
        prefix += ` [Nurse: ${form.assignedNurse}]`;
      }
      const notesWithVisit = notesStr ? `${prefix} ${notesStr}` : prefix;
      const chosenDoc = doctors.find((d) => d.doctorCode === form.doctorId);
      await receptionApi.bookAppointment(
        {
          patientNo: form.patientNo,
          doctorId: form.doctorId,
          appointmentDate: form.date,
          timeSlot:
            form.visitType === "IPD"
              ? `IPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
              : form.timeSlot,
          appointmentType: form.type,
          visitType: form.visitType,
          toDate: null,
          notes: notesWithVisit,
          dueAmount: Number(form.dueAmount) || 0,
          roomNumber: form.visitType === "IPD" ? form.roomNumber : null,
          bedNo: form.visitType === "IPD" ? form.bedNo : null,
          roomType: form.visitType === "IPD" ? form.roomType : null,
          assignedNurse: form.visitType === "IPD" ? form.assignedNurse : null,
        },
        code,
      );
      toast.success(
        form.visitType === "IPD" && form.roomNumber
          ? `IPD Appointment booked — Room ${form.roomNumber}, Bed ${form.bedNo || "TBD"}!`
          : "Appointment booked successfully!",
      );

      // After booking appointment, create the register record
      const patName = selectedPatient?.name || "";
      const patAge = selectedPatient?.age || 0;
      const patGender = selectedPatient?.gender || "Male";
      
      try {
        if (form.type === "MLC") {
          const matchedDoc = doctors.find((d) => d.doctorCode === form.doctorId);
          const treatingDoctorName = matchedDoc
            ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createMlcEntry({
            patientNo: form.patientNo,
            patientName: patName,
            age: patAge,
            gender: patGender,
            admissionDateTime: getLocalDatetimeString(),
            injuryType: mlcFields.injuryType,
            broughtBy: mlcFields.broughtBy,
            policeStationName: mlcFields.policeStationName || null,
            firNumber: mlcFields.firNumber || null,
            informingDoctor: mlcFields.informingDoctor || null,
            treatingDoctorId: form.doctorId || null,
            treatingDoctorName: treatingDoctorName || null,
            remarks: mlcFields.remarks || null,
            status: "Open",
          }, code);
          toast.success("Medico-Legal Case entry recorded successfully.");
        } else if (form.type === "Maternity") {
          const matchedDoc = doctors.find((d) => d.doctorCode === form.doctorId);
          const assignedDoctorName = matchedDoc
            ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createEddEntry({
            patientNo: form.patientNo,
            patientName: patName,
            ipOpNo: maternityFields.ipOpNo || null,
            lmpDate: maternityFields.lmpDate,
            eddByLmp: maternityFields.eddByLmp,
            eddByUsg: maternityFields.eddByUsg || null,
            gravida: Number(maternityFields.gravida) || 0,
            para: Number(maternityFields.para) || 0,
            living: Number(maternityFields.living) || 0,
            abortion: Number(maternityFields.abortion) || 0,
            assignedDoctorId: form.doctorId || null,
            assignedDoctorName: assignedDoctorName || null,
            wardBed: maternityFields.wardBed || null,
            remarks: maternityFields.remarks || null,
            status: maternityFields.status || "Active",
          }, code);
          toast.success("Maternity log record logged successfully.");
        } else if (form.type === "OT") {
          const otSurgeonCode = otFields.surgeonId || form.doctorId;
          const matchedSurgeon = doctors.find((d) => d.doctorCode === otSurgeonCode);
          const surgeonName = matchedSurgeon
            ? `Dr. ${matchedSurgeon.firstName} ${matchedSurgeon.lastName || ""}`.trim()
            : "";
          const matchedAnaesthetist = doctors.find((d) => d.doctorCode === otFields.anaesthetistId);
          const anaesthetistName = matchedAnaesthetist
            ? `Dr. ${matchedAnaesthetist.firstName} ${matchedAnaesthetist.lastName || ""}`.trim()
            : "";
          await receptionApi.createOtEntry({
            patientNo: form.patientNo,
            patientName: patName,
            ipNo: otFields.ipNo || null,
            procedureName: otFields.procedureName,
            procedureType: otFields.procedureType,
            startDateTime: otFields.startDateTime,
            endDateTime: otFields.endDateTime,
            surgeonId: otSurgeonCode || null,
            surgeonName: surgeonName || null,
            anaesthetistId: otFields.anaesthetistId || null,
            anaesthetistName: anaesthetistName || null,
            scrubNurse: otFields.scrubNurse || null,
            otRoomNo: otFields.otRoomNo || null,
            anaesthesiaType: otFields.anaesthesiaType,
            preOpDiagnosis: otFields.preOpDiagnosis || null,
            postOpDiagnosis: otFields.postOpDiagnosis || null,
            outcome: otFields.outcome,
            remarks: otFields.remarks || null,
          }, code);
          toast.success("OT surgery log recorded successfully.");
        } else if (form.type === "Consent") {
          const consentDoctorCode = consentFields.doctorId || form.doctorId;
          const matchedConsentDoc = doctors.find((d) => d.doctorCode === consentDoctorCode);
          const consentDoctorName = matchedConsentDoc
            ? `Dr. ${matchedConsentDoc.firstName} ${matchedConsentDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createConsentEntry({
            patientNo: form.patientNo,
            patientName: patName,
            ipOpNo: consentFields.ipOpNo || null,
            procedureName: consentFields.procedureName,
            consentType: consentFields.consentType,
            signedBy: consentFields.signedBy,
            guardianName: consentFields.guardianName || null,
            relationship: consentFields.relationship || null,
            doctorId: consentDoctorCode || null,
            doctorName: consentDoctorName || null,
            witnessName: consentFields.witnessName || null,
            consentDateTime: consentFields.consentDateTime,
            documentUrl: consentFields.documentUrl || null,
            remarks: consentFields.remarks || null,
          }, code);
          toast.success("Consent entry recorded successfully.");
        } else if (form.type === "Death") {
          const certifyingDocCode = deathFields.certifyingDoctorId || form.doctorId;
          const matchedDeathDoc = doctors.find((d) => d.doctorCode === certifyingDocCode);
          const certifyingDoctorName = matchedDeathDoc
            ? `Dr. ${matchedDeathDoc.firstName} ${matchedDeathDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createDeathEntry({
            patientNo: form.patientNo,
            patientName: patName,
            age: patAge,
            gender: patGender,
            ipNo: deathFields.ipNo || null,
            wardBed: deathFields.wardBed || null,
            deathDateTime: deathFields.deathDateTime,
            primaryCause: deathFields.primaryCause,
            secondaryCause: deathFields.secondaryCause || null,
            manner: deathFields.manner,
            certifyingDoctorId: certifyingDocCode || null,
            certifyingDoctorName: certifyingDoctorName || null,
            mlcLinked: deathFields.mlcLinked,
            mlcNo: deathFields.mlcLinked === "Yes" ? deathFields.mlcNo : null,
            handoverStatus: deathFields.handoverStatus,
            handoverToName: deathFields.handoverToName || null,
            handoverToRelationship: deathFields.handoverToRelationship || null,
            remarks: deathFields.remarks || null,
          }, code);
          toast.success("Death register entry recorded successfully.");
        } else if (form.type === "Birth") {
          const deliveringDocCode = birthFields.deliveringDoctorId || form.doctorId;
          const matchedDeliveringDoc = doctors.find((d) => d.doctorCode === deliveringDocCode);
          const deliveringDoctorName = matchedDeliveringDoc
            ? `Dr. ${matchedDeliveringDoc.firstName} ${matchedDeliveringDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createBirthEntry({
            babyName: birthFields.babyName,
            gender: birthFields.gender,
            birthDateTime: birthFields.birthDateTime,
            birthWeight: birthFields.birthWeight ? Number(birthFields.birthWeight) : null,
            deliveryType: birthFields.deliveryType,
            motherPatientNo: form.patientNo,
            motherName: patName,
            fatherName: birthFields.fatherName || null,
            fatherPhone: birthFields.fatherPhone || null,
            ward: birthFields.ward || null,
            bedNo: birthFields.bedNo || null,
            deliveringDoctorId: deliveringDocCode || null,
            deliveringDoctorName: deliveringDoctorName || null,
            apgarScore1min: birthFields.apgarScore1min ? Number(birthFields.apgarScore1min) : null,
            apgarScore5min: birthFields.apgarScore5min ? Number(birthFields.apgarScore5min) : null,
            remarks: birthFields.remarks || null,
          }, code);
          toast.success("Birth register entry recorded successfully.");
        } else if (form.type === "Free Patient") {
          const authDocCode = freePatientFields.authorisedById || form.doctorId;
          const matchedAuthDoc = doctors.find((d) => d.doctorCode === authDocCode);
          const authorisedByName = matchedAuthDoc
            ? `Dr. ${matchedAuthDoc.firstName} ${matchedAuthDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createFreePatientEntry({
            patientNo: form.patientNo,
            patientName: patName,
            ipOpNo: freePatientFields.ipOpNo || null,
            schemeName: freePatientFields.schemeName,
            servicesCovered: freePatientServices.join(","),
            authorisedById: authDocCode || null,
            authorisedByName: authorisedByName || null,
            approvalDate: freePatientFields.approvalDate,
            remarks: freePatientFields.remarks || null,
          }, code);
          toast.success("Free patient register entry recorded successfully.");
        } else if (form.type === "Discharge") {
          const dischargeDocCode = dischargeFields.treatingDoctorId || form.doctorId;
          const matchedDischargeDoc = doctors.find((d) => d.doctorCode === dischargeDocCode);
          const treatingDoctorName = matchedDischargeDoc
            ? `Dr. ${matchedDischargeDoc.firstName} ${matchedDischargeDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createDischargeEntry({
            ipNo: dischargeFields.ipNo,
            patientNo: form.patientNo,
            patientName: patName,
            admissionDate: dischargeFields.admissionDate,
            dischargeDateTime: dischargeFields.dischargeDateTime,
            treatingDoctorId: dischargeDocCode || null,
            treatingDoctorName: treatingDoctorName || null,
            wardBed: dischargeFields.wardBed || null,
            diagnosis: dischargeFields.diagnosis,
            procedureDone: dischargeFields.procedureDone || null,
            dischargeType: dischargeFields.dischargeType,
            followUpDate: dischargeFields.followUpDate || null,
            finalBillAmount: Number(dischargeFields.finalBillAmount) || 0,
            billSettled: dischargeFields.billSettled,
            remarks: dischargeFields.remarks || null,
          }, code);
          toast.success("Discharge register entry recorded successfully.");
        } else if (form.type === "3C") {
          const threeCDocCode = threeCFields.assignedDoctorId || form.doctorId;
          const matchedThreeCDoc = doctors.find((d) => d.doctorCode === threeCDocCode);
          const assignedDoctorName = matchedThreeCDoc
            ? `Dr. ${matchedThreeCDoc.firstName} ${matchedThreeCDoc.lastName || ""}`.trim()
            : "";
          await receptionApi.createThreeCEntry({
            caseType: threeCFields.caseType,
            patientNo: form.patientNo,
            patientName: patName,
            age: patAge,
            gender: patGender,
            arrivalDateTime: threeCFields.arrivalDateTime,
            triageLevel: threeCFields.triageLevel,
            chiefComplaint: threeCFields.chiefComplaint,
            assignedDoctorId: threeCDocCode || null,
            assignedDoctorName: assignedDoctorName || null,
            referredFrom: threeCFields.referredFrom || null,
            broughtBy: threeCFields.broughtBy,
            bp: threeCFields.bp || null,
            pulse: threeCFields.pulse ? Number(threeCFields.pulse) : null,
            temperature: threeCFields.temperature ? Number(threeCFields.temperature) : null,
            spo2: threeCFields.spo2 ? Number(threeCFields.spo2) : null,
            actionsTaken: threeCFields.actionsTaken || null,
            status: threeCFields.status || "Active",
            remarks: threeCFields.remarks || null,
          }, code);
          toast.success("3C Case entry recorded successfully.");
        } else if (form.type === "Insurance Bill") {
          await receptionApi.createInsuranceBillEntry({
            billNo: insuranceBillFields.billNo,
            patientNo: form.patientNo,
            patientName: patName,
            ipNo: insuranceBillFields.ipNo || null,
            insurerName: insuranceBillFields.insurerName,
            policyNumber: insuranceBillFields.policyNumber,
            tpaName: insuranceBillFields.tpaName || null,
            schemeType: insuranceBillFields.schemeType,
            claimAmount: Number(insuranceBillFields.claimAmount) || 0,
            approvedAmount: insuranceBillFields.approvedAmount ? Number(insuranceBillFields.approvedAmount) : null,
            balanceToPatient: insuranceBillFields.balanceToPatient ? Number(insuranceBillFields.balanceToPatient) : null,
            claimStatus: insuranceBillFields.claimStatus,
            submissionDate: insuranceBillFields.submissionDate,
            settlementDate: insuranceBillFields.settlementDate || null,
            remarks: insuranceBillFields.remarks || null,
          }, code);
          toast.success("Insurance claim entry recorded successfully.");
        }
      } catch (regErr: any) {
        console.error("Register entry creation failed:", regErr);
        toast.warning(`Appointment booked, but failed to create register record: ${regErr?.message || regErr}`);
      }
      
      // Auto-update dashboard filters to match the booked appointment so it shows up instantly!
      setFilterDate(form.date);
      setFilterDr(form.doctorId || "ALL");
      
      const isOPD = form.visitType === "OPD";
      const prefillData = {
        patientNo: form.patientNo,
        patientName: selectedPatient?.name || form.patientSearch || "Patient",
        doctorName: chosenDoc
          ? `Dr. ${chosenDoc.firstName} ${chosenDoc.lastName || ""}`.trim()
          : "Doctor",
        consultationFee: Number(form.dueAmount) || 0,
        billType: isOPD ? "OPD" : "IPD",
      };

      setForm(EMPTY_FORM);
      setErrors({});
      setDialogDeptId("");
      setRoomTypeFilter("All");
      setAddDialogOpen(false);
      loadAppointments();
      setRefreshTrigger(prev => prev + 1);

      sessionStorage.setItem("billing-prefill-appt", JSON.stringify(prefillData));
      if (isOPD) {
        navigate({ to: "/receptionist/opd-billing" });
      } else {
        navigate({ to: "/receptionist/billing" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkExamined(id: number, name: string) {
    try {
      await receptionApi.updateAppointmentStatus(id, "Completed", code);
      toast.success(`${name} marked as examined`);
      loadAppointments();
    } catch {
      toast.error("Failed to update status");
    }
  }

  function handleCancelAppt(id: number, name: string) {
    setApptToCancel({ id, name });
    setCancelConfirmOpen(true);
  }

  async function confirmCancelAppt() {
    if (!apptToCancel) return;
    try {
      await receptionApi.updateAppointmentStatus(
        apptToCancel.id,
        "Cancelled",
        code,
      );
      toast.info(`Appointment for ${apptToCancel.name} cancelled`);
      loadAppointments();
      setSelectedRow(null);
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelConfirmOpen(false);
      setApptToCancel(null);
    }
  }

  function handleDeleteAppt(id: number, name: string) {
    setApptToDelete({ id, name });
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteAppt() {
    if (!apptToDelete) return;
    try {
      await receptionApi.deleteAppointment(apptToDelete.id, code);
      toast.success(
        `Appointment for ${apptToDelete.name} deleted successfully`,
      );
      loadAppointments();
      setSelectedRow(null);
    } catch {
      toast.error("Failed to delete appointment");
    } finally {
      setDeleteConfirmOpen(false);
      setApptToDelete(null);
    }
  }

  function handleEditAppt(appt: AppointmentResponse) {
    const parsed = parseAppointmentNotes(appt.notes || "");
    setEditingAppt(appt);
    setEditForm({
      date: appt.appointmentDate || getLocalDateString(),
      timeSlot: appt.timeSlot || "",
      type: appt.appointmentType || "",
      notes: parsed.cleanNotes,
      visitType: (appt.visitType as "OPD" | "IPD") || "OPD",
      toDate: appt.toDate || "",
      status: appt.status || "Scheduled",
      roomId: "",
      floor: "",
      roomNumber: appt.roomNumber || parsed.roomNumber,
      bedNo: appt.bedNo || parsed.bedNo,
      roomType: appt.roomType || parsed.roomType,
      assignedNurse: appt.assignedNurse || parsed.assignedNurse,
      dueAmount: String(appt.dueAmount ?? 0),
      // Initialize discharge fields
      dischargeIpNo: `IP-${appt.patientNo}`,
      dischargeDiagnosis: "General Discharge",
      dischargeProcedureDone: "",
      dischargeType: "Normal",
      dischargeFinalBillAmount: appt.dueAmount || 0,
      dischargeBillSettled: (appt.dueAmount || 0) === 0 ? "Yes" : "No",
      dischargeRemarks: "",
      dischargeFollowUpDate: "",
    });
    setEditDialogOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppt) return;
    const isIPD = editForm.visitType === "IPD";
    const parsed = parseAppointmentNotes(editingAppt.notes || "");
    if (!editForm.date || (!isIPD && !editForm.timeSlot) || !editForm.type) {
      toast.error(isIPD ? "Date and type are required" : "Date, time slot and type are required");
      return;
    }

    if (
      !isIPD &&
      editDialogAppointments.some(
        (appt) => appt.timeSlot === editForm.timeSlot && appt.id !== editingAppt.id
      )
    ) {
      toast.error("This slot is already booked for the selected doctor and date");
      return;
    }

    if (isIPD && editForm.status === "Discharged") {
      if (!editForm.toDate) {
        toast.error("To Date (Discharge Date) is required when status is Discharged");
        return;
      }
      const admissionStr = editForm.date.split("T")[0];
      const dischargeStr = editForm.toDate.split("T")[0];
      const admission = new Date(admissionStr);
      const discharge = new Date(dischargeStr);
      const diffTime = discharge.getTime() - admission.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        toast.error("IPD patient stay cannot be negative.");
        return;
      }
    }
    setEditSubmitting(true);
    try {
      let notesStr = editForm.notes || "";
      let prefix = `[${editForm.visitType}]`;
      if (isIPD && editForm.roomNumber && editForm.bedNo) {
        prefix += ` [Room: ${editForm.roomNumber} | Bed: ${editForm.bedNo} | Type: ${editForm.roomType || "General"}]`;
      } else if (isIPD && editForm.roomNumber) {
        prefix += ` [Room: ${editForm.roomNumber} | Type: ${editForm.roomType || "General"}]`;
      }
      if (isIPD && editForm.assignedNurse) {
        prefix += ` [Nurse: ${editForm.assignedNurse}]`;
      }
      const notesWithVisit = notesStr ? `${prefix} ${notesStr}` : prefix;

      await receptionApi.updateAppointment(
        editingAppt.id,
        {
          patientNo: editingAppt.patientNo,
          doctorId: editingAppt.doctorId,
          appointmentDate: editForm.date,
          timeSlot: isIPD
            ? (editingAppt?.timeSlot && editingAppt.timeSlot.startsWith("IPD-")
                ? editingAppt.timeSlot
                : `IPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`)
            : editForm.timeSlot,
          appointmentType: editForm.type,
          visitType: editForm.visitType,
          toDate: isIPD && editForm.toDate ? editForm.toDate : null,
          status: editForm.status,
          notes: notesWithVisit,
          roomNumber: isIPD ? editForm.roomNumber : null,
          bedNo: isIPD ? editForm.bedNo : null,
          roomType: isIPD ? editForm.roomType : null,
          assignedNurse: isIPD ? editForm.assignedNurse : null,
          dueAmount: Number(editForm.dueAmount) || 0,
        },
        code,
      );

      if (isIPD && editForm.status === "Discharged") {
        const dischargeDocCode = editingAppt.doctorId;
        const matchedDischargeDoc = doctors.find((d) => d.doctorCode === dischargeDocCode);
        const treatingDoctorName = matchedDischargeDoc
          ? `Dr. ${matchedDischargeDoc.firstName} ${matchedDischargeDoc.lastName || ""}`.trim()
          : (editingAppt.doctorName || "");

        const roomVal = editForm.roomNumber || parsed.roomNumber;
        const bedVal = editForm.bedNo || parsed.bedNo;
        const typeVal = editForm.roomType || parsed.roomType;
        const nurseVal = editForm.assignedNurse || parsed.assignedNurse;

        const wardBedStr = roomVal 
          ? `Room: ${roomVal}${bedVal ? ` / Bed: ${bedVal}` : ""}${typeVal ? ` (${typeVal})` : ""}${nurseVal ? ` · Nurse: ${nurseVal}` : ""}`
          : "";

        await receptionApi.createDischargeEntry({
          ipNo: editForm.dischargeIpNo,
          patientNo: editingAppt.patientNo,
          patientName: editingAppt.patientName,
          admissionDate: editForm.date,
          dischargeDateTime: editForm.toDate + "T12:00",
          treatingDoctorId: dischargeDocCode || null,
          treatingDoctorName: treatingDoctorName || null,
          wardBed: wardBedStr || null,
          diagnosis: editForm.dischargeDiagnosis,
          procedureDone: editForm.dischargeProcedureDone || null,
          dischargeType: editForm.dischargeType,
          followUpDate: editForm.dischargeFollowUpDate || null,
          finalBillAmount: Number(editForm.dischargeFinalBillAmount) || 0,
          billSettled: editForm.dischargeBillSettled,
          remarks: editForm.dischargeRemarks || null,
        }, code);
      }

      toast.success(`Appointment for ${editingAppt.patientName} updated`);
      setEditDialogOpen(false);
      setEditingAppt(null);
      loadAppointments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update appointment");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handlePrintAppt(appt: AppointmentResponse) {
    const parsed = parseAppointmentNotes(appt.notes || "");
    let patientDetails: PatientResponse | null = null;
    const loadingToast = toast.loading(
      `Fetching details for ${appt.patientName}...`,
    );
    try {
      patientDetails = await receptionApi.getPatient(appt.patientNo, code);
    } catch (err) {
      console.error("Failed to fetch patient details:", err);
    } finally {
      toast.dismiss(loadingToast);
    }

    let currentHospital = hospitalInfo;
    if (!currentHospital) {
      try {
        currentHospital = await apiFetch<any>(
          `/super-admin/hospitals/code/${code}`,
        );
        setHospitalInfo(currentHospital);
      } catch (err) {
        console.error("Failed to fetch hospital details:", err);
      }
    }

    // Resolve consulting doctor's full name from admin-service
    let consultingDoctor = appt.doctorName || "—";
    try {
      const docs = await apiFetch<any>("/admin/doctors", {
        params: { page: 0, size: 1000 },
        headers: { "X-Hospital-Code": code },
      });
      const docsList = Array.isArray(docs) ? docs : docs.content || [];
      const match = docsList.find((d: any) => {
        const docFullName = `Dr. ${d.firstName} ${d.lastName || ""}`.trim().toLowerCase();
        const docLower = consultingDoctor.toLowerCase();
        return docFullName.includes(docLower) || docLower.includes(d.firstName.toLowerCase()) || docLower.includes(d.lastName?.toLowerCase() || "_none_");
      });
      if (match) {
        consultingDoctor = `Dr. ${match.firstName} ${match.lastName || ""}`.trim();
      }
    } catch (e) {
      console.warn("Could not resolve consulting doctor full name", e);
    }

    let hospitalName = currentHospital?.hospitalName || "Apollo Hospital Bangalore";
    if (hospitalName === "Charlie General Hospital") {
      hospitalName = "Apollo Hospital Bangalore";
    }

    // Helper to filter out placeholder values like "unknown", "unknownUNKNOWN", "null", "n/a", etc.
    const cleanVal = (val: any): string => {
      if (val === undefined || val === null) return "";
      const s = String(val).trim();
      if (/^(unknown|unknownunknown|null|na|n\/a|—|-)$/i.test(s)) {
        return "";
      }
      return s;
    };

    const regNo = cleanVal(currentHospital?.registrationNumber);
    const hAddr = cleanVal(currentHospital?.address);
    const hPhone = cleanVal(currentHospital?.phone);
    const hEmail = cleanVal(currentHospital?.email);

    const pAge = cleanVal(patientDetails?.age);
    const pGender = cleanVal(patientDetails?.gender);
    const pMobile = cleanVal(patientDetails?.alternativeNum || patientDetails?.phone);
    const pBlood = cleanVal(patientDetails?.bloodGroup);
    const pAadhar = cleanVal(patientDetails?.aadhar);
    const pAddr = cleanVal(patientDetails?.address);

    const html = `
      <html><head><title>Appointment Slip - ${appt.patientName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; padding: 20px; color: #333; line-height: 1.6; }
        .ticket { max-width: 450px; margin: 0 auto; border: 1px dashed #bbb; padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 16px; margin-bottom: 16px; }
        .hospital-name { margin: 0; font-size: 20px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; }
        .hospital-meta { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.4; }
        .slip-title { font-size: 13px; font-weight: 700; color: #4f46e5; margin-top: 12px; letter-spacing: 2px; text-transform: uppercase; }
        
        .token-box { text-align: center; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; margin: 18px 0; }
        .token-label { font-size: 10px; text-transform: uppercase; color: #4b5563; font-weight: 700; letter-spacing: 1px; }
        .token-num { font-size: 36px; font-weight: 900; color: #1f2937; line-height: 1; margin-top: 4px; }
        
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 16px 0 8px 0; letter-spacing: 0.5px; }
        
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { display: flex; flex-direction: column; }
        .field.full { grid-column: span 2; }
        .label { color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 600; }
        .val { font-weight: 700; color: #1f2937; font-size: 12.5px; }
        
        .footer { text-align: center; border-top: 2px dashed #eee; padding-top: 16px; margin-top: 20px; font-size: 11px; color: #6b7280; font-weight: 500; }
        .footer-time { font-size: 9px; color: #9ca3af; margin-top: 8px; }
        
        @media print { 
          body { padding: 0; background: none; } 
          .ticket { border: none; padding: 0; box-shadow: none; max-width: 100%; }
        }
      </style></head><body>
      <div class="ticket">
        <div class="header">
          <h2 class="hospital-name">${hospitalName}</h2>
          <div class="hospital-meta">
            ${regNo ? `Reg No: ${regNo} <br>` : ""}
            ${hAddr ? `${hAddr} <br>` : ""}
            ${hPhone ? `Phone: ${hPhone}` : ""} 
            ${hEmail ? ` | Email: ${hEmail}` : ""}
          </div>
          <div class="slip-title">Appointment Slip</div>
        </div>
        
        <div class="token-box">
          <div class="token-label">Queue Token</div>
          <div class="token-num">#${appt.tokenNo}</div>
        </div>

        <div class="section-title">Patient Details</div>
        <div class="grid">
          <div class="field">
            <span class="label">Patient Name</span>
            <span class="val">${patientDetails?.name || appt.patientName}</span>
          </div>
          <div class="field">
            <span class="label">Patient No</span>
            <span class="val">${appt.patientNo}</span>
          </div>
          ${
            pAge || pGender
              ? `
          <div class="field">
            <span class="label">Age / Gender</span>
            <span class="val">${[pAge ? `${pAge} Yrs` : "", pGender].filter(Boolean).join(" / ")}</span>
          </div>`
              : ""
          }
          ${
            pMobile
              ? `
          <div class="field">
            <span class="label">Contact</span>
            <span class="val">${pMobile}</span>
          </div>`
              : ""
          }
          ${
            pBlood
              ? `
          <div class="field">
            <span class="label">Blood Group</span>
            <span class="val">${pBlood}</span>
          </div>`
              : ""
          }
          ${
            pAadhar
              ? `
          <div class="field">
            <span class="label">Aadhar Card</span>
            <span class="val">${pAadhar}</span>
          </div>`
              : ""
          }
          ${
            pAddr
              ? `
          <div class="field full">
            <span class="label">Address</span>
            <span class="val">${pAddr}</span>
          </div>`
              : ""
          }
        </div>

        <div class="section-title">Appointment Details</div>
        <div class="grid">
          <div class="field">
            <span class="label">Consulting Doctor</span>
            <span class="val">${consultingDoctor}</span>
          </div>
          <div class="field">
            <span class="label">Department</span>
            <span class="val">${appt.appointmentType || "General"}</span>
          </div>
          <div class="field">
            <span class="label">Date</span>
            <span class="val">${appt.appointmentDate}</span>
          </div>
          <div class="field">
            <span class="label">Time Slot</span>
            <span class="val">${appt.visitType === "IPD" ? "IPD (Admission)" : appt.timeSlot}</span>
          </div>
          <div class="field">
            <span class="label">Payment Status</span>
            <span class="val" style="color: ${appt.billStatus === "Paid" ? "#10b981" : "#f59e0b"};">${appt.billStatus || "Pending"}</span>
          </div>
          ${
            appt.dueAmount && appt.dueAmount > 0
              ? `
          <div class="field">
            <span class="label" style="color: #dc2626;">Due Balance</span>
            <span class="val" style="color: #dc2626;">₹${appt.dueAmount}</span>
          </div>`
              : ""
          }
          ${
            parsed.roomNumber
              ? `
          <div class="field">
            <span class="label">Room Number</span>
            <span class="val">${parsed.roomNumber}</span>
          </div>`
              : ""
          }
          ${
            parsed.bedNo
              ? `
          <div class="field">
            <span class="label">Bed Number</span>
            <span class="val">${parsed.bedNo}</span>
          </div>`
              : ""
          }
          ${
            parsed.assignedNurse
              ? `
          <div class="field full">
            <span class="label">Assigned Nurse</span>
            <span class="val" style="color: #10b981;">${parsed.assignedNurse}</span>
          </div>`
              : ""
          }
          ${
            parsed.cleanNotes
              ? `
          <div class="field full">
            <span class="label">Patient Notes</span>
            <span class="val" style="font-weight: normal; color: #4b5563;">${parsed.cleanNotes}</span>
          </div>`
              : ""
          }
        </div>

        <div class="footer">
          Important Note: Please report 15 minutes before your time slot.<br>
          Please show this slip at the reception/OPD counter.
          <div class="footer-time">Printed on: ${new Date().toLocaleString()}</div>
        </div>
      </div>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return toast.error("Pop-up blocked — allow pop-ups to print");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const selectedAppt = appointments.find((a) => a.id === selectedRow);
  const isSelectedApptEnded = selectedAppt
    ? selectedAppt.status === "Cancelled" || selectedAppt.status === "Completed"
    : false;



  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
        data-ocid="appointments.page"
      >
        {/* ── Header ── */}
        <div className="flex-none flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Appointments Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage patient appointments and OPD queue
              </p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={loadAppointments}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingAppts ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh list</TooltipContent>
          </Tooltip>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex-none glass-elevated rounded-xl border border-border shadow-glass-sm overflow-hidden">
          {/* Row 1: Primary + Record actions */}
          <div className="flex flex-wrap gap-1.5 p-2 border-b border-border/50">
            <span className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 self-center select-none">
              Actions
            </span>
            <div className="w-px h-6 bg-border/50 self-center mx-1" />

            {/* Add Appointment Dialog */}
            <Dialog
              open={addDialogOpen}
              onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (open) {
                  initializeRegisterFields();
                } else {
                  setForm(EMPTY_FORM);
                  setErrors({});
                  setDialogDeptId("");
                  setRoomTypeFilter("All");
                  resetRegisterFields();
                }
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-semibold">
                        Add Appointment
                      </span>
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[11px]">
                  Book a new appointment
                </TooltipContent>
              </Tooltip>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Book New Appointment
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                  {/* OPD / IPD Toggle */}
                  <div>
                    <Label className="text-sm font-semibold">Visit Type <span className="text-destructive">*</span></Label>
                    <div className="mt-2 flex rounded-xl overflow-hidden border border-border bg-muted/30 p-1 gap-1">
                      {(["OPD", "IPD"] as const).map((vt) => (
                        <button
                          key={vt}
                          type="button"
                          onClick={() => {
                            setForm((prev) => {
                              const chosenDoc = doctors.find((d) => d.doctorCode === prev.doctorId);
                              const fee = vt === "OPD" ? (chosenDoc?.consultationFee ?? 0) : 0;
                              return {
                                ...prev,
                                visitType: vt,
                                type: "",
                                dueAmount: String(fee),
                              };
                            });
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            form.visitType === vt
                              ? vt === "OPD"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-amber-500 text-white shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          }`}
                        >
                          {vt === "OPD" ? (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              OPD
                              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${
                                form.visitType === "OPD" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}>Out-Patient</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                              IPD
                              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${
                                form.visitType === "IPD" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                              }`}>In-Patient</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient Search */}
                  <div className="relative" ref={suggRef}>
                    <Label className="text-sm font-semibold">
                      Patient <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Type patient name or ID…"
                        value={form.patientSearch}
                        onChange={(e) => {
                          setField("patientSearch", e.target.value);
                          setField("patientNo", "");
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className={`pl-9 ${errors.patientNo ? "border-destructive" : ""}`}
                        autoComplete="off"
                      />
                    </div>
                    {errors.patientNo && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> {errors.patientNo}
                      </p>
                    )}
                    {showSuggestions &&
                      form.patientSearch.trim().length > 0 && (
                        <div className="absolute z-50 w-full mt-1 glass-elevated rounded-lg border shadow-glass max-h-56 overflow-y-auto">
                          {filteredPatients.length > 0 ? (
                            <>
                              {filteredPatients.map((p) => (
                                <button
                                  key={p.patientNo}
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 hover:bg-muted/30 flex justify-between items-center gap-2 transition-colors border-b border-border/20 last:border-b-0"
                                  onClick={() =>
                                    selectPatient(p.patientNo, p.name)
                                  }
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {p.name}
                                    </span>
                                    {(p.alternativeNum || p.phone) && (
                                      <span className="text-[10px] text-muted-foreground">
                                        📞 {p.alternativeNum || p.phone}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                                    {p.patientNo}
                                  </span>
                                </button>
                              ))}
                              <button
                                type="button"
                                className="w-full text-left px-4 py-2.5 hover:bg-primary/10 text-primary hover:text-primary/95 flex items-center gap-2 border-t border-border font-semibold text-xs transition-colors"
                                onClick={() => {
                                  setShowSuggestions(false);
                                  sessionStorage.setItem(
                                    "register-prefill-name",
                                    form.patientSearch,
                                  );
                                  navigate({ to: "/receptionist/register" });
                                }}
                              >
                                <UserPlus className="w-4 h-4" />
                                Not found? Register "{form.patientSearch}" as
                                New Patient
                              </button>
                            </>
                          ) : (
                            <div className="p-3">
                              <p className="text-xs text-muted-foreground text-center mb-2">
                                No registered patients found matching "
                                {form.patientSearch}"
                              </p>
                              <button
                                type="button"
                                className="w-full text-center px-4 py-2 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/20 rounded-md font-semibold text-xs transition-all duration-200"
                                onClick={() => {
                                  setShowSuggestions(false);
                                  sessionStorage.setItem(
                                    "register-prefill-name",
                                    form.patientSearch,
                                  );
                                  navigate({ to: "/receptionist/register" });
                                }}
                              >
                                + Register "{form.patientSearch}" as New Patient
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {selectedPatient && (
                    <div className="p-3 bg-primary/8 border border-primary/20 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {selectedPatient.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {selectedPatient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPatient.patientNo} · {selectedPatient.age}y ·{" "}
                          {selectedPatient.gender}
                        </p>
                      </div>
                      {selectedPatient.bloodGroup && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-primary border-primary/30"
                        >
                          {selectedPatient.bloodGroup}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Department + Doctor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">
                        Department <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={dialogDeptId}
                        onValueChange={(v) => {
                          setDialogDeptId(v);
                          setField("doctorId", "");
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">
                        Doctor <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.doctorId}
                        onValueChange={(v) => {
                          setForm((prev) => {
                            const chosenDoc = doctors.find((d) => d.doctorCode === v);
                            const fee = prev.visitType === "OPD" ? (chosenDoc?.consultationFee ?? 0) : 0;
                            if (chosenDoc?.departmentId) {
                              setDialogDeptId(String(chosenDoc.departmentId));
                            }
                            return {
                              ...prev,
                              doctorId: v,
                              dueAmount: String(fee),
                            };
                          });
                        }}
                      >
                        <SelectTrigger
                          className={`mt-1 ${errors.doctorId ? "border-destructive" : ""}`}
                        >
                          <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {(dialogDeptId
                            ? doctors.filter(
                                (doc) =>
                                  doc.departmentId === Number(dialogDeptId) &&
                                  doc.isActive !== false,
                              )
                            : doctors.filter((doc) => doc.isActive !== false)
                          ).map((doc) => {
                              const rawName =
                                doc.name ||
                                [doc.firstName, doc.lastName]
                                  .filter(Boolean)
                                  .join(" ") ||
                                doc.doctorCode;
                              const name = rawName
                                .toLowerCase()
                                .startsWith("dr.")
                                ? rawName
                                : `Dr. ${rawName}`;
                              return (
                                <SelectItem
                                  key={doc.doctorCode}
                                  value={doc.doctorCode}
                                >
                                  {name}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      {errors.doctorId && (
                        <p className="text-[11px] text-destructive mt-1">
                          {errors.doctorId}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">
                        {form.visitType === "IPD" ? "From Date (Admission)" : "Date"} <span className="text-destructive">*</span>
                      </Label>
                      <div className="mt-1">
                        <DateTimePicker
                          type="date"
                          value={form.date}
                          onChange={(v) => setField("date", v)}
                          placeholder="Pick a date"
                          className={`w-full ${errors.date ? "border-destructive ring-1 ring-destructive/40" : ""}`}
                        />
                      </div>
                      {errors.date && (
                        <p className="text-[11px] text-destructive mt-1">
                          {errors.date}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">
                        {form.visitType === "OPD" ? "Consultation Fee (₹)" : "Admission Fee (₹)"}
                      </Label>
                      <div className="mt-1">
                        <Input
                          type="number"
                          value={form.dueAmount}
                          onChange={(e) => setField("dueAmount", e.target.value)}
                          placeholder="Enter fee amount"
                          className="w-full text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  {form.visitType !== "IPD" && (
                    <div>
                      <Label className="text-sm font-semibold">
                        Time Slot <span className="text-destructive">*</span>
                      </Label>
                      <div className="mt-2 space-y-2">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                          Morning
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {MORNING_SLOTS.map((slot) => {
                            const isBooked = dialogAppointments.some((a) => a.timeSlot === slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isBooked}
                                onClick={() => setField("timeSlot", slot)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  form.timeSlot === slot
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : isBooked
                                      ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                          Afternoon
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {AFTERNOON_SLOTS.map((slot) => {
                            const isBooked = dialogAppointments.some((a) => a.timeSlot === slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isBooked}
                                onClick={() => setField("timeSlot", slot)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  form.timeSlot === slot
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : isBooked
                                      ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {errors.timeSlot && (
                        <p className="text-[11px] text-destructive mt-1">
                          {errors.timeSlot}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Type + Notes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">
                        {form.visitType === "OPD" ? "Visit Category" : "Register Type"} <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.type}
                        onValueChange={(v) => setField("type", v)}
                      >
                        <SelectTrigger className={`mt-1 ${errors.type ? "border-destructive" : ""}`}>
                          <SelectValue placeholder={form.visitType === "OPD" ? "Select visit category" : "Select register type"} />
                        </SelectTrigger>
                        <SelectContent>
                          {form.visitType === "OPD" ? (
                            <>
                              <SelectItem value="Consultation">Consultation</SelectItem>
                              <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                              <SelectItem value="Emergency">Emergency</SelectItem>
                              <SelectItem value="New Patient">New Patient</SelectItem>
                              <SelectItem value="Review">Review</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="MLC">MLC</SelectItem>
                              <SelectItem value="Maternity">Maternity</SelectItem>
                              <SelectItem value="OT">OT</SelectItem>
                              <SelectItem value="Consent">Consent</SelectItem>
                              <SelectItem value="Death">Death</SelectItem>
                              <SelectItem value="Birth">Birth</SelectItem>
                              <SelectItem value="Free Patient">Free Patient</SelectItem>
                              <SelectItem value="Discharge">Discharge</SelectItem>
                              <SelectItem value="3C">3C</SelectItem>
                              <SelectItem value="Insurance Bill">Insurance Bill</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-[11px] text-destructive mt-1">
                          {errors.type}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Notes</Label>
                      <Textarea
                        className="mt-1 h-[70px] resize-none text-xs"
                        value={form.notes}
                        onChange={(e) => setField("notes", e.target.value)}
                        placeholder="Optional notes…"
                      />
                    </div>
                  </div>

                  {/* ── CONDITIONAL REGISTER PANELS ── */}
                  {form.type === "MLC" && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Medico-Legal Case (MLC) Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Injury Type *</Label>
                          <Select
                            value={mlcFields.injuryType}
                            onValueChange={(v) => setMlcFields((p) => ({ ...p, injuryType: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Road Accident">Road Accident</SelectItem>
                              <SelectItem value="Assault">Assault</SelectItem>
                              <SelectItem value="Poisoning">Poisoning</SelectItem>
                              <SelectItem value="Burns">Burns</SelectItem>
                              <SelectItem value="Other">Other Injuries</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Brought By *</Label>
                          <Select
                            value={mlcFields.broughtBy}
                            onValueChange={(v) => setMlcFields((p) => ({ ...p, broughtBy: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Brought By" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Police">Police</SelectItem>
                              <SelectItem value="Ambulance">Ambulance (EMS)</SelectItem>
                              <SelectItem value="Self">Self / Walk-in</SelectItem>
                              <SelectItem value="Relative">Relative / Friend</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Police Station Name</Label>
                          <Input
                            placeholder="Jurisdiction PS"
                            value={mlcFields.policeStationName}
                            onChange={(e) => setMlcFields((p) => ({ ...p, policeStationName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">FIR Number</Label>
                          <Input
                            placeholder="FIR details"
                            value={mlcFields.firNumber}
                            onChange={(e) => setMlcFields((p) => ({ ...p, firNumber: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Informing Doctor</Label>
                          <Input
                            placeholder="Dr. Name"
                            value={mlcFields.informingDoctor}
                            onChange={(e) => setMlcFields((p) => ({ ...p, informingDoctor: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Clinical Remarks / Description</Label>
                          <Textarea
                            placeholder="Description of injuries & patient condition..."
                            value={mlcFields.remarks}
                            onChange={(e) => setMlcFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-16 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Maternity" && (
                    <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                        <span className="text-sm font-bold text-pink-700 dark:text-pink-400">Maternity (ANC/Obstetrics) Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">IP/OP Number</Label>
                          <Input
                            placeholder="Case No."
                            value={maternityFields.ipOpNo}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, ipOpNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">LMP Date *</Label>
                          <Input
                            type="date"
                            value={maternityFields.lmpDate}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, lmpDate: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-pink-600">EDD by LMP (Auto-calculated)</Label>
                          <Input
                            readOnly
                            type="date"
                            value={maternityFields.eddByLmp}
                            className="mt-1 h-8 text-xs font-bold text-pink-600 bg-zinc-50 border-pink-200 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">EDD by USG</Label>
                          <Input
                            type="date"
                            value={maternityFields.eddByUsg}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, eddByUsg: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 bg-pink-500/10 p-2 rounded-lg border border-pink-200/50">
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-pink-700">Gravida (G)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={maternityFields.gravida}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, gravida: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-pink-700">Para (P)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={maternityFields.para}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, para: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-pink-700">Living (L)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={maternityFields.living}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, living: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-pink-700">Abortion (A)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={maternityFields.abortion}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, abortion: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            className="mt-0.5 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Ward Room &amp; Bed Allocated</Label>
                          <Input
                            placeholder="e.g. Bed 102"
                            value={maternityFields.wardBed}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, wardBed: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ANC Case Status *</Label>
                          <Select
                            value={maternityFields.status}
                            onValueChange={(v) => setMaternityFields((p) => ({ ...p, status: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active Case</SelectItem>
                              <SelectItem value="Delivered">Delivered</SelectItem>
                              <SelectItem value="Transferred">Transferred</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Remarks / Observations</Label>
                          <Textarea
                            placeholder="Additional medical notes..."
                            value={maternityFields.remarks}
                            onChange={(e) => setMaternityFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "OT" && (
                    <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        <span className="text-sm font-bold text-teal-700 dark:text-teal-400">Operation Theatre (OT) Booking Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Procedure Name *</Label>
                          <Input
                            list="procedure-names"
                            placeholder="Select or type procedure..."
                            value={otFields.procedureName}
                            onChange={(e) => setOtFields((p) => ({ ...p, procedureName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                          <datalist id="procedure-names">
                            <option value="Appendectomy" />
                            <option value="Caesarean Section" />
                            <option value="Hernia Repair" />
                            <option value="Cataract Surgery" />
                            <option value="Cholecystectomy" />
                            <option value="Knee Replacement" />
                            <option value="Hip Replacement" />
                            <option value="Tonsillectomy" />
                          </datalist>
                        </div>
                        <div>
                          <Label className="text-xs">OT Start Date &amp; Time *</Label>
                          <Input
                            type="datetime-local"
                            value={otFields.startDateTime}
                            onChange={(e) => setOtFields((p) => ({ ...p, startDateTime: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Surgeon *</Label>
                          <Select
                            value={otFields.surgeonId || form.doctorId}
                            onValueChange={(v) => setOtFields((p) => ({ ...p, surgeonId: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Select Surgeon" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctors.map((doc: any) => (
                                <SelectItem key={doc.doctorCode} value={doc.doctorCode}>
                                  Dr. {doc.firstName} {doc.lastName || ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Consent" && (
                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Consent Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">IP/OP Number</Label>
                          <Input
                            placeholder="In/Out Patient No."
                            value={consentFields.ipOpNo}
                            onChange={(e) => setConsentFields((p) => ({ ...p, ipOpNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Procedure Name *</Label>
                          <Input
                            placeholder="e.g. Caesarean Section"
                            value={consentFields.procedureName}
                            onChange={(e) => setConsentFields((p) => ({ ...p, procedureName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Consent Type *</Label>
                          <Input
                            placeholder="e.g. Surgical, High Risk"
                            value={consentFields.consentType}
                            onChange={(e) => setConsentFields((p) => ({ ...p, consentType: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Signed By *</Label>
                          <Input
                            placeholder="Patient, Spouse, Guardian"
                            value={consentFields.signedBy}
                            onChange={(e) => setConsentFields((p) => ({ ...p, signedBy: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Guardian / Spouse Name</Label>
                          <Input
                            placeholder="If signed by guardian"
                            value={consentFields.guardianName}
                            onChange={(e) => setConsentFields((p) => ({ ...p, guardianName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Relationship</Label>
                          <Input
                            placeholder="Husband, Father etc."
                            value={consentFields.relationship}
                            onChange={(e) => setConsentFields((p) => ({ ...p, relationship: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Witness Name</Label>
                          <Input
                            placeholder="Name of witness"
                            value={consentFields.witnessName}
                            onChange={(e) => setConsentFields((p) => ({ ...p, witnessName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Consent Date &amp; Time *</Label>
                          <Input
                            type="datetime-local"
                            value={consentFields.consentDateTime}
                            onChange={(e) => setConsentFields((p) => ({ ...p, consentDateTime: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Document URL</Label>
                          <Input
                            placeholder="Cloud storage link to scan..."
                            value={consentFields.documentUrl}
                            onChange={(e) => setConsentFields((p) => ({ ...p, documentUrl: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Remarks</Label>
                          <Textarea
                            placeholder="Additional notes..."
                            value={consentFields.remarks}
                            onChange={(e) => setConsentFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Death" && (
                    <div className="rounded-xl border border-slate-500/30 bg-slate-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-400">Death Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">IP Number</Label>
                          <Input
                            placeholder="In-Patient No."
                            value={deathFields.ipNo}
                            onChange={(e) => setDeathFields((p) => ({ ...p, ipNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Ward &amp; Bed Allocated</Label>
                          <Input
                            placeholder="e.g. ICU Bed 3"
                            value={deathFields.wardBed}
                            onChange={(e) => setDeathFields((p) => ({ ...p, wardBed: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Date &amp; Time of Death *</Label>
                          <Input
                            type="datetime-local"
                            value={deathFields.deathDateTime}
                            onChange={(e) => setDeathFields((p) => ({ ...p, deathDateTime: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Primary Cause of Death *</Label>
                          <Input
                            placeholder="Direct cause of demise"
                            value={deathFields.primaryCause}
                            onChange={(e) => setDeathFields((p) => ({ ...p, primaryCause: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Secondary Cause of Death</Label>
                          <Input
                            placeholder="Underlying conditions"
                            value={deathFields.secondaryCause}
                            onChange={(e) => setDeathFields((p) => ({ ...p, secondaryCause: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Manner of Death *</Label>
                          <Select
                            value={deathFields.manner}
                            onValueChange={(v) => setDeathFields((p) => ({ ...p, manner: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Natural">Natural</SelectItem>
                              <SelectItem value="Accident">Accident</SelectItem>
                              <SelectItem value="Homicide">Homicide</SelectItem>
                              <SelectItem value="Suicide">Suicide</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">MLC Linked?</Label>
                          <Select
                            value={deathFields.mlcLinked}
                            onValueChange={(v) => setDeathFields((p) => ({ ...p, mlcLinked: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">MLC Number (if linked)</Label>
                          <Input
                            placeholder="MLC register reference"
                            disabled={deathFields.mlcLinked !== "Yes"}
                            value={deathFields.mlcNo}
                            onChange={(e) => setDeathFields((p) => ({ ...p, mlcNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Handover Status *</Label>
                          <Select
                            value={deathFields.handoverStatus}
                            onValueChange={(v) => setDeathFields((p) => ({ ...p, handoverStatus: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Handed Over">Handed Over</SelectItem>
                              <SelectItem value="In Mortuary">In Mortuary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Handed Over To (Name)</Label>
                          <Input
                            placeholder="Receiver relative name"
                            value={deathFields.handoverToName}
                            onChange={(e) => setDeathFields((p) => ({ ...p, handoverToName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Relationship to Demised</Label>
                          <Input
                            placeholder="Son, Wife, Brother etc."
                            value={deathFields.handoverToRelationship}
                            onChange={(e) => setDeathFields((p) => ({ ...p, handoverToRelationship: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Remarks / Notes</Label>
                          <Textarea
                            placeholder="Clinical comments..."
                            value={deathFields.remarks}
                            onChange={(e) => setDeathFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Birth" && (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Baby Birth Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Baby Name *</Label>
                          <Input
                            placeholder="Baby of Mother"
                            value={birthFields.babyName}
                            onChange={(e) => setBirthFields((p) => ({ ...p, babyName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Baby Gender *</Label>
                          <Select
                            value={birthFields.gender}
                            onValueChange={(v) => setBirthFields((p) => ({ ...p, gender: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Birth Date &amp; Time *</Label>
                          <Input
                            type="datetime-local"
                            value={birthFields.birthDateTime}
                            onChange={(e) => setBirthFields((p) => ({ ...p, birthDateTime: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Birth Weight (kg)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 3.1"
                            value={birthFields.birthWeight}
                            onChange={(e) => setBirthFields((p) => ({ ...p, birthWeight: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Delivery Type *</Label>
                          <Select
                            value={birthFields.deliveryType}
                            onValueChange={(v) => setBirthFields((p) => ({ ...p, deliveryType: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="LSCS">LSCS</SelectItem>
                              <SelectItem value="Forceps">Forceps</SelectItem>
                              <SelectItem value="Vacuum">Vacuum</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Father Name</Label>
                          <Input
                            placeholder="Full name of father"
                            value={birthFields.fatherName}
                            onChange={(e) => setBirthFields((p) => ({ ...p, fatherName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Father Phone</Label>
                          <Input
                            placeholder="Contact number"
                            value={birthFields.fatherPhone}
                            onChange={(e) => setBirthFields((p) => ({ ...p, fatherPhone: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Ward allocated</Label>
                          <Input
                            placeholder="e.g. Ward A"
                            value={birthFields.ward}
                            onChange={(e) => setBirthFields((p) => ({ ...p, ward: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Bed No allocated</Label>
                          <Input
                            placeholder="e.g. Bed 10"
                            value={birthFields.bedNo}
                            onChange={(e) => setBirthFields((p) => ({ ...p, bedNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] font-bold">APGAR (1m)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              placeholder="0-10"
                              value={birthFields.apgarScore1min}
                              onChange={(e) => setBirthFields((p) => ({ ...p, apgarScore1min: e.target.value }))}
                              className="mt-1 h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold">APGAR (5m)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              placeholder="0-10"
                              value={birthFields.apgarScore5min}
                              onChange={(e) => setBirthFields((p) => ({ ...p, apgarScore5min: e.target.value }))}
                              className="mt-1 h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Remarks / Observations</Label>
                          <Textarea
                            placeholder="Pediatric observations..."
                            value={birthFields.remarks}
                            onChange={(e) => setBirthFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Free Patient" && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Free / Government Scheme Patient Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">IP/OP Number</Label>
                          <Input
                            placeholder="Identifier number"
                            value={freePatientFields.ipOpNo}
                            onChange={(e) => setFreePatientFields((p) => ({ ...p, ipOpNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Scheme / Sponsor Name *</Label>
                          <Input
                            placeholder="e.g. CGHS, PM-JAY"
                            value={freePatientFields.schemeName}
                            onChange={(e) => setFreePatientFields((p) => ({ ...p, schemeName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Services Covered *</Label>
                          <Input
                            placeholder="e.g. All Diagnostics, General Ward"
                            value={freePatientFields.servicesCovered}
                            onChange={(e) => setFreePatientFields((p) => ({ ...p, servicesCovered: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Scheme Approval Date *</Label>
                          <Input
                            type="date"
                            value={freePatientFields.approvalDate}
                            onChange={(e) => setFreePatientFields((p) => ({ ...p, approvalDate: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Scheme Remarks</Label>
                          <Textarea
                            placeholder="Accreditation details, card numbers..."
                            value={freePatientFields.remarks}
                            onChange={(e) => setFreePatientFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Discharge" && (
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Discharge Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">IP Number *</Label>
                          <Input
                            placeholder="In-Patient No."
                            value={dischargeFields.ipNo}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, ipNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Admission Date *</Label>
                          <Input
                            type="date"
                            value={dischargeFields.admissionDate}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, admissionDate: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Discharge Date &amp; Time *</Label>
                          <Input
                            type="datetime-local"
                            value={dischargeFields.dischargeDateTime}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, dischargeDateTime: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Ward Room &amp; Bed Allocated</Label>
                          <Input
                            placeholder="e.g. Ward B Bed 12"
                            value={dischargeFields.wardBed}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, wardBed: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Diagnosis / Illness *</Label>
                          <Input
                            placeholder="Medical diagnosis"
                            value={dischargeFields.diagnosis}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, diagnosis: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Procedures / Surgery Performed</Label>
                          <Input
                            placeholder="e.g. Appendectomy"
                            value={dischargeFields.procedureDone}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, procedureDone: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Discharge Type *</Label>
                          <Select
                            value={dischargeFields.dischargeType}
                            onValueChange={(v) => setDischargeFields((p) => ({ ...p, dischargeType: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="DAMA">DAMA</SelectItem>
                              <SelectItem value="LAMA">LAMA</SelectItem>
                              <SelectItem value="Referred">Referred</SelectItem>
                              <SelectItem value="Absconded">Absconded</SelectItem>
                              <SelectItem value="Death">Death</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Follow Up Date</Label>
                          <Input
                            type="date"
                            value={dischargeFields.followUpDate}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, followUpDate: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Final Bill Amount (₹) *</Label>
                          <Input
                            type="number"
                            placeholder="Final amount"
                            value={dischargeFields.finalBillAmount}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, finalBillAmount: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Bill Settled Status *</Label>
                          <Select
                            value={dischargeFields.billSettled}
                            onValueChange={(v) => setDischargeFields((p) => ({ ...p, billSettled: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Partial">Partial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Remarks / Instructions</Label>
                          <Textarea
                            placeholder="Post-discharge instructions, medications..."
                            value={dischargeFields.remarks}
                            onChange={(e) => setDischargeFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "3C" && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-sm font-bold text-rose-700 dark:text-rose-400">3C Register (Triage &amp; Critical Emergency) Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Case Type *</Label>
                          <Select
                            value={threeCFields.caseType}
                            onValueChange={(v) => setThreeCFields((p) => ({ ...p, caseType: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Triage">Triage</SelectItem>
                              <SelectItem value="Disaster">Disaster</SelectItem>
                              <SelectItem value="Medico-Legal">Medico-Legal</SelectItem>
                              <SelectItem value="General Emergency">General Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Arrival Date &amp; Time *</Label>
                          <Input
                            type="datetime-local"
                            value={threeCFields.arrivalDateTime}
                            onChange={(e) => setThreeCFields((p) => ({ ...p, arrivalDateTime: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Triage Level *</Label>
                          <Select
                            value={threeCFields.triageLevel}
                            onValueChange={(v) => setThreeCFields((p) => ({ ...p, triageLevel: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Red - Immediate">Red - Immediate</SelectItem>
                              <SelectItem value="Orange - Very Urgent">Orange - Very Urgent</SelectItem>
                              <SelectItem value="Yellow - Urgent">Yellow - Urgent</SelectItem>
                              <SelectItem value="Green - Standard">Green - Standard</SelectItem>
                              <SelectItem value="Blue - Non-Urgent">Blue - Non-Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Brought By *</Label>
                          <Input
                            placeholder="Relative, Ambulance crew etc."
                            value={threeCFields.broughtBy}
                            onChange={(e) => setThreeCFields((p) => ({ ...p, broughtBy: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Referred From</Label>
                          <Input
                            placeholder="Clinic, Hospital name..."
                            value={threeCFields.referredFrom}
                            onChange={(e) => setThreeCFields((p) => ({ ...p, referredFrom: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-4 col-span-2 gap-2 bg-rose-500/10 p-2 rounded-lg border border-rose-200/50">
                          <div>
                            <Label className="text-[10px] font-bold text-rose-700">BP (mmHg)</Label>
                            <Input
                              placeholder="120/80"
                              value={threeCFields.bp}
                              onChange={(e) => setThreeCFields((p) => ({ ...p, bp: e.target.value }))}
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold text-rose-700">Pulse (bpm)</Label>
                            <Input
                              type="number"
                              placeholder="72"
                              value={threeCFields.pulse}
                              onChange={(e) => setThreeCFields((p) => ({ ...p, pulse: e.target.value }))}
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold text-rose-700">Temp (°F)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="98.6"
                              value={threeCFields.temperature}
                              onChange={(e) => setThreeCFields((p) => ({ ...p, temperature: e.target.value }))}
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold text-rose-700 font-sans">SpO2 (%)</Label>
                            <Input
                              type="number"
                              placeholder="98"
                              value={threeCFields.spo2}
                              onChange={(e) => setThreeCFields((p) => ({ ...p, spo2: e.target.value }))}
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Chief Complaint *</Label>
                          <Textarea
                            placeholder="Accurate description of symptoms..."
                            value={threeCFields.chiefComplaint}
                            onChange={(e) => setThreeCFields((p) => ({ ...p, chiefComplaint: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Immediate Actions Taken</Label>
                          <Textarea
                            placeholder="Stabilisation procedures performed..."
                            value={threeCFields.actionsTaken}
                            onChange={(e) => setThreeCFields((p) => ({ ...p, actionsTaken: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Remarks</Label>
                          <Textarea
                            placeholder="Critical notes..."
                            value={threeCFields.remarks}
                            onChange={(e) => setThreeCFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.type === "Insurance Bill" && (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        <span className="text-sm font-bold text-violet-700 dark:text-violet-400">Insurance Bill Claims Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Bill Number *</Label>
                          <Input
                            placeholder="Pre-generated bill ID"
                            value={insuranceBillFields.billNo}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, billNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">IP Number</Label>
                          <Input
                            placeholder="In-Patient No. (if IPD)"
                            value={insuranceBillFields.ipNo}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, ipNo: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Insurer / TPA Name *</Label>
                          <Input
                            placeholder="e.g. Star Health, MediAssist"
                            value={insuranceBillFields.insurerName}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, insurerName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Policy Number *</Label>
                          <Input
                            placeholder="Insurance card policy no."
                            value={insuranceBillFields.policyNumber}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, policyNumber: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">TPA Coordinator Name</Label>
                          <Input
                            placeholder="TPA Liaison officer"
                            value={insuranceBillFields.tpaName}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, tpaName: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Scheme / Category Type *</Label>
                          <Input
                            placeholder="Corporate, Individual, Family"
                            value={insuranceBillFields.schemeType}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, schemeType: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Claim Amount (₹) *</Label>
                          <Input
                            type="number"
                            placeholder="Requested claim"
                            value={insuranceBillFields.claimAmount}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, claimAmount: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Approved Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Sanctioned amount"
                            value={insuranceBillFields.approvedAmount}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, approvedAmount: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Balance to Patient (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Copay or non-medical charge"
                            value={insuranceBillFields.balanceToPatient}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, balanceToPatient: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Claim Status *</Label>
                          <Select
                            value={insuranceBillFields.claimStatus}
                            onValueChange={(v) => setInsuranceBillFields((p) => ({ ...p, claimStatus: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Submitted">Submitted</SelectItem>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                              <SelectItem value="Query">Query</SelectItem>
                              <SelectItem value="Settled">Settled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Claim Submission Date *</Label>
                          <Input
                            type="date"
                            value={insuranceBillFields.submissionDate}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, submissionDate: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Claim Settlement Date</Label>
                          <Input
                            type="date"
                            value={insuranceBillFields.settlementDate}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, settlementDate: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Remarks</Label>
                          <Textarea
                            placeholder="Claim approvals, query logs..."
                            value={insuranceBillFields.remarks}
                            onChange={(e) => setInsuranceBillFields((p) => ({ ...p, remarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── IPD Room & Bed Allocation ── */}
                  {form.visitType === "IPD" && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            Room &amp; Bed Allocation
                          </span>
                          <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold border border-amber-500/20">
                            IPD Only
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={fetchAvailableRooms}
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingRooms ? "animate-spin" : ""}`} />
                          Refresh
                        </button>
                      </div>

                      {/* Cascading selectors: Ward -> Floor -> Room -> Bed */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Ward Selector */}
                        <div>
                          <Label className="text-xs font-semibold">Ward / Room Type</Label>
                          <Select
                            value={form.roomType || "unassigned"}
                            onValueChange={(v) => {
                              setForm((p) => ({
                                ...p,
                                roomType: v === "unassigned" ? "" : v,
                                floor: "",
                                roomId: "",
                                roomNumber: "",
                                bedNo: "",
                              }));
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                              <SelectValue placeholder="Select Ward" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Select Ward</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="Private">Private</SelectItem>
                              <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                              <SelectItem value="ICU">ICU</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Floor Selector */}
                        <div>
                          <Label className="text-xs font-semibold">Floor</Label>
                          <Select
                            value={form.floor || "unassigned"}
                            disabled={!form.roomType}
                            onValueChange={(v) => {
                              setForm((p) => ({
                                ...p,
                                floor: v === "unassigned" ? "" : v,
                                roomId: "",
                                roomNumber: "",
                                bedNo: "",
                              }));
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                              <SelectValue placeholder="Select Floor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Select Floor</SelectItem>
                              {form.roomType &&
                                Array.from(
                                  new Set(
                                    availableRooms
                                      .filter((r) => r.type === form.roomType)
                                      .map((r) => String(r.floor || "1"))
                                  )
                                )
                                  .sort()
                                  .map((fl) => (
                                    <SelectItem key={fl} value={fl}>
                                      Floor {fl}
                                    </SelectItem>
                                  ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Room Selector */}
                        <div>
                          <Label className="text-xs font-semibold">Room</Label>
                          <Select
                            value={form.roomId || "unassigned"}
                            disabled={!form.roomType || !form.floor}
                            onValueChange={(v) => {
                              if (v === "unassigned") {
                                setForm((p) => ({ ...p, roomId: "", roomNumber: "", bedNo: "" }));
                              } else {
                                const rm = availableRooms.find((r) => r.id === v);
                                if (rm) {
                                  setForm((p) => ({
                                    ...p,
                                    roomId: rm.id,
                                    roomNumber: rm.number,
                                    bedNo: "",
                                  }));
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                              <SelectValue placeholder="Select Room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Select Room</SelectItem>
                              {availableRooms
                                .filter((r) => r.type === form.roomType && String(r.floor || "1") === form.floor)
                                .map((rm) => (
                                  <SelectItem key={rm.id} value={rm.id}>
                                    Room {rm.number} ({rm.availableBeds} free)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bed Selector */}
                        <div>
                          <Label className="text-xs font-semibold">Bed</Label>
                          <Select
                            value={form.bedNo || "unassigned"}
                            disabled={!form.roomId || loadingBeds}
                            onValueChange={(v) => setForm((p) => ({ ...p, bedNo: v === "unassigned" ? "" : v }))}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                              <SelectValue placeholder={loadingBeds ? "Loading beds..." : "Select Bed"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Select Bed</SelectItem>
                              {[...beds]
                                .sort((a, b) => {
                                  const numA = parseInt((a.bedNumber.match(/-B?(\d+)$/i) || [])[1] || "0", 10);
                                  const numB = parseInt((b.bedNumber.match(/-B?(\d+)$/i) || [])[1] || "0", 10);
                                  return numA - numB;
                                })
                                .map((bed) => {
                                  const isTakenByInpatient = inpatients.some(ip => ip.status === "ADMITTED" && ip.bedNo === bed.bedNumber);
                                  const isTakenByAppointment = globalAppointments.some(a => a.bedNo === bed.bedNumber && !["Completed", "Cancelled", "Discharged"].includes(a.status));
                                  const isOccupied = bed.status === "OCCUPIED" || bed.status === "Occupied" || isTakenByInpatient || isTakenByAppointment;
                                  const isAvailable = (bed.status === "AVAILABLE" || bed.status === "Available") && !isOccupied;
                                  const bedNumMatch = bed.bedNumber.match(/-B?(\d+)$/i);
                                  const bedLabel = bedNumMatch ? `Bed ${bedNumMatch[1]}` : bed.bedNumber;
                                  return (
                                    <SelectItem
                                      key={bed.id}
                                      value={bed.bedNumber}
                                      disabled={!isAvailable}
                                      className={!isAvailable ? "opacity-40 cursor-not-allowed" : ""}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span
                                          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${isAvailable ? "bg-emerald-500" : isOccupied ? "bg-rose-500" : "bg-amber-400"}`}
                                        />
                                        <span className={`font-medium ${!isAvailable ? "text-muted-foreground line-through" : ""}`}>
                                          {bedLabel}
                                        </span>
                                        {isOccupied && (
                                          <span className="text-[10px] font-semibold text-rose-500 border border-rose-400/50 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                                            Occupied
                                          </span>
                                        )}
                                        {bed.status === "MAINTENANCE" && (
                                          <span className="text-[10px] font-semibold text-amber-500 border border-amber-400/50 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                                            Maintenance
                                          </span>
                                        )}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Assigned Nurse selection */}
                      <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Assigned Nurse
                          </Label>
                          {loadingNurses && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                        </div>
                        <Select
                          value={form.assignedNurse || "unassigned"}
                          onValueChange={(v) => setForm((p) => ({ ...p, assignedNurse: v === "unassigned" ? "" : v }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border">
                            <SelectValue placeholder="Select Nurse to Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">None / Unassigned</SelectItem>
                            {nurses.map((nurse) => (
                              <SelectItem key={nurse.email} value={nurse.name}>
                                {nurse.name} ({nurse.qualification || "RN"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="min-w-[110px]"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Booking…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                          Booking
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="w-px h-6 bg-border/50 self-center mx-1" />

            <TipBtn
              icon={Trash2}
              label="Delete"
              tooltip="Delete selected appointment"
              variant="outline"
              className="hover:text-destructive hover:border-destructive/50"
              onClick={async () => {
                const appt = appointments.find((a) => a.id === selectedRow);
                if (!appt) return toast.info("Select a row first");
                await handleDeleteAppt(appt.id, appt.patientName);
                setSelectedRow(null);
              }}
            />
            <TipBtn
              icon={XCircle}
              label="Cancel"
              tooltip="Cancel selected appointment"
              variant="outline"
              className="hover:text-destructive hover:border-destructive/50"
              disabled={!selectedRow || isSelectedApptEnded}
              onClick={async () => {
                const appt = appointments.find((a) => a.id === selectedRow);
                if (!appt) return toast.info("Select a row first");
                await handleCancelAppt(appt.id, appt.patientName);
                setSelectedRow(null);
              }}
            />
            <TipBtn
              icon={CheckSquare}
              label="Mark Examined"
              tooltip="Mark selected patient as examined"
              variant="outline"
              className="hover:text-emerald-600 hover:border-emerald-500/50"
              disabled={!selectedRow || isSelectedApptEnded}
              onClick={async () => {
                const appt = appointments.find((a) => a.id === selectedRow);
                if (!appt) return toast.info("Select a row first");
                await handleMarkExamined(appt.id, appt.patientName);
                setSelectedRow(null);
              }}
            />
            <TipBtn
              icon={ListChecks}
              label="Examined List"
              tooltip="View all examined patients for today"
              variant={showExaminedOnly ? "default" : "outline"}
              className={
                showExaminedOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : ""
              }
              onClick={() => setShowExaminedOnly(!showExaminedOnly)}
            />
            <TipBtn
              icon={Eye}
              label="View All"
              tooltip="View all appointments without filters"
              variant="outline"
              onClick={() => {
                setFilterDate("");
                setFilterDr("ALL");
                setFilterVisitType("ALL");
                setShowExaminedOnly(false);
              }}
            />
          </div>

          {/* Row 2: Utility actions */}
          <div className="flex flex-wrap gap-1.5 px-2 py-1.5 bg-muted/20">
            <span className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 self-center select-none">
              Utilities
            </span>
            <div className="w-px h-5 bg-border/50 self-center mx-1" />
            <TipBtn
              icon={Printer}
              label="Print"
              tooltip="Print appointment slip for selected patient"
              className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white hover:text-white border-none shadow-sm"
              onClick={() => {
                const appt = appointments.find((a) => a.id === selectedRow);
                if (!appt) return toast.info("Select a row first");
                handlePrintAppt(appt);
              }}
            />
            <TipBtn
              icon={MessageSquare}
              label="Send SMS"
              tooltip="Send SMS reminder to selected patient"
              variant="ghost"
            />
            <TipBtn
              icon={PhoneForwarded}
              label="WhatsApp"
              tooltip="Send WhatsApp message to patient"
              variant="ghost"
            />
          </div>
        </div>

        {/* ── Top Summary Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-none mb-1">
          {/* Card 1: Total */}
          <div className="glass-elevated rounded-xl p-3.5 border border-border shadow-glass-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/60">Total Appointments</p>
              <h3 className="text-lg font-bold text-foreground font-mono leading-none mt-1">{totalAppts}</h3>
            </div>
          </div>

          {/* Card 2: Examined */}
          <div className="glass-elevated rounded-xl p-3.5 border border-border shadow-glass-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Examined
              </div>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{examinedCnt}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: totalAppts > 0 ? `${(examinedCnt / totalAppts) * 100}%` : "0%" }}
              />
            </div>
          </div>

          {/* Card 3: Pending */}
          <div className="glass-elevated rounded-xl p-3.5 border border-border shadow-glass-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" /> Pending
              </div>
              <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">{pendingCnt}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: totalAppts > 0 ? `${(pendingCnt / totalAppts) * 100}%` : "0%" }}
              />
            </div>
          </div>

          {/* Card 4: Progress / Selected */}
          {selectedRow ? (
            (() => {
              const a = appointments.find((x) => x.id === selectedRow);
              if (!a) return null;
              return (
                <div className="glass-elevated rounded-xl p-3.5 border border-primary/40 bg-primary/5 shadow-glass-sm flex items-center justify-between gap-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary/5 rounded-full blur-lg"></div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">{a.patientName}</p>
                      <p className="text-[9px] text-muted-foreground truncate font-mono mt-0.5">
                        {a.patientNo} · Token #{a.tokenNo} · {a.timeSlot}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full flex-shrink-0"
                    onClick={() => setSelectedRow(null)}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })()
          ) : (
            <div className="glass-elevated rounded-xl p-3.5 border border-border shadow-glass-sm flex flex-col justify-between">
              <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                <span>Today's Progress</span>
                <span className="font-mono">{totalAppts > 0 ? Math.round((examinedCnt / totalAppts) * 100) : 0}%</span>
              </div>
              <Progress
                value={totalAppts > 0 ? (examinedCnt / totalAppts) * 100 : 0}
                className="h-1.5 mt-2"
              />
            </div>
          )}
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-h-0 glass-elevated rounded-xl border border-border shadow-glass-sm flex flex-col min-w-0 overflow-hidden">
            {/* Filter Bar */}
            <div className="flex-none p-3 border-b border-border bg-muted/20 flex flex-wrap gap-3 items-end">
              <Filter className="w-4 h-4 text-muted-foreground self-center flex-none" />
              <div className="space-y-1 flex-1 min-w-[130px]">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-[130px]">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </Label>
                <Select value={filterVisitType} onValueChange={setFilterVisitType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="OPD">OPD</SelectItem>
                    <SelectItem value="IPD">IPD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-[130px]">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Doctor
                </Label>
                <Select value={filterDr} onValueChange={setFilterDr}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Doctors</SelectItem>
                    {doctors.map((doc) => {
                      const rawName =
                        doc.name ||
                        [doc.firstName, doc.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        doc.doctorCode;
                      const name = rawName.toLowerCase().startsWith("dr.")
                        ? rawName
                        : `Dr. ${rawName}`;
                      return (
                        <SelectItem key={doc.doctorCode} value={doc.doctorCode}>
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="h-8 px-4 text-xs"
                onClick={loadAppointments}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" /> Find
              </Button>
            </div>

            {/* Count bar */}
            <div className="flex-none px-4 py-2 border-b border-border/50 flex items-center gap-4 text-xs text-muted-foreground bg-muted/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                {appointments.length} appointment
                {appointments.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {examinedCnt} examined
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {pendingCnt} pending
              </span>
            </div>

            {/* Split layout: Table on left, Right Panel on right */}
            <div className="flex-1 min-h-0 flex flex-row gap-4 p-4 overflow-hidden">
              {/* Table Container */}
              <div className="flex-1 overflow-auto border border-border rounded-xl bg-background">
              {loadingAppts ? (
                <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading appointments…</span>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur border-b border-border z-10">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground w-8">
                        #
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        Pat. No.
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        Patient Name
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        Type
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        Bill
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Time
                        </span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" /> Doctor
                        </span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground text-right">
                        Due (₹)
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground text-center">
                        Token
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground text-center">
                        Status
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground w-20 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedAppointments.slice(page * pageSize, (page + 1) * pageSize).map((apt, idx) => {
                      const isSelected = selectedRow === apt.id;
                      const isHovered = hoveredRow === apt.id;
                      const isExamined = apt.status === "Completed";
                      return (
                        // biome-ignore lint/a11y/useKeyWithClickEvents: Click selection for UI table row is mouse-exclusive
                        <tr
                          key={apt.id}
                          onClick={() =>
                            setSelectedRow(isSelected ? null : apt.id)
                          }
                          onMouseEnter={() => setHoveredRow(apt.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className={`cursor-pointer transition-colors duration-100 ${
                            isSelected
                              ? "bg-primary/10 border-l-2 border-l-primary"
                              : isHovered
                                ? "bg-muted/30"
                                : ""
                          }`}
                        >
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-primary/80 font-semibold">
                            {apt.patientNo}
                          </td>
                          <td className="px-3 py-2.5 font-semibold">
                            {apt.patientName}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {apt.appointmentDate}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {apt.appointmentType}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge
                              status={apt.billStatus || "Pending"}
                              visitType={apt.visitType || undefined}
                              onClick={() => {
                                const prefillData = {
                                  patientNo: apt.patientNo,
                                  patientName: apt.patientName,
                                  doctorName: getDocName(apt.doctorId, apt.doctorName || ""),
                                  consultationFee: apt.dueAmount || 0,
                                  billType: apt.visitType === "IPD" ? "IPD" : "OPD",
                                };
                                sessionStorage.setItem("billing-prefill-appt", JSON.stringify(prefillData));
                                navigate({ to: apt.visitType === "IPD" ? "/receptionist/billing" : "/receptionist/opd-billing" });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2.5 font-medium tabular-nums">
                            {apt.visitType === "IPD" ? (
                              <div className="flex flex-col gap-0.5">
                                {apt.status === "Admitted" && !apt.toDate ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{apt.appointmentDate} to Present</span>
                                ) : apt.toDate ? (
                                  <span className="text-muted-foreground">{apt.appointmentDate} to {apt.toDate}</span>
                                ) : (
                                  <span className="text-muted-foreground">{apt.appointmentDate}</span>
                                )}
                                {(() => {
                                  const parsed = parseAppointmentNotes(apt.notes || "");
                                  return (
                                    <span className="text-[10px] text-zinc-500 font-normal leading-tight">
                                      {parsed.roomNumber ? `Rm ${parsed.roomNumber}` : ""}
                                      {parsed.bedNo ? ` / Bed ${parsed.bedNo.includes("-B") ? parsed.bedNo.split("-B")[1] : parsed.bedNo}` : ""}
                                      {parsed.assignedNurse ? ` · Nurse: ${parsed.assignedNurse}` : ""}
                                    </span>
                                  );
                                })()}
                              </div>
                            ) : (
                              apt.timeSlot
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {getDocName(apt.doctorId, apt.doctorName)}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right font-mono font-semibold ${
                              (apt.dueAmount ?? 0) > 0
                                ? "text-rose-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {`₹${apt.dueAmount ?? 0}`}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-mono font-bold text-[11px]">
                              {apt.tokenNo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isExamined ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                                <Clock className="w-3 h-3" /> {apt.status}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <div
                              className={`flex items-center justify-center gap-1 transition-opacity duration-150 ${
                                isHovered || isSelected
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              {/* Edit button */}
                              {apt.status !== "Completed" &&
                                apt.status !== "Cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary/20 text-primary transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditAppt(apt);
                                        }}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-[10px]">
                                      Edit Appointment
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              {apt.status !== "Completed" &&
                                apt.status !== "Cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkExamined(
                                            apt.id,
                                            apt.patientName,
                                          );
                                        }}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="text-[10px]"
                                    >
                                      Mark Examined
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary/20 text-primary transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintAppt(apt);
                                    }}
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="text-[10px]"
                                >
                                  Print Slip
                                </TooltipContent>
                              </Tooltip>
                              {apt.status !== "Completed" &&
                                apt.status !== "Cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-rose-500/20 text-rose-500 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelAppt(
                                            apt.id,
                                            apt.patientName,
                                          );
                                        }}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="text-[10px]"
                                    >
                                      Cancel
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {displayedAppointments.length > 0 && (
                <div className="px-5 py-3 border-t border-border mt-auto">
<PaginationControl
                  currentPage={page}
                  totalPages={Math.ceil(displayedAppointments.length / pageSize)}
                  totalElements={displayedAppointments.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  
                />
</div>
              )}
              {!loadingAppts && displayedAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No appointments found</p>
                  <p className="text-xs mt-1 opacity-70">
                    Try changing the date or doctor filter
                  </p>
                </div>
              )}
            </div>

        </div>

      </div>
    </div>



      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] border border-border shadow-glass-lg rounded-2xl p-6 bg-background">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete the appointment for{" "}
              <span className="font-semibold text-foreground">
                {apptToDelete?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setApptToDelete(null);
              }}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAppt}
              className="h-9 text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] border border-border shadow-glass-lg rounded-2xl p-6 bg-background">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Confirm Cancellation
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to cancel the appointment for{" "}
              <span className="font-semibold text-foreground">
                {apptToCancel?.name}
              </span>
              ?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelConfirmOpen(false);
                setApptToCancel(null);
              }}
              className="h-9 text-xs"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelAppt}
              className="h-9 text-xs flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Confirm Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── Edit Appointment Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingAppt(null); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col border border-border shadow-glass-lg rounded-2xl p-0 bg-background overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/20 shrink-0">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              Edit Appointment
            </DialogTitle>
            {editingAppt && (
              <p className="text-xs text-muted-foreground mt-1">
                Patient:{" "}
                <span className="font-semibold text-foreground">
                  {editingAppt.patientName}
                </span>{" "}
                · Token{" "}
                <span className="font-mono font-bold text-primary">
                  {editingAppt.tokenNo}
                </span>
              </p>
            )}
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Date */}
              <div>
                <Label className="text-sm font-semibold">
                  {editForm.visitType === "IPD" ? "From Date (Admission)" : "Date"} <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1">
                  <DateTimePicker
                    type="date"
                    value={editForm.date}
                    onChange={(v) => setEditForm((p) => ({ ...p, date: v }))}
                    placeholder="Pick a date"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Time Slot */}
              {editForm.visitType !== "IPD" && (
                <div>
                  <Label className="text-sm font-semibold">
                    Time Slot <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-2 space-y-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                      Morning
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {MORNING_SLOTS.map((slot) => {
                        const isBooked = editDialogAppointments.some(
                          (a) => a.timeSlot === slot && a.id !== editingAppt?.id
                        );
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setEditForm((p) => ({ ...p, timeSlot: slot }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              editForm.timeSlot === slot
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : isBooked
                                  ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                      Afternoon
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {AFTERNOON_SLOTS.map((slot) => {
                        const isBooked = editDialogAppointments.some(
                          (a) => a.timeSlot === slot && a.id !== editingAppt?.id
                        );
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setEditForm((p) => ({ ...p, timeSlot: slot }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              editForm.timeSlot === slot
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : isBooked
                                  ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom time input */}
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="time"
                        value={editForm.timeSlot}
                        onChange={(e) => setEditForm((p) => ({ ...p, timeSlot: e.target.value }))}
                        className="h-7 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary"
                      />
                      <span className="text-[10px] text-muted-foreground">or pick a custom time</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status & To Date for IPD */}
              {editForm.visitType === "IPD" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(v) => {
                          setEditForm((p) => {
                            const newStatus = v;
                            const newToDate = newStatus === "Discharged" ? (p.toDate || getLocalDateString()) : "";
                            return { ...p, status: newStatus, toDate: newToDate };
                          });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Admitted">Admitted</SelectItem>
                          <SelectItem value="Discharged">Discharged</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">To Date (Discharge)</Label>
                      <div className="mt-1">
                        <DateTimePicker
                          type="date"
                          value={editForm.toDate}
                          onChange={(v) => setEditForm((p) => ({ ...p, toDate: v }))}
                          placeholder="Not Discharged"
                          disabled={editForm.status !== "Discharged"}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        IPD Room &amp; Bed Assignment
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Ward Selector */}
                      <div>
                        <Label className="text-xs font-semibold">Ward / Room Type</Label>
                        <Select
                          value={editForm.roomType || "unassigned"}
                          onValueChange={(v) => {
                            setEditForm((p) => ({
                              ...p,
                              roomType: v === "unassigned" ? "" : v,
                              floor: "",
                              roomId: "",
                              roomNumber: "",
                              bedNo: "",
                            }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                            <SelectValue placeholder="Select Ward Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">None / Unassigned</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Private">Private</SelectItem>
                            <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                            <SelectItem value="ICU">ICU</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Floor Selector */}
                      <div>
                        <Label className="text-xs font-semibold">Floor</Label>
                        <Select
                          value={editForm.floor || "unassigned"}
                          disabled={!editForm.roomType}
                          onValueChange={(v) => {
                            setEditForm((p) => ({
                              ...p,
                              floor: v === "unassigned" ? "" : v,
                              roomId: "",
                              roomNumber: "",
                              bedNo: "",
                            }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                            <SelectValue placeholder="Select Floor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">None / Unassigned</SelectItem>
                            {editForm.roomType &&
                              Array.from(
                                new Set(
                                  availableRooms
                                    .filter((r) => r.type === editForm.roomType)
                                    .map((r) => String(r.floor || "1"))
                                )
                              )
                                .sort()
                                .map((fl) => (
                                  <SelectItem key={fl} value={fl}>
                                    Floor {fl}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Room Selector */}
                      <div>
                        <Label className="text-xs font-semibold">Room Number</Label>
                        <Select
                          value={editForm.roomId || "unassigned"}
                          disabled={!editForm.roomType || !editForm.floor}
                          onValueChange={(roomIdVal) => {
                            if (roomIdVal === "unassigned") {
                              setEditForm((p) => ({ ...p, roomId: "", roomNumber: "", bedNo: "" }));
                            } else {
                              const room = availableRooms.find((r) => r.id === roomIdVal);
                              if (room) {
                                setEditForm((p) => ({
                                  ...p,
                                  roomId: room.id,
                                  roomNumber: room.number,
                                  bedNo: "",
                                }));
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                            <SelectValue placeholder="Select Room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">None / Unassigned</SelectItem>
                            {availableRooms
                              .filter((r) => r.type === editForm.roomType && String(r.floor || "1") === editForm.floor)
                              .map((room) => (
                                <SelectItem key={room.id} value={room.id}>
                                  Room {room.number} ({room.availableBeds} free)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bed Selector */}
                      <div>
                        <Label className="text-xs font-semibold">Bed Number</Label>
                        <Select
                          value={editForm.bedNo || "unassigned"}
                          disabled={!editForm.roomId || loadingEditBeds}
                          onValueChange={(bedNoVal) => {
                            setEditForm((p) => ({ ...p, bedNo: bedNoVal === "unassigned" ? "" : bedNoVal }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border mt-1">
                            <SelectValue placeholder={loadingEditBeds ? "Loading beds..." : "Select Bed"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">None / Unassigned</SelectItem>
                            {[...editBeds]
                              .sort((a, b) => {
                                const numA = parseInt((a.bedNumber.match(/-B?(\d+)$/i) || [])[1] || "0", 10);
                                const numB = parseInt((b.bedNumber.match(/-B?(\d+)$/i) || [])[1] || "0", 10);
                                return numA - numB;
                              })
                              .map((bed) => {
                                const isCurrentBed = bed.bedNumber === editForm.bedNo;
                                const isTakenByInpatient = inpatients.some(ip => ip.status === "ADMITTED" && ip.bedNo === bed.bedNumber);
                                const isTakenByAppointment = globalAppointments.some(a => a.bedNo === bed.bedNumber && !["Completed", "Cancelled", "Discharged"].includes(a.status) && a.id !== editingAppt?.id);
                                const isOccupied = bed.status === "OCCUPIED" || bed.status === "Occupied" || isTakenByInpatient || isTakenByAppointment;
                                const isAvailable = (bed.status === "AVAILABLE" || bed.status === "Available" || isCurrentBed) && (!isOccupied || isCurrentBed);
                                const canSelect = isAvailable || isCurrentBed;
                                const bedNumMatch = bed.bedNumber.match(/-B?(\d+)$/i);
                                const bedLabel = bedNumMatch ? `Bed ${bedNumMatch[1]}` : bed.bedNumber;
                                return (
                                  <SelectItem
                                    key={bed.id}
                                    value={bed.bedNumber}
                                    disabled={!canSelect}
                                    className={!canSelect ? "opacity-40 cursor-not-allowed" : ""}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${isAvailable ? "bg-emerald-500" : isOccupied ? "bg-rose-500" : "bg-amber-400"}`}
                                      />
                                      <span className={`font-medium ${!canSelect ? "text-muted-foreground line-through" : ""}`}>
                                        {bedLabel}
                                      </span>
                                      {isCurrentBed && (
                                        <span className="text-[10px] font-semibold text-primary border border-primary/40 bg-primary/10 px-1.5 py-0.5 rounded-full">
                                          Current
                                        </span>
                                      )}
                                      {isOccupied && !isCurrentBed && (
                                        <span className="text-[10px] font-semibold text-rose-500 border border-rose-400/50 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                                          Occupied
                                        </span>
                                      )}
                                      {bed.status === "MAINTENANCE" && (
                                        <span className="text-[10px] font-semibold text-amber-500 border border-amber-400/50 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                                          Maintenance
                                        </span>
                                      )}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Assigned Nurse
                        </Label>
                        {loadingNurses && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                      </div>
                      <Select
                        value={editForm.assignedNurse || "unassigned"}
                        onValueChange={(v) => setEditForm((p) => ({ ...p, assignedNurse: v === "unassigned" ? "" : v }))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background border-border">
                          <SelectValue placeholder="No Nurse Assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">None / Unassigned</SelectItem>
                          {nurses.map((nurse) => (
                            <SelectItem key={nurse.email} value={nurse.name}>
                              {nurse.name} ({nurse.qualification || "RN"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conditional Discharge Registry Details */}
                  {editForm.status === "Discharged" && (
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Discharge Registry Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">IP Number *</Label>
                          <Input
                            placeholder="In-Patient No."
                            value={editForm.dischargeIpNo}
                            onChange={(e) => setEditForm((p) => ({ ...p, dischargeIpNo: e.target.value }))}
                            className="mt-1 h-8 text-xs bg-background"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Discharge Type *</Label>
                          <Select
                            value={editForm.dischargeType}
                            onValueChange={(v) => setEditForm((p) => ({ ...p, dischargeType: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="DAMA">DAMA</SelectItem>
                              <SelectItem value="LAMA">LAMA</SelectItem>
                              <SelectItem value="Referred">Referred</SelectItem>
                              <SelectItem value="Absconded">Absconded</SelectItem>
                              <SelectItem value="Death">Death</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Diagnosis / Illness *</Label>
                          <Input
                            placeholder="Medical diagnosis"
                            value={editForm.dischargeDiagnosis}
                            onChange={(e) => setEditForm((p) => ({ ...p, dischargeDiagnosis: e.target.value }))}
                            className="mt-1 h-8 text-xs bg-background"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Procedures / Surgery Performed</Label>
                          <Input
                            placeholder="e.g. Appendectomy"
                            value={editForm.dischargeProcedureDone}
                            onChange={(e) => setEditForm((p) => ({ ...p, dischargeProcedureDone: e.target.value }))}
                            className="mt-1 h-8 text-xs bg-background"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Follow Up Date</Label>
                          <Input
                            type="date"
                            value={editForm.dischargeFollowUpDate}
                            onChange={(e) => setEditForm((p) => ({ ...p, dischargeFollowUpDate: e.target.value }))}
                            className="mt-1 h-8 text-xs bg-background"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Final Bill Amount (₹) *</Label>
                          <Input
                            type="number"
                            placeholder="Final amount"
                            value={editForm.dischargeFinalBillAmount}
                            onChange={(e) => setEditForm((p) => ({ ...p, dischargeFinalBillAmount: e.target.value === "" ? "" : Number(e.target.value) }))}
                            className="mt-1 h-8 text-xs bg-background"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Bill Settled Status *</Label>
                          <Select
                            value={editForm.dischargeBillSettled}
                            onValueChange={(v) => setEditForm((p) => ({ ...p, dischargeBillSettled: v }))}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Partial">Partial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Remarks / Instructions</Label>
                          <Textarea
                            placeholder="Post-discharge instructions, medications..."
                            value={editForm.dischargeRemarks}
                            onChange={(e) => setEditForm((p) => ({ ...p, dischargeRemarks: e.target.value }))}
                            className="mt-1 h-12 resize-none text-xs bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type and Due Amount Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editForm.type}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, type: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MLC">MLC</SelectItem>
                      <SelectItem value="Maternity">Maternity</SelectItem>
                      <SelectItem value="OT">OT</SelectItem>
                      <SelectItem value="Consent">Consent</SelectItem>
                      <SelectItem value="Death">Death</SelectItem>
                      <SelectItem value="Birth">Birth</SelectItem>
                      <SelectItem value="Free Patient">Free Patient</SelectItem>
                      <SelectItem value="Discharge">Discharge</SelectItem>
                      <SelectItem value="3C">3C</SelectItem>
                      <SelectItem value="Insurance Bill">Insurance Bill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {editForm.visitType === "OPD" ? "Consultation Fee (₹)" : "Admission Fee (₹)"}
                  </Label>
                  <Input
                    type="number"
                    value={editForm.dueAmount}
                    onChange={(e) => setEditForm((p) => ({ ...p, dueAmount: e.target.value }))}
                    placeholder="Enter fee amount"
                    className="mt-1 w-full text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm font-semibold">Notes</Label>
                <Textarea
                  className="mt-1 h-[70px] resize-none text-xs"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes…"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/10 shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setEditDialogOpen(false); setEditingAppt(null); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting} className="min-w-[110px]">
                {editSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}

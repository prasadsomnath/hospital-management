import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { getLocalDateString } from "@/lib/utils";
const MOCK_PATIENTS: any[] = [];
import { receptionApi } from "@/lib/reception-api";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  AlertCircle,
  HelpCircle,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Type definitions for our state
interface OPDForm {
  date: string;
  oServNo: string;
  referredBy: string;
  reportingDr: string;
  saveRepoDr: boolean;
  patientNo: string;
  due: string;
  patientName: string;
  priceList: string;
  age: string;
  sex: string;
  address: string;
  place: string;
  phone: string;
  mobileForSms: string;
  indication: string;
  history: string;
  treatment: string;
  advice: string;
  refId: string;
  email: string;
  notes: string;
  freeOfCost: boolean;
  inchargeDr?: string;
}

interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
}

const DEFAULT_FORM: OPDForm = {
  date: getLocalDateString(),
  oServNo: "Next",
  referredBy: "Self - SELF",
  reportingDr: "",
  saveRepoDr: false,
  patientNo: "",
  due: "0.00",
  patientName: "",
  priceList: "OTHER PRICE LIST",
  age: "",
  sex: "Male",
  address: "",
  place: "City Hospital",
  phone: "",
  mobileForSms: "",
  indication: "Routine checkup",
  history: "None",
  treatment: "Consultation",
  advice: "Follow up in a week",
  refId: "",
  email: "",
  notes: "",
  freeOfCost: false,
  inchargeDr: "",
};

// Initial list of referral options
const INITIAL_REFERRALS = [
  { name: "Gangadharayya Hiremath", code: "DRGH" },
  { name: "Mutturaj", code: "MTR" },
  { name: "Radhu", code: "R01" },
  { name: "Ravi Kumar", code: "RK" },
  { name: "Self", code: "SELF" },
  { name: "Shivamurthy", code: "SM" },
  { name: "Soumya", code: "SY" },
];

export interface OPDRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (patientData: any) => void;
  prefill?: {
    patientNo?: string;
    patientName?: string;
    phone?: string;
    email?: string;
    address?: string;
    age?: string;
    sex?: string;
  };
}

export function OPDRegistrationModal({
  open,
  onClose,
  onSave,
  prefill,
}: OPDRegistrationModalProps) {
  const { user } = useAuthStore();
  const hospitalCode = user?.hospitalCode || "HSP001";
  const [form, setForm] = useState<OPDForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referrals, setReferrals] = useState(INITIAL_REFERRALS);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [newRefName, setNewRefName] = useState("");
  const [newRefCode, setNewRefCode] = useState("");
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);
  const [showNoSuggestions, setShowNoSuggestions] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const noSuggRef = useRef<HTMLDivElement>(null);
  const nameSuggRef = useRef<HTMLDivElement>(null);

  const updateField = (key: keyof OPDForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const loadDoctors = useCallback(async () => {
    if (!hospitalCode) return;

    setLoadingDoctors(true);
    try {
      const resDocs = await apiFetch<any>("/admin/doctors", {
        params: { page: 0, size: 1000 },
        headers: {
          "X-Hospital-Code": hospitalCode,
        },
      });

      const doctorList = Array.isArray(resDocs)
        ? resDocs
        : (resDocs?.content ?? []);

      const mapped = doctorList
        .filter((doctor) => doctor.isActive !== false)
        .map((doctor): DoctorOption => {
          const rawName =
            doctor.name ||
            [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
            doctor.email ||
            "Unassigned Doctor";
          const name = rawName.toLowerCase().startsWith("dr.")
            ? rawName
            : `Dr. ${rawName}`;

          return {
            id: String(doctor.id ?? doctor.email ?? name),
            name,
            specialty:
              doctor.specialization || doctor.specialty || "General Medicine",
          };
        });

      setDoctors(mapped);

      // Dynamically set referrals
      const loadedReferrals = doctorList
        .filter((doctor) => doctor.isActive !== false)
        .map((doctor) => {
          const rawName =
            doctor.name ||
            [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
            doctor.doctorCode ||
            "Doctor";
          const name = rawName.toLowerCase().startsWith("dr.")
            ? rawName
            : `Dr. ${rawName}`;
          return {
            name,
            code: doctor.doctorCode || String(doctor.id) || "DOC",
          };
        });

      setReferrals([...loadedReferrals, { name: "Self", code: "SELF" }]);

      setForm((prev) => {
        if (mapped.length === 0) {
          return prev;
        }

        const reportingDr = mapped.some(
          (doctor) => doctor.id === prev.reportingDr,
        )
          ? prev.reportingDr
          : mapped[0].id;
        const inchargeDr =
          prev.inchargeDr &&
          mapped.some((doctor) => doctor.id === prev.inchargeDr)
            ? prev.inchargeDr
            : "";

        return {
          ...prev,
          reportingDr,
          inchargeDr,
        };
      });
    } catch (error) {
      console.error("Failed to load doctors for OPD registration:", error);
      setDoctors([]);
      toast.error("Failed to load doctors from this hospital.");
    } finally {
      setLoadingDoctors(false);
    }
  }, [hospitalCode]);

  const loadPatients = useCallback(async () => {
    if (!hospitalCode) return;
    try {
      const list = await receptionApi.getPatients(hospitalCode);
      if (Array.isArray(list)) {
        setPatients(list);
      }
    } catch (error) {
      console.error("Failed to load patients for OPD registration:", error);
    }
  }, [hospitalCode]);

  useEffect(() => {
    if (open) {
      loadDoctors();
      loadPatients();
    }
  }, [loadDoctors, loadPatients, open]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (noSuggRef.current && !noSuggRef.current.contains(e.target as Node)) {
        setShowNoSuggestions(false);
      }
      if (
        nameSuggRef.current &&
        !nameSuggRef.current.contains(e.target as Node)
      ) {
        setShowNameSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectPatientFromSuggestion = (patient: any) => {
    setForm((prev) => ({
      ...prev,
      patientNo: patient.patientNo,
      patientName:
        patient.name ||
        [patient.firstName, patient.lastName].filter(Boolean).join(" "),
      age: patient.age ? String(patient.age) : prev.age,
      sex: patient.gender || prev.sex,
      phone: patient.phone || patient.mobile || prev.phone,
      mobileForSms:
        patient.phone || patient.mobile
          ? (patient.phone || patient.mobile).replace(/[^0-9]/g, "").slice(-10)
          : prev.mobileForSms,
      address: patient.address || prev.address,
      email: patient.email || prev.email,
      due: patient.patientNo === "p1" ? "3260.00" : "0.00",
    }));
    setShowNoSuggestions(false);
    setShowNameSuggestions(false);
    toast.success(`Patient "${patient.name || patient.firstName}" selected!`);
  };

  const filteredNoPatients = patients.filter(
    (p) =>
      form.patientNo.trim().length > 0 &&
      (p.patientNo.toLowerCase().includes(form.patientNo.toLowerCase()) ||
        p.name.toLowerCase().includes(form.patientNo.toLowerCase())),
  );

  const filteredNamePatients = patients.filter(
    (p) =>
      form.patientName.trim().length > 0 &&
      (p.name.toLowerCase().includes(form.patientName.toLowerCase()) ||
        p.patientNo.toLowerCase().includes(form.patientName.toLowerCase())),
  );

  useEffect(() => {
    if (open) {
      setForm((prev) => {
        const base = prefill
          ? {
              ...DEFAULT_FORM,
              patientNo: prefill.patientNo || "",
              patientName: prefill.patientName || "",
              age: prefill.age || "",
              sex: prefill.sex || "Male",
              phone: prefill.phone || "",
              mobileForSms: prefill.phone
                ? prefill.phone.replace(/[^0-9]/g, "").slice(-10)
                : "",
              address: prefill.address || "",
              email: prefill.email || "",
            }
          : DEFAULT_FORM;

        return {
          ...base,
          reportingDr: prev.reportingDr || base.reportingDr,
          inchargeDr: prev.inchargeDr || base.inchargeDr,
        };
      });
    }
  }, [open, prefill]);

  // Keyboard shortcut listener
  // biome-ignore lint/correctness/useExhaustiveDependencies: handleKeyDown closes over form and referrals state
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 - Add new referral doctor
      if (e.key === "F2") {
        e.preventDefault();
        setShowAddReferral(true);
        toast.info("F2: Add New Referral Doctor");
      }
      // F3 - Find patient details
      if (e.key === "F3") {
        e.preventDefault();
        handleFindPatient();
      }
      // F10 - Save form
      if (e.key === "F10") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, form, referrals]);

  // Find patient handler (F3)
  const handleFindPatient = () => {
    if (!form.patientNo) {
      toast.error("Please enter a Patient No first (e.g., P1293 or p1)");
      return;
    }

    const searchTerm = form.patientNo.trim().toLowerCase();

    // Search in MOCK_PATIENTS
    const foundPatient = MOCK_PATIENTS.find(
      (p) =>
        p.id.toLowerCase() === searchTerm ||
        p.name.toLowerCase().includes(searchTerm),
    );

    if (foundPatient) {
      setForm((prev) => ({
        ...prev,
        patientNo: foundPatient.id,
        patientName: foundPatient.name,
        age: foundPatient.age.toString(),
        sex: foundPatient.gender,
        phone: foundPatient.phone,
        mobileForSms: foundPatient.phone.replace(/[^0-9]/g, "").slice(-10),
        address: foundPatient.address || "",
        email: foundPatient.email || "",
        due: foundPatient.id === "p1" ? "3260.00" : "0.00",
      }));
      toast.success(
        `Patient "${foundPatient.name}" details loaded successfully!`,
      );
    } else {
      toast.error(`Patient No "${form.patientNo}" not found. Try P1293 or p1.`);
    }
  };

  // Add new referral (F2)
  const handleAddReferral = () => {
    if (!newRefName || !newRefCode) {
      toast.error("Please enter name and code for new referral.");
      return;
    }
    const newRef = {
      name: newRefName.trim(),
      code: newRefCode.trim().toUpperCase(),
    };
    setReferrals((prev) => [...prev, newRef]);
    updateField("referredBy", `${newRef.name} - ${newRef.code}`);
    setNewRefName("");
    setNewRefCode("");
    setShowAddReferral(false);
    toast.success(`Referral doctor "${newRef.name}" added successfully.`);
  };

  // Save handler (F10)
  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.patientName.trim())
      nextErrors.patientName = "Patient Name is required";
    if (!form.age.trim()) nextErrors.age = "Age is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please fill in all bold/required fields.");
      return;
    }

    try {
      // Save and send feedback
      if (onSave) {
        await onSave({
          ...form,
          srl: Math.floor(Math.random() * 1000) + 10,
          status: "Pending",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }

      toast.success(`OPD Record saved successfully for ${form.patientName}!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save OPD Record");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-6xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b border-border/40 pb-4 mb-4 flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-foreground font-display">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-500/20 text-teal-600">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            OPD Registration / Services (Other Services Patients)
          </DialogTitle>
        </DialogHeader>

        {/* Form Body - Grid Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
          {/* Left Column (Inputs) - Span 7 */}
          <div className="lg:col-span-7 space-y-4 pr-1">
            {/* Row 1: Date & O.Serv.No */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Date
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  O.Serv.No.
                </Label>
                <Input
                  value={form.oServNo}
                  onChange={(e) => updateField("oServNo", e.target.value)}
                  className="h-9 font-mono bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Reporting Dr & Save Repo.Dr. Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Reporting Dr</Label>
                <Select
                  value={form.reportingDr}
                  onValueChange={(v) => updateField("reportingDr", v)}
                >
                  <SelectTrigger className="h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950">
                    {loadingDoctors ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Loading doctors...
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No active doctors found for this hospital
                      </div>
                    ) : (
                      doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} ({doctor.specialty})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 h-9">
                <Checkbox
                  id="saveRepoDr"
                  checked={form.saveRepoDr}
                  onCheckedChange={(c) => updateField("saveRepoDr", !!c)}
                />
                <Label
                  htmlFor="saveRepoDr"
                  className="text-xs font-medium cursor-pointer"
                >
                  Save Repo.Dr.
                </Label>
              </div>
            </div>

            {/* Row 3: Patient No & Find (F3) Button & Due */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6 space-y-1 relative" ref={noSuggRef}>
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  Patient No
                  <span className="text-[10px] text-muted-foreground dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                    F3 to find
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter ID (e.g. P1293)"
                    value={form.patientNo}
                    onChange={(e) => {
                      updateField("patientNo", e.target.value);
                      setShowNoSuggestions(true);
                    }}
                    onFocus={() => setShowNoSuggestions(true)}
                    className="h-9 pr-14 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFindPatient}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-[10px] hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold"
                  >
                    Find (F3)
                  </Button>
                </div>
                {showNoSuggestions && filteredNoPatients.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredNoPatients.map((p) => (
                      <button
                        key={p.patientNo}
                        type="button"
                        onClick={() => selectPatientFromSuggestion(p)}
                        className="w-full text-left px-3 py-2.5 hover:bg-teal-500/10 transition-colors flex justify-between items-center text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                            {p.name || `${p.firstName} ${p.lastName}`}
                          </span>
                          {(p.phone || p.mobile) && (
                            <span className="text-[10px] text-zinc-500">
                              📞 {p.phone || p.mobile}
                            </span>
                          )}
                        </div>
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">
                          {p.patientNo}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-6 space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Outstanding Due (₹)
                  </Label>
                </div>
                <div className="h-9 flex items-center px-3 border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-sm">
                  ₹ {form.due}
                </div>
              </div>
            </div>

            {/* Row 4: Patient Name (BOLD Required) */}
            <div className="space-y-1 relative" ref={nameSuggRef}>
              <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Patient Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="Full Name"
                value={form.patientName}
                onChange={(e) => {
                  updateField("patientName", e.target.value);
                  setShowNameSuggestions(true);
                }}
                onFocus={() => setShowNameSuggestions(true)}
                className={`h-9 font-semibold bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-950 focus:border-teal-500 transition-colors ${
                  errors.patientName
                    ? "border-rose-500 focus:ring-rose-500/15"
                    : ""
                }`}
              />
              {errors.patientName && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.patientName}
                </p>
              )}
              {showNameSuggestions && filteredNamePatients.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredNamePatients.map((p) => (
                    <button
                      key={p.patientNo}
                      type="button"
                      onClick={() => selectPatientFromSuggestion(p)}
                      className="w-full text-left px-3 py-2.5 hover:bg-teal-500/10 transition-colors flex justify-between items-center text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {p.name || `${p.firstName} ${p.lastName}`}
                        </span>
                        {(p.phone || p.mobile) && (
                          <span className="text-[10px] text-zinc-500">
                            📞 {p.phone || p.mobile}
                          </span>
                        )}
                      </div>
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">
                        {p.patientNo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 5: Price List */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Price List
              </Label>
              <Select
                value={form.priceList}
                onValueChange={(v) => updateField("priceList", v)}
              >
                <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OTHER PRICE LIST">
                    OTHER PRICE LIST
                  </SelectItem>
                  <SelectItem value="STANDARD PRICE LIST">
                    STANDARD PRICE LIST
                  </SelectItem>
                  <SelectItem value="CGHS CLINIC LIST">
                    CGHS CLINIC LIST
                  </SelectItem>
                  <SelectItem value="ECHS CO-PAY LIST">
                    ECHS CO-PAY LIST
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 6: Age & Sex (Age is BOLD Required) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Age <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="Yrs"
                  value={form.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  className={`h-9 font-semibold bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-950 focus:border-teal-500 transition-colors ${
                    errors.age ? "border-rose-500 focus:ring-rose-500/15" : ""
                  }`}
                />
                {errors.age && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.age}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Sex
                </Label>
                <Select
                  value={form.sex}
                  onValueChange={(v) => updateField("sex", v)}
                >
                  <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 7: Address (Medium Textarea) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Address
              </Label>
              <Textarea
                placeholder="Residential Address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                rows={2}
                className="resize-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
              />
            </div>

            {/* Row 8: Place */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Place
              </Label>
              <Input
                value={form.place}
                onChange={(e) => updateField("place", e.target.value)}
                className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
              />
            </div>

            {/* Row 9: Phone & Mobile for SMS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Phone
                </Label>
                <PhoneInput
                  value={form.phone}
                  onChange={(val) => updateField("phone", val)}
                  className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950"
                  placeholder="Landline or Alt"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Mobile for SMS
                </Label>
                <PhoneInput
                  value={form.mobileForSms}
                  onChange={(val) => updateField("mobileForSms", val)}
                  className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950"
                  placeholder="10-digit number"
                />
              </div>
            </div>

            {/* Row 10 - 13: Diagnostics dropdown parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Indication
                </Label>
                <Select
                  value={form.indication}
                  onValueChange={(v) => updateField("indication", v)}
                >
                  <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine checkup">
                      Routine checkup
                    </SelectItem>
                    <SelectItem value="Chronic Pain">Chronic Pain</SelectItem>
                    <SelectItem value="High Fever">High Fever</SelectItem>
                    <SelectItem value="Accident / Trauma">
                      Accident / Trauma
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  History
                </Label>
                <Select
                  value={form.history}
                  onValueChange={(v) => updateField("history", v)}
                >
                  <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Diabetes Type 2">
                      Diabetes Type 2
                    </SelectItem>
                    <SelectItem value="Hypertension">Hypertension</SelectItem>
                    <SelectItem value="Cardiac Issues">
                      Cardiac Issues
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Treatment
                </Label>
                <Select
                  value={form.treatment}
                  onValueChange={(v) => updateField("treatment", v)}
                >
                  <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="ECG + Lab Work">
                      ECG + Lab Work
                    </SelectItem>
                    <SelectItem value="Injection / Vaccination">
                      Injection / Vaccination
                    </SelectItem>
                    <SelectItem value="Surgical dressing">
                      Surgical dressing
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Advice
                </Label>
                <Select
                  value={form.advice}
                  onValueChange={(v) => updateField("advice", v)}
                >
                  <SelectTrigger className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Follow up in a week">
                      Follow up in a week
                    </SelectItem>
                    <SelectItem value="Bed rest for 3 days">
                      Bed rest for 3 days
                    </SelectItem>
                    <SelectItem value="Avoid cold food / fluids">
                      Avoid cold food / fluids
                    </SelectItem>
                    <SelectItem value="Take prescribed medicine">
                      Take prescribed medicine
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Column (Referrals & Sub-forms) - Span 5 */}
          <div className="lg:col-span-5 space-y-4 pl-1 border-t lg:border-t-0 lg:border-l border-border/60 pt-4 lg:pt-0 lg:pl-5">
            {/* Referred By Section with Add New Button */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Referred By
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddReferral(true)}
                  className="h-7 text-[11px] px-2 text-teal-600 border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  Add New (F2)
                </Button>
              </div>

              <Input
                value={form.referredBy}
                onChange={(e) => updateField("referredBy", e.target.value)}
                placeholder="Doctor / Source"
                className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
              />

              {/* Popup to Add Doctor Referral Inline */}
              {showAddReferral && (
                <div className="p-3 bg-muted/50 border border-border/80 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quick Add Referral
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Doctor Name"
                      value={newRefName}
                      onChange={(e) => setNewRefName(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Code (e.g. MTR)"
                      value={newRefCode}
                      onChange={(e) => setNewRefCode(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddReferral(false)}
                      className="h-7 text-xs px-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddReferral}
                      className="h-7 bg-teal-600 hover:bg-teal-700 text-white text-xs px-2.5"
                    >
                      Add Referral
                    </Button>
                  </div>
                </div>
              )}

              {/* Referred By List/Table as in screenshot */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  Quick Select Doctors / Referrals
                </div>
                <div className="max-h-[172px] overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                  {referrals.map((doc) => {
                    const isSelected =
                      form.referredBy === `${doc.name} - ${doc.code}`;
                    return (
                      <button
                        key={doc.code}
                        type="button"
                        onClick={() =>
                          updateField("referredBy", `${doc.name} - ${doc.code}`)
                        }
                        className={`w-full text-left px-3 py-2 transition-colors flex justify-between items-center ${
                          isSelected
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold border-l-2 border-teal-500"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-foreground/80"
                        }`}
                      >
                        <span>{doc.name}</span>
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                          {doc.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Other Inputs: Ref.ID & Email & Notes */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Ref.ID
                  </Label>
                  <Input
                    placeholder="Referral ID"
                    value={form.refId}
                    onChange={(e) => updateField("refId", e.target.value)}
                    className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Notes
                </Label>
                <Textarea
                  placeholder="General notes or observations"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={2}
                  className="resize-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <Checkbox
                  id="freeOfCost"
                  checked={form.freeOfCost}
                  onCheckedChange={(c) => updateField("freeOfCost", !!c)}
                />
                <Label
                  htmlFor="freeOfCost"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer flex-1"
                >
                  Free Of Cost Patient
                </Label>
                {form.freeOfCost && (
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Charges Waived
                  </span>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-4 mt-4 gap-3 bg-muted/5 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
          <div className="text-xs font-semibold text-muted-foreground">
            <span className="font-bold text-foreground">* BOLD</span> = Required
            field
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold flex items-center gap-1 bg-background hover:bg-muted"
            >
              <X className="w-3.5 h-3.5" />
              Cancel (Esc)
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="h-9 px-5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-md shadow-teal-600/10"
            >
              <Save className="w-3.5 h-3.5" />
              Save (F10)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

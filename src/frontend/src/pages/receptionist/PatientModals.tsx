import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";
import { calculateDetailedAge } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Calendar,
  CreditCard,
  Droplets,
  Edit,
  FileText,
  Fingerprint,
  Globe,
  GraduationCap,
  HeartPulse,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function SectionTitle({
  title,
  icon: Icon,
}: { title: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1.5 border-b border-border/50 mb-4 mt-2">
      {Icon && <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

function FieldWrapper({ label, required, span, children }: any) {
  return (
    <div className={`space-y-1 ${span || ""}`}>
      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-0.5">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  span = "",
  required = false,
  icon: Icon,
  placeholder = "",
  error = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  span?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className={`space-y-1 ${span}`}>
      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-0.5">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
        )}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${Icon ? "pl-8" : ""} h-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500 ${
            error
              ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive"
              : ""
          }`}
        />
      </div>
      {error && (
        <p className="text-[9px] text-destructive mt-0.5 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return value ? (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
        {label}
      </span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  ) : null;
}

// ─── VIEW MODAL ─────────────────────────────────────────────────────────────
export function ViewPatientModal({
  patient,
  onClose,
  onEdit,
}: { patient: any; onClose: () => void; onEdit: () => void }) {
  if (!patient) return null;
  const fullName = [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
  const initials =
    [patient.firstName?.[0], patient.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border border-border rounded-xl p-0 overflow-hidden shadow-xl">
        {/* Banner */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {fullName}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30 font-mono text-[10px]">
                Patient ID: {patient.patientNo}
              </Badge>
              {patient.gender && (
                <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                  {patient.gender}
                </Badge>
              )}
              {(patient.age || patient.dob) && (
                <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                  {patient.dob
                    ? calculateDetailedAge(patient.dob, true)
                    : `${patient.age} yrs`}
                </Badge>
              )}
              {patient.bloodGroup && (
                <Badge className="bg-red-500/30 text-white border-red-300/30 text-[10px]">
                  🩸 {patient.bloodGroup}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Contact */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              Contact & Demographics
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Phone" value={patient.phone} />
              <InfoRow
                label="Alternative Number"
                value={patient.alternativeNum}
              />
              <InfoRow label="Email" value={patient.email} />
              <InfoRow label="Aadhar" value={patient.aadhar} />
              <InfoRow
                label="Date of Birth"
                value={
                  patient.dob
                    ? `${patient.dob} (${calculateDetailedAge(patient.dob)})`
                    : null
                }
              />
              <InfoRow label="Language" value={patient.language} />
              <InfoRow label="Religion" value={patient.religion} />
              <div className="col-span-2">
                <InfoRow label="Address" value={patient.address} />
              </div>
              <InfoRow label="Country" value={patient.country} />
              <InfoRow label="Place / PIN" value={patient.placePin} />
            </div>
          </div>

          <Separator />

          {/* Clinical */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              Clinical Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow
                label="Height"
                value={patient.height ? `${patient.height} cm` : null}
              />
              <InfoRow
                label="Weight"
                value={patient.weight ? `${patient.weight} kg` : null}
              />
              <InfoRow label="Education" value={patient.education} />
              <InfoRow label="Occupation" value={patient.occupation} />
              <InfoRow label="Referred Doctor" value={patient.referredBy} />
              <InfoRow label="Vices / Habits" value={patient.vicesHabits} />
              <div className="col-span-2">
                <InfoRow
                  label="Permanent Diagnosis"
                  value={patient.permanentDiagnosis}
                />
              </div>
              {patient.notes && (
                <div className="col-span-2">
                  <InfoRow label="General Notes" value={patient.notes} />
                </div>
              )}
              {patient.hyperSensitivity && (
                <div className="col-span-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">
                    ⚠ Allergies
                  </p>
                  <p className="text-xs text-foreground">
                    {patient.hyperSensitivity}
                  </p>
                </div>
              )}
              {patient.importantNotes && (
                <div className="col-span-2 p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                  <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">
                    Important Notes
                  </p>
                  <p className="text-xs text-foreground">
                    {patient.importantNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {(patient.insuranceCompany || patient.income) && (
            <>
              <Separator />
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                  Financials & Insurance
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Annual Income" value={patient.income} />
                  <InfoRow
                    label="Insurance Company"
                    value={patient.insuranceCompany}
                  />
                  <InfoRow
                    label="Policy Ref No."
                    value={patient.insuranceRefNo}
                  />
                  <InfoRow
                    label="Covered Amount"
                    value={
                      patient.insuranceAmount
                        ? `₹${patient.insuranceAmount}`
                        : null
                    }
                  />
                  <InfoRow
                    label="Free of Cost"
                    value={patient.freeOfCost ? "Yes" : "No"}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={onEdit}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Patient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── EDIT MODAL ─────────────────────────────────────────────────────────────
export function EditPatientModal({
  patient,
  onClose,
  onSaved,
}: { patient: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ ...patient });
  const [activeTab, setActiveTab] = useState("identity");
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
        });
        const docsList = Array.isArray(res) ? res : res?.content || [];
        setDoctors(docsList);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [user]);

  function setField(k: string, v: any) {
    setForm((p: any) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.firstName?.trim()) return;

    if (form.aadhar) {
      const cleanAadhar = form.aadhar.replace(/[\s-]/g, "");
      if (!/^\d{12}$/.test(cleanAadhar)) {
        toast.error("Aadhar number must be exactly 12 digits");
        return;
      }
    }

    if (!form.consentAgreed) {
      toast.error(
        "Please obtain patient clinical treatment and operation consent to proceed.",
      );
      setActiveTab("consent");
      return;
    }

    if (!form.consentSigneeName?.trim()) {
      form.consentSigneeName =
        `${form.firstName} ${form.middleName ? `${form.middleName} ` : ""}${form.lastName}`.trim();
    }

    setSaving(true);
    try {
      await apiFetch(`/reception/patients/${patient.patientNo}`, {
        method: "PUT",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          middleName: form.middleName || null,
          lastName: form.lastName || null,
          gender: form.gender || null,
          dob: form.dob || null,
          referredBy: form.referredBy || null,
          phone: form.phone || null,
          alternativeNum: form.alternativeNum || null,
          email: form.email || null,
          address: form.address || null,
          aadhar: form.aadhar || null,
          bloodGroup: form.bloodGroup || null,
          height: form.height || null,
          weight: form.weight || null,
          permanentDiagnosis: form.permanentDiagnosis || null,
          hyperSensitivity: form.hyperSensitivity || null,
          importantNotes: form.importantNotes || null,
          notes: form.notes || null,
          insuranceCompany: form.insuranceCompany || null,
          insuranceAmount: form.insuranceAmount
            ? Number(form.insuranceAmount)
            : 0,
          insuranceRefNo: form.insuranceRefNo || null,
          freeOfCost: !!form.freeOfCost,
          income: form.income || null,
          religion: form.religion || null,
          education: form.education || null,
          occupation: form.occupation || null,
          category: form.category || null,
          language: form.language || null,
          country: form.country || null,
          placePin: form.placePin || null,
          insuranceDate: form.insuranceDate || null,
          vicesHabits: form.vicesHabits || null,
          consentAgreed: !!form.consentAgreed,
          consentSigneeName: form.consentSigneeName || null,
          consentDate: form.consentDate || null,
        }),
      });
      toast.success("Patient updated successfully!");
      onSaved();
    } catch {
      toast.error("Failed to update patient.");
    } finally {
      setSaving(false);
    }
  }

  if (!patient) return null;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-card border border-border rounded-xl p-0 overflow-hidden shadow-xl">
        <DialogHeader className="p-5 pb-2">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Edit className="w-4 h-4 text-teal-500" /> Edit Patient —{" "}
            <span className="font-mono text-teal-600">{patient.patientNo}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="px-5 pt-1">
            <TabsList className="grid w-full grid-cols-4 bg-muted/40 p-1 rounded-xl border border-border/80 shadow-xs h-10">
              <TabsTrigger
                value="identity"
                className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-xs"
              >
                <User className="w-3.5 h-3.5" /> Identity
              </TabsTrigger>
              <TabsTrigger
                value="medical"
                className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-xs"
              >
                <HeartPulse className="w-3.5 h-3.5" /> Medical
              </TabsTrigger>
              <TabsTrigger
                value="insurance"
                className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" /> Insurance
              </TabsTrigger>
              <TabsTrigger
                value="consent"
                className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" /> Consent
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto min-h-[350px]">
            {/* ── IDENTITY TAB ── */}
            <TabsContent
              value="identity"
              className="focus-visible:outline-none m-0 space-y-4"
            >
              <SectionTitle title="Personal Information" icon={User} />
              <div className="grid grid-cols-4 gap-3">
                <FormInput
                  label="First Name"
                  value={form.firstName || ""}
                  onChange={(v) => setField("firstName", v)}
                  required
                  icon={User}
                />
                <FormInput
                  label="Middle Name"
                  value={form.middleName || ""}
                  onChange={(v) => setField("middleName", v)}
                  icon={User}
                />
                <FormInput
                  label="Last Name"
                  value={form.lastName || ""}
                  onChange={(v) => setField("lastName", v)}
                  icon={User}
                />
                <FieldWrapper label="Gender">
                  <Select
                    value={form.gender || ""}
                    onValueChange={(v) => setField("gender", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWrapper>

                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Date of Birth
                  </Label>
                  <Input
                    type="date"
                    value={form.dob || ""}
                    onChange={(e) => setField("dob", e.target.value)}
                    className="h-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                  />
                  {form.dob && (
                    <p className="text-[9px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                      Age: {calculateDetailedAge(form.dob)}
                    </p>
                  )}
                </div>

                <FieldWrapper label="Referred By" span="col-span-2">
                  <Select
                    value={form.referredBy || ""}
                    onValueChange={(v) => setField("referredBy", v)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full truncate">
                      <SelectValue
                        placeholder={
                          loadingDoctors
                            ? "Loading..."
                            : "Select Doctor / Source"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Self">Self</SelectItem>
                      {doctors.map((doc: any) => {
                        const rawName =
                          doc.name ||
                          [doc.firstName, doc.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          doc.email ||
                          "Unassigned Doctor";
                        const name = rawName.toLowerCase().startsWith("dr.")
                          ? rawName
                          : `Dr. ${rawName}`;
                        return (
                          <SelectItem
                            key={doc.id || doc.email || name}
                            value={name}
                          >
                            {name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FieldWrapper>

                <FormInput
                  label="Language"
                  value={form.language || ""}
                  onChange={(v) => setField("language", v)}
                  icon={Globe}
                  placeholder="e.g. Hindi"
                />
              </div>

              <SectionTitle title="Contact Details" icon={Phone} />
              <div className="grid grid-cols-4 gap-3">
                <FieldWrapper label="Phone" span="col-span-2">
                  <PhoneInput
                    value={form.phone || ""}
                    onChange={(val) => setField("phone", val)}
                    className="h-8 text-xs bg-zinc-50"
                  />
                </FieldWrapper>
                <FieldWrapper label="Alternative Number" span="col-span-2">
                  <PhoneInput
                    value={form.alternativeNum || ""}
                    onChange={(val) => setField("alternativeNum", val)}
                    className="h-8 text-xs bg-zinc-50"
                  />
                </FieldWrapper>
                <FormInput
                  label="Email"
                  value={form.email || ""}
                  onChange={(v) => setField("email", v)}
                  span="col-span-2"
                  icon={Mail}
                  placeholder="patient@email.com"
                />
                <FieldWrapper label="Country" span="col-span-2">
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                    <Select
                      value={form.country || ""}
                      onValueChange={(v) => setField("country", v)}
                    >
                      <SelectTrigger className="pl-8 h-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FieldWrapper>
                <FormInput
                  label="Place / PIN"
                  value={form.placePin || ""}
                  onChange={(v) => setField("placePin", v)}
                  span="col-span-2"
                  icon={MapPin}
                  placeholder="City or PIN"
                />
                <FormInput
                  label="Aadhar No."
                  value={form.aadhar || ""}
                  onChange={(v) => {
                    if (/^[0-9\s-]*$/.test(v)) {
                      if (v.replace(/[\s-]/g, "").length <= 12) {
                        setField("aadhar", v);
                      }
                    }
                  }}
                  span="col-span-2"
                  icon={Fingerprint}
                  placeholder="12-digit Aadhar"
                  error={
                    form.aadhar &&
                    !/^\d{12}$/.test(form.aadhar.replace(/[\s-]/g, ""))
                      ? "Aadhar number must be exactly 12 digits"
                      : ""
                  }
                />

                <div className="col-span-4 space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground/60 z-10 pointer-events-none" />
                    <Textarea
                      value={form.address || ""}
                      onChange={(e) => setField("address", e.target.value)}
                      rows={2}
                      placeholder="House, Street, Area..."
                      className="pl-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("medical")}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    Next: Medical Details <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── MEDICAL TAB ── */}
            <TabsContent
              value="medical"
              className="focus-visible:outline-none m-0 space-y-4"
            >
              <SectionTitle title="Physical & Background" icon={HeartPulse} />
              <div className="grid grid-cols-3 gap-3">
                <FieldWrapper label="Blood Group">
                  <Select
                    value={form.bloodGroup || ""}
                    onValueChange={(v) => setField("bloodGroup", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldWrapper>

                <FormInput
                  label="Height (cm)"
                  value={form.height || ""}
                  onChange={(v) => setField("height", v)}
                  icon={Activity}
                  placeholder="165"
                />
                <FormInput
                  label="Weight (kg)"
                  value={form.weight || ""}
                  onChange={(v) => setField("weight", v)}
                  icon={Activity}
                  placeholder="60"
                />

                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    LMP / EDD
                  </Label>
                  <Input
                    type="date"
                    value={form.lmpEdd || ""}
                    onChange={(e) => setField("lmpEdd", e.target.value)}
                    className="h-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                  />
                </div>
                <FormInput
                  label="Education"
                  value={form.education || ""}
                  onChange={(v) => setField("education", v)}
                  icon={GraduationCap}
                  placeholder="Graduate"
                />
                <FormInput
                  label="Occupation"
                  value={form.occupation || ""}
                  onChange={(v) => setField("occupation", v)}
                  icon={Briefcase}
                  placeholder="Engineer"
                />
              </div>

              <SectionTitle title="Clinical Notes" icon={FileText} />
              <div className="grid grid-cols-1 gap-3">
                <FormInput
                  label="Permanent Diagnosis"
                  value={form.permanentDiagnosis || ""}
                  onChange={(v) => setField("permanentDiagnosis", v)}
                  icon={FileText}
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                />
                <FormInput
                  label="Allergies / Hyper Sensitivity"
                  value={form.hyperSensitivity || ""}
                  onChange={(v) => setField("hyperSensitivity", v)}
                  icon={Shield}
                  placeholder="e.g. Penicillin, Peanuts"
                />
                <FormInput
                  label="Vices / Habits"
                  value={form.vicesHabits || ""}
                  onChange={(v) => setField("vicesHabits", v)}
                  icon={Info}
                  placeholder="Smoking, Alcohol"
                />

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-teal-600">
                    Important Clinical Notes
                  </Label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-teal-600 dark:text-teal-400 z-10 pointer-events-none" />
                    <Textarea
                      value={form.importantNotes || ""}
                      onChange={(e) =>
                        setField("importantNotes", e.target.value)
                      }
                      rows={2}
                      placeholder="Critical info for treating physician..."
                      className="pl-8 text-xs border-teal-500/30 bg-teal-500/5 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    General Notes
                  </Label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground/60 z-10 pointer-events-none" />
                    <Textarea
                      value={form.notes || ""}
                      onChange={(e) => setField("notes", e.target.value)}
                      rows={2}
                      placeholder="Additional remarks..."
                      className="pl-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("insurance")}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    Next: Insurance Details{" "}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── INSURANCE TAB ── */}
            <TabsContent
              value="insurance"
              className="focus-visible:outline-none m-0 space-y-4"
            >
              <SectionTitle title="Insurance Details" icon={Shield} />
              <div className="grid grid-cols-4 gap-3">
                <FormInput
                  label="Insurance Company"
                  value={form.insuranceCompany || ""}
                  onChange={(v) => setField("insuranceCompany", v)}
                  span="col-span-2"
                  icon={Shield}
                  placeholder="e.g. Star Health"
                />

                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Insurance Date
                  </Label>
                  <Input
                    type="date"
                    value={form.insuranceDate || ""}
                    onChange={(e) => setField("insuranceDate", e.target.value)}
                    className="h-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                  />
                </div>

                <FormInput
                  label="Coverage Amount (₹)"
                  value={form.insuranceAmount || ""}
                  onChange={(v) => setField("insuranceAmount", v)}
                  type="number"
                  icon={CreditCard}
                  placeholder="500000"
                />
                <FormInput
                  label="Reference / Policy No."
                  value={form.insuranceRefNo || ""}
                  onChange={(v) => setField("insuranceRefNo", v)}
                  span="col-span-2"
                  icon={FileText}
                  placeholder="Policy ID"
                />
              </div>

              <SectionTitle title="Socioeconomic" icon={Briefcase} />
              <div className="grid grid-cols-4 gap-3">
                <FormInput
                  label="Income"
                  value={form.income || ""}
                  onChange={(v) => setField("income", v)}
                  icon={CreditCard}
                  placeholder="Annual"
                />
                <FormInput
                  label="Religion"
                  value={form.religion || ""}
                  onChange={(v) => setField("religion", v)}
                  icon={Globe}
                  placeholder="e.g. Hindu"
                />

                <div className="col-span-2 flex items-center pt-5">
                  <div className="flex items-center gap-2.5 p-2 bg-muted/40 rounded-lg border border-border/80 w-full hover:bg-muted/60 transition-colors">
                    <Checkbox
                      id="foc"
                      checked={!!form.freeOfCost}
                      onCheckedChange={(c) => setField("freeOfCost", !!c)}
                      className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <Label
                      htmlFor="foc"
                      className="text-xs font-semibold cursor-pointer flex-1"
                    >
                      Free Of Cost Patient
                    </Label>
                    {form.freeOfCost && (
                      <Badge className="text-[8px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-0 px-1">
                        Waived
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("consent")}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    Next: Patient Consent <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* CONSENT TAB */}
            <TabsContent
              value="consent"
              className="focus-visible:outline-none m-0 space-y-4"
            >
              <SectionTitle
                title="Clinical Treatment & Operation Consent"
                icon={FileText}
              />

              {/* Legally worded clinical consent document card */}
              <div className="p-5 rounded-2xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 text-left space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Patient Acknowledgment & Consent Agreement
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  I (the patient or their authorized legal
                  representative/guardian) hereby grant full authorization and
                  voluntary consent to the attending medical practitioners,
                  registered nurses, and clinical specialists of this
                  institution to perform necessary physical examinations,
                  laboratory diagnostics, diagnostic imaging, and general
                  clinical treatments.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Furthermore, in the event of an emergency requiring immediate
                  surgical operations, anesthesia, or critical care support, I
                  authorize the clinical team to proceed with all standard
                  resuscitative and operative procedures deemed necessary by
                  professional medical consensus to safeguard the patient's
                  health and life.
                </p>
                <div className="pt-2 border-t border-teal-500/10 flex items-start gap-3">
                  <Checkbox
                    id="editConsentAgreed"
                    checked={!!form.consentAgreed}
                    onCheckedChange={(checked) =>
                      setField("consentAgreed", !!checked)
                    }
                    className="mt-0.5 border-teal-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="editConsentAgreed"
                      className="text-xs font-bold text-foreground cursor-pointer"
                    >
                      I agree to the terms of medical treatment and operation
                      consent
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Checking this box acts as a binding digital signature of
                      clinical consent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Representative and Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="Authorized Signee Name"
                  value={form.consentSigneeName || ""}
                  onChange={(v) => setField("consentSigneeName", v)}
                  required={!!form.consentAgreed}
                  icon={User}
                  placeholder="e.g. Rahul Sharma"
                />
                <div className="space-y-1 col-span-1">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-0.5">
                    Consent Date
                    {!!form.consentAgreed && (
                      <span className="text-destructive font-bold">*</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={form.consentDate || ""}
                    onChange={(e) => setField("consentDate", e.target.value)}
                    className="h-8 text-xs focus-visible:ring-teal-500/20 focus-visible:border-teal-500 bg-zinc-50"
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Edit className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── DELETE CONFIRM MODAL ────────────────────────────────────────────────────
export function DeleteConfirmModal({
  patient,
  onClose,
  onDeleted,
}: { patient: any; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuthStore();

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/reception/patients/${patient.patientNo}`, {
        method: "DELETE",
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });
      toast.success("Patient record deleted.");
      onDeleted();
    } catch {
      toast.error("Failed to delete patient.");
      setDeleting(false);
    }
  }

  const fullName = [patient?.firstName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-card border border-border rounded-xl p-6 shadow-xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">
              Delete Patient
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">{fullName}</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Patient ID:{" "}
              <span className="font-mono font-bold">{patient?.patientNo}</span>
            </p>
          </div>
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg w-full">
            <p className="text-xs text-destructive font-medium">
              ⚠ This action cannot be undone. All records will be permanently
              removed.
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-1.5"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";
import { receptionApi } from "@/lib/reception-api";
import { calculateDetailedAge, getLocalDateString } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Fingerprint,
  Globe,
  GraduationCap,
  HeartPulse,
  Info,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldAlert,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const EMPTY_FORM = {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dob: "",
  registerDate: getLocalDateString(),
  referredBy: "",
  language: "",
  placePin: "",
  country: "India",
  phone: "",
  alternativeNum: "",
  email: "",
  address: "",
  aadhar: "",
  education: "",
  occupation: "",
  permanentDiagnosis: "",
  vicesHabits: "",
  hyperSensitivity: "",
  importantNotes: "",
  notes: "",
  height: "",
  weight: "",
  bloodGroup: "",
  insuranceCompany: "",
  insuranceDate: "",
  insuranceAmount: "",
  insuranceRefNo: "",
  freeOfCost: false,
  income: "",
  religion: "",
  consentAgreed: false,
  consentSigneeName: "",
  consentDate: getLocalDateString(),
};

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

function F({ label, required, span, children }: any) {
  return (
    <div className={`space-y-1.5 ${span || ""}`}>
      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-0.5">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function RegisterPatient() {
  const { user } = useAuthStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("identity");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [lastReg, setLastReg] = useState<any>(null);

  const [selectedRegister, setSelectedRegister] = useState("None");
  const [registerFields, setRegisterFields] = useState<Record<string, any>>({});

  const getRegisterDefaults = (
    register: string,
    patientName = "",
    dob = "",
    gender = "",
    referredBy = "",
  ) => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    const localISODate = localISOTime.split("T")[0];

    const calculatedAge = dob ? calculateDetailedAge(dob) : "";
    const numericAge = calculatedAge ? Number.parseInt(calculatedAge) : null;

    switch (register) {
      case "MLC":
        return {
          admissionDateTime: localISOTime,
          injuryType: "Road Accident",
          broughtBy: "Relative",
          policeStationName: "",
          firNumber: "",
          informingDoctor: "",
          treatingDoctorId: "",
          treatingDoctorName: "",
          remarks: "",
          status: "Open",
        };
      case "OT":
        const endNow = new Date(now.getTime() + 60 * 60000);
        const endISOTime = new Date(endNow.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        return {
          ipNo: "",
          procedureName: "General Procedure",
          procedureType: "Major",
          startDateTime: localISOTime,
          endDateTime: endISOTime,
          surgeonId: "",
          surgeonName: "",
          anaesthetistId: "",
          anaesthetistName: "",
          scrubNurse: "",
          otRoomNo: "",
          anaesthesiaType: "General",
          preOpDiagnosis: "",
          postOpDiagnosis: "",
          outcome: "Success",
          remarks: "",
        };
      case "Maternity":
        const lmpDateObj = new Date(now.getTime());
        const eddDateObj = new Date(
          lmpDateObj.getTime() + 280 * 24 * 60 * 60 * 1000,
        );
        const eddISODate = new Date(eddDateObj.getTime() - tzOffset)
          .toISOString()
          .split("T")[0];
        return {
          ipOpNo: "",
          lmpDate: localISODate,
          eddByLmp: eddISODate,
          eddByUsg: "",
          gravida: 0,
          para: 0,
          living: 0,
          abortion: 0,
          assignedDoctorId: "",
          assignedDoctorName: "",
          wardBed: "",
          remarks: "",
          status: "Active",
        };
      case "Consent":
        return {
          ipOpNo: "",
          procedureName: "General Treatment",
          consentType: "Clinical Treatment",
          signedBy: patientName,
          guardianName: "",
          relationship: "",
          doctorId: "",
          doctorName: "",
          witnessName: "",
          consentDateTime: localISOTime,
          documentUrl: "",
          remarks: "",
        };
      case "Death":
        return {
          ipNo: "",
          wardBed: "",
          deathDateTime: localISOTime,
          primaryCause: "Cardiac Arrest",
          secondaryCause: "",
          manner: "Natural",
          certifyingDoctorId: "",
          certifyingDoctorName: "",
          mlcLinked: "No",
          mlcNo: "",
          handoverStatus: "Handed Over",
          handoverToName: "",
          handoverToRelationship: "",
          remarks: "",
        };
      case "Birth":
        return {
          babyName: `Baby of ${patientName}`,
          gender: "Male",
          birthDateTime: localISOTime,
          birthWeight: 3.0,
          deliveryType: "Normal",
          fatherName: "",
          fatherPhone: "",
          ward: "",
          bedNo: "",
          deliveringDoctorId: "",
          deliveringDoctorName: "",
          apgarScore1min: 9,
          apgarScore5min: 10,
          remarks: "",
        };
      case "Free":
        return {
          ipOpNo: "",
          schemeName: "Charity Scheme",
          servicesCovered: "OPD Consultation, Diagnostics",
          authorisedById: "",
          authorisedByName: "",
          approvalDate: localISODate,
          remarks: "",
        };
      case "Discharge":
        return {
          ipNo: "",
          admissionDate: localISODate,
          dischargeDateTime: localISOTime,
          treatingDoctorId: "",
          treatingDoctorName: "",
          wardBed: "",
          diagnosis: "OPD Checkup",
          procedureDone: "",
          dischargeType: "Normal",
          followUpDate: "",
          finalBillAmount: 0,
          billSettled: "Yes",
          remarks: "",
        };
      case "3C":
        return {
          caseType: "Emergency",
          arrivalDateTime: localISOTime,
          triageLevel: "Green",
          chiefComplaint: "General Checkup",
          assignedDoctorId: "",
          assignedDoctorName: "",
          referredFrom: "",
          broughtBy: "Self",
          bp: "120/80",
          pulse: 72,
          temperature: 98.6,
          spo2: 98,
          actionsTaken: "",
          status: "Admitted",
          remarks: "",
        };
      case "Insurance":
        return {
          billNo: `INS-${Date.now().toString().slice(-6)}`,
          ipNo: "",
          insurerName: "",
          policyNumber: "",
          tpaName: "",
          schemeType: "Cashless",
          claimAmount: 1000,
          approvedAmount: 0,
          balanceToPatient: 0,
          claimStatus: "Submitted",
          submissionDate: localISODate,
          settlementDate: "",
          remarks: "",
        };
      default:
        return {};
    }
  };

  useEffect(() => {
    const pName =
      `${form.firstName} ${form.middleName ? form.middleName + " " : ""}${form.lastName}`.trim();
    setRegisterFields(
      getRegisterDefaults(
        selectedRegister,
        pName,
        form.dob,
        form.gender,
        form.referredBy,
      ),
    );
  }, [selectedRegister]);

  useEffect(() => {
    if (selectedRegister !== "None") {
      const pName =
        `${form.firstName} ${form.middleName ? form.middleName + " " : ""}${form.lastName}`.trim();
      setRegisterFields((prev) => {
        const updated = { ...prev };
        if (selectedRegister === "Consent" && !prev.signedBy) {
          updated.signedBy = pName;
        }
        if (
          selectedRegister === "Birth" &&
          (!prev.babyName || prev.babyName.startsWith("Baby of"))
        ) {
          updated.babyName = `Baby of ${pName}`;
        }
        return updated;
      });
    }
  }, [form.firstName, form.middleName, form.lastName, selectedRegister]);

  useEffect(() => {
    if (selectedRegister === "Maternity" && registerFields.lmpDate) {
      try {
        const lmp = new Date(registerFields.lmpDate);
        if (!isNaN(lmp.getTime())) {
          const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
          const tzOffset = edd.getTimezoneOffset() * 60000;
          const eddStr = new Date(edd.getTime() - tzOffset)
            .toISOString()
            .split("T")[0];
          setRegisterFields((prev) => ({
            ...prev,
            eddByLmp: eddStr,
          }));
        }
      } catch (e) {
        /* silent */
      }
    }
  }, [registerFields.lmpDate, selectedRegister]);

  function regField(k: string, v: any) {
    setRegisterFields((p) => ({ ...p, [k]: v }));
  }

  const idRef = useRef(`P${Date.now().toString().slice(-5)}`);
  const code = user?.hospitalCode || "HSP001";
  const today = getLocalDateString();
  const ageText = calculateDetailedAge(form.dob);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await apiFetch<any>("/admin/doctors", {
        params: { page: 0, size: 1000 },
        headers: {
          "X-Hospital-Code": code,
          "X-Hospital-Id": String(user?.hospitalId || "1"),
        },
      });
      const docsList = Array.isArray(res) ? res : res?.content || [];
      setDoctors(docsList);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [user]);

  useEffect(() => {
    const prefill = sessionStorage.getItem("register-prefill-name");
    if (prefill) {
      sessionStorage.removeItem("register-prefill-name");
      const parts = prefill.trim().split(/\s+/);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      setForm((p) => ({
        ...p,
        firstName: first,
        lastName: last,
      }));
    }
  }, []);

  function field(k: string, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.firstName.trim()) {
      setErrors({ firstName: "Required" });
      toast.error("First name is required");
      return;
    }

    if (form.aadhar) {
      const cleanAadhar = form.aadhar.replace(/[\s-]/g, "");
      if (!/^\d{12}$/.test(cleanAadhar)) {
        setErrors((prev) => ({
          ...prev,
          aadhar: "Aadhar number must be exactly 12 digits",
        }));
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

    if (!form.consentSigneeName.trim()) {
      form.consentSigneeName =
        `${form.firstName} ${form.middleName ? form.middleName + " " : ""}${form.lastName}`.trim();
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<any>("/reception/patients", {
        method: "POST",
        headers: {
          "X-Hospital-Code": code,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          middleName: form.middleName || null,
          lastName: form.lastName || null,
          gender: form.gender || null,
          dob: form.dob || null,
          registerDate: form.registerDate || null,
          referredBy: form.referredBy || null,
          language: form.language || null,
          placePin: form.placePin || null,
          country: form.country || null,
          phone: form.phone || null,
          alternativeNum: form.alternativeNum || null,
          email: form.email || null,
          address: form.address || null,
          aadhar: form.aadhar || null,
          bloodGroup: form.bloodGroup || null,
          height: form.height || null,
          weight: form.weight || null,
          education: form.education || null,
          occupation: form.occupation || null,
          permanentDiagnosis: form.permanentDiagnosis || null,
          vicesHabits: form.vicesHabits || null,
          hyperSensitivity: form.hyperSensitivity || null,
          importantNotes: form.importantNotes || null,
          notes: form.notes || null,
          insuranceCompany: form.insuranceCompany || null,
          insuranceDate: form.insuranceDate || null,
          insuranceAmount: form.insuranceAmount
            ? Number(form.insuranceAmount)
            : 0,
          insuranceRefNo: form.insuranceRefNo || null,
          freeOfCost: !!form.freeOfCost,
          income: form.income || null,
          religion: form.religion || null,
          consentAgreed: !!form.consentAgreed,
          consentSigneeName: form.consentSigneeName || null,
          consentDate: form.consentDate || null,
        }),
      });

      setLastReg(res);
      idRef.current = `P${Date.now().toString().slice(-5)}`;

      toast.success(`Patient registered successfully! ID: ${res.patientNo}`);

      setForm(EMPTY_FORM);
      setErrors({});

      // IPD Patients Enrollment
      if (selectedRegister !== "None") {
        let registerEnrolled = false;
        const patientName =
          res.name ||
          [res.firstName, res.middleName, res.lastName]
            .filter(Boolean)
            .join(" ");
        const calculatedDetailed = form.dob
          ? calculateDetailedAge(form.dob)
          : "";
        const patientAge = calculatedDetailed
          ? Number.parseInt(calculatedDetailed)
          : 0;
        const patientGender = res.gender || form.gender || "—";

        const findDoctor = (idField: string) => {
          if (!idField) return null;
          return doctors.find(
            (d) => (d.doctorCode || String(d.id)) === idField,
          );
        };
        const getDocName = (doc: any) => {
          if (!doc) return "";
          const raw = [doc.firstName, doc.lastName].filter(Boolean).join(" ");
          return raw.toLowerCase().startsWith("dr.") ? raw : `Dr. ${raw}`;
        };

        try {
          if (selectedRegister === "MLC") {
            const doc = findDoctor(registerFields.treatingDoctorId);
            const docName = getDocName(doc);
            await receptionApi.createMlcEntry(
              {
                patientNo: res.patientNo,
                patientName,
                age: patientAge,
                gender: patientGender,
                admissionDateTime: registerFields.admissionDateTime,
                injuryType: registerFields.injuryType,
                broughtBy: registerFields.broughtBy,
                policeStationName: registerFields.policeStationName || null,
                firNumber: registerFields.firNumber || null,
                informingDoctor: registerFields.informingDoctor || null,
                treatingDoctorId: registerFields.treatingDoctorId || null,
                treatingDoctorName: docName || null,
                remarks: registerFields.remarks || null,
                status: registerFields.status,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "OT") {
            const surgeonDoc = findDoctor(registerFields.surgeonId);
            const surgeonName = getDocName(surgeonDoc);
            const anaDoc = findDoctor(registerFields.anaesthetistId);
            const anaName = getDocName(anaDoc);
            await receptionApi.createOtEntry(
              {
                patientNo: res.patientNo,
                patientName,
                ipNo: registerFields.ipNo || null,
                procedureName: registerFields.procedureName,
                procedureType: registerFields.procedureType,
                startDateTime: registerFields.startDateTime,
                endDateTime: registerFields.endDateTime,
                surgeonId: registerFields.surgeonId || null,
                surgeonName: surgeonName || null,
                anaesthetistId: registerFields.anaesthetistId || null,
                anaesthetistName: anaName || null,
                scrubNurse: registerFields.scrubNurse || null,
                otRoomNo: registerFields.otRoomNo || null,
                anaesthesiaType: registerFields.anaesthesiaType || null,
                preOpDiagnosis: registerFields.preOpDiagnosis || null,
                postOpDiagnosis: registerFields.postOpDiagnosis || null,
                outcome: registerFields.outcome,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Maternity") {
            const doc = findDoctor(registerFields.assignedDoctorId);
            const docName = getDocName(doc);
            await receptionApi.createEddEntry(
              {
                patientNo: res.patientNo,
                patientName,
                ipOpNo: registerFields.ipOpNo || null,
                lmpDate: registerFields.lmpDate,
                eddByLmp: registerFields.eddByLmp,
                eddByUsg: registerFields.eddByUsg || null,
                gravida: registerFields.gravida
                  ? Number(registerFields.gravida)
                  : 0,
                para: registerFields.para ? Number(registerFields.para) : 0,
                living: registerFields.living
                  ? Number(registerFields.living)
                  : 0,
                abortion: registerFields.abortion
                  ? Number(registerFields.abortion)
                  : 0,
                assignedDoctorId: registerFields.assignedDoctorId || null,
                assignedDoctorName: docName || null,
                wardBed: registerFields.wardBed || null,
                remarks: registerFields.remarks || null,
                status: registerFields.status,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Consent") {
            const doc = findDoctor(registerFields.doctorId);
            const docName = getDocName(doc);
            await receptionApi.createConsentEntry(
              {
                patientNo: res.patientNo,
                patientName,
                ipOpNo: registerFields.ipOpNo || null,
                procedureName: registerFields.procedureName,
                consentType: registerFields.consentType,
                signedBy: registerFields.signedBy || patientName,
                guardianName: registerFields.guardianName || null,
                relationship: registerFields.relationship || null,
                doctorId: registerFields.doctorId || null,
                doctorName: docName || null,
                witnessName: registerFields.witnessName || null,
                consentDateTime: registerFields.consentDateTime,
                documentUrl: registerFields.documentUrl || null,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Death") {
            const doc = findDoctor(registerFields.certifyingDoctorId);
            const docName = getDocName(doc);
            await receptionApi.createDeathEntry(
              {
                patientNo: res.patientNo,
                patientName,
                age: patientAge,
                gender: patientGender,
                ipNo: registerFields.ipNo || null,
                wardBed: registerFields.wardBed || null,
                deathDateTime: registerFields.deathDateTime,
                primaryCause: registerFields.primaryCause,
                secondaryCause: registerFields.secondaryCause || null,
                manner: registerFields.manner,
                certifyingDoctorId: registerFields.certifyingDoctorId || null,
                certifyingDoctorName: docName || null,
                mlcLinked: registerFields.mlcLinked || null,
                mlcNo: registerFields.mlcNo || null,
                handoverStatus: registerFields.handoverStatus || null,
                handoverToName: registerFields.handoverToName || null,
                handoverToRelationship:
                  registerFields.handoverToRelationship || null,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Birth") {
            const doc = findDoctor(registerFields.deliveringDoctorId);
            const docName = getDocName(doc);
            await receptionApi.createBirthEntry(
              {
                motherPatientNo: res.patientNo,
                motherName: patientName,
                babyName: registerFields.babyName || `Baby of ${patientName}`,
                gender: registerFields.gender,
                birthDateTime: registerFields.birthDateTime,
                birthWeight: registerFields.birthWeight
                  ? Number(registerFields.birthWeight)
                  : null,
                deliveryType: registerFields.deliveryType,
                fatherName: registerFields.fatherName || null,
                fatherPhone: registerFields.fatherPhone || null,
                ward: registerFields.ward || null,
                bedNo: registerFields.bedNo || null,
                deliveringDoctorId: registerFields.deliveringDoctorId || null,
                deliveringDoctorName: docName || null,
                apgarScore1min: registerFields.apgarScore1min
                  ? Number(registerFields.apgarScore1min)
                  : null,
                apgarScore5min: registerFields.apgarScore5min
                  ? Number(registerFields.apgarScore5min)
                  : null,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Free") {
            const authDoc = findDoctor(registerFields.authorisedById);
            const authName =
              getDocName(authDoc) || registerFields.authorisedByName || "";
            await receptionApi.createFreePatientEntry(
              {
                patientNo: res.patientNo,
                patientName,
                ipOpNo: registerFields.ipOpNo || null,
                schemeName: registerFields.schemeName,
                servicesCovered: registerFields.servicesCovered,
                authorisedById: registerFields.authorisedById || null,
                authorisedByName: authName || null,
                approvalDate: registerFields.approvalDate,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Discharge") {
            const doc = findDoctor(registerFields.treatingDoctorId);
            const docName = getDocName(doc);
            await receptionApi.createDischargeEntry(
              {
                patientNo: res.patientNo,
                patientName,
                ipNo: registerFields.ipNo || `IP-${res.patientNo}`,
                admissionDate: registerFields.admissionDate,
                dischargeDateTime: registerFields.dischargeDateTime,
                treatingDoctorId: registerFields.treatingDoctorId || null,
                treatingDoctorName: docName || null,
                wardBed: registerFields.wardBed || null,
                diagnosis: registerFields.diagnosis,
                procedureDone: registerFields.procedureDone || null,
                dischargeType: registerFields.dischargeType,
                followUpDate: registerFields.followUpDate || null,
                finalBillAmount: registerFields.finalBillAmount
                  ? Number(registerFields.finalBillAmount)
                  : 0,
                billSettled: registerFields.billSettled,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "3C") {
            const doc = findDoctor(registerFields.assignedDoctorId);
            const docName = getDocName(doc);
            await receptionApi.createThreeCEntry(
              {
                patientNo: res.patientNo,
                patientName,
                age: patientAge,
                gender: patientGender,
                caseType: registerFields.caseType,
                arrivalDateTime: registerFields.arrivalDateTime,
                triageLevel: registerFields.triageLevel,
                chiefComplaint: registerFields.chiefComplaint,
                assignedDoctorId: registerFields.assignedDoctorId || null,
                assignedDoctorName: docName || null,
                referredFrom: registerFields.referredFrom || null,
                broughtBy: registerFields.broughtBy,
                bp: registerFields.bp || null,
                pulse: registerFields.pulse
                  ? Number(registerFields.pulse)
                  : null,
                temperature: registerFields.temperature
                  ? Number(registerFields.temperature)
                  : null,
                spo2: registerFields.spo2 ? Number(registerFields.spo2) : null,
                actionsTaken: registerFields.actionsTaken || null,
                status: registerFields.status,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          } else if (selectedRegister === "Insurance") {
            await receptionApi.createInsuranceBillEntry(
              {
                billNo: registerFields.billNo || `INS-${res.patientNo}`,
                patientNo: res.patientNo,
                patientName,
                ipNo: registerFields.ipNo || null,
                insurerName: registerFields.insurerName,
                policyNumber: registerFields.policyNumber,
                tpaName: registerFields.tpaName || null,
                schemeType: registerFields.schemeType,
                claimAmount: registerFields.claimAmount
                  ? Number(registerFields.claimAmount)
                  : 0,
                approvedAmount: registerFields.approvedAmount
                  ? Number(registerFields.approvedAmount)
                  : 0,
                balanceToPatient: registerFields.balanceToPatient
                  ? Number(registerFields.balanceToPatient)
                  : 0,
                claimStatus: registerFields.claimStatus,
                submissionDate: registerFields.submissionDate,
                settlementDate: registerFields.settlementDate || null,
                remarks: registerFields.remarks || null,
              },
              code,
            );
            registerEnrolled = true;
          }

          if (registerEnrolled) {
            toast.success(
              `Patient successfully enrolled in ${selectedRegister} Register.`,
            );
          }
        } catch (regErr: any) {
          toast.error(
            `Patient registered, but IPD Patients enrollment failed: ${regErr.message || regErr}`,
          );
        }
      }

      setSelectedRegister("None");
      setRegisterFields({});
      setForm(EMPTY_FORM);
      setErrors({});
    } catch {
      toast.error("Registration failed. Check server connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-5 animate-fade-in"
      data-ocid="receptionist.register_patient"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-xs">
            <UserPlus className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
              Patient Registration
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Register patients and manage digital medical records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/5 px-3.5 py-1.5 rounded-lg shadow-2xs"
          >
            Next ID: {idRef.current}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs px-3.5 py-1.5 rounded-lg shadow-2xs bg-muted/20"
          >
            {today}
          </Badge>
        </div>
      </div>

      {/* ── Success banner ── */}
      {lastReg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm flex-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {[lastReg.firstName, lastReg.lastName].filter(Boolean).join(" ")}
            </span>
            <span className="text-muted-foreground">
              {" "}
              registered successfully as{" "}
            </span>
            <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
              {lastReg.patientNo}
            </span>
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setLastReg(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="w-full">
        {/* ── Form ── */}
        <div className="w-full">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-muted/40 p-1 rounded-xl border border-border/80 mb-5 shadow-xs h-11">
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

              {/* IDENTITY */}
              <TabsContent
                value="identity"
                className="focus-visible:outline-none"
              >
                <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-5 shadow-subtle">
                  <SectionTitle title="Personal Information" icon={User} />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <F label="First Name" required>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.firstName}
                          onChange={(e) => field("firstName", e.target.value)}
                          placeholder="Rahul"
                          className={`pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 ${
                            errors.firstName
                              ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive"
                              : ""
                          }`}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-[10px] text-destructive mt-1 font-medium">
                          {errors.firstName}
                        </p>
                      )}
                    </F>
                    <F label="Middle Name">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.middleName}
                          onChange={(e) => field("middleName", e.target.value)}
                          placeholder="Optional"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Last Name">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.lastName}
                          onChange={(e) => field("lastName", e.target.value)}
                          placeholder="Sharma"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Gender">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Select
                          value={form.gender}
                          onValueChange={(v) => field("gender", v)}
                        >
                          <SelectTrigger className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </F>
                    <F label="Date of Birth">
                      <Input
                        type="date"
                        value={form.dob}
                        onChange={(e) => field("dob", e.target.value)}
                        className="h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                      />
                    </F>
                    <F label="Register Date">
                      <Input
                        type="date"
                        value={form.registerDate}
                        onChange={(e) => field("registerDate", e.target.value)}
                        className="h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                      />
                    </F>
                    <F label="Calculated Age">
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <div className="h-10 flex items-center pl-9 pr-3 border border-border rounded-md bg-muted/20 text-sm font-semibold text-foreground">
                          {ageText ? (
                            ageText
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">
                              —
                            </span>
                          )}
                        </div>
                      </div>
                    </F>
                    <F label="Referred By" span="min-w-0">
                      <div className="relative min-w-0 w-full">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Select
                          value={form.referredBy}
                          onValueChange={(v) => field("referredBy", v)}
                        >
                          <SelectTrigger className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 text-left w-full truncate">
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
                            {doctors.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No active doctors found
                              </SelectItem>
                            ) : (
                              doctors.map((doc: any) => {
                                const rawName =
                                  doc.name ||
                                  [doc.firstName, doc.lastName]
                                    .filter(Boolean)
                                    .join(" ") ||
                                  doc.email ||
                                  "Unassigned Doctor";
                                const name = rawName
                                  .toLowerCase()
                                  .startsWith("dr.")
                                  ? rawName
                                  : `Dr. ${rawName}`;
                                return (
                                  <SelectItem
                                    key={doc.id || doc.email || name}
                                    value={name}
                                  >
                                    {name} ({doc.specialization || "Physician"})
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </F>
                    <F label="Language">
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.language}
                          onChange={(e) => field("language", e.target.value)}
                          placeholder="Hindi"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                  </div>

                  <SectionTitle title="Contact Details" icon={Phone} />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <F label="Phone" span="col-span-1 md:col-span-2">
                      <PhoneInput
                        value={form.phone}
                        onChange={(val) => field("phone", val)}
                        className="h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 bg-zinc-50"
                      />
                    </F>
                    <F
                      label="Alternative Number"
                      span="col-span-1 md:col-span-2"
                    >
                      <PhoneInput
                        value={form.alternativeNum}
                        onChange={(val) => field("alternativeNum", val)}
                        className="h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 bg-zinc-50"
                      />
                    </F>
                    <F label="Email" span="col-span-1 md:col-span-2">
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => field("email", e.target.value)}
                          placeholder="patient@email.com"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Country" span="col-span-1 md:col-span-2">
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Select
                          value={form.country}
                          onValueChange={(v) => field("country", v)}
                        >
                          <SelectTrigger className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </F>
                    <F label="Place / PIN" span="col-span-1 md:col-span-2">
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.placePin}
                          onChange={(e) => field("placePin", e.target.value)}
                          placeholder="City or PIN"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Aadhar No." span="col-span-1 md:col-span-2">
                      <div className="relative">
                        <Fingerprint className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.aadhar}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9\s-]*$/.test(val)) {
                              if (val.replace(/[\s-]/g, "").length <= 12) {
                                field("aadhar", val);
                              }
                            }
                          }}
                          placeholder="12-digit Aadhar"
                          className={`pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 ${
                            form.aadhar &&
                            !/^\d{12}$/.test(form.aadhar.replace(/[\s-]/g, ""))
                              ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive"
                              : ""
                          }`}
                        />
                      </div>
                      {form.aadhar &&
                        !/^\d{12}$/.test(form.aadhar.replace(/[\s-]/g, "")) && (
                          <p className="text-[10px] text-destructive mt-1 font-medium">
                            Aadhar number must be exactly 12 digits
                          </p>
                        )}
                    </F>
                    <F label="Address" span="col-span-1 md:col-span-4">
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Textarea
                          value={form.address}
                          onChange={(e) => field("address", e.target.value)}
                          rows={3}
                          placeholder="House, Street, Area..."
                          className="pl-9 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 min-h-[80px]"
                        />
                      </div>
                    </F>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("medical")}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      Next: Medical Details{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* MEDICAL */}
              <TabsContent
                value="medical"
                className="focus-visible:outline-none"
              >
                <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-5 shadow-subtle">
                  <SectionTitle
                    title="Physical & Background"
                    icon={HeartPulse}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <F label="Blood Group">
                      <div className="relative">
                        <HeartPulse className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500/70 z-10 pointer-events-none" />
                        <Select
                          value={form.bloodGroup}
                          onValueChange={(v) => field("bloodGroup", v)}
                        >
                          <SelectTrigger className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500">
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
                      </div>
                    </F>
                    <F label="Height (cm)">
                      <div className="relative">
                        <Activity className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.height}
                          onChange={(e) => field("height", e.target.value)}
                          placeholder="165"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Weight (kg)">
                      <div className="relative">
                        <Activity className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.weight}
                          onChange={(e) => field("weight", e.target.value)}
                          placeholder="60"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>

                    <F label="Education" span="col-span-1 md:col-span-2">
                      <div className="relative">
                        <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.education}
                          onChange={(e) => field("education", e.target.value)}
                          placeholder="Graduate"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Occupation" span="col-span-1 md:col-span-2">
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.occupation}
                          onChange={(e) => field("occupation", e.target.value)}
                          placeholder="Engineer"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                  </div>

                  <SectionTitle title="Clinical Notes" icon={FileText} />
                  <div className="grid grid-cols-1 gap-4">
                    <F label="Permanent Diagnosis">
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.permanentDiagnosis}
                          onChange={(e) =>
                            field("permanentDiagnosis", e.target.value)
                          }
                          placeholder="e.g. Type 2 Diabetes, Hypertension"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="⚠ Allergies / Hyper Sensitivity">
                      <div className="relative">
                        <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/80 z-10 pointer-events-none" />
                        <Input
                          value={form.hyperSensitivity}
                          onChange={(e) =>
                            field("hyperSensitivity", e.target.value)
                          }
                          placeholder="e.g. Penicillin, Peanuts"
                          className="pl-9 h-10 text-sm border-orange-400/50 focus:border-orange-500 focus-visible:ring-orange-500/10 focus-visible:border-orange-500"
                        />
                      </div>
                    </F>
                    <F label="Vices / Habits">
                      <div className="relative">
                        <Info className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.vicesHabits}
                          onChange={(e) => field("vicesHabits", e.target.value)}
                          placeholder="Smoking, Alcohol"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Important Clinical Notes">
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 absolute left-3 top-3 text-teal-600 dark:text-teal-400 z-10 pointer-events-none" />
                        <Textarea
                          value={form.importantNotes}
                          onChange={(e) =>
                            field("importantNotes", e.target.value)
                          }
                          rows={2}
                          placeholder="Critical info for treating physician..."
                          className="pl-9 text-sm border-teal-500/30 bg-teal-500/5 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 min-h-[60px]"
                        />
                      </div>
                    </F>
                    <F label="General Notes">
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Textarea
                          value={form.notes}
                          onChange={(e) => field("notes", e.target.value)}
                          rows={2}
                          placeholder="Additional remarks..."
                          className="pl-9 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 min-h-[60px]"
                        />
                      </div>
                    </F>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("identity")}
                      className="border-teal-600/30 text-teal-700 hover:bg-teal-500/5 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back: Identity
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("insurance")}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      Next: Insurance Details{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* INSURANCE */}
              <TabsContent
                value="insurance"
                className="focus-visible:outline-none"
              >
                <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-5 shadow-subtle">
                  <SectionTitle title="Insurance Details" icon={Shield} />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <F
                      label="Insurance Company"
                      span="col-span-1 md:col-span-2"
                    >
                      <div className="relative">
                        <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 z-10 pointer-events-none" />
                        <Input
                          value={form.insuranceCompany}
                          onChange={(e) =>
                            field("insuranceCompany", e.target.value)
                          }
                          placeholder="e.g. Star Health"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Insurance Date">
                      <Input
                        type="date"
                        value={form.insuranceDate}
                        onChange={(e) => field("insuranceDate", e.target.value)}
                        className="h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                      />
                    </F>
                    <F label="Coverage Amount (₹)">
                      <div className="relative">
                        <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          type="number"
                          value={form.insuranceAmount}
                          onChange={(e) =>
                            field("insuranceAmount", e.target.value)
                          }
                          placeholder="500000"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F
                      label="Reference / Policy No."
                      span="col-span-1 md:col-span-2"
                    >
                      <div className="relative">
                        <FileText className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.insuranceRefNo}
                          onChange={(e) =>
                            field("insuranceRefNo", e.target.value)
                          }
                          placeholder="Policy ID"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                  </div>

                  <SectionTitle title="Socioeconomic" icon={Briefcase} />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <F label="Income">
                      <div className="relative">
                        <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.income}
                          onChange={(e) => field("income", e.target.value)}
                          placeholder="Annual"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Religion">
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.religion}
                          onChange={(e) => field("religion", e.target.value)}
                          placeholder="e.g. Hindu"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <div className="col-span-1 md:col-span-2 flex items-center pt-5">
                      <div className="flex items-center gap-2.5 p-3.5 bg-muted/40 rounded-xl border border-border/80 w-full hover:bg-muted/60 transition-colors">
                        <Checkbox
                          id="foc"
                          checked={form.freeOfCost}
                          onCheckedChange={(c) => field("freeOfCost", !!c)}
                          className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                        />
                        <Label
                          htmlFor="foc"
                          className="text-sm font-semibold cursor-pointer flex-1"
                        >
                          Free Of Cost Patient
                        </Label>
                        {form.freeOfCost && (
                          <Badge className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-2xs">
                            Waived
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("medical")}
                      className="border-teal-600/30 text-teal-700 hover:bg-teal-500/5 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back: Medical
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("consent")}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      Next: Patient Consent{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* CONSENT */}
              <TabsContent
                value="consent"
                className="focus-visible:outline-none"
              >
                <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-5 shadow-subtle">
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
                      representative/guardian) hereby grant full authorization
                      and voluntary consent to the attending medical
                      practitioners, registered nurses, and clinical specialists
                      of this institution to perform necessary physical
                      examinations, laboratory diagnostics, diagnostic imaging,
                      and general clinical treatments.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Furthermore, in the event of an emergency requiring
                      immediate surgical operations, anesthesia, or critical
                      care support, I authorize the clinical team to proceed
                      with all standard resuscitative and operative procedures
                      deemed necessary by professional medical consensus to
                      safeguard the patient's health and life.
                    </p>
                    <div className="pt-2 border-t border-teal-500/10 flex items-start gap-3">
                      <Checkbox
                        id="consentAgreed"
                        checked={!!form.consentAgreed}
                        onCheckedChange={(checked) =>
                          field("consentAgreed", !!checked)
                        }
                        className="mt-0.5 border-teal-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                      />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="consentAgreed"
                          className="text-xs font-bold text-foreground cursor-pointer"
                        >
                          I agree to the terms of medical treatment and
                          operation consent
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Checking this box acts as a binding digital signature
                          of clinical consent.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Representative and Date Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F
                      label="Authorized Signee Name"
                      required={!!form.consentAgreed}
                    >
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10 pointer-events-none" />
                        <Input
                          value={form.consentSigneeName}
                          onChange={(e) =>
                            field("consentSigneeName", e.target.value)
                          }
                          placeholder="e.g. Rahul Sharma"
                          className="pl-9 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                        />
                      </div>
                    </F>
                    <F label="Consent Date" required={!!form.consentAgreed}>
                      <Input
                        type="date"
                        value={form.consentDate}
                        onChange={(e) => field("consentDate", e.target.value)}
                        className="h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500 bg-zinc-50"
                      />
                    </F>
                  </div>

                  <div className="flex justify-start pt-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("insurance")}
                      className="border-teal-600/30 text-teal-700 hover:bg-teal-500/5 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back: Insurance
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-5 text-sm font-semibold hover:bg-muted/40"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setErrors({});
                }}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 px-6 text-sm gap-2 shadow-lg shadow-teal-500/20 active:translate-y-[1px] transition-transform duration-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Patient...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Patient
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

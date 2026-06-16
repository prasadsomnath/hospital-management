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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { Medicine, Prescription } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  Printer,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Thrice daily",
  "Morning only",
  "Evening only",
  "As needed",
];
const DURATIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "30 days",
  "60 days",
  "90 days",
];
const DOSAGES = [
  "1/4 tablet",
  "1/2 tablet",
  "1 tablet",
  "1.5 tablets",
  "2 tablets",
  "3 tablets",
  "1 capsule",
  "2 capsules",
  "5 ml",
  "10 ml",
  "15 ml",
  "1 sachet",
  "1 drop",
  "2 drops",
];

function emptyMedicine(): Medicine {
  return {
    name: "",
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "7 days",
  };
}

function PrescriptionCard({
  rx,
  status,
  onEdit,
  onDelete,
}: {
  rx: any;
  status: string;
  onEdit: (rx: any) => void;
  onDelete: (rx: any) => void;
}) {
  const medicines = rx.medicines || [
    {
      name: rx.medicationName || "Antibiotics",
      dosage: rx.dosage || "1 tab",
      frequency: rx.frequency || "Once daily",
      duration: rx.duration || "5 days",
    },
  ];
  return (
    <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border">
      <div className="flex items-start justify-between px-5 py-4 border-b border-border gap-3">
        <div>
          <p className="font-semibold text-foreground">
            {rx.patientName || `Patient Registry: ${rx.patientNo}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            ID: {rx.prescriptionNo || rx.id} · Issued:{" "}
            {rx.datePrescribed || rx.date || "2026-05-16"}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] uppercase font-semibold ${
              status.toUpperCase() === "DISPENSED"
                ? "border-green-500/30 text-green-600 bg-green-500/10 dark:text-green-400 dark:bg-green-950/20"
                : "border-amber-500/30 text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-950/20"
            }`}
          >
            {status}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] border-primary/30 text-primary bg-primary/10"
          >
            {medicines.length} medicine(s)
          </Badge>
        </div>
      </div>
      <div className="px-5 py-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Diagnosis / Indication
        </p>
        <p className="text-xs text-foreground font-semibold">
          {rx.diagnosis || "Clinical check-up & intervention"}
        </p>
      </div>
      <div className="px-5 pb-4">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Medicines
        </p>
        <div className="space-y-1.5">
          {medicines.map((m: any, idx: number) => (
            <div
              key={`${m.name}-${idx}`}
              className="flex items-center gap-2 text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="font-semibold text-foreground">{m.name}</span>
              <span className="text-muted-foreground text-[10px]">
                · Dose: {m.dosage} · Freq: {m.frequency} · Duration:{" "}
                {m.duration}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground italic">
            📝 Authorized Clinician: {rx.doctorName || "Dr. Marcus Chen"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={status.toUpperCase() === "DISPENSED"}
              className="h-7 w-7 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-950/20 disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => onEdit(rx)}
              title={
                status.toUpperCase() === "DISPENSED"
                  ? "Dispensed prescription cannot be edited"
                  : "Edit Prescription"
              }
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={status.toUpperCase() === "DISPENSED"}
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => onDelete(rx)}
              title={
                status.toUpperCase() === "DISPENSED"
                  ? "Dispensed prescription cannot be deleted"
                  : "Delete Prescription"
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  patientName,
  diagnosis,
  medicines,
  notes,
  nextVisit,
  doctorName,
}: {
  patientName: string;
  diagnosis: string;
  medicines: Medicine[];
  notes: string;
  nextVisit: string;
  doctorName: string;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-foreground font-display">
            HealthMatrix360 Hospital Clinical Rx
          </h4>
          <p className="text-xs text-muted-foreground">
            {doctorName} · Clinical Department
          </p>
        </div>
        <ClipboardList className="w-6 h-6 text-primary" />
      </div>
      <Separator className="bg-border" />
      <div>
        <p className="text-xs text-muted-foreground">Patient Registry</p>
        <p className="font-semibold text-foreground text-sm">
          {patientName || "—"}
        </p>
        {nextVisit && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Next Visit: {nextVisit}
          </p>
        )}
      </div>
      {diagnosis && (
        <div>
          <p className="text-xs text-muted-foreground">Diagnosis</p>
          <p className="text-xs text-foreground font-semibold">{diagnosis}</p>
        </div>
      )}
      {medicines.filter((m) => m.name).length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Rx Interventions
          </p>
          <div className="space-y-2">
            {medicines
              .filter((m) => m.name)
              .map((m, i) => (
                <div key={`${m.name}-${i}`} className="text-xs">
                  <span className="font-semibold text-foreground">
                    {i + 1}. {m.name}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    — Dose: {m.dosage}, Freq: {m.frequency}, Duration:{" "}
                    {m.duration}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
      {notes && (
        <div className="bg-muted/20 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Instructions</p>
          <p className="text-xs text-foreground italic">{notes}</p>
        </div>
      )}
    </div>
  );
}

export default function Prescriptions() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [nextVisit, setNextVisit] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([emptyMedicine()]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live and static combined prescription list
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editingRxNo, setEditingRxNo] = useState("");
  const [rxDetails, setRxDetails] = useState<Record<string, any>>({});
  const [medicineCatalog, setMedicineCatalog] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Fetch medicines catalog for current doctor
  useEffect(() => {
    const fetchMedicineCatalog = async () => {
      const doctorIdStr = user?.id || "1";
      const doctorId = isNaN(Number(doctorIdStr)) ? 1 : Number(doctorIdStr);
      const hospitalCode = user?.hospitalCode || "HSP001";
      const cacheKey = `medicines-doctor-${doctorId}-${hospitalCode}`;

      // Load cache first so it renders instantly
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setMedicineCatalog(JSON.parse(cached));
        } catch (jsonErr) {
          console.error("Error parsing cached medicines", jsonErr);
        }
      }

      try {
        const res = await apiFetch<any[]>(`/doctor/medicines`, {
          params: { doctorId: String(doctorId) },
          headers: { "X-Hospital-Code": hospitalCode },
        });
        const list = (res || []).map((m: any) => ({
          medicineName: m.medicineName || m.name || "",
          type: m.type || "",
          company: m.company || "",
          dosage: m.dosage || "",
        }));
        localStorage.setItem(cacheKey, JSON.stringify(list));
        setMedicineCatalog(list);
      } catch (e) {
        console.warn(
          "Failed to load medicines catalog in prescriptions, using cached list if available.",
          e,
        );
      }
    };
    if (user && showForm) {
      fetchMedicineCatalog();
    }
  }, [user, showForm]);

  // Fetch patients list
  useEffect(() => {
    const fetchPatientsList = async () => {
      try {
        const code = user?.hospitalCode || "HSP001";
        const data = await apiFetch<any>("/doctor/patients", {
          headers: { "X-Hospital-Code": code },
        });
        const patientsList = Array.isArray(data) ? data : data?.content || [];
        setPatients(patientsList);
      } catch (e) {
        console.warn("Failed to fetch patients list", e);
      }
    };
    fetchPatientsList();
  }, [user]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters/patient changes
  useEffect(() => {
    setPage(0);
  }, [patientId]);

  const selectedPatient = patients.find(
    (p) => (p.patientNo || p.id) === patientId,
  );

  const paginatedPrescriptions = prescriptions.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  const fetchPrescriptions = async () => {
    try {
      const targetNo =
        selectedPatient?.patientNo || selectedPatient?.id || patientId || "all";
      const data = await apiFetch<any>(`/doctor/prescriptions/${targetNo}`, {
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });
      const rxList = Array.isArray(data) ? data : data?.content || [];
      if (rxList && rxList.length > 0) {
        const grouped: Record<string, any> = {};
        for (const item of rxList) {
          const rxNo = item.prescriptionNo || `TEMP-${item.id}`;
          const p = patients.find(
            (pat) =>
              (pat.patientNo || pat.id) === item.patientNo ||
              String(pat.id) === String(item.patientNo),
          );
          const patientNameVal = p
            ? p.firstName
              ? `${p.firstName} ${p.lastName || ""}`.trim()
              : p.name
            : `Registry ID: ${item.patientNo}`;

          if (!grouped[rxNo]) {
            grouped[rxNo] = {
              id: item.id,
              prescriptionNo: rxNo,
              patientName: patientNameVal,
              patientNo: item.patientNo,
              date: item.datePrescribed,
              doctorName: item.doctorName,
              diagnosis: "Clinical prescription check",
              medicines: [],
            };
          }

          grouped[rxNo].medicines.push({
            name: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
          });
        }
        setPrescriptions(Object.values(grouped));
      } else {
        setPrescriptions([]);
      }
    } catch (e) {
      console.warn("Failed to fetch prescriptions from backend service.", e);
      setPrescriptions([]);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, user, patients]);

  // Fetch pharmacy details/status for the paginated prescriptions to detect if dispensed
  useEffect(() => {
    let active = true;
    const fetchStatuses = async () => {
      const missing = paginatedPrescriptions
        .map((rx) => rx.prescriptionNo)
        .filter((no) => no && !rxDetails[no]);
      if (missing.length === 0) return;

      const fetched: Record<string, any> = {};
      await Promise.all(
        missing.map(async (no) => {
          try {
            const rxData = await apiFetch<any>(
              `/pharmacy/prescriptions/${no}`,
              {
                headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
              },
            );
            fetched[no] = rxData;
          } catch (e: any) {
            const errMsg = e?.message || "";
            if (
              errMsg.includes("404") ||
              errMsg.toLowerCase().includes("not found")
            ) {
              fetched[no] = { status: "Cancelled", prescriptionItems: [] };
            } else {
              fetched[no] = { status: "Pending", prescriptionItems: [] };
            }
          }
        }),
      );

      if (active) {
        setRxDetails((prev) => ({ ...prev, ...fetched }));
      }
    };
    if (paginatedPrescriptions.length > 0) {
      fetchStatuses();
    }
    return () => {
      active = false;
    };
  }, [paginatedPrescriptions, user, rxDetails]);

  function addMedicineRow() {
    setMedicines((prev) => [...prev, emptyMedicine()]);
  }

  function removeMedicineRow(idx: number) {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateMedicine(idx: number, field: keyof Medicine, value: string) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteClick = async (rx: any) => {
    const rxNo = rx.prescriptionNo;
    const status = rxDetails[rxNo]?.status || "Pending";
    if (status.toUpperCase() === "DISPENSED") {
      toast.error("Cannot delete a dispensed prescription.");
      return;
    }

    if (
      !window.confirm(`Are you sure you want to delete prescription ${rxNo}?`)
    ) {
      return;
    }

    try {
      // 1. Delete in pharmacy first to guard dispensing status
      try {
        await apiFetch(`/pharmacy/prescriptions/${rxNo}`, {
          method: "DELETE",
          headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
        });
      } catch (err: any) {
        // If the prescription is not found in the pharmacy queue (e.g. legacy/manually created record),
        // we can safely bypass this deletion and proceed to delete from doctor-service.
        if (
          err.message &&
          (err.message.includes("404") ||
            err.message.toLowerCase().includes("not found"))
        ) {
          console.warn(
            "Prescription not found in pharmacy, proceeding with doctor-service deletion.",
          );
        } else {
          throw err;
        }
      }

      // 2. Delete in doctor service
      await apiFetch(`/doctor/prescriptions/by-number/${rxNo}`, {
        method: "DELETE",
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });

      toast.success("Prescription deleted successfully!");
      fetchPrescriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete prescription");
    }
  };

  const handleEditClick = (rx: any) => {
    const rxNo = rx.prescriptionNo;
    const status = rxDetails[rxNo]?.status || "Pending";
    if (status.toUpperCase() === "DISPENSED") {
      toast.error("Cannot edit a dispensed prescription.");
      return;
    }

    setPatientId(rx.patientNo);

    // Extract notes/instructions from pharmacy prescription details
    let notesVal = "";
    const firstItem = rxDetails[rxNo]?.prescriptionItems?.[0];
    if (firstItem?.instructions) {
      const idx = firstItem.instructions.indexOf(" | Notes: ");
      if (idx !== -1) {
        notesVal = firstItem.instructions.substring(idx + 10);
      }
    }
    setNotes(notesVal);
    setDiagnosis(rx.diagnosis || "Clinical prescription check");

    setMedicines(
      rx.medicines.map((m: any) => ({
        name: m.name,
        dosage: m.dosage || "1 tablet",
        frequency: m.frequency || "Once daily",
        duration: m.duration || "7 days",
      })),
    );

    setIsEditing(true);
    setEditingRxNo(rxNo);
    setShowForm(true);

    const el = document.getElementById("clinical-prescription-composer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRxNo("");
    setPatientId("");
    setDiagnosis("");
    setNotes("");
    setMedicines([emptyMedicine()]);
    setShowForm(false);
  };

  const handleSubmitAndIssue = async () => {
    if (!patientId) {
      toast.error("Please select a patient row first!");
      return;
    }
    const validMedicines = medicines.filter((m) => m.name.trim() !== "");
    if (validMedicines.length === 0) {
      toast.error("Please enter at least one valid medicine name!");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetNo =
        selectedPatient?.patientNo || selectedPatient?.id || patientId;
      const rxNo =
        isEditing && editingRxNo
          ? editingRxNo
          : "RX-" + Math.random().toString(36).substring(2, 10).toUpperCase();

      // If editing, delete first
      if (isEditing && editingRxNo) {
        // 1. Delete in pharmacy first to ensure it's still PENDING and can be deleted/modified.
        try {
          await apiFetch(`/pharmacy/prescriptions/${editingRxNo}`, {
            method: "DELETE",
            headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
          });
        } catch (err: any) {
          // If the prescription is not found in the pharmacy queue (e.g. legacy record),
          // we can safely bypass this deletion and continue.
          if (
            err.message &&
            (err.message.includes("404") ||
              err.message.toLowerCase().includes("not found"))
          ) {
            console.warn(
              "Prescription not found in pharmacy, proceeding with edit.",
            );
          } else {
            throw err;
          }
        }

        // 2. If pharmacy delete succeeds, we can delete in doctor-service.
        await apiFetch(`/doctor/prescriptions/by-number/${editingRxNo}`, {
          method: "DELETE",
          headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
        });
      }

      // 1. Submit individually to Doctor Service
      for (const m of validMedicines) {
        const payload = {
          prescriptionNo: rxNo,
          patientNo: targetNo,
          doctorName: `Dr. ${user?.name || "Marcus Chen"}`,
          medicationName: m.name,
          strength: "Standard",
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
        };
        await apiFetch("/doctor/prescriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
          },
          body: JSON.stringify(payload),
        });
      }

      const patientNameVal = selectedPatient
        ? selectedPatient.firstName
          ? `${selectedPatient.firstName} ${selectedPatient.lastName || ""}`.trim()
          : selectedPatient.name
        : "Unknown Patient";

      // 2. Submit aggregated payload to Pharmacy Service
      const pharmacyPayload = {
        prescriptionNo: rxNo,
        patientNo: targetNo,
        patientName: patientNameVal,
        doctorId: user?.id || "DOC001",
        doctorName: `Dr. ${user?.name || "Marcus Chen"}`,
        prescriptionDate: new Date().toISOString().split("T")[0],
        prescriptionItems: validMedicines.map((m) => {
          // Extract numeric days if possible
          const daysMatch = m.duration.match(/\d+/);
          const days = daysMatch ? Number.parseInt(daysMatch[0], 10) : 7;
          // Extract numeric dosage if possible
          const doseMatch = m.dosage.match(/\d+/);
          const doseAmt = doseMatch ? Number.parseInt(doseMatch[0], 10) : 1;
          // Determine multiplier based on frequency
          let freqMult = 1;
          if (m.frequency.toLowerCase().includes("twice")) freqMult = 2;
          if (m.frequency.toLowerCase().includes("thrice")) freqMult = 3;

          return {
            medicineName: m.name,
            dosage: m.dosage,
            duration: m.duration,
            quantityPrescribed: days * doseAmt * freqMult,
            instructions:
              `Freq: ${m.frequency}` + (notes ? ` | Notes: ${notes}` : ""),
          };
        }),
      };

      await apiFetch("/pharmacy/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
        },
        body: JSON.stringify(pharmacyPayload),
      });

      toast.success(
        isEditing
          ? "Prescription changes successfully saved and sent to Pharmacy Queue!"
          : "Prescriptions successfully written and sent to Pharmacy Queue!",
      );

      // Clear form states and editing states
      setIsEditing(false);
      setEditingRxNo("");
      setPatientId("");
      setShowForm(false);
      setDiagnosis("");
      setNotes("");
      setMedicines([emptyMedicine()]);
      fetchPrescriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit prescriptions");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-ocid="doctor.prescriptions.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Prescriptions Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {prescriptions.length} prescriptions issued dynamically across this
            hospital
          </p>
        </div>
        <Button
          data-ocid="doctor.prescriptions.new.button"
          className="bg-teal-500 hover:bg-teal-600 text-white gap-2 font-semibold shadow-md transition-all duration-300"
          onClick={() => {
            if (isEditing) {
              handleCancelEdit();
            } else {
              if (showForm) {
                setPatientId("");
              }
              setShowForm((v) => !v);
            }
          }}
        >
          {isEditing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isEditing
            ? "Cancel Edit"
            : showForm
              ? "Hide Form"
              : "Compose Prescription"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          id="clinical-prescription-composer"
          className="glass-elevated rounded-xl shadow-glass-sm overflow-hidden border border-border"
        >
          <div className="px-5 py-4 border-b border-border bg-primary/5">
            <h3 className="font-semibold text-foreground text-sm">
              {isEditing
                ? `Edit Prescription: ${editingRxNo}`
                : "Clinical Prescription Composer"}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Input items, view live, and submit to the central clinical
              repository
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-5 bg-card">
            {/* Form left */}
            <div className="space-y-4">
              {/* Patient */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Patient Registry File *
                </Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger
                    data-ocid="doctor.rx.patient.select"
                    className="bg-muted/20 border-border text-xs h-9"
                  >
                    <SelectValue placeholder="Select target patient profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => {
                      const pId = p.patientNo || p.id;
                      const pName = p.firstName
                        ? `${p.firstName} ${p.lastName || ""}`.trim()
                        : p.name || "Patient";
                      return (
                        <SelectItem key={pId} value={pId}>
                          {pName} ({pId})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Diagnosis / Clinical Indication *
                </Label>
                <Input
                  data-ocid="doctor.rx.diagnosis.input"
                  placeholder="e.g. Hypertension Stage 2"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="bg-muted/20 border-border text-xs h-9"
                />
              </div>

              {/* Medicines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Prescribed Medications
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-ocid="doctor.rx.add_medicine.button"
                    className="text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-950/20 gap-1 h-7 font-medium"
                    onClick={addMedicineRow}
                  >
                    <Plus className="w-3 h-3" /> Add Medication
                  </Button>
                </div>
                <div className="space-y-2">
                  {medicines.map((m, idx) => (
                    <div
                      key={idx}
                      data-ocid={`doctor.rx.medicine.item.${idx + 1}`}
                      className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border bg-muted/10"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Medication name (e.g. Aspirin)"
                            value={m.name}
                            onChange={(e) => {
                              updateMedicine(idx, "name", e.target.value);
                              setActiveDropdown(idx);
                            }}
                            onFocus={() => setActiveDropdown(idx)}
                            onBlur={() => {
                              setTimeout(() => setActiveDropdown(null), 200);
                            }}
                            className="bg-muted/20 border-border h-8 text-xs w-full"
                          />
                          {activeDropdown === idx && (
                            <div className="absolute z-[100] left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg divide-y divide-border/30">
                              {medicineCatalog.filter((item) =>
                                item.medicineName
                                  .toLowerCase()
                                  .includes(m.name.toLowerCase()),
                              ).length === 0 ? (
                                <div className="px-3 py-2 text-xs text-muted-foreground italic bg-popover">
                                  No matching medicines found
                                </div>
                              ) : (
                                medicineCatalog
                                  .filter((item) =>
                                    item.medicineName
                                      .toLowerCase()
                                      .includes(m.name.toLowerCase()),
                                  )
                                  .map((item, itemIdx) => (
                                    <button
                                      key={itemIdx}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex flex-col gap-0.5 bg-popover"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        updateMedicine(
                                          idx,
                                          "name",
                                          item.medicineName,
                                        );
                                        if (item.dosage) {
                                          updateMedicine(
                                            idx,
                                            "dosage",
                                            item.dosage,
                                          );
                                        }
                                        setActiveDropdown(null);
                                      }}
                                    >
                                      <span className="font-semibold text-foreground">
                                        {item.medicineName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {item.type || "Medication"}
                                        {item.company
                                          ? ` · ${item.company}`
                                          : ""}
                                        {item.dosage ? ` · ${item.dosage}` : ""}
                                      </span>
                                    </button>
                                  ))
                              )}
                            </div>
                          )}
                        </div>
                        <Select
                          value={m.dosage}
                          onValueChange={(v) =>
                            updateMedicine(idx, "dosage", v)
                          }
                        >
                          <SelectTrigger className="bg-muted/20 border-border h-8 text-[10px] w-32">
                            <SelectValue placeholder="Dosage" />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            side="bottom"
                            sideOffset={4}
                            avoidCollisions={false}
                            className="max-h-[160px] overflow-y-auto"
                          >
                            {DOSAGES.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {medicines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-ocid={`doctor.rx.remove_medicine.${idx + 1}`}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => removeMedicineRow(idx)}
                            aria-label="Remove medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <Select
                        value={m.frequency}
                        onValueChange={(v) =>
                          updateMedicine(idx, "frequency", v)
                        }
                      >
                        <SelectTrigger className="bg-muted/20 border-border h-8 text-[10px]">
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={m.duration}
                        onValueChange={(v) =>
                          updateMedicine(idx, "duration", v)
                        }
                      >
                        <SelectTrigger className="bg-muted/20 border-border h-8 text-[10px]">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Special Instructions / Dietary Notes
                </Label>
                <Textarea
                  data-ocid="doctor.rx.notes.textarea"
                  placeholder="e.g. Take after meals. Restrict sodium."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-muted/20 border-border resize-none text-xs"
                  rows={2}
                />
              </div>

              {/* Next visit */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Recommended Next Consultation Date
                </Label>
                <Input
                  type="date"
                  data-ocid="doctor.rx.next_visit.input"
                  value={nextVisit}
                  onChange={(e) => setNextVisit(e.target.value)}
                  className="bg-muted/20 border-border text-xs h-8"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="doctor.rx.preview.button"
                  className="gap-2 border-teal-500/30 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-950/20 text-xs h-8 font-medium"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Rx
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  className="gap-2 bg-teal-500 hover:bg-teal-600 text-white text-xs h-8 font-semibold"
                  onClick={handleSubmitAndIssue}
                >
                  <Send className="w-3.5 h-3.5" />{" "}
                  {isEditing ? "Save Changes" : "Submit & Issue"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border text-muted-foreground text-xs h-8"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  data-ocid="doctor.rx.print.button"
                  className="gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs h-8 font-medium transition-colors"
                  onClick={handlePrint}
                >
                  <Printer className="w-3.5 h-3.5" /> Print Face Sheet
                </Button>
              </div>
            </div>

            {/* Preview right */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Real-Time Clinical Preview
              </p>
              <PreviewCard
                patientName={selectedPatient?.name ?? "No Patient Selected"}
                diagnosis={diagnosis}
                medicines={medicines}
                notes={notes}
                nextVisit={nextVisit}
                doctorName={`Dr. ${user?.name || "Marcus Chen"}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Prescription list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paginatedPrescriptions.map((rx, i) => (
          <div
            key={rx.prescriptionNo || rx.id || i}
            data-ocid={`doctor.prescriptions.item.${page * pageSize + i + 1}`}
          >
            <PrescriptionCard
              rx={rx}
              status={rxDetails[rx.prescriptionNo]?.status || "Pending"}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </div>
        ))}
      </div>

      <PaginationControl
        currentPage={page}
        totalPages={Math.ceil(prescriptions.length / pageSize)}
        totalElements={prescriptions.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        className="mt-6"
      />

      {/* Full-screen preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          data-ocid="doctor.rx.preview.dialog"
          className="max-w-lg glass-elevated border border-border"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-foreground font-display font-bold">
                Prescription Receipt Preview
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-ocid="doctor.rx.preview.close_button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <PreviewCard
            patientName={selectedPatient?.name ?? ""}
            diagnosis={diagnosis}
            medicines={medicines}
            notes={notes}
            nextVisit={nextVisit}
            doctorName={`Dr. ${user?.name || "Marcus Chen"}`}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="doctor.rx.preview.cancel_button"
              className="border-border text-muted-foreground text-xs"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              data-ocid="doctor.rx.preview.print_button"
              className="gap-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md transition-all"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" /> Print Sheet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

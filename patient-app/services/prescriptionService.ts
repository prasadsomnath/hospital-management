import api from "./api";
import API_ENDPOINTS from "../constants/api.endpoints";
import { Prescription, Medicine } from "../types/prescription.types";

/**
 * Normalizes a raw prescription record from the doctor-service backend
 * into the frontend Prescription shape.
 */
function normalizePrescription(raw: Record<string, any>): Prescription {
  const medicines: Medicine[] = Array.isArray(raw.medicines || raw.drugs)
    ? (raw.medicines || raw.drugs).map((m: any, idx: number) => {
        // Backend may store medicines as simple strings or objects
        if (typeof m === "string") {
          return {
            id: `med-${idx}`,
            name: m,
            dosage: "",
            form: "tablet" as const,
            schedule: { morning: true, noon: false, evening: false, night: false },
            durationDays: 0,
            qtyToTake: "1 tablet",
            reminderEnabled: false,
          };
        }
        // Parse dosage schedule from backend string like "1-0-1" or "1-1-1"
        const dosageStr: string = m.dosage || m.frequency || "";
        const parts = dosageStr.split("-");
        const schedule = {
          morning: parts[0] === "1",
          noon: parts[1] === "1",
          evening: parts[2] === "1",
          night: parts[3] === "1",
        };

        return {
          id: String(m.id || idx),
          name: m.name || m.medicineName || m.drugName || "",
          dosage: m.strength || m.dosage || "",
          form: (m.form || m.type || "tablet") as Medicine["form"],
          schedule,
          durationDays: Number(m.durationDays || m.duration?.replace(/\D/g, "") || 0),
          qtyToTake: m.qtyToTake || m.quantity || "1 tablet",
          instructions: m.instructions || m.remarks || undefined,
          reminderEnabled: Boolean(m.reminderEnabled),
          reminderTimes: m.reminderTimes || undefined,
        };
      })
    : [];

  return {
    id: String(raw.id || ""),
    patientId: String(raw.patientId || raw.patientNo || ""),
    patientName: raw.patientName || "",
    doctorName: raw.doctorName || "",
    department: raw.department || raw.specialty || "",
    date: raw.date || raw.visitDate ? String(raw.date || raw.visitDate).split("T")[0] : "",
    diagnosis: raw.diagnosis || raw.chiefComplaint || undefined,
    instructions: raw.instructions || raw.advice || undefined,
    medicines,
    followUpDate: raw.followUpDate ? String(raw.followUpDate).split("T")[0] : undefined,
  };
}

export const prescriptionService = {
  getPrescriptions: async (patientId: string): Promise<Prescription[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.PRESCRIPTION.LIST(patientId));
      const data = response.data;
      const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
      return rawList.map(normalizePrescription);
    } catch (e) {
      console.log("Failed to fetch prescriptions", e);
      return [];
    }
  },

  getPrescriptionDetail: async (visitId: string): Promise<Prescription | null> => {
    try {
      const response = await api.get(API_ENDPOINTS.PRESCRIPTION.DETAIL(visitId));
      if (!response.data) return null;
      return normalizePrescription(response.data);
    } catch (e) {
      console.log("Failed to fetch prescription detail", e);
      return null;
    }
  },
};

export default prescriptionService;

import api from "./api";
import API_ENDPOINTS from "../constants/api.endpoints";
import { Department, Doctor, Slot, Appointment, TokenQueueStatus } from "../types/appointment.types";

/**
 * Normalizes a raw backend AppointmentResponse into the frontend Appointment shape.
 * Backend field mappings:
 *   appointmentDate → date
 *   timeSlot        → time
 *   patientNo       → patientId
 */
function normalizeAppointment(raw: Record<string, any>): Appointment {
  const rawStatus = raw.status || "";
  let status: "Confirmed" | "Pending" | "Examined" | "Cancelled" = "Confirmed";
  if (rawStatus === "Cancelled" || rawStatus === "Canceled") {
    status = "Cancelled";
  } else if (rawStatus === "Examined" || rawStatus === "Completed" || rawStatus === "Checked") {
    status = "Examined";
  } else if (rawStatus === "Pending") {
    status = "Pending";
  } else {
    status = "Confirmed"; // Scheduled or Confirmed
  }

  return {
    id: String(raw.id || ""),
    patientId: String(raw.patientId || raw.patientNo || ""),
    patientName: raw.patientName || "",
    doctorId: String(raw.doctorId || ""),
    doctorName: raw.doctorName || "",
    specialty: raw.specialty || raw.specialization || "",
    date: raw.date || raw.appointmentDate ? String(raw.date || raw.appointmentDate).split("T")[0] : "",
    time: raw.time || raw.timeSlot || "",
    tokenNo: String(raw.tokenNo || ""),
    status,
    deptId: raw.deptId || "",
    notes: raw.notes || undefined,
  };
}

/**
 * Normalizes a backend doctor record into the frontend Doctor shape.
 */
function normalizeDoctor(raw: Record<string, any>): Doctor {
  return {
    id: String(raw.id || ""),
    name: raw.name || `Dr. ${raw.firstName || ""} ${raw.lastName || ""}`.trim(),
    degree: raw.degree || (raw.specialization ? `MD, ${raw.specialization}` : "MD"),
    specialization: raw.specialization || raw.specialty || "",
    availableDays: raw.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    nextAvailableSlot: raw.nextAvailableSlot || "Today",
  };
}

export const appointmentService = {
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.APPOINTMENTS.DEPARTMENTS);
      const data = response.data;
      const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
      return rawList.map((d: any) => ({
        id: String(d.id || ""),
        name: d.name || "",
        code: d.code || "",
        description: d.description || undefined,
        icon: d.icon || undefined,
      }));
    } catch (e) {
      console.log("Failed to fetch departments", e);
      return [];
    }
  },


  getDoctors: async (deptId?: string): Promise<Doctor[]> => {
    const response = await api.get(API_ENDPOINTS.APPOINTMENTS.DOCTORS, {
      params: deptId ? { deptId } : {},
    });
    const data = response.data;
    const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
    return rawList.map(normalizeDoctor);
  },

  getSlots: async (doctorId: string, date: string): Promise<Slot[]> => {
    const response = await api.get(API_ENDPOINTS.APPOINTMENTS.SLOTS, {
      params: { doctorId, date },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  },

  createAppointment: async (appointmentData: Partial<Appointment>): Promise<Appointment> => {
    const response = await api.post(API_ENDPOINTS.APPOINTMENTS.CREATE, appointmentData);
    return normalizeAppointment(response.data);
  },

  getAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.APPOINTMENTS.LIST(patientId));
      const data = response.data;
      const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
      return rawList.map(normalizeAppointment);
    } catch (e) {
      console.log("Failed to fetch appointments", e);
      return [];
    }
  },

  rescheduleAppointment: async (id: string, date: string, time: string): Promise<boolean> => {
    await api.put(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), { date, time });
    return true;
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    await api.delete(API_ENDPOINTS.APPOINTMENTS.CANCEL(id));
    return true;
  },

  getTokenStatus: async (deptId: string): Promise<TokenQueueStatus | null> => {
    if (!deptId) return null;
    const response = await api.get(API_ENDPOINTS.APPOINTMENTS.TOKEN_STATUS(deptId));
    return response.data;
  },
};

export default appointmentService;

import api from "./api";
import storage from "../utils/storage.utils";
import API_ENDPOINTS from "../constants/api.endpoints";
import { Patient, DashboardData } from "../types/patient.types";
import { getServiceTypeLabel } from "./labService";

/**
 * Maps backend PatientResponse (reception-service) field names → patient-app Patient interface.
 *
 * Backend → Frontend field mappings:
 *   gender            → sex
 *   aadhar            → aadharNo
 *   hyperSensitivity  → allergies
 *   permanentDiagnosis → chronic
 *   placePin          → pin (6-digit suffix) + place (city prefix)
 */
export function normalizePatient(raw: Record<string, any>): Patient {
  // placePin may be "Bangalore-560094" or just "560094"
  let place = raw.place ?? "";
  let pin = raw.pin ?? "";
  if (!place && !pin && raw.placePin) {
    const m = String(raw.placePin).match(/^(.*?)[-,\s]*(\d{6})$/);
    if (m) {
      place = m[1].trim();
      pin = m[2];
    } else {
      place = raw.placePin;
    }
  }

  return {
    id: String(raw.patientNo || raw.id || ""),
    patientNo: String(raw.patientNo || raw.id || ""),
    firstName: raw.firstName ?? "",
    lastName: raw.lastName ?? "",
    dob: raw.dob ? String(raw.dob).split("T")[0] : "",
    sex: (raw.sex || raw.gender || "Male") as "Male" | "Female" | "Other",
    mobile: raw.mobile || raw.phone || "",
    email: raw.email || undefined,
    bloodGroup: raw.bloodGroup || undefined,
    aadharNo: raw.aadharNo || raw.aadhar || undefined,
    address: raw.address || undefined,
    place: place || undefined,
    pin: pin || undefined,
    language: (raw.language as "English" | "Kannada") || undefined,
    referredBy: raw.referredBy || undefined,
    dueAmount: Number(raw.dueAmount ?? 0),
    allergies: raw.allergies || raw.hyperSensitivity || undefined,
    chronic: raw.chronic || raw.permanentDiagnosis || undefined,
    insuranceCompany: raw.insuranceCompany || undefined,
    avatarUrl: raw.avatarUrl || undefined,
    hospitalCode: raw.hospitalCode || undefined,
  };
}

/** Return the cached auth profile from storage as a fallback on API failure */
const getCachedPatient = async (id: string): Promise<Patient> => {
  try {
    const raw = await storage.getItem("polyclinic_mock_profile");
    if (raw) {
      const p = JSON.parse(raw);
      return normalizePatient({ ...p, patientNo: p.patientNo || p.id || id });
    }
  } catch (_) {}
  return {
    id,
    patientNo: id,
    firstName: "",
    lastName: "",
    dob: "",
    sex: "Male",
    mobile: "",
    dueAmount: 0,
  };
};

export const patientService = {
  getProfile: async (id: string): Promise<Patient> => {
    try {
      const response = await api.get(API_ENDPOINTS.PATIENT.GET_PROFILE(id));
      return normalizePatient(response.data);
    } catch (e: any) {
      console.log("getProfile API error, returning cached profile", e);
      // Do NOT re-throw on 404 — fall back to cache. A 404 here usually means the
      // reception service is temporarily unavailable or has a hospitalCode mismatch,
      // NOT that the patient is invalid. Logout is triggered only by 401 (bad token).
      return getCachedPatient(id);
    }
  },

  updateProfile: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
    try {
      // Map frontend field names back to backend field names
      const payload: Record<string, any> = { ...patientData };
      if (patientData.sex) payload.gender = patientData.sex;
      if (patientData.aadharNo) payload.aadhar = patientData.aadharNo;
      if (patientData.allergies) payload.hyperSensitivity = patientData.allergies;
      if (patientData.chronic) payload.permanentDiagnosis = patientData.chronic;
      if (patientData.place || patientData.pin) {
        payload.placePin = [patientData.place, patientData.pin].filter(Boolean).join("-");
      }
      const response = await api.put(API_ENDPOINTS.PATIENT.UPDATE_PROFILE(id), payload);
      return normalizePatient(response.data);
    } catch (e) {
      console.log("updateProfile API error, applying local patch", e);
      const original = await getCachedPatient(id);
      return { ...original, ...patientData };
    }
  },

  getDashboard: async (id: string): Promise<DashboardData> => {
    try {
      const response = await api.get(API_ENDPOINTS.PATIENT.GET_DASHBOARD(id));
      const raw = response.data;

      const dashboard: DashboardData = {
        patientId: String(raw.patientId || id),
        patientName: raw.patientName || "",
        patientNo: String(raw.patientNo || id),
        dueAmount: Number(raw.dueAmount ?? 0),
        pendingReportsCount: Number(raw.pendingReportsCount ?? 0),
        pendingReports: Array.isArray(raw.pendingReports)
          ? raw.pendingReports.map((r: any) => ({
              id: String(r.id || ""),
              testName: r.testName || "Diagnostic Test",
              serviceType: getServiceTypeLabel(r.serviceType || "Lab") as any,
              date: r.date || r.orderDate || "",
              status: r.status || "Pending",
            }))
          : [],
        recentVisits: Array.isArray(raw.recentVisits)
          ? raw.recentVisits.map((v: any) => ({
              visitId: String(v.visitId || v.id || ""),
              date: v.date || "",
              doctorName: v.doctorName || "",
              department: v.department || "",
              diagnosis: v.diagnosis || undefined,
            }))
          : [],
      };

      if (raw.upcomingAppointment) {
        const a = raw.upcomingAppointment;
        dashboard.upcomingAppointment = {
          id: String(a.id || ""),
          doctorName: a.doctorName || "",
          specialty: a.specialty || "",
          date: a.date || a.appointmentDate || "",
          time: a.time || a.timeSlot || "",
          tokenNo: String(a.tokenNo || ""),
          status: a.status || "Confirmed",
          deptId: a.deptId || "",
        };
      }

      if (raw.activePrescription) {
        const rx = raw.activePrescription;
        dashboard.activePrescription = {
          visitId: String(rx.visitId || rx.id || ""),
          doctorName: rx.doctorName || "",
          date: rx.date || "",
          medicineCount: Number(rx.medicineCount ?? 0),
          nextDoseTime: rx.nextDoseTime || undefined,
          nextDoseName: rx.nextDoseName || undefined,
        };
      }

      if (raw.vitalsLatest) {
        dashboard.vitalsLatest = raw.vitalsLatest;
      }

      return dashboard;
    } catch (e) {
      console.log("getDashboard API error, returning empty dashboard", e);
      return {
        patientId: id,
        patientName: "",
        patientNo: id,
        dueAmount: 0,
        pendingReportsCount: 0,
        pendingReports: [],
        recentVisits: [],
      };
    }
  },

  getHealthCard: async (id: string): Promise<Patient> => {
    return patientService.getProfile(id);
  },
};

export default patientService;

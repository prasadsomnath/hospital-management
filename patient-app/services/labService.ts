import api from "./api";
import API_ENDPOINTS from "../constants/api.endpoints";
import { LabReportSummary, LabReportDetail } from "../types/lab.types";

/**
 * Translates raw backend modules/service types into premium, user-friendly display labels.
 */
export function getServiceTypeLabel(module: string): string {
  if (!module) return "Other Services";
  const m = module.toLowerCase().trim();
  if (m === "lab" || m === "laboratory") return "Lab";
  if (m === "xray" || m === "x-ray") return "X-Ray";
  if (m === "usg") return "USG";
  if (m === "ct-scan" || m === "ct" || m === "udr-ct") return "CT Scan";
  if (m === "ecg") return "ECG";
  if (m === "udr-mri" || m === "mri") return "MRI";
  if (m === "udr-daycare" || m === "daycare") return "Day Care";
  if (m === "udr-echo" || m === "echo") return "Echo";
  if (m === "udr-ot" || m === "ot") return "OT";
  if (m === "udr-physio" || m === "physio") return "Physiotherapy";
  if (m === "other-services" || m === "others") return "Other Services";

  // Graceful formatting for any unknown service types
  return m
    .replace(/^udr-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Normalizes a raw backend lab record into the frontend LabReportSummary shape.
 * Backend lab-service may return different field names.
 */
function normalizeReportSummary(raw: Record<string, any>): LabReportSummary {
  return {
    id: String(raw.id || ""),
    testName: raw.testName || raw.serviceName || raw.name || "Diagnostic Test",
    serviceType: getServiceTypeLabel(raw.serviceType || raw.module || "Lab") as any,
    orderDate: raw.orderDate || raw.date || raw.createdAt
      ? String(raw.orderDate || raw.date || raw.createdAt).split("T")[0]
      : "",
    status: raw.status || "Pending",
  };
}

/**
 * Normalizes a raw backend lab record detail into the frontend LabReportDetail shape.
 */
function normalizeReportDetail(raw: Record<string, any>): LabReportDetail {
  return {
    id: String(raw.id || ""),
    reportNo: raw.reportNo || raw.labRecordNo || String(raw.id || ""),
    testName: raw.testName || raw.serviceName || raw.name || "Diagnostic Test",
    patientId: String(raw.patientId || raw.patientNo || ""),
    patientName: raw.patientName || "",
    patientAge: raw.patientAge || raw.age,
    patientSex: raw.patientSex || raw.sex || raw.gender,
    referredDoctor: raw.referredDoctor || raw.doctorName || undefined,
    orderDate: raw.orderDate || raw.date ? String(raw.orderDate || raw.date).split("T")[0] : "",
    orderTime: raw.orderTime || undefined,
    serviceType: getServiceTypeLabel(raw.serviceType || raw.module || "Lab") as any,
    status: raw.status || "Pending",
    results: Array.isArray(raw.results) ? raw.results : undefined,
    observationText: raw.observationText || raw.observation || undefined,
    reportText: raw.reportText || raw.impression || undefined,
  };
}

export const labService = {
  getReports: async (patientId: string): Promise<LabReportSummary[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.LAB.LIST(patientId));
      const data = response.data;
      const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
      return rawList.map(normalizeReportSummary);
    } catch (e) {
      console.log("Failed to fetch lab reports", e);
      return [];
    }
  },

  getReportDetail: async (reportId: string): Promise<LabReportDetail | null> => {
    try {
      const response = await api.get(API_ENDPOINTS.LAB.DETAIL(reportId));
      return normalizeReportDetail(response.data);
    } catch (e) {
      console.log("Failed to fetch lab report detail", e);
      return null;
    }
  },

  getReportPdfUrl: (reportId: string): string => {
    return `${API_ENDPOINTS.BASE_URL}/reports/${reportId}/pdf`;
  },
};

export default labService;

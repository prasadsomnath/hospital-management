// ─── Reception Service – API Client ──────────────────────────────────────────
// Thin typed wrapper around apiFetch for all /reception/* endpoints.
// Every function requires hospitalCode (multi-tenant X-Hospital-Code header).

import { apiFetch } from "./api";
import type {
  AppointmentRequest,
  AppointmentResponse,
  BillRequest,
  BillResponse,
  BirthRegisterRequest,
  BirthRegisterResponse,
  CampPatientRequest,
  CampPatientResponse,
  CampRequest,
  CampResponse,
  ConsentRegisterRequest,
  ConsentRegisterResponse,
  DeathRegisterRequest,
  DeathRegisterResponse,
  DischargeRegisterRequest,
  DischargeRegisterResponse,
  EddRegisterRequest,
  EddRegisterResponse,
  FreePatientRegisterRequest,
  FreePatientRegisterResponse,
  InsuranceBillRegisterRequest,
  InsuranceBillRegisterResponse,
  MlcRegisterRequest,
  MlcRegisterResponse,
  OtRegisterRequest,
  OtRegisterResponse,
  PatientRequest,
  PatientResponse,
  ThreeCRegisterRequest,
  ThreeCRegisterResponse,
} from "./reception-types";

// ── Header helpers ────────────────────────────────────────────────────────────

function hdr(hospitalCode: string, extra?: Record<string, string>) {
  return {
    "X-Hospital-Code": hospitalCode,
    "Content-Type": "application/json",
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────────────────────

export const receptionApi = {
  // ── Patients ──────────────────────────────────────────────────────────────

  async getPatients(hospitalCode: string): Promise<PatientResponse[]> {
    const page = await apiFetch<{ content: PatientResponse[] }>(
      "/reception/patients?size=1000",
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getPatient(
    patientNo: string,
    hospitalCode: string,
  ): Promise<PatientResponse> {
    return apiFetch<PatientResponse>(`/reception/patients/${patientNo}`, {
      headers: hdr(hospitalCode),
    });
  },

  registerPatient(
    req: PatientRequest,
    hospitalCode: string,
  ): Promise<PatientResponse> {
    return apiFetch<PatientResponse>("/reception/patients", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  registerPatientsBulk(
    reqs: PatientRequest[],
    hospitalCode: string,
  ): Promise<PatientResponse[]> {
    return apiFetch<PatientResponse[]>("/reception/patients/bulk", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(reqs),
    });
  },

  updatePatient(
    patientNo: string,
    req: PatientRequest,
    hospitalCode: string,
  ): Promise<PatientResponse> {
    return apiFetch<PatientResponse>(`/reception/patients/${patientNo}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deletePatient(patientNo: string, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/patients/${patientNo}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Appointments ──────────────────────────────────────────────────────────

  async getAppointments(
    hospitalCode: string,
    date?: string, // ISO "YYYY-MM-DD", defaults to today server-side
    doctorId?: string, // "ALL" = all doctors
  ): Promise<AppointmentResponse[]> {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (doctorId && doctorId !== "ALL") params.set("doctorId", doctorId);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: AppointmentResponse[] }>(
      `/reception/appointments${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  bookAppointment(
    req: AppointmentRequest,
    hospitalCode: string,
  ): Promise<AppointmentResponse> {
    return apiFetch<AppointmentResponse>("/reception/appointments", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateAppointmentStatus(
    id: number,
    status: string,
    hospitalCode: string,
  ): Promise<AppointmentResponse> {
    return apiFetch<AppointmentResponse>(
      `/reception/appointments/${id}/status?status=${encodeURIComponent(status)}`,
      {
        method: "PATCH",
        headers: hdr(hospitalCode),
      },
    );
  },

  deleteAppointment(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/appointments/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  updateAppointment(
    id: number,
    req: AppointmentRequest,
    hospitalCode: string,
  ): Promise<AppointmentResponse> {
    return apiFetch<AppointmentResponse>(`/reception/appointments/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  // ── Bills ─────────────────────────────────────────────────────────────────

  async getBills(
    hospitalCode: string,
    billType?: string, // "OPD" | "IPD" | "SERVICE" | "ALL"
    fromDate?: string,
    toDate?: string,
  ): Promise<BillResponse[]> {
    const params = new URLSearchParams();
    if (billType) params.set("billType", billType);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: BillResponse[] }>(
      `/reception/bills${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getBill(billNumber: string, hospitalCode: string): Promise<BillResponse> {
    return apiFetch<BillResponse>(`/reception/bills/${billNumber}`, {
      headers: hdr(hospitalCode),
    });
  },

  createBill(req: BillRequest, hospitalCode: string): Promise<BillResponse> {
    return apiFetch<BillResponse>("/reception/bills", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateBill(
    billNumber: string,
    req: BillRequest,
    hospitalCode: string,
  ): Promise<BillResponse> {
    return apiFetch<BillResponse>(`/reception/bills/${billNumber}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateBillPayment(
    billNumber: string,
    amount: number,
    hospitalCode: string,
    paymentMode?: string,
  ): Promise<BillResponse> {
    const url = `/reception/bills/${billNumber}/payment?amount=${amount}${paymentMode ? `&paymentMode=${paymentMode}` : ""}`;
    return apiFetch<BillResponse>(url, {
      method: "PATCH",
      headers: hdr(hospitalCode),
    });
  },

  deleteBill(billNumber: string, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/bills/${billNumber}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Camps ─────────────────────────────────────────────────────────────────

  async getCamps(hospitalCode: string): Promise<CampResponse[]> {
    const page = await apiFetch<{ content: CampResponse[] }>(
      "/reception/camps?size=1000",
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  createCamp(req: CampRequest, hospitalCode: string): Promise<CampResponse> {
    return apiFetch<CampResponse>("/reception/camps", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateCamp(
    id: number,
    req: CampRequest,
    hospitalCode: string,
  ): Promise<CampResponse> {
    return apiFetch<CampResponse>(`/reception/camps/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteCamp(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/camps/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  async getCampPatients(
    hospitalCode: string,
    campName?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<CampPatientResponse[]> {
    const params = new URLSearchParams();
    if (campName && campName !== "ALL") params.set("campName", campName);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: CampPatientResponse[] }>(
      `/reception/camps/patients${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  addCampPatient(
    req: CampPatientRequest,
    hospitalCode: string,
  ): Promise<CampPatientResponse> {
    return apiFetch<CampPatientResponse>("/reception/camps/patients", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateCampPatient(
    id: number,
    req: CampPatientRequest,
    hospitalCode: string,
  ): Promise<CampPatientResponse> {
    return apiFetch<CampPatientResponse>(`/reception/camps/patients/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteCampPatient(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/camps/patients/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── MLC Register ──────────────────────────────────────────────────────────

  async getMlcEntries(
    hospitalCode: string,
    status?: string,
    injuryType?: string,
  ): Promise<MlcRegisterResponse[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (injuryType) params.set("injuryType", injuryType);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: MlcRegisterResponse[] }>(
      `/reception/mlc${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getMlcEntry(id: number, hospitalCode: string): Promise<MlcRegisterResponse> {
    return apiFetch<MlcRegisterResponse>(`/reception/mlc/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createMlcEntry(
    req: MlcRegisterRequest,
    hospitalCode: string,
  ): Promise<MlcRegisterResponse> {
    return apiFetch<MlcRegisterResponse>("/reception/mlc", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateMlcEntry(
    id: number,
    req: MlcRegisterRequest,
    hospitalCode: string,
  ): Promise<MlcRegisterResponse> {
    return apiFetch<MlcRegisterResponse>(`/reception/mlc/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteMlcEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/mlc/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── OT Register ────────────────────────────────────────────────────────────

  async getOtEntries(
    hospitalCode: string,
    outcome?: string,
    procedureType?: string,
  ): Promise<OtRegisterResponse[]> {
    const params = new URLSearchParams();
    if (outcome) params.set("outcome", outcome);
    if (procedureType) params.set("procedureType", procedureType);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: OtRegisterResponse[] }>(
      `/reception/ot${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getOtEntry(id: number, hospitalCode: string): Promise<OtRegisterResponse> {
    return apiFetch<OtRegisterResponse>(`/reception/ot/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createOtEntry(
    req: OtRegisterRequest,
    hospitalCode: string,
  ): Promise<OtRegisterResponse> {
    return apiFetch<OtRegisterResponse>("/reception/ot", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateOtEntry(
    id: number,
    req: OtRegisterRequest,
    hospitalCode: string,
  ): Promise<OtRegisterResponse> {
    return apiFetch<OtRegisterResponse>(`/reception/ot/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteOtEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/ot/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── EDD Register ───────────────────────────────────────────────────────────

  async getEddEntries(
    hospitalCode: string,
    status?: string,
  ): Promise<EddRegisterResponse[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: EddRegisterResponse[] }>(
      `/reception/edd${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getEddEntry(id: number, hospitalCode: string): Promise<EddRegisterResponse> {
    return apiFetch<EddRegisterResponse>(`/reception/edd/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createEddEntry(
    req: EddRegisterRequest,
    hospitalCode: string,
  ): Promise<EddRegisterResponse> {
    return apiFetch<EddRegisterResponse>("/reception/edd", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateEddEntry(
    id: number,
    req: EddRegisterRequest,
    hospitalCode: string,
  ): Promise<EddRegisterResponse> {
    return apiFetch<EddRegisterResponse>(`/reception/edd/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteEddEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/edd/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Consent Register ────────────────────────────────────────────────────────

  async getConsentEntries(
    hospitalCode: string,
    consentType?: string,
  ): Promise<ConsentRegisterResponse[]> {
    const params = new URLSearchParams();
    if (consentType) params.set("consentType", consentType);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: ConsentRegisterResponse[] }>(
      `/reception/consent${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getConsentEntry(
    id: number,
    hospitalCode: string,
  ): Promise<ConsentRegisterResponse> {
    return apiFetch<ConsentRegisterResponse>(`/reception/consent/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createConsentEntry(
    req: ConsentRegisterRequest,
    hospitalCode: string,
  ): Promise<ConsentRegisterResponse> {
    return apiFetch<ConsentRegisterResponse>("/reception/consent", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateConsentEntry(
    id: number,
    req: ConsentRegisterRequest,
    hospitalCode: string,
  ): Promise<ConsentRegisterResponse> {
    return apiFetch<ConsentRegisterResponse>(`/reception/consent/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteConsentEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/consent/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Death Register ─────────────────────────────────────────────────────────

  async getDeathEntries(
    hospitalCode: string,
    manner?: string,
  ): Promise<DeathRegisterResponse[]> {
    const params = new URLSearchParams();
    if (manner) params.set("manner", manner);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: DeathRegisterResponse[] }>(
      `/reception/death${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getDeathEntry(
    id: number,
    hospitalCode: string,
  ): Promise<DeathRegisterResponse> {
    return apiFetch<DeathRegisterResponse>(`/reception/death/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createDeathEntry(
    req: DeathRegisterRequest,
    hospitalCode: string,
  ): Promise<DeathRegisterResponse> {
    return apiFetch<DeathRegisterResponse>("/reception/death", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateDeathEntry(
    id: number,
    req: DeathRegisterRequest,
    hospitalCode: string,
  ): Promise<DeathRegisterResponse> {
    return apiFetch<DeathRegisterResponse>(`/reception/death/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteDeathEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/death/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Birth Register ──────────────────────────────────────────────────────────

  async getBirthEntries(
    hospitalCode: string,
  ): Promise<BirthRegisterResponse[]> {
    const page = await apiFetch<{ content: BirthRegisterResponse[] }>(
      "/reception/birth?size=1000",
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getBirthEntry(
    id: number,
    hospitalCode: string,
  ): Promise<BirthRegisterResponse> {
    return apiFetch<BirthRegisterResponse>(`/reception/birth/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createBirthEntry(
    req: BirthRegisterRequest,
    hospitalCode: string,
  ): Promise<BirthRegisterResponse> {
    return apiFetch<BirthRegisterResponse>("/reception/birth", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateBirthEntry(
    id: number,
    req: BirthRegisterRequest,
    hospitalCode: string,
  ): Promise<BirthRegisterResponse> {
    return apiFetch<BirthRegisterResponse>(`/reception/birth/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteBirthEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/birth/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Free Patient Register ───────────────────────────────────────────────────

  async getFreePatientEntries(
    hospitalCode: string,
  ): Promise<FreePatientRegisterResponse[]> {
    const page = await apiFetch<{ content: FreePatientRegisterResponse[] }>(
      "/reception/free?size=1000",
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getFreePatientEntry(
    id: number,
    hospitalCode: string,
  ): Promise<FreePatientRegisterResponse> {
    return apiFetch<FreePatientRegisterResponse>(`/reception/free/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createFreePatientEntry(
    req: FreePatientRegisterRequest,
    hospitalCode: string,
  ): Promise<FreePatientRegisterResponse> {
    return apiFetch<FreePatientRegisterResponse>("/reception/free", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateFreePatientEntry(
    id: number,
    req: FreePatientRegisterRequest,
    hospitalCode: string,
  ): Promise<FreePatientRegisterResponse> {
    return apiFetch<FreePatientRegisterResponse>(`/reception/free/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteFreePatientEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/free/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Discharge Register ──────────────────────────────────────────────────────

  async getDischargeEntries(
    hospitalCode: string,
  ): Promise<DischargeRegisterResponse[]> {
    const page = await apiFetch<{ content: DischargeRegisterResponse[] }>(
      "/reception/discharge?size=1000",
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getDischargeEntry(
    id: number,
    hospitalCode: string,
  ): Promise<DischargeRegisterResponse> {
    return apiFetch<DischargeRegisterResponse>(`/reception/discharge/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createDischargeEntry(
    req: DischargeRegisterRequest,
    hospitalCode: string,
  ): Promise<DischargeRegisterResponse> {
    return apiFetch<DischargeRegisterResponse>("/reception/discharge", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateDischargeEntry(
    id: number,
    req: DischargeRegisterRequest,
    hospitalCode: string,
  ): Promise<DischargeRegisterResponse> {
    return apiFetch<DischargeRegisterResponse>(`/reception/discharge/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteDischargeEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/discharge/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── 3C Register ─────────────────────────────────────────────────────────────

  async getThreeCEntries(
    hospitalCode: string,
    triageLevel?: string,
    status?: string,
  ): Promise<ThreeCRegisterResponse[]> {
    const params = new URLSearchParams();
    if (triageLevel) params.set("triageLevel", triageLevel);
    if (status) params.set("status", status);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: ThreeCRegisterResponse[] }>(
      `/reception/threec${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getThreeCEntry(
    id: number,
    hospitalCode: string,
  ): Promise<ThreeCRegisterResponse> {
    return apiFetch<ThreeCRegisterResponse>(`/reception/threec/${id}`, {
      headers: hdr(hospitalCode),
    });
  },

  createThreeCEntry(
    req: ThreeCRegisterRequest,
    hospitalCode: string,
  ): Promise<ThreeCRegisterResponse> {
    return apiFetch<ThreeCRegisterResponse>("/reception/threec", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateThreeCEntry(
    id: number,
    req: ThreeCRegisterRequest,
    hospitalCode: string,
  ): Promise<ThreeCRegisterResponse> {
    return apiFetch<ThreeCRegisterResponse>(`/reception/threec/${id}`, {
      method: "PUT",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  deleteThreeCEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/threec/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },

  // ── Insurance Bill Register ─────────────────────────────────────────────────

  async getInsuranceBillEntries(
    hospitalCode: string,
    claimStatus?: string,
  ): Promise<InsuranceBillRegisterResponse[]> {
    const params = new URLSearchParams();
    if (claimStatus) params.set("claimStatus", claimStatus);
    params.set("size", "1000");
    const qs = `?${params.toString()}`;
    const page = await apiFetch<{ content: InsuranceBillRegisterResponse[] }>(
      `/reception/insurance${qs}`,
      { headers: hdr(hospitalCode) },
    );
    return Array.isArray(page) ? page : (page?.content ?? []);
  },

  getInsuranceBillEntry(
    id: number,
    hospitalCode: string,
  ): Promise<InsuranceBillRegisterResponse> {
    return apiFetch<InsuranceBillRegisterResponse>(
      `/reception/insurance/${id}`,
      {
        headers: hdr(hospitalCode),
      },
    );
  },

  createInsuranceBillEntry(
    req: InsuranceBillRegisterRequest,
    hospitalCode: string,
  ): Promise<InsuranceBillRegisterResponse> {
    return apiFetch<InsuranceBillRegisterResponse>("/reception/insurance", {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  updateInsuranceBillEntry(
    id: number,
    req: InsuranceBillRegisterRequest,
    hospitalCode: string,
  ): Promise<InsuranceBillRegisterResponse> {
    return apiFetch<InsuranceBillRegisterResponse>(
      `/reception/insurance/${id}`,
      {
        method: "PUT",
        headers: hdr(hospitalCode),
        body: JSON.stringify(req),
      },
    );
  },

  deleteInsuranceBillEntry(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/reception/insurance/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },
};

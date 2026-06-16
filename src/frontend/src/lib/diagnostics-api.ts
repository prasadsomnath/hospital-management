// ─── Diagnostics Service – API Client ────────────────────────────────────────
// Thin typed wrapper around apiFetch for all /doctor/diagnostics/* endpoints.
// Every function requires hospitalCode (multi-tenant X-Hospital-Code header).

import { apiFetch } from "./api";
import type {
  DiagnosticOrderRequest,
  DiagnosticOrderResponse,
} from "./diagnostics-types";

// ── Header helpers ────────────────────────────────────────────────────────────

function hdr(hospitalCode: string, extra?: Record<string, string>) {
  return {
    "X-Hospital-Code": hospitalCode,
    "Content-Type": "application/json",
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTICS
// ─────────────────────────────────────────────────────────────────────────────

export const diagnosticsApi = {
  // ── Get all diagnostic orders for a patient ────────────────────────────────

  getDiagnosticOrders(
    patientNo: string,
    hospitalCode: string,
  ): Promise<DiagnosticOrderResponse[]> {
    return apiFetch<DiagnosticOrderResponse[]>(
      `/doctor/diagnostics/${patientNo}`,
      {
        headers: hdr(hospitalCode),
      },
    );
  },

  // ── Create a new diagnostic order ──────────────────────────────────────────

  createDiagnosticOrder(
    req: DiagnosticOrderRequest,
    hospitalCode: string,
  ): Promise<DiagnosticOrderResponse> {
    return apiFetch<DiagnosticOrderResponse>(`/doctor/diagnostics`, {
      method: "POST",
      headers: hdr(hospitalCode),
      body: JSON.stringify(req),
    });
  },

  // ── Delete a diagnostic order ──────────────────────────────────────────────

  deleteDiagnosticOrder(id: number, hospitalCode: string): Promise<void> {
    return apiFetch<void>(`/doctor/diagnostics/${id}`, {
      method: "DELETE",
      headers: hdr(hospitalCode),
    });
  },
};

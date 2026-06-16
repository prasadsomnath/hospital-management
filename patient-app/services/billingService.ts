import api from "./api";
import API_ENDPOINTS from "../constants/api.endpoints";
import { Bill, BillItem } from "../types/billing.types";

/**
 * Normalizes a raw backend BillResponse into the frontend Bill shape.
 * Backend field mappings:
 *   billNumber   → billNo
 *   billDate     → date
 *   netAmount    → totalAmount (after discount)
 *   billItems    → items (each item: itemName→name, rate, qty, total)
 *   patientNo    → patientId
 */
function normalizeBill(raw: Record<string, any>): Bill {
  const items: BillItem[] = Array.isArray(raw.billItems || raw.items)
    ? (raw.billItems || raw.items).map((item: any, idx: number) => ({
        id: String(item.id || idx),
        name: item.name || item.itemName || item.serviceName || "Service",
        rate: Number(item.rate || item.unitPrice || 0),
        qty: Number(item.qty || item.quantity || 1),
        total: Number(item.total || item.amount || (item.rate || 0) * (item.qty || 1)),
      }))
    : [];

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discount = Number(raw.discount ?? 0);
  const totalAmount = Number(raw.netAmount ?? raw.totalAmount ?? subtotal - discount);
  const paidAmount = Number(raw.paidAmount ?? 0);
  const dueAmount = Number(raw.dueAmount ?? (totalAmount - paidAmount));

  // Determine status from backend or derive from amounts
  let status: "Paid" | "Partially Paid" | "Unpaid" = "Unpaid";
  if (raw.status) {
    status = raw.status as "Paid" | "Partially Paid" | "Unpaid";
  } else if (dueAmount <= 0) {
    status = "Paid";
  } else if (paidAmount > 0) {
    status = "Partially Paid";
  }

  return {
    id: String(raw.id || ""),
    billNo: raw.billNo || raw.billNumber || String(raw.id || ""),
    patientId: String(raw.patientId || raw.patientNo || ""),
    patientName: raw.patientName || "",
    date: raw.date || raw.billDate ? String(raw.date || raw.billDate).split("T")[0] : "",
    billType: raw.billType || "OPD",
    items,
    subtotal,
    discount,
    companyShare: Number(raw.companyShare ?? 0),
    totalAmount,
    paidAmount,
    dueAmount,
    status,
    operatorName: raw.operatorName || undefined,
    hospitalName: raw.hospitalName || undefined,
    hospitalAddress: raw.hospitalAddress || undefined,
    hospitalPhone: raw.hospitalPhone || undefined,
  };
}

export const billingService = {
  getBills: async (patientId: string): Promise<Bill[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.BILLING.LIST(patientId));
      const data = response.data;
      const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
      return rawList.map(normalizeBill);
    } catch (e) {
      console.log("Failed to fetch bills", e);
      return [];
    }
  },

  getBillDetail: async (billId: string): Promise<Bill | null> => {
    try {
      const response = await api.get(API_ENDPOINTS.BILLING.DETAIL(billId));
      if (!response.data) return null;
      return normalizeBill(response.data);
    } catch (e) {
      console.log("Failed to fetch bill detail", e);
      return null;
    }
  },

  getReceiptPdfUrl: (receiptId: string): string => {
    return `${API_ENDPOINTS.BASE_URL}/billing/${receiptId}/receipt-pdf`;
  },
};

export default billingService;

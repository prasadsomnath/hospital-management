export type BillType = "OPD" | "IPD" | "Lab" | "Services";

export interface BillItem {
  id: string;
  name: string;
  rate: number;
  qty: number;
  total: number;
}

export interface Bill {
  id: string;
  billNo: string;
  patientId: string;
  patientName: string;
  date: string;
  billType: BillType;
  items: BillItem[];
  subtotal: number;
  discount: number;
  companyShare: number; // Insurance/sponsor
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: "Paid" | "Partially Paid" | "Unpaid";
  operatorName?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
}

export interface BillingSummary {
  totalOutstanding: number;
  bills: Bill[];
}

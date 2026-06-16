export type ServiceType = "Lab" | "X-Ray" | "USG" | "CT Scan" | "ECG" | "Others";

export interface LabTestItemResult {
  testName: string;
  result: number;
  unit: string;
  refRangeStart: number;
  refRangeEnd: number;
  status: "Normal" | "High" | "Low";
}

export interface LabReportDetail {
  id: string;
  reportNo: string;
  testName: string; // Added testName property
  patientId: string;
  patientName: string;
  patientAge: number;
  patientSex: "Male" | "Female" | "Other";
  referredDoctor: string;
  orderDate: string;
  orderTime: string;
  serviceType: ServiceType;
  status: "Pending" | "Processing" | "Ready";
  results?: LabTestItemResult[]; // For Lab Blood tests
  observationText?: string;      // For USG/X-Ray/CT/ECG reports
  reportText?: string;           // Formatted legacy report findings
  imageUrl?: string;             // Attached scan image if any
}

export interface LabReportSummary {
  id: string;
  testName: string;
  serviceType: ServiceType;
  orderDate: string;
  status: "Pending" | "Processing" | "Ready";
}

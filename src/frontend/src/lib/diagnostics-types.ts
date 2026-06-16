export interface DiagnosticOrderRequest {
  patientNo: string;
  testName: string;
  department: string;
  remarks?: string;
}

export interface DiagnosticOrderResponse {
  id: number;
  patientNo: string;
  testName: string;
  department: string;
  orderedDate: string;
  status: string;
  remarks?: string;
}

export interface Patient {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: "Male" | "Female" | "Other";
  mobile: string;
  email?: string;
  bloodGroup?: string;
  aadharNo?: string;
  address?: string;
  place?: string;
  pin?: string;
  language?: "English" | "Kannada";
  referredBy?: string;
  dueAmount: number;
  allergies?: string;
  chronic?: string;
  insuranceCompany?: string;
  avatarUrl?: string;
  hospitalCode?: string;
}

export interface DashboardData {
  patientId: string;
  patientName: string;
  patientNo: string;
  dueAmount: number;
  upcomingAppointment?: {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    tokenNo: string;
    status: "Confirmed" | "Pending" | "Examined" | "Cancelled";
    deptId: string;
  };
  pendingReportsCount: number;
  pendingReports: Array<{
    id: string;
    testName: string;
    serviceType: "Lab" | "X-Ray" | "USG" | "CT Scan" | "ECG" | "Others";
    date: string;
    status: "Pending" | "Processing" | "Ready";
  }>;
  activePrescription?: {
    visitId: string;
    doctorName: string;
    date: string;
    medicineCount: number;
    nextDoseTime?: string;
    nextDoseName?: string;
  };
  recentVisits: Array<{
    visitId: string;
    date: string;
    doctorName: string;
    department: string;
    diagnosis?: string;
  }>;
  vitalsLatest?: {
    temperature?: string;
    pulse?: string;
    respiratoryRate?: string;
    bloodPressure?: string;
    spO2?: string;
    updatedAt: string;
  };
}

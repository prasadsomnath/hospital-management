export type UserRole =
  | "admin"
  | "doctor"
  | "receptionist"
  | "pharmacist"
  | "lab_technician"
  | "superAdmin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  hospitalId?: string;
  hospitalCode?: string;
  avatar?: string;
  specialty?: string;
  department?: string;
  mobile?: string;
  hospitalFeatures?: {
    pharmacy: boolean;
    laboratory: boolean;
    billing: boolean;
    patientPortal: boolean;
    inventory: boolean;
  };
  isDemo?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  age: number;
  dob?: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  alternativeNum?: string;
  email: string;
  bloodGroup: string;
  condition: string;
  status: "Admitted" | "Discharged" | "In-Progress" | "Scheduled";
  admittedDate: string;
  doctorId: string;
  address: string;
  emergencyContact: string;

  // Patient Identity Extensions
  referredBy?: string;
  language?: string;
  placePin?: string;
  country?: string;
  registeredOn?: string;
  aadhar?: string;

  // Medical / Clinical Extensions
  education?: string;
  occupation?: string;
  category?: string;
  permanentDiagnosis?: string;
  vicesHabits?: string;
  hyperSensitivity?: string;
  importantNotes?: string;
  notes?: string;
  height?: string;

  // Insurance & Admin
  insuranceCompany?: string;
  insuranceDate?: string;
  insuranceAmount?: string;
  insuranceRefNo?: string;
  freeOfCost?: boolean;
  income?: string;
  religion?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  phone: string;
  email: string;
  status: "Active" | "Busy" | "On Leave";
  patients: number;
  experience: number;
  isHeadPhysician?: boolean;
  licenseNumber?: string;
  documentPdf?: string;
  consultationFee?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: "Scheduled" | "Confirmed" | "Checked-In" | "Completed" | "Cancelled";
  token: number;
  notes?: string;
  roomNumber?: string;
  bedNo?: string;
  roomType?: string;
  assignedNurse?: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  doctors: number;
  patients: number;
  rooms: number;
  status: "Active" | "Full";
}

export interface Room {
  id: string;
  number: string;
  type: "ICU" | "General" | "Private" | "Semi-Private";
  floor: string | number;
  patientId?: string;
  patientName?: string;
  status: "Available" | "Occupied" | "Maintenance";
  departmentId?: number;
  totalBeds?: number;
  availableBeds?: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medicines: Medicine[];
  notes: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface BillingRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  consultationFee: number;
  labCharges: number;
  medicineCharges: number;
  roomCharges: number;
  total: number;
  status: "Paid" | "Pending" | "Partial";
  paymentMethod?: "Cash" | "Card" | "UPI" | "Insurance";
}
export interface Hospital {
  id: string;
  name: string;
  logoUri?: string;
  address: string;
  contact: string;
  status: "active" | "inactive";
  createdAt?: string;
}

export interface Receptionist {
  id: string;
  name: string;
  email: string;
  phone: string;
  shift: "Morning" | "Afternoon" | "Evening" | "Night";
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  assignedCounter: string;
}

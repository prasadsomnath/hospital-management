// ─── Reception Service – Shared TypeScript Types ─────────────────────────────
// Mirrors the Java DTOs in reception-service exactly.

// ── Patients ─────────────────────────────────────────────────────────────────

export interface PatientRequest {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dob?: string | null; // ISO date "YYYY-MM-DD"
  referredBy?: string | null;
  language?: string | null;
  placePin?: string | null;
  country?: string | null;
  phone?: string | null;
  alternativeNum?: string | null;
  email?: string | null;
  address?: string | null;
  aadhar?: string | null;
  bloodGroup?: string | null;
  height?: string | null;
  education?: string | null;
  occupation?: string | null;
  category?: string | null;
  permanentDiagnosis?: string | null;
  vicesHabits?: string | null;
  hyperSensitivity?: string | null;
  importantNotes?: string | null;
  notes?: string | null;
  insuranceCompany?: string | null;
  insuranceDate?: string | null;
  insuranceAmount?: number | null;
  insuranceRefNo?: string | null;
  freeOfCost?: boolean | null;
  income?: string | null;
  religion?: string | null;
}

export interface PatientResponse {
  id: number;
  patientNo: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  name: string; // full name built by backend
  gender?: string;
  dob?: string;
  age?: number;
  referredBy?: string;
  language?: string;
  placePin?: string;
  country?: string;
  phone?: string;
  alternativeNum?: string;
  email?: string;
  address?: string;
  aadhar?: string;
  bloodGroup?: string;
  height?: string;
  education?: string;
  occupation?: string;
  category?: string;
  permanentDiagnosis?: string;
  vicesHabits?: string;
  hyperSensitivity?: string;
  importantNotes?: string;
  notes?: string;
  insuranceCompany?: string;
  insuranceDate?: string;
  insuranceAmount?: number;
  insuranceRefNo?: string;
  freeOfCost?: boolean;
  income?: string;
  religion?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Appointments ──────────────────────────────────────────────────────────────

export interface AppointmentRequest {
  patientNo: string;
  doctorId: string;
  appointmentDate: string; // ISO date "YYYY-MM-DD"
  timeSlot?: string | null;
  appointmentType: string;
  visitType?: string | null; // "OPD" | "IPD"
  toDate?: string | null;
  status?: string | null;
  notes?: string | null;
  dueAmount?: number;
  roomNumber?: string | null;
  bedNo?: string | null;
  roomType?: string | null;
  assignedNurse?: string | null;
}

export interface AppointmentResponse {
  id: number;
  patientNo: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  timeSlot?: string | null;
  appointmentType: string;
  visitType?: string | null;
  toDate?: string | null;
  notes?: string;
  billStatus: string;
  dueAmount?: number;
  tokenNo: string;
  status: string;
  hospitalCode: string;
  roomNumber?: string | null;
  bedNo?: string | null;
  roomType?: string | null;
  assignedNurse?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ── Bills ─────────────────────────────────────────────────────────────────────

export interface BillItemRequest {
  itemName: string;
  itemId?: string | null;
  rate: number;
  qty: number;
  category?: string | null;
}

export interface BillItemResponse {
  id: number;
  itemName: string;
  itemId?: string;
  rate: number;
  qty: number;
  total: number;
  category?: string;
}

export interface BillRequest {
  billType: string; // "OPD" | "IPD" | "SERVICE"
  billDate: string; // ISO date
  patientNo: string;
  patientName: string;
  discount?: number;
  paidAmount?: number;
  billPrinted?: string;
  billed?: boolean;
  billItems: BillItemRequest[];
}

export interface BillResponse {
  id: number;
  billType: string;
  billDate: string;
  patientNo: string;
  patientName: string;
  billNumber: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  billPrinted: string;
  billed: boolean;
  paymentMode?: string;
  hospitalCode: string;
  billItems: BillItemResponse[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Camps ─────────────────────────────────────────────────────────────────────

export interface CampRequest {
  campName: string;
  campType?: string;
  campDate?: string;
  location?: string;
  assignedDoctor?: string;
  description?: string;
  status?: string;
  duration?: string;
  endDate?: string;
}

export interface CampResponse {
  id: number;
  campName: string;
  campType?: string;
  campDate?: string;
  location?: string;
  assignedDoctor?: string;
  description?: string;
  status?: string;
  duration?: string;
  endDate?: string;
  hospitalCode: string;
  createdAt?: string;
}

export interface CampPatientRequest {
  date: string; // ISO date
  campName: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  bp?: string | null;
  glucose?: number | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CampPatientResponse {
  id: number;
  date: string;
  campName: string;
  patientNo: string;
  name: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  bp?: string;
  glucose?: number;
  phone?: string;
  address?: string;
  notes?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── MLC Register ─────────────────────────────────────────────────────────────

export interface MlcRegisterRequest {
  patientNo: string;
  patientName: string;
  age?: number | null;
  gender?: string | null;
  admissionDateTime: string;
  injuryType: string;
  broughtBy: string;
  policeStationName?: string | null;
  firNumber?: string | null;
  informingDoctor?: string | null;
  treatingDoctorId?: string | null;
  treatingDoctorName?: string | null;
  remarks?: string | null;
  status: string;
}

export interface MlcRegisterResponse {
  id: number;
  mlcNo: string;
  patientNo: string;
  patientName: string;
  age?: number;
  gender?: string;
  admissionDateTime: string;
  injuryType: string;
  broughtBy: string;
  policeStationName?: string;
  firNumber?: string;
  informingDoctor?: string;
  treatingDoctorId?: string;
  treatingDoctorName?: string;
  remarks?: string;
  status: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── OT Register ──────────────────────────────────────────────────────────────

export interface OtRegisterRequest {
  patientNo: string;
  patientName: string;
  ipNo?: string | null;
  procedureName: string;
  procedureType: string;
  startDateTime: string;
  endDateTime: string;
  surgeonId?: string | null;
  surgeonName?: string | null;
  anaesthetistId?: string | null;
  anaesthetistName?: string | null;
  scrubNurse?: string | null;
  otRoomNo?: string | null;
  anaesthesiaType?: string | null;
  preOpDiagnosis?: string | null;
  postOpDiagnosis?: string | null;
  outcome: string;
  remarks?: string | null;
}

export interface OtRegisterResponse {
  id: number;
  otNo: string;
  patientNo: string;
  patientName: string;
  ipNo?: string;
  procedureName: string;
  procedureType: string;
  startDateTime: string;
  endDateTime: string;
  surgeonId?: string;
  surgeonName?: string;
  anaesthetistId?: string;
  anaesthetistName?: string;
  scrubNurse?: string;
  otRoomNo?: string;
  anaesthesiaType?: string;
  preOpDiagnosis?: string;
  postOpDiagnosis?: string;
  outcome: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── EDD Register ─────────────────────────────────────────────────────────────

export interface EddRegisterRequest {
  patientNo: string;
  patientName: string;
  ipOpNo?: string | null;
  lmpDate: string;
  eddByLmp: string;
  eddByUsg?: string | null;
  gravida?: number | null;
  para?: number | null;
  living?: number | null;
  abortion?: number | null;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  wardBed?: string | null;
  remarks?: string | null;
  status: string;
}

export interface EddRegisterResponse {
  id: number;
  eddId: string;
  patientNo: string;
  patientName: string;
  ipOpNo?: string;
  lmpDate: string;
  eddByLmp: string;
  eddByUsg?: string;
  gravida?: number;
  para?: number;
  living?: number;
  abortion?: number;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  wardBed?: string;
  remarks?: string;
  status: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Consent Register ──────────────────────────────────────────────────────────

export interface ConsentRegisterRequest {
  patientNo: string;
  patientName: string;
  ipOpNo?: string | null;
  procedureName: string;
  consentType: string;
  signedBy: string;
  guardianName?: string | null;
  relationship?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  witnessName?: string | null;
  consentDateTime: string;
  documentUrl?: string | null;
  remarks?: string | null;
}

export interface ConsentRegisterResponse {
  id: number;
  consentNo: string;
  patientNo: string;
  patientName: string;
  ipOpNo?: string;
  procedureName: string;
  consentType: string;
  signedBy: string;
  guardianName?: string;
  relationship?: string;
  doctorId?: string;
  doctorName?: string;
  witnessName?: string;
  consentDateTime: string;
  documentUrl?: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Death Register ────────────────────────────────────────────────────────────

export interface DeathRegisterRequest {
  patientNo: string;
  patientName: string;
  age?: number | null;
  gender?: string | null;
  ipNo?: string | null;
  wardBed?: string | null;
  deathDateTime: string;
  primaryCause: string;
  secondaryCause?: string | null;
  manner: string;
  certifyingDoctorId?: string | null;
  certifyingDoctorName?: string | null;
  mlcLinked?: string | null;
  mlcNo?: string | null;
  handoverStatus?: string | null;
  handoverToName?: string | null;
  handoverToRelationship?: string | null;
  remarks?: string | null;
}

export interface DeathRegisterResponse {
  id: number;
  deathId: string;
  patientNo: string;
  patientName: string;
  age?: number;
  gender?: string;
  ipNo?: string;
  wardBed?: string;
  deathDateTime: string;
  primaryCause: string;
  secondaryCause?: string;
  manner: string;
  certifyingDoctorId?: string;
  certifyingDoctorName?: string;
  mlcLinked?: string;
  mlcNo?: string;
  handoverStatus?: string;
  handoverToName?: string;
  handoverToRelationship?: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Birth Register ─────────────────────────────────────────────────────────────

export interface BirthRegisterRequest {
  babyName: string;
  gender: string;
  birthDateTime: string; // ISO date-time
  birthWeight?: number | null;
  deliveryType: string;
  motherPatientNo: string;
  motherName: string;
  fatherName?: string | null;
  fatherPhone?: string | null;
  ward?: string | null;
  bedNo?: string | null;
  deliveringDoctorId?: string | null;
  deliveringDoctorName?: string | null;
  apgarScore1min?: number | null;
  apgarScore5min?: number | null;
  remarks?: string | null;
}

export interface BirthRegisterResponse {
  id: number;
  birthId: string;
  babyName: string;
  gender: string;
  birthDateTime: string;
  birthWeight?: number;
  deliveryType: string;
  motherPatientNo: string;
  motherName: string;
  fatherName?: string;
  fatherPhone?: string;
  ward?: string;
  bedNo?: string;
  deliveringDoctorId?: string;
  deliveringDoctorName?: string;
  apgarScore1min?: number;
  apgarScore5min?: number;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Free Patient Register ──────────────────────────────────────────────────────

export interface FreePatientRegisterRequest {
  patientNo: string;
  patientName: string;
  ipOpNo?: string | null;
  schemeName: string;
  servicesCovered: string; // Comma-separated list
  authorisedById?: string | null;
  authorisedByName?: string | null;
  approvalDate: string; // ISO date YYYY-MM-DD
  remarks?: string | null;
}

export interface FreePatientRegisterResponse {
  id: number;
  freePatientId: string;
  patientNo: string;
  patientName: string;
  ipOpNo?: string;
  schemeName: string;
  servicesCovered: string;
  authorisedById?: string;
  authorisedByName?: string;
  approvalDate: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Discharge Register ─────────────────────────────────────────────────────────

export interface DischargeRegisterRequest {
  ipNo: string;
  patientNo: string;
  patientName: string;
  admissionDate: string; // YYYY-MM-DD
  dischargeDateTime: string; // ISO date-time
  treatingDoctorId?: string | null;
  treatingDoctorName?: string | null;
  wardBed?: string | null;
  diagnosis: string;
  procedureDone?: string | null;
  dischargeType: string;
  followUpDate?: string | null; // YYYY-MM-DD
  finalBillAmount: number;
  billSettled: string;
  remarks?: string | null;
}

export interface DischargeRegisterResponse {
  id: number;
  dischargeId: string;
  ipNo: string;
  patientNo: string;
  patientName: string;
  admissionDate: string;
  dischargeDateTime: string;
  treatingDoctorId?: string;
  treatingDoctorName?: string;
  wardBed?: string;
  diagnosis: string;
  procedureDone?: string;
  dischargeType: string;
  followUpDate?: string;
  finalBillAmount: number;
  billSettled: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── 3C Register ────────────────────────────────────────────────────────────────

export interface ThreeCRegisterRequest {
  caseType: string;
  patientNo?: string | null;
  patientName: string;
  age?: number | null;
  gender?: string | null;
  arrivalDateTime: string;
  triageLevel: string;
  chiefComplaint: string;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  referredFrom?: string | null;
  broughtBy: string;
  bp?: string | null;
  pulse?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  actionsTaken?: string | null;
  status: string;
  remarks?: string | null;
}

export interface ThreeCRegisterResponse {
  id: number;
  threeCId: string;
  caseType: string;
  patientNo?: string;
  patientName: string;
  age?: number;
  gender?: string;
  arrivalDateTime: string;
  triageLevel: string;
  chiefComplaint: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  referredFrom?: string;
  broughtBy: string;
  bp?: string;
  pulse?: number;
  temperature?: number;
  spo2?: number;
  actionsTaken?: string;
  status: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Insurance Bill Register ────────────────────────────────────────────────────

export interface InsuranceBillRegisterRequest {
  billNo: string;
  patientNo: string;
  patientName: string;
  ipNo?: string | null;
  insurerName: string;
  policyNumber: string;
  tpaName?: string | null;
  schemeType: string;
  claimAmount: number;
  approvedAmount?: number | null;
  balanceToPatient?: number | null;
  claimStatus: string;
  submissionDate: string; // YYYY-MM-DD
  settlementDate?: string | null; // YYYY-MM-DD
  remarks?: string | null;
}

export interface InsuranceBillRegisterResponse {
  id: number;
  insuranceBillId: string;
  billNo: string;
  patientNo: string;
  patientName: string;
  ipNo?: string;
  insurerName: string;
  policyNumber: string;
  tpaName?: string;
  schemeType: string;
  claimAmount: number;
  approvedAmount?: number;
  balanceToPatient?: number;
  claimStatus: string;
  submissionDate: string;
  settlementDate?: string;
  remarks?: string;
  hospitalCode: string;
  createdAt?: string;
  updatedAt?: string;
}

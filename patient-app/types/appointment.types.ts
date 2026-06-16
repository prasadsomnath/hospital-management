export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
}

export interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialization: string;
  availableDays: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  nextAvailableSlot: string; // e.g. "Tomorrow, 10:00 AM"
  avatarUrl?: string;
}

export interface Slot {
  time: string; // e.g. "09:30 AM"
  isBooked: boolean;
  period: "Morning" | "Afternoon";
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  tokenNo: string;
  status: "Confirmed" | "Pending" | "Examined" | "Cancelled";
  deptId: string;
  notes?: string;
}

export interface TokenQueueStatus {
  deptId: string;
  currentlyServing: number;
  yourToken: number;
  positionInQueue: number;
  totalInQueue: number;
}

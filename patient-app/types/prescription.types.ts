export interface MedicineDose {
  morning: boolean;
  noon: boolean;
  evening: boolean;
  night: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string; // e.g. "500mg"
  form: "tablet" | "capsule" | "syrup" | "injection" | "ointment";
  schedule: MedicineDose;
  durationDays: number;
  qtyToTake: string; // e.g. "1 tablet"
  instructions?: string; // e.g. "After food"
  reminderEnabled: boolean;
  reminderTimes?: {
    morning?: string; // "08:00 AM"
    noon?: string;    // "01:00 PM"
    evening?: string; // "05:00 PM"
    night?: string;   // "09:00 PM"
  };
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string; // YYYY-MM-DD
  diagnosis?: string;
  instructions?: string;
  medicines: Medicine[];
  followUpDate?: string;
}

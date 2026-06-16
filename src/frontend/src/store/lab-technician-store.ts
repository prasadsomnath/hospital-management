import { apiFetch } from "@/lib/api";
import { getLocalDateString } from "@/lib/utils";
import { create } from "zustand";
import { useAuthStore } from "./auth-store";

export interface OpdRx {
  opdNo: string;
  patientName: string;
  examBy: string;
  tradeName: string;
  am: string;
  noon: string;
  pm: string;
  hs: string;
  unit: string;
  duration: string;
  instruction: string;
}

export interface Doctor {
  name: string;
  code: string;
}

export interface Patient {
  id: string;
  patientNo: string;
  name: string;
  age: string;
  gender: string;
  place: string;
  phone: string;
  address?: string;
}

export interface ServicePatient {
  srl?: number; // Optional on backend, added on frontend
  id?: number;
  patientNo: string;
  name: string;
  status: string;
  time: string;
  appFor: string;
  due: number;
  token: string;
  billingType: string;
}

export interface DiagnosticItem {
  id?: number;
  item: string;
  rate: number;
}

export interface PaymentLog {
  id?: number;
  date: string;
  time: string;
  recpNo: string;
  amount: number;
  type: string;
  cheque: string;
}

export interface DiagnosticRecord {
  id: string;
  module: string;
  patientNo: string;
  patientName: string;
  date: string;
  total: number;
  discount: number;
  net: number;
  paid: number;
  due: number;
  wardBed: string;
  billPrint: string;
  ref: string;
  reportingDoctor: string;
  age: string;
  gender: string;
  address: string;
  place: string;
  phone: string;
  indication?: string;
  history?: string;
  treatment?: string;
  advice?: string;
  admitted?: boolean;
  inchargeDr?: string;
  items: DiagnosticItem[];
  payments: PaymentLog[];
  lmpDate?: string;
  weeks?: string;
  refId?: string;
  email?: string;
  notes?: string;
}

interface LabTechnicianStore {
  patients: Patient[];
  doctors: Doctor[];
  servicePatients: ServicePatient[];
  records: DiagnosticRecord[];
  opdRxList: OpdRx[];
  procedureCatalog: Record<string, DiagnosticItem[]>;
  selectedRecordId: string | null;
  globalDate: string;
  serviceDeptFilter: string;
  serviceDocFilter: string;
  dashboardTab: "appointments" | "date";
  opdSearchNo: string;
  defaultReportingDr: string;
  loading: boolean;

  setPatients: (patients: Patient[]) => void;
  setDoctors: (doctors: Doctor[]) => void;
  setServicePatients: (servicePatients: ServicePatient[]) => void;
  setRecords: (records: DiagnosticRecord[]) => void;
  setSelectedRecordId: (id: string | null) => void;
  setGlobalDate: (date: string) => void;
  setServiceDeptFilter: (filter: string) => void;
  setServiceDocFilter: (filter: string) => void;
  setDashboardTab: (tab: "appointments" | "date") => void;
  setOpdSearchNo: (no: string) => void;
  setDefaultReportingDr: (dr: string) => void;

  fetchDoctors: () => Promise<void>;
  fetchServicePatients: () => Promise<void>;
  fetchRecords: (module?: string) => Promise<void>;
  fetchPatients: () => Promise<void>;
  fetchOpdRxList: (search?: string) => Promise<void>;
  fetchProcedureCatalog: () => Promise<void>;

  addPatient: (patient: Patient) => Promise<void>;
  addDoctor: (doctor: Doctor) => Promise<void>;
  addRecord: (record: DiagnosticRecord) => Promise<void>;
  sendReportToDoctor: (record: DiagnosticRecord) => Promise<void>;
  updateRecord: (
    id: string,
    updated: Partial<DiagnosticRecord>,
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  addProcedureItem: (
    recordId: string,
    item: string,
    rate: number,
  ) => Promise<void>;
  addPayment: (
    recordId: string,
    amount: number,
    type: string,
    cheque: string,
  ) => Promise<void>;
}

export const useLabTechnicianStore = create<LabTechnicianStore>((set, get) => ({
  patients: [],
  doctors: [],
  servicePatients: [],
  records: [],
  opdRxList: [],
  procedureCatalog: {},
  selectedRecordId: null,
  globalDate: getLocalDateString(),
  serviceDeptFilter: "ALL",
  serviceDocFilter: "ALL",
  dashboardTab: "appointments",
  opdSearchNo: "",
  defaultReportingDr: "",
  loading: false,

  setPatients: (patients) => set({ patients }),
  setDoctors: (doctors) => set({ doctors }),
  setServicePatients: (servicePatients) => set({ servicePatients }),
  setRecords: (records) => set({ records }),
  setSelectedRecordId: (selectedRecordId) => set({ selectedRecordId }),
  setGlobalDate: (globalDate) => set({ globalDate }),
  setServiceDeptFilter: (serviceDeptFilter) => set({ serviceDeptFilter }),
  setServiceDocFilter: (serviceDocFilter) => set({ serviceDocFilter }),
  setDashboardTab: (dashboardTab) => set({ dashboardTab }),
  setOpdSearchNo: (opdSearchNo) => set({ opdSearchNo }),
  setDefaultReportingDr: (defaultReportingDr) => set({ defaultReportingDr }),

  fetchDoctors: async () => {
    set({ loading: true });
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const res = await apiFetch<any>("/admin/doctors", {
        headers: { "X-Hospital-Code": code },
      });
      const content = Array.isArray(res) ? res : res.content || [];
      const mapped = content.map((doc: any) => ({
        code: doc.doctorCode || String(doc.id),
        name: `Dr. ${doc.firstName} ${doc.lastName || ""}`.trim(),
      }));
      set({ doctors: mapped });
    } catch (e) {
      console.error("Failed to fetch doctors from admin microservice:", e);
      set({ doctors: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchServicePatients: async () => {
    set({ loading: true });
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const res = await apiFetch<any>("/lab/service-patients", {
        headers: { "X-Hospital-Code": code },
      });
      const data = Array.isArray(res) ? res : res.content || [];
      // Map to include a client-side srl sequence
      const mapped = data.map((item: any, index: number) => ({
        ...item,
        srl: index + 1,
      }));
      set({ servicePatients: mapped });
    } catch (e) {
      console.error("Failed to fetch service patients queue:", e);
    } finally {
      set({ loading: false });
    }
  },

  fetchRecords: async (module) => {
    set({ loading: true });
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const url = module ? `/lab/records?module=${module}` : "/lab/records";
      const res = await apiFetch<any>(url, {
        headers: { "X-Hospital-Code": code },
      });
      const records = Array.isArray(res) ? res : res.content || [];

      let selectedId = get().selectedRecordId;
      if (records.length > 0) {
        if (selectedId && !records.some((r) => r.id === selectedId)) {
          selectedId = null;
        }
      } else {
        selectedId = null;
      }

      set({ records, selectedRecordId: selectedId });
    } catch (e) {
      console.error("Failed to fetch records:", e);
    } finally {
      set({ loading: false });
    }
  },

  fetchPatients: async () => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const response = await apiFetch<any>("/reception/patients?size=1000", {
        headers: { "X-Hospital-Code": code },
      });
      const data = Array.isArray(response) ? response : response.content || [];
      const list = data.map((p: any) => ({
        id: String(p.id),
        patientNo: p.patientNo || String(p.id),
        name: `${p.firstName} ${p.lastName || ""}`.trim(),
        age: p.dob
          ? String(new Date().getFullYear() - new Date(p.dob).getFullYear())
          : "30",
        gender: p.gender || "Male",
        place: p.placePin || "",
        phone: p.phone || p.alternativeNum || "",
        address: p.address || "",
      }));
      set({ patients: list });
    } catch (e) {
      console.warn(
        "Could not fetch patients from patient-service, deriving from records and queue",
        e,
      );
      const records = get().records;
      const servicePatients = get().servicePatients;
      const patientMap = new Map<string, Patient>();

      records.forEach((r) => {
        if (!patientMap.has(r.patientNo)) {
          patientMap.set(r.patientNo, {
            id: r.patientNo,
            patientNo: r.patientNo,
            name: r.patientName,
            age: r.age,
            gender: r.gender,
            place: r.place,
            phone: r.phone,
            address: r.address,
          });
        }
      });

      servicePatients.forEach((sp) => {
        if (!patientMap.has(sp.patientNo)) {
          patientMap.set(sp.patientNo, {
            id: sp.patientNo,
            patientNo: sp.patientNo,
            name: sp.name,
            age: "30",
            gender: "Male",
            place: "",
            phone: "",
            address: "",
          });
        }
      });

      set({ patients: Array.from(patientMap.values()) });
    }
  },

  addPatient: async (patient) => {
    // Standard patient creation would go to patient-service.
    // Locally, we will append it to our active patients array.
    set((state) => ({ patients: [...state.patients, patient] }));
  },

  addDoctor: async (doctor) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      await apiFetch<Doctor>("/lab/doctors", {
        method: "POST",
        headers: { "X-Hospital-Code": code },
        body: JSON.stringify(doctor),
      });
      await get().fetchDoctors();
    } catch (e) {
      console.error("Failed to add doctor:", e);
    }
  },

  addRecord: async (record) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const saved = await apiFetch<DiagnosticRecord>("/lab/records", {
        method: "POST",
        headers: { "X-Hospital-Code": code },
        body: JSON.stringify(record),
      });

      // Auto-remove patient from active queue when a diagnostic record is added
      try {
        await apiFetch<void>(`/lab/service-patients/${record.patientNo}`, {
          method: "DELETE",
          headers: { "X-Hospital-Code": code },
        });
      } catch (e) {
        console.warn("Queue item was not deleted (might not exist):", e);
      }

      // Send the record as a report to the reporting doctor
      try {
        await get().sendReportToDoctor(saved);
      } catch (e) {
        console.warn("Failed to send report to doctor (non-blocking):", e);
      }

      await get().fetchRecords(record.module);
      await get().fetchServicePatients();
      set({ selectedRecordId: saved.id });
    } catch (e) {
      console.error("Failed to add diagnostic record:", e);
    }
  },

  sendReportToDoctor: async (record) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";

      // Derive a human-readable report type from the module
      const moduleLabels: Record<string, string> = {
        xray: "X-Ray",
        "ct-scan": "CT Scan",
        ctscan: "CT Scan",
        "udr-ct": "CT Scan",
        usg: "USG",
        lab: "Laboratory",
        "other-services": "Other Services",
        mri: "MRI",
        "udr-mri": "MRI",
        echo: "Echo",
        "udr-echo": "Echo",
        ot: "OT",
        "udr-ot": "OT",
        physio: "Physiotherapy",
        physiotherapy: "Physiotherapy",
        "udr-physio": "Physiotherapy",
        daycare: "Day Care",
        "day-care": "Day Care",
        datcare: "Day Care",
        "udr-daycare": "Day Care",
      };
      const reportType =
        moduleLabels[record.module] ||
        record.module.replace("udr-", "UDR ").replace("-", " ");

      const isDiagnosticModality = record.module !== "lab";

      if (isDiagnosticModality) {
        // Route to Doctor's Diagnostics Workstation
        const testName =
          record.items.map((item) => item.item).join(", ") ||
          `${reportType} Procedure`;
        const payload = {
          patientNo: record.patientNo,
          testName: testName,
          department: reportType,
          remarks:
            record.notes ||
            record.history ||
            `Scan registered. Diagnostics observations pending interpretation for ${record.patientName}.`,
        };

        await apiFetch<any>("/doctor/diagnostics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Hospital-Code": code,
          },
          body: JSON.stringify(payload),
        });

        console.info(
          `Diagnostic scan routed to Doctor's Diagnostics workstation for patient: ${record.patientNo}`,
        );
      } else {
        // Route to Doctor's Lab Reports Archive
        const reportName = `${reportType} Report - ${record.patientName}`;
        const queryParams = [
          `patientNo=${encodeURIComponent(record.patientNo)}`,
          `reportName=${encodeURIComponent(reportName)}`,
          `reportType=${encodeURIComponent(reportType)}`,
          `doctorName=${encodeURIComponent(record.reportingDoctor || "")}`,
          `fileUrl=${encodeURIComponent("")}`,
        ].join("&");

        await apiFetch<any>(`/doctor/reports?${queryParams}`, {
          method: "POST",
          headers: { "X-Hospital-Code": code },
        });

        console.info(
          `Lab report routed to Doctor's Reports Archive: ${record.reportingDoctor}`,
        );
      }
    } catch (e) {
      console.error("Failed to route report to doctor-service:", e);
    }
  },

  updateRecord: async (id, updated) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const current = get().records.find((r) => r.id === id);
      if (!current) return;

      const merged = { ...current, ...updated };
      const saved = await apiFetch<DiagnosticRecord>(`/lab/records/${id}`, {
        method: "PUT",
        headers: { "X-Hospital-Code": code },
        body: JSON.stringify(merged),
      });

      // Send the updated record as a report to the reporting doctor
      try {
        await get().sendReportToDoctor(saved);
      } catch (e) {
        console.warn(
          "Failed to send updated report to doctor (non-blocking):",
          e,
        );
      }

      await get().fetchRecords(current.module);
    } catch (e) {
      console.error("Failed to update diagnostic record:", e);
    }
  },

  deleteRecord: async (id) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const record = get().records.find((r) => r.id === id);
      const module = record?.module;

      await apiFetch<void>(`/lab/records/${id}`, {
        method: "DELETE",
        headers: { "X-Hospital-Code": code },
      });

      await get().fetchRecords(module);
    } catch (e) {
      console.error("Failed to delete diagnostic record:", e);
    }
  },

  addProcedureItem: async (recordId, item, rate) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const record = get().records.find((r) => r.id === recordId);
      const module = record?.module;

      const saved = await apiFetch<DiagnosticRecord>(
        `/lab/records/${recordId}/items`,
        {
          method: "POST",
          headers: { "X-Hospital-Code": code },
          body: JSON.stringify({ item, rate }),
        },
      );

      // Send the updated record as a report to the reporting doctor
      try {
        await get().sendReportToDoctor(saved);
      } catch (e) {
        console.warn(
          "Failed to send updated report to doctor (non-blocking):",
          e,
        );
      }

      await get().fetchRecords(module);
    } catch (e) {
      console.error("Failed to add procedure item:", e);
    }
  },

  addPayment: async (recordId, amount, type, cheque) => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const record = get().records.find((r) => r.id === recordId);
      const module = record?.module;

      await apiFetch<DiagnosticRecord>(`/lab/records/${recordId}/payments`, {
        method: "POST",
        headers: { "X-Hospital-Code": code },
        body: JSON.stringify({ amount, type, cheque }),
      });

      await get().fetchRecords(module);
    } catch (e) {
      console.error("Failed to add payment:", e);
    }
  },

  fetchOpdRxList: async (search) => {
    set({ loading: true });
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const url = search
        ? `/lab/opd-rx?search=${encodeURIComponent(search)}`
        : "/lab/opd-rx";
      const res = await apiFetch<any>(url, {
        headers: { "X-Hospital-Code": code },
      });
      const opdRxList = Array.isArray(res) ? res : res.content || [];
      set({ opdRxList });
    } catch (e) {
      console.error("Failed to fetch OPD Rx list:", e);
    } finally {
      set({ loading: false });
    }
  },

  fetchProcedureCatalog: async () => {
    try {
      const code = useAuthStore.getState().user?.hospitalCode || "HSP001";
      const res = await apiFetch<any>("/lab/procedure-catalog", {
        headers: { "X-Hospital-Code": code },
      });
      // Expected shape: { xray: [{item, rate}], lab: [...], ... }
      if (res && typeof res === "object" && !Array.isArray(res)) {
        set({ procedureCatalog: res });
      }
    } catch (e) {
      console.error("Failed to fetch procedure catalog from backend:", e);
      set({ procedureCatalog: {} });
    }
  },
}));

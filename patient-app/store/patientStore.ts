import { create } from "zustand";
import patientService from "../services/patientService";
import { Patient, DashboardData } from "../types/patient.types";

interface PatientState {
  patient: Patient | null;
  dashboard: DashboardData | null;

  isLoading: boolean;
  error: string | null;

  // Actions
  loadDashboard: (patientId: string) => Promise<void>;
  loadProfile: (patientId: string) => Promise<void>;
  updateProfile: (patientId: string, updatedData: Partial<Patient>) => Promise<boolean>;

  clearPatientState: () => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patient: null,
  dashboard: null,

  isLoading: false,
  error: null,

  loadDashboard: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await patientService.getDashboard(patientId);
      set({ dashboard, error: null });
    } catch (e: any) {
      set({ error: e.message || "Failed to load dashboard metrics" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadProfile: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const patient = await patientService.getProfile(patientId);
      const alignedPatient = {
        ...patient,
        id: patient.patientNo || patient.id,
      };
      set({ patient: alignedPatient, error: null });
    } catch (e: any) {
      // Only surface the error — logout is handled by the 401 response interceptor in api.ts
      set({ error: e.message || "Failed to fetch profile details" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (patientId: string, updatedData: Partial<Patient>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await patientService.updateProfile(patientId, updatedData);
      const alignedUpdated = {
        ...updated,
        id: updated.patientNo || updated.id,
      };
      set((state) => ({
        patient: alignedUpdated,
        dashboard: state.dashboard ? {
          ...state.dashboard,
          patientName: `${alignedUpdated.firstName} ${alignedUpdated.lastName}`,
          dueAmount: alignedUpdated.dueAmount,
        } : null,
        error: null,
      }));
      return true;
    } catch (e: any) {
      set({ error: e.message || "Failed to update profile changes" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },



  clearPatientState: () => set({ patient: null, dashboard: null, error: null }),
}));

export default usePatientStore;

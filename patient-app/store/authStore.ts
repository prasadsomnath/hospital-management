import { create } from "zustand";
import storage from "../utils/storage.utils";
import APP_CONFIG from "../constants/app.config";
import authService from "../services/authService";
import api from "../services/api";
import { normalizePatient } from "../services/patientService";
import { Patient } from "../types/patient.types";
import API_ENDPOINTS from "../constants/api.endpoints";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  patient: Patient | null;
  isLoading: boolean;
  mobile: string | null;
  error: string | null;
  hospitalCode: string;
  hospitals: Array<{ id: number; hospitalCode: string; hospitalName: string }>;
  
  // Actions
  initializeAuth: () => Promise<void>;
  sendOtp: (mobile: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  register: (patientData: Partial<Patient>) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setMobile: (mobile: string) => void;
  setHospitalCode: (code: string) => void;
  loadHospitals: () => Promise<void>;
  loginWithIdAndDob: (patientId: string, dob: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  patient: null,
  isLoading: false,
  mobile: null,
  error: null,
  hospitalCode: "", // Set at login time from the hospital selector
  hospitals: [],

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await storage.getItem(APP_CONFIG.tokenStorageKey);
      if (token) {
        let hospitalCode = await storage.getItem(APP_CONFIG.hospitalCodeStorageKey);
        // First try: restore from locally cached profile (saved on login/register)
        const cached = await storage.getItem("polyclinic_mock_profile");
        if (cached) {
          const rawPatient = JSON.parse(cached);
          // Re-normalize in case field names need mapping from earlier logins
          const patient = normalizePatient(rawPatient);
          
          if (!hospitalCode && patient.hospitalCode) {
            hospitalCode = patient.hospitalCode;
            await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, hospitalCode);
          }
          if (!hospitalCode) {
            hospitalCode = "AP-001";
            await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, hospitalCode);
          }
          
          set({ token, isAuthenticated: true, patient, hospitalCode, error: null });

          // Background refresh: fetch latest patient profile from API
          if (patient.id) {
            try {
              const res = await api.get(API_ENDPOINTS.PATIENT.GET_PROFILE(patient.id));
              const freshPatient = normalizePatient(res.data);
              await storage.setItem("polyclinic_mock_profile", JSON.stringify(freshPatient));
              if (freshPatient.hospitalCode) {
                await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, freshPatient.hospitalCode);
                set({ patient: freshPatient, hospitalCode: freshPatient.hospitalCode });
              } else {
                set({ patient: freshPatient });
              }
            } catch (refreshErr: any) {
              // Background refresh failed — keep the cached profile, do NOT log out.
              // A 404 here could mean the reception service is temporarily down,
              // NOT that the patient is invalid. Logout is only for 401 (bad token).
              console.log("Background profile refresh failed, using cached", refreshErr);
            }
          }
        } else {
          // No cache, still mark as authenticated so app can navigate
          // Patient hook will fetch profile when it gets the ID from auth state
          if (!hospitalCode) {
            hospitalCode = "AP-001";
            await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, hospitalCode);
          }
          set({ token, isAuthenticated: true, patient: null, hospitalCode, error: null });
        }
      } else {
        set({ token: null, isAuthenticated: false, patient: null });
      }
    } catch (e) {
      set({ error: "Failed to initialize session" });
    } finally {
      set({ isLoading: false });
    }
  },

  sendOtp: async (mobile: string) => {
    set({ isLoading: true, error: null, mobile });
    try {
      const result = await authService.sendOtp(mobile);
      return result.isExisting;
    } catch (e: any) {
      set({ error: e.message || "Failed to send OTP" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (otp: string) => {
    const { mobile } = get();
    if (!mobile) {
      set({ error: "Mobile number session missing" });
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      const result = await authService.verifyOtp(mobile, otp);
      const patient = {
        ...result.patient,
        id: result.patient.patientNo || result.patient.id,
      };
      
      const matchedHospitalCode = patient.hospitalCode || get().hospitalCode || "AP-001";
      await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, matchedHospitalCode);
      await storage.setItem("polyclinic_mock_profile", JSON.stringify(patient));
      
      set({
        token: result.token,
        isAuthenticated: true,
        patient,
        hospitalCode: matchedHospitalCode,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({ error: e.message || "Invalid OTP, please try again" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (patientData: Partial<Patient>) => {
    const { mobile, hospitalCode } = get();
    const payload = { ...patientData, mobile: mobile || patientData.mobile };
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(payload);
      const patient = {
        ...result.patient,
        id: result.patient.patientNo || result.patient.id,
      };
      
      const matchedHospitalCode = patient.hospitalCode || hospitalCode || "AP-001";
      await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, matchedHospitalCode);
      await storage.setItem("polyclinic_mock_profile", JSON.stringify(patient));
      
      set({
        token: result.token,
        isAuthenticated: true,
        patient,
        hospitalCode: matchedHospitalCode,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({ error: e.message || "Registration failed" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      await storage.deleteItem("polyclinic_mock_profile");
      await storage.deleteItem(APP_CONFIG.hospitalCodeStorageKey);
      set({ token: null, isAuthenticated: false, patient: null, mobile: null, hospitalCode: "", error: null });
    } catch (e) {
      set({ error: "Logout failed" });
    } finally {
      set({ isLoading: false });
    }
  },

  setHospitalCode: (hospitalCode: string) => {
    // hospitalCode is stored in Zustand state and passed as X-Hospital-Code header at login.
    // It is NOT stored in APP_CONFIG (that property was removed).
    storage.setItem(APP_CONFIG.hospitalCodeStorageKey, hospitalCode).catch(() => {});
    set({ hospitalCode });
  },

  loadHospitals: async () => {
    set({ isLoading: true });
    try {
      const hospitals = await authService.getHospitals();
      set({ hospitals, error: null });
      if (hospitals.length > 0 && !get().hospitalCode) {
        const defaultHospital = hospitals.find(h => h.hospitalCode === "HSP202601") || hospitals[0];
        set({ hospitalCode: defaultHospital.hospitalCode });
      }
    } catch (e: any) {
      console.log("Failed to load hospitals list", e);
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithIdAndDob: async (patientNo: string, dob: string) => {
    const { hospitalCode } = get();
    set({ isLoading: true, error: null });
    try {
      const result = await authService.loginWithIdAndDob(patientNo, dob, hospitalCode);
      const patient = {
        ...result.patient,
        id: result.patient.patientNo || result.patient.id,
      };
      
      const matchedHospitalCode = patient.hospitalCode || hospitalCode || "AP-001";
      await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, matchedHospitalCode);
      await storage.setItem("polyclinic_mock_profile", JSON.stringify(patient));
      
      set({
        token: result.token,
        isAuthenticated: true,
        patient,
        hospitalCode: matchedHospitalCode,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({ error: e.response?.data?.error || e.message || "Failed to verify Patient ID or Date of Birth" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  setMobile: (mobile: string) => set({ mobile }),
}));

export default useAuthStore;

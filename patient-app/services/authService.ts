import api from "./api";
import storage from "../utils/storage.utils";
import APP_CONFIG from "../constants/app.config";
import API_ENDPOINTS from "../constants/api.endpoints";
import { normalizePatient } from "./patientService";
import { Patient } from "../types/patient.types";

export const authService = {
  sendOtp: async (mobile: string): Promise<{ isExisting: boolean; message: string }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.SEND_OTP, { mobile });
    return response.data;
  },

  verifyOtp: async (
    mobile: string,
    otp: string
  ): Promise<{ token: string; refreshToken: string; patient: Patient }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { mobile, otp });
    const { accessToken, refreshToken, patient: rawPatient } = response.data;
    await storage.setItem(APP_CONFIG.tokenStorageKey, accessToken);
    await storage.setItem(APP_CONFIG.refreshTokenStorageKey, refreshToken);
    const patient = normalizePatient(rawPatient);
    if (patient.hospitalCode) {
      await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, patient.hospitalCode);
    }
    await storage.setItem("polyclinic_mock_profile", JSON.stringify(patient));
    return { token: accessToken, refreshToken, patient };
  },

  register: async (patientData: Partial<Patient>): Promise<{ token: string; patient: Patient }> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, patientData);
    const { accessToken, refreshToken, patient: rawPatient } = response.data;
    await storage.setItem(APP_CONFIG.tokenStorageKey, accessToken);
    if (refreshToken) {
      await storage.setItem(APP_CONFIG.refreshTokenStorageKey, refreshToken);
    }
    const patient = normalizePatient(rawPatient);
    if (patient.hospitalCode) {
      await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, patient.hospitalCode);
    }
    await storage.setItem("polyclinic_mock_profile", JSON.stringify(patient));
    return { token: accessToken, patient };
  },

  getHospitals: async (): Promise<Array<{ id: number; hospitalCode: string; hospitalName: string }>> => {
    const response = await api.get(API_ENDPOINTS.AUTH.HOSPITALS);
    return response.data;
  },

  loginWithIdAndDob: async (
    patientNo: string,
    dob: string,
    hospitalCode: string
  ): Promise<{ token: string; refreshToken: string; patient: Patient }> => {
    const response = await api.post(
      API_ENDPOINTS.AUTH.LOGIN_ID_DOB,
      { patientNo, dob },
      {
        headers: {
          "X-Hospital-Code": hospitalCode,
        },
      }
    );
    const { accessToken, refreshToken, patient: rawPatient } = response.data;
    await storage.setItem(APP_CONFIG.tokenStorageKey, accessToken);
    await storage.setItem(APP_CONFIG.refreshTokenStorageKey, refreshToken);
    const patient = normalizePatient(rawPatient);
    if (patient.hospitalCode) {
      await storage.setItem(APP_CONFIG.hospitalCodeStorageKey, patient.hospitalCode);
    }
    await storage.setItem("polyclinic_mock_profile", JSON.stringify(patient));
    return { token: accessToken, refreshToken, patient };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.log("Logout API error, clearing local storage only", e);
    } finally {
      await storage.deleteItem(APP_CONFIG.tokenStorageKey);
      await storage.deleteItem(APP_CONFIG.refreshTokenStorageKey);
      await storage.deleteItem(APP_CONFIG.hospitalCodeStorageKey);
      await storage.deleteItem("polyclinic_mock_profile");
    }
  },
};

export default authService;

import APP_CONFIG from "./app.config";

export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: APP_CONFIG.apiBaseUrl,

  // Auth Endpoints
  AUTH: {
    SEND_OTP: "/auth/patient/send-otp",
    VERIFY_OTP: "/auth/patient/verify-otp",
    REFRESH_TOKEN: "/auth/patient/refresh-token",
    REGISTER: "/patients/register",
    LOGIN_ID_DOB: "/auth/patient/login-id-dob",
    HOSPITALS: "/auth/patient/hospitals",
  },


  // Patient Endpoints
  PATIENT: {
    GET_PROFILE: (id: string) => `/patients/${id}`,
    UPDATE_PROFILE: (id: string) => `/patients/${id}`,
    GET_DASHBOARD: (id: string) => `/patients/${id}/dashboard`,
    GET_HEALTH_CARD: (id: string) => `/patients/${id}/health-card`,
  },

  // Appointment Endpoints
  APPOINTMENTS: {
    DEPARTMENTS: "/appointments/departments",
    DOCTORS: "/appointments/doctors",
    SLOTS: "/appointments/slots",
    CREATE: "/appointments",
    LIST: (patientId: string) => `/appointments/${patientId}/list`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    TOKEN_STATUS: (deptId: string) => `/appointments/token-status/${deptId}`,
  },

  // Lab Report Endpoints
  LAB: {
    LIST: (patientId: string) => `/reports/${patientId}/all`,
    DETAIL: (reportId: string) => `/reports/${reportId}/detail`,
    PDF: (reportId: string) => `/reports/${reportId}/pdf`,
    REFERENCE_RANGES: (reportId: string) => `/reports/${reportId}/reference-ranges`,
  },

  // Prescription Endpoints
  PRESCRIPTION: {
    LIST: (patientId: string) => `/prescriptions/${patientId}/list`,
    DETAIL: (visitId: string) => `/prescriptions/${visitId}/detail`,
  },



  // Billing Endpoints
  BILLING: {
    LIST: (patientId: string) => `/billing/${patientId}/bills`,
    DETAIL: (billId: string) => `/billing/${billId}/detail`,
    RECEIPT_PDF: (receiptId: string) => `/billing/${receiptId}/receipt-pdf`,
  },

  // Notification Endpoints
  NOTIFICATIONS: {
    LIST: (patientId: string) => `/notifications/${patientId}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    REGISTER_DEVICE: "/notifications/register-device",
    CLEAR: "/notifications/clear",
  },
};

export default API_ENDPOINTS;

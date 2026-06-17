export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://erp.vinayhp.in";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VALIDATE: `${API_BASE_URL}/auth/validate`,
  },
};

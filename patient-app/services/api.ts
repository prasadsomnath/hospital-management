import axios from "axios";
import { router } from "expo-router";
import storage from "../utils/storage.utils";
import APP_CONFIG from "../constants/app.config";

export const api = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject JWT Token and Hospital Code
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(APP_CONFIG.tokenStorageKey);
      if (token && config.headers) {
        if (typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      let hospitalCode = "";
      
      // 1. Try local storage first to break circular dependency with authStore
      try {
        hospitalCode = (await storage.getItem(APP_CONFIG.hospitalCodeStorageKey)) || "";
      } catch (storageErr) {}
      
      // 2. Fallback to authStore state
      if (!hospitalCode) {
        try {
          const { useAuthStore } = require("../store/authStore");
          hospitalCode = useAuthStore.getState().hospitalCode || "";
        } catch (err) {
          // Dynamic require fails in some bundles or test environments
        }
      }
      
      const finalHospitalCode = hospitalCode || "HSP202601";
      console.log("[API Interceptor] Target URL:", config.url, "Resolved hospitalCode:", finalHospitalCode);
      
      if (config.headers) {
        if (typeof config.headers.set === "function") {
          config.headers.set("X-Hospital-Code", finalHospitalCode);
          config.headers.set("x-hospital-code", finalHospitalCode);
        } else {
          config.headers["X-Hospital-Code"] = finalHospitalCode;
          config.headers["x-hospital-code"] = finalHospitalCode;
        }
        
        console.log("[API Interceptor] Outgoing Headers:", config.headers);
      }
    } catch (e) {
      console.log("Failed to retrieve auth token or hospital code", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Refresh or Session Expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the patient portal is deactivated for this hospital
    if (error.response?.status === 403 && error.response?.data?.error === "MODULE_DISABLED") {
      alert("Patient Portal is currently deactivated for your hospital. Please contact support.");
      try {
        await storage.deleteItem(APP_CONFIG.tokenStorageKey);
        await storage.deleteItem(APP_CONFIG.refreshTokenStorageKey);
      } catch (e) {
        console.log("Failed to clear tokens on deactivation", e);
      }
      router.replace("/(auth)/login");
      return Promise.reject(error);
    }
    
    // If unauthorized (401) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem(APP_CONFIG.refreshTokenStorageKey);
        if (refreshToken) {
          // Attempt token refresh via Spring Boot auth controller
          const refreshRes = await axios.post(`${APP_CONFIG.apiBaseUrl}/auth/patient/refresh-token`, {
            refreshToken,
          });
          
          if (refreshRes.status === 200 && refreshRes.data.accessToken) {
            const { accessToken, newRefreshToken } = refreshRes.data;
            
            // Store new tokens
            await storage.setItem(APP_CONFIG.tokenStorageKey, accessToken);
            if (newRefreshToken) {
              await storage.setItem(APP_CONFIG.refreshTokenStorageKey, newRefreshToken);
            }
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.log("Refresh token expired or failed", refreshError);
        // Clear tokens on failure so store prompts login
        await storage.deleteItem(APP_CONFIG.tokenStorageKey);
        await storage.deleteItem(APP_CONFIG.refreshTokenStorageKey);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import Constants from "expo-constants";

/**
 * Port layout (local dev):
 *   Frontend web (ERP)  → http://localhost:3000
 *   Patient-app (Expo)  → http://localhost:5000  (or 5001 if 5000 is taken by macOS AirPlay)
 *   Backend gateway     → http://localhost:30080  (k8s NodePort → gateway:8080 internally)
 *
 * NOTE: Avoid importing "Platform" from react-native at the top level of this file.
 * app.config.ts is evaluated during Metro's module initialization phase, and
 * Platform from react-native can cause circular dependency / SSR issues on web.
 *
 * Instead we derive the API host from the Expo Metro hostUri:
 *   - On web:    hostUri is undefined → falls back to "localhost" → correct
 *   - On native: hostUri = "192.168.x.x:8081" → extracts the machine IP → correct
 */
const hostUri = Constants.expoConfig?.hostUri ?? "";
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";

export const APP_CONFIG = {
  appName: "PolyClinic",
  appVersion: "1.0.0",
  /**
   * hospitalCode is NOT hardcoded here — it comes from the JWT token returned
   * by the auth service after login. The gateway injects it as X-Hospital-Code.
   * Hardcoding "CHARLIE" was wrong: that hospital does not exist in the DB.
   * Active hospitals: "apollo" (Apollo Hospital), "HSP202601" (Hemant Clinics)
   */
  /**
   * In dev, always target the k8s gateway NodePort (30080).
   * The localIp is "localhost" on web (hostUri is undefined) and the
   * actual LAN IP on a physical device — both point to the right gateway.
   */
  apiBaseUrl: __DEV__
    ? `http://${localIp}:30080`
    : "https://api.polyclinic.com",
  tokenStorageKey: "polyclinic_jwt_token",
  refreshTokenStorageKey: "polyclinic_refresh_token",
  hospitalCodeStorageKey: "polyclinic_hospital_code",
  reminderPrefsKey: "polyclinic_medicine_reminders",
  themePrefsKey: "polyclinic_theme_mode",
  languagePrefsKey: "polyclinic_language_preference",
  otpTimeoutSeconds: 30,
};

export default APP_CONFIG;

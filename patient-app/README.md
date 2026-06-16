# PolyClinic Patient Mobile Application

A complete patient-facing React Native (Expo SDK 51) mobile application built for the **PolyClinic Hospital Management System**. Designed with the clean, minimalist, and trustworthy medical UX inspired by **Orange Health Labs**.

---

## 🚀 Key Features

*   **Secure Mobile OTP Verification**: Powered by MSG91/Firebase verification (JWTs stored securely in `expo-secure-store`).
*   **Aesthetic Home Dashboard**: Aggregates clinic visits, time-sensitive greetings, outstanding invoices, and active prescriptions.
*   **Multi-Step Appointment Funnel**: Instant token booking across specialties (General Medicine, Gynaecology, Paediatrics, Orthopaedics).
*   **Live Queue Token Tracker**: 30-second polling tracking current vs scheduled tokens.
*   **Offline Support**: Local caching of prescriptions, daily repeating alarms, and offline summary health cards.
*   **Inpatient active admission sheet**: Displays Delaney beds, nurse logs, and SVGs vitals graphs.
*   **Consolidated Billing & PDF Prints**: View receipts and compile PDFs using `expo-print`.

---

## 🛠️ Technology Stack

*   **Core**: React Native (Expo SDK 51), TypeScript
*   **Navigation**: Expo Router (File-based router)
*   **State Management**: Zustand
*   **API Client**: Axios (interceptor handles automatic token refresh)
*   **Styling**: NativeWind (Tailwind classes) / Custom Stylesheets
*   **Vectors**: Lucide React Native / Expo Icons
*   **Local Alarms**: Expo Notifications / AsyncStorage

---

## 📂 Project Structure

```
/patient-app
  /app
    /(auth)                  # Onboarding, Login, verification, registration
    /(tabs)                  # Main navigation bar (Home, Bookings, Reports, Invoices, Profile)
    /appointment             # Booking funnel, reschedule drawers, active tickets
    /lab                     # Detailed test ranges, printable PDF views
    /prescription            # Medicine logs, custom alert togglers
    /inpatient               # Ward dashboards, vector vitals, nurse log timings
    /billing                 # Detailed tables, clinical receipt papers
    /health-card             # Digital summaries, large Wallet QR codes
    /notifications           # Time-grouped alerts, unread blue dots
  /components
    /ui                      # General buttons, cards, sheets, shimmers
    /home                    # greet strips, quick 2x2 grids, due alerts
    /appointment             # Slot selector chips, doctor profiles, token bars
    /lab                     # Test tables, visual normal indicators
    /prescription            # Dosage ticks, reminder bell keys
    /inpatient               # Vitals lists, nurse procedure lines
    /billing                 # Aggregate receipts
  /hooks                     # Zustand binders for services (useAuth, usePatient, useAppointments...)
  /store                     # Zustand storage cores (authStore, patientStore, notificationStore)
  /services                  # Axios base APIs, Spring Boot controllers mappings
  /types                     # Clinical TS typings
  /constants                 # Colors, endpoints, configuration keys
  /utils                     # Alarms schedule, masking, formatting helpers
```

---

## 💻 Local Setup & Execution

### 1. Install Dependencies
Make sure you have Node 18+ and `pnpm` installed. Run the verified commands from `/patient-app`:
```bash
cd patient-app
pnpm install
```

### 2. Configure Environment URL
Open [constants/app.config.ts](file:///Users/Admin/hospital-charlie/Charlie/patient-app/constants/app.config.ts) and customize the Spring Boot base gateway URL:
```typescript
export const APP_CONFIG = {
  apiBaseUrl: "http://<YOUR_LOCAL_IP>:8080/api/v1", // Replace with your gateway IP
  ...
}
```

### 3. Start Expo Server
```bash
pnpm start
```
*   Press **`i`** to start on the iOS Simulator.
*   Press **`a`** to start on the Android Emulator.
*   Scan the QR code with the **Expo Go** app on iOS/Android to run on a physical device.

---

## 🌐 Connecting to Spring Boot Backend

The application is fully mapped to the following microservices endpoints (routed via `gateway-service` on port `8080`):
1.  **Authentication**: Handled via `auth-service` (`/auth/login`, `/auth/verify-otp`, `/auth/refresh`)
2.  **Patients Details**: Handled via `reception-service` / `patient-service` (`/patients`)
3.  **Appointments**: Mapped to `reception-service` (`/reception/appointments`, `/reception/camps`)
4.  **Lab Results**: Routed to `lab-service` (`/lab/records`, `/lab/records/{id}/items`)
5.  **Invoices & Bills**: Routed to `reception-service` (`/reception/bills`)
6.  **Prescriptions**: Routed to `pharmacist-service` (`/pharmacy/prescriptions`)

*Note: All services feature seamless offline fallback mock systems so the app operates in high fidelity instantly for demonstration.*

---

## 📦 EAS Production Builds

To compile production-ready `.apk` / `.aab` or `.ipa` builds:

### iOS Production IPA
```bash
eas build --platform ios --profile production
```

### Android Production APK
```bash
eas build --platform android --profile production
```

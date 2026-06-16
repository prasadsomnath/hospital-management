import { AppLayout } from "@/components/layout/AppLayout";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import LoginPage from "@/pages/LoginPage";
import SuperAdminLanding from "@/pages/SuperAdminLanding";
import SuperAdminLoginPage from "@/pages/SuperAdminLoginPage";
import Accounting from "@/pages/admin/Accounting";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAuditLogs from "@/pages/admin/AuditLogs";
import Contacts from "@/pages/admin/Contacts";
import Departments from "@/pages/admin/Departments";
import AdminDoctorAnalytics from "@/pages/admin/DoctorAnalytics";
import EquipmentManagement from "@/pages/admin/Equipment";
import Inventory from "@/pages/admin/Inventory";
import ManageCamps from "@/pages/admin/ManageCamps";
import ManageDoctors from "@/pages/admin/ManageDoctors";
import ManageLabTechnicians from "@/pages/admin/ManageLabTechnicians";
import ManageNurses from "@/pages/admin/ManageNurses";
import ManagePharmacists from "@/pages/admin/ManagePharmacists";
import ManageReceptionists from "@/pages/admin/ManageReceptionists";
import Medicines from "@/pages/admin/Medicines";
import RoomsBeds from "@/pages/admin/RoomsBeds";
import AdminSettings from "@/pages/admin/Settings";
import DiagnosticsEntry from "@/pages/doctor/DiagnosticsEntry";
import DoctorAppointments from "@/pages/doctor/DoctorAppointments";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorMedicines from "@/pages/doctor/DoctorMedicines";
import MyPatients from "@/pages/doctor/MyPatients";
import NursingDashboard from "@/pages/doctor/NursingDashboard";
import Prescriptions from "@/pages/doctor/Prescriptions";
import Reports from "@/pages/doctor/Reports";
import SendRequestLab from "@/pages/doctor/SendRequestLab";
import DoctorUdrReports from "@/pages/doctor/UdrReports";
import CTScan from "@/pages/lab_technician/CTScan";
import Lab from "@/pages/lab_technician/Lab";
import LabDashboard from "@/pages/lab_technician/LabDashboard";
import OPDRxView from "@/pages/lab_technician/OPDRxView";
import OtherServices from "@/pages/lab_technician/OtherServices";
import LabTechnicianPatientsView from "@/pages/lab_technician/PatientsView";
import ServiceList from "@/pages/lab_technician/ServiceList";
import USG from "@/pages/lab_technician/USG";
import UdrReports from "@/pages/lab_technician/UdrReports";
import XRay from "@/pages/lab_technician/XRay";
import PharmacistAllMedicines from "@/pages/pharmacist/PharmacistAllMedicines";
import PharmacistBilling from "@/pages/pharmacist/PharmacistBilling";
import PharmacistDashboard from "@/pages/pharmacist/PharmacistDashboard";
import PharmacistInventory from "@/pages/pharmacist/PharmacistInventory";
import PharmacistPrescriptions from "@/pages/pharmacist/PharmacistPrescriptions";
import PharmacistStockIntelligence from "@/pages/pharmacist/PharmacistStockIntelligence";
import AppointmentView from "@/pages/receptionist/AppointmentView";
import Billing from "@/pages/receptionist/Billing";
import BirthRegister from "@/pages/receptionist/BirthRegister";
import BookAppointment from "@/pages/receptionist/BookAppointment";
import CampList from "@/pages/receptionist/CampList";
import ConsentRegister from "@/pages/receptionist/ConsentRegister";
import DeathRegister from "@/pages/receptionist/DeathRegister";
import DischargeRegister from "@/pages/receptionist/DischargeRegister";
import ReceptionistDoctors from "@/pages/receptionist/Doctors";
import EddRegister from "@/pages/receptionist/EddRegister";
import FreePatientRegister from "@/pages/receptionist/FreePatientRegister";
import InsuranceBillRegister from "@/pages/receptionist/InsuranceBillRegister";
import MlcRegister from "@/pages/receptionist/MlcRegister";
import ReceptionistNurses from "@/pages/receptionist/Nurses";
import OpdHistoryRegister from "@/pages/receptionist/OpdHistoryRegister";
import OtRegister from "@/pages/receptionist/OtRegister";
import PatientsView from "@/pages/receptionist/PatientsView";
import QueueManagement from "@/pages/receptionist/QueueManagement";
import ReceptionistDashboard from "@/pages/receptionist/ReceptionistDashboard";
import RegisterPatient from "@/pages/receptionist/RegisterPatient";
import ThreeCRegister from "@/pages/receptionist/ThreeCRegister";
import AnalyticsPage from "@/pages/superadmin/Analytics";
import AuditLogsPage from "@/pages/superadmin/AuditLogs";
import HospitalAdminsPage from "@/pages/superadmin/HospitalAdmins";
import HospitalsPage from "@/pages/superadmin/Hospitals";
import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import SystemConfigPage from "@/pages/superadmin/SystemConfig";
import UserOversightPage from "@/pages/superadmin/UserOversight";
import { useAuthStore } from "@/store/auth-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createBrowserHistory,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const superAdminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/super-admin-login",
  component: SuperAdminLoginPage,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: AppLayout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/login" });
  },
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin",
  component: AdminDashboard,
});
const adminCampsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/camps",
  component: ManageCamps,
});
const adminDoctorsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/doctors",
  component: ManageDoctors,
});
const adminReceptionistsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/receptionists",
  component: ManageReceptionists,
});
const adminPharmacistsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/pharmacists",
  component: ManagePharmacists,
});
const adminLabTechniciansRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/lab-technicians",
  component: ManageLabTechnicians,
});
const adminNursesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/nurses",
  component: ManageNurses,
});
const adminDepartmentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/departments",
  component: Departments,
});
const adminRoomsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/rooms",
  component: RoomsBeds,
});
const adminSettingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/settings",
  component: AdminSettings,
});
const adminAuditLogsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/audit-logs",
  component: AdminAuditLogs,
});
const adminInventoryRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/inventory",
  component: Inventory,
});
const adminAccountingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/accounting",
  component: Accounting,
});
const adminEquipmentRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/equipment",
  component: EquipmentManagement,
});
const adminContactsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/contacts",
  component: Contacts,
});
const adminBillingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/billing",
  component: Billing,
});
const adminDoctorAnalyticsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/doctor-analytics",
  component: AdminDoctorAnalytics,
});
const adminMedicinesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/admin/medicines",
  component: Medicines,
});

// Doctor routes
const doctorRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor",
  component: DoctorDashboard,
});
const doctorPatientsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/patients",
  component: MyPatients,
});
const doctorAppointmentsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/appointments",
  component: DoctorAppointments,
});
const doctorPrescriptionsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/prescriptions",
  component: Prescriptions,
});
const doctorReportsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/reports",
  component: Reports,
});
const doctorXrayRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/xray",
  component: () => <DiagnosticsEntry title="X-RAY" />,
});
const doctorCtScanRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/ct-scan",
  component: () => <DiagnosticsEntry title="CT SCAN" />,
});
const doctorLabRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/lab",
  component: () => <DiagnosticsEntry title="LAB" />,
});
const doctorUsgRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/usg",
  component: () => <DiagnosticsEntry title="USG" />,
});
const doctorOtherServicesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/other-services",
  component: () => <DiagnosticsEntry title="OTHER SERVICES" />,
});
const doctorNursingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/nursing",
  component: NursingDashboard,
});
const doctorMedicinesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/medicines",
  component: DoctorMedicines,
});
const doctorSendRequestLabRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/send-request-lab",
  component: SendRequestLab,
});
const doctorUdrRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/doctor/udr/$reportId",
  component: DoctorUdrReports,
});

// Receptionist routes
const receptionistRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist",
  component: ReceptionistDashboard,
});
const receptionistDoctorsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/doctors",
  component: ReceptionistDoctors,
});
const receptionistNursesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/nurses",
  component: ReceptionistNurses,
});
const receptionistRegisterRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/register",
  component: RegisterPatient,
});
const receptionistPatientsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/patients",
  component: PatientsView,
});
const receptionistBookRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/book",
  component: BookAppointment,
});
const receptionistQueueRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/queue",
  component: QueueManagement,
});
const receptionistBillingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/billing",
  component: Billing,
});
const receptionistOpdBillingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/opd-billing",
  component: Billing,
});
const receptionistCampRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/camp-list",
  component: CampList,
});
const receptionistMlcRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/mlc",
  component: MlcRegister,
});
const receptionistOtRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/ot",
  component: OtRegister,
});
const receptionistEddRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/edd",
  component: EddRegister,
});
const receptionistConsentRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/consent",
  component: ConsentRegister,
});
const receptionistDeathRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/death",
  component: DeathRegister,
});
const receptionistBirthRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/birth",
  component: BirthRegister,
});
const receptionistFreeRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/free",
  component: FreePatientRegister,
});
const receptionistDischargeRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/discharge",
  component: DischargeRegister,
});

const receptionistThreeCRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/threec",
  component: ThreeCRegister,
});
const receptionistInsuranceRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/insurance",
  component: InsuranceBillRegister,
});
const receptionistOpdHistoryRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/opd-history",
  component: OpdHistoryRegister,
});
const receptionistAppointmentViewRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/receptionist/appointment-view",
  component: AppointmentView,
});

// Pharmacist Route
const pharmacistRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/pharmacist",
  component: PharmacistDashboard,
});
const pharmacistPrescriptionsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/pharmacist/prescriptions",
  component: PharmacistPrescriptions,
});
const pharmacistBillingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/pharmacist/billing",
  component: PharmacistBilling,
});
const pharmacistInventoryRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/pharmacist/inventory",
  component: PharmacistInventory,
});
const pharmacistStockIntelligenceRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/pharmacist/stock-intelligence",
  component: PharmacistStockIntelligence,
});
const pharmacistAllMedicinesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/pharmacist/all-medicines",
  component: PharmacistAllMedicines,
});

// Lab Technician Routes
const labTechnicianRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician",
  component: LabDashboard,
});
const labTechnicianServiceListRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/service-list",
  component: ServiceList,
});
const labTechnicianPatientsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/patients",
  component: LabTechnicianPatientsView,
});
const labTechnicianXrayRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/xray",
  component: XRay,
});
const labTechnicianCtScanRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/ct-scan",
  component: CTScan,
});
const labTechnicianUsgRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/usg",
  component: USG,
});
const labTechnicianOtherServicesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/other-services",
  component: OtherServices,
});
const labTechnicianOpdRxRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/opd-rx",
  component: OPDRxView,
});
const labTechnicianLabRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/lab",
  component: Lab,
});
const labTechnicianUdrRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/udr/$reportId",
  component: UdrReports,
});
const labTechnicianBillingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/lab-technician/billing",
  component: Billing,
});

// Super Admin route
const superAdminLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "super-admin-protected",
  component: SuperAdminLayout,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/login" });
    if (user?.role !== "superAdmin") throw redirect({ to: "/login" });
  },
});

const superAdminLandingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/super-admin-portal",
  component: SuperAdminLanding,
});

const superAdminDashboardRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin",
  component: SuperAdminDashboard,
});

const superAdminHospitalsRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin/hospitals",
  component: HospitalsPage,
});

const superAdminAdminsRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin/admins",
  component: HospitalAdminsPage,
});

const superAdminAnalyticsRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin/analytics",
  component: AnalyticsPage,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || user?.role !== "superAdmin")
      throw redirect({ to: "/login" });
  },
});

const superAdminAuditLogsRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin/audit-logs",
  component: AuditLogsPage,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || user?.role !== "superAdmin")
      throw redirect({ to: "/login" });
  },
});

const superAdminUsersRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin/users",
  component: UserOversightPage,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || user?.role !== "superAdmin")
      throw redirect({ to: "/login" });
  },
});

const superAdminConfigRoute = createRoute({
  getParentRoute: () => superAdminLayout,
  path: "/super-admin/config",
  component: SystemConfigPage,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || user?.role !== "superAdmin")
      throw redirect({ to: "/login" });
  },
});

// Index route showing the landing page
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: SuperAdminLanding,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  superAdminLoginRoute,
  superAdminLandingRoute,
  superAdminLayout.addChildren([
    superAdminDashboardRoute,
    superAdminHospitalsRoute,
    superAdminAdminsRoute,
    superAdminAnalyticsRoute,
    superAdminAuditLogsRoute,
    superAdminUsersRoute,
    superAdminConfigRoute,
  ]),
  protectedLayout.addChildren([
    adminRoute,
    adminCampsRoute,
    adminDoctorsRoute,
    adminReceptionistsRoute,
    adminPharmacistsRoute,
    adminLabTechniciansRoute,
    adminNursesRoute,
    adminDepartmentsRoute,
    adminRoomsRoute,
    adminSettingsRoute,
    adminAuditLogsRoute,
    adminInventoryRoute,
    adminAccountingRoute,
    adminEquipmentRoute,
    adminContactsRoute,
    doctorRoute,
    doctorPatientsRoute,
    doctorAppointmentsRoute,
    doctorPrescriptionsRoute,
    doctorReportsRoute,
    doctorXrayRoute,
    doctorCtScanRoute,
    doctorLabRoute,
    doctorUsgRoute,
    doctorOtherServicesRoute,
    doctorNursingRoute,
    doctorMedicinesRoute,
    doctorSendRequestLabRoute,
    doctorUdrRoute,
    receptionistRoute,
    receptionistDoctorsRoute,
    receptionistNursesRoute,
    receptionistRegisterRoute,
    receptionistPatientsRoute,
    receptionistBookRoute,
    receptionistQueueRoute,
    receptionistCampRoute,
    receptionistMlcRoute,
    receptionistOtRoute,
    receptionistEddRoute,
    receptionistConsentRoute,
    receptionistDeathRoute,
    receptionistBirthRoute,
    receptionistFreeRoute,
    receptionistDischargeRoute,

    receptionistThreeCRoute,
    receptionistInsuranceRoute,
    receptionistOpdHistoryRoute,
    receptionistAppointmentViewRoute,
    receptionistBillingRoute,
    receptionistOpdBillingRoute,
    pharmacistRoute,
    pharmacistPrescriptionsRoute,
    pharmacistBillingRoute,
    pharmacistInventoryRoute,
    pharmacistStockIntelligenceRoute,
    pharmacistAllMedicinesRoute,
    labTechnicianRoute,
    labTechnicianServiceListRoute,
    labTechnicianPatientsRoute,
    labTechnicianXrayRoute,
    labTechnicianCtScanRoute,
    labTechnicianUsgRoute,
    labTechnicianOtherServicesRoute,
    labTechnicianOpdRxRoute,
    labTechnicianLabRoute,
    labTechnicianUdrRoute,
    labTechnicianBillingRoute,
    adminBillingRoute,
    adminDoctorAnalyticsRoute,
    adminMedicinesRoute,
  ]),
]);

const isElectronOrFile =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" ||
    /electron/i.test(navigator.userAgent));

const history = isElectronOrFile ? createHashHistory() : createBrowserHistory();
const router = createRouter({ routeTree, history });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  // Check if user loaded direct URL paths like `/login` or `/super-admin-login` and redirect to hash paths (only in Electron/file environment)
  if (typeof window !== "undefined" && isElectronOrFile) {
    const path = window.location.pathname;
    if (path === "/login") {
      window.location.replace("/#/login");
      return null;
    }
    if (path === "/super-admin-login") {
      window.location.replace("/#/super-admin-login");
      return null;
    }
  }

  // Apply persisted theme on mount and proactively sweep legacy/sensitive localStorage keys
  if (typeof window !== "undefined") {
    const legacyKeys = [
      "medicore-auth",
      "medcore-auth",
      "medcore-theme",
      "jwtToken",
      "auth-token",
      "entityId",
      "adminName",
      "addStaff_formData",
      "addStaff_step",
      "SELECTED_ACADEMICK_YEAR",
      "SELECTED_STAFF_TYPE",
      "libCatalogueAdvancedFilters",
      "libCatalogueDensity",
    ];
    legacyKeys.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    });

    const saved = localStorage.getItem("healthmatrix360-theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (saved === "dark" || (!saved && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

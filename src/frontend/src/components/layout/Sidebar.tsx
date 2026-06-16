import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import type { UserRole } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Baby,
  Banknote,
  BarChart3,
  BedDouble,
  BedDouble as BedIcon,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  CreditCard,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Gift,
  HeartPulse,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Lock,
  MessageSquare,
  Package,
  Pill,
  Receipt,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  Skull,
  Stethoscope,
  Syringe,
  UserCog,
  UserPlus,
  Users,
  Users2,
  Waves,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const NAV_CONFIG: Partial<
  Record<
    UserRole,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      to: string;
    }[]
  >
> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
    { label: "Camp Screenings", icon: Compass, to: "/admin/camps" },
    { label: "Departments", icon: Building2, to: "/admin/departments" },
    { label: "Doctors", icon: Stethoscope, to: "/admin/doctors" },
    {
      label: "Doctor Analytics",
      icon: BarChart3,
      to: "/admin/doctor-analytics",
    },
    { label: "Medicines", icon: Pill, to: "/admin/medicines" },
    { label: "Receptionists", icon: UserCog, to: "/admin/receptionists" },
    { label: "Lab Technicians", icon: Activity, to: "/admin/lab-technicians" },
    { label: "Pharmacists", icon: Syringe, to: "/admin/pharmacists" },
    { label: "Nurses", icon: HeartPulse, to: "/admin/nurses" },
    { label: "Rooms & Beds", icon: BedDouble, to: "/admin/rooms" },
    { label: "Inventory", icon: Package, to: "/admin/inventory" },
    { label: "Audit Logs", icon: ShieldAlert, to: "/admin/audit-logs" },
    { label: "Equipment", icon: Wrench, to: "/admin/equipment" },
    { label: "Billing Overview", icon: Receipt, to: "/admin/billing" },
    { label: "Accounting", icon: Banknote, to: "/admin/accounting" },
    { label: "Contacts", icon: Users2, to: "/admin/contacts" },
    { label: "IPD Patients", icon: ClipboardList, to: "registers-dropdown" },
    { label: "Settings", icon: Settings, to: "/admin/settings" },
  ],
  doctor: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/doctor" },
    { label: "My Patients", icon: Users, to: "/doctor/patients" },
    { label: "Appointments", icon: Calendar, to: "/doctor/appointments" },
    {
      label: "Prescriptions",
      icon: ClipboardList,
      to: "/doctor/prescriptions",
    },
    { label: "My Medicines", icon: Pill, to: "/doctor/medicines" },
    { label: "Reports", icon: FileText, to: "/doctor/reports" },
    { label: "Diagnostics", icon: Activity, to: "diagnostics-dropdown" },
    { label: "Send Request Lab", icon: Send, to: "/doctor/send-request-lab" },
    // { label: "Nursing & I/O", icon: HeartPulse, to: "/doctor/nursing" },
    { label: "OPD Register", icon: FileText, to: "/receptionist/opd-history" },
    { label: "IPD Patients", icon: ClipboardList, to: "registers-dropdown" },
  ],
  receptionist: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/receptionist" },
    { label: "Register Patient", icon: UserPlus, to: "/receptionist/register" },
    { label: "Patients View", icon: Users, to: "/receptionist/patients" },
    { label: "Book Appointment", icon: Calendar, to: "/receptionist/book" },
    {
      label: "Appointment View",
      icon: ClipboardList,
      to: "/receptionist/appointment-view",
    },
    { label: "Queue", icon: ListOrdered, to: "/receptionist/queue" },
    { label: "Camp List", icon: Users2, to: "/receptionist/camp-list" },
    { label: "Doctors", icon: Stethoscope, to: "/receptionist/doctors" },
    { label: "OPD Register", icon: FileText, to: "/receptionist/opd-history" },
    { label: "IPD Patients", icon: ClipboardList, to: "registers-dropdown" },
    { label: "OPD Billing", icon: Receipt, to: "/receptionist/opd-billing" },
    { label: "IPD Billing", icon: CreditCard, to: "/receptionist/billing" },
  ],
  pharmacist: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/pharmacist" },
    {
      label: "Prescriptions",
      icon: ClipboardList,
      to: "/pharmacist/prescriptions",
    },
    { label: "Inventory", icon: Package, to: "/pharmacist/inventory" },
    { label: "All Medicines", icon: Pill, to: "/pharmacist/all-medicines" },
    { label: "Medicine Billing", icon: Receipt, to: "/pharmacist/billing" },
    {
      label: "Stock Intelligence",
      icon: BarChart3,
      to: "/pharmacist/stock-intelligence",
    },
  ],
  lab_technician: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/lab-technician" },
    { label: "Service List", icon: Activity, to: "/lab-technician/billing" },
    { label: "Patients View", icon: Users, to: "/lab-technician/patients" },
  ],
};

interface SidebarLinkProps {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  isCollapsed: boolean;
  dataOcid?: string;
  onClick?: () => void;
  showLock?: boolean;
  rightIcon?: React.ComponentType<{ className?: string }>;
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  dataOcid,
  onClick,
  showLock,
  rightIcon: RightIcon,
}: SidebarLinkProps) {
  const content = (
    <div
      className={`flex items-center rounded-md text-sm font-medium transition-smooth ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
        } ${isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      style={{ cursor: "pointer" }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
      {!isCollapsed && showLock && (
        <Lock className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
      )}
      {!isCollapsed && RightIcon && !showLock && (
        <RightIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground/85" />
      )}
    </div>
  );

  const wrapper = to ? (
    <Link to={to} className="block no-underline" data-ocid={dataOcid} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left block"
      data-ocid={dataOcid}
    >
      {content}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{wrapper}</TooltipTrigger>
        <TooltipContent side="right" className="font-semibold">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return wrapper;
}

export interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps = {}) {
  const { user } = useAuthStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [udrExpanded, setUdrExpanded] = useState(true);
  const [registersExpanded, setRegistersExpanded] = useState(false);
  const [diagnosticsExpanded, setDiagnosticsExpanded] = useState(false);
  const currentHash =
    (routerState.location.hash || "").replace("#", "") || "dashboard";

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleUdrClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "false");
      setUdrExpanded(true);
    } else {
      setUdrExpanded(!udrExpanded);
    }
  };

  const handleRegistersClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "false");
      setRegistersExpanded(true);
    } else {
      setRegistersExpanded(!registersExpanded);
    }
  };

  const handleDiagnosticsClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "false");
      setDiagnosticsExpanded(true);
    } else {
      setDiagnosticsExpanded(!diagnosticsExpanded);
    }
  };

  useEffect(() => {
    if (
      currentPath.startsWith("/receptionist/mlc") ||
      currentPath.startsWith("/receptionist/ot") ||
      currentPath.startsWith("/receptionist/edd") ||
      currentPath.startsWith("/receptionist/consent") ||
      currentPath.startsWith("/receptionist/death") ||
      currentPath.startsWith("/receptionist/birth") ||
      currentPath.startsWith("/receptionist/free") ||
      currentPath.startsWith("/receptionist/discharge") ||
      currentPath.startsWith("/receptionist/threec") ||
      currentPath.startsWith("/receptionist/insurance")
    ) {
      setRegistersExpanded(true);
    }
  }, [currentPath]);

  useEffect(() => {
    if (
      currentPath.startsWith("/doctor/xray") ||
      currentPath.startsWith("/doctor/ct-scan") ||
      currentPath.startsWith("/doctor/usg") ||
      currentPath.startsWith("/doctor/lab")
    ) {
      setDiagnosticsExpanded(true);
    }
  }, [currentPath]);

  useEffect(() => {
    if (
      currentHash.startsWith("udr-") ||
      currentPath.startsWith("/lab-technician/udr")
    ) {
      setUdrExpanded(true);
    }
  }, [currentHash, currentPath]);

  const [hospitalName, setHospitalName] = useState("St. Mary's General");
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);

  // Sync custom hospital brand variables
  useEffect(() => {
    const loadBranding = async () => {
      if (!user?.hospitalCode) return;
      const saved = localStorage.getItem(
        `hospital-settings-${user.hospitalCode}`,
      );
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) {
            setHospitalName(parsed.name);
          }
          if (parsed.logoUri) {
            setHospitalLogo(parsed.logoUri);
          } else {
            setHospitalLogo(null);
          }
        } catch (e) {
          console.error("Failed to parse branding settings", e);
        }
      } else {
        try {
          const res = await apiFetch<any>(
            `/super-admin/hospitals/code/${user.hospitalCode}`,
          );
          if (res && res.hospitalName) {
            setHospitalName(res.hospitalName);
            localStorage.setItem(
              `hospital-settings-${user.hospitalCode}`,
              JSON.stringify({
                name: res.hospitalName,
                address: res.address || "",
                phone: res.phone || "",
                email: res.email || "",
                logoUri: null,
              }),
            );
          } else {
            setHospitalName("St. Mary's General");
            setHospitalLogo(null);
          }
        } catch (e) {
          console.error("Failed to fetch branding from backend", e);
          setHospitalName("St. Mary's General");
          setHospitalLogo(null);
        }
      }
    };

    loadBranding();
    window.addEventListener("hospital-settings-updated", loadBranding);
    return () => {
      window.removeEventListener("hospital-settings-updated", loadBranding);
    };
  }, [user?.hospitalCode]);

  if (!user) return null;

  let navItems = NAV_CONFIG[user.role] ?? [];

  if (user.hospitalFeatures) {
    const { pharmacy, laboratory, billing } = user.hospitalFeatures;
    const inventory = user.hospitalFeatures.inventory !== false;
    navItems = navItems.filter((item) => {
      if (!pharmacy) {
        if (item.to === "/admin/pharmacists") {
          return false;
        }
      }
      if (!inventory) {
        if (
          item.to === "/admin/inventory" ||
          item.to === "/pharmacist/inventory"
        ) {
          return false;
        }
      }
      if (!laboratory) {
        if (item.to === "/admin/lab-technicians") {
          return false;
        }
      }
      if (!billing) {
        if (
          item.to === "/admin/billing" ||
          item.to === "/admin/accounting" ||
          item.to === "/receptionist/billing" ||
          item.to === "/receptionist/opd-billing" ||
          item.to === "/pharmacist/billing"
        ) {
          return false;
        }
      }
      return true;
    });
  }

  const renderSidebarContent = (collapsed: boolean, isMobile: boolean) => {
    return (
      <>
        {/* Logo & Toggle */}
        <div
          className={`flex ${
            collapsed
              ? "flex-col gap-2 items-center px-2 py-4"
              : "items-center justify-between pl-4 pr-3 py-5"
          } border-b border-sidebar-border transition-all duration-300`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-2 flex-1 min-w-0"
            }`}
          >
            {hospitalLogo ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-background border border-sidebar-border/30 flex-shrink-0">
                <img
                  src={hospitalLogo}
                  alt="Hospital Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1 ml-0.5">
                <p className="text-sm font-semibold text-sidebar-foreground font-display leading-none truncate">
                  {hospitalName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                  HealthMatrix360 Workspace
                </p>
              </div>
            )}
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen?.(false)}
              className="text-muted-foreground hover:text-sidebar-foreground transition-smooth flex-shrink-0 p-1 lg:hidden"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapse}
              className="text-muted-foreground hover:text-sidebar-foreground transition-smooth flex-shrink-0 p-1"
              title={collapsed ? "Expand Sidebar" : "Compress Sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Role label */}
        {!collapsed && (
          <div className="px-5 pt-5 pb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>
        )}

        {/* Nav items */}
        <nav
          className={`flex-1 ${
            collapsed ? "px-2 pt-4" : "px-3"
          } space-y-0.5 overflow-y-auto overflow-x-hidden transition-all duration-300`}
        >
          {user.role === "lab_technician" ? (
            <>
              {/* 1. Dashboard */}
              <SidebarLink
                to="/lab-technician"
                label="Dashboard"
                icon={LayoutDashboard}
                isActive={currentPath === "/lab-technician"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                dataOcid="sidebar.dashboard.link"
              />

              {/* 2. Service List */}
              <SidebarLink
                to="/lab-technician/service-list"
                label="Service List"
                icon={Activity}
                isActive={currentPath === "/lab-technician/service-list"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                dataOcid="sidebar.service_list.link"
              />

              {/* Patients View */}
              <SidebarLink
                to="/lab-technician/patients"
                label="Patients View"
                icon={Users}
                isActive={currentPath === "/lab-technician/patients"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                dataOcid="sidebar.patients_view.link"
              />

              {/* 3. X-Ray */}
              <SidebarLink
                to="/lab-technician/xray"
                label="X-Ray"
                icon={FileImage}
                isActive={currentPath === "/lab-technician/xray"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                showLock={user.isDemo}
                dataOcid="sidebar.x_ray.link"
              />

              {/* 4. CT Scan */}
              <SidebarLink
                to="/lab-technician/ct-scan"
                label="CT Scan"
                icon={Layers}
                isActive={currentPath === "/lab-technician/ct-scan"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                showLock={user.isDemo}
                dataOcid="sidebar.ct_scan.link"
              />

              {/* 5. USG */}
              <SidebarLink
                to="/lab-technician/usg"
                label="USG"
                icon={Waves}
                isActive={currentPath === "/lab-technician/usg"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                showLock={user.isDemo}
                dataOcid="sidebar.usg.link"
              />

              {/* 6. User Defined Reports */}
              <div>
                <SidebarLink
                  label="User Def. Reports"
                  icon={FileSpreadsheet}
                  isCollapsed={collapsed}
                  showLock={user.isDemo}
                  onClick={handleUdrClick}
                  rightIcon={udrExpanded ? ChevronDown : ChevronRight}
                />

                {!collapsed && udrExpanded && (
                  <div className="pl-6 pr-1 py-1 space-y-1 border-l border-primary/20 ml-5 mt-1">
                    {[
                      { id: "udr-daycare", label: "6.1 Day Care" },
                      { id: "udr-echo", label: "6.2 Echo" },
                      { id: "udr-mri", label: "6.3 MRI" },
                      { id: "udr-ot", label: "6.4 OT" },
                      { id: "udr-physio", label: "6.5 Physiotherapy" },
                    ].map((sub) => {
                      const subPath = `/lab-technician/udr/${sub.id.replace(
                        "udr-",
                        "",
                      )}`;
                      const isSubActive = currentPath === subPath;
                      return (
                        <Link
                          key={sub.id}
                          to={subPath}
                          onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-smooth block ${
                            isSubActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 7. Other Services */}
              <SidebarLink
                to="/lab-technician/other-services"
                label="Other Services"
                icon={HeartPulse}
                isActive={currentPath === "/lab-technician/other-services"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                showLock={user.isDemo}
                dataOcid="sidebar.other_services.link"
              />

              {/* 8. OPD Rx View */}
              <SidebarLink
                to="/lab-technician/opd-rx"
                label="OPD Rx View"
                icon={FileText}
                isActive={currentPath === "/lab-technician/opd-rx"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                showLock={user.isDemo}
                dataOcid="sidebar.opd_rx_view.link"
              />

              {/* 9. Lab */}
              <SidebarLink
                to="/lab-technician/lab"
                label="Lab"
                icon={Syringe}
                isActive={currentPath === "/lab-technician/lab"}
                isCollapsed={collapsed}
                onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                showLock={user.isDemo}
                dataOcid="sidebar.lab.link"
              />
            </>
          ) : (
            navItems.map((item, idx) => {
              if (item.to === "diagnostics-dropdown") {
                const DIAGNOSTICS = [
                  {
                    label: "X-Ray",
                    icon: FileImage,
                    to: "/doctor/xray",
                  },
                  {
                    label: "CT Scan",
                    icon: Layers,
                    to: "/doctor/ct-scan",
                  },
                  {
                    label: "USG",
                    icon: Waves,
                    to: "/doctor/usg",
                  },
                  {
                    label: "Lab",
                    icon: Syringe,
                    to: "/doctor/lab",
                  },
                  {
                    label: "MRI",
                    icon: Layers,
                    to: "/doctor/udr/mri",
                  },
                  {
                    label: "Echo",
                    icon: Activity,
                    to: "/doctor/udr/echo",
                  },
                  {
                    label: "OT",
                    icon: Activity,
                    to: "/doctor/udr/ot",
                  },
                  {
                    label: "Physiotherapy",
                    icon: HeartPulse,
                    to: "/doctor/udr/physio",
                  },
                  {
                    label: "Day Care",
                    icon: Clock,
                    to: "/doctor/udr/daycare",
                  },
                  {
                    label: "Other Diagnostics",
                    icon: Compass,
                    to: "/doctor/other-services",
                  },
                ];

                return (
                  <div key="diagnostics-dropdown-container">
                    <SidebarLink
                      label={item.label}
                      icon={item.icon}
                      isCollapsed={collapsed}
                      onClick={handleDiagnosticsClick}
                      rightIcon={
                        diagnosticsExpanded ? ChevronDown : ChevronRight
                      }
                    />

                    {!collapsed && diagnosticsExpanded && (
                      <div className="pl-6 pr-1 py-1 space-y-1 border-l border-primary/20 ml-5 mt-1">
                        {DIAGNOSTICS.map((diag) => {
                          const isDiagActive = currentPath === diag.to;
                          return (
                            <Link
                              key={diag.to}
                              to={diag.to}
                              onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${
                                isDiagActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }`}
                            >
                              <diag.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{diag.label}</span>
                              {user.isDemo && (
                                <Lock className="w-3 h-3 text-muted-foreground/60 ml-auto flex-shrink-0" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (item.to === "registers-dropdown") {
                const REGISTERS = [
                  {
                    label: "MLC Patients",
                    icon: ShieldAlert,
                    to: "/receptionist/mlc",
                  },
                  {
                    label: "OT Patients",
                    icon: Activity,
                    to: "/receptionist/ot",
                  },
                  {
                    label: "Maternity Patients",
                    icon: Baby,
                    to: "/receptionist/edd",
                  },
                  {
                    label: "Consent Patients",
                    icon: FileCheck,
                    to: "/receptionist/consent",
                  },
                  {
                    label: "Death Patients",
                    icon: Skull,
                    to: "/receptionist/death",
                  },
                  {
                    label: "Birth Patients",
                    icon: Baby,
                    to: "/receptionist/birth",
                  },
                  {
                    label: "Free Patients",
                    icon: Gift,
                    to: "/receptionist/free",
                  },
                  {
                    label: "Discharge Patients",
                    icon: ClipboardList,
                    to: "/receptionist/discharge",
                  },
                  {
                    label: "3C Patients",
                    icon: HeartPulse,
                    to: "/receptionist/threec",
                  },
                  {
                    label: "Insurance Bill Patients",
                    icon: Shield,
                    to: "/receptionist/insurance",
                  },
                ];

                return (
                  <div key="registers-dropdown-container">
                    <SidebarLink
                      label={item.label}
                      icon={ClipboardList}
                      isCollapsed={collapsed}
                      onClick={handleRegistersClick}
                      rightIcon={registersExpanded ? ChevronDown : ChevronRight}
                    />

                    {!collapsed && registersExpanded && (
                      <div className="pl-6 pr-1 py-1 space-y-1 border-l border-primary/20 ml-5 mt-1">
                        {REGISTERS.map((reg) => {
                          const isRegActive = currentPath === reg.to;
                          return (
                            <Link
                              key={reg.to}
                              to={reg.to}
                              onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${
                                isRegActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }`}
                            >
                              <reg.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{reg.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isDashboard = [
                "/admin",
                "/doctor",
                "/receptionist",
                "/pharmacist",
                "/lab-technician",
              ].includes(item.to);
              const isActive = isDashboard
                ? currentPath === item.to
                : currentPath === item.to ||
                  currentPath.startsWith(`${item.to}/`);
              return (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                  isCollapsed={collapsed}
                  onClick={isMobile ? () => setMobileOpen?.(false) : undefined}
                  showLock={user.isDemo && idx >= 2}
                  dataOcid={`sidebar.${item.label
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "_")}.link`}
                />
              );
            })
          )}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              HealthMatrix360 Pro v1.1
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <aside
        data-ocid="sidebar"
        className={`${isCollapsed ? "w-16" : "w-60"} hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-all duration-300 relative`}
      >
        {renderSidebarContent(isCollapsed, false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen?.(false)}
      />

      {/* Mobile Drawer Content */}
      <aside
        data-ocid="sidebar-mobile"
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col lg:hidden transition-transform duration-300 transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(false, true)}
      </aside>
    </TooltipProvider>
  );
}

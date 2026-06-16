import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { apiFetch } from "@/lib/api";
import { getThemeStyles } from "@/lib/themes";
import { useAuthStore } from "@/store/auth-store";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Lock, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const getDashboardUrl = (role?: string) => {
  if (role === "superAdmin") return "/super-admin";
  if (role === "lab_technician") return "/lab-technician";
  if (role === "doctor") return "/doctor";
  if (role === "pharmacist") return "/pharmacist";
  if (role === "receptionist") return "/receptionist";
  if (role === "admin") return "/admin";
  return "/login";
};

const isRegisterPath = (path: string): boolean => {
  const p = path.toLowerCase();
  return (
    p.startsWith("/receptionist/mlc") ||
    p.startsWith("/receptionist/ot") ||
    p.startsWith("/receptionist/edd") ||
    p.startsWith("/receptionist/consent") ||
    p.startsWith("/receptionist/death") ||
    p.startsWith("/receptionist/birth") ||
    p.startsWith("/receptionist/free") ||
    p.startsWith("/receptionist/discharge") ||
    p.startsWith("/receptionist/threec") ||
    p.startsWith("/receptionist/insurance") ||
    p.startsWith("/receptionist/opd-history")
  );
};

export function AppLayout() {
  const { isAuthenticated, user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme } = useTheme();

  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [demoReqSuccess, setDemoReqSuccess] = useState(false);
  const [themeStyles, setThemeStyles] = useState<React.CSSProperties>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setDemoReqSuccess(false);
    setMobileSidebarOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!user?.hospitalCode) return;
    const applyTheme = () => {
      const savedData = localStorage.getItem(
        `hospital-settings-${user.hospitalCode}`,
      );
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          let selectedTheme = parsed.generalTheme || "default";

          if (user.role === "doctor" && parsed.doctorTheme) {
            selectedTheme = parsed.doctorTheme;
          } else if (user.role === "receptionist" && parsed.receptionistTheme) {
            selectedTheme = parsed.receptionistTheme;
          }

          const styles = getThemeStyles(selectedTheme, theme === "dark");
          setThemeStyles(styles as React.CSSProperties);
        } catch (e) {
          console.error("Failed to parse theme settings", e);
        }
      } else {
        setThemeStyles({});
      }
    };

    applyTheme();
    window.addEventListener("hospital-settings-updated", applyTheme);
    return () => {
      window.removeEventListener("hospital-settings-updated", applyTheme);
    };
  }, [user?.hospitalCode, user?.role, theme]);

  useEffect(() => {
    const fetchFeatures = async () => {
      if (!isAuthenticated || !user || user.role === "superAdmin") {
        setFeaturesLoaded(true);
        return;
      }

      if (user.hospitalFeatures) {
        setFeaturesLoaded(true);
        return;
      }

      if (
        user.isDemo ||
        user.email?.includes("skyllx.com") ||
        (typeof window !== "undefined" &&
          localStorage.getItem("auth-token") === "dev-mock-token")
      ) {
        updateUser({
          hospitalFeatures: {
            pharmacy: true,
            laboratory: true,
            billing: true,
            patientPortal: true,
            inventory: true,
          },
        });
        setFeaturesLoaded(true);
        return;
      }

      try {
        const res = await apiFetch<any>(
          `/super-admin/hospitals/code/${user.hospitalCode}`,
        );
        if (res) {
          updateUser({
            hospitalFeatures: {
              pharmacy: res.pharmacy !== false,
              laboratory: res.laboratory !== false,
              billing: res.billing !== false,
              patientPortal: res.patientPortal !== false,
              inventory: res.inventory !== false,
            },
          });
        }
      } catch (err) {
        console.error("Failed to load hospital features:", err);
      } finally {
        setFeaturesLoaded(true);
      }
    };

    fetchFeatures();
  }, [isAuthenticated, user?.hospitalCode]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (user?.role && featuresLoaded) {
      let allowed = true;
      if (currentPath.startsWith("/doctor") && user.role !== "doctor")
        allowed = false;
      else if (
        currentPath.startsWith("/pharmacist") &&
        user.role !== "pharmacist"
      )
        allowed = false;
      else if (
        currentPath.startsWith("/receptionist") &&
        user.role !== "receptionist" &&
        !(
          isRegisterPath(currentPath) &&
          (user.role === "doctor" || user.role === "admin")
        )
      )
        allowed = false;
      else if (currentPath.startsWith("/admin") && user.role !== "admin")
        allowed = false;
      else if (
        currentPath.startsWith("/lab-technician") &&
        user.role !== "lab_technician"
      )
        allowed = false;
      else if (
        currentPath.startsWith("/super-admin") &&
        user.role !== "superAdmin"
      )
        allowed = false;

      // Module-specific checks
      if (user.hospitalFeatures) {
        const { pharmacy, laboratory, billing } = user.hospitalFeatures;
        const inventory = user.hospitalFeatures.inventory !== false;
        if (user.role === "pharmacist" && !pharmacy) allowed = false;
        if (user.role === "lab_technician" && !laboratory) allowed = false;

        if (
          currentPath.startsWith("/pharmacist") &&
          currentPath !== "/pharmacist/inventory" &&
          !pharmacy
        )
          allowed = false;
        if (currentPath === "/pharmacist/inventory" && !inventory)
          allowed = false;
        if (currentPath.startsWith("/lab-technician") && !laboratory)
          allowed = false;
        if (currentPath === "/admin/inventory" && !inventory) {
          allowed = false;
        }
        if (currentPath === "/admin/pharmacists" && !pharmacy) {
          allowed = false;
        }
        if (currentPath === "/admin/lab-technicians" && !laboratory) {
          allowed = false;
        }
        if (
          (currentPath === "/receptionist/billing" ||
            currentPath === "/admin/billing" ||
            currentPath === "/admin/accounting") &&
          !billing
        ) {
          allowed = false;
        }
      }

      if (!allowed) {
        navigate({ to: getDashboardUrl(user.role) });
      }
    }
  }, [isAuthenticated, user?.role, featuresLoaded, currentPath, navigate]);

  if (!isAuthenticated) return null;

  if (!featuresLoaded && user?.role !== "superAdmin") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 animate-pulse font-medium">
          Loading Institution Environment…
        </p>
      </div>
    );
  }

  // Enforce deactivation block page
  let isModuleDisabled = false;
  let serviceName = "";

  if (user?.hospitalFeatures) {
    const { pharmacy, laboratory, billing } = user.hospitalFeatures;
    const inventory = user.hospitalFeatures.inventory !== false;

    if (user.role === "pharmacist" && !pharmacy) {
      isModuleDisabled = true;
      serviceName = "Pharmacy Module";
    } else if (user.role === "lab_technician" && !laboratory) {
      isModuleDisabled = true;
      serviceName = "Laboratory Module";
    }

    if (
      currentPath.startsWith("/pharmacist") &&
      currentPath !== "/pharmacist/inventory" &&
      !pharmacy
    ) {
      isModuleDisabled = true;
      serviceName = "Pharmacy Module";
    } else if (currentPath === "/pharmacist/inventory" && !inventory) {
      isModuleDisabled = true;
      serviceName = "Inventory Module";
    } else if (currentPath.startsWith("/lab-technician") && !laboratory) {
      isModuleDisabled = true;
      serviceName = "Laboratory Module";
    }
  }

  if (
    isModuleDisabled &&
    (user?.role === "pharmacist" || user?.role === "lab_technician")
  ) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 font-sans p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px]" />

        <div className="glass-card relative overflow-hidden p-8 lg:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-3xl max-w-md w-full text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-destructive animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
              Service Deactivated
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
              The <span className="text-primary font-bold">{serviceName}</span>{" "}
              has been deactivated for your institution by the platform
              administration. Please contact your administrator.
            </p>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render check to prevent flickering layout during redirect
  let isAllowedPath = true;
  if (user?.role) {
    if (currentPath.startsWith("/doctor") && user.role !== "doctor")
      isAllowedPath = false;
    else if (
      currentPath.startsWith("/pharmacist") &&
      user.role !== "pharmacist"
    )
      isAllowedPath = false;
    else if (
      currentPath.startsWith("/receptionist") &&
      user.role !== "receptionist" &&
      !(
        isRegisterPath(currentPath) &&
        (user.role === "doctor" || user.role === "admin")
      )
    )
      isAllowedPath = false;
    else if (currentPath.startsWith("/admin") && user.role !== "admin")
      isAllowedPath = false;
    else if (
      currentPath.startsWith("/lab-technician") &&
      user.role !== "lab_technician"
    )
      isAllowedPath = false;
    else if (
      currentPath.startsWith("/super-admin") &&
      user.role !== "superAdmin"
    )
      isAllowedPath = false;

    // Feature checks
    if (user.hospitalFeatures) {
      const { pharmacy, laboratory, billing } = user.hospitalFeatures;
      const inventory = user.hospitalFeatures.inventory !== false;
      if (user.role === "pharmacist" && !pharmacy) isAllowedPath = false;
      if (user.role === "lab_technician" && !laboratory) isAllowedPath = false;

      if (
        currentPath.startsWith("/pharmacist") &&
        currentPath !== "/pharmacist/inventory" &&
        !pharmacy
      )
        isAllowedPath = false;
      if (currentPath === "/pharmacist/inventory" && !inventory)
        isAllowedPath = false;
      if (currentPath.startsWith("/lab-technician") && !laboratory)
        isAllowedPath = false;
      if (currentPath === "/admin/inventory" && !inventory) {
        isAllowedPath = false;
      }
      if (currentPath === "/admin/pharmacists" && !pharmacy) {
        isAllowedPath = false;
      }
      if (currentPath === "/admin/lab-technicians" && !laboratory) {
        isAllowedPath = false;
      }
      if (
        (currentPath === "/receptionist/billing" ||
          currentPath === "/admin/billing" ||
          currentPath === "/admin/accounting") &&
        !billing
      ) {
        isAllowedPath = false;
      }
    }
  }
  if (!isAllowedPath) return null;

  const isDemoLocked =
    user?.isDemo && !isDemoAllowedPath(user.role, currentPath);

  return (
    <div
      className="flex h-screen bg-background overflow-hidden"
      style={themeStyles}
    >
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {isDemoLocked ? (
            <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans relative overflow-hidden">
              {/* Pulsing blurred decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[80px] pointer-events-none animate-pulse" />

              <div className="glass-card relative overflow-hidden p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-3xl max-w-xl w-full text-center">
                {/* Glossy top border light */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {!demoReqSuccess ? (
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-inner">
                      <Lock className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest mb-3">
                        Premium HMS Feature
                      </span>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                        {getFeatureName(currentPath)}
                      </h2>
                      <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-md mx-auto">
                        This live corporate module is locked in our Interactive
                        Trial. Upgrade your organization's license to activate
                        full institutional access.
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-left space-y-3 max-w-md mx-auto">
                      {[
                        {
                          title: "Department Syncing",
                          desc: "Automated billing and telemetry dispatching.",
                        },
                        {
                          title: "HIPAA Certified Encryption",
                          desc: "Military-grade data protection & audits.",
                        },
                        {
                          title: "Real-time Telemetry Analytics",
                          desc: "Live monitoring of clinical benchmarks.",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-0.5 flex-shrink-0 text-emerald-400 font-bold text-[10px]">
                            ✓
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDemoReqSuccess(true);
                          const lead = localStorage.getItem(
                            "demo-lead-reference",
                          );
                          console.log(
                            "Interactive Trial Request submitted by:",
                            lead ? JSON.parse(lead) : "Anonymous Demo",
                          );
                        }}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                      >
                        Request Corporate Access
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ to: getDashboardUrl(user?.role) })
                        }
                        className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center transition-all active:scale-[0.98]"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-black">
                        ✓
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        Request Submitted!
                      </h2>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                        Your interest in{" "}
                        <span className="text-emerald-400 font-bold">
                          {getFeatureName(currentPath)}
                        </span>{" "}
                        has been securely logged under your reference details.
                        Our Enterprise Success manager will call you shortly.
                      </p>
                    </div>

                    <div className="pt-4 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ to: getDashboardUrl(user?.role) })
                        }
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

// Demo Route Guard helpers
const isDemoAllowedPath = (role: string, path: string): boolean => {
  const p = path.toLowerCase();

  if (role === "admin") {
    return (
      p === "/admin" ||
      p === "/admin/" ||
      p.startsWith("/admin/camps") ||
      p.startsWith("/admin/medicines") ||
      p.startsWith("/admin/nurses") ||
      isRegisterPath(path)
    );
  }
  if (role === "doctor") {
    return (
      p === "/doctor" ||
      p === "/doctor/" ||
      p.startsWith("/doctor/medicines") ||
      isRegisterPath(path)
    );
  }
  if (role === "receptionist") {
    return (
      p === "/receptionist" ||
      p === "/receptionist/" ||
      p.startsWith("/receptionist/doctors") ||
      p.startsWith("/receptionist/register") ||
      p.startsWith("/receptionist/patients") ||
      p.startsWith("/receptionist/mlc") ||
      p.startsWith("/receptionist/ot") ||
      p.startsWith("/receptionist/edd") ||
      p.startsWith("/receptionist/consent") ||
      p.startsWith("/receptionist/death") ||
      p.startsWith("/receptionist/birth") ||
      p.startsWith("/receptionist/free") ||
      p.startsWith("/receptionist/discharge") ||
      p.startsWith("/receptionist/threec") ||
      p.startsWith("/receptionist/insurance") ||
      p.startsWith("/receptionist/opd-history")
    );
  }
  if (role === "pharmacist") {
    return (
      p === "/pharmacist" ||
      p === "/pharmacist/" ||
      p.startsWith("/pharmacist/prescriptions")
    );
  }
  if (role === "lab_technician") {
    return (
      p === "/lab-technician" ||
      p === "/lab-technician/" ||
      p.startsWith("/lab-technician/service-list") ||
      p.startsWith("/lab-technician/billing") ||
      p.startsWith("/lab-technician/patients")
    );
  }

  return true;
};

const getFeatureName = (path: string): string => {
  const p = path.toLowerCase();
  if (p.includes("/departments")) return "Departments Management";
  if (p.includes("/doctors")) return "Doctors Control Hub";
  if (p.includes("/receptionists")) return "Staff Oversight";
  if (p.includes("/lab-technicians")) return "Lab Technicians Directory";
  if (p.includes("/pharmacists")) return "Pharmacists Registry";
  if (p.includes("/nurses")) return "Nurse Register";
  if (p.includes("/rooms")) return "Ward & Room Allocator";
  if (p.includes("/inventory")) return "Clinical Inventory & Supply Chain";
  if (p.includes("/audit-logs")) return "Security Audit Logs & Compliance";
  if (p.includes("/equipment")) return "Biomedical Equipment Control";
  if (p.includes("/accounting")) return "Institutional Accounting & Ledger";
  if (p.includes("/contacts")) return "Referral Directory";

  if (p.includes("/doctor/patients")) return "Patient Clinical History";
  if (p.includes("/doctor/appointments"))
    return "Appointment Calendar Scheduler";
  if (p.includes("/doctor/prescriptions"))
    return "Electronic Prescription Authoring (eRx)";
  if (p.includes("/doctor/reports")) return "Laboratory & Diagnostic Reports";
  if (
    p.includes("/doctor/xray") ||
    p.includes("/doctor/ct-scan") ||
    p.includes("/doctor/lab") ||
    p.includes("/doctor/usg")
  )
    return "Advanced Diagnostic Center";
  if (p.includes("/doctor/nursing")) return "Nursing Flowsheets & Ward I/O";

  if (p.includes("/receptionist/book")) return "Appointment Slot Scheduler";
  if (p.includes("/receptionist/queue")) return "Live OPD Queue Management";
  if (p.includes("/receptionist/camp-list")) return "Screening Camp Manager";
  if (p.includes("/receptionist/patients")) return "Patient Registry Directory";
  if (p.includes("/receptionist/mlc"))
    return "MLC (Medico-Legal Case) Register";
  if (p.includes("/receptionist/opd-history")) return "OPD History Register";

  if (p.includes("/pharmacist/billing"))
    return "OPD Prescription Billing Console";
  if (p.includes("/pharmacist/stock-intelligence"))
    return "AI Stock Intelligence & Expiry Analytics";

  if (p.includes("/lab-technician/patients"))
    return "Patient Registry Directory";
  if (p.includes("/lab-technician/xray"))
    return "Digital Radiography (X-Ray) Imaging";
  if (p.includes("/lab-technician/ct-scan"))
    return "Computed Tomography (CT Scan) Imaging";
  if (p.includes("/lab-technician/usg")) return "Ultrasonography (USG) Imaging";
  if (p.includes("/lab-technician/udr"))
    return "Custom User-Defined Reports Engine";
  if (p.includes("/lab-technician/other-services"))
    return "Specialist Services Registry";
  if (p.includes("/lab-technician/opd-rx"))
    return "OPD Clinical Prescription Telemetry";
  if (p.includes("/lab-technician/lab"))
    return "Syringe Diagnostics and Pathology Lab";

  return "Premium HMS Module";
};

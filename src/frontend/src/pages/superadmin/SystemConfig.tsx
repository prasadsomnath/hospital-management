import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import {
  Building2,
  CheckCircle2,
  Globe,
  Settings,
  Shield,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HospitalModules {
  id: string;
  name: string;
  pharmacy: boolean;
  laboratory: boolean;
  billing: boolean;
  patientPortal: boolean;
  inventory: boolean;
}

type ModuleKey = keyof Omit<HospitalModules, "id" | "name">;

const MODULE_LABELS: { key: ModuleKey; label: string }[] = [
  { key: "pharmacy", label: "Pharmacy" },
  { key: "laboratory", label: "Laboratory" },
  { key: "billing", label: "Billing" },
  { key: "patientPortal", label: "Patient Portal" },
  { key: "inventory", label: "Inventory" },
];

export default function SystemConfig() {
  const [hospitals, setHospitals] = useState<HospitalModules[]>([]);
  const [systemName, setSystemName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [configRes, hospitalsRes] = await Promise.all([
        apiFetch<any>("/super-admin/config"),
        apiFetch<any>("/super-admin/hospitals"),
      ]);

      if (configRes) {
        setSystemName(configRes.systemName || "HealthMatrix360");
        setSupportEmail(
          configRes.supportEmail || "support@healthmatrix360.com",
        );
        setMaintenanceMode(!!configRes.maintenanceMode);
        setSystemTheme(configRes.theme === "dark" ? "dark" : "light");
      }

      const list = hospitalsRes.content || [];
      const mapped = list.map(
        (h: any): HospitalModules => ({
          id: h.id.toString(),
          name: h.hospitalName,
          pharmacy: h.pharmacy !== false,
          laboratory: h.laboratory !== false,
          billing: h.billing !== false,
          patientPortal: h.patientPortal !== false,
          inventory: h.inventory !== false,
        }),
      );
      setHospitals(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load platform configurations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleModule = (hospitalId: string, module: ModuleKey) => {
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === hospitalId ? { ...h, [module]: !h[module] } : h,
      ),
    );
  };

  const handleSaveRow = async (hospital: HospitalModules) => {
    try {
      await apiFetch(`/super-admin/hospitals/${hospital.id}/features`, {
        method: "PATCH",
        body: JSON.stringify({
          pharmacy: hospital.pharmacy,
          laboratory: hospital.laboratory,
          billing: hospital.billing,
          patientPortal: hospital.patientPortal,
          inventory: hospital.inventory,
        }),
      });
      toast.success(`Configuration saved for ${hospital.name}`, {
        description: "Module flags have been updated successfully.",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message || `Failed to save configuration for ${hospital.name}`,
      );
    }
  };

  const handleSaveGlobal = async () => {
    try {
      await apiFetch("/super-admin/config", {
        method: "POST",
        body: JSON.stringify({
          systemName,
          supportEmail,
          maintenanceMode,
          theme: systemTheme,
        }),
      });

      // Synchronize frontend layout theme class in real-time
      const root = document.documentElement;
      if (systemTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("healthmatrix360-theme", systemTheme);

      toast.success("Global settings saved", {
        description: `System configuration updated.${maintenanceMode ? " Maintenance mode is ON." : ""}`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save global settings");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold text-foreground font-display">
              System Configuration
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage global settings and per-hospital feature flags
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400"
        >
          <Shield className="w-3.5 h-3.5 mr-1.5" />
          Developer Only
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading configurations…
          </p>
        </div>
      ) : (
        <>
          {/* Global Settings */}
          <Card
            data-ocid="super-admin.config.global_card"
            className="border-border"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Global Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="systemName"
                    className="text-sm font-medium text-foreground"
                  >
                    System Name
                  </Label>
                  <Input
                    id="systemName"
                    data-ocid="super-admin.config.system_name_input"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="supportEmail"
                    className="text-sm font-medium text-foreground"
                  >
                    Support Email
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    data-ocid="super-admin.config.support_email_input"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="systemTheme"
                    className="text-sm font-medium text-foreground"
                  >
                    System Theme
                  </Label>
                  <select
                    id="systemTheme"
                    data-ocid="super-admin.config.system_theme_select"
                    value={systemTheme}
                    onChange={(e) =>
                      setSystemTheme(e.target.value as "light" | "dark")
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  >
                    <option value="light" className="bg-slate-900 text-white">
                      Light Theme
                    </option>
                    <option value="dark" className="bg-slate-900 text-white">
                      Dark Theme
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-accent" />
                    Maintenance Mode
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, all hospital dashboards will show a
                    maintenance notice to staff
                  </p>
                </div>
                <Switch
                  data-ocid="super-admin.config.maintenance_toggle"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                  aria-label="Toggle maintenance mode"
                />
              </div>

              {maintenanceMode && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  Maintenance mode is active. Hospital staff will see a
                  maintenance notice.
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  data-ocid="super-admin.config.save_global_button"
                  onClick={handleSaveGlobal}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Save Global Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags per Hospital */}
          <Card
            data-ocid="super-admin.config.feature_flags_card"
            className="border-border"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Hospital Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {hospitals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hospitals registered yet</p>
                  <p className="text-sm mt-1">
                    Hospitals added by the platform will appear here to manage
                    features.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Hospital
                        </th>
                        {MODULE_LABELS.map((m) => (
                          <th
                            key={m.key}
                            className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                          >
                            {m.label}
                          </th>
                        ))}
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hospitals.map((h, i) => (
                        <tr
                          key={h.id}
                          data-ocid={`super-admin.config.hospital.item.${i + 1}`}
                          className="hover:bg-muted/30 transition-smooth"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium text-foreground whitespace-nowrap">
                                {h.name}
                              </span>
                            </div>
                          </td>
                          {MODULE_LABELS.map((m) => (
                            <td key={m.key} className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  data-ocid={`super-admin.config.${h.id}.${m.key}.toggle`}
                                  checked={h[m.key]}
                                  onCheckedChange={() =>
                                    toggleModule(h.id, m.key)
                                  }
                                  aria-label={`Toggle ${m.label} for ${h.name}`}
                                />
                              </div>
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              data-ocid={`super-admin.config.save.${i + 1}.button`}
                              onClick={() => handleSaveRow(h)}
                              className="text-xs"
                            >
                              Save
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "@/components/ui/time-input";
import { apiFetch } from "@/lib/api";
const MOCK_HOSPITALS: any[] = [];
import { PRESET_THEMES } from "@/lib/themes";
import { useAuthStore } from "@/store/auth-store";
import {
  Bell,
  Building2,
  CheckCircle,
  Clock,
  Hash,
  ImageIcon,
  Mail,
  Phone,
  Save,
  Shield,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type NotificationSettings = {
  appointmentReminders: boolean;
  labReportAlerts: boolean;
  emergencyAlerts: boolean;
  billingNotifications: boolean;
  staffAlerts: boolean;
  systemUpdates: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationSettings = {
  appointmentReminders: true,
  labReportAlerts: true,
  emergencyAlerts: true,
  billingNotifications: false,
  staffAlerts: true,
  systemUpdates: false,
};

export default function Settings() {
  const { user } = useAuthStore();
  const hospitalData = MOCK_HOSPITALS.find((h) => h.id === user?.hospitalId);

  // Unified States
  const [name, setName] = useState(
    hospitalData?.name ?? "Apollo Hospital Bangalore",
  );
  const [tagline, setTagline] = useState(
    "Compassionate Indian Care Since 1987",
  );
  const [address, setAddress] = useState(
    hospitalData?.address ??
      "12, Bannerghatta Main Rd, Phase 3, J. P. Nagar, Bengaluru, Karnataka 560076",
  );
  const [phone, setPhone] = useState(
    hospitalData?.contact ?? "+91 80 4668 8000",
  );
  const [email, setEmail] = useState(
    hospitalData
      ? `admin@${hospitalData.name.toLowerCase().replace(/\s+/g, "")}.org`
      : "info@apollohospitals.com",
  );
  const [emergencyContact, setEmergencyContact] = useState("1066");
  const [openTime, setOpenTime] = useState("07:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [is24Hours, setIs24Hours] = useState(false);
  const [receptionistShiftStart, setReceptionistShiftStart] = useState("08:00");
  const [receptionistShiftEnd, setReceptionistShiftEnd] = useState("16:00");
  const [morningShiftStart, setMorningShiftStart] = useState("07:00");
  const [morningShiftEnd, setMorningShiftEnd] = useState("15:00");
  const [afternoonShiftStart, setAfternoonShiftStart] = useState("15:00");
  const [afternoonShiftEnd, setAfternoonShiftEnd] = useState("23:00");
  const [eveningShiftStart, setEveningShiftStart] = useState("17:00");
  const [eveningShiftEnd, setEveningShiftEnd] = useState("23:00");
  const [nightShiftStart, setNightShiftStart] = useState("23:00");
  const [nightShiftEnd, setNightShiftEnd] = useState("07:00");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [licenseNumber, setLicenseNumber] = useState("KA-MED-2026-9876");
  const [tenancyCode, setTenancyCode] = useState(
    user?.hospitalCode ?? "HSP001",
  );
  const [hospitalStatus, setHospitalStatus] = useState("ACTIVE");
  const [originalSettings, setOriginalSettings] = useState<any>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(
    hospitalData?.logoUri ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<NotificationSettings>(
    INITIAL_NOTIFICATIONS,
  );

  const [generalTheme, setGeneralTheme] = useState("default");
  const [doctorTheme, setDoctorTheme] = useState("default");
  const [receptionistTheme, setReceptionistTheme] = useState("default");

  // Load dynamic branding from localStorage or backend fallback
  useEffect(() => {
    if (!user?.hospitalCode) return;
    const loadSettings = async () => {
      const savedData = localStorage.getItem(
        `hospital-settings-${user.hospitalCode}`,
      );
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setOriginalSettings(parsed);
          if (parsed.name) setName(parsed.name);
          if (parsed.tagline) setTagline(parsed.tagline);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.emergencyContact)
            setEmergencyContact(parsed.emergencyContact);
          if (parsed.openTime) setOpenTime(parsed.openTime);
          if (parsed.closeTime) setCloseTime(parsed.closeTime);
          if (parsed.openTime === "00:00" && parsed.closeTime === "00:00") {
            setIs24Hours(true);
          } else {
            setIs24Hours(false);
          }
          if (parsed.receptionistShiftStart)
            setReceptionistShiftStart(parsed.receptionistShiftStart);
          if (parsed.receptionistShiftEnd)
            setReceptionistShiftEnd(parsed.receptionistShiftEnd);
          if (parsed.morningShiftStart)
            setMorningShiftStart(parsed.morningShiftStart);
          if (parsed.morningShiftEnd)
            setMorningShiftEnd(parsed.morningShiftEnd);
          if (parsed.afternoonShiftStart)
            setAfternoonShiftStart(parsed.afternoonShiftStart);
          if (parsed.afternoonShiftEnd)
            setAfternoonShiftEnd(parsed.afternoonShiftEnd);
          if (parsed.eveningShiftStart)
            setEveningShiftStart(parsed.eveningShiftStart);
          if (parsed.eveningShiftEnd)
            setEveningShiftEnd(parsed.eveningShiftEnd);
          if (parsed.nightShiftStart)
            setNightShiftStart(parsed.nightShiftStart);
          if (parsed.nightShiftEnd) setNightShiftEnd(parsed.nightShiftEnd);
          if (parsed.registrationNumber)
            setRegistrationNumber(parsed.registrationNumber);
          if (parsed.timezone) setTimezone(parsed.timezone);
          if (parsed.licenseNumber) setLicenseNumber(parsed.licenseNumber);
          if (parsed.logoUri) setLogoPreview(parsed.logoUri);
          if (parsed.tenancyCode) setTenancyCode(parsed.tenancyCode);
          if (parsed.hospitalStatus) setHospitalStatus(parsed.hospitalStatus);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.generalTheme) setGeneralTheme(parsed.generalTheme);
          if (parsed.doctorTheme) setDoctorTheme(parsed.doctorTheme);
          if (parsed.receptionistTheme)
            setReceptionistTheme(parsed.receptionistTheme);
        } catch (e) {
          console.error("Failed to parse hospital settings", e);
        }
      } else {
        try {
          const res = await apiFetch<any>(
            `/super-admin/hospitals/code/${user.hospitalCode}`,
          );
          if (res) {
            if (res.hospitalName) setName(res.hospitalName);
            if (res.address) setAddress(res.address);
            if (res.phone) setPhone(res.phone);
            if (res.email) setEmail(res.email);
            if (res.registrationNumber)
              setRegistrationNumber(res.registrationNumber);
            if (res.openTime) setOpenTime(res.openTime);
            if (res.closeTime) setCloseTime(res.closeTime);
            if (res.openTime === "00:00" && res.closeTime === "00:00") {
              setIs24Hours(true);
            } else {
              setIs24Hours(false);
            }
            if (res.receptionistShiftStart)
              setReceptionistShiftStart(res.receptionistShiftStart);
            if (res.receptionistShiftEnd)
              setReceptionistShiftEnd(res.receptionistShiftEnd);
            if (res.morningShiftStart)
              setMorningShiftStart(res.morningShiftStart);
            if (res.morningShiftEnd) setMorningShiftEnd(res.morningShiftEnd);
            if (res.afternoonShiftStart)
              setAfternoonShiftStart(res.afternoonShiftStart);
            if (res.afternoonShiftEnd)
              setAfternoonShiftEnd(res.afternoonShiftEnd);
            if (res.eveningShiftStart)
              setEveningShiftStart(res.eveningShiftStart);
            if (res.eveningShiftEnd) setEveningShiftEnd(res.eveningShiftEnd);
            if (res.nightShiftStart) setNightShiftStart(res.nightShiftStart);
            if (res.nightShiftEnd) setNightShiftEnd(res.nightShiftEnd);
            if (res.hospitalCode) setTenancyCode(res.hospitalCode);
            if (res.status) setHospitalStatus(res.status);

            const loadedObj = {
              name: res.hospitalName || "",
              tagline: tagline,
              address: res.address || "",
              phone: res.phone || "",
              email: res.email || "",
              emergencyContact: emergencyContact,
              openTime: res.openTime || openTime,
              closeTime: res.closeTime || closeTime,
              receptionistShiftStart:
                res.receptionistShiftStart || receptionistShiftStart,
              receptionistShiftEnd:
                res.receptionistShiftEnd || receptionistShiftEnd,
              morningShiftStart: res.morningShiftStart || morningShiftStart,
              morningShiftEnd: res.morningShiftEnd || morningShiftEnd,
              afternoonShiftStart:
                res.afternoonShiftStart || afternoonShiftStart,
              afternoonShiftEnd: res.afternoonShiftEnd || afternoonShiftEnd,
              eveningShiftStart: res.eveningShiftStart || eveningShiftStart,
              eveningShiftEnd: res.eveningShiftEnd || eveningShiftEnd,
              nightShiftStart: res.nightShiftStart || nightShiftStart,
              nightShiftEnd: res.nightShiftEnd || nightShiftEnd,
              registrationNumber: res.registrationNumber || "",
              timezone: timezone,
              licenseNumber: licenseNumber,
              tenancyCode: res.hospitalCode || user.hospitalCode,
              hospitalStatus: res.status || "ACTIVE",
              logoUri: null,
              generalTheme: "default",
              doctorTheme: "default",
              receptionistTheme: "default",
            };
            setOriginalSettings(loadedObj);
            // Cache in localStorage to ensure sync
            localStorage.setItem(
              `hospital-settings-${user.hospitalCode}`,
              JSON.stringify(loadedObj),
            );
          }
        } catch (e) {
          console.error("Failed to fetch settings from backend", e);
        }
      }
    };

    loadSettings();
  }, [user?.hospitalCode]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // High-end aspect-ratio Canvas downscaler
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 128;
        const MAX_HEIGHT = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Optimize to highly compressed JPEG to keep string size tiny
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setLogoPreview(compressedBase64);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    let isSuccess = true;

    // Save to localStorage under multi-tenant key
    if (user?.hospitalCode) {
      const settingsObj = {
        name,
        tagline,
        address,
        phone,
        email,
        emergencyContact,
        openTime,
        closeTime,
        receptionistShiftStart,
        receptionistShiftEnd,
        morningShiftStart,
        morningShiftEnd,
        afternoonShiftStart,
        afternoonShiftEnd,
        eveningShiftStart,
        eveningShiftEnd,
        nightShiftStart,
        nightShiftEnd,
        registrationNumber,
        timezone,
        licenseNumber,
        tenancyCode,
        hospitalStatus,
        logoUri: logoPreview,
        notifications,
        generalTheme,
        doctorTheme,
        receptionistTheme,
      };

      try {
        localStorage.setItem(
          `hospital-settings-${user.hospitalCode}`,
          JSON.stringify(settingsObj),
        );

        // Sync with backend API
        await apiFetch(`/super-admin/hospitals/code/${user.hospitalCode}`, {
          method: "PUT",
          body: JSON.stringify({
            hospitalCode: user.hospitalCode,
            hospitalName: name,
            registrationNumber: registrationNumber || "REG-UNKNOWN",
            email: email,
            phone: phone,
            address: address,
            openTime: openTime,
            closeTime: closeTime,
            receptionistShiftStart: receptionistShiftStart,
            receptionistShiftEnd: receptionistShiftEnd,
            morningShiftStart: morningShiftStart,
            morningShiftEnd: morningShiftEnd,
            afternoonShiftStart: afternoonShiftStart,
            afternoonShiftEnd: afternoonShiftEnd,
            eveningShiftStart: eveningShiftStart,
            eveningShiftEnd: eveningShiftEnd,
            nightShiftStart: nightShiftStart,
            nightShiftEnd: nightShiftEnd,
          }),
        });

        // Dynamic Settings Audit Logs comparison
        const changes: string[] = [];
        if (originalSettings) {
          if (originalSettings.name !== name)
            changes.push(`Name to '${name}' (was '${originalSettings.name}')`);
          if (originalSettings.tagline !== tagline)
            changes.push(`Tagline to '${tagline}'`);
          if (originalSettings.address !== address)
            changes.push(`Address to '${address}'`);
          if (originalSettings.phone !== phone)
            changes.push(`Phone to '${phone}'`);
          if (originalSettings.email !== email)
            changes.push(`Email to '${email}'`);
          if (originalSettings.emergencyContact !== emergencyContact)
            changes.push(`Emergency Contact to '${emergencyContact}'`);
          if (
            originalSettings.openTime !== openTime ||
            originalSettings.closeTime !== closeTime
          ) {
            if (openTime === "00:00" && closeTime === "00:00") {
              changes.push("Hours to 24/7 (Open 24 Hours)");
            } else {
              changes.push(
                `Hours to ${openTime}–${closeTime} (was ${originalSettings.openTime}–${originalSettings.closeTime})`,
              );
            }
          }
          if (
            originalSettings.morningShiftStart !== morningShiftStart ||
            originalSettings.morningShiftEnd !== morningShiftEnd
          ) {
            changes.push(
              `Morning Shift to ${morningShiftStart}–${morningShiftEnd} (was ${originalSettings.morningShiftStart}–${originalSettings.morningShiftEnd})`,
            );
          }
          if (
            originalSettings.afternoonShiftStart !== afternoonShiftStart ||
            originalSettings.afternoonShiftEnd !== afternoonShiftEnd
          ) {
            changes.push(
              `Afternoon Shift to ${afternoonShiftStart}–${afternoonShiftEnd} (was ${originalSettings.afternoonShiftStart}–${originalSettings.afternoonShiftEnd})`,
            );
          }
          if (
            originalSettings.eveningShiftStart !== eveningShiftStart ||
            originalSettings.eveningShiftEnd !== eveningShiftEnd
          ) {
            changes.push(
              `Evening Shift to ${eveningShiftStart}–${eveningShiftEnd} (was ${originalSettings.eveningShiftStart}–${originalSettings.eveningShiftEnd})`,
            );
          }
          if (
            originalSettings.nightShiftStart !== nightShiftStart ||
            originalSettings.nightShiftEnd !== nightShiftEnd
          ) {
            changes.push(
              `Night Shift to ${nightShiftStart}–${nightShiftEnd} (was ${originalSettings.nightShiftStart}–${originalSettings.nightShiftEnd})`,
            );
          }

          const origNotifications =
            originalSettings.notifications || INITIAL_NOTIFICATIONS;
          if (
            origNotifications.appointmentReminders !==
            notifications.appointmentReminders
          ) {
            changes.push(
              `Appointment Reminders ${notifications.appointmentReminders ? "Enabled" : "Disabled"}`,
            );
          }
          if (
            origNotifications.labReportAlerts !== notifications.labReportAlerts
          ) {
            changes.push(
              `Lab Report Alerts ${notifications.labReportAlerts ? "Enabled" : "Disabled"}`,
            );
          }
          if (
            origNotifications.emergencyAlerts !== notifications.emergencyAlerts
          ) {
            changes.push(
              `Emergency Alerts ${notifications.emergencyAlerts ? "Enabled" : "Disabled"}`,
            );
          }
          if (
            origNotifications.billingNotifications !==
            notifications.billingNotifications
          ) {
            changes.push(
              `Billing Notifications ${notifications.billingNotifications ? "Enabled" : "Disabled"}`,
            );
          }
          if (origNotifications.staffAlerts !== notifications.staffAlerts) {
            changes.push(
              `Staff Alerts ${notifications.staffAlerts ? "Enabled" : "Disabled"}`,
            );
          }
          if (origNotifications.systemUpdates !== notifications.systemUpdates) {
            changes.push(
              `System Updates ${notifications.systemUpdates ? "Enabled" : "Disabled"}`,
            );
          }
          if (originalSettings.generalTheme !== generalTheme) {
            changes.push(
              `General Theme to '${generalTheme}' (was '${originalSettings.generalTheme || "default"}')`,
            );
          }
          if (originalSettings.doctorTheme !== doctorTheme) {
            changes.push(
              `Doctor Theme to '${doctorTheme}' (was '${originalSettings.doctorTheme || "default"}')`,
            );
          }
          if (originalSettings.receptionistTheme !== receptionistTheme) {
            changes.push(
              `Receptionist Theme to '${receptionistTheme}' (was '${originalSettings.receptionistTheme || "default"}')`,
            );
          }
        }

        const detailsStr =
          changes.length > 0
            ? `Updated settings: ${changes.join(", ")}`
            : "Updated settings (no values changed)";

        // Post Custom Audit Log to Admin Service
        try {
          await apiFetch("/admin/audit-logs", {
            method: "POST",
            headers: {
              "X-Hospital-Code": user.hospitalCode,
              "X-Auth-User": user.email || "Admin",
            },
            body: JSON.stringify({
              action: "UPDATE_SETTINGS",
              details: detailsStr,
              performedBy: user.email || "Admin",
              module: "DEPARTMENT",
            }),
          });
        } catch (e) {
          console.error("Failed to post custom settings audit log", e);
        }

        // Set new baseline
        setOriginalSettings(settingsObj);

        // Dispatch global custom event for instant layout refresh
        window.dispatchEvent(new Event("hospital-settings-updated"));
      } catch (err) {
        console.error("Storage/API sync failed:", err);
        isSuccess = false;
        toast.error(
          "Failed to persist brand changes to database. Please check your network connection.",
        );
      }
    }

    setSaving(false);
    if (isSuccess) {
      setSaved(true);
      toast.success("Settings saved successfully!", { duration: 3000 });
      setTimeout(() => setSaved(false), 3000);
    }
  }

  const NOTIFICATION_ITEMS: {
    key: keyof NotificationSettings;
    label: string;
    description: string;
  }[] = [
    {
      key: "appointmentReminders",
      label: "Appointment Reminders",
      description: "Notify patients 24h before their scheduled appointment",
    },
    {
      key: "labReportAlerts",
      label: "Lab Report Alerts",
      description: "Alert doctors when lab results are ready for review",
    },
    {
      key: "emergencyAlerts",
      label: "Emergency Alerts",
      description: "Broadcast critical alerts to all on-duty staff immediately",
    },
    {
      key: "billingNotifications",
      label: "Billing Notifications",
      description:
        "Notify patients about pending invoices and payment reminders",
    },
    {
      key: "staffAlerts",
      label: "Staff Alerts",
      description: "Internal alerts for roster changes and shift reminders",
    },
    {
      key: "systemUpdates",
      label: "System Updates",
      description:
        "Receive notifications about platform updates and maintenance windows",
    },
  ];

  const dashboardConfigs = [
    {
      id: "general",
      label: "All Dashboards (General System Fallback)",
      description:
        "Default theme applied to Admin, Pharmacist, Lab, and overall system elements.",
      value: generalTheme,
      onChange: setGeneralTheme,
    },
    {
      id: "doctor",
      label: "Doctor Dashboard Workspace",
      description:
        "Custom overriding brand theme applied specifically to Doctor clinics and nursing portals.",
      value: doctorTheme,
      onChange: setDoctorTheme,
    },
    {
      id: "receptionist",
      label: "Receptionist & Front Desk Workspace",
      description:
        "Custom overriding brand theme applied specifically to Patient Registry, Billing, and front-desk consoles.",
      value: receptionistTheme,
      onChange: setReceptionistTheme,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl" data-ocid="admin.settings.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your hospital's profile, logo, operations, hours, and
          notification channels.
        </p>
      </div>

      {/* Hospital ID banner */}
      <div className="glass rounded-xl px-5 py-4 flex items-center gap-3 border border-primary/20 shadow-glass-sm bg-gradient-to-r from-card/30 to-card/10">
        <Hash className="w-4 h-4 text-primary flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Hospital Tenancy ID
          </p>
          <p
            className="text-sm font-mono font-semibold text-foreground animate-pulse-subtle"
            data-ocid="admin.settings.hospital_id"
          >
            {tenancyCode}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border uppercase ${
              hospitalStatus.toLowerCase() === "active"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {hospitalStatus}
          </span>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6 w-full">
        <TabsList className="bg-muted/40 dark:bg-slate-900/50 p-1 rounded-lg border border-border/30 dark:border-slate-800/80 w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm py-2 px-4 rounded-md"
          >
            Hospital Profile
          </TabsTrigger>
          <TabsTrigger
            value="operations"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm py-2 px-4 rounded-md"
          >
            Operations & Hours
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm py-2 px-4 rounded-md"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="theme"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm py-2 px-4 rounded-md"
          >
            Color Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Hospital Profile */}
        <TabsContent value="profile" className="space-y-6 outline-none">
          <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">
                Identity & Contacts
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Hospital Brand Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Hospital logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-ocid="admin.settings.logo.upload_button"
                        className="gap-2 border-border text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadCloud className="w-4 h-4" />
                        Upload Logo
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          data-ocid="admin.settings.logo.remove_button"
                          className="gap-2"
                          onClick={() => setLogoPreview(null)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Logo
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 2MB. Recommended 256×256px.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-name">Hospital Name</Label>
                  <Input
                    id="s-name"
                    data-ocid="admin.settings.name.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-phone">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Main Phone
                  </Label>
                  <PhoneInput
                    id="s-phone"
                    data-ocid="admin.settings.phone.input"
                    value={phone}
                    onChange={setPhone}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5 col-span-full">
                  <Label htmlFor="s-address">Address</Label>
                  <Textarea
                    id="s-address"
                    data-ocid="admin.settings.address.textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="bg-background border-border resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-email">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Support Email
                  </Label>
                  <Input
                    id="s-email"
                    type="email"
                    data-ocid="admin.settings.email.input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-license">
                    <Shield className="w-3 h-3 inline mr-1" />
                    License Number
                  </Label>
                  <Input
                    id="s-license"
                    data-ocid="admin.settings.license.input"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Operations & Hours */}
        <TabsContent value="operations" className="space-y-6 outline-none">
          <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <Clock className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">
                Operational Details & Working Hours
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-tagline">Tagline / Motto</Label>
                  <Input
                    id="s-tagline"
                    data-ocid="admin.settings.tagline.input"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-emergency">
                    <Phone className="w-3 h-3 inline mr-1 text-destructive" />
                    Emergency Contact Line
                  </Label>
                  <PhoneInput
                    id="s-emergency"
                    data-ocid="admin.settings.emergency.input"
                    value={emergencyContact}
                    onChange={setEmergencyContact}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1.5 col-span-full">
                  <div className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-lg shadow-2xs">
                    <input
                      type="checkbox"
                      id="s-24h"
                      checked={is24Hours}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIs24Hours(checked);
                        if (checked) {
                          setOpenTime("00:00");
                          setCloseTime("00:00");
                        } else {
                          setOpenTime("07:00");
                          setCloseTime("21:00");
                        }
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor="s-24h"
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-orange-500" />{" "}
                        Hospital Runs 24/7 (Open 24 Hours)
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Select this if the hospital operations run continuously
                        24 hours a day, 7 days a week.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s-open">Opening Time</Label>
                  <TimeInput
                    id="s-open"
                    data-ocid="admin.settings.open_time.input"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    disabled={is24Hours}
                    className={
                      is24Hours ? "opacity-50 pointer-events-none" : ""
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-close">Closing Time</Label>
                  <TimeInput
                    id="s-close"
                    data-ocid="admin.settings.close_time.input"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    disabled={is24Hours}
                    className={
                      is24Hours ? "opacity-50 pointer-events-none" : ""
                    }
                  />
                </div>
                {/* Morning Shift */}
                <div className="space-y-1.5 border border-primary/20 p-3 rounded-xl bg-gradient-to-br from-blue-50/40 dark:from-blue-950/20 to-card/30">
                  <div className="font-bold text-xs text-primary flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/15">
                      🌅
                    </span>
                    Morning Shift
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <TimeInput
                      id="s-morning-start"
                      label="Start Time"
                      value={morningShiftStart}
                      onChange={(e) => setMorningShiftStart(e.target.value)}
                    />
                    <TimeInput
                      id="s-morning-end"
                      label="End Time"
                      value={morningShiftEnd}
                      onChange={(e) => setMorningShiftEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Afternoon Shift */}
                <div className="space-y-1.5 border border-amber-400/20 p-3 rounded-xl bg-gradient-to-br from-amber-50/40 dark:from-amber-950/20 to-card/30">
                  <div className="font-bold text-xs text-amber-500 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-400/15">
                      🌇
                    </span>
                    Afternoon Shift
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <TimeInput
                      id="s-afternoon-start"
                      label="Start Time"
                      value={afternoonShiftStart}
                      onChange={(e) => setAfternoonShiftStart(e.target.value)}
                    />
                    <TimeInput
                      id="s-afternoon-end"
                      label="End Time"
                      value={afternoonShiftEnd}
                      onChange={(e) => setAfternoonShiftEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Evening Shift */}
                <div className="space-y-1.5 border border-purple-400/20 p-3 rounded-xl bg-gradient-to-br from-purple-50/40 dark:from-purple-950/20 to-card/30">
                  <div className="font-bold text-xs text-purple-500 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-purple-400/15">
                      🌆
                    </span>
                    Evening Shift
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <TimeInput
                      id="s-evening-start"
                      label="Start Time"
                      value={eveningShiftStart}
                      onChange={(e) => setEveningShiftStart(e.target.value)}
                    />
                    <TimeInput
                      id="s-evening-end"
                      label="End Time"
                      value={eveningShiftEnd}
                      onChange={(e) => setEveningShiftEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Night Shift */}
                <div className="space-y-1.5 border border-slate-400/20 p-3 rounded-xl bg-gradient-to-br from-slate-50/40 dark:from-slate-900/30 to-card/30">
                  <div className="font-bold text-xs text-slate-500 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-400/15">
                      🌙
                    </span>
                    Night Shift
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <TimeInput
                      id="s-night-start"
                      label="Start Time"
                      value={nightShiftStart}
                      onChange={(e) => setNightShiftStart(e.target.value)}
                    />
                    <TimeInput
                      id="s-night-end"
                      label="End Time"
                      value={nightShiftEnd}
                      onChange={(e) => setNightShiftEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-full">
                  <Label htmlFor="s-tz">System Timezone</Label>
                  <Input
                    id="s-tz"
                    data-ocid="admin.settings.timezone.input"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Note: Emergency rooms and ambulance services always run 24/7.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Notifications */}
        <TabsContent value="notifications" className="space-y-6 outline-none">
          <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">
                Notification Preferences & Channels
              </h2>
            </div>
            <div className="p-6 space-y-1">
              {NOTIFICATION_ITEMS.map((item, i) => (
                <div key={item.key}>
                  {i > 0 && <Separator className="my-3 bg-border" />}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      data-ocid={`admin.settings.${item.key}.switch`}
                      checked={notifications[item.key]}
                      onCheckedChange={(v) =>
                        setNotifications({ ...notifications, [item.key]: v })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Color Settings */}
        <TabsContent value="theme" className="space-y-6 outline-none">
          <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary animate-pulse-subtle" />
                <h2 className="font-semibold text-foreground">
                  Institutional Workspace Themes
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneralTheme("default");
                  setDoctorTheme("default");
                  setReceptionistTheme("default");
                  toast.success(
                    "Themes reset to defaults. Click 'Save Settings' to apply.",
                  );
                }}
                className="text-xs border-border hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-smooth"
              >
                Reset to Defaults
              </Button>
            </div>
            <div className="p-6 space-y-8 divide-y divide-border/40">
              {dashboardConfigs.map((config, index) => {
                const isCustom = config.value.startsWith("#");
                const customColorVal = isCustom ? config.value : "#3b82f6";

                return (
                  <div
                    key={config.id}
                    className={`space-y-4 ${index > 0 ? "pt-6" : ""}`}
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {config.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Presets */}
                      {PRESET_THEMES.map((themeOption) => {
                        const isSelected = config.value === themeOption.id;
                        return (
                          <button
                            key={themeOption.id}
                            type="button"
                            onClick={() => config.onChange(themeOption.id)}
                            className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                              isSelected
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-sm"
                                : "border border-border/60 hover:border-muted-foreground/40"
                            }`}
                            title={themeOption.name}
                            style={{ backgroundColor: themeOption.color }}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                            )}
                            {/* Hover tooltip */}
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-0.5 rounded border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-20">
                              {themeOption.name}
                            </span>
                          </button>
                        );
                      })}

                      {/* Custom Color Selector */}
                      <div className="h-6 w-[1px] bg-border/60 mx-1 hidden sm:block" />

                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                          isCustom
                            ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border-border/60 hover:border-muted-foreground/40 bg-muted/10"
                        }`}
                      >
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border/80 flex-shrink-0">
                          <input
                            type="color"
                            value={customColorVal}
                            onChange={(e) => config.onChange(e.target.value)}
                            className="absolute -inset-1 w-8 h-8 cursor-pointer border-none p-0 bg-transparent"
                            style={{ WebkitAppearance: "none" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => config.onChange(customColorVal)}
                          className="text-xs font-semibold text-foreground tracking-wide cursor-pointer focus:outline-none"
                        >
                          {isCustom
                            ? `Custom: ${config.value.toUpperCase()}`
                            : "Custom Color"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save button bar */}
      <div className="flex items-center justify-between mt-6">
        {saved && (
          <div
            data-ocid="admin.settings.success_state"
            className="flex items-center gap-2 text-emerald-400 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully!
            <button
              type="button"
              onClick={() => setSaved(false)}
              aria-label="Dismiss"
              className="ml-1 text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none"
            >
              ✕
            </button>
          </div>
        )}
        {saving && (
          <div className="text-muted-foreground text-sm animate-pulse">
            Saving configurations…
          </div>
        )}
        {!saved && !saving && <div />}
        <Button
          type="button"
          data-ocid="admin.settings.save_button"
          onClick={handleSave}
          disabled={saving}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 min-w-[140px]"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

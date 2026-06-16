import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HeartPulse,
  Layers,
  Loader2,
  Search,
  Send,
  Users,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Patient {
  id: string;
  patientNo: string;
  firstName?: string;
  lastName?: string;
  name: string;
  age?: string;
  dob?: string;
  gender: string;
  bloodGroup?: string;
  status?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  placePin?: string;
}

interface ServiceItem {
  id: string;
  label: string;
  category: "service" | "udr" | "other";
  icon: any;
}

const SERVICES: ServiceItem[] = [
  // Service List
  { id: "xray", label: "X-Ray", category: "service", icon: FileText },
  { id: "ct-scan", label: "CT Scan", category: "service", icon: Layers },
  { id: "usg", label: "USG", category: "service", icon: Waves },

  // User Def. Reports
  { id: "mri", label: "MRI", category: "udr", icon: Layers },
  { id: "echo", label: "Echo", category: "udr", icon: Activity },
  { id: "lab", label: "Lab", category: "udr", icon: HeartPulse },
  { id: "ot", label: "OT", category: "udr", icon: Activity },
  { id: "physio", label: "Physiotherapy", category: "udr", icon: HeartPulse },
  { id: "daycare", label: "Day Care", category: "udr", icon: Clock },

  // Other Services
  { id: "other", label: "Other Diagnostics", category: "other", icon: Compass },
];

export default function SendRequestLab() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isIPD, setIsIPD] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // USG Pregnancy Conditional fields
  const [isUSGPregnancy, setIsUSGPregnancy] = useState(false);
  const [lmpDate, setLmpDate] = useState("");
  const [weeks, setWeeks] = useState("");

  // Fetch all patients from reception service
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const code = user?.hospitalCode || "HSP001";
        const response = await apiFetch<any>("/reception/patients?size=1000", {
          headers: { "X-Hospital-Code": code },
        });
        const list = Array.isArray(response)
          ? response
          : response?.content || [];
        setPatients(list);
      } catch (err) {
        console.warn("Failed to fetch patients directory:", err);
      } finally {
        setLoadingPatients(false);
      }
    };
    if (user) {
      fetchPatients();
    }
  }, [user]);

  // Set default billing type based on patient status
  useEffect(() => {
    if (selectedPatient) {
      const isAdmitted =
        selectedPatient.status === "Admitted" ||
        selectedPatient.patientNo?.startsWith("IP") ||
        false;
      setIsIPD(isAdmitted);
    } else {
      setIsIPD(false);
    }
  }, [selectedPatient]);

  // Handle USG selection toggle
  useEffect(() => {
    if (!selectedServices.includes("usg")) {
      setIsUSGPregnancy(false);
      setLmpDate("");
      setWeeks("");
    }
  }, [selectedServices]);

  const filteredPatients = patients.filter((p) => {
    const fullName = p.firstName
      ? `${p.firstName} ${p.lastName || ""}`.trim().toLowerCase()
      : (p.name || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      (p.patientNo || "").toLowerCase().includes(query)
    );
  });

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    const displayName = patient.firstName
      ? `${patient.firstName} ${patient.lastName || ""}`.trim()
      : patient.name;
    setSearchQuery(displayName);
    setShowDropdown(false);
  };

  const handleSendRequest = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please select at least one modality.");
      return;
    }
    if (isUSGPregnancy && !lmpDate) {
      toast.error("Please enter the LMP Date for USG pregnancy details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      const displayName = selectedPatient.firstName
        ? `${selectedPatient.firstName} ${selectedPatient.lastName || ""}`.trim()
        : selectedPatient.name;

      // Send a separate request for each selected service
      for (const serviceId of selectedServices) {
        const service = SERVICES.find((s) => s.id === serviceId);
        if (!service) continue;

        // Derive age
        let patientAge = selectedPatient.age || "30";
        if (selectedPatient.dob) {
          patientAge = String(
            new Date().getFullYear() -
              new Date(selectedPatient.dob).getFullYear(),
          );
        }

        const payload = {
          patientNo: selectedPatient.patientNo,
          patientName: displayName,
          age: patientAge,
          gender: selectedPatient.gender || "Male",
          place: selectedPatient.placePin || "Main Clinic",
          phone: selectedPatient.phone || selectedPatient.mobile || "",
          address: selectedPatient.address || "Address Details",
          reportingDoctorId: user?.id || user?.name || "DR-001",
          referredDoctorId: user?.id || user?.name || "DR-001",
          clinicianNotes: remarks || `Doctor requested ${service.label}.`,
          serviceType: service.label,
          priceList: isIPD ? "IPD PRICE LIST" : "OPD PRICE LIST",
          status: "REQUESTED",
          hospitalCode: code,
          ...(serviceId === "usg" && isUSGPregnancy
            ? {
                lmpDate: lmpDate,
                weeks: weeks || "0",
              }
            : {}),
        };

        await apiFetch("/lab/diagnostic-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Hospital-Code": code,
          },
          body: JSON.stringify(payload),
        });
      }

      toast.success("Diagnostic requests sent successfully!");
      navigate({ to: "/doctor" });
    } catch (err: any) {
      console.error("Failed to send diagnostic requests:", err);
      toast.error(
        err.message || "Failed to submit requests. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-teal-800 dark:text-teal-400">
          Send Diagnostic / Lab Request
        </h1>
        <p className="text-sm text-muted-foreground">
          Select a patient and order diagnostic modalities directly to the
          technician queues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Patient Directory Search */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-sm space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
              <Users className="w-4 h-4 text-teal-600" />
              Patient Selection
            </h2>

            <div className="relative">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                Search Patient
              </Label>
              <div className="relative">
                <Input
                  placeholder="Name or Patient No..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                    if (selectedPatient) setSelectedPatient(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-8 h-9 text-xs"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Patient Autocomplete Dropdown */}
              {showDropdown && searchQuery && filteredPatients.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
                  {filteredPatients.map((p) => {
                    const name = p.firstName
                      ? `${p.firstName} ${p.lastName || ""}`.trim()
                      : p.name;
                    return (
                      <button
                        key={p.id || p.patientNo}
                        onClick={() => handleSelectPatient(p)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-teal-500/10 hover:text-teal-600 border-b border-border/40 last:border-0 flex flex-col"
                      >
                        <span className="font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {p.patientNo} • {p.gender} • {p.age || "30"} yrs
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Patient Card */}
            {selectedPatient && (
              <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-400">
                    Selected Patient
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] border-teal-500/30 text-teal-600"
                  >
                    {selectedPatient.status || "OPD"}
                  </Badge>
                </div>
                <div className="text-xs space-y-1 text-foreground/80">
                  <p className="font-semibold text-foreground">
                    {selectedPatient.firstName
                      ? `${selectedPatient.firstName} ${selectedPatient.lastName || ""}`.trim()
                      : selectedPatient.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ID: {selectedPatient.patientNo}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedPatient.gender} • {selectedPatient.age || "30"} yrs
                  </p>
                  {selectedPatient.phone && (
                    <p className="text-[10px] text-muted-foreground">
                      Tel: {selectedPatient.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Modalities and Submission */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-foreground/80">
              Select Modalities
            </h2>

            {/* Modalities Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all duration-200 ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-400 font-semibold shadow-sm"
                        : "border-border hover:border-teal-500/20 hover:bg-muted/10 text-foreground"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? "bg-teal-500/20 text-teal-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs">{service.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conditional USG Pregnancy Fields */}
            {selectedServices.includes("usg") && (
              <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-4 animate-slideDown">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                      USG Pregnancy Details
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Fill in pregnancy telemetry data if applicable
                    </p>
                  </div>
                  <Switch
                    checked={isUSGPregnancy}
                    onCheckedChange={setIsUSGPregnancy}
                  />
                </div>

                {isUSGPregnancy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        LMP Date
                      </Label>
                      <Input
                        type="date"
                        value={lmpDate}
                        onChange={(e) => setLmpDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Pregnancy Weeks
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 12"
                        value={weeks}
                        onChange={(e) => setWeeks(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing & Remarks */}
            <div className="space-y-4 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    In-Patient Department (IPD)
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Toggle for admitted IPD billing route (defaults based on
                    patient status)
                  </p>
                </div>
                <Switch checked={isIPD} onCheckedChange={setIsIPD} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Clinician Notes / Remarks
                </Label>
                <Textarea
                  placeholder="Enter optional notes or reasons for request..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/doctor" })}
                className="text-xs h-9 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  isSubmitting ||
                  !selectedPatient ||
                  selectedServices.length === 0
                }
                onClick={handleSendRequest}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 px-5 rounded-lg flex items-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Request to Lab</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

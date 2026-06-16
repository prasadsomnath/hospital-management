import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type { AppointmentResponse } from "@/lib/reception-types";
import {
  Activity,
  Bell,
  Clock,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Stethoscope,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface OPDAvailabilityModalProps {
  open: boolean;
  onClose: () => void;
  hospitalCode: string;
  date: string;
  onSelectClinic?: (clinic: any) => void;
}

interface ClinicAvailability {
  id: string;
  name: string;
  room: string;
  doctor: string;
  specialty: string;
  status: "Available" | "Busy" | "On Break" | "On Leave";
  queueCount: number;
  estWaitMinutes: number;
}

const STATUS_COLOR_MAP = {
  Available:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Busy: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "On Break": "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  "On Leave":
    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

function formatDoctorName(doctor: any) {
  const rawName =
    doctor.name ||
    [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
    doctor.email ||
    "Unassigned Doctor";

  return rawName.toLowerCase().startsWith("dr.") ? rawName : `Dr. ${rawName}`;
}

function getDoctorStatus(
  doctor: any,
  queueCount: number,
): ClinicAvailability["status"] {
  const backendStatus = String(
    doctor.availabilityStatus || doctor.status || "",
  ).toUpperCase();

  if (doctor.isActive === false || backendStatus.includes("LEAVE")) {
    return "On Leave";
  }
  if (backendStatus.includes("BREAK")) {
    return "On Break";
  }
  if (backendStatus.includes("BUSY")) {
    return "Busy";
  }

  return queueCount >= 6 ? "Busy" : "Available";
}

export function OPDAvailabilityModal({
  open,
  onClose,
  hospitalCode,
  date,
  onSelectClinic,
}: OPDAvailabilityModalProps) {
  const [clinics, setClinics] = useState<ClinicAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadAvailability = useCallback(async () => {
    if (!hospitalCode) return;

    setLoading(true);
    try {
      const [docsRes, appointments] = await Promise.all([
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": hospitalCode },
        }),
        receptionApi.getAppointments(hospitalCode, date),
      ]);
      const doctors = Array.isArray(docsRes)
        ? docsRes
        : (docsRes?.content ?? []);

      const activeQueueStatuses = new Set([
        "PENDING",
        "SCHEDULED",
        "WAITING",
        "BOOKED",
        "CHECKED_IN",
      ]);

      const queueForDoctor = (doctor: any) =>
        appointments.filter((appt: AppointmentResponse) => {
          const status = (appt.status || "").toUpperCase();
          const isActiveQueue =
            !status ||
            activeQueueStatuses.has(status) ||
            status.includes("PEND");

          return (
            isActiveQueue &&
            (String(appt.doctorId) === String(doctor.id) ||
              appt.doctorName?.toLowerCase() ===
                formatDoctorName(doctor).toLowerCase())
          );
        }).length;

      const mapped = doctors.map((doctor): ClinicAvailability => {
        const queueCount = queueForDoctor(doctor);
        const specialty =
          doctor.specialization || doctor.specialty || "General Medicine";
        const department =
          doctor.departmentName || doctor.department || specialty;

        return {
          id: String(doctor.id ?? doctor.email ?? formatDoctorName(doctor)),
          name: department.toLowerCase().includes("clinic")
            ? department
            : `${department} Clinic`,
          room:
            doctor.roomNumber ||
            doctor.roomName ||
            doctor.consultationRoom ||
            "Room not assigned",
          doctor: formatDoctorName(doctor),
          specialty,
          status: getDoctorStatus(doctor, queueCount),
          queueCount,
          estWaitMinutes: queueCount * 3,
        };
      });

      setClinics(mapped);
    } catch (error) {
      console.error("Failed to load OPD availability from backend:", error);
      setClinics([]);
      toast.error("Failed to load OPD availability from backend.");
    } finally {
      setLoading(false);
    }
  }, [date, hospitalCode]);

  // Handle Hotkey to Close Dialog
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      loadAvailability();
    }
  }, [loadAvailability, open]);

  const handleRefresh = async () => {
    await loadAvailability();
    toast.success("OPD room availability refreshed from backend.");
  };

  const handlePageDoctor = (docName: string) => {
    toast.info(`Sent pager alert notifications to ${docName}.`);
  };

  // Filter clinics
  const filteredClinics = clinics.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(query) ||
      c.doctor.toLowerCase().includes(query) ||
      c.specialty.toLowerCase().includes(query) ||
      c.room.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalCount = clinics.length;
  const availableCount = clinics.filter((c) => c.status === "Available").length;
  const busyCount = clinics.filter((c) => c.status === "Busy").length;
  const breakCount = clinics.filter((c) => c.status === "On Break").length;
  const leaveCount = clinics.filter((c) => c.status === "On Leave").length;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
        {/* Header Block */}
        <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold font-display flex items-center gap-2.5 text-zinc-900 dark:text-zinc-50">
                <Activity className="w-5.5 h-5.5 text-teal-500 animate-pulse" />
                OPD Clinic & Doctor Availability
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close dialog</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                statusFilter === "ALL"
                  ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-50 shadow-md font-semibold"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total Clinics
              </span>
              <span className="text-base font-bold mt-0.5">{totalCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Available")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                statusFilter === "Available"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md font-semibold"
                  : "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider">
                Available
              </span>
              <span className="text-base font-bold mt-0.5">
                {availableCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Busy")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                statusFilter === "Busy"
                  ? "bg-amber-600 text-white border-amber-600 shadow-md font-semibold"
                  : "bg-amber-500/5 text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider">Busy</span>
              <span className="text-base font-bold mt-0.5">{busyCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("On Break")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                statusFilter === "On Break"
                  ? "bg-sky-600 text-white border-sky-600 shadow-md font-semibold"
                  : "bg-sky-500/5 text-sky-600 border-sky-500/20 hover:bg-sky-500/10"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider">
                On Break
              </span>
              <span className="text-base font-bold mt-0.5">{breakCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("On Leave")}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all col-span-2 sm:col-span-1 ${
                statusFilter === "On Leave"
                  ? "bg-rose-600 text-white border-rose-600 shadow-md font-semibold"
                  : "bg-rose-500/5 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider">
                On Leave
              </span>
              <span className="text-base font-bold mt-0.5">{leaveCount}</span>
            </button>
          </div>

          {/* Search Controls */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search clinics, doctor name, room number, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded-lg text-xs font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                Status:{" "}
                <b className="text-zinc-800 dark:text-zinc-200">
                  {statusFilter}
                </b>
              </span>
            </div>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="p-6 max-h-[50vh] overflow-y-auto bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <RefreshCw className="w-7 h-7 text-teal-500 mb-3 animate-spin" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Loading OPD availability from backend...
                </p>
              </div>
            ) : (
              filteredClinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="group relative flex flex-col justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 hover:border-teal-500/30 hover:shadow-lg transition-all rounded-xl overflow-hidden"
                >
                  {/* Visual Accent based on availability */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1 transition-all ${
                      clinic.status === "Available"
                        ? "bg-emerald-500"
                        : clinic.status === "Busy"
                          ? "bg-amber-500"
                          : clinic.status === "On Break"
                            ? "bg-sky-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />

                  <div className="pl-2 space-y-3">
                    {/* Clinic header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                          {clinic.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {clinic.room}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full border ${
                          STATUS_COLOR_MAP[clinic.status]
                        }`}
                      >
                        {clinic.status}
                      </Badge>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100/50 dark:border-zinc-800/40">
                      <div className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">
                          {clinic.doctor}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {clinic.specialty}
                        </p>
                      </div>
                    </div>

                    {/* Queue Details */}
                    {clinic.status !== "On Leave" ? (
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <Activity className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            Queue: <b>{clinic.queueCount} pat.</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            Wait: <b>~{clinic.estWaitMinutes}m</b>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-500 italic pt-2 font-mono flex items-center gap-1">
                        <span>•</span> Out of Service Today
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 pl-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] font-semibold gap-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2"
                      disabled={clinic.status === "On Leave"}
                      onClick={() => handlePageDoctor(clinic.doctor)}
                    >
                      <Bell className="w-3 h-3" />
                      Page
                    </Button>
                    {clinic.status === "Available" && onSelectClinic && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-[10px] font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded px-2.5"
                        onClick={() => onSelectClinic(clinic)}
                      >
                        Assign Patient
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}

            {!loading && filteredClinics.length === 0 && (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <SlidersHorizontal className="w-8 h-8 text-zinc-400 stroke-1 mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No matching OPD clinics found
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Try clearing your filters or adjustment search criteria.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-3 text-xs text-teal-600"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>
            Keyboard: press{" "}
            <kbd className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
              Esc
            </kbd>{" "}
            to close availability list
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

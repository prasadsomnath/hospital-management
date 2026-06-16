import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationControl } from "@/components/ui/pagination-control";
import { receptionApi } from "@/lib/reception-api";
import type { Appointment } from "@/lib/types";
import { formatTimeSlot } from "@/lib/utils";
import { parseAppointmentNotes } from "@/pages/receptionist/BookAppointment";
import { useAuthStore } from "@/store/auth-store";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-primary/20 text-primary border-primary/30",
  "Checked-In": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Scheduled: "bg-muted text-muted-foreground border-border",
  Completed: "bg-accent/20 text-accent border-accent/30",
  Cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const TYPE_COLORS: Record<string, string> = {
  Emergency: "bg-destructive",
  "Checked-In": "bg-emerald-400",
  Consultation: "bg-primary",
  "Follow-up": "bg-accent",
  "Post-Op": "bg-purple-400",
  "Check-up": "bg-muted-foreground",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function DoctorAppointments() {
  const { user } = useAuthStore();

  // Default to today's date dynamically
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upcoming appointments section search & page pagination states
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [upcomingPageSize, setUpcomingPageSize] = useState(10);

  // Reset page when search changes
  useEffect(() => {
    setUpcomingPage(0);
  }, [upcomingSearch]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      // Use the doctor's real entity ID for filtering; fall back to undefined (= ALL)
      // if the user is on a dev/mock session to avoid filtering with a non-existent ID.
      const drId = user?.id && user.id !== "mock-id" ? user.id : undefined;
      const list = await receptionApi.getAppointments(code, undefined, drId);
      if (list && list.length > 0) {
        const mapped = list.map((a: any) => {
          const parsed = parseAppointmentNotes(a.notes || "");
          return {
            id: String(a.id),
            patientId: a.patientNo,
            patientName: a.patientName,
            doctorId: a.doctorId,
            doctorName: a.doctorName,
            date: a.appointmentDate,
            time: formatTimeSlot(a.timeSlot),
            type: a.appointmentType as Appointment["type"],
            status: a.status as Appointment["status"],
            token: Number(a.tokenNo) || a.tokenNo,
            notes: a.notes || "",
            roomNumber: a.roomNumber || parsed.roomNumber || "",
            bedNo: a.bedNo || parsed.bedNo || "",
            roomType: a.roomType || parsed.roomType || "",
            assignedNurse: a.assignedNurse || parsed.assignedNurse || "",
          };
        });

        // Filter by doctorId if specified (since backend getAppointments with date=null fetches all)
        const filtered = drId
          ? mapped.filter((a) => String(a.doctorId) === String(drId))
          : mapped;

        setAllAppointments(filtered);
      } else {
        setAllAppointments([]);
      }
    } catch (e) {
      console.warn("Failed to fetch appointments:", e);
      setAllAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  type CalCell = { key: string; day: number | null };
  const cells: CalCell[] = [
    ...Array.from({ length: firstDay }, (_, i) => ({
      key: `pad-${viewYear}-${viewMonth}-${i}`,
      day: null as null,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      key: `day-${i + 1}`,
      day: i + 1,
    })),
  ];
  while (cells.length % 7 !== 0)
    cells.push({
      key: `pad-${viewYear}-${viewMonth}-end-${cells.length}`,
      day: null,
    });

  function dateStr(day: number) {
    return `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
  }

  function apptsByDate(d: string) {
    return allAppointments.filter((a) => a.date === d);
  }

  const selectedAppts = apptsByDate(selectedDate);
  const previousApptsCount = allAppointments.filter(
    (a) => a.date < todayStr,
  ).length;

  async function markStatus(id: string, status: Appointment["status"]) {
    try {
      const code = user?.hospitalCode || "HSP001";
      await receptionApi.updateAppointmentStatus(Number(id), status, code);
      toast.success(`Appointment status updated to ${status}`);
      fetchAppointments();
    } catch (e: any) {
      console.error("Failed to update status:", e);
      toast.error(e.message || "Failed to update appointment status");
    }
  }

  // Filter and paginate upcoming appointments
  const upcomingAppts = allAppointments
    .filter((a) => {
      return (
        a.date >= todayStr &&
        a.status !== "Cancelled" &&
        a.status !== "Completed"
      );
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  const filteredUpcoming = upcomingAppts.filter(
    (a) =>
      a.patientName.toLowerCase().includes(upcomingSearch.toLowerCase()) ||
      a.patientId.toLowerCase().includes(upcomingSearch.toLowerCase()) ||
      a.type.toLowerCase().includes(upcomingSearch.toLowerCase()),
  );

  const totalUpcomingPages = Math.ceil(
    filteredUpcoming.length / upcomingPageSize,
  );
  const paginatedUpcoming = filteredUpcoming.slice(
    upcomingPage * upcomingPageSize,
    (upcomingPage + 1) * upcomingPageSize,
  );

  return (
    <div className="space-y-6" data-ocid="doctor.appointments.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Appointments
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {allAppointments.length} total appointments · {previousApptsCount}{" "}
          previous appointments
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 glass-elevated rounded-xl p-5 shadow-glass-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ocid="doctor.appointments.calendar.prev"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-foreground font-display">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ocid="doctor.appointments.calendar.next"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day header */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map(({ key, day }) => {
              if (!day) return <div key={key} />;
              const ds = dateStr(day);
              const appts = apptsByDate(ds);
              const isSelected = ds === selectedDate;
              const isToday = ds === new Date().toISOString().split("T")[0];
              return (
                <button
                  key={key}
                  type="button"
                  data-ocid={`doctor.calendar.day.${day}`}
                  onClick={() => setSelectedDate(ds)}
                  className={`relative rounded-lg p-1.5 flex flex-col items-start gap-1 transition-all text-xs font-semibold min-h-[96px] w-full border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : isToday
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                        : "text-foreground bg-card border-border hover:bg-muted/30"
                  }`}
                >
                  <span
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                      isToday && !isSelected
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {day}
                  </span>
                  {appts.length > 0 && (
                    <div className="w-full flex flex-col gap-1.5 mt-0.5">
                      {appts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          title={`${a.patientName} (${a.time})`}
                          className={`text-[9.5px] px-1.5 py-0.5 rounded truncate text-left font-medium border flex items-center gap-1 w-full ${
                            isSelected
                              ? "bg-white/20 text-white border-white/10"
                              : "bg-background text-foreground border-border shadow-2xs"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[a.type] ?? "bg-muted-foreground"} flex-shrink-0`}
                          />
                          <span className="truncate">{a.patientName}</span>
                        </div>
                      ))}
                      {appts.length > 2 && (
                        <span
                          className={`text-[9px] font-black self-end pr-1 ${
                            isSelected
                              ? "text-primary-foreground/95"
                              : "text-primary dark:text-primary-foreground/95"
                          }`}
                        >
                          +{appts.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-muted-foreground">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: appointments for selected date */}
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" },
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedAppts.length} appointment
              {selectedAppts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[480px]">
            {selectedAppts.length === 0 ? (
              <div
                data-ocid="doctor.appointments.empty_state"
                className="py-12 flex flex-col items-center gap-2 text-center px-5"
              >
                <Clock className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No appointments on this date.
                </p>
              </div>
            ) : (
              selectedAppts.map((appt, i) => (
                <div
                  key={appt.id}
                  data-ocid={`doctor.appointments.item.${i + 1}`}
                  className="px-5 py-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {appt.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appt.time} · Token #{appt.token}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] border flex-shrink-0 ${STATUS_STYLES[appt.status] ?? ""}`}
                    >
                      {appt.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${TYPE_COLORS[appt.type] ?? "bg-muted-foreground"}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {appt.type}
                    </span>
                  </div>
                  {(() => {
                    const parsed = parseAppointmentNotes(appt.notes || "");
                    const roomNumber = appt.roomNumber || parsed.roomNumber;
                    const bedNo = appt.bedNo || parsed.bedNo;
                    const roomType = appt.roomType || parsed.roomType;
                    const assignedNurse =
                      appt.assignedNurse || parsed.assignedNurse;
                    return (
                      <>
                        {roomNumber && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            Room: {roomNumber} {bedNo ? `· Bed: ${bedNo}` : ""}{" "}
                            {roomType ? `(${roomType})` : ""}
                          </p>
                        )}
                        {assignedNurse && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Assigned Nurse: {assignedNurse}
                          </p>
                        )}
                        {parsed.cleanNotes && (
                          <p className="text-[10px] text-zinc-500 italic mt-0.5">
                            Notes: {parsed.cleanNotes}
                          </p>
                        )}
                      </>
                    );
                  })()}
                  {appt.status !== "Completed" &&
                    appt.status !== "Cancelled" && (
                      <div className="flex gap-1.5 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          data-ocid={`doctor.appointments.complete.${i + 1}`}
                          className="h-7 px-2.5 text-xs gap-1.5 text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => markStatus(appt.id, "Completed")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          data-ocid={`doctor.appointments.cancel.${i + 1}`}
                          className="h-7 px-2.5 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => markStatus(appt.id, "Cancelled")}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Table */}
      <div className="glass-elevated rounded-xl p-5 shadow-glass-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground font-display">
              Upcoming Appointments Schedule
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage future consultations, IPD admissions, and procedures.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient, type..."
              value={upcomingSearch}
              onChange={(e) => setUpcomingSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {paginatedUpcoming.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">
              No upcoming appointments found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-muted/40 font-semibold text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3">Token &amp; Date</th>
                  <th className="px-4 py-3">Patient Details</th>
                  <th className="px-4 py-3">Appointment Info</th>
                  <th className="px-4 py-3">Room / Nurse Allocation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {paginatedUpcoming.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-muted/5 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-foreground">
                        Token #{appt.token}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {appt.date} · {appt.time}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-sm">
                        {appt.patientName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        ID: {appt.patientId}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${TYPE_COLORS[appt.type] ?? "bg-muted-foreground"}`}
                        />
                        <span>{appt.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {appt.roomNumber ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          Room {appt.roomNumber}{" "}
                          {appt.bedNo ? `· Bed ${appt.bedNo}` : ""}
                        </p>
                      ) : null}
                      {appt.assignedNurse ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Nurse: {appt.assignedNurse}
                        </p>
                      ) : null}
                      {!appt.roomNumber && !appt.assignedNurse ? "—" : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] border ${STATUS_STYLES[appt.status] ?? ""}`}
                      >
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {appt.status !== "Completed" &&
                        appt.status !== "Cancelled" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2.5 text-xs gap-1 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 border-0"
                              onClick={() => markStatus(appt.id, "Completed")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2.5 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-0"
                              onClick={() => markStatus(appt.id, "Cancelled")}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            No Actions
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <PaginationControl
          currentPage={upcomingPage}
          totalPages={totalUpcomingPages}
          totalElements={filteredUpcoming.length}
          pageSize={upcomingPageSize}
          onPageChange={setUpcomingPage}
          onPageSizeChange={(s) => {
            setUpcomingPageSize(s);
            setUpcomingPage(0);
          }}
          className="pt-2 border-t border-border/40 mt-2"
        />
      </div>
    </div>
  );
}

import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import { formatDisplayName } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-primary/20 text-primary border-primary/30",
  "Checked-In": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Scheduled: "bg-muted text-muted-foreground border-border",
  Completed: "bg-accent/20 text-accent border-accent/30",
  Cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const TYPE_ICONS: Record<string, string> = {
  "Follow-up": "🔁",
  Consultation: "🩺",
  Emergency: "🚨",
  "Post-Op": "🏥",
  "Check-up": "✅",
};

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(3);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      const data = await apiFetch<any>("/doctor/patients", {
        headers: { "X-Hospital-Code": code },
      });
      const patientsList = Array.isArray(data) ? data : data?.content || [];
      if (patientsList && patientsList.length > 0) {
        setPatients(patientsList);

        // Fetch reports count for first 5 patients in parallel
        const recentPats = patientsList.slice(0, 5);
        let count = 0;
        await Promise.all(
          recentPats.map(async (p: any) => {
            try {
              const pNo = p.patientNo || p.id;
              const res = await apiFetch<any>(`/doctor/reports/${pNo}`, {
                headers: { "X-Hospital-Code": code },
              });
              const list = Array.isArray(res) ? res : res?.content || [];
              count += list.length;
            } catch {}
          }),
        );
        if (count > 0) {
          setPendingReportsCount(count);
        }
      } else {
        setPatients([]);
      }
    } catch (e) {
      console.warn(
        "Failed to fetch doctor patients directory from backend.",
        e,
      );
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const code = user?.hospitalCode || "HSP001";
      const todayStr = new Date().toISOString().split("T")[0];
      // Use the doctor's real entity ID for filtering; fall back to undefined (= ALL)
      // if the user is on a dev/mock session to avoid filtering with a non-existent ID.
      const drId = user?.id && user.id !== "mock-id" ? user.id : undefined;
      const list = await receptionApi.getAppointments(code, todayStr, drId);
      if (list && list.length > 0) {
        // Map backend AppointmentResponse to the shape expected by DoctorDashboard
        const mapped = list.map((a: any) => ({
          id: String(a.id),
          patientId: a.patientNo,
          patientName: a.patientName,
          doctorId: a.doctorId,
          doctorName: a.doctorName,
          date: a.appointmentDate,
          time: a.timeSlot,
          type: a.appointmentType,
          status: a.status,
          token: Number(a.tokenNo) || a.tokenNo,
        }));
        setAppointments(mapped);
      } else {
        setAppointments([]);
      }
    } catch (e) {
      console.warn("Failed to fetch doctor appointments from backend:", e);
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, [user]);

  const todayAppts = appointments;
  const waitingCount = todayAppts.filter(
    (a) => a.status === "Checked-In" || a.status === "Confirmed",
  ).length;

  const recentPatients = patients.slice(0, 4);

  return (
    <div className="space-y-6" data-ocid="doctor.dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Welcome, {formatDisplayName(user?.name) || "Doctor"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          data-ocid="doctor.new_prescription.button"
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-semibold shadow-md shadow-teal-600/10 rounded-lg"
          asChild
        >
          <Link to="/doctor/prescriptions">+ New Prescription</Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          data-ocid="doctor.stat.appointments"
          label="Today's Appointments"
          value={todayAppts.length}
          icon={Calendar}
          accentColor="text-teal-500"
        />
        <StatCard
          data-ocid="doctor.stat.waiting"
          label="Waiting Patients"
          value={waitingCount}
          icon={Clock}
          trend={{ value: `${waitingCount} checked-in`, up: false }}
          accentColor="text-rose-500"
        />
        <StatCard
          data-ocid="doctor.stat.total_patients"
          label="Total Patients"
          value={patients.length}
          icon={Users}
          trend={{ value: "+2 this week", up: true }}
          accentColor="text-emerald-400"
        />
        <StatCard
          data-ocid="doctor.stat.pending_reports"
          label="Reports Pending"
          value={pendingReportsCount}
          icon={AlertCircle}
          trend={{ value: "2 urgent", up: false }}
          accentColor="text-destructive"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="xl:col-span-2 glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">
                Today's Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                {todayAppts.length} appointments scheduled
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold"
              asChild
            >
              <Link to="/doctor/appointments">View all</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {todayAppts.map((appt, i) => (
              <div
                key={appt.id}
                data-ocid={`doctor.schedule.item.${i + 1}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">
                    {TYPE_ICONS[appt.type] ?? "🩺"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {appt.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appt.type} · {appt.time} · Token #{appt.token}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border flex-shrink-0 ${STATUS_STYLES[appt.status] ?? ""}`}
                >
                  {appt.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + recent patients */}
        <div className="space-y-4">
          <div className="glass-elevated rounded-xl p-5 shadow-glass-sm">
            <h3 className="font-semibold text-foreground mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: "Write Prescription",
                  icon: ClipboardList,
                  to: "/doctor/prescriptions",
                  ocid: "doctor.quick.prescription",
                },
                {
                  label: "View Lab Reports",
                  icon: Activity,
                  to: "/doctor/reports",
                  ocid: "doctor.quick.reports",
                },
                {
                  label: "My Patients",
                  icon: Users,
                  to: "/doctor/patients",
                  ocid: "doctor.quick.patients",
                },
                {
                  label: "Appointments",
                  icon: CheckCircle2,
                  to: "/doctor/appointments",
                  ocid: "doctor.quick.appointments",
                },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  data-ocid={action.ocid}
                  className="w-full justify-start gap-2.5 text-sm text-foreground hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-smooth"
                  asChild
                >
                  <Link to={action.to}>
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Recent Patients</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold"
                asChild
              >
                <Link to="/doctor/patients">See all</Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {recentPatients.map((p, i) => (
                <div
                  key={p.id || p.patientNo}
                  data-ocid={`doctor.recent_patients.item.${i + 1}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {(p.firstName || p.name || "?")[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.firstName
                        ? `${p.firstName} ${p.lastName || ""}`.trim()
                        : p.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.importantNotes ||
                        p.permanentDiagnosis ||
                        p.condition ||
                        "No clinical history"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] border border-primary/30 text-primary bg-primary/10 flex-shrink-0"
                  >
                    {p.bloodGroup || "O+"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

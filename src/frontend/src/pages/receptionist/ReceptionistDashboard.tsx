import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { receptionApi } from "@/lib/reception-api";
import type {
  AppointmentResponse,
  BillResponse,
  PatientResponse,
} from "@/lib/reception-types";
import {
  formatDisplayName,
  formatTimeSlot,
  getLocalDateString,
} from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  BedDouble as BedIcon,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  ListOrdered,
  Receipt,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Confirmed: "bg-primary/20 text-primary border-primary/30",
  "Checked-In": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Scheduled: "bg-muted text-muted-foreground border-border",
  Completed: "bg-accent/20 text-accent border-accent/30",
  Cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const today = getLocalDateString();

export default function ReceptionistDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // ── data ──
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // local status overrides (optimistic UI)
  const [apptStatuses, setApptStatuses] = useState<Record<number, string>>({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, billList, patList] = await Promise.all([
        receptionApi.getAppointments(code, today),
        receptionApi.getBills(code, "ALL", today, today),
        receptionApi.getPatients(code),
      ]);
      setAppointments(Array.isArray(appts) ? appts : []);
      setBills(Array.isArray(billList) ? billList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      // seed local status map
      setApptStatuses(Object.fromEntries(appts.map((a) => [a.id, a.status])));
    } catch {
      // silently degrade — the individual stats will show 0
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── derived ──
  const todayAppts = appointments;
  const waiting = todayAppts.filter((a) => {
    const s = apptStatuses[a.id] ?? a.status;
    return s === "Checked-In" || s === "Scheduled";
  });
  const registeredToday = patients.filter((p) =>
    p.createdAt?.startsWith(today),
  );
  const revenueToday = bills.reduce((s, b) => s + (b.paidAmount ?? 0), 0);

  async function handleCheckIn(id: number, name: string) {
    try {
      await receptionApi.updateAppointmentStatus(id, "Checked-In", code);
      setApptStatuses((prev) => ({ ...prev, [id]: "Checked-In" }));
      toast.success(`${name} checked in successfully`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleCancel(id: number, name: string) {
    try {
      await receptionApi.updateAppointmentStatus(id, "Cancelled", code);
      setApptStatuses((prev) => ({ ...prev, [id]: "Cancelled" }));
      toast.error(`Appointment for ${name} cancelled`);
    } catch {
      toast.error("Failed to cancel appointment");
    }
  }

  return (
    <div className="space-y-6" data-ocid="receptionist.dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Welcome, {formatDisplayName(user?.name) || "Receptionist"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Front desk operations —{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            data-ocid="receptionist.header.register_button"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
            onClick={() => navigate({ to: "/receptionist/register" })}
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          data-ocid="receptionist.stat.registered_today"
          label="Registered Today"
          value={loading ? "—" : registeredToday.length}
          icon={UserPlus}
          trend={{ value: `${patients.length} total`, up: true }}
          accentColor="text-primary"
        />
        <StatCard
          data-ocid="receptionist.stat.appointments_today"
          label="Appointments Today"
          value={loading ? "—" : todayAppts.length}
          icon={Calendar}
          accentColor="text-accent"
        />
        <StatCard
          data-ocid="receptionist.stat.in_queue"
          label="Patients in Queue"
          value={loading ? "—" : waiting.length}
          icon={ListOrdered}
          accentColor="text-emerald-400"
        />
        <StatCard
          data-ocid="receptionist.stat.revenue_today"
          label="Revenue Today"
          value={
            loading
              ? "—"
              : revenueToday > 0
                ? `₹${revenueToday.toLocaleString()}`
                : "₹0"
          }
          icon={IndianRupee}
          accentColor="text-primary"
        />
      </div>

      {/* Today's Appointments */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">
              Today's Appointments
            </h3>
            <p className="text-xs text-muted-foreground">
              {todayAppts.length} scheduled — {waiting.length} in queue
            </p>
          </div>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              Loading appointments…
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              No appointments today
            </div>
          ) : (
            todayAppts.slice(0, 8).map((appt, i) => {
              const status = apptStatuses[appt.id] ?? appt.status;
              const isActive = status !== "Cancelled" && status !== "Completed";
              const isEmergency =
                appt.appointmentType?.toLowerCase() === "emergency";
              return (
                <div
                  key={appt.id}
                  data-ocid={`receptionist.appt.item.${i + 1}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors ${
                    isEmergency ? "border-l-2 border-l-destructive" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isEmergency ? "bg-destructive/20" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isEmergency ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      #{appt.tokenNo}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {appt.patientName}
                      </p>
                      {isEmergency && (
                        <Badge
                          className="text-xs bg-destructive/20 text-destructive border-destructive/30 border"
                          variant="outline"
                        >
                          URGENT
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {appt.doctorName} — {formatTimeSlot(appt.timeSlot)} —{" "}
                      {appt.appointmentType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs border ${STATUS_STYLES[status] ?? ""}`}
                    >
                      {status}
                    </Badge>
                    {isActive && (
                      <>
                        <button
                          type="button"
                          data-ocid={`receptionist.appt.checkin.${i + 1}`}
                          title="Check In"
                          onClick={() =>
                            handleCheckIn(appt.id, appt.patientName)
                          }
                          className="text-muted-foreground hover:text-emerald-400 transition-smooth"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`receptionist.appt.cancel.${i + 1}`}
                          title="Cancel"
                          onClick={() =>
                            handleCancel(appt.id, appt.patientName)
                          }
                          className="text-muted-foreground hover:text-destructive transition-smooth"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Billing Summary */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Billing Summary</h3>
            <p className="text-xs text-muted-foreground">
              Today's billing records
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            data-ocid="receptionist.billing.generate_button"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs"
            onClick={() => navigate({ to: "/receptionist/billing" })}
          >
            <Receipt className="w-3.5 h-3.5 mr-1" />
            Generate Invoice
          </Button>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : bills.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              No bills today
            </div>
          ) : (
            bills.slice(0, 4).map((bill, i) => {
              const isPaid = bill.dueAmount === 0;
              const isPartial = bill.paidAmount > 0 && bill.dueAmount > 0;
              return (
                <div
                  key={bill.id}
                  data-ocid={`receptionist.billing.item.${i + 1}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {bill.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bill.billDate} · {bill.billType} · {bill.billNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-foreground">
                      ₹{bill.netAmount.toLocaleString()}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs border ${
                        isPaid
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : isPartial
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-accent/20 text-accent border-accent/30"
                      }`}
                    >
                      {isPaid ? "Paid" : isPartial ? "Partial" : "Pending"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

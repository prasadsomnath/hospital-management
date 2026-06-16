import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck,
  IndianRupee,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground border-border",
};

export default function Analytics() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetch<any>("/super-admin/hospitals");
        setHospitals(res.content || []);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load platform analytics");
      } finally {
        setIsLoading(false);
      }
    };
    loadHospitals();
  }, []);

  // Map breakdown directly from real database metrics returned from the backend
  const getDynamicHospitalBreakdown = () => {
    return hospitals.map((h) => {
      const patients =
        h.patientCount !== undefined && h.patientCount !== null
          ? h.patientCount
          : 0;
      const appointments =
        h.appointmentCount !== undefined && h.appointmentCount !== null
          ? h.appointmentCount
          : 0;
      const revenueVal =
        h.revenue !== undefined && h.revenue !== null ? h.revenue : 0.0;

      return {
        id: h.id.toString(),
        name: h.hospitalName,
        code: h.hospitalCode,
        city: h.address
          ? h.address.split(",").slice(-2).join(",").trim()
          : "Primary Site",
        patients,
        appointments,
        revenue: `₹${revenueVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        revenueRaw: revenueVal,
        status: h.status || "ACTIVE",
      };
    });
  };

  const dynamicBreakdown = getDynamicHospitalBreakdown();

  // Sum up totals dynamically from the live breakdown
  const totalPatients = dynamicBreakdown.reduce(
    (sum, h) => sum + h.patients,
    0,
  );
  const totalAppointments = dynamicBreakdown.reduce(
    (sum, h) => sum + h.appointments,
    0,
  );
  const totalRevenueVal = dynamicBreakdown.reduce(
    (sum, h) => sum + h.revenueRaw,
    0,
  );
  const activeHospitalsCount = hospitals.filter(
    (h) => h.status === "ACTIVE",
  ).length;

  // Use real doctor and staff aggregates returned from the database
  const totalDoctors = hospitals.reduce(
    (sum, h) => sum + (h.doctorCount || 0),
    0,
  );
  const totalStaff = hospitals.reduce((sum, h) => sum + (h.staffCount || 0), 0);

  const platformStats = [
    {
      label: "Total Patients",
      value: totalPatients.toLocaleString(),
      sub: "Aggregated across active tenants",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Revenue",
      value:
        totalRevenueVal >= 1000000
          ? `₹${(totalRevenueVal / 1000000).toFixed(2)}M`
          : `₹${totalRevenueVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "Aggregated billing systems",
      icon: IndianRupee,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Appointments",
      value: totalAppointments.toLocaleString(),
      sub: "Live booking integrations",
      icon: CalendarCheck,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Active Hospitals",
      value: activeHospitalsCount.toString(),
      sub: `${hospitals.length - activeHospitalsCount} currently suspended`,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Doctors",
      value: Math.round(totalDoctors).toLocaleString(),
      sub: "Across all departments",
      icon: Stethoscope,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Active Staff",
      value: Math.round(totalStaff).toLocaleString(),
      sub: "Receptionists, nurses, lab techs",
      icon: UserCheck,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold text-foreground font-display">
              Cross-Hospital Analytics
            </h1>
          </div>
          <p className="text-muted-foreground">
            Aggregated performance metrics across all registered hospitals
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400"
        >
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          Live Platform Feed
        </Badge>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Card key={idx} className="border-border animate-pulse">
              <CardContent className="p-5 h-[120px] bg-muted/20 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : (
        <div
          data-ocid="super-admin.analytics.stats"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {platformStats.map((stat, i) => (
            <Card
              key={stat.label}
              data-ocid={`super-admin.analytics.item.${i + 1}`}
              className="border-border hover:shadow-elevated transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground font-display">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-hospital breakdown table */}
      <Card
        data-ocid="super-admin.analytics.breakdown.card"
        className="border-border"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Per-Hospital Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-10 bg-muted/20 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : dynamicBreakdown.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No hospitals registered. Register one to see analytics breakdown.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Hospital
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Patients
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Appointments
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Revenue
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dynamicBreakdown.map((h, i) => (
                    <tr
                      key={h.id}
                      data-ocid={`super-admin.analytics.breakdown.item.${i + 1}`}
                      className="hover:bg-muted/30 transition-smooth"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {h.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {h.code} · {h.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-foreground">
                        {h.patients.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-foreground">
                        {h.appointments.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {h.revenue}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${STATUS_COLORS[h.status] || STATUS_COLORS.ACTIVE}`}
                        >
                          {h.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

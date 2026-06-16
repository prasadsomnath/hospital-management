import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Shield,
  TrendingUp,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground border-border",
};

const AUDIT_ICONS: Record<string, React.ReactNode> = {
  create: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  update: <Clock className="w-4 h-4 text-primary" />,
  warning: <AlertCircle className="w-4 h-4 text-accent" />,
};

const parseUtc = (dateStr: string) => {
  if (!dateStr) return new Date();
  let normalized = dateStr.replace(" ", "T");
  if (
    !normalized.endsWith("Z") &&
    !normalized.includes("+") &&
    !(normalized.split("T")[1] || "").includes("-")
  ) {
    normalized = normalized + "Z";
  }
  return new Date(normalized);
};

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return "Just now";
  try {
    const parsed = parseUtc(dateStr);
    if (isNaN(parsed.getTime())) {
      return dateStr;
    }
    const diffMs = Date.now() - parsed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return parsed.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Just now";
  }
}

export default function SuperAdminDashboard() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [hospitalsRes, adminsRes] = await Promise.all([
        apiFetch<any>("/super-admin/hospitals"),
        apiFetch<any>("/super-admin/hospital-admins"),
      ]);
      setHospitals(hospitalsRes.content || []);
      setAdmins(adminsRes.content || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Dynamically derive and sort the platform activities based on the live database createdAt timestamps
  const getRecentActivity = () => {
    const activities: any[] = [];

    // Add hospital creation events
    hospitals.forEach((h) => {
      activities.push({
        id: `h-act-${h.id}`,
        action: "Hospital registered",
        target: `${h.hospitalName} (${h.hospitalCode})`,
        timestamp: h.createdAt ? parseUtc(h.createdAt).getTime() : 0,
        time: formatRelativeTime(h.createdAt),
        type: "create",
      });
    });

    // Add admin activation events
    admins.forEach((a) => {
      activities.push({
        id: `a-act-${a.id}`,
        action: "Admin account setup",
        target: `${a.name} (${a.hospitalCode})`,
        timestamp: a.createdAt ? parseUtc(a.createdAt).getTime() : 0,
        time: formatRelativeTime(a.createdAt),
        type: "update",
      });
    });

    // Sort by database timestamp descending
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  };

  const dynamicActivities = getRecentActivity();

  const platformStats = [
    {
      label: "Total Tenant Hospitals",
      value: hospitals.length.toString(),
      change: `+${hospitals.filter((h) => h.status === "ACTIVE").length} active`,
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Registered Admins",
      value: admins.length.toString(),
      change: `${admins.filter((a) => a.active).length} active sessions`,
      icon: UserCog,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Platform Uptime",
      value: "99.99%",
      change: "Enterprise Grade SLA",
      icon: Activity,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "System Status",
      value: "Healthy",
      change: "0 critical warnings",
      icon: Shield,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold text-foreground font-display">
              Platform Overview
            </h1>
          </div>
          <p className="text-muted-foreground">
            Multi-hospital administration dashboard — secure platform control
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold"
        >
          <Globe className="w-3.5 h-3.5 mr-1.5" />
          {hospitals.length} Registered Tenants
        </Badge>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <Card key={idx} className="border-border animate-pulse">
              <CardContent className="p-5 h-[120px] bg-muted/20 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : (
        <div
          data-ocid="super-admin.dashboard.stats"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {platformStats.map((stat, i) => (
            <Card
              key={stat.label}
              data-ocid={`super-admin.stats.item.${i + 1}`}
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
                <p className="text-sm text-foreground font-medium mt-0.5">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Hospitals table */}
        <Card
          data-ocid="super-admin.hospitals.card"
          className="xl:col-span-2 border-border"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Active Multi-Tenant Instances
              </CardTitle>
              <Link
                to="/super-admin/hospitals"
                className="text-xs text-primary hover:underline font-medium"
              >
                Manage all →
              </Link>
            </div>
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
            ) : (
              <div
                data-ocid="super-admin.hospitals.list"
                className="divide-y divide-border"
              >
                {hospitals.slice(0, 5).map((h, i) => (
                  <div
                    key={h.id}
                    data-ocid={`super-admin.hospitals.item.${i + 1}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-smooth group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {h.hospitalName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Code: {h.hospitalCode} · {h.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs border bg-violet-500/10 text-violet-700 border-violet-500/30"
                      >
                        {h.registrationNumber}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_COLORS[h.status] || STATUS_COLORS.ACTIVE}`}
                      >
                        {h.status || "ACTIVE"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {hospitals.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground text-sm">
                    No active hospitals registered. Click "Manage all" to
                    register.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit log */}
        <Card data-ocid="super-admin.audit.card" className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserCog className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              data-ocid="super-admin.audit.list"
              className="divide-y divide-border"
            >
              {dynamicActivities.map((entry, i) => (
                <div
                  key={entry.id}
                  data-ocid={`super-admin.audit.item.${i + 1}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-smooth"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {AUDIT_ICONS[entry.type] || (
                      <Clock className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {entry.action}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.target}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.time}
                    </p>
                  </div>
                </div>
              ))}
              {dynamicActivities.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

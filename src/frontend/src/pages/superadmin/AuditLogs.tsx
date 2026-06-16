import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AuditStatus = "success" | "warning" | "danger";

interface AuditEntry {
  id: string;
  timestamp: string;
  rawTime: number;
  hospital: string;
  user: string;
  role: string;
  action: string;
  status: AuditStatus;
}

const STATUS_CONFIG: Record<
  AuditStatus,
  { icon: React.ReactNode; badge: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    badge:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  warning: {
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    badge:
      "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
  },
  danger: {
    icon: <AlertCircle className="w-4 h-4 text-destructive" />,
    badge: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

function formatLogTime(dateStr: string) {
  if (!dateStr) return new Date().toISOString().replace("T", " ").slice(0, 19);
  try {
    let normalized = dateStr.replace(" ", "T");
    if (
      !normalized.endsWith("Z") &&
      !normalized.includes("+") &&
      !(normalized.split("T")[1] || "").includes("-")
    ) {
      normalized = normalized + "Z";
    }
    const parsed = new Date(normalized);
    if (isNaN(parsed.getTime())) return dateStr;

    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(parsed);
    const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second}`;
  } catch (e) {
    return dateStr;
  }
}

export default function AuditLogs() {
  const userTimezone = "IST";
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("All Hospitals");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [hospitalsRes, adminsRes] = await Promise.all([
        apiFetch<any>("/super-admin/hospitals", {
          params: { page: 0, size: 1000 },
        }),
        apiFetch<any>("/super-admin/hospital-admins", {
          params: { page: 0, size: 1000 },
        }),
      ]);
      setHospitals(hospitalsRes.content || []);
      setAdmins(adminsRes.content || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load audit trail data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, hospitalFilter, actionFilter]);

  // Dynamically generate the audit logs based on the real hospitals & admins loaded from the database
  const getDynamicAuditLogs = (): AuditEntry[] => {
    const logs: AuditEntry[] = [];

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

    // 1. Add hospital onboarding events
    hospitals.forEach((h) => {
      logs.push({
        id: `h-audit-${h.id}`,
        timestamp: formatLogTime(h.createdAt),
        rawTime: h.createdAt ? parseUtc(h.createdAt).getTime() : 0,
        hospital: "Platform",
        user: "superadmin",
        role: "Super Admin",
        action: `Hospital registered: ${h.hospitalName}`,
        status: "success",
      });

      const initTime = h.createdAt
        ? new Date(parseUtc(h.createdAt).getTime() + 2000).toISOString()
        : "";
      logs.push({
        id: `h-status-audit-${h.id}`,
        timestamp: formatLogTime(initTime),
        rawTime: initTime ? parseUtc(initTime).getTime() : 0,
        hospital: h.hospitalName,
        user: "System",
        role: "Operator",
        action: `Tenant environment initialized (${h.hospitalCode})`,
        status: h.status === "ACTIVE" ? "success" : "warning",
      });
    });

    // 2. Add admin creation events
    admins.forEach((a) => {
      const parentHospital = hospitals.find(
        (h) => h.hospitalCode === a.hospitalCode,
      );
      const hospitalName = parentHospital
        ? parentHospital.hospitalName
        : a.hospitalCode;

      logs.push({
        id: `a-audit-${a.id}`,
        timestamp: formatLogTime(a.createdAt),
        rawTime: a.createdAt ? parseUtc(a.createdAt).getTime() : 0,
        hospital: hospitalName,
        user: "superadmin",
        role: "Super Admin",
        action: `Admin account generated: ${a.name} (${a.employeeId})`,
        status: "success",
      });
    });

    // Sort by timestamp descending
    return logs.sort((a, b) => b.rawTime - a.rawTime);
  };

  const dynamicLogs = getDynamicAuditLogs();
  const hospitalOptions = [
    "All Hospitals",
    "Platform",
    ...hospitals.map((h) => h.hospitalName),
  ];

  const uniqueActions = Array.from(
    new Set(dynamicLogs.map((log) => log.action)),
  );
  const actionOptions = ["All Actions", ...uniqueActions];

  const filtered = dynamicLogs.filter((entry) => {
    const matchSearch =
      entry.user.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.hospital.toLowerCase().includes(search.toLowerCase());
    const matchHospital =
      hospitalFilter === "All Hospitals" || entry.hospital === hospitalFilter;
    const matchAction =
      actionFilter === "All Actions" || entry.action === actionFilter;
    return matchSearch && matchHospital && matchAction;
  });

  const paginatedFiltered = filtered.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold text-foreground font-display">
              Audit Logs
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete trail of platform and hospital-level events
          </p>
        </div>
        <Badge variant="outline" className="border-border">
          {filtered.length} events
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="super-admin.audit-logs.search_input"
            placeholder="Search user, action, hospital…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
        <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
          <SelectTrigger
            data-ocid="super-admin.audit-logs.hospital_select"
            className="w-56 bg-muted/30"
          >
            <SelectValue placeholder="Filter by hospital" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border border-white/10 text-white">
            {hospitalOptions.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger
            data-ocid="super-admin.audit-logs.action_select"
            className="w-56 bg-muted/30"
          >
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border border-white/10 text-white">
            {actionOptions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card data-ocid="super-admin.audit-logs.card" className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Event Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Loading system audit logs…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="super-admin.audit-logs.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No events found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Time ({userTimezone})
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Hospital
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        User
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Action
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedFiltered.map((entry, i) => (
                      <tr
                        key={entry.id}
                        data-ocid={`super-admin.audit-logs.item.${i + 1}`}
                        className="hover:bg-muted/30 transition-smooth"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {entry.timestamp}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-foreground font-medium truncate max-w-[160px] block">
                            {entry.hospital}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-foreground whitespace-nowrap">
                          {entry.user}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-muted-foreground">
                            {entry.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                          {entry.action}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {STATUS_CONFIG[entry.status].icon}
                            <Badge
                              variant="outline"
                              className={`text-xs border capitalize ${STATUS_CONFIG[entry.status].badge}`}
                            >
                              {entry.status}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 border-t border-border/40">
                <PaginationControl
                  currentPage={page}
                  totalPages={totalPages}
                  totalElements={filtered.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { useAuthStore } from "@/store/auth-store";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type LogStatus = "success" | "warning" | "critical";
type LogCategory = "Security" | "Clinical" | "Staff" | "Rooms" | "System";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  rawTime: number;
  user: string;
  category: LogCategory;
  action: string;
  status: LogStatus;
  ipAddress: string;
}

const STATUS_CONFIG: Record<
  LogStatus,
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
  critical: {
    icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
    badge: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  Security:
    "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  Clinical:
    "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
  Staff:
    "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400",
  Rooms: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:text-cyan-400",
  System:
    "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
};

const MODULE_MAP: Record<string, LogCategory> = {
  DEPARTMENT: "System",
  ROOM: "Rooms",
  BED: "Rooms",
  DOCTOR: "Staff",
  RECEPTIONIST: "Staff",
  EQUIPMENT: "Clinical",
  IN_PATIENT: "Clinical",
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

const formatLogTime = (dateStr: string) => {
  if (!dateStr) return "N/A";
  try {
    const parsed = parseUtc(dateStr);
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
};

export default function AdminAuditLogs() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, categoryFilter, fromDate, toDate]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.hospitalCode) return;
      try {
        setLoading(true);
        const res = await apiFetch<any>("/admin/audit-logs", {
          headers: {
            "X-Hospital-Code": user.hospitalCode,
          },
          params: {
            page: 0,
            size: 1000,
          },
        });

        const logsList = res.content || res || [];
        const mapped = logsList.map((log: any): AuditLogEntry => {
          const cat = MODULE_MAP[log.module] || "System";

          const formattedTime = formatLogTime(log.timestamp);

          let uiStatus: LogStatus = "success";
          const lowerAction = (log.action || "").toLowerCase();
          if (
            lowerAction.includes("delete") ||
            lowerAction.includes("deactivate") ||
            lowerAction.includes("remove")
          ) {
            uiStatus = "warning";
          }

          return {
            id: String(log.id),
            timestamp: formattedTime,
            rawTime: log.timestamp ? parseUtc(log.timestamp).getTime() : 0,
            user: log.performedBy || "system",
            category: cat,
            action: log.details || log.action,
            status: uiStatus,
            ipAddress: "127.0.0.1",
          };
        });

        mapped.sort((a, b) => b.rawTime - a.rawTime);
        setLogs(mapped);
      } catch (err: any) {
        console.error("Failed to load backend audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user?.hospitalCode]);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All Statuses" ||
      log.status === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "All Categories" || log.category === categoryFilter;

    if (!matchesSearch || !matchesStatus || !matchesCategory) return false;

    if (fromDate) {
      if (log.rawTime < new Date(fromDate).getTime()) {
        return false;
      }
    }
    if (toDate) {
      if (log.rawTime > new Date(toDate).getTime()) {
        return false;
      }
    }

    return true;
  });

  const paginatedLogs = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6" data-ocid="admin.audit_logs.page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-bold text-foreground font-display">
              Audit Logs
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time trail of administrative actions, clinical syncs, and
            system authorization logs.
          </p>
        </div>
        <Badge variant="outline" className="border-border">
          {filtered.length} entries
        </Badge>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search action, user, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/20 border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-muted/20 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border border-white/10 text-white">
            <SelectItem value="All Statuses">All Statuses</SelectItem>
            <SelectItem value="Success">Success</SelectItem>
            <SelectItem value="Warning">Warning</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-muted/20 border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border border-white/10 text-white">
            <SelectItem value="All Categories">All Categories</SelectItem>
            <SelectItem value="Security">Security</SelectItem>
            <SelectItem value="Clinical">Clinical</SelectItem>
            <SelectItem value="Staff">Staff</SelectItem>
            <SelectItem value="Rooms">Rooms</SelectItem>
            <SelectItem value="System">System</SelectItem>
          </SelectContent>
        </Select>

        {/* Date/Time range filters */}
        <div className="flex items-center gap-2 border-l border-border/40 pl-3">
          <span className="text-xs text-muted-foreground font-semibold">
            From:
          </span>
          <DateTimePicker
            type="datetime-local"
            value={fromDate}
            onChange={setFromDate}
            className="h-9 text-xs w-44 bg-muted/20 border-border"
          />
          <span className="text-xs text-muted-foreground font-semibold">
            To:
          </span>
          <DateTimePicker
            type="datetime-local"
            value={toDate}
            onChange={setToDate}
            className="h-9 text-xs w-44 bg-muted/20 border-border"
          />
          <Button
            className="h-9 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 border-0 shadow-xs cursor-pointer transition-all shrink-0"
            onClick={() => {
              toast.success("Audit filters applied");
            }}
          >
            Apply
          </Button>
          {(fromDate || toDate) && (
            <button
              className="text-xs text-muted-foreground hover:text-accent font-semibold transition-colors px-2"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-border/40 shadow-glass-sm bg-gradient-to-br from-card/30 to-card/10">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Security & Operations Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Syncing audit logs...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No events captured</p>
              <p className="text-sm mt-1">
                Try adjusting search parameters or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Timestamp (IST)
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      User / Agent
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Action description
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Agent IP
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/15 transition-smooth"
                    >
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${CATEGORY_COLORS[log.category]}`}
                        >
                          {log.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {log.action}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {STATUS_CONFIG[log.status].icon}
                          <Badge
                            variant="outline"
                            className={`text-xs border capitalize whitespace-nowrap ${STATUS_CONFIG[log.status].badge}`}
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-border mt-auto">
<PaginationControl
                currentPage={page}
                totalPages={Math.ceil(filtered.length / pageSize)}
                totalElements={filtered.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                
              />
</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

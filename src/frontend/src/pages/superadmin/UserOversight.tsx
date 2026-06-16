import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import { apiFetch } from "@/lib/api";
import { AlertCircle, Search, Shield, UserX, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PlatformUser {
  id: string;
  employeeId: string;
  name: string;
  hospital: string;
  role: string;
  email: string;
  status: "Active" | "Suspended";
}

const STATUS_COLORS: Record<string, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  Suspended: "bg-destructive/10 text-destructive border-destructive/30",
};

const ROLE_COLORS: Record<string, string> = {
  Admin:
    "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400",
};

export default function UserOversight() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const [adminsRes, hospitalsRes] = await Promise.all([
        apiFetch<any>("/super-admin/hospital-admins", {
          params: { page: 0, size: 1000 },
        }),
        apiFetch<any>("/super-admin/hospitals", {
          params: { page: 0, size: 1000 },
        }),
      ]);
      const admins = adminsRes.content || [];
      const hospitals = hospitalsRes.content || [];

      const mappedUsers = admins.map((a: any): PlatformUser => {
        const parentHospital = hospitals.find(
          (h: any) => h.hospitalCode === a.hospitalCode,
        );
        return {
          id: a.id.toString(),
          employeeId: a.employeeId,
          name: a.name,
          hospital: parentHospital
            ? parentHospital.hospitalName
            : a.hospitalCode,
          role: "Admin",
          email: a.email,
          status: a.active ? "Active" : "Suspended",
        };
      });

      setUsers(mappedUsers);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load platform users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.hospital.toLowerCase().includes(search.toLowerCase()),
  );

  const paginatedFiltered = filtered.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );
  const totalPages = Math.ceil(filtered.length / pageSize);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginatedFiltered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedFiltered.map((u) => u.id)));
    }
  };

  const handleBulkSuspend = async () => {
    if (selected.size === 0) return;
    try {
      const selectedUsers = users.filter((u) => selected.has(u.id));
      await Promise.all(
        selectedUsers.map((u) =>
          apiFetch(`/super-admin/hospital-admins/emp/${u.employeeId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
          }),
        ),
      );
      toast.warning(`${selected.size} user(s) suspended`, {
        description:
          "Their access has been successfully revoked on the backend.",
      });
      setSelected(new Set());
      loadUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to suspend selected users");
    }
  };

  const handleBulkActivate = async () => {
    if (selected.size === 0) return;
    try {
      const selectedUsers = users.filter((u) => selected.has(u.id));
      await Promise.all(
        selectedUsers.map((u) =>
          apiFetch(`/super-admin/hospital-admins/emp/${u.employeeId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
          }),
        ),
      );
      toast.success(`${selected.size} user(s) activated`, {
        description:
          "Their access has been successfully restored on the backend.",
      });
      setSelected(new Set());
      loadUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to activate selected users");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold text-foreground font-display">
              User Oversight
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage and monitor all users across every hospital
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="super-admin.user-oversight.bulk_activate_button"
              onClick={handleBulkActivate}
              className="gap-2 border-emerald-500/30 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <Users className="w-4 h-4 text-emerald-500" />
              Revoke Suspension
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="super-admin.user-oversight.bulk_suspend_button"
              onClick={handleBulkSuspend}
              className="gap-2"
            >
              <UserX className="w-4 h-4" />
              Suspend Selected
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="super-admin.user-oversight.search_input"
          placeholder="Search by name, email or hospital…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/30"
        />
      </div>

      {/* Table */}
      <Card
        data-ocid="super-admin.user-oversight.card"
        className="border-border"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              All Platform Users
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {filtered.length} users
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Loading platform user directory…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="super-admin.user-oversight.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 w-10">
                        <Checkbox
                          data-ocid="super-admin.user-oversight.select_all_checkbox"
                          checked={
                            selected.size === paginatedFiltered.length &&
                            paginatedFiltered.length > 0
                          }
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Hospital
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Email
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedFiltered.map((user, i) => (
                      <tr
                        key={user.id}
                        data-ocid={`super-admin.user-oversight.item.${i + 1}`}
                        className="hover:bg-muted/30 transition-smooth"
                      >
                        <td className="px-6 py-3.5">
                          <Checkbox
                            data-ocid={`super-admin.user-oversight.checkbox.${i + 1}`}
                            checked={selected.has(user.id)}
                            onCheckedChange={() => toggleSelect(user.id)}
                            aria-label={`Select ${user.name}`}
                          />
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <span className="font-medium text-foreground whitespace-nowrap">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs max-w-[180px] truncate">
                          {user.hospital}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${ROLE_COLORS[user.role] ?? "bg-muted text-muted-foreground border-border"}`}
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {user.status === "Suspended" && (
                              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs border ${STATUS_COLORS[user.status]}`}
                            >
                              {user.status}
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

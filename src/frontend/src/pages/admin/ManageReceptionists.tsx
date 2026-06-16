import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
const MOCK_RECEPTIONISTS: any[] = [];
import type { Receptionist } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  Edit2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserCog,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "On Leave": "bg-accent/20 text-accent border-accent/30",
  Inactive: "bg-muted text-muted-foreground border-border",
};

const SHIFT_STYLES: Record<string, string> = {
  Morning: "bg-primary/20 text-primary border-primary/30",
  Afternoon: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Evening: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Night: "bg-muted text-muted-foreground border-border",
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  shift: string;
  assignedCounter: string;
  password?: string;
};
const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  shift: "",
  assignedCounter: "",
  password: "",
};

const formatTimeAMPM = (timeStr: string): string => {
  if (!timeStr) return "";
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = Number.parseInt(hoursStr, 10);
  const minutes = Number.parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(displayHours)}:${pad(minutes)} ${ampm}`;
};

export default function ManageReceptionists() {
  const { user } = useAuthStore();
  const [recs, setRecs] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState({
    morning: { start: "07:00", end: "15:00" },
    afternoon: { start: "15:00", end: "23:00" },
    evening: { start: "17:00", end: "23:00" },
    night: { start: "23:00", end: "07:00" },
  });

  useEffect(() => {
    if (!user?.hospitalCode) return;
    const loadSettings = async () => {
      const savedData = localStorage.getItem(
        `hospital-settings-${user.hospitalCode}`,
      );
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setShifts({
            morning: {
              start: parsed.morningShiftStart || "07:00",
              end: parsed.morningShiftEnd || "15:00",
            },
            afternoon: {
              start: parsed.afternoonShiftStart || "15:00",
              end: parsed.afternoonShiftEnd || "23:00",
            },
            evening: {
              start: parsed.eveningShiftStart || "17:00",
              end: parsed.eveningShiftEnd || "23:00",
            },
            night: {
              start: parsed.nightShiftStart || "23:00",
              end: parsed.nightShiftEnd || "07:00",
            },
          });
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      } else {
        try {
          const res = await apiFetch<any>(
            `/super-admin/hospitals/code/${user.hospitalCode}`,
          );
          if (res) {
            setShifts({
              morning: {
                start: res.morningShiftStart || "07:00",
                end: res.morningShiftEnd || "15:00",
              },
              afternoon: {
                start: res.afternoonShiftStart || "15:00",
                end: res.afternoonShiftEnd || "23:00",
              },
              evening: {
                start: res.eveningShiftStart || "17:00",
                end: res.eveningShiftEnd || "23:00",
              },
              night: {
                start: res.nightShiftStart || "23:00",
                end: res.nightShiftEnd || "07:00",
              },
            });
          }
        } catch (e) {
          console.error("Failed to fetch settings from backend", e);
        }
      }
    };
    loadSettings();
    window.addEventListener("hospital-settings-updated", loadSettings);
    return () => {
      window.removeEventListener("hospital-settings-updated", loadSettings);
    };
  }, [user?.hospitalCode]);

  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load receptionists from backend
  const fetchReceptionists = async () => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);
      const [authRes, adminRes] = await Promise.all([
        apiFetch<any>(`/auth/users`, {
          headers: {
            "X-Hospital-Code": user.hospitalCode,
            "X-Hospital-Id": user.hospitalId || "1",
          },
          params: {
            hospitalCode: user.hospitalCode,
            role: "RECEPTIONIST",
            page: 0,
            size: 1000,
          },
        }),
        apiFetch<any>(`/admin/receptionists`, {
          headers: {
            "X-Hospital-Code": user.hospitalCode,
            "X-Hospital-Id": user.hospitalId || "1",
          },
          params: {
            page: 0,
            size: 1000,
          },
        }),
      ]);

      const credentials = authRes.content || authRes || [];
      const adminRecs = adminRes.content || adminRes || [];

      const storedMetadata = localStorage.getItem(
        "medicore-receptionists-meta",
      );
      const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};

      const mapped = credentials.map((c: any): Receptionist => {
        const matchingAdmin = adminRecs.find(
          (r: any) => r.email?.toLowerCase() === c.email?.toLowerCase(),
        );
        const meta = metadataMap[c.email] || {};
        const defaultName = matchingAdmin?.firstName
          ? `${matchingAdmin.firstName} ${matchingAdmin.lastName || ""}`.trim()
          : meta.name ||
            "Receptionist " +
              c.email.split("@")[0].charAt(0).toUpperCase() +
              c.email.split("@")[0].slice(1);
        return {
          id: matchingAdmin ? String(matchingAdmin.id) : c.entityId || c.email,
          name: defaultName,
          email: c.email,
          phone: matchingAdmin?.mobile || c.mobile || "N/A",
          shift: meta.shift || "Morning",
          status: c.isActive ? "Active" : "On Leave",
          assignedCounter: meta.assignedCounter || "Counter A",
          joinDate: meta.joinDate || new Date().toISOString().split("T")[0],
        };
      });

      setRecs(mapped);
    } catch (e: any) {
      console.error("Backend fetch failed, using local/mock fallback:", e);
      const storedMeta = localStorage.getItem("medicore-receptionists-meta");
      const metaMap = storedMeta ? JSON.parse(storedMeta) : {};

      const mockRecs = MOCK_RECEPTIONISTS.map((r) => {
        const meta = metaMap[r.email] || {};
        return {
          ...r,
          name: meta.name || r.name,
          shift: meta.shift || r.shift,
          assignedCounter: meta.assignedCounter || r.assignedCounter,
          status: meta.status || r.status || "Active",
        };
      });

      const localRegistered = Object.keys(metaMap).filter(
        (email) => !MOCK_RECEPTIONISTS.some((r) => r.email === email),
      );
      const extraRecs = localRegistered.map((email, idx): Receptionist => {
        const meta = metaMap[email];
        return {
          id: `REC-LOCAL-${idx}`,
          name: meta.name,
          email: email,
          phone: "8008818025",
          shift: meta.shift || "Morning",
          status: meta.status || "Active",
          assignedCounter: meta.assignedCounter || "Counter A",
          joinDate: meta.joinDate || new Date().toISOString().split("T")[0],
        };
      });

      const combined = [...mockRecs, ...extraRecs];
      setRecs(combined);
      setTotalPages(1);
      setTotalElements(combined.length);
      toast.info("Using local mock registry for Receptionists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, [user?.hospitalCode]);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = recs.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered;

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }
  function openEdit(r: Receptionist) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      email: r.email,
      phone: r.phone,
      shift: r.shift,
      assignedCounter: r.assignedCounter,
      password: "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      if (editingId) {
        const nameParts = form.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "Staff";
        const lastName = nameParts.slice(1).join(" ") || "Member";

        const body = {
          firstName,
          lastName,
          email: form.email,
          mobile: form.phone || "8008818025",
          password: form.password || undefined,
        };

        const isNumericId = /^\d+$/.test(editingId);
        if (isNumericId) {
          // Call the backend update receptionist endpoint
          await apiFetch(`/admin/receptionists/${editingId}`, {
            method: "PUT",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "HSP001",
              "X-Auth-User": user?.email || user?.id || "Admin",
            },
            body: JSON.stringify(body),
          });
        } else {
          // Legacy string ID (only exists in auth service), migrate it!
          // 1. Delete from auth-service
          try {
            await apiFetch(`/auth/users/${form.email}`, {
              method: "DELETE",
              headers: {
                "X-Hospital-Code": user?.hospitalCode || "HSP001",
                "X-Auth-User": user?.email || user?.id || "Admin",
              },
            });
          } catch (e) {}
          // 2. POST to admin-service to create it in both places
          await apiFetch("/admin/receptionists", {
            method: "POST",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "HSP001",
              "X-Hospital-Id": user?.hospitalId || "1",
              "X-Auth-User": user?.email || user?.id || "Admin",
            },
            body: JSON.stringify({
              ...body,
              password: form.password || "password",
            }),
          });
        }

        const storedMetadata = localStorage.getItem(
          "medicore-receptionists-meta",
        );
        const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};

        metadataMap[form.email] = {
          name: form.name,
          shift: form.shift || "Morning",
          assignedCounter: form.assignedCounter || "Counter A",
          joinDate:
            metadataMap[form.email]?.joinDate ||
            new Date().toISOString().split("T")[0],
        };
        localStorage.setItem(
          "medicore-receptionists-meta",
          JSON.stringify(metadataMap),
        );
        // Synchronize with local mock credentials registry
        try {
          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          const mockCreds = mockCredsStr ? JSON.parse(mockCredsStr) : [];
          const existingIdx = mockCreds.findIndex(
            (c: any) => c.email.toLowerCase() === form.email.toLowerCase(),
          );
          if (existingIdx > -1) {
            mockCreds[existingIdx].name = form.name;
            mockCreds[existingIdx].mobile = form.phone;
            if (form.password && form.password.trim() !== "") {
              mockCreds[existingIdx].password = form.password;
            }
          } else {
            mockCreds.push({
              email: form.email,
              password: form.password || "password",
              role: "receptionist",
              name: form.name,
              hospitalCode: user?.hospitalCode || "HSP001",
              hospitalId: user?.hospitalId || "1",
              entityId: editingId,
              mobile: form.phone,
            });
          }
          localStorage.setItem(
            "mock-user-credentials",
            JSON.stringify(mockCreds),
          );
        } catch (e) {
          console.error("Failed to sync mock credentials on edit", e);
        }

        toast.success("Receptionist metadata updated successfully");
      } else {
        const nameParts = form.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "Staff";
        const lastName = nameParts.slice(1).join(" ") || "Member";

        const body = {
          firstName,
          lastName,
          email: form.email,
          mobile: form.phone || "8008818025",
          password: form.password || "password",
        };

        // Self-healing migration for legacy credentials in auth service
        try {
          await apiFetch(`/auth/users/${form.email}`, {
            method: "DELETE",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "HSP001",
              "X-Auth-User": user?.email || user?.id || "Admin",
            },
          });
        } catch (e) {}

        const entityId = `REC-${Date.now().toString().substring(5)}`;
        await apiFetch("/admin/receptionists", {
          method: "POST",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Hospital-Id": user?.hospitalId || "1",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
          body: JSON.stringify(body),
        });

        const storedMetadata = localStorage.getItem(
          "medicore-receptionists-meta",
        );
        const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};
        metadataMap[form.email] = {
          name: form.name,
          shift: form.shift || "Morning",
          assignedCounter: form.assignedCounter || "Counter A",
          joinDate: new Date().toISOString().split("T")[0],
        };
        localStorage.setItem(
          "medicore-receptionists-meta",
          JSON.stringify(metadataMap),
        );

        // Synchronize with local mock credentials registry
        try {
          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          const mockCreds = mockCredsStr ? JSON.parse(mockCredsStr) : [];
          const updatedCreds = mockCreds.filter(
            (c: any) => c.email.toLowerCase() !== form.email.toLowerCase(),
          );
          updatedCreds.push({
            email: form.email,
            password: form.password || "password",
            role: "receptionist",
            name: form.name,
            hospitalCode: user?.hospitalCode || "HSP001",
            hospitalId: user?.hospitalId || "1",
            entityId: entityId,
            mobile: form.phone || "8008818025",
          });
          localStorage.setItem(
            "mock-user-credentials",
            JSON.stringify(updatedCreds),
          );
        } catch (e) {
          console.error("Failed to sync mock credentials on registration", e);
        }

        toast.success("Receptionist registered successfully on backend!");
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchReceptionists();
    } catch (e: any) {
      console.error(e);
      const isMock = getCookie("auth-token") === "dev-mock-token";
      if (
        isMock ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("Failed to execute")
      ) {
        const storedMetadata = localStorage.getItem(
          "medicore-receptionists-meta",
        );
        const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};
        metadataMap[form.email] = {
          name: form.name,
          shift: form.shift || "Morning",
          assignedCounter: form.assignedCounter || "Counter A",
          joinDate: new Date().toISOString().split("T")[0],
        };
        localStorage.setItem(
          "medicore-receptionists-meta",
          JSON.stringify(metadataMap),
        );

        // Synchronize with local mock credentials registry on local fallback
        try {
          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          const mockCreds = mockCredsStr ? JSON.parse(mockCredsStr) : [];
          if (editingId) {
            const existingIdx = mockCreds.findIndex(
              (c: any) => c.email.toLowerCase() === form.email.toLowerCase(),
            );
            if (existingIdx > -1) {
              mockCreds[existingIdx].name = form.name;
              mockCreds[existingIdx].mobile = form.phone;
              if (form.password && form.password.trim() !== "") {
                mockCreds[existingIdx].password = form.password;
              }
            } else {
              mockCreds.push({
                email: form.email,
                password: form.password || "password",
                role: "receptionist",
                name: form.name,
                hospitalCode: user?.hospitalCode || "HSP001",
                hospitalId: user?.hospitalId || "1",
                entityId: editingId,
                mobile: form.phone,
              });
            }
            localStorage.setItem(
              "mock-user-credentials",
              JSON.stringify(mockCreds),
            );
          } else {
            const updatedCreds = mockCreds.filter(
              (c: any) => c.email.toLowerCase() !== form.email.toLowerCase(),
            );
            const newEntityId = `REC-LOCAL-${Date.now().toString().substring(5)}`;
            updatedCreds.push({
              email: form.email,
              password: form.password || "password",
              role: "receptionist",
              name: form.name,
              hospitalCode: user?.hospitalCode || "HSP001",
              hospitalId: user?.hospitalId || "1",
              entityId: newEntityId,
              mobile: form.phone || "8008818025",
            });
            localStorage.setItem(
              "mock-user-credentials",
              JSON.stringify(updatedCreds),
            );
          }
        } catch (err) {
          console.error(
            "Failed to sync mock credentials on local fallback",
            err,
          );
        }

        toast.success("Saved to local registry successfully!");
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        fetchReceptionists();
      } else {
        let userFriendlyMsg = e.message || "Failed to save receptionist";
        if (
          userFriendlyMsg.includes("Duplicate entry") &&
          userFriendlyMsg.includes("mobile")
        ) {
          userFriendlyMsg =
            "This phone number is already registered to another account. Please use a unique phone number.";
        } else if (
          userFriendlyMsg.includes("Duplicate entry") &&
          userFriendlyMsg.includes("email")
        ) {
          userFriendlyMsg =
            "This email address is already registered to another account. Please use a unique email address.";
        }
        toast.error(userFriendlyMsg);
      }
    }
  }

  async function handleDelete(id: string) {
    const target = recs.find((r) => r.id === id);
    if (!target) return;

    try {
      const isNumericId = /^\d+$/.test(id);
      if (isNumericId) {
        await apiFetch(`/admin/receptionists/${id}`, {
          method: "DELETE",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
        });
      } else {
        await apiFetch(`/auth/users/${target.email}`, {
          method: "DELETE",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
        });
      }

      const storedMetadata = localStorage.getItem(
        "medicore-receptionists-meta",
      );
      if (storedMetadata) {
        const metadataMap = JSON.parse(storedMetadata);
        delete metadataMap[target.email];
        localStorage.setItem(
          "medicore-receptionists-meta",
          JSON.stringify(metadataMap),
        );
      }

      toast.success("Receptionist deleted successfully!");
      setDeleteId(null);
      fetchReceptionists();
    } catch (e: any) {
      console.error(e);
      const isMock = getCookie("auth-token") === "dev-mock-token";
      if (
        isMock ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("Failed to execute")
      ) {
        const storedMetadata = localStorage.getItem(
          "medicore-receptionists-meta",
        );
        if (storedMetadata) {
          const metadataMap = JSON.parse(storedMetadata);
          delete metadataMap[target.email];
          localStorage.setItem(
            "medicore-receptionists-meta",
            JSON.stringify(metadataMap),
          );
        }
        toast.success("Receptionist removed from local registry!");
        setDeleteId(null);
        fetchReceptionists();
      } else {
        toast.error(e.message || "Failed to delete receptionist");
      }
    }
  }

  async function handleUpdateStatus(id: string, activate: boolean) {
    try {
      await apiFetch(`/admin/receptionists/${id}/status?isActive=${activate}`, {
        method: "PATCH",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.email || user?.id || "Admin",
        },
      });
      toast.success(
        activate
          ? "Receptionist activated successfully!"
          : "Receptionist set to on leave successfully!",
      );
      fetchReceptionists();
    } catch (e: any) {
      console.error(e);
      const isMock = getCookie("auth-token") === "dev-mock-token";
      if (
        isMock ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("Failed to execute")
      ) {
        try {
          const storedMetadata = localStorage.getItem(
            "medicore-receptionists-meta",
          );
          const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};

          // Find receptionist by email if matching mock / local list
          const targetRec = recs.find((r) => r.id === id);
          if (targetRec && metadataMap[targetRec.email]) {
            metadataMap[targetRec.email].status = activate
              ? "Active"
              : "On Leave";
            localStorage.setItem(
              "medicore-receptionists-meta",
              JSON.stringify(metadataMap),
            );
          }

          toast.success(
            activate
              ? "Receptionist activated successfully (offline)!"
              : "Receptionist set to on leave successfully (offline)!",
          );
          setRecs((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, status: activate ? "Active" : "On Leave" }
                : r,
            ),
          );
          return;
        } catch (err) {
          console.error("Failed to update status in mock local fallback", err);
        }
      }
      toast.error(
        e.message ||
          `Failed to update status to ${activate ? "active" : "on leave"}`,
      );
    }
  }

  return (
    <div className="space-y-6" data-ocid="admin.receptionists.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Manage Receptionists
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {recs.length} front-desk staff across{" "}
            {new Set(recs.map((r) => r.shift)).size} shifts
          </p>
        </div>
        <Button
          data-ocid="admin.receptionists.add_button"
          onClick={openAdd}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
        >
          <Plus className="w-4 h-4" /> Add Receptionist
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="admin.receptionists.search_input"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name or email…"
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              {[
                "Staff Member",
                "Email",
                "Phone",
                "Shift",
                "Counter",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-muted-foreground"
                  data-ocid="admin.receptionists.empty_state"
                >
                  No staff found.
                </td>
              </tr>
            )}
            {paginated.map((rec, i) => (
              <tr
                key={rec.id}
                data-ocid={`admin.receptionists.item.${page * pageSize + i + 1}`}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <UserCog className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {rec.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Since {rec.joinDate}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {rec.email}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground font-mono">
                  {rec.phone}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="outline"
                    className={`text-xs border ${SHIFT_STYLES[rec.shift] ?? "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}
                  >
                    {rec.shift === "Morning" &&
                      `Morning (${formatTimeAMPM(shifts.morning.start)}–${formatTimeAMPM(shifts.morning.end)})`}
                    {rec.shift === "Afternoon" &&
                      `Afternoon (${formatTimeAMPM(shifts.afternoon.start)}–${formatTimeAMPM(shifts.afternoon.end)})`}
                    {rec.shift === "Evening" &&
                      `Evening (${formatTimeAMPM(shifts.evening.start)}–${formatTimeAMPM(shifts.evening.end)})`}
                    {rec.shift === "Night" &&
                      `Night (${formatTimeAMPM(shifts.night.start)}–${formatTimeAMPM(shifts.night.end)})`}
                    {!["Morning", "Afternoon", "Evening", "Night"].includes(
                      rec.shift,
                    ) && rec.shift}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {rec.assignedCounter}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="outline"
                    className={`text-xs border ${STATUS_STYLES[rec.status] ?? ""}`}
                  >
                    {rec.status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {rec.status === "On Leave" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`admin.receptionists.activate_button.${page * pageSize + i + 1}`}
                        onClick={() => handleUpdateStatus(rec.id, true)}
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
                        title="Activate Receptionist"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`admin.receptionists.deactivate_button.${page * pageSize + i + 1}`}
                        onClick={() => handleUpdateStatus(rec.id, false)}
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                        title="Deactivate Receptionist (On Leave)"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`admin.receptionists.edit_button.${page * pageSize + i + 1}`}
                      onClick={() => openEdit(rec)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`admin.receptionists.delete_button.${page * pageSize + i + 1}`}
                      onClick={() => setDeleteId(rec.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {true ? (
          <div className="px-5 py-3 border-t border-border">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(filtered.length / pageSize)}
              totalElements={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : null}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="admin.receptionists.dialog"
          className="bg-card border-border max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Receptionist" : "Add Receptionist"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rec-name">Full Name</Label>
                <Input
                  id="rec-name"
                  data-ocid="admin.receptionists.name.input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rec-email">Email</Label>
                <Input
                  id="rec-email"
                  type="email"
                  data-ocid="admin.receptionists.email.input"
                  value={form.email}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@medicore.com"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rec-password">Password</Label>
                <Input
                  id="rec-password"
                  type="password"
                  data-ocid="admin.receptionists.password.input"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={
                    editingId
                      ? "Leave blank to keep unchanged"
                      : "Enter login password"
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-phone">Phone</Label>
                <PhoneInput
                  id="rec-phone"
                  data-ocid="admin.receptionists.phone.input"
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Shift</Label>
                <Select
                  value={form.shift}
                  onValueChange={(v) => setForm({ ...form, shift: v })}
                >
                  <SelectTrigger
                    data-ocid="admin.receptionists.shift.select"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">
                      Morning ({formatTimeAMPM(shifts.morning.start)}–
                      {formatTimeAMPM(shifts.morning.end)})
                    </SelectItem>
                    <SelectItem value="Afternoon">
                      Afternoon ({formatTimeAMPM(shifts.afternoon.start)}–
                      {formatTimeAMPM(shifts.afternoon.end)})
                    </SelectItem>
                    <SelectItem value="Evening">
                      Evening ({formatTimeAMPM(shifts.evening.start)}–
                      {formatTimeAMPM(shifts.evening.end)})
                    </SelectItem>
                    <SelectItem value="Night">
                      Night ({formatTimeAMPM(shifts.night.start)}–
                      {formatTimeAMPM(shifts.night.end)})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="rec-counter">Assigned Counter</Label>
                <Input
                  id="rec-counter"
                  data-ocid="admin.receptionists.counter.input"
                  value={form.assignedCounter}
                  onChange={(e) =>
                    setForm({ ...form, assignedCounter: e.target.value })
                  }
                  placeholder="Counter A"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="admin.receptionists.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                data-ocid="admin.receptionists.submit_button"
                onClick={handleSave}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {editingId ? "Save Changes" : "Add Receptionist"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent
          data-ocid="admin.receptionists.confirm_dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Staff Member
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            This will permanently remove this receptionist from the system.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.receptionists.delete_cancel_button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="admin.receptionists.confirm_button"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

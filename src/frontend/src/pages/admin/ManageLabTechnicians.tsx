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
import { apiFetch } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
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
  Inactive: "bg-muted text-muted-foreground border-border",
};

interface LabTechnician {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  joinDate: string;
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  password?: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function ManageLabTechnicians() {
  const { user } = useAuthStore();
  const [technicians, setTechnicians] = useState<LabTechnician[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load technicians from backend
  const fetchTechnicians = async () => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);
      const res = await apiFetch<any>(`/auth/users`, {
        headers: {
          "X-Hospital-Code": user.hospitalCode,
          "X-Hospital-Id": user.hospitalId || "1",
        },
        params: {
          hospitalCode: user.hospitalCode,
          role: "LAB_TECHNICIAN",
          page: page,
          size: pageSize,
        },
      });

      const credentials = res.content || [];
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);

      const storedMetadata = localStorage.getItem("medicore-technicians-meta");
      const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};

      const mapped = credentials.map((c: any): LabTechnician => {
        const meta = metadataMap[c.email] || {};
        const defaultName =
          "Technician " +
          c.email.split("@")[0].charAt(0).toUpperCase() +
          c.email.split("@")[0].slice(1);
        return {
          id: c.entityId || c.email,
          name: meta.name || defaultName,
          email: c.email,
          phone: c.mobile || "N/A",
          status: c.isActive ? "Active" : "Inactive",
          joinDate: meta.joinDate || new Date().toISOString().split("T")[0],
        };
      });

      setTechnicians(mapped);
    } catch (e: any) {
      console.error("Backend fetch failed, using local fallback:", e);
      const storedMetadata = localStorage.getItem("medicore-technicians-meta");
      const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};
      const localTechnicians = Object.keys(metadataMap).map(
        (email, idx): LabTechnician => {
          const meta = metadataMap[email];
          return {
            id: `TECH-${idx}`,
            name: meta.name,
            email: email,
            phone: meta.phone || "N/A",
            status: meta.status || "Active",
            joinDate: meta.joinDate || new Date().toISOString().split("T")[0],
          };
        },
      );
      setTechnicians(localTechnicians);
      setTotalPages(1);
      setTotalElements(localTechnicians.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [user?.hospitalCode]);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = technicians.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(t: LabTechnician) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      email: t.email,
      phone: t.phone === "N/A" ? "" : t.phone,
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
        const storedMetadata = localStorage.getItem(
          "medicore-technicians-meta",
        );
        const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};

        // Update metadata in localStorage
        metadataMap[form.email] = {
          name: form.name,
          phone: form.phone,
          joinDate:
            metadataMap[form.email]?.joinDate ||
            new Date().toISOString().split("T")[0],
        };
        localStorage.setItem(
          "medicore-technicians-meta",
          JSON.stringify(metadataMap),
        );

        // Update password on backend if provided
        if (form.password && form.password.trim() !== "") {
          try {
            await apiFetch(
              `/auth/internal/users/password?email=${encodeURIComponent(form.email)}&password=${encodeURIComponent(form.password)}`,
              { method: "POST" },
            );
          } catch (pwErr) {
            console.warn(
              "Backend password update failed, syncing locally only.",
              pwErr,
            );
          }
        }

        // Sync with local mock credentials registry
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
              role: "lab_technician",
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
        } catch (err) {
          console.error("Failed to sync mock credentials on edit", err);
        }

        toast.success("Lab Technician details updated successfully");
      } else {
        const entityId = `TECH-${Date.now().toString().substring(5)}`;
        await apiFetch("/auth/register", {
          method: "POST",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Hospital-Id": user?.hospitalId || "1",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
          body: JSON.stringify({
            email: form.email,
            mobile: form.phone || "8008818025",
            password: form.password || "password",
            role: "LAB_TECHNICIAN",
            entityId: entityId,
            hospitalCode: user?.hospitalCode || "HSP001",
            hospitalId: user?.hospitalId ? Number(user.hospitalId) : 1,
          }),
        });

        const storedMetadata = localStorage.getItem(
          "medicore-technicians-meta",
        );
        const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};
        metadataMap[form.email] = {
          name: form.name,
          phone: form.phone,
          joinDate: new Date().toISOString().split("T")[0],
        };
        localStorage.setItem(
          "medicore-technicians-meta",
          JSON.stringify(metadataMap),
        );

        // Sync with local mock credentials registry
        try {
          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          const mockCreds = mockCredsStr ? JSON.parse(mockCredsStr) : [];
          const updatedCreds = mockCreds.filter(
            (c: any) => c.email.toLowerCase() !== form.email.toLowerCase(),
          );
          updatedCreds.push({
            email: form.email,
            password: form.password || "password",
            role: "lab_technician",
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
        } catch (err) {
          console.error("Failed to sync mock credentials on registration", err);
        }

        toast.success("Lab Technician registered successfully on backend!");
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchTechnicians();
    } catch (e: any) {
      console.error(e);
      const isMock = getCookie("auth-token") === "dev-mock-token";
      if (
        isMock ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("Failed to execute")
      ) {
        // Fallback for offline testing
        const storedMetadata = localStorage.getItem(
          "medicore-technicians-meta",
        );
        const metadataMap = storedMetadata ? JSON.parse(storedMetadata) : {};
        metadataMap[form.email] = {
          name: form.name,
          phone: form.phone,
          joinDate: new Date().toISOString().split("T")[0],
        };
        localStorage.setItem(
          "medicore-technicians-meta",
          JSON.stringify(metadataMap),
        );

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
                role: "lab_technician",
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
            const newEntityId = `TECH-LOCAL-${Date.now().toString().substring(5)}`;
            updatedCreds.push({
              email: form.email,
              password: form.password || "password",
              role: "lab_technician",
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
          console.error("Failed to sync mock credentials on fallback", err);
        }

        toast.success("Saved to local registry successfully!");
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        fetchTechnicians();
        return;
      }

      let userFriendlyMsg = e.message || "Failed to save technician";
      if (
        userFriendlyMsg.includes("Duplicate entry") &&
        userFriendlyMsg.includes("email")
      ) {
        userFriendlyMsg =
          "This email is already registered to another account.";
      }
      toast.error(userFriendlyMsg);
    }
  }

  async function handleDelete(id: string) {
    const target = technicians.find((t) => t.id === id);
    if (!target) return;

    try {
      await apiFetch(`/auth/users/${target.email}`, {
        method: "DELETE",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.email || user?.id || "Admin",
        },
      });

      const storedMetadata = localStorage.getItem("medicore-technicians-meta");
      if (storedMetadata) {
        const metadataMap = JSON.parse(storedMetadata);
        delete metadataMap[target.email];
        localStorage.setItem(
          "medicore-technicians-meta",
          JSON.stringify(metadataMap),
        );
      }

      toast.success("Lab Technician deleted successfully!");
      setDeleteId(null);
      fetchTechnicians();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete technician");
    }
  }

  async function handleUpdateStatus(email: string, activate: boolean) {
    try {
      await apiFetch(
        `/auth/internal/users/status?identifier=${encodeURIComponent(email)}&isActive=${activate}`,
        {
          method: "PATCH",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
          },
        },
      );
      toast.success(
        activate
          ? "Lab Technician activated successfully!"
          : "Lab Technician deactivated successfully!",
      );
      fetchTechnicians();
    } catch (e: any) {
      console.error(e);
      const isMock = getCookie("auth-token") === "dev-mock-token";
      if (
        isMock ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("Failed to execute")
      ) {
        // Mock fallback updates
        const storedMetadata = localStorage.getItem(
          "medicore-technicians-meta",
        );
        if (storedMetadata) {
          const metadataMap = JSON.parse(storedMetadata);
          if (metadataMap[email]) {
            metadataMap[email].status = activate ? "Active" : "Inactive";
            localStorage.setItem(
              "medicore-technicians-meta",
              JSON.stringify(metadataMap),
            );
          }
        }

        // Sync with local mock credentials registry
        try {
          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          if (mockCredsStr) {
            const mockCreds = JSON.parse(mockCredsStr);
            const updatedCreds = mockCreds.map((c: any) =>
              c.email.toLowerCase() === email.toLowerCase()
                ? { ...c, isActive: activate }
                : c,
            );
            localStorage.setItem(
              "mock-user-credentials",
              JSON.stringify(updatedCreds),
            );
          }
        } catch (err) {
          console.error("Failed to update status in mock local fallback", err);
        }

        toast.success(
          `Lab Technician status updated to ${activate ? "Active" : "Inactive"} (offline)!`,
        );
        fetchTechnicians();
        return;
      }
      toast.error(e.message || "Failed to update technician status");
    }
  }

  return (
    <div className="space-y-6" data-ocid="admin.technicians.page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Manage Lab Technicians
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalElements} registered lab technicians for hospital{" "}
            {user?.hospitalCode}
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Technician
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Technicians List Table */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Technician
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Phone
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Join Date
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading technicians...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No technicians found matching your search.
                </td>
              </tr>
            ) : (
              filtered.slice(page * pageSize, (page + 1) * pageSize).map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 font-medium flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{t.email}</td>
                  <td className="px-5 py-4 text-muted-foreground">{t.phone}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {t.joinDate}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[t.status]}
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {t.status === "Inactive" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(t.email, true)}
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
                          title="Activate Technician"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(t.email, false)}
                          className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                          title="Deactivate Technician"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(t.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
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
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Lab Technician" : "Add New Lab Technician"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="tech-name">Full Name</Label>
                <Input
                  id="tech-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="tech-email">Email</Label>
                <Input
                  id="tech-email"
                  type="email"
                  value={form.email}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane.doe@hospital.com"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="tech-password">
                  {editingId ? "New Password" : "Password"}
                </Label>
                <Input
                  id="tech-password"
                  type="password"
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
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="tech-phone">Phone</Label>
                <PhoneInput
                  id="tech-phone"
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {editingId ? "Save Changes" : "Add Technician"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Lab Technician
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to remove this lab technician? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove Technician
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

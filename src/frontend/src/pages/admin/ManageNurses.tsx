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
import { useAuthStore } from "@/store/auth-store";
import {
  Edit2,
  HeartPulse,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Inactive: "bg-muted text-muted-foreground border-border",
};

interface Nurse {
  id: string;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  experience: string;
  qualification: string;
  hospitalCode: string;
  status: "Active" | "Inactive";
  joinDate: string;
}

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  experience: string;
  qualification: string;
  hospitalCode: string;
};

const EMPTY_FORM: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  experience: "",
  qualification: "",
  hospitalCode: "",
};

export default function ManageNurses() {
  const { user } = useAuthStore();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load nurses from backend
  const fetchNurses = async (currentPage = page, size = pageSize) => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);
      const res = await apiFetch<any>("/admin/nurses", {
        headers: {
          "X-Hospital-Code": user.hospitalCode,
        },
        params: {
          page: currentPage,
          size,
        },
      });

      const credentials = res.content || [];
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);

      const mapped = credentials.map((n: any): Nurse => {
        const fullName =
          `${n.firstName} ${n.middleName || ""} ${n.lastName || ""}`
            .trim()
            .replace(/\s+/g, " ");
        return {
          id: String(n.id),
          name: fullName,
          firstName: n.firstName,
          middleName: n.middleName || "",
          lastName: n.lastName,
          email: n.email,
          phone: n.mobile || "N/A",
          gender: n.gender || "",
          experience: n.experience || "",
          qualification: n.qualification || "",
          hospitalCode: n.hospitalCode,
          status: n.isActive ? "Active" : "Inactive",
          joinDate: n.createdAt
            ? n.createdAt.split("T")[0]
            : new Date().toISOString().split("T")[0],
        };
      });

      setNurses(mapped);
      localStorage.setItem("medicore-nurses", JSON.stringify(mapped));
    } catch (e: any) {
      console.error("Backend fetch failed, using local fallback:", e);
      const saved = localStorage.getItem("medicore-nurses");
      if (saved) {
        setNurses(JSON.parse(saved));
      } else {
        setNurses([]);
      }
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurses(page, pageSize);
  }, [user?.hospitalCode, page, pageSize]);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = nurses.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.email.toLowerCase().includes(search.toLowerCase()) ||
      n.phone.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      hospitalCode: user?.hospitalCode || "",
    });
    setDialogOpen(true);
  }

  function openEdit(n: Nurse) {
    setEditingId(n.id);
    setForm({
      firstName: n.firstName,
      middleName: n.middleName,
      lastName: n.lastName,
      email: n.email,
      phone: n.phone === "N/A" ? "" : n.phone,
      gender: n.gender || "",
      experience: n.experience,
      qualification: n.qualification,
      hospitalCode: n.hospitalCode,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error("First Name and Email are required");
      return;
    }

    try {
      const body = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        mobile: form.phone || "8008818025",
        password: editingId ? undefined : "password",
        gender: form.gender,
        experience: form.experience,
        qualification: form.qualification,
      };

      if (editingId) {
        await apiFetch(`/admin/nurses/${editingId}`, {
          method: "PUT",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
          body: JSON.stringify(body),
        });
        toast.success("Nurse details updated successfully");
      } else {
        await apiFetch("/admin/nurses", {
          method: "POST",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Hospital-Id": user?.hospitalId || "1",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
          body: JSON.stringify(body),
        });
        toast.success("Nurse registered successfully on backend!");
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchNurses();
    } catch (e: any) {
      console.error(e);
      let userFriendlyMsg = e.message || "Failed to save nurse";
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
    try {
      await apiFetch(`/admin/nurses/${id}`, {
        method: "DELETE",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.email || user?.id || "Admin",
        },
      });

      toast.success("Nurse deleted successfully!");
      setDeleteId(null);
      fetchNurses();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete nurse");
    }
  }

  async function handleUpdateStatus(id: string, activate: boolean) {
    try {
      await apiFetch(`/admin/nurses/${id}/status?isActive=${activate}`, {
        method: "PATCH",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.email || user?.id || "Admin",
        },
      });
      toast.success(
        activate
          ? "Nurse activated successfully!"
          : "Nurse set to inactive successfully!",
      );
      fetchNurses();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update nurse status");
    }
  }

  return (
    <div className="space-y-6" data-ocid="admin.nurses.page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Manage Nurses
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalElements} registered nurses for hospital {user?.hospitalCode}
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Nurse
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

      {/* Nurses List Table */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nurse
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
                    Loading nurses...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No nurses found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent flex-shrink-0">
                        <HeartPulse className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {n.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            n.qualification,
                            n.experience ? `${n.experience} yrs exp` : null,
                            n.gender
                              ? n.gender.charAt(0).toUpperCase() +
                                n.gender.slice(1).toLowerCase()
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {n.email}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {n.phone}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {n.joinDate}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={STATUS_STYLES[n.status]}
                      >
                        {n.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {n.status === "Inactive" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatus(n.id, true)}
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
                            title="Activate Nurse"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateStatus(n.id, false)}
                            className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                            title="Deactivate Nurse"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(n)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(n.id)}
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
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border">
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
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
              {editingId ? "Edit Nurse" : "Add New Nurse"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nurse-first-name">First Name</Label>
                <Input
                  id="nurse-first-name"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="Jane"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nurse-middle-name">Middle Name</Label>
                <Input
                  id="nurse-middle-name"
                  value={form.middleName}
                  onChange={(e) =>
                    setForm({ ...form, middleName: e.target.value })
                  }
                  placeholder="Marie"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nurse-last-name">Last Name</Label>
                <Input
                  id="nurse-last-name"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="nurse-email">Email</Label>
                <Input
                  id="nurse-email"
                  type="email"
                  value={form.email}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane.doe@hospital.com"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="nurse-phone">Phone Number</Label>
                <PhoneInput
                  id="nurse-phone"
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nurse-gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(val) => setForm({ ...form, gender: val })}
                >
                  <SelectTrigger
                    id="nurse-gender"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nurse-qualification">Qualification</Label>
                <Input
                  id="nurse-qualification"
                  value={form.qualification}
                  onChange={(e) =>
                    setForm({ ...form, qualification: e.target.value })
                  }
                  placeholder="B.Sc. Nursing"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nurse-experience">Experience (Years)</Label>
                <Input
                  id="nurse-experience"
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                  placeholder="5"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-6 space-y-1.5">
                <Label htmlFor="nurse-hospital-code">Hospital Code</Label>
                <Input
                  id="nurse-hospital-code"
                  value={form.hospitalCode}
                  onChange={(e) =>
                    setForm({ ...form, hospitalCode: e.target.value })
                  }
                  placeholder="HSP001"
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
                {editingId ? "Save Changes" : "Add Nurse"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remove Nurse</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to remove this nurse? This action cannot be
            undone.
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
              Remove Nurse
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

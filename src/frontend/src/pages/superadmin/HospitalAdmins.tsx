import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Building2,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  Shield,
  Trash2,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  Inactive: "bg-destructive/10 text-destructive border-destructive/30",
};

function getInitials(name: string) {
  if (!name) return "HA";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function HospitalAdmins() {
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });
  const [admins, setAdmins] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    hospitalId: "",
    name: "",
    gender: "MALE",
    designation: "",
    email: "",
    mobile: "",
    password: "",
    qualification: "",
    experienceYears: "",
    address: "",
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [selectedAdminForDetails, setSelectedAdminForDetails] = useState<
    any | null
  >(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    hospitalId: "",
    name: "",
    gender: "MALE",
    designation: "",
    email: "",
    mobile: "",
    qualification: "",
    experienceYears: "",
    address: "",
    password: "",
  });

  const handleOpenEdit = (admin: any) => {
    setEditingAdmin(admin);
    setEditFormData({
      hospitalId: admin.hospitalId ? admin.hospitalId.toString() : "",
      name: admin.name || "",
      gender: admin.gender || "MALE",
      designation: admin.designation || "",
      email: admin.email || "",
      mobile: admin.mobile || "",
      qualification: admin.qualification || "",
      experienceYears:
        admin.experienceYears !== undefined && admin.experienceYears !== null
          ? admin.experienceYears.toString()
          : "",
      address: admin.address || "",
      password: "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    if (
      admins.some(
        (a) =>
          a.email === editFormData.email &&
          a.employeeId !== editingAdmin.employeeId
      )
    ) {
      toast.error("Admin email already exists");
      return;
    }
    if (
      admins.some(
        (a) =>
          a.mobile === editFormData.mobile &&
          a.employeeId !== editingAdmin.employeeId
      )
    ) {
      toast.error("Admin mobile number already exists");
      return;
    }
    try {
      const payload = {
        ...editFormData,
        hospitalId: editFormData.hospitalId
          ? Number.parseInt(editFormData.hospitalId, 10)
          : null,
        experienceYears: editFormData.experienceYears
          ? Number.parseInt(editFormData.experienceYears, 10)
          : 0,
      };
      await apiFetch(
        `/super-admin/hospital-admins/emp/${editingAdmin.employeeId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      toast.success("Hospital admin successfully updated!");
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update hospital admin");
    }
  };

  const handleToggleStatus = async (admin: any) => {
    try {
      const nextStatus = !admin.active;
      await apiFetch(
        `/super-admin/hospital-admins/emp/${admin.employeeId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextStatus }),
        },
      );
      toast.success(
        `Admin ${nextStatus ? "activated" : "deactivated"} successfully!`,
      );
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to toggle admin status");
    }
  };

  const handleDeleteAdmin = async (admin: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete administrator "${admin.name}"?`,
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/super-admin/hospital-admins/emp/${admin.employeeId}`, {
        method: "DELETE",
      });
      toast.success("Administrator successfully deleted!");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete hospital admin");
    }
  };

  const loadData = async (currentPage = page, size = pageSize) => {
    try {
      setIsLoading(true);
      const [adminsRes, hospitalsRes] = await Promise.all([
        apiFetch<any>("/super-admin/hospital-admins", {
          params: { page: currentPage, size },
        }),
        apiFetch<any>("/super-admin/hospitals", {
          params: { page: 0, size: 1000 },
        }),
      ]);
      setAdmins(adminsRes.content || []);
      setTotalPages(adminsRes.totalPages || 0);
      setTotalElements(adminsRes.totalElements || 0);
      setHospitals(hospitalsRes.content || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load super admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    loadData(0, newSize);
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) {
        setSearch(searchParam);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalId) {
      toast.error("Please select a hospital first.");
      return;
    }
    if (admins.some((a) => a.email === formData.email)) {
      toast.error("Admin email already exists");
      return;
    }
    if (admins.some((a) => a.mobile === formData.mobile)) {
      toast.error("Admin mobile number already exists");
      return;
    }
    try {
      const payload = {
        ...formData,
        hospitalId: Number.parseInt(formData.hospitalId, 10),
        experienceYears: formData.experienceYears
          ? Number.parseInt(formData.experienceYears, 10)
          : 0,
      };
      await apiFetch("/super-admin/hospital-admins", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Hospital admin successfully created!");
      setIsOpen(false);
      setFormData({
        hospitalId: "",
        name: "",
        gender: "MALE",
        designation: "",
        email: "",
        mobile: "",
        password: "",
        qualification: "",
        experienceYears: "",
        address: "",
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create hospital admin");
    }
  };

  const filtered = admins.filter(
    (a) =>
      (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.hospitalCode &&
        a.hospitalCode.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes pulse-highlight {
          0% { background-color: rgba(139, 92, 246, 0.04); }
          50% { background-color: rgba(139, 92, 246, 0.12); }
          100% { background-color: rgba(139, 92, 246, 0.04); }
        }
        .animate-pulse-highlight {
          animation: pulse-highlight 2.5s infinite ease-in-out;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Hospital Admins
          </h1>
          <p className="text-muted-foreground mt-0.5">
            Manage administrator accounts across all hospitals in the
            multi-tenant system
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              data-ocid="super-admin.admins.add_button"
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-background border border-border text-foreground rounded-3xl shadow-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-foreground">
                Add New Hospital Admin
              </DialogTitle>
              <DialogDescription className="sr-only">
                Provide the details to register a new administrator.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Hospital *
                </Label>
                <Select
                  value={formData.hospitalId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, hospitalId: val })
                  }
                >
                  <SelectTrigger className="bg-muted/40 border-border text-foreground h-11 rounded-xl">
                    <SelectValue placeholder="Choose a registered hospital" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-popover-foreground">
                    {hospitals
                      .filter((h) => h.status === "ACTIVE")
                      .map((h) => (
                        <SelectItem key={h.id} value={h.id.toString()}>
                          {h.hospitalName} ({h.hospitalCode})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Full Name *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Dr. John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Gender *
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) =>
                      setFormData({ ...formData, gender: val })
                    }
                  >
                    <SelectTrigger className="bg-muted/40 border-border text-foreground h-11 rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-popover-foreground">
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Work Email *
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="admin@hospital.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Mobile Number *
                  </Label>
                  <PhoneInput
                    value={formData.mobile}
                    onChange={(val) =>
                      setFormData({ ...formData, mobile: val })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Temporary Password *
                  </Label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Designation *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Chief Medical Director"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Qualification
                  </Label>
                  <Input
                    placeholder="e.g. MD, MHA"
                    value={formData.qualification}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualification: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Experience (Years)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Office Address
                </Label>
                <Input
                  placeholder="e.g. Block A, Room 102"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-border text-foreground hover:bg-muted rounded-xl h-11 px-6 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6"
                >
                  Create Admin
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-xl bg-background border border-border text-foreground rounded-3xl shadow-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-foreground">
                Edit Hospital Admin
              </DialogTitle>
              <DialogDescription className="sr-only">
                Modify the details of the administrator account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Hospital *
                </Label>
                <Select
                  value={editFormData.hospitalId}
                  onValueChange={(val) =>
                    setEditFormData({ ...editFormData, hospitalId: val })
                  }
                >
                  <SelectTrigger className="bg-muted/40 border-border text-foreground h-11 rounded-xl">
                    <SelectValue placeholder="Choose a registered hospital" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-popover-foreground">
                    {hospitals
                      .filter((h) => h.status === "ACTIVE")
                      .map((h) => (
                        <SelectItem key={h.id} value={h.id.toString()}>
                          {h.hospitalName} ({h.hospitalCode})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Full Name *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Dr. John Doe"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Gender *
                  </Label>
                  <Select
                    value={editFormData.gender}
                    onValueChange={(val) =>
                      setEditFormData({ ...editFormData, gender: val })
                    }
                  >
                    <SelectTrigger className="bg-muted/40 border-border text-foreground h-11 rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-popover-foreground">
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Work Email *
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="admin@hospital.com"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Mobile Number *
                  </Label>
                  <PhoneInput
                    value={editFormData.mobile}
                    onChange={(val) =>
                      setEditFormData({ ...editFormData, mobile: val })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Designation *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Chief Medical Director"
                    value={editFormData.designation}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        designation: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Qualification
                  </Label>
                  <Input
                    placeholder="e.g. MD, MHA"
                    value={editFormData.qualification}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        qualification: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Experience (Years)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={editFormData.experienceYears}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        experienceYears: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Office Address
                </Label>
                <Input
                  placeholder="e.g. Block A, Room 102"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      address: e.target.value,
                    })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  New Password (Optional)
                </Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      password: e.target.value,
                    })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-border text-foreground hover:bg-muted rounded-xl h-11 px-6 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Total Registered Admins",
            value: admins.length,
            icon: UserCog,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Active Multi-Tenant Sessions",
            value: admins.filter((a) => a.active).length,
            icon: Shield,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((s, i) => (
          <Card
            key={s.label}
            data-ocid={`super-admin.admins.stat.${i + 1}`}
            className="border-border hover:shadow-elevated transition-all"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}
              >
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground font-display">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="super-admin.admins.search_input"
          placeholder="Search admins by name, email or hospital…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/30"
        />
      </div>

      {/* Admins table / list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading hospital administrators list…
          </p>
        </div>
      ) : (
        <Card data-ocid="super-admin.admins.card" className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              All Hospital Admins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              data-ocid="super-admin.admins.list"
              className="divide-y divide-border"
            >
              {filtered.map((admin, i) => {
                const urlParams = new URLSearchParams(
                  typeof window !== "undefined" ? window.location.search : "",
                );
                const searchParam = urlParams.get("search");
                const isHighlighted =
                  searchParam && admin.hospitalCode === searchParam;
                return (
                  <div
                    key={admin.id}
                    data-ocid={`super-admin.admins.item.${i + 1}`}
                    className={`flex flex-wrap items-center gap-4 px-6 py-4 transition-all duration-500 group ${
                      isHighlighted
                        ? "animate-pulse-highlight border-l-4 border-violet-500 shadow-xs"
                        : "hover:bg-muted/30 border-l-4 border-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      onClick={() => {
                        setSelectedAdminForDetails(admin);
                        setIsDetailsOpen(true);
                      }}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 group-hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      {getInitials(admin.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        onClick={() => {
                          setSelectedAdminForDetails(admin);
                          setIsDetailsOpen(true);
                        }}
                        className="text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors inline-block"
                      >
                        {admin.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />{" "}
                          {admin.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />{" "}
                          {admin.mobile}
                        </span>
                        <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                          ID: {admin.employeeId}
                        </span>
                      </div>
                    </div>

                    {/* Hospital */}
                    <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate font-semibold">
                        Hospital Code: {admin.hospitalCode}
                      </span>
                    </div>

                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={`text-xs border shrink-0 ${admin.active ? STATUS_COLORS.Active : STATUS_COLORS.Inactive}`}
                    >
                      {admin.active ? "Active" : "Inactive"}
                    </Badge>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          data-ocid={`super-admin.admins.actions.${i + 1}.button`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
                          aria-label="Admin actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-popover border border-border text-popover-foreground rounded-2xl p-1.5 shadow-2xl"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdminForDetails(admin);
                            setIsDetailsOpen(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(admin)}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5 text-sky-500" />
                          Edit Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(admin)}
                          className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all ${admin.active ? "text-rose-500 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-600"}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {admin.active ? "Deactivate Admin" : "Activate Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteAdmin(admin)}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-rose-500 hover:text-rose-600 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div
                data-ocid="super-admin.admins.empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-foreground">
                  No administrators registered
                </p>
                <p className="text-sm mt-1">
                  Add a new admin account linked to a tenant hospital.
                </p>
              </div>
            )}

            <div className="px-6 pb-4">
              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Admin Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Administrator Profile Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Complete metadata and system configuration for employee:{" "}
              {selectedAdminForDetails?.employeeId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Header info */}
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-base">
                {selectedAdminForDetails
                  ? getInitials(selectedAdminForDetails.name)
                  : "HA"}
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground leading-snug">
                  {selectedAdminForDetails?.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedAdminForDetails?.designation ||
                    "No designation specified"}
                </p>
              </div>
            </div>

            {/* Fields list */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Email Address
                </p>
                <p className="text-foreground mt-0.5 break-all font-medium">
                  {selectedAdminForDetails?.email}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Mobile Number
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedAdminForDetails?.mobile || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Hospital Code
                </p>
                <p className="text-foreground mt-0.5 font-mono font-medium">
                  {selectedAdminForDetails?.hospitalCode}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Gender
                </p>
                <p className="text-foreground mt-0.5 capitalize font-medium">
                  {selectedAdminForDetails?.gender?.toLowerCase() ||
                    "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Qualification
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedAdminForDetails?.qualification || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Experience
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedAdminForDetails?.experienceYears !== undefined &&
                  selectedAdminForDetails?.experienceYears !== null
                    ? `${selectedAdminForDetails.experienceYears} Years`
                    : "Not specified"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Office Address
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedAdminForDetails?.address || "Not specified"}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between p-2.5 bg-muted/40 border border-border/50 rounded-xl mt-1">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Account Access
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allows login to hospital modules
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize font-semibold ${selectedAdminForDetails?.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-rose-500/10 text-rose-700 border-rose-500/30"}`}
                >
                  {selectedAdminForDetails?.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6"
            >
              Close Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

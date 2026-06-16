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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { Department } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  BedDouble,
  Edit2,
  Plus,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DEPT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Cardiology: Activity,
  Neurology: Activity,
  Orthopedics: BedDouble,
  Pediatrics: Users,
  "General Surgery": Stethoscope,
  Dermatology: Activity,
};

const DEPT_COLORS: Record<string, string> = {
  Cardiology: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  Neurology: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  Orthopedics: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  Pediatrics: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  "General Surgery": "from-red-500/20 to-red-600/10 border-red-500/30",
  Dermatology: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
};

const ICON_COLORS: Record<string, string> = {
  Cardiology: "text-blue-400",
  Neurology: "text-purple-400",
  Orthopedics: "text-orange-400",
  Pediatrics: "text-emerald-400",
  "General Surgery": "text-red-400",
  Dermatology: "text-pink-400",
};

type FormState = {
  name: string;
  head: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  head: "",
};

export default function Departments() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0);

  const fetchAllData = async () => {
    if (!user?.hospitalCode) return;
    const hdr = { "X-Hospital-Code": user.hospitalCode };
    try {
      setLoading(true);
      // Fetch live departments from backend (pageable)
      const res = await apiFetch<any>("/admin/departments", {
        headers: hdr,
        params: { page: 0, size: 1000 },
      });

      const deptsList = res.content || res || [];
      if (res.content) {
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } else {
        setTotalPages(1);
        setTotalElements(deptsList.length);
      }

      // Fetch live rooms from backend
      let roomsBackend: any[] = [];
      try {
        const res = await apiFetch<any>("/admin/rooms", {
          headers: hdr,
          params: { page: 0, size: 1000 },
        });
        roomsBackend = res?.content || res || [];
      } catch (err) {
        console.warn("Failed to load rooms from backend", err);
      }

      // Fetch live doctors from backend
      let doctorsBackend: any[] = [];
      try {
        const res = await apiFetch<any>("/admin/doctors", {
          headers: hdr,
          params: { page: 0, size: 1000 },
        });
        doctorsBackend = res?.content || res || [];
        setDoctors(doctorsBackend);
      } catch (err) {
        console.warn("Failed to load doctors from backend", err);
      }

      // Fetch live patients count
      let parsedPatients: any[] = [];
      try {
        const res = await apiFetch<any>("/reception/patients", {
          headers: hdr,
          params: { page: 0, size: 1000 },
        });
        parsedPatients = res?.content || (Array.isArray(res) ? res : []);
        setTotalPatientsCount(parsedPatients.length);
      } catch (err) {
        console.warn("Failed to load patients from backend", err);
      }

      // Fetch appointments to link patients to departments via their doctor
      let parsedAppointments: any[] = [];
      try {
        const res = await apiFetch<any>("/reception/appointments", {
          headers: hdr,
          params: { page: 0, size: 1000 },
        });
        parsedAppointments = res?.content || (Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn("Failed to load appointments from backend", err);
      }

      const updatedDepts: Department[] = deptsList.map((d: any) => {
        const docCount = doctorsBackend.filter(
          (doc) => String(doc.departmentId) === String(d.id),
        ).length;
        const roomCount = roomsBackend.filter(
          (room) => String(room.departmentId) === String(d.id),
        ).length;

        // Find all doctor codes/ids for this department
        const deptDoctors = doctorsBackend.filter(
          (doc) => String(doc.departmentId) === String(d.id)
        );
        const deptDoctorKeys = new Set([
          ...deptDoctors.map((doc) => String(doc.id)),
          ...deptDoctors.map((doc) => String(doc.doctorCode)).filter(Boolean),
        ]);

        // Count unique patients who have an appointment with any doctor in this dept
        const deptPatientNos = new Set(
          parsedAppointments
            .filter((app) => deptDoctorKeys.has(String(app.doctorId)))
            .map((app) => app.patientNo)
        );
        const patientCount = deptPatientNos.size;

        return {
          id: String(d.id),
          name: d.name,
          head: d.description || "Not Assigned",
          doctors: docCount,
          patients: patientCount,
          rooms: roomCount || Number(d.rooms) || 10,
          status: d.isActive ? "Active" : "Full",
        };
      });

      setDepartments(updatedDepts);
    } catch (err) {
      console.error(
        "Failed to load departments data dynamically from backend",
        err,
      );
      setDepartments([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.hospitalCode]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(d: Department) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      head: d.head,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;

    // Check if department name already exists locally (case-insensitive)
    const isDuplicate = departments.some(
      (d) =>
        d.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
        d.id !== editingId
    );
    if (isDuplicate) {
      toast.error("Department name already exists in this hospital!");
      return;
    }

    const hdr = { "X-Hospital-Code": user?.hospitalCode || "HSP001" };

    try {
      const code =
        form.name.substring(0, 4).toUpperCase() +
        Date.now().toString().slice(-4);
      const body = {
        name: form.name,
        code,
        description: form.head,
      };

      if (editingId) {
        await apiFetch(`/admin/departments/${editingId}`, {
          method: "PUT",
          headers: hdr,
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/admin/departments", {
          method: "POST",
          headers: hdr,
          body: JSON.stringify(body),
        });
      }

      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchAllData();
      toast.success("Department saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save department");
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/admin/departments/${id}`, {
        method: "DELETE",
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });
      setDeleteId(null);
      fetchAllData();
      toast.success("Department removed successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove department");
    }
  }

  return (
    <div className="space-y-6" data-ocid="admin.departments.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Departments
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {departments.length} active departments ·{" "}
            {totalPatientsCount} total patients
          </p>
        </div>
        <Button
          data-ocid="admin.departments.add_button"
          onClick={openAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Departments",
            value: departments.length,
            color: "text-primary",
          },
          {
            label: "Total Doctors",
            value: departments.reduce((s, d) => s + d.doctors, 0),
            color: "text-accent",
          },
          {
            label: "Total Patients",
            value: totalPatientsCount,
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-elevated rounded-xl p-4 text-center shadow-glass-sm"
          >
            <p className={`text-2xl font-bold font-display ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Department cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {departments.map((dept, i) => {
          const IconComp = DEPT_ICONS[dept.name] ?? Activity;
          const gradient =
            DEPT_COLORS[dept.name] ??
            "from-primary/20 to-primary/10 border-primary/30";
          const iconColor = ICON_COLORS[dept.name] ?? "text-primary";
          return (
            <div
              key={dept.id}
              data-ocid={`admin.departments.item.${i + 1}`}
              className={`glass-elevated rounded-xl p-5 shadow-glass-sm bg-gradient-to-br border ${gradient} transition-smooth hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background/40 flex items-center justify-center">
                    <IconComp className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground font-display">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Head: {dept.head || "Not Assigned"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border ${dept.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}
                >
                  {dept.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Doctors", value: dept.doctors, icon: Stethoscope },
                  { label: "Patients", value: dept.patients, icon: Users },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-background/20 rounded-lg p-2.5 text-center"
                  >
                    <stat.icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground font-display">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid={`admin.departments.edit_button.${i + 1}`}
                  onClick={() => openEdit(dept)}
                  className="flex-1 text-xs border-border hover:border-primary hover:text-primary"
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid={`admin.departments.delete_button.${i + 1}`}
                  onClick={() => setDeleteId(dept.id)}
                  className="flex-1 text-xs border-border hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="admin.departments.dialog"
          className="max-w-4xl w-[92vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-8 rounded-2xl animate-fade-in"
        >
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
              <Plus className="w-6 h-6 text-orange-600" />
              {editingId ? "Edit Department Details" : "Add Department Profile"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-6">
              <div className="space-y-1.5 col-span-1">
                <Label
                  className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block"
                  htmlFor="dept-name"
                >
                  Department Name
                </Label>
                <Input
                  id="dept-name"
                  data-ocid="admin.departments.name.input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Radiology"
                  className="h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <Label
                  className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block"
                  htmlFor="dept-head"
                >
                  Head Physician
                </Label>
                <Select
                  value={form.head || "Not Assigned"}
                  onValueChange={(v) => setForm({ ...form, head: v })}
                >
                  <SelectTrigger
                    id="dept-head"
                    data-ocid="admin.departments.head.select"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <SelectValue placeholder="Select Head Physician" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200">
                    <SelectItem value="Not Assigned">Not Assigned</SelectItem>
                    {doctors
                      .filter((doc) => String(doc.departmentId) === editingId)
                      .map((doc) => {
                        const name = `Dr. ${doc.firstName} ${doc.lastName}`;
                        return (
                          <SelectItem key={doc.id} value={name}>
                            {name}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
              <Button
                type="button"
                variant="outline"
                data-ocid="admin.departments.cancel_button"
                className="h-11 px-6 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                data-ocid="admin.departments.submit_button"
                onClick={handleSave}
                className="h-11 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
              >
                {editingId ? "Save Changes" : "Create Department"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent
          data-ocid="admin.departments.confirm_dialog"
          className="bg-white border border-slate-300 shadow-2xl text-slate-900 p-6 rounded-2xl animate-fade-in max-w-md"
        >
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-xl font-extrabold text-rose-600 tracking-tight flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Remove Department
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 text-sm mt-4 font-medium leading-relaxed">
            Removing a department will not delete associated doctors or
            patients. This action is reversible by re-adding the department.
          </p>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.departments.delete_cancel_button"
              className="h-10 px-4 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="admin.departments.confirm_button"
              className="h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-lg shadow-rose-600/20"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

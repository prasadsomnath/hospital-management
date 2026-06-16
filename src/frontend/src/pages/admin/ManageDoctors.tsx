import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
const MOCK_DEPARTMENTS: any[] = [];
const MOCK_DOCTORS: any[] = [];
import type { Doctor } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  Edit2,
  Eye,
  FileText,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UploadCloud,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Busy: "bg-accent/20 text-accent border-accent/30",
  "On Leave": "bg-destructive/20 text-destructive border-destructive/30",
};

type FormState = {
  name: string;
  specialty: string;
  department: string;
  phone: string;
  email: string;
  license: string;
  experience: string;
  isHeadPhysician: boolean;
  password?: string;
  documentPdf?: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  specialty: "",
  department: "",
  phone: "",
  email: "",
  license: "",
  experience: "",
  isHeadPhysician: false,
  password: "",
  documentPdf: "",
};

export default function ManageDoctors() {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await apiFetch<any>("/admin/departments", {
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
          },
        });
        const depts = res.content || res || [];
        setDepartments(depts);
      } catch (e) {
        console.error("Failed to fetch departments from backend", e);
        const saved = localStorage.getItem("medicore-departments");
        if (saved) {
          setDepartments(JSON.parse(saved));
        } else {
          setDepartments(MOCK_DEPARTMENTS);
        }
      }
    };
    fetchDepts();
  }, [user?.hospitalCode]);

  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load doctors from backend
  const fetchDoctors = async () => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);
      const res = await apiFetch<any>("/admin/doctors", {
        params: { page: 0, size: 1000 },
        headers: {
          "X-Hospital-Code": user.hospitalCode,
          "X-Hospital-Id": user.hospitalId || "1",
        },
      });

      const doctorsList = Array.isArray(res) ? res : res?.content || [];
      setTotalPages(Array.isArray(res) ? 1 : res?.totalPages || 0);
      setTotalElements(
        Array.isArray(res) ? res.length : res?.totalElements || 0,
      );

      // Fetch appointments to count unique patients per doctor
      let appointments: any[] = [];
      try {
        const apptRes = await apiFetch<any>("/reception/appointments", {
          headers: { "X-Hospital-Code": user.hospitalCode },
          params: { page: 0, size: 1000 },
        });
        appointments = apptRes?.content || (Array.isArray(apptRes) ? apptRes : []);
      } catch (err) {
        console.warn("Failed to load appointments for patient count", err);
      }

      // Build map: doctorId/doctorCode → unique patient nos
      const doctorPatientMap = new Map<string, Set<string>>();
      for (const appt of appointments) {
        const key = String(appt.doctorId);
        if (!doctorPatientMap.has(key)) doctorPatientMap.set(key, new Set());
        if (appt.patientNo) doctorPatientMap.get(key)!.add(appt.patientNo);
      }

      const mapped = doctorsList.map((doc: any): Doctor => {
        // Match appointment doctorId against both doc.id and doc.doctorCode
        const patientSet = new Set<string>();
        for (const [key, pats] of doctorPatientMap.entries()) {
          if (key === String(doc.id) || (doc.doctorCode && key === String(doc.doctorCode))) {
            pats.forEach((p) => patientSet.add(p));
          }
        }
        return {
          id: String(doc.id),
          name: `Dr. ${doc.firstName} ${doc.lastName}`,
          specialty: doc.specialization || "General Medicine",
          department: doc.departmentName || "Cardiology",
          phone: doc.mobile || "N/A",
          email: doc.email,
          status: doc.isActive ? "Active" : "On Leave",
          patients: patientSet.size,
          experience: doc.experience ?? 5,
          isHeadPhysician: doc.isHeadPhysician ?? false,
          licenseNumber: doc.licenseNumber,
          documentPdf: doc.documentPdf || "",
        };
      });

      setDoctors(mapped);
      localStorage.setItem("medicore-doctors", JSON.stringify(mapped));
    } catch (e: any) {
      console.error("Backend fetch failed, using local/mock fallback:", e);
      const saved = localStorage.getItem("medicore-doctors");
      if (saved) {
        setDoctors(JSON.parse(saved));
      } else {
        setDoctors(MOCK_DOCTORS);
        localStorage.setItem("medicore-doctors", JSON.stringify(MOCK_DOCTORS));
      }
      setTotalPages(1);
      setTotalElements(MOCK_DOCTORS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [user?.hospitalCode]);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // States for PDF document upload & inline viewer
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [editPdfFileName, setEditPdfFileName] = useState<string>("");
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");

  const openPdfViewer = (base64Data: string, title = "Document Preview") => {
    setPdfViewerUrl(base64Data);
    setPdfViewerTitle(title);
    setPdfViewerOpen(true);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file only.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setForm((prev) => ({ ...prev, documentPdf: base64 }));
      if (editingId) {
        setEditPdfFileName(file.name);
      } else {
        setPdfFileName(file.name);
      }
      toast.success(`PDF "${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered;

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPdfFileName("");
    setEditPdfFileName("");
    setDialogOpen(true);
  }

  function openEdit(doc: Doctor) {
    setEditingId(doc.id);
    const matchingDept = departments.find(
      (d) => d.name.toLowerCase() === doc.department.toLowerCase(),
    );
    setForm({
      name: doc.name.replace(/^Dr\.\s+/i, ""),
      specialty: doc.specialty,
      department: matchingDept ? String(matchingDept.id) : "",
      phone: doc.phone,
      email: doc.email,
      license: doc.licenseNumber || `LIC-${doc.id.toUpperCase()}`,
      experience: String(doc.experience),
      isHeadPhysician: doc.isHeadPhysician ?? false,
      password: "",
      documentPdf: doc.documentPdf || "",
    });
    setEditPdfFileName(doc.documentPdf ? "Credentials Document.pdf" : "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      const nameParts = form.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "Dr.";
      const lastName = nameParts.slice(1).join(" ") || "Doctor";

      const body = {
        firstName,
        lastName,
        email: form.email,
        mobile: form.phone || "8008818024",
        password: editingId
          ? form.password || undefined
          : form.password || "password",
        specialization: form.specialty || "General Medicine",
        departmentId: Number(form.department) || null,
        consultationFee: 250.0,
        isHeadPhysician: form.isHeadPhysician,
        experience: Number(form.experience) || 5,
        licenseNumber: form.license,
        documentPdf: form.documentPdf,
      };

      if (editingId) {
        await apiFetch(`/admin/doctors/${editingId}`, {
          method: "PUT",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Hospital-Id": user?.hospitalId || "1",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
          body: JSON.stringify(body),
        });

        if (form.password && form.password.trim() !== "") {
          await apiFetch(
            `/auth/internal/users/password?email=${encodeURIComponent(form.email)}&password=${encodeURIComponent(form.password)}`,
            {
              method: "POST",
            },
          );
        }

        // Sync with local mock credentials registry
        try {
          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          const mockCreds = mockCredsStr ? JSON.parse(mockCredsStr) : [];
          const existingIdx = mockCreds.findIndex(
            (c: any) => c.email.toLowerCase() === form.email.toLowerCase(),
          );
          if (existingIdx > -1) {
            mockCreds[existingIdx].name = `Dr. ${form.name}`;
            mockCreds[existingIdx].mobile = form.phone;
            if (form.password && form.password.trim() !== "") {
              mockCreds[existingIdx].password = form.password;
            }
          } else {
            mockCreds.push({
              email: form.email,
              password: form.password || "password",
              role: "doctor",
              name: `Dr. ${form.name}`,
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

        toast.success("Doctor details updated successfully");
      } else {
        await apiFetch("/admin/doctors", {
          method: "POST",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Hospital-Id": user?.hospitalId || "1",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
          body: JSON.stringify(body),
        });

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
            role: "doctor",
            name: `Dr. ${form.name}`,
            hospitalCode: user?.hospitalCode || "HSP001",
            hospitalId: user?.hospitalId || "1",
            entityId: `DOC-${Date.now().toString().substring(5)}`,
            mobile: form.phone || "8008818024",
          });
          localStorage.setItem(
            "mock-user-credentials",
            JSON.stringify(updatedCreds),
          );
        } catch (e) {
          console.error("Failed to sync mock credentials on registration", e);
        }

        toast.success("Doctor registered successfully on backend!");
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchDoctors();
    } catch (e: any) {
      console.error(e);
      const isMock = getCookie("auth-token") === "dev-mock-token";
      if (
        isMock ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("Failed to execute")
      ) {
        // Local Fallback for offline testing
        try {
          const savedDocsStr =
            localStorage.getItem("medicore-doctors") ||
            JSON.stringify(MOCK_DOCTORS);
          let savedDocs = JSON.parse(savedDocsStr);

          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          const mockCreds = mockCredsStr ? JSON.parse(mockCredsStr) : [];
          if (editingId) {
            savedDocs = savedDocs.map((d: any) => {
              if (d.id === editingId) {
                const deptObj = departments.find(
                  (dept) => String(dept.id) === form.department,
                );
                return {
                  ...d,
                  name: `Dr. ${form.name}`,
                  specialty: form.specialty,
                  department: deptObj ? deptObj.name : "Cardiology",
                  phone: form.phone,
                  email: form.email,
                  experience: Number(form.experience) || 5,
                  isHeadPhysician: form.isHeadPhysician,
                  licenseNumber: form.license,
                  documentPdf: form.documentPdf,
                };
              }
              return d;
            });
            localStorage.setItem("medicore-doctors", JSON.stringify(savedDocs));

            const existingIdx = mockCreds.findIndex(
              (c: any) => c.email.toLowerCase() === form.email.toLowerCase(),
            );
            if (existingIdx > -1) {
              mockCreds[existingIdx].name = `Dr. ${form.name}`;
              mockCreds[existingIdx].mobile = form.phone;
              if (form.password && form.password.trim() !== "") {
                mockCreds[existingIdx].password = form.password;
              }
            } else {
              mockCreds.push({
                email: form.email,
                password: form.password || "password",
                role: "doctor",
                name: `Dr. ${form.name}`,
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
            const newEntityId = `DOC-LOCAL-${Date.now().toString().substring(5)}`;
            const deptObj = departments.find(
              (dept) => String(dept.id) === form.department,
            );
            savedDocs.push({
              id: newEntityId,
              name: `Dr. ${form.name}`,
              specialty: form.specialty,
              department: deptObj ? deptObj.name : "Cardiology",
              phone: form.phone,
              email: form.email,
              status: "Active",
              patients: 0,
              experience: Number(form.experience) || 5,
              isHeadPhysician: form.isHeadPhysician,
              licenseNumber: form.license,
              documentPdf: form.documentPdf,
            });
            localStorage.setItem("medicore-doctors", JSON.stringify(savedDocs));

            const updatedCreds = mockCreds.filter(
              (c: any) => c.email.toLowerCase() !== form.email.toLowerCase(),
            );
            updatedCreds.push({
              email: form.email,
              password: form.password || "password",
              role: "doctor",
              name: `Dr. ${form.name}`,
              hospitalCode: user?.hospitalCode || "HSP001",
              hospitalId: user?.hospitalId || "1",
              entityId: newEntityId,
              mobile: form.phone || "8008818024",
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
        fetchDoctors();
        return;
      }

      let userFriendlyMsg = e.message || "Failed to save doctor";
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
      } else if (
        userFriendlyMsg.includes("already registered in this hospital")
      ) {
        userFriendlyMsg =
          "This email is already registered to a doctor in this hospital.";
      }
      toast.error(userFriendlyMsg);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/admin/doctors/${id}`, {
        method: "DELETE",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.email || user?.id || "Admin",
        },
      });
      toast.success("Doctor deleted successfully!");
      setDeleteId(null);
      fetchDoctors();
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
          const savedDocsStr = localStorage.getItem("medicore-doctors");
          if (savedDocsStr) {
            const savedDocs = JSON.parse(savedDocsStr);
            const updatedDocs = savedDocs.filter((d: any) => d.id !== id);
            localStorage.setItem(
              "medicore-doctors",
              JSON.stringify(updatedDocs),
            );
          }

          const mockCredsStr = localStorage.getItem("mock-user-credentials");
          if (mockCredsStr) {
            const mockCreds = JSON.parse(mockCredsStr);
            const docToDelete = doctors.find((d) => d.id === id);
            if (docToDelete) {
              const updatedCreds = mockCreds.filter(
                (c: any) =>
                  c.email.toLowerCase() !== docToDelete.email.toLowerCase(),
              );
              localStorage.setItem(
                "mock-user-credentials",
                JSON.stringify(updatedCreds),
              );
            }
          }
        } catch (err) {
          console.error(
            "Failed to delete mock credentials on local fallback",
            err,
          );
        }
        toast.success("Doctor deleted successfully!");
        setDeleteId(null);
        fetchDoctors();
        return;
      }
      toast.error(e.message || "Failed to delete doctor");
    }
  }

  async function handleUpdateStatus(id: string, activate: boolean) {
    try {
      await apiFetch(`/admin/doctors/${id}/status?isActive=${activate}`, {
        method: "PATCH",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.email || user?.id || "Admin",
        },
      });
      toast.success(
        activate
          ? "Doctor activated successfully!"
          : "Doctor set to on leave successfully!",
      );
      fetchDoctors();
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
          const savedDocsStr = localStorage.getItem("medicore-doctors");
          if (savedDocsStr) {
            const savedDocs = JSON.parse(savedDocsStr);
            const updatedDocs = savedDocs.map((d: any) =>
              d.id === id
                ? { ...d, status: activate ? "Active" : "On Leave" }
                : d,
            );
            localStorage.setItem(
              "medicore-doctors",
              JSON.stringify(updatedDocs),
            );
          }
          toast.success(
            activate
              ? "Doctor activated successfully (offline)!"
              : "Doctor set to on leave successfully (offline)!",
          );
          setDoctors((prev) =>
            prev.map((d) =>
              d.id === id
                ? { ...d, status: activate ? "Active" : "On Leave" }
                : d,
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
    <div className="space-y-6" data-ocid="admin.doctors.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Manage Doctors
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {doctors.length} registered physicians across {departments.length}{" "}
            departments
          </p>
        </div>
        <Button
          data-ocid="admin.doctors.add_button"
          onClick={openAdd}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="admin.doctors.search_input"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name, specialty or department…"
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Table */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              {[
                "Doctor",
                "Specialty",
                "Department",
                "Phone",
                "Patients",
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
                  data-ocid="admin.doctors.empty_state"
                >
                  No doctors found matching your search.
                </td>
              </tr>
            )}
            {paginated.map((doc, i) => (
              <tr
                key={doc.id}
                data-ocid={`admin.doctors.item.${page * pageSize + i + 1}`}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
                        {doc.name}
                        {doc.isHeadPhysician && (
                          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0 font-medium">
                            Head Physician
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.experience} yrs exp.
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">
                  {doc.specialty}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {doc.department}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground font-mono">
                  {doc.phone}
                </td>
                <td className="px-5 py-4 text-sm text-right pr-8 text-foreground font-medium">
                  {doc.patients}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant="outline"
                    className={`text-xs border ${STATUS_STYLES[doc.status] ?? ""}`}
                  >
                    {doc.status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {doc.status === "On Leave" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`admin.doctors.activate_button.${page * pageSize + i + 1}`}
                        onClick={() => handleUpdateStatus(doc.id, true)}
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
                        title="Activate Doctor"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`admin.doctors.deactivate_button.${page * pageSize + i + 1}`}
                        onClick={() => handleUpdateStatus(doc.id, false)}
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                        title="Deactivate Doctor (On Leave)"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {doc.documentPdf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          openPdfViewer(
                            doc.documentPdf || "",
                            `${doc.name} Credentials PDF`,
                          )
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                        title="View Qualifications Document"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`admin.doctors.edit_button.${page * pageSize + i + 1}`}
                      onClick={() => openEdit(doc)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`admin.doctors.delete_button.${page * pageSize + i + 1}`}
                      onClick={() => setDeleteId(doc.id)}
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

        {/* Pagination */}
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
          data-ocid="admin.doctors.dialog"
          className="bg-card border-border max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Doctor" : "Add New Doctor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="doc-name">Full Name</Label>
                <Input
                  id="doc-name"
                  data-ocid="admin.doctors.name.input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. Jane Smith"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-specialty">Specialty</Label>
                <Input
                  id="doc-specialty"
                  data-ocid="admin.doctors.specialty.input"
                  value={form.specialty}
                  onChange={(e) =>
                    setForm({ ...form, specialty: e.target.value })
                  }
                  placeholder="Cardiology"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-dept">Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v })}
                >
                  <SelectTrigger
                    data-ocid="admin.doctors.department.select"
                    className="w-full bg-background border-border"
                  >
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-phone">Phone</Label>
                <PhoneInput
                  id="doc-phone"
                  data-ocid="admin.doctors.phone.input"
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-exp">Experience (yrs)</Label>
                <Input
                  id="doc-exp"
                  type="number"
                  data-ocid="admin.doctors.experience.input"
                  value={form.experience}
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                  placeholder="5"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="doc-email">Email</Label>
                <Input
                  id="doc-email"
                  type="email"
                  disabled={!!editingId}
                  data-ocid="admin.doctors.email.input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="doctor@medicore.com"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="doc-password">Password</Label>
                <Input
                  id="doc-password"
                  type="password"
                  data-ocid="admin.doctors.password.input"
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
                <Label htmlFor="doc-license">License Number</Label>
                <Input
                  id="doc-license"
                  data-ocid="admin.doctors.license.input"
                  value={form.license}
                  onChange={(e) =>
                    setForm({ ...form, license: e.target.value })
                  }
                  placeholder="MD-12345"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-head-physician">Head Physician?</Label>
                <Select
                  value={form.isHeadPhysician ? "true" : "false"}
                  onValueChange={(v) =>
                    setForm({ ...form, isHeadPhysician: v === "true" })
                  }
                >
                  <SelectTrigger
                    data-ocid="admin.doctors.head_physician.select"
                    className="w-full bg-background border-border"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="doc-pdf">
                  Credentials / Qualification Document (PDF)
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                      id="doc-pdf-upload"
                    />
                    <label
                      htmlFor="doc-pdf-upload"
                      className="flex items-center justify-center gap-2 bg-muted/20 hover:bg-muted/40 border border-dashed border-border text-foreground text-sm h-10 rounded-xl cursor-pointer transition-all w-full"
                    >
                      <UploadCloud className="w-4 h-4 text-muted-foreground" />
                      {editingId ? (
                        editPdfFileName ? (
                          <span className="truncate max-w-[200px] text-accent font-semibold">
                            {editPdfFileName}
                          </span>
                        ) : (
                          "Upload Qualifications PDF"
                        )
                      ) : pdfFileName ? (
                        <span className="truncate max-w-[200px] text-accent font-semibold">
                          {pdfFileName}
                        </span>
                      ) : (
                        "Upload Qualifications PDF"
                      )}
                    </label>
                  </div>
                  {form.documentPdf && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        openPdfViewer(
                          form.documentPdf || "",
                          `${form.name || "Doctor"} Qualifications PDF`,
                        )
                      }
                      className="border-border text-foreground hover:bg-muted rounded-xl h-10 px-4 bg-transparent shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-2 text-primary" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="admin.doctors.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                data-ocid="admin.doctors.submit_button"
                onClick={handleSave}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {editingId ? "Save Changes" : "Add Doctor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent
          data-ocid="admin.doctors.confirm_dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Remove Doctor</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to remove this doctor from the system? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.doctors.delete_cancel_button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="admin.doctors.confirm_button"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove Doctor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic PDF Document Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] bg-card border border-border text-foreground rounded-3xl shadow-lg p-6 flex flex-col">
          <DialogHeader className="pb-4 border-b border-border/60">
            <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {pdfViewerTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Inline PDF viewer for doctor credential documents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 w-full mt-4 rounded-2xl overflow-hidden border border-border/80 bg-muted/20">
            {pdfViewerUrl ? (
              <iframe
                src={pdfViewerUrl}
                className="w-full h-full border-none"
                title={pdfViewerTitle}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No PDF content loaded.
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button
              type="button"
              onClick={() => setPdfViewerOpen(false)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6 font-semibold"
            >
              Close Viewer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

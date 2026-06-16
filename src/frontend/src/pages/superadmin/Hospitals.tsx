import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { PaginationControl } from "@/components/ui/pagination-control";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Eye,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  Settings,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground border-border",
};

export default function Hospitals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedHospitalForAdmins, setSelectedHospitalForAdmins] = useState<
    any | null
  >(null);
  const [isAdminsDialogOpen, setIsAdminsDialogOpen] = useState(false);
  const [selectedHospitalForDetails, setSelectedHospitalForDetails] = useState<
    any | null
  >(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [formData, setFormData] = useState({
    hospitalCode: "",
    hospitalName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    address: "",
    documentPdf: "",
  });

  const [editFormData, setEditFormData] = useState({
    hospitalCode: "",
    hospitalName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    address: "",
    documentPdf: "",
  });

  // State for tracking PDF uploads
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [editPdfFileName, setEditPdfFileName] = useState<string>("");

  // States for PDF inline modal viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");

  const openPdfViewer = (base64Data: string, title = "Document Preview") => {
    setPdfViewerUrl(base64Data);
    setPdfViewerTitle(title);
    setPdfViewerOpen(true);
  };

  const handlePdfChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false,
  ) => {
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
      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, documentPdf: base64 }));
        setEditPdfFileName(file.name);
      } else {
        setFormData((prev) => ({ ...prev, documentPdf: base64 }));
        setPdfFileName(file.name);
      }
      toast.success(`PDF "${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const loadHospitals = async (currentPage = page, size = pageSize) => {
    try {
      setIsLoading(true);
      const [hospitalsRes, adminsRes] = await Promise.all([
        apiFetch<any>("/super-admin/hospitals", {
          params: { page: currentPage, size },
        }),
        apiFetch<any>("/super-admin/hospital-admins", {
          params: { page: 0, size: 1000 },
        }),
      ]);
      setHospitals(hospitalsRes.content || []);
      setTotalPages(hospitalsRes.totalPages || 0);
      setTotalElements(hospitalsRes.totalElements || 0);
      setAdmins(adminsRes.content || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load hospitals and admins data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals(page, pageSize);
  }, [page, pageSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hospitals.some((h) => h.phone === formData.phone)) {
      toast.error("Phone number already exists");
      return;
    }
    try {
      await apiFetch("/super-admin/hospitals", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Hospital registered successfully!");
      setIsOpen(false);
      setFormData({
        hospitalCode: "",
        hospitalName: "",
        registrationNumber: "",
        email: "",
        phone: "",
        address: "",
        documentPdf: "",
      });
      setPdfFileName("");
      loadHospitals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to register hospital");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      hospitals.some(
        (h) =>
          h.phone === editFormData.phone &&
          h.hospitalCode !== editFormData.hospitalCode
      )
    ) {
      toast.error("Phone number already exists");
      return;
    }
    try {
      await apiFetch(
        `/super-admin/hospitals/code/${editFormData.hospitalCode}`,
        {
          method: "PUT",
          body: JSON.stringify(editFormData),
        },
      );
      toast.success("Hospital details updated successfully!");
      setIsEditOpen(false);
      loadHospitals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update hospital details");
    }
  };

  const handleToggleStatus = async (hospital: any) => {
    const newStatus = hospital.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiFetch(
        `/super-admin/hospitals/code/${hospital.hospitalCode}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      toast.success(
        `Hospital ${hospital.hospitalName} ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully!`,
      );
      loadHospitals();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message || `Failed to modify status for ${hospital.hospitalName}`,
      );
    }
  };

  const handleDeleteHospital = async (hospital: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete hospital "${hospital.hospitalName}" (${hospital.hospitalCode})? This will deactivate associated administrators and login credentials immediately.`,
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/super-admin/hospitals/${hospital.id}`, {
        method: "DELETE",
      });
      toast.success("Hospital successfully deleted!");
      loadHospitals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete hospital");
    }
  };

  const handleOpenEdit = (hospital: any) => {
    setEditFormData({
      hospitalCode: hospital.hospitalCode,
      hospitalName: hospital.hospitalName,
      registrationNumber: hospital.registrationNumber,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      documentPdf: hospital.documentPdf || "",
    });
    setEditPdfFileName(
      hospital.documentPdf ? "Current Registration Document.pdf" : "",
    );
    setIsEditOpen(true);
  };

  const filtered = hospitals.filter(
    (h) =>
      h.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      h.hospitalCode.toLowerCase().includes(search.toLowerCase()) ||
      (h.address && h.address.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Hospitals
          </h1>
          <p className="text-muted-foreground mt-0.5">
            Manage all registered hospital accounts in the multi-tenant system
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              data-ocid="super-admin.hospitals.add_button"
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Hospital
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-background border border-border text-foreground rounded-3xl shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-foreground">
                Add New Hospital
              </DialogTitle>
              <DialogDescription className="sr-only">
                Provide the details to register a new hospital tenant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Hospital Code
                </label>
                <Input
                  required
                  placeholder="e.g. HSP001"
                  value={formData.hospitalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, hospitalCode: e.target.value })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Hospital Name
                </label>
                <Input
                  required
                  placeholder="e.g. St. Jude General Hospital"
                  value={formData.hospitalName}
                  onChange={(e) =>
                    setFormData({ ...formData, hospitalName: e.target.value })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Registration Number
                </label>
                <Input
                  required
                  placeholder="e.g. REG-88771"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationNumber: e.target.value,
                    })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="contact@hospital.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </label>
                  <PhoneInput
                    required
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Address
                </label>
                <Input
                  required
                  placeholder="Street address, City, State"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Registration / License Document (PDF)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handlePdfChange(e, false)}
                      className="hidden"
                      id="hospital-pdf-upload"
                    />
                    <label
                      htmlFor="hospital-pdf-upload"
                      className="flex items-center justify-center gap-2 bg-muted/40 hover:bg-muted/60 border border-dashed border-border text-foreground text-sm h-11 rounded-xl cursor-pointer transition-all"
                    >
                      <UploadCloud className="w-4 h-4 text-muted-foreground" />
                      {pdfFileName ? (
                        <span className="truncate max-w-[200px] text-accent font-semibold">
                          {pdfFileName}
                        </span>
                      ) : (
                        "Upload Registration PDF"
                      )}
                    </label>
                  </div>
                  {formData.documentPdf && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        openPdfViewer(
                          formData.documentPdf,
                          `${formData.hospitalName || "Hospital"} Registration PDF`,
                        )
                      }
                      className="border-border text-foreground hover:bg-muted rounded-xl h-11 px-4 bg-transparent shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-2 text-primary" />
                      Preview
                    </Button>
                  )}
                </div>
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
                  Register Hospital
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Controlled Edit Hospital Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-xl bg-background border border-border text-foreground rounded-3xl shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display text-foreground">
                Edit Hospital Details
              </DialogTitle>
              <DialogDescription className="sr-only">
                Update the details of this hospital tenant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  Hospital Code
                </label>
                <Input
                  required
                  disabled
                  value={editFormData.hospitalCode}
                  className="bg-muted/30 border-border text-muted-foreground h-11 rounded-xl focus:ring-accent/20 focus:border-accent cursor-not-allowed opacity-70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Hospital Name
                </label>
                <Input
                  required
                  placeholder="e.g. St. Jude General Hospital"
                  value={editFormData.hospitalName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      hospitalName: e.target.value,
                    })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Registration Number
                </label>
                <Input
                  required
                  placeholder="e.g. REG-88771"
                  value={editFormData.registrationNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      registrationNumber: e.target.value,
                    })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="contact@hospital.com"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </label>
                  <PhoneInput
                    required
                    value={editFormData.phone}
                    onChange={(val) =>
                      setEditFormData({ ...editFormData, phone: val })
                    }
                    className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Address
                </label>
                <Input
                  required
                  placeholder="Street address, City, State"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      address: e.target.value,
                    })
                  }
                  className="bg-muted/40 border-border text-foreground h-11 rounded-xl placeholder:text-muted-foreground/60 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Registration / License Document (PDF)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handlePdfChange(e, true)}
                      className="hidden"
                      id="edit-hospital-pdf-upload"
                    />
                    <label
                      htmlFor="edit-hospital-pdf-upload"
                      className="flex items-center justify-center gap-2 bg-muted/40 hover:bg-muted/60 border border-dashed border-border text-foreground text-sm h-11 rounded-xl cursor-pointer transition-all"
                    >
                      <UploadCloud className="w-4 h-4 text-muted-foreground" />
                      {editPdfFileName ? (
                        <span className="truncate max-w-[200px] text-accent font-semibold">
                          {editPdfFileName}
                        </span>
                      ) : (
                        "Upload Registration PDF"
                      )}
                    </label>
                  </div>
                  {editFormData.documentPdf && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        openPdfViewer(
                          editFormData.documentPdf,
                          `${editFormData.hospitalName} Registration PDF`,
                        )
                      }
                      className="border-border text-foreground hover:bg-muted rounded-xl h-11 px-4 bg-transparent shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-2 text-primary" />
                      Preview
                    </Button>
                  )}
                </div>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="super-admin.hospitals.search_input"
          placeholder="Search hospitals by name, code or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/30"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Retrieving multi-tenant hospitals list…
          </p>
        </div>
      ) : (
        <>
          {/* Hospital cards */}
          <div
            data-ocid="super-admin.hospitals.list"
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filtered.map((h, i) => (
              <Card
                key={h.id}
                data-ocid={`super-admin.hospitals.item.${i + 1}`}
                className="border-border hover:shadow-elevated transition-smooth group cursor-pointer"
                onClick={() => {
                  setSelectedHospitalForDetails(h);
                  setIsDetailsOpen(true);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug truncate max-w-[160px]">
                          {h.hospitalName}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          Code: {h.hospitalCode}
                        </p>
                        <div className="text-[11px] font-semibold text-muted-foreground mt-1.5 flex items-center gap-1.5 bg-muted/60 border border-border/60 px-2.5 py-0.5 rounded-full w-fit">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Admins:{" "}
                          {
                            admins.filter(
                              (a) => a.hospitalCode === h.hospitalCode,
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs border shrink-0 ${STATUS_COLORS[h.status] || STATUS_COLORS.ACTIVE}`}
                    >
                      {h.status || "ACTIVE"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{h.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {h.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{h.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {h.registrationNumber}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({
                            to: "/super-admin/admins",
                            search: { search: h.hospitalCode },
                          });
                        }}
                        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium transition-smooth"
                      >
                        <Users className="w-3.5 h-3.5" />
                        View Admins
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            data-ocid={`super-admin.hospitals.manage.${i + 1}.button`}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-smooth"
                          >
                            <Settings className="w-3.5 h-3.5 animate-spin-hover" />
                            Manage
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-popover border border-border text-popover-foreground rounded-2xl p-1.5 shadow-2xl"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHospitalForDetails(h);
                              setIsDetailsOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(h);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-foreground transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5 text-sky-500" />
                            Edit Hospital
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(h);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all ${h.status === "ACTIVE" ? "text-rose-500 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-600"}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {h.status === "ACTIVE"
                              ? "Deactivate Hospital"
                              : "Activate Hospital"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHospital(h);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-rose-500 hover:text-rose-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Hospital
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {!isLoading && filtered.length === 0 && (
        <div
          data-ocid="super-admin.hospitals.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">
            No active hospitals registered
          </p>
          <p className="text-sm mt-1">
            Add a new hospital to bootstrap the platform.
          </p>
        </div>
      )}

      {/* View Admins Dialog */}
      <Dialog open={isAdminsDialogOpen} onOpenChange={setIsAdminsDialogOpen}>
        <DialogContent className="max-w-lg bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Admins for {selectedHospitalForAdmins?.hospitalName}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Complete list of active and inactive administrators for this
              hospital code: {selectedHospitalForAdmins?.hospitalCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-1">
            {admins.filter(
              (a) => a.hospitalCode === selectedHospitalForAdmins?.hospitalCode,
            ).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No administrators registered for this hospital yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {admins
                  .filter(
                    (a) =>
                      a.hospitalCode ===
                      selectedHospitalForAdmins?.hospitalCode,
                  )
                  .map((admin) => (
                    <div
                      key={admin.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {admin.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {admin.email} • {admin.employeeId}
                        </p>
                        {admin.designation && (
                          <p className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md inline-block mt-1 font-mono">
                            {admin.designation}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${admin.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-rose-500/10 text-rose-700 border-rose-500/30"}`}
                      >
                        {admin.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button
              type="button"
              onClick={() => setIsAdminsDialogOpen(false)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Hospital Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Hospital Profile Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Complete registered information and system configuration for:{" "}
              {selectedHospitalForDetails?.hospitalCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Header info */}
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground leading-snug">
                  {selectedHospitalForDetails?.hospitalName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Code: {selectedHospitalForDetails?.hospitalCode}
                </p>
              </div>
            </div>

            {/* Fields list */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Registration Number
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedHospitalForDetails?.registrationNumber}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Contact Phone
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedHospitalForDetails?.phone}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Email Address
                </p>
                <p className="text-foreground mt-0.5 break-all font-medium">
                  {selectedHospitalForDetails?.email}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Office Address
                </p>
                <p className="text-foreground mt-0.5 font-medium">
                  {selectedHospitalForDetails?.address}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Onboarded Admins
                </p>
                <p className="text-foreground mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  {
                    admins.filter(
                      (a) =>
                        a.hospitalCode ===
                        selectedHospitalForDetails?.hospitalCode,
                    ).length
                  }{" "}
                  Admins
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  Account Status
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] mt-0.5 border shrink-0 ${STATUS_COLORS[selectedHospitalForDetails?.status] || STATUS_COLORS.ACTIVE}`}
                >
                  {selectedHospitalForDetails?.status || "ACTIVE"}
                </Badge>
              </div>
              <div className="col-span-2 pt-2 border-t border-border/60">
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-1.5">
                  Registration Document
                </p>
                {selectedHospitalForDetails?.documentPdf ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      openPdfViewer(
                        selectedHospitalForDetails.documentPdf,
                        `${selectedHospitalForDetails.hospitalName} Registration PDF`,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 border-border text-foreground hover:bg-muted rounded-xl h-10 bg-muted/10"
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    View Registration PDF Document
                  </Button>
                ) : (
                  <p className="text-muted-foreground italic text-xs">
                    No registration document uploaded.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6"
            >
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic PDF Document Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] bg-background border border-border text-foreground rounded-3xl shadow-lg p-6 flex flex-col">
          <DialogHeader className="pb-4 border-b border-border/60">
            <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {pdfViewerTitle}
            </DialogTitle>
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6"
            >
              Close Viewer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

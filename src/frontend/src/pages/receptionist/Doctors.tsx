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
import { PaginationControl } from "@/components/ui/pagination-control";
import { apiFetch } from "@/lib/api";
import type { Doctor } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  Search,
  Stethoscope,
  FileText,
  Mail,
  Phone,
  Award,
  Eye,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Busy: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "On Leave": "bg-destructive/15 text-destructive border-destructive/30",
};

export default function ReceptionistDoctors() {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);


  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");

  const fetchDoctors = async () => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);

      const docsRes = await apiFetch<any>("/admin/doctors", {
        params: { page: 0, size: 1000 },
        headers: {
          "X-Hospital-Code": user.hospitalCode,
          "X-Hospital-Id": user.hospitalId || "1",
        },
      });

      const doctorsList = Array.isArray(docsRes) ? docsRes : docsRes?.content || [];

      const mapped = doctorsList.map((doc: any): Doctor => ({
        id: String(doc.id),
        name: `Dr. ${doc.firstName} ${doc.lastName}`,
        specialty: doc.specialization || "General Medicine",
        department: doc.departmentName || doc.department || "General",
        phone: doc.mobile || "N/A",
        email: doc.email || "—",
        status: doc.isActive ? "Active" : "On Leave",
        patients: 0,
        experience: doc.experience ?? 0,
        isHeadPhysician: doc.isHeadPhysician ?? false,
        licenseNumber: doc.licenseNumber || "N/A",
        documentPdf: doc.documentPdf || "",
        consultationFee: doc.consultationFee ?? 250,
      }));

      setDoctors(mapped);
    } catch (e: any) {
      console.error("Failed to fetch doctors:", e);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [user?.hospitalCode]);

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase()),
  );

  const paginatedDoctors = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const openDetails = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setDetailOpen(true);
  };

  const openPdfViewer = (base64Data: string, title = "Document Preview") => {
    setPdfViewerUrl(base64Data);
    setPdfViewerTitle(title);
    setPdfViewerOpen(true);
  };

  return (
    <div className="space-y-6" data-ocid="receptionist.doctors.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Hospital Doctors
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          View and contact physicians currently registered in your hospital.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="receptionist.doctors.search_input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by doctor name, specialty, or department…"
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium text-right sm:text-left self-end sm:self-auto">
          Showing {filtered.length} registered doctors
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Fetching active physician catalog…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-elevated rounded-xl p-12 text-center text-muted-foreground border border-border/40">
          <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-bold text-foreground">No Doctors Found</h3>
          <p className="text-sm mt-1">
            We couldn't find any registered physicians matching your search in this hospital.
          </p>
        </div>
      ) : (
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  {[
                    "Doctor",
                    "Department",
                    "Specialty",
                    "Contact",
                    "Experience",
                    "OPD Fee",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedDoctors.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => openDetails(doc)}
                    className="hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    {/* Doctor name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {doc.name}
                            {doc.isHeadPhysician && (
                              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-1.5 py-0 font-medium">
                                Head
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            #{String(doc.id).slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {doc.department}
                        </span>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {doc.specialty}
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-mono text-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground/60" />
                          {doc.phone}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                          {doc.email}
                        </p>
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-foreground font-semibold">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {doc.experience} yrs
                      </div>
                    </td>

                    {/* OPD Fee */}
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">
                      ₹{doc.consultationFee}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_STYLES[doc.status] ?? ""}`}
                      >
                        {doc.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(doc)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="View Doctor Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="pt-4">
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

      {/* Doctor Details Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg w-[90vw] bg-card border border-border text-foreground rounded-3xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
          {selectedDoctor && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2 flex-wrap">
                      {selectedDoctor.name}
                      {selectedDoctor.isHeadPhysician && (
                        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
                          Head Physician
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      {selectedDoctor.specialty} • {selectedDoctor.department}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Highlights grid */}
              <div className="grid grid-cols-3 gap-3 bg-muted/20 border border-border/40 p-4 rounded-2xl">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Experience
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1 flex items-center justify-center gap-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    {selectedDoctor.experience} Yrs
                  </p>
                </div>
                <div className="text-center border-x border-border/40">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    OPD Fee
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    ₹{selectedDoctor.consultationFee}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Status
                  </p>
                  <p className="text-sm font-bold mt-1 flex items-center justify-center gap-1">
                    {selectedDoctor.status === "Active" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span
                      className={
                        selectedDoctor.status === "Active"
                          ? "text-emerald-500"
                          : "text-destructive"
                      }
                    >
                      {selectedDoctor.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Department & Specialty */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Department & Specialization
                </h4>
                <div className="glass-elevated p-4 rounded-xl border border-border/40 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Department
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      {selectedDoctor.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Specialization
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      {selectedDoctor.specialty}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      License No.
                    </p>
                    <p className="font-semibold font-mono text-foreground mt-1">
                      {selectedDoctor.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Consultation Fee
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      ₹{selectedDoctor.consultationFee}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="glass-elevated p-4 rounded-xl border border-border/40 space-y-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">
                        Phone Line
                      </p>
                      <p className="font-semibold text-foreground font-mono mt-0.5">
                        {selectedDoctor.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">
                        E-mail Address
                      </p>
                      <p className="font-semibold text-foreground mt-0.5 truncate">
                        {selectedDoctor.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credentials PDF */}
              {selectedDoctor.documentPdf && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Credentials & Certifications
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDetailOpen(false);
                      openPdfViewer(
                        selectedDoctor.documentPdf || "",
                        `${selectedDoctor.name} Verification Credentials`
                      );
                    }}
                    className="w-full justify-between items-center gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/45 rounded-xl h-12 px-4 transition-smooth"
                  >
                    <span className="flex items-center gap-2 font-bold text-xs">
                      <FileText className="w-4 h-4 text-primary" />
                      Verify Academic & License Documents
                    </span>
                    <span className="text-[10px] uppercase font-black text-primary tracking-widest">
                      View PDF
                    </span>
                  </Button>
                </div>
              )}

              {/* Close */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6 font-semibold"
                >
                  Close Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
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
              onClick={() => {
                setPdfViewerOpen(false);
                if (selectedDoctor) setDetailOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 px-6 font-semibold"
            >
              Back to Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Mail,
  Phone,
  Search,
  Stethoscope,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  Active:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Busy: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "On Leave": "bg-destructive/15 text-destructive border-destructive/30",
};

interface DoctorWithMetrics extends Doctor {
  patientsSeen: number;
  referredPatients: number;
  totalBilled: number;
  earnings: number;
}

export default function AdminDoctorAnalytics() {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<DoctorWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorWithMetrics | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");

  const fetchDoctors = async (currentPage = page, size = pageSize) => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);

      // Fetch doctors (paginated), and fetch patients, appointments, and bills in parallel (complete datasets)
      const [docsRes, patientsRes, appointmentsRes, billsRes] =
        await Promise.all([
          apiFetch<any>("/admin/doctors", {
            params: { page: currentPage, size },
            headers: {
              "X-Hospital-Code": user.hospitalCode,
              "X-Hospital-Id": user.hospitalId || "1",
            },
          }),
          apiFetch<any>("/reception/patients", {
            params: { size: 1000 },
            headers: {
              "X-Hospital-Code": user.hospitalCode,
            },
          }).catch(() => []),
          apiFetch<any>("/reception/appointments", {
            params: { size: 1000 },
            headers: {
              "X-Hospital-Code": user.hospitalCode,
            },
          }).catch(() => []),
          apiFetch<any>("/reception/bills", {
            params: { size: 1000 },
            headers: {
              "X-Hospital-Code": user.hospitalCode,
            },
          }).catch(() => []),
        ]);

      const doctorsList = Array.isArray(docsRes)
        ? docsRes
        : docsRes?.content || [];
      setTotalPages(Array.isArray(docsRes) ? 1 : docsRes?.totalPages || 0);
      setTotalElements(
        Array.isArray(docsRes) ? docsRes.length : docsRes?.totalElements || 0,
      );

      const patientsList = Array.isArray(patientsRes)
        ? patientsRes
        : patientsRes?.content || [];
      const apptsList = Array.isArray(appointmentsRes)
        ? appointmentsRes
        : appointmentsRes?.content || [];
      const billsList = Array.isArray(billsRes)
        ? billsRes
        : billsRes?.content || [];

      const mapped = doctorsList.map((doc: any): DoctorWithMetrics => {
        const docId = String(doc.id);
        const docName = `Dr. ${doc.firstName} ${doc.lastName}`;
        const docFirstName = doc.firstName.toLowerCase();
        const docLastName = (doc.lastName || "").toLowerCase();
        const docCode = (doc.code || "").toLowerCase();

        // 1. Completed Appointments (Patients Seen)
        const doctorAppts = apptsList.filter(
          (a: any) => String(a.doctorId) === docId,
        );
        const patientsSeen = doctorAppts.filter(
          (a: any) => a.status === "Completed",
        ).length;

        // 2. Referred Patients (patients referred to this doctor)
        const referredPatients = patientsList.filter((p: any) => {
          if (!p.referredBy) return false;
          const refLower = p.referredBy.toLowerCase();
          return (
            refLower.includes(docName.toLowerCase()) ||
            refLower.includes(
              `${doc.firstName.toLowerCase()} ${doc.lastName?.toLowerCase() || ""}`.trim(),
            ) ||
            (docLastName && refLower.includes(docLastName)) ||
            refLower.includes(docFirstName) ||
            (docCode && refLower.includes(docCode))
          );
        }).length;

        // 3. Total Billed — sum netAmount for bills of doctor's patients
        const patientNos = new Set(doctorAppts.map((a: any) => a.patientNo));
        const totalBilled = billsList
          .filter((b: any) => patientNos.has(b.patientNo))
          .reduce((sum: number, b: any) => sum + (b.netAmount ?? 0), 0);

        // 4. Doctor Earnings
        const consultationFee = doc.consultationFee ?? 250;
        const earnings = patientsSeen * consultationFee;

        return {
          id: docId,
          name: docName,
          specialty: doc.specialization || "General Medicine",
          department: doc.departmentName || "General Medicine",
          phone: doc.mobile || "N/A",
          email: doc.email,
          status: doc.isActive ? "Active" : "On Leave",
          patients: patientsSeen,
          experience: doc.experience ?? 5,
          isHeadPhysician: doc.isHeadPhysician ?? false,
          licenseNumber: doc.licenseNumber || "N/A",
          documentPdf: doc.documentPdf || "",
          consultationFee,
          patientsSeen,
          referredPatients,
          totalBilled,
          earnings,
        };
      });

      setDoctors(mapped);
    } catch (e: any) {
      console.error("DoctorAnalytics fetch failed:", e);
      setDoctors([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(page, pageSize);
  }, [user?.hospitalCode, page, pageSize]);

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase()),
  );

  // Summary totals
  const totalPatientsSeen = doctors.reduce((s, d) => s + d.patientsSeen, 0);
  const totalEarnings = doctors.reduce((s, d) => s + d.earnings, 0);
  const totalRevenue = doctors.reduce((s, d) => s + d.totalBilled, 0);
  const totalReferrals = doctors.reduce((s, d) => s + d.referredPatients, 0);

  const openDetails = (doc: DoctorWithMetrics) => {
    setSelectedDoctor(doc);
    setDetailOpen(true);
  };

  const openPdfViewer = (base64Data: string, title = "Document Preview") => {
    setPdfViewerUrl(base64Data);
    setPdfViewerTitle(title);
    setPdfViewerOpen(true);
  };

  return (
    <div className="space-y-6" data-ocid="admin.doctor-analytics.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Doctor Performance Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Practice metrics, earnings, and billing performance for all doctors in
          this hospital.
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Patients Seen",
              value: totalPatientsSeen.toLocaleString(),
              color: "text-foreground",
              bg: "bg-primary/5 border-primary/15",
            },
            {
              label: "Total Referrals",
              value: totalReferrals.toLocaleString(),
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/5 border-amber-500/15",
            },
            {
              label: "Total Patient Billings",
              value: `₹${totalRevenue.toLocaleString()}`,
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-500/5 border-emerald-500/15",
            },
            {
              label: "Total Doctor Earnings",
              value: `₹${totalEarnings.toLocaleString()}`,
              color: "text-indigo-600 dark:text-indigo-400",
              bg: "bg-indigo-500/5 border-indigo-500/15",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`glass-elevated rounded-xl p-4 border ${card.bg} space-y-1`}
            >
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                {card.label}
              </p>
              <p className={`text-2xl font-black font-mono ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="admin.doctor-analytics.search_input"
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
          Showing {filtered.length} of {totalElements} registered doctors
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading doctor performance data…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-elevated rounded-xl p-12 text-center text-muted-foreground border border-border/40">
          <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-bold text-foreground">No Doctors Found</h3>
          <p className="text-sm mt-1">
            We couldn't find any registered physicians matching your search in
            this hospital.
          </p>
        </div>
      ) : (
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-muted/30">
                <tr>
                  {[
                    "Doctor",
                    "Specialty & Dept",
                    "OPD Fee",
                    "Seen",
                    "Referred",
                    "Total Billed",
                    "Earnings",
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
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => openDetails(doc)}
                    className="hover:bg-muted/10 transition-colors cursor-pointer"
                  >
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
                                Head Physician
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.experience} yrs exp • {doc.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {doc.specialty}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {doc.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">
                      ₹{doc.consultationFee}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground font-mono">
                      {doc.patientsSeen}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground font-mono">
                      {doc.referredPatients}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{doc.totalBilled.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹{doc.earnings.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_STYLES[doc.status] ?? ""}`}
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td
                      className="px-5 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
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
      {!loading && totalPages > 1 && (
        <div className="pt-4">
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Doctor Details Modal Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl w-[90vw] bg-card border border-border text-foreground rounded-3xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
          {selectedDoctor && (
            <div className="space-y-6">
              {/* Header inside modal */}
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

              {/* Status and core highlights */}
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
                    License
                  </p>
                  <p className="text-sm font-semibold font-mono text-foreground mt-1 truncate px-1">
                    {selectedDoctor.licenseNumber}
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

              {/* Practice Summary Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Practice & Earnings Summary
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-elevated p-3.5 rounded-xl border border-border/40 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Total Patients Seen
                    </p>
                    <p className="text-2xl font-black text-foreground font-mono">
                      {selectedDoctor.patientsSeen}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Completed appointments
                    </p>
                  </div>
                  <div className="glass-elevated p-3.5 rounded-xl border border-border/40 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Referred Patients
                    </p>
                    <p className="text-2xl font-black text-foreground font-mono">
                      {selectedDoctor.referredPatients}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Referrals count
                    </p>
                  </div>
                  <div className="glass-elevated p-3.5 rounded-xl border border-border/40 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Total Patient Billings
                    </p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{selectedDoctor.totalBilled.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      All bill items for patients
                    </p>
                  </div>
                  <div className="glass-elevated p-3.5 rounded-xl border border-border/40 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      OPD Earnings
                    </p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹{selectedDoctor.earnings.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Seen × OPD Fee (₹{selectedDoctor.consultationFee})
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

              {/* Document Credentials view button */}
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
                        `${selectedDoctor.name} Verification Credentials`,
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

              {/* Actions */}
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
              onClick={() => {
                setPdfViewerOpen(false);
                if (selectedDoctor) {
                  setDetailOpen(true);
                }
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

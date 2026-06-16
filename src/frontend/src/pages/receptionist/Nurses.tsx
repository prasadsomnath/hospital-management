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
import { useAuthStore } from "@/store/auth-store";
import {
  Award,
  Building2,
  CheckCircle2,
  Eye,
  HeartPulse,
  Mail,
  Phone,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

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

const STATUS_STYLES: Record<string, string> = {
  Active:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Inactive: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function ReceptionistNurses() {
  const { user } = useAuthStore();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

      const activeNurses = mapped.filter((n) => n.status === "Active");
      setNurses(activeNurses);
      setTotalElements(activeNurses.length);
    } catch (e: any) {
      console.error("Failed to fetch nurses, using local fallback:", e);
      const saved = localStorage.getItem("medicore-nurses");
      const localNurses = saved ? JSON.parse(saved) : [];
      const activeLocalNurses = localNurses.filter(
        (n: Nurse) => n.status === "Active",
      );
      setNurses(activeLocalNurses);
      setTotalPages(1);
      setTotalElements(activeLocalNurses.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurses(page, pageSize);
  }, [user?.hospitalCode, page, pageSize]);

  const filtered = nurses.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.email.toLowerCase().includes(search.toLowerCase()) ||
      n.phone.toLowerCase().includes(search.toLowerCase()) ||
      (n.qualification &&
        n.qualification.toLowerCase().includes(search.toLowerCase())),
  );

  const openDetails = (nurse: Nurse) => {
    setSelectedNurse(nurse);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6" data-ocid="receptionist.nurses.page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          Hospital Nurses
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          View registered nurses in your hospital workspace.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="receptionist.nurses.search_input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, email, qualification..."
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium text-right sm:text-left self-end sm:self-auto">
          Showing {filtered.length} of {totalElements} registered nurses
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Fetching active nurse catalog…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-elevated rounded-xl p-12 text-center text-muted-foreground border border-border/40">
          <HeartPulse className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-bold text-foreground">No Nurses Found</h3>
          <p className="text-sm mt-1">
            We couldn't find any registered nurses matching your search in this
            hospital.
          </p>
        </div>
      ) : (
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30">
                <tr>
                  {[
                    "Nurse",
                    "Email",
                    "Phone",
                    "Gender",
                    "Qualification",
                    "Experience",
                    "Hospital",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.map((nurse) => (
                  <tr
                    key={nurse.id}
                    onClick={() => openDetails(nurse)}
                    className="hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    {/* Nurse name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0 text-accent">
                          <HeartPulse className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {nurse.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {nurse.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-muted-foreground">
                      {nurse.email}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-muted-foreground">
                      {nurse.phone}
                    </td>

                    {/* Gender */}
                    <td className="px-5 py-4">
                      {nurse.gender ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {nurse.gender.toLowerCase()}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Qualification */}
                    <td className="px-5 py-4 text-muted-foreground">
                      {nurse.qualification || "N/A"}
                    </td>

                    {/* Experience */}
                    <td className="px-5 py-4 text-muted-foreground">
                      {nurse.experience ? `${nurse.experience} Years` : "N/A"}
                    </td>

                    {/* Hospital */}
                    <td className="px-5 py-4">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {nurse.hospitalCode || "N/A"}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_STYLES[nurse.status] ?? ""}`}
                      >
                        {nurse.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-5 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(nurse)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="View Nurse Profile"
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
          <div className="px-5 py-3 border-t border-border mt-auto">
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
      )}

      {/* Nurse Details Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg w-[90vw] bg-card border border-border text-foreground rounded-3xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
          {selectedNurse && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent flex items-center justify-center text-accent">
                    <HeartPulse className="w-7 h-7" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                      {selectedNurse.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      Registered Nurse •{" "}
                      {selectedNurse.qualification || "General Care"}
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
                    {selectedNurse.experience
                      ? `${selectedNurse.experience} Yrs`
                      : "N/A"}
                  </p>
                </div>
                <div className="text-center border-x border-border/40">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Gender
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1 capitalize">
                    {selectedNurse.gender
                      ? selectedNurse.gender.toLowerCase()
                      : "N/A"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Status
                  </p>
                  <p className="text-sm font-bold mt-1 flex items-center justify-center gap-1">
                    {selectedNurse.status === "Active" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span
                      className={
                        selectedNurse.status === "Active"
                          ? "text-emerald-500"
                          : "text-destructive"
                      }
                    >
                      {selectedNurse.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Department & Specialty */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Credentials & Details
                </h4>
                <div className="glass-elevated p-4 rounded-xl border border-border/40 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Hospital Code
                    </p>
                    <p className="font-semibold text-foreground mt-1 font-mono">
                      {selectedNurse.hospitalCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Qualification
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      {selectedNurse.qualification || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Joined Date
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      {selectedNurse.joinDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Role ID
                    </p>
                    <p
                      className="font-semibold text-foreground mt-1 font-mono truncate max-w-[150px]"
                      title={selectedNurse.id}
                    >
                      {selectedNurse.id}
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
                        {selectedNurse.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">
                        E-mail Address
                      </p>
                      <p className="font-semibold text-foreground mt-0.5 truncate max-w-[250px]">
                        {selectedNurse.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
    </div>
  );
}

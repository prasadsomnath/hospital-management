import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import { receptionApi } from "@/lib/reception-api";
import { calculateDetailedAge, getLocalDateString } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Eye, Loader2, RefreshCw, Search, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ViewPatientModal } from "../receptionist/PatientModals";

export default function PatientsView() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Selected patient for modal
  const [viewPatient, setViewPatient] = useState<any>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const code = user?.hospitalCode || "HSP001";
  const today = getLocalDateString();

  const loadPatients = async () => {
    setLoading(true);
    try {
      const list = await receptionApi.getPatients(code);
      setPatients(list);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [code]);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  const filtered = patients.filter((p) => {
    const name = [p.firstName, p.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      (p.patientNo || "").toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div
      className="flex flex-col gap-6 animate-fade-in"
      data-ocid="lab_technician.patients_view"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
              Patients View
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse and search registered patient records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs px-3.5 py-1.5 rounded-lg shadow-2xs bg-muted/20"
          >
            {today}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={loadPatients}
            disabled={loading}
            className="h-9 gap-1.5 rounded-lg hover:bg-muted font-medium"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Controls & Filters ── */}
      <div className="bg-card border border-border/85 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or patient ID..."
            className="pl-10 h-10 text-sm focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
          />
        </div>
      </div>

      {/* ── Table/List Section ── */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-subtle overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-28 gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <span className="text-sm font-medium">
              Fetching patient records...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/45 border border-border/40">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {search ? "No matches found" : "Patient Directory is empty"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto leading-relaxed">
                {search
                  ? "Try checking spellings or look for a different patient ID."
                  : "No registered patients are currently in records."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-semibold">
                  <th className="py-3 px-4">Patient Info</th>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Age / DOB</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Register Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {paginated.map((p) => {
                  const name = [p.firstName, p.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const initials =
                    [p.firstName?.[0], p.lastName?.[0]]
                      .filter(Boolean)
                      .join("")
                      .toUpperCase() || "?";
                  return (
                    <tr
                      key={p.id || p.patientNo}
                      className="hover:bg-muted/15 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                              {initials}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {name}
                            </p>
                            {p.gender && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {p.gender}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-foreground">
                        {p.patientNo}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {p.phone || p.mobile || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {p.dob
                          ? calculateDetailedAge(p.dob, true)
                          : p.age
                            ? `${p.age}y`
                            : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.bloodGroup ? (
                          <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {p.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {(() => {
                          const raw =
                            p.registerDate || p.createdAt || p.registrationDate;
                          if (!raw)
                            return (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            );
                          const d = new Date(raw);
                          return isNaN(d.getTime())
                            ? raw
                            : d.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              });
                        })()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewPatient(p)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-teal-500/10 hover:text-teal-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControl
          currentPage={page}
          totalPages={Math.ceil(filtered.length / pageSize)}
          totalElements={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="px-4 border-t border-border/60 bg-muted/10 py-3 mt-auto"
        />
      </div>

      {/* ── Modals ── */}
      {viewPatient && (
        <ViewPatientModal
          patient={viewPatient}
          onClose={() => setViewPatient(null)}
          onEdit={() => setViewPatient(null)}
        />
      )}
    </div>
  );
}

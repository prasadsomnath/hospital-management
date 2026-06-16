import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  Calendar,
  Dna,
  FileText,
  Filter,
  Heart,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  Thermometer,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Admitted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Discharged: "bg-muted text-muted-foreground border-border",
  "In-Progress": "bg-accent/20 text-accent border-accent/30",
  Scheduled: "bg-primary/20 text-primary border-primary/30",
  Unknown: "bg-muted text-muted-foreground border-border",
  all: "bg-muted text-muted-foreground border-border",
};

interface PatientChartSheetProps {
  patient: any | null;
  open: boolean;
  onClose: () => void;
  chartData: any | null;
  isLoading: boolean;
}

function PatientDetailSheet({
  patient,
  open,
  onClose,
  chartData,
  isLoading,
}: PatientChartSheetProps) {
  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        data-ocid="doctor.patient_detail.sheet"
        className="w-full sm:max-w-xl overflow-y-auto glass-elevated border-l border-border"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground font-display font-bold">
            Clinical Patient Chart
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">
              Retrieving clinical records from secure registry...
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Identity Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {(patient.firstName || patient.name || "?")[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  {patient.firstName
                    ? `${patient.firstName} ${patient.lastName || ""}`.trim()
                    : patient.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Reg No:{" "}
                  <span className="font-mono font-bold text-primary">
                    {patient.patientNo}
                  </span>{" "}
                  · {patient.gender || "Gender not recorded"} ·{" "}
                  {patient.dob
                    ? `${new Date().getFullYear() - new Date(patient.dob).getFullYear()} yrs`
                    : patient.age
                      ? `${patient.age} yrs`
                      : "Age not recorded"}
                </p>
                <div className="flex gap-2 mt-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/30 text-primary bg-primary/10"
                  >
                    Blood: {patient.bloodGroup || "Not recorded"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  >
                    {patient.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Demographics & Clinical Profile */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-teal-400" />
                <span>Registry Bio-Metadata</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 border border-border rounded-xl p-3.5">
                <div>
                  <p className="text-muted-foreground font-medium">
                    Mobile Phone
                  </p>
                  <p className="text-foreground mt-0.5">
                    {patient.mobile || patient.phone || "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">
                    Registered Address
                  </p>
                  <p className="text-foreground mt-0.5 max-w-[180px] truncate">
                    {patient.address || "General Ward allocation"}
                  </p>
                </div>
                <div className="col-span-2">
                  <Separator className="my-2 bg-border" />
                </div>
                <div>
                  <p className="text-rose-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Allergies /
                    Hypersensitivity
                  </p>
                  <p className="text-foreground mt-0.5 font-medium">
                    {patient.hyperSensitivity || "No known hypersensitivity"}
                  </p>
                </div>
                <div>
                  <p className="text-amber-400 font-bold">Vices & Habits</p>
                  <p className="text-foreground mt-0.5">
                    {patient.vicesHabits || "Non-smoker / None"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground font-medium mt-1">
                    Permanent Clinical Diagnosis & Comments
                  </p>
                  <p className="text-foreground mt-0.5 italic">
                    {patient.importantNotes ||
                      patient.permanentDiagnosis ||
                      "None recorded"}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />



            {/* Prescriptions */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Clinical Prescriptions Written (
                  {chartData?.prescriptionsHistory?.length || 0})
                </span>
              </h3>
              {!chartData?.prescriptionsHistory ||
              chartData.prescriptionsHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No outpatient or inpatient prescriptions registered.
                </p>
              ) : (
                <div className="space-y-3">
                  {chartData.prescriptionsHistory.map((rx: any) => (
                    <div
                      key={rx.id || rx.prescriptionNo}
                      className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground font-mono">
                          {rx.prescriptionNo}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {rx.datePrescribed || rx.date || "Date not recorded"}
                        </span>
                      </div>
                      <div className="bg-background/40 p-2 rounded border border-border/50">
                        <p className="text-xs font-bold text-teal-400">
                          {rx.medicationName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {rx.strength} · Dose: {rx.dosage} · Freq:{" "}
                          {rx.frequency} ({rx.duration})
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        Prescribed by: {rx.doctorName || "Not recorded"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* Nursing & Vital Charts */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  Nursing Vitals Logs (
                  {chartData?.nursingVitalsTimeline?.length || 0})
                </span>
              </h3>
              {!chartData?.nursingVitalsTimeline ||
              chartData.nursingVitalsTimeline.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No vitals logs recorded today.
                </p>
              ) : (
                <div className="space-y-2">
                  {chartData.nursingVitalsTimeline.map((nr: any) => (
                    <div
                      key={nr.id}
                      className="rounded-lg border border-border bg-orange-500/5 p-3 text-xs grid grid-cols-3 gap-2"
                    >
                      <div className="col-span-3 flex justify-between font-bold text-[10px] text-muted-foreground">
                        <span>
                          Logged: {nr.recordDate} · {nr.recordTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Temp:</span>{" "}
                        <span className="font-bold text-foreground">
                          {nr.temperature}°F
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pulse:</span>{" "}
                        <span className="font-bold text-foreground">
                          {nr.pulse} bpm
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">BP:</span>{" "}
                        <span className="font-bold text-foreground">
                          {nr.bloodPressure}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function MyPatients() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chartData, setChartData] = useState<any | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any>("/doctor/patients", {
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });
      const patientsList = Array.isArray(data) ? data : data?.content || [];
      setPatients(patientsList);
    } catch (e) {
      console.warn("Failed to fetch patients from backend.", e);
      setPatients([]);
      toast.error("Failed to load patients from backend.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.hospitalCode]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  async function openPatient(p: any) {
    setSelected(p);
    setSheetOpen(true);
    setIsLoadingChart(true);
    try {
      const patientNo = p.patientNo || p.id;
      const chart = await apiFetch<any>(
        `/doctor/patients/manage/${patientNo}/chart`,
        {
          headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
        },
      );
      setChartData(chart);
    } catch (err) {
      console.warn(
        "Failed to fetch live clinical chart from doctor microservice.",
        err,
      );
      setChartData({
        patientProfile: p,
        admissionsHistory: [],
        prescriptionsHistory: [],
        diagnosticsHistory: [],
        nursingVitalsTimeline: [],
        reportsArchive: [],
      });
      toast.error("Failed to load patient chart from backend.");
    } finally {
      setIsLoadingChart(false);
    }
  }

  const filtered = patients.filter((p) => {
    const pName = p.firstName
      ? `${p.firstName} ${p.lastName || ""}`
      : p.name || "";
    const matchSearch =
      pName.toLowerCase().includes(search.toLowerCase()) ||
      p.patientNo?.toLowerCase().includes(search.toLowerCase()) ||
      (p.permanentDiagnosis || p.condition || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (p.bloodGroup || "").toLowerCase().includes(search.toLowerCase());

    const pStatus = p.status || "Unknown";
    const matchStatus = statusFilter === "all" || pStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedPatients = filtered.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div className="space-y-6 relative" data-ocid="doctor.patients.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Clinical Patient Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {patients.length} patients registered in your hospital
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="doctor.patients.search_input"
            placeholder="Search by name, registry ID, condition…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/20 border-border text-xs h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            data-ocid="doctor.patients.status.select"
            className="w-40 bg-muted/20 border-border text-xs h-9"
          >
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Admitted">Admitted</SelectItem>
            <SelectItem value="In-Progress">In-Progress</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                {[
                  "Patient",
                  "Age/Sex",
                  "Blood Group",
                  "Registry ID",
                  "Comments / Vices",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPatients.map((p, i) => {
                const pName = p.firstName
                  ? `${p.firstName} ${p.lastName || ""}`.trim()
                  : p.name;
                const pAge = p.dob
                  ? new Date().getFullYear() - new Date(p.dob).getFullYear()
                  : p.age || "Not recorded";
                const pGender = p.gender || "Not recorded";
                const pStatus = p.status || "Unknown";
                return (
                  <tr
                    key={p.id || p.patientNo || i}
                    data-ocid={`doctor.patients.item.${page * pageSize + i + 1}`}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => openPatient(p)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openPatient(p);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {pName[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate text-xs">
                            {pName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.email || "No email on record"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {pAge} / {pGender}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-primary/30 text-primary bg-primary/10"
                      >
                        {p.bloodGroup || "Not recorded"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                      {p.patientNo || p.id}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-[180px] truncate">
                      {p.importantNotes ||
                        p.vicesHabits ||
                        p.condition ||
                        "No notes recorded"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${STATUS_STYLES[pStatus] ?? STATUS_STYLES.Unknown}`}
                      >
                        {pStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`doctor.patients.view.${page * pageSize + i + 1}`}
                        className="text-xs text-teal-400 hover:text-teal-400 hover:bg-teal-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPatient(p);
                        }}
                      >
                        Open Chart
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {(isLoading || filtered.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div
                      data-ocid="doctor.patients.empty_state"
                      className="flex flex-col items-center gap-2"
                    >
                      <User className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-xs">
                        {isLoading
                          ? "Loading patient records from backend..."
                          : "No patient directory records found matching search filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControl
          currentPage={page}
          totalPages={Math.ceil(filtered.length / pageSize)}
          totalElements={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="px-4 border-t border-border bg-card/20 py-2.5"
        />
      </div>

      <PatientDetailSheet
        patient={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        chartData={chartData}
        isLoading={isLoadingChart}
      />
    </div>
  );
}

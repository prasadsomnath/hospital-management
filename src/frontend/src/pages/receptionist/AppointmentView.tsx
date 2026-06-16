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
import { receptionApi } from "@/lib/reception-api";
import type { AppointmentResponse } from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  BedDouble,
  Calendar,
  ClipboardList,
  Eye,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Stethoscope,
  User,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { parseAppointmentNotes } from "./BookAppointment";

// ── Status badge helper ────────────────────────────────────────────────────────
function getStatusBadgeStyles(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "scheduled" || s === "pending")
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  if (s === "completed" || s === "examined" || s === "stable")
    return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (s === "cancelled")
    return "bg-rose-500/15 text-rose-500 border-rose-500/30";
  if (s === "discharged")
    return "bg-cyan-500/15 text-cyan-500 border-cyan-500/30";
  return "bg-blue-500/15 text-blue-500 border-blue-500/30";
}

function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PatientGroup {
  patientNo: string;
  patientName: string;
  appointments: AppointmentResponse[];
  latestDate: string;
  earliestDate: string;
  totalCount: number;
}

export default function AppointmentView() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Raw data
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [visitTypeFilter, setVisitTypeFilter] = useState("ALL");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Patient history modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PatientGroup | null>(null);

  // Helper to resolve doctor names
  const getDocName = useCallback(
    (drId: string, fallback: string) => {
      if (!drId) return fallback || "—";
      const matched = doctors.find(
        (d) => d.doctorCode === drId || String(d.id) === drId,
      );
      if (matched) {
        const raw =
          matched.name ||
          `${matched.firstName} ${matched.lastName || ""}`.trim();
        return raw.toLowerCase().startsWith("dr.") ? raw : `Dr. ${raw}`;
      }
      return fallback || "—";
    },
    [doctors],
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await receptionApi.getAppointments(code, undefined, "ALL");
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load doctors registry
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const docsData = await apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        });
        const docsList = Array.isArray(docsData)
          ? docsData
          : (docsData?.content ?? []);
        setDoctors(docsList);
      } catch (err) {
        console.error("Failed to fetch doctors registry:", err);
      }
    };
    if (code) {
      fetchDoctors();
    }
  }, [code]);

  // ── Group appointments by patient ──────────────────────────────────────────
  const groupedMap = new Map<string, PatientGroup>();
  for (const appt of appointments) {
    const key = appt.patientNo;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        patientNo: appt.patientNo,
        patientName: appt.patientName,
        appointments: [],
        latestDate: appt.appointmentDate,
        earliestDate: appt.appointmentDate,
        totalCount: 0,
      });
    }
    const g = groupedMap.get(key)!;
    g.appointments.push(appt);
    if (appt.appointmentDate > g.latestDate)
      g.latestDate = appt.appointmentDate;
    if (appt.appointmentDate < g.earliestDate)
      g.earliestDate = appt.appointmentDate;
    g.totalCount += 1;
  }

  // Sort appointments inside each group chronologically (oldest first)
  for (const g of groupedMap.values()) {
    g.appointments.sort((a, b) =>
      a.appointmentDate.localeCompare(b.appointmentDate),
    );
  }

  const allGroups: PatientGroup[] = Array.from(groupedMap.values());

  // ── Apply outer filters ────────────────────────────────────────────────────
  const filtered = allGroups.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      g.patientName.toLowerCase().includes(q) ||
      g.patientNo.toLowerCase().includes(q);

    const matchesDoctor =
      selectedDoctorFilter === "ALL" ||
      g.appointments.some((a) => {
        const matchedDoc = doctors.find(
          (d) =>
            d.doctorCode === selectedDoctorFilter ||
            String(d.id) === selectedDoctorFilter
        );
        if (!matchedDoc) return false;
        return (
          a.doctorId === matchedDoc.doctorCode ||
          String(a.doctorId) === String(matchedDoc.id)
        );
      });

    const matchesDate =
      (!fromDateFilter || g.latestDate >= fromDateFilter) &&
      (!toDateFilter || g.earliestDate <= toDateFilter);

    const matchesVisitType =
      visitTypeFilter === "ALL" ||
      g.appointments.some((a) => a.visitType === visitTypeFilter);

    return matchesSearch && matchesDoctor && matchesDate && matchesVisitType;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFromDateFilter("");
    setToDateFilter("");
    setVisitTypeFilter("ALL");
    setSelectedDoctorFilter("ALL");
    setPage(0);
  };

  const openHistory = (g: PatientGroup) => {
    setSelectedGroup(g);
    setHistoryOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col animate-fade-in"
      data-ocid="appointment.view.page"
    >
      {/* Header */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shadow-inner">
            <ClipboardList className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Appointments Directory
            </h1>
            <p className="text-xs text-muted-foreground">
              Each patient listed once — click <strong>View</strong> to see
              their full appointment history.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg mt-1">
        {/* Actions bar */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-wrap gap-2 items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAppointments}
            className="h-8 px-3 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 font-medium"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <span className="text-[10px] text-zinc-400 font-mono">
            {filtered.length} unique patient{filtered.length !== 1 ? "s" : ""} ·{" "}
            {appointments.length} total appointments
          </span>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
            {/* Search */}
            <div className="space-y-1 md:col-span-2">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Patient / Doctor
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Name or Patient ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            {/* Doctor */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">Doctor</Label>
              <Select value={selectedDoctorFilter} onValueChange={(v) => { setSelectedDoctorFilter(v); setPage(0); }}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  <SelectItem value="ALL">All Doctors</SelectItem>
                  {doctors.map((doc: any) => {
                    const code = doc.doctorCode || String(doc.id);
                    const name = `Dr. ${doc.firstName} ${doc.lastName || ""}`.trim();
                    return (
                      <SelectItem key={doc.id || code} value={code}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                From Date
              </Label>
              <Input
                type="date"
                value={fromDateFilter}
                onChange={(e) => {
                  setFromDateFilter(e.target.value);
                  setPage(0);
                }}
                className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-full"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                To Date
              </Label>
              <Input
                type="date"
                value={toDateFilter}
                onChange={(e) => {
                  setToDateFilter(e.target.value);
                  setPage(0);
                }}
                className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-full"
              />
            </div>

            {/* Visit Type */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">Visit Type</Label>
              <Select value={visitTypeFilter} onValueChange={(v) => { setVisitTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="OPD">OPD</SelectItem>
                  <SelectItem value="IPD">IPD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button size="sm" variant="secondary" className="h-8 px-3 text-xs w-full" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-5 py-3 w-12">Srl</th>
                <th className="px-5 py-3">Patient ID</th>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3 text-center">Appointments</th>
                <th className="px-5 py-3 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {paginated.map((g, i) => (
                <tr
                  key={g.patientNo}
                  className="transition-all hover:bg-teal-500/5 dark:hover:bg-teal-900/5 font-medium"
                >
                  <td className="px-5 py-4 text-zinc-400 font-mono">
                    {page * pageSize + i + 1}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {g.patientNo}
                  </td>
                  <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    {g.patientName}
                  </td>
                  <td className="px-5 py-4 text-zinc-500 font-mono">
                    {fmtDate(g.latestDate)}
                  </td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                    {(() => {
                      const latestAppt =
                        g.appointments[g.appointments.length - 1];
                      return latestAppt
                        ? getDocName(
                            latestAppt.doctorId,
                            latestAppt.doctorName || "",
                          )
                        : "—";
                    })()}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs border border-teal-500/20">
                      {g.totalCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openHistory(g)}
                      className="h-7 px-3 text-xs font-semibold gap-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span className="font-medium">
                        {loading
                          ? "Loading appointments..."
                          : "No appointments match the filters"}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

      {/* ── Patient Appointment History Modal ───────────────────────────────── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-6xl w-[92vw] p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-500" />
              {selectedGroup?.patientName}
              <span className="font-mono text-xs font-normal text-zinc-400 ml-1">
                ({selectedGroup?.patientNo})
              </span>
              <Badge
                variant="outline"
                className="ml-auto text-[10px] border-teal-500/30 text-teal-600 bg-teal-500/5"
              >
                {selectedGroup?.totalCount} appointment
                {(selectedGroup?.totalCount ?? 0) > 1 ? "s" : ""}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedGroup && (
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Summary strip */}
              <div className="px-5 py-3 bg-teal-500/5 border-b border-teal-500/10 flex gap-6 text-xs">
                <div>
                  <span className="text-zinc-400 uppercase text-[9px] font-bold block">
                    First Visit
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {fmtDate(selectedGroup.earliestDate)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[9px] font-bold block">
                    Last Visit
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {fmtDate(selectedGroup.latestDate)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 uppercase text-[9px] font-bold block">
                    Total Appointments
                  </span>
                  <span className="font-semibold text-teal-600">
                    {selectedGroup.totalCount}
                  </span>
                </div>
              </div>

              {/* Chronological appointment list table */}
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 w-10 text-center">#</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3 text-center">Visit Type</th>
                      <th className="px-4 py-3">Appt Type</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3 text-center">Token</th>
                      <th className="px-4 py-3">Room / Bed</th>
                      <th className="px-4 py-3">Bill Status</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {selectedGroup.appointments.map((appt, idx) => {
                      const parsed = parseAppointmentNotes(appt.notes || "");
                      const docName = getDocName(
                        appt.doctorId,
                        appt.doctorName || "",
                      );

                      return (
                        <tr
                          key={appt.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          {/* Chronological index */}
                          <td className="px-4 py-3.5 text-center font-mono text-zinc-400">
                            {idx + 1}
                          </td>

                          {/* Date & Time */}
                          <td className="px-4 py-3.5 font-mono text-[11px] whitespace-nowrap">
                            <span className="text-zinc-900 dark:text-zinc-100 font-bold block">
                              {fmtDate(appt.appointmentDate)}
                            </span>
                            {appt.timeSlot && (
                              <span className="text-zinc-400 text-[10px] block mt-0.5">
                                {appt.timeSlot}
                              </span>
                            )}
                          </td>

                          {/* Visit Type */}
                          <td className="px-4 py-3.5 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold px-1.5 py-0 border ${
                                appt.visitType === "IPD"
                                  ? "bg-purple-500/15 text-purple-500 border-purple-500/30"
                                  : "bg-indigo-500/15 text-indigo-500 border-indigo-500/30"
                              }`}
                            >
                              {appt.visitType || "OPD"}
                            </Badge>
                          </td>

                          {/* Appointment Type */}
                          <td className="px-4 py-3.5 text-[11px]">
                            {appt.appointmentType || "—"}
                          </td>

                          {/* Doctor */}
                          <td className="px-4 py-3.5 text-[11px] text-zinc-950 dark:text-zinc-50 font-semibold whitespace-nowrap">
                            {docName}
                          </td>

                          {/* Token */}
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                            {appt.tokenNo ? `#${appt.tokenNo}` : "—"}
                          </td>

                          {/* Room / Bed */}
                          <td className="px-4 py-3.5 text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            {appt.visitType === "IPD" ? (
                              <span className="flex items-center gap-1">
                                <BedDouble className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                                <span>
                                  {parsed.roomNumber || appt.roomNumber || "—"}{" "}
                                  / {parsed.bedNo || appt.bedNo || "—"}
                                </span>
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>

                          {/* Bill */}
                          <td className="px-4 py-3.5 text-[11px] whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold px-1.5 py-0 border transition-colors ${
                                (appt.billStatus || "").toLowerCase() === "paid"
                                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-500 border-rose-500/30 cursor-pointer hover:bg-rose-500/25"
                              }`}
                              title={(appt.billStatus || "Pending").toLowerCase() === "pending" ? (appt.visitType === "IPD" ? "Click to open IPD Billing" : "Click to open OPD Billing") : undefined}
                              onClick={() => {
                                if ((appt.billStatus || "Pending").toLowerCase() === "pending") {
                                  const prefillData = {
                                    patientNo: selectedGroup.patientNo,
                                    patientName: selectedGroup.patientName,
                                    doctorName: docName,
                                    consultationFee: appt.dueAmount || 0,
                                    billType: appt.visitType === "IPD" ? "IPD" : "OPD",
                                  };
                                  sessionStorage.setItem("billing-prefill-appt", JSON.stringify(prefillData));
                                  navigate({ to: appt.visitType === "IPD" ? "/receptionist/billing" : "/receptionist/opd-billing" });
                                }
                              }}
                            >
                              {appt.billStatus || "Pending"}
                            </Badge>
                            <span className="text-zinc-500 font-mono text-[10px] ml-1.5">
                              ₹{appt.dueAmount ?? 0}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold border ${getStatusBadgeStyles(appt.status)}`}
                            >
                              {appt.status}
                            </Badge>
                          </td>

                          {/* Notes */}
                          <td
                            className="px-4 py-3.5 max-w-xs truncate text-[11px] text-zinc-500"
                            title={parsed.cleanNotes || appt.notes}
                          >
                            {parsed.cleanNotes || appt.notes || (
                              <span className="text-zinc-400/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

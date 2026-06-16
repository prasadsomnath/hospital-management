import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  type OpdRx,
  useLabTechnicianStore,
} from "@/store/lab-technician-store";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Pill,
  Search,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export default function OPDRxView() {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const {
    globalDate,
    opdSearchNo,
    opdRxList,
    patients,
    loading,
    setGlobalDate,
    setOpdSearchNo,
    fetchOpdRxList,
    fetchPatients,
  } = useLabTechnicianStore();

  const [selectedRx, setSelectedRx] = useState<OpdRx | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch live prescriptions and patients from the backend on component mount
  useEffect(() => {
    fetchOpdRxList();
    fetchPatients();
  }, []);

  // Filter patients based on typed query to populate searchable dropdown overlay
  const filteredPatients = patients.filter((pat) => {
    const cleanQuery = opdSearchNo.replace(/\s+/g, " ").trim().toLowerCase();
    const cleanPatName = pat.name.replace(/\s+/g, " ").trim().toLowerCase();
    const cleanPatNo = pat.patientNo.replace(/\s+/g, " ").trim().toLowerCase();
    return cleanPatName.includes(cleanQuery) || cleanPatNo.includes(cleanQuery);
  });

  // Handle click-outside to close the patient dropdown overlay
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = document.getElementById("opd-patient-search-container");
      if (container && !container.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter records based on globalDate and the search query (OPD No or Patient Name)
  const filteredRx = opdRxList.filter((rx) => {
    const cleanSearch = opdSearchNo.replace(/\s+/g, " ").trim().toLowerCase();
    const cleanOpdNo = rx.opdNo.replace(/\s+/g, " ").trim().toLowerCase();
    const cleanPatientName = rx.patientName
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return (
      cleanOpdNo.includes(cleanSearch) || cleanPatientName.includes(cleanSearch)
    );
  });

  useEffect(() => {
    setPage(0);
  }, [opdSearchNo, globalDate, opdRxList.length]);

  const paginatedRx = filteredRx.slice(page * pageSize, (page + 1) * pageSize);

  // Auto-select the first record when the list changes
  useEffect(() => {
    if (filteredRx.length > 0) {
      if (
        !selectedRx ||
        !filteredRx.some((r) => r.opdNo === selectedRx.opdNo)
      ) {
        setSelectedRx(filteredRx[0]);
      }
    } else {
      setSelectedRx(null);
    }
  }, [filteredRx, selectedRx]);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 h-[calc(100vh-8rem)] overflow-hidden font-sans antialiased text-foreground bg-background rounded-xl border border-border shadow-sm animate-fade-in"
      data-ocid="lab.opdrx.page"
    >
      {/* Top Banner */}
      <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">
              Clinician OPD Prescriptions Ledger
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Real-time outpatient prescription sync from doctor service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOpdRxList(opdSearchNo)}
            className="h-9 px-3 text-xs border-border bg-card hover:bg-muted text-card-foreground font-medium transition-smooth"
          >
            Sync Live Logs
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/lab-technician" })}
            className="h-9 px-4 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1.5 transition-smooth"
          >
            <X className="w-3.5 h-3.5" /> Exit Ledger
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden p-6 gap-6 flex flex-col lg:flex-row min-h-0 bg-slate-50/40 dark:bg-slate-950/20">
        {/* Left Side: Filter Bar and Table List */}
        <div className="flex-1 flex flex-col min-w-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-4 bg-muted/10">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                OPD Date
              </label>
              <input
                type="date"
                value={globalDate}
                onChange={(e) => setGlobalDate(e.target.value)}
                className="h-9 px-3 border border-border rounded-lg text-xs font-semibold bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth"
              />
            </div>

            <div
              className="space-y-1 flex-1 min-w-[200px] relative"
              id="opd-patient-search-container"
            >
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                OPD / Patient Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Patient Name or OPD No..."
                  value={opdSearchNo}
                  onChange={(e) => {
                    setOpdSearchNo(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="h-9 pl-9 pr-3 border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth bg-background"
                />
              </div>

              {/* Patient Autocomplete Dropdown list overlay */}
              {isDropdownOpen && filteredPatients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-border/60 scrollbar-thin">
                  {filteredPatients.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => {
                        setOpdSearchNo(pat.name);
                        setIsDropdownOpen(false);
                      }}
                      className="p-2.5 hover:bg-primary/5 cursor-pointer text-xs transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {pat.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Age: {pat.age} · Sex: {pat.gender} · {pat.phone}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono border-primary/20 text-primary bg-primary/5"
                      >
                        #{pat.patientNo}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Loading active prescriptions...
                </span>
              </div>
            ) : filteredRx.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-3">
                <AlertCircle className="w-8 h-8 text-amber-500/80" />
                <div>
                  <p className="text-sm font-semibold">
                    No OPD prescriptions found
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Try searching with a different name or sync with the server.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider select-none sticky top-0 z-10">
                  <tr>
                    <th className="p-3">OPD No</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Prescribed By</th>
                    <th className="p-3">Medicine / Trade Name</th>
                    <th className="p-3 text-center">Dosage (AM-Noon-PM-HS)</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-center">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {paginatedRx.map((row) => (
                    <tr
                      key={row.opdNo}
                      onClick={() => setSelectedRx(row)}
                      className={`hover:bg-primary/5 cursor-pointer transition-colors border-l-2 ${
                        selectedRx?.opdNo === row.opdNo
                          ? "bg-primary/5 border-l-primary"
                          : "border-l-transparent"
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-primary">
                        {row.opdNo}
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">
                        {row.patientName}
                      </td>
                      <td className="p-3.5 font-semibold text-muted-foreground">
                        {row.examBy}
                      </td>
                      <td className="p-3.5 font-bold text-teal-600 dark:text-teal-400">
                        {row.tradeName}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${row.am !== "0" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {row.am}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            -
                          </span>
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${row.noon !== "0" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {row.noon}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            -
                          </span>
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${row.pm !== "0" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {row.pm}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            -
                          </span>
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${row.hs !== "0" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {row.hs}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-muted-foreground">
                        {row.unit}
                      </td>
                      <td className="p-3.5 text-center font-bold text-foreground">
                        <Badge variant="outline" className="font-semibold">
                          {row.duration}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <PaginationControl
            currentPage={page}
            totalPages={Math.ceil(filteredRx.length / pageSize)}
            totalElements={filteredRx.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="px-4 py-2.5 border-t border-border/40 bg-muted/5 mt-0"
          />
        </div>

        {/* Right Side: Selected prescription instructions card */}
        {selectedRx && (
          <div className="w-full lg:w-96 flex-none bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between h-full overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Active Prescription
                  </span>
                  <h3 className="font-bold text-foreground text-base mt-2">
                    {selectedRx.patientName}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    OPD Ref: {selectedRx.opdNo}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  <span>Exam By: {selectedRx.examBy}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    Duration: {selectedRx.duration} ({selectedRx.unit})
                  </span>
                </div>
              </div>

              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/25 rounded-xl p-3.5 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Medication Details
                </div>
                <div className="text-sm font-bold text-teal-600 dark:text-teal-400 font-display flex items-center gap-2">
                  <Pill className="w-4 h-4" /> {selectedRx.tradeName}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Schedule: {selectedRx.am}-{selectedRx.noon}-{selectedRx.pm}-
                  {selectedRx.hs} (AM-Noon-PM-HS)
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-foreground flex items-center gap-1.5 select-none">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Pharmacist & Lab Instructions:</span>
                </label>
                <textarea
                  readOnly
                  rows={5}
                  value={selectedRx.instruction}
                  className="w-full p-3 border border-border rounded-xl text-xs font-semibold text-muted-foreground bg-muted/40 outline-none resize-none cursor-default leading-relaxed"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-[10px] leading-relaxed font-semibold">
                Verify patient parameters (age, allergies) and double check
                sample requests prior to collecting diagnostic fluid panels.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

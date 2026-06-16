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
import { Textarea } from "@/components/ui/textarea";
import { receptionApi } from "@/lib/reception-api";
import type { CampPatientResponse, CampResponse } from "@/lib/reception-types";
import { getLocalDateString } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Compass,
  Edit,
  Heart,
  Info,
  LogOut,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function CampList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  const [patients, setPatients] = useState<CampPatientResponse[]>([]);
  const [camps, setCamps] = useState<CampResponse[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Modals & Forms State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] =
    useState<CampPatientResponse | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [campFilter, setCampFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, fromDate, toDate, campFilter]);

  // Form Fields State
  const [formDate, setFormDate] = useState(getLocalDateString());
  const [formCampName, setFormCampName] = useState("");
  const [formName, setFormName] = useState("");
  const [formPatientId, setFormPatientId] = useState("");
  const [formAge, setFormAge] = useState<number>(0);
  const [formGender, setFormGender] = useState("M");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formWeight, setFormWeight] = useState<number | "">("");
  const [formHeight, setFormHeight] = useState<number | "">("");
  const [formBmi, setFormBmi] = useState<number>(0);
  const [formBp, setFormBp] = useState("120/80");
  const [formGlucose, setFormGlucose] = useState<number | "">("");
  const [formNotes, setFormNotes] = useState("");

  // Auto-fetched camp details context
  const [selectedCampDetails, setSelectedCampDetails] =
    useState<CampResponse | null>(null);

  // Fetch active or upcoming camps for screening selection
  const activeCamps = camps.filter(
    (c) => c.status === "Active" || c.status === "Upcoming",
  );

  // Load camp patients, camps and registered patients from backend
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [campList, patList, regPatList] = await Promise.all([
        receptionApi.getCamps(code),
        receptionApi.getCampPatients(
          code,
          campFilter !== "ALL" ? campFilter : undefined,
          fromDate || undefined,
          toDate || undefined,
        ),
        receptionApi.getPatients(code),
      ]);
      if (Array.isArray(campList)) setCamps(campList);
      if (Array.isArray(patList)) setPatients(patList);
      if (Array.isArray(regPatList)) setRegisteredPatients(regPatList);
    } catch {
      toast.error("Failed to load camp data");
    } finally {
      setLoadingData(false);
    }
  }, [code, campFilter, fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live BMI Calculation
  useEffect(() => {
    if (formWeight && formHeight) {
      const hMeters = Number(formHeight) / 100;
      const calcBmi = Number(formWeight) / (hMeters * hMeters);
      setFormBmi(Number(calcBmi.toFixed(1)));
    } else {
      setFormBmi(0);
    }
  }, [formWeight, formHeight]);

  // Sync selected camp details in Section A
  useEffect(() => {
    if (formCampName) {
      const camp = camps.find((c) => c.campName === formCampName);
      setSelectedCampDetails(camp || null);
    } else {
      setSelectedCampDetails(null);
    }
  }, [formCampName, camps]);

  // Sync form when editing changes
  useEffect(() => {
    if (editingPatient) {
      setFormDate(editingPatient.date || "");
      setFormCampName(editingPatient.campName || "");
      setFormName(editingPatient.name || "");
      setFormPatientId(editingPatient.patientNo || "");
      setFormAge(editingPatient.age ?? 0);
      setFormGender(editingPatient.gender || "M");
      setFormPhone(editingPatient.phone || "");
      setFormAddress(editingPatient.address || "");
      setFormWeight(editingPatient.weight ?? "");
      setFormHeight(editingPatient.height ?? "");
      setFormBmi(editingPatient.bmi ?? 0);
      setFormBp(editingPatient.bp || "120/80");
      setFormGlucose(editingPatient.glucose ?? "");
      setFormNotes(editingPatient.notes || "");
    } else {
      setFormDate(getLocalDateString());
      setFormCampName(activeCamps.length > 0 ? activeCamps[0].campName : "");
      setFormName("");
      setFormPatientId("");
      setFormAge(0);
      setFormGender("M");
      setFormPhone("");
      setFormAddress("");
      setFormWeight("");
      setFormHeight("");
      setFormBmi(0);
      setFormBp("120/80");
      setFormGlucose("");
      setFormNotes("");
    }
  }, [editingPatient, camps]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCampName) {
      toast.error("Please select a camp program.");
      return;
    }
    if (!formName.trim()) {
      toast.error("Please enter patient name.");
      return;
    }

    try {
      const payload = {
        date: formDate,
        campName: formCampName,
        name: formName,
        age: Number(formAge),
        gender: formGender,
        weight: formWeight ? Number(formWeight) : null,
        height: formHeight ? Number(formHeight) : null,
        bp: formBp,
        glucose: formGlucose ? Number(formGlucose) : null,
        phone: formPhone || null,
        address: formAddress || null,
        notes: formNotes || null,
      };

      if (editingPatient) {
        await receptionApi.updateCampPatient(editingPatient.id, payload, code);
        toast.success("Health screening details updated successfully.");
      } else {
        await receptionApi.addCampPatient(payload, code);
        toast.success("Health screening entry recorded successfully.");
      }
      setDialogOpen(false);
      setEditingPatient(null);
      setSelectedRow(null);
      loadData();
    } catch {
      toast.error("Failed to save screening entry.");
    }
  };

  const handleEditClick = () => {
    if (selectedRow === null) {
      toast.info("Please select a patient row to edit.");
      return;
    }
    const target = patients.find((p) => p.id === selectedRow);
    if (target) {
      setEditingPatient(target);
      setDialogOpen(true);
    }
  };

  const handleDeleteClick = () => {
    if (selectedRow === null) {
      toast.info("Please select a patient row to delete.");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteClick = async () => {
    setDeleteConfirmOpen(false);
    if (selectedRow === null) return;
    try {
      await receptionApi.deleteCampPatient(selectedRow, code);
      toast.success("Screening entry removed successfully.");
      setSelectedRow(null);
      loadData();
    } catch {
      toast.error("Failed to delete patient screening record.");
    }
  };

  const handlePrintList = () => {
    toast.success("Generating print template. Please wait...");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Vitals Risk Calculation helpers
  const getBmiStatus = (bmi: number) => {
    if (bmi <= 0)
      return {
        label: "Pending",
        color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
      };
    if (bmi < 18.5)
      return {
        label: "Underweight",
        color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
      };
    if (bmi < 25)
      return {
        label: "Normal",
        color:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      };
    if (bmi < 30)
      return {
        label: "Overweight",
        color:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      };
    return {
      label: "Obese",
      color:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    };
  };

  const getBpStatus = (bp: string) => {
    if (!bp) return { label: "N/A", color: "text-zinc-400" };
    const parts = bp.split("/");
    const sys = Number(parts[0]);
    const dia = Number(parts[1]);
    if (sys >= 130 || dia >= 80)
      return {
        label: "High BP",
        color: "text-rose-600 dark:text-rose-400 font-black",
      };
    return {
      label: "Normal",
      color: "text-emerald-600 dark:text-emerald-400 font-semibold",
    };
  };

  const getGlucoseStatus = (gl: number) => {
    if (!gl)
      return {
        label: "N/A",
        color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
      };
    if (gl >= 126)
      return {
        label: "High Sugar",
        color:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      };
    return {
      label: "Normal",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    };
  };

  const filteredRegPatients = registeredPatients.filter((p) => {
    const displayName = (p.name || [p.firstName, p.lastName].filter(Boolean).join(" ")).toLowerCase();
    const patNo = (p.patientNo || "").toLowerCase();
    const search = formName.toLowerCase();
    return formName.trim().length > 0 && (displayName.includes(search) || patNo.includes(search));
  });

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      (p.patientNo || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q);
    const matchesFromDate = !fromDate || (p.date || "") >= fromDate;
    const matchesToDate = !toDate || (p.date || "") <= toDate;
    const matchesCamp = campFilter === "ALL" || p.campName === campFilter;
    return matchesQuery && matchesFromDate && matchesToDate && matchesCamp;
  });

  const paginatedPatients = filteredPatients.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  const activeCount = filteredPatients.length;

  const validBmiPatients = filteredPatients.filter((p) => (p.bmi || 0) > 0);
  const avgBmi =
    validBmiPatients.length > 0
      ? Number(
          (
            validBmiPatients.reduce((sum, p) => sum + (p.bmi || 0), 0) /
            validBmiPatients.length
          ).toFixed(1),
        )
      : 0;

  const validSugarPatients = filteredPatients.filter(
    (p) => (p.glucose || 0) > 0,
  );
  const avgGlucose =
    validSugarPatients.length > 0
      ? Math.round(
          validSugarPatients.reduce((sum, p) => sum + (p.glucose || 0), 0) /
            validSugarPatients.length,
        )
      : 0;

  const highBpCount = filteredPatients.filter((p) => {
    const parts = (p.bp || "0/0").split("/");
    return Number(parts[0]) >= 130 || Number(parts[1]) >= 80;
  }).length;

  const hasFilters = Boolean(
    searchQuery || fromDate || toDate || campFilter !== "ALL",
  );
  const noActiveCamps = !loadingData && activeCamps.length === 0;

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="camplist.page"
    >
      {/* Title & Stats Summary Grid */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shadow-inner">
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Camp Screening Records
            </h1>
            <p className="text-xs text-muted-foreground">
              Record and review medical camp patient screenings, vitals, and
              dynamic risk indices
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:flex items-center gap-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl shadow-sm">
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800">
            <Users className="w-4 h-4 text-orange-500" />
            <span>
              Total Screened:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">{activeCount}</b>
            </span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800">
            <Scale className="w-4 h-4 text-indigo-500" />
            <span>
              Avg BMI:{" "}
              <b className="text-indigo-600 dark:text-indigo-400">
                {avgBmi || "—"}
              </b>
            </span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>
              High BP Risks:{" "}
              <b className="text-rose-600 dark:text-rose-400 font-bold">
                {highBpCount}
              </b>
            </span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>
              Avg Glucose:{" "}
              <b className="text-emerald-600 dark:text-emerald-400">
                {avgGlucose ? `${avgGlucose} mg/dL` : "—"}
              </b>
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg mt-1">
        {/* Action Header */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              disabled={loadingData || noActiveCamps}
              onClick={() => {
                setEditingPatient(null);
                setDialogOpen(true);
              }}
              className="h-8.5 px-3 text-xs bg-orange-600 hover:bg-orange-700 text-white gap-1.5 font-semibold"
            >
              <Plus className="w-4 h-4" /> Record Screening
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              disabled={selectedRow === null}
              className="h-8.5 px-3 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium"
            >
              <Edit className="w-3.5 h-3.5 text-orange-500" /> Edit Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              disabled={selectedRow === null}
              className="h-8.5 px-3 text-xs gap-1.5 text-rose-500 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-rose-500/10 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintList}
              className="h-8.5 px-3 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 font-medium"
            >
              <Printer className="w-3.5 h-3.5" /> Print List
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8.5 text-rose-500 hover:bg-rose-500/10 font-bold text-xs"
            onClick={() => navigate({ to: "/" })}
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Exit
          </Button>
        </div>

        {/* Filters Panel */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Find camp screening entries
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Filter and review target patient screenings across programs
              </p>
            </div>
            {noActiveCamps && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                ⚠ No active or upcoming camps are currently published by admin for this
                hospital.
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                From date
              </Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                To date
              </Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Backend camp
              </Label>
              <Select
                value={campFilter}
                onValueChange={(val) => setCampFilter(val)}
                disabled={loadingData || camps.length === 0}
              >
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All backend camps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All backend camps</SelectItem>
                  {camps.map((c) => (
                    <SelectItem key={c.id} value={c.campName}>
                      {c.campName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search patient
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search name, ID, mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-8.5 px-4 text-xs gap-1.5"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
                setCampFilter("ALL");
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </Button>
          </div>
        </div>

        {/* Patient Grid Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Srl</th>
                <th className="px-3.5 py-3">Date</th>
                <th className="px-3.5 py-3">Camp</th>
                <th className="px-3.5 py-3">Pat ID</th>
                <th className="px-3.5 py-3">Name</th>
                <th className="px-3.5 py-3 text-right">Age</th>
                <th className="px-3.5 py-3 text-center">Sex</th>
                <th className="px-3.5 py-3">Phone</th>
                <th className="px-3.5 py-3 text-right">Weight</th>
                <th className="px-3.5 py-3 text-right">Height</th>
                <th className="px-3.5 py-3 text-center">BMI</th>
                <th className="px-3.5 py-3 text-center">BP</th>
                <th className="px-3.5 py-3 text-center">Glucose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedPatients.map((row, i) => {
                const isSelected = selectedRow === row.id;
                const bmiStatus = getBmiStatus(row.bmi ?? 0);
                const bpStatus = getBpStatus(row.bp ?? "0/0");
                const sugarStatus = getGlucoseStatus(row.glucose ?? 0);
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(isSelected ? null : row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedRow(isSelected ? null : row.id);
                      }
                    }}
                    tabIndex={0}
                    className={`cursor-pointer transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 ${
                      isSelected
                        ? "bg-orange-500/10 hover:bg-orange-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {row.date}
                    </td>
                    <td className="px-3.5 py-3 text-foreground font-semibold">
                      {row.campName}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-zinc-600 dark:text-zinc-400">
                      {row.patientNo}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-foreground">
                      {row.name}
                    </td>
                    <td className="px-3.5 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      {row.age}
                    </td>
                    <td className="px-3.5 py-3 text-center font-bold text-zinc-500">
                      {row.gender}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-500">
                      {row.phone || "—"}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                      {row.weight ? `${row.weight} kg` : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                      {row.height ? `${row.height} cm` : "—"}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold font-mono text-[10px] text-foreground">
                          {row.bmi ? row.bmi.toFixed(1) : "—"}
                        </span>
                        {row.bmi ? (
                          <Badge
                            variant="outline"
                            className={`text-[8px] px-1 py-0 rounded ${bmiStatus.color}`}
                          >
                            {bmiStatus.label}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-mono font-semibold text-foreground">
                          {row.bp || "—"}
                        </span>
                        {row.bp ? (
                          <span
                            className={`text-[8px] font-bold ${bpStatus.color}`}
                          >
                            {bpStatus.label}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold font-mono text-[10px] text-foreground">
                          {row.glucose ? `${row.glucose} mg` : "—"}
                        </span>
                        {row.glucose ? (
                          <Badge
                            variant="outline"
                            className={`text-[8px] px-1 py-0 rounded ${sugarStatus.color}`}
                          >
                            {sugarStatus.label}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loadingData
                          ? "Fetching camp screening data logs..."
                          : noActiveCamps
                            ? "No active or upcoming outreach camps published yet"
                            : hasFilters
                              ? "No screenings match the active filters"
                              : "No screening records logged yet"}
                      </span>
                      <span className="text-[10px] text-zinc-400 max-w-sm">
                        {noActiveCamps
                          ? "Camps must be marked as Active or Upcoming in Admin Panel before receptionists can record details."
                          : hasFilters
                            ? "Clear filters or search with another patient name/ID/phone."
                            : "Use the Record Screening form to log patients and auto-calculate health indices."}
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
          totalPages={Math.ceil(filteredPatients.length / pageSize)}
          totalElements={filteredPatients.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>

        {/* Footer info */}
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
          <span>
            Select patient record row to enable Modify / Delete options.
          </span>
          <span>Camp Screening Pro Module v2.0</span>
        </div>
      </div>

      {/* Camp Entry Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl"
        >
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              {editingPatient
                ? "Modify Camp Patient Screening Record"
                : "Record Medical Camp Screening"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* SECTION A — CAMP DETAILS */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-850 pb-1.5">
                <h3 className="font-bold text-orange-600 uppercase tracking-widest text-[9px]">
                  SECTION A — CAMP PROGRAM SELECTION
                </h3>
                {noActiveCamps && (
                  <span className="text-[9px] font-semibold text-rose-500">
                    Active Backend Camp Required
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Select Camp Program *
                  </Label>
                  <Select
                    value={formCampName}
                    onValueChange={(val) => setFormCampName(val)}
                    disabled={loadingData || activeCamps.length === 0}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Choose camp..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCamps.map((c) => (
                        <SelectItem key={c.id} value={c.campName}>
                          {c.campName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Screening Date
                  </Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Generated Patient ID
                  </Label>
                  <Input
                    disabled
                    value={
                      editingPatient
                        ? editingPatient.patientNo
                        : "Generated upon save"
                    }
                    className="h-8.5 text-xs bg-zinc-100/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono"
                  />
                </div>
              </div>

              {/* Auto-fetched Details contextual box */}
              {selectedCampDetails ? (
                <div className="mt-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] animate-fadeIn">
                  <div>
                    <span className="text-zinc-400 block font-semibold text-[8px] uppercase">
                      Camp Type
                    </span>
                    <span className="font-medium text-foreground">
                      {selectedCampDetails.campType || "General"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold text-[8px] uppercase">
                      Roster Physician
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-orange-500" />
                      Dr. {selectedCampDetails.assignedDoctor || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold text-[8px] uppercase">
                      Camp Date
                    </span>
                    <span className="font-medium text-foreground">
                      {selectedCampDetails.campDate || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold text-[8px] uppercase">
                      Camp Location
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-0.5 text-orange-600">
                      <MapPin className="w-2.5 h-2.5" />
                      {selectedCampDetails.location || "N/A"}
                    </span>
                  </div>
                  {selectedCampDetails.description && (
                    <div className="col-span-2 md:col-span-4 border-t border-zinc-100 dark:border-zinc-800/60 pt-1.5 mt-1">
                      <span className="text-zinc-400 block font-semibold text-[8px] uppercase">
                        Campaign Instructions / Description
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-350 italic mt-0.5 leading-relaxed">
                        {selectedCampDetails.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Choose an active outreach camp to populate location,
                    assigned physician, and description instructions.
                  </span>
                </div>
              )}
            </div>

            {/* SECTION B — PATIENT DETAILS */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <div className="border-b border-zinc-200 dark:border-zinc-850 pb-1.5">
                <h3 className="font-bold text-orange-600 uppercase tracking-widest text-[9px]">
                  SECTION B — PATIENT DEMOGRAPHICS
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 col-span-2 relative">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Patient Full Name *
                  </Label>
                  <Input
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setShowPatientSuggestions(true);
                    }}
                    onFocus={() => setShowPatientSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 250)}
                    placeholder="Enter patient full name..."
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-semibold"
                  />
                  {showPatientSuggestions && filteredRegPatients.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                      {filteredRegPatients.map((p) => (
                        <button
                          key={p.patientNo}
                          type="button"
                          onClick={() => {
                            setFormName(p.name || [p.firstName, p.lastName].filter(Boolean).join(" "));
                            setFormPatientId(p.patientNo || "");
                            setFormAge(p.age ?? 0);
                            setFormGender(p.gender || "M");
                            setFormPhone(p.phone || p.mobile || "");
                            setFormAddress(p.address || "");
                            setShowPatientSuggestions(false);
                            toast.success(`Patient "${p.name || p.firstName}" selected!`);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-teal-500/10 transition-colors flex justify-between items-center text-xs text-foreground"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {p.name || `${p.firstName} ${p.lastName}`}
                            </span>
                            {(p.phone || p.mobile) && (
                              <span className="text-[10px] text-zinc-500">
                                📞 {p.phone || p.mobile}
                              </span>
                            )}
                          </div>
                          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">
                            {p.patientNo}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Patient ID (Optional)
                  </Label>
                  <Input
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    placeholder="e.g. Existing Patient No."
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Gender
                  </Label>
                  <Select
                    value={formGender}
                    onValueChange={(val) => setFormGender(val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Age in Years
                  </Label>
                  <Input
                    type="number"
                    value={formAge || ""}
                    onChange={(e) => setFormAge(Number(e.target.value))}
                    placeholder="e.g. 42"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    <Input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Ten-digit mobile"
                      className="pl-7 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Address / Pin Location
                  </Label>
                  <Input
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Residential address..."
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* SECTION C — HEALTH SCREENING DETAILS */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <div className="border-b border-zinc-200 dark:border-zinc-850 pb-1.5">
                <h3 className="font-bold text-orange-600 uppercase tracking-widest text-[9px]">
                  SECTION C — HEALTH CLINICAL VITALS
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-orange-600">
                    Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={formWeight}
                    onChange={(e) =>
                      setFormWeight(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="e.g. 70"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-orange-600">
                    Height (cm)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={formHeight}
                    onChange={(e) =>
                      setFormHeight(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="e.g. 175"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-indigo-500">
                    Auto calculated BMI
                  </Label>
                  <div className="h-8.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md flex flex-col items-center justify-center font-bold font-mono text-center">
                    <span>{formBmi || "—"}</span>
                    {formBmi > 0 && (
                      <span className="text-[7px] uppercase font-black tracking-wider">
                        {getBmiStatus(formBmi).label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-rose-500">
                    Blood Pressure *
                  </Label>
                  <div className="relative">
                    <Input
                      value={formBp}
                      onChange={(e) => setFormBp(e.target.value)}
                      placeholder="120/80"
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono text-center"
                    />
                    {formBp && (
                      <div className="absolute right-1 top-2.5">
                        <span
                          className={`text-[7px] uppercase font-black px-1.5 py-0.5 rounded ${
                            getBpStatus(formBp).label === "High BP"
                              ? "bg-rose-500 text-white animate-pulse"
                              : "bg-emerald-500 text-white"
                          }`}
                        >
                          {getBpStatus(formBp).label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-emerald-500">
                    Glucose (mg/dL)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formGlucose}
                      onChange={(e) =>
                        setFormGlucose(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 98"
                      className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono text-center"
                    />
                    {formGlucose ? (
                      <div className="absolute right-1 top-2.5">
                        <span
                          className={`text-[7px] uppercase font-black px-1.5 py-0.5 rounded ${
                            getGlucoseStatus(Number(formGlucose)).label ===
                            "High Sugar"
                              ? "bg-amber-500 text-white animate-pulse"
                              : "bg-emerald-500 text-white"
                          }`}
                        >
                          {getGlucoseStatus(Number(formGlucose)).label}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-5 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Clinical Vitals Screening Notes
                  </Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Log patient's general physiological notes, diabetes symptoms, existing BP treatments or dietary habits..."
                    className="min-h-[50px] text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-850 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-zinc-200 dark:border-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loadingData || activeCamps.length === 0}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold min-w-[120px]"
              >
                {editingPatient ? "Update Record" : "Save Vitals Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-md bg-background border border-border text-foreground rounded-2xl shadow-lg"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-sm">
              Remove Patient Screening Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-xs mt-2">
            Are you sure you want to permanently delete this camp screening
            entry? This action cannot be undone and will remove the logs from
            both the table and averages.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteClick}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Delete Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

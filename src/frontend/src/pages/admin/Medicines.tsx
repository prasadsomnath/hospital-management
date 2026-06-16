import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { Doctor } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// --------------- Types ---------------
interface Medicine {
  medicineName: string;
  type: string;
  company: string;
  dosage: string;
}

const EMPTY_MED: Medicine = {
  medicineName: "",
  type: "",
  company: "",
  dosage: "",
};

const TYPE_OPTIONS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Drops",
  "Cream",
  "Powder",
  "Inhaler",
  "Other",
];

// --------------- Helpers ---------------
function normalizeMedicineType(type: string): string {
  const t = type.trim().toLowerCase();
  if (!t) return "";

  if (
    t === "tablet" ||
    t === "tablets" ||
    t === "tab" ||
    t === "tabs" ||
    t === "tab." ||
    t === "tabs."
  ) {
    return "Tablet";
  }
  if (
    t === "capsule" ||
    t === "capsules" ||
    t === "cap" ||
    t === "caps" ||
    t === "cap." ||
    t === "caps."
  ) {
    return "Capsule";
  }
  if (t === "syrup" || t === "syrups" || t === "syr" || t === "syr.") {
    return "Syrup";
  }
  if (t === "injection" || t === "injections" || t === "inj" || t === "inj.") {
    return "Injection";
  }
  if (t === "drops" || t === "drop") {
    return "Drops";
  }
  if (t === "cream" || t === "creams") {
    return "Cream";
  }
  if (t === "powder" || t === "powders") {
    return "Powder";
  }
  if (t === "inhaler" || t === "inhalers" || t === "inh" || t === "inh.") {
    return "Inhaler";
  }

  // Case-insensitive match in TYPE_OPTIONS
  const matched = TYPE_OPTIONS.find((opt) => opt.toLowerCase() === t);
  if (matched) return matched;

  // Capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function parseExcel(file: File): Promise<Medicine[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const medicines: Medicine[] = rows
          .map((row: any) => ({
            medicineName: String(
              row["Medicine Name"] ||
                row["medicine_name"] ||
                row["MedicineName"] ||
                row["MEDICINE NAME"] ||
                row["Name"] ||
                "",
            ).trim(),
            type: normalizeMedicineType(
              String(
                row["Type"] ||
                  row["type"] ||
                  row["TYPE"] ||
                  row["Category"] ||
                  row["category"] ||
                  row["CATEGORY"] ||
                  row["Form"] ||
                  row["form"] ||
                  row["FORM"] ||
                  "",
              ),
            ),
            company: String(
              row["Company"] ||
                row["company"] ||
                row["COMPANY"] ||
                row["Manufacturer"] ||
                row["manufacturer"] ||
                row["MANUFACTURER"] ||
                row["Brand"] ||
                row["brand"] ||
                row["BRAND"] ||
                "",
            ).trim(),
            dosage: String(
              row["Dosage"] ||
                row["dosage"] ||
                row["DOSAGE"] ||
                row["Strength"] ||
                row["strength"] ||
                row["STRENGTH"] ||
                "",
            ).trim(),
          }))
          .filter((m) => m.medicineName.length > 0);
        resolve(medicines);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/** Merge two lists — skip duplicates by medicineName (case-insensitive) */
function mergeMedicines(
  existing: Medicine[],
  incoming: Medicine[],
): Medicine[] {
  const merged = [...existing];
  const existingNames = new Set(
    existing.map((m) => m.medicineName.toLowerCase()),
  );
  let addedCount = 0;
  let skippedCount = 0;
  for (const med of incoming) {
    if (!existingNames.has(med.medicineName.toLowerCase())) {
      merged.push(med);
      existingNames.add(med.medicineName.toLowerCase());
      addedCount++;
    } else {
      skippedCount++;
    }
  }
  return merged;
}

function getBadgeClass(type: string) {
  const t = type.toLowerCase();
  if (t === "tablet" || t === "tablets")
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (t === "capsule" || t === "capsules")
    return "bg-violet-500/10 text-violet-400 border-violet-500/20";
  if (t === "syrup" || t === "syrups")
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (t === "injection" || t === "injections")
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  return "bg-muted/30 text-muted-foreground border-border/50";
}

// --------------- Component ---------------
export default function Medicines() {
  const { user } = useAuthStore();

  // Doctor list
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Medicines per doctor (loaded on-demand)
  const [medicineMap, setMedicineMap] = useState<Record<string, Medicine[]>>(
    {},
  );

  // ---- View Dialog ----
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [dialogMeds, setDialogMeds] = useState<Medicine[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- Add Medicine Form (inside dialog) ----
  const [addForm, setAddForm] = useState<Medicine>(EMPTY_MED);
  const [showAddForm, setShowAddForm] = useState(false);

  // File input ref for excel upload in dialog
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const downloadExcelTemplate = () => {
    const data = [
      {
        "Medicine Name": "BComplex",
        "Type": "Tablet",
        "Company": "ABC Pharma",
        "Dosage": "500mg",
      },
      {
        "Medicine Name": "UlcerCaps",
        "Type": "Capsule",
        "Company": "XYZ Pharma",
        "Dosage": "1/day",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicines");
    XLSX.writeFile(wb, "medicines_import_template.xlsx");
    toast.success("Excel template downloaded successfully!");
  };

  // ---- Fetch medicines for a doctor ----
  const fetchMedicines = async (doctorId: string): Promise<Medicine[]> => {
    if (!user?.hospitalCode) return [];
    try {
      const res = await apiFetch<any[]>(`/doctor/medicines`, {
        params: { doctorId },
        headers: { "X-Hospital-Code": user.hospitalCode },
      });
      const list: Medicine[] = (res || []).map((m: any) => ({
        medicineName: m.medicineName || "",
        type: m.type || "",
        company: m.company || "",
        dosage: m.dosage || "",
      }));
      localStorage.setItem(
        `medicines-doctor-${doctorId}-${user.hospitalCode}`,
        JSON.stringify(list),
      );
      return list;
    } catch {
      const cached = localStorage.getItem(
        `medicines-doctor-${doctorId}-${user.hospitalCode}`,
      );
      return cached ? JSON.parse(cached) : [];
    }
  };

  // ---- Load doctors ----
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user?.hospitalCode) return;
      try {
        setDoctorsLoading(true);
        const res = await apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 200 },
          headers: {
            "X-Hospital-Code": user.hospitalCode,
            "X-Hospital-Id": user.hospitalId || "1",
          },
        });
        const list: any[] = Array.isArray(res) ? res : res?.content || [];
        const mapped: Doctor[] = list.map((doc: any) => ({
          id: String(doc.id),
          name: `Dr. ${doc.firstName} ${doc.lastName}`,
          specialty: doc.specialization || "General Medicine",
          department: doc.departmentName || "",
          phone: doc.mobile || "",
          email: doc.email || "",
          status: doc.isActive ? "Active" : "On Leave",
          patients: 0,
          experience: doc.experience ?? 0,
          isHeadPhysician: doc.isHeadPhysician ?? false,
          licenseNumber: doc.licenseNumber || "",
        }));
        setDoctors(mapped);

        // Pre-fetch medicines for each doctor
        for (const doc of mapped) {
          fetchMedicines(doc.id).then((medList) => {
            setMedicineMap((prev) => ({ ...prev, [doc.id]: medList }));
          });
        }
      } catch (e) {
        const saved = localStorage.getItem("medicore-doctors");
        if (saved) setDoctors(JSON.parse(saved));
        toast.error("Using local doctor cache.");
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
  }, [user?.hospitalCode]);

  // ---- Save medicines list to backend ----
  const saveMedicines = async (
    doctorId: string,
    doctorName: string,
    medicines: Medicine[],
  ) => {
    if (!user?.hospitalCode) return;
    try {
      await apiFetch<any>("/doctor/medicines/bulk", {
        method: "POST",
        headers: { "X-Hospital-Code": user.hospitalCode },
        body: JSON.stringify({
          doctorId: Number(doctorId),
          doctorName,
          medicines,
        }),
      });
    } catch {
      // offline fallback — data is kept in localStorage
    }
    localStorage.setItem(
      `medicines-doctor-${doctorId}-${user.hospitalCode}`,
      JSON.stringify(medicines),
    );
    // Update summary map
    setMedicineMap((prev) => ({ ...prev, [doctorId]: medicines }));
  };

  // ---- Open View Dialog ----
  const openView = async (doctor: Doctor) => {
    setViewDoctor(doctor);
    setShowAddForm(false);
    setAddForm(EMPTY_MED);
    setDialogLoading(true);
    // Use cached if available, else fetch
    const cached = medicineMap[doctor.id];
    if (cached) {
      setDialogMeds(cached);
      setDialogLoading(false);
    } else {
      const list = await fetchMedicines(doctor.id);
      setDialogMeds(list);
      setMedicineMap((prev) => ({ ...prev, [doctor.id]: list }));
      setDialogLoading(false);
    }
  };

  // ---- Handle Excel Upload (MERGE) ----
  const handleExcelUpload = async (file: File) => {
    if (!viewDoctor || !user?.hospitalCode) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }
    try {
      setSaving(true);
      const incoming = await parseExcel(file);
      if (incoming.length === 0) {
        toast.error(
          "No valid rows found. Required columns: Medicine Name, Type, Company, Dosage",
        );
        setSaving(false);
        return;
      }
      const merged = mergeMedicines(dialogMeds, incoming);
      const added = merged.length - dialogMeds.length;
      const skipped = incoming.length - added;
      setDialogMeds(merged);
      await saveMedicines(viewDoctor.id, viewDoctor.name, merged);
      toast.success(
        `✓ ${added} medicines added${skipped > 0 ? `, ${skipped} duplicate${skipped > 1 ? "s" : ""} skipped` : ""}`,
      );
    } catch (e) {
      toast.error("Failed to read Excel file. Check the format.");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---- Handle Add Medicine (manual row) ----
  const handleAddMedicine = async () => {
    if (!viewDoctor || !user?.hospitalCode) return;
    if (!addForm.medicineName.trim()) {
      toast.error("Medicine name is required.");
      return;
    }
    // Check duplicate
    const isDuplicate = dialogMeds.some(
      (m) =>
        m.medicineName.toLowerCase() ===
        addForm.medicineName.toLowerCase().trim(),
    );
    if (isDuplicate) {
      toast.error(
        `"${addForm.medicineName}" already exists in this doctor's list.`,
      );
      return;
    }
    setSaving(true);
    const newMed: Medicine = {
      medicineName: addForm.medicineName.trim(),
      type: addForm.type,
      company: addForm.company.trim(),
      dosage: addForm.dosage.trim(),
    };
    const updated = [...dialogMeds, newMed];
    setDialogMeds(updated);
    await saveMedicines(viewDoctor.id, viewDoctor.name, updated);
    setAddForm(EMPTY_MED);
    setShowAddForm(false);
    setSaving(false);
    toast.success(`"${newMed.medicineName}" added successfully!`);
  };

  // ---- Handle Delete Medicine (from dialog) ----
  const handleDeleteMedicine = async (idx: number) => {
    if (!viewDoctor) return;
    setSaving(true);
    const updated = dialogMeds.filter((_, i) => i !== idx);
    setDialogMeds(updated);
    await saveMedicines(viewDoctor.id, viewDoctor.name, updated);
    setSaving(false);
    toast.success("Medicine removed.");
  };

  // ---- Get medicine count for a doctor ----
  const getMedCount = (doctorId: string) =>
    medicineMap[doctorId]?.length ?? null;

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.specialty || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6" data-ocid="admin.medicines.page">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Pill className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display leading-tight">
                Medicines Catalog
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Doctor-wise medicine management — upload Excel or add medicines
                individually
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-500">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Excel + Manual Entry
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="admin.medicines.search_input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or specialty…"
          className="pl-9 bg-card border-border"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Doctor Table ─────────────────────────────────── */}
      {doctorsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">
            Loading doctors…
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-elevated rounded-xl p-12 text-center shadow-glass-sm">
          <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            {search
              ? "No doctors match your search."
              : "No doctors registered yet."}
          </p>
        </div>
      ) : (
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
          {/* Table header */}
          <table className="w-full" data-ocid="admin.medicines.doctors_table">
            <thead className="bg-muted/30">
              <tr>
                {[
                  "Doctor",
                  "Specialty",
                  "Department",
                  "Status",
                  "Medicines",
                  "Action",
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
              {filtered.slice(page * pageSize, (page + 1) * pageSize).map((doc, i) => {
                const count = getMedCount(doc.id);
                return (
                  <tr
                    key={doc.id}
                    data-ocid={`admin.medicines.doctor_row.${i + 1}`}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {/* Doctor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                            {doc.name}
                            {doc.isHeadPhysician && (
                              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] px-1.5 py-0">
                                Head Physician
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {doc.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-5 py-4 text-sm text-foreground">
                      {doc.specialty}
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {doc.department || (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          doc.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                            : "bg-destructive/15 text-destructive border-destructive/25"
                        }`}
                      >
                        {doc.status}
                      </Badge>
                    </td>

                    {/* Medicines Count */}
                    <td className="px-5 py-4">
                      {count === null ? (
                        <span className="text-xs text-muted-foreground/40 italic">
                          Not loaded
                        </span>
                      ) : count === 0 ? (
                        <span className="text-xs text-muted-foreground/50">
                          No medicines
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Pill className="w-3 h-3" />
                          {count} medicine{count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <Button
                        data-ocid={`admin.medicines.view_button.${i + 1}`}
                        size="sm"
                        onClick={() => openView(doc)}
                        className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-sm"
                      >
                        <Pill className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
              </tbody>

            </table>

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

      {/* ══════════════════════════════════════════════════
          VIEW / MANAGE MEDICINES DIALOG
      ══════════════════════════════════════════════════ */}
      <Dialog
        open={!!viewDoctor}
        onOpenChange={(open) => {
          if (!open) {
            setViewDoctor(null);
            setShowAddForm(false);
          }
        }}
      >
        <DialogContent
          className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
          data-ocid="admin.medicines.dialog"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleExcelUpload(file);
            }}
          />

          {/* Dialog Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground font-display">
                    {viewDoctor?.name}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {viewDoctor?.specialty}
                    {viewDoctor?.department
                      ? ` · ${viewDoctor.department}`
                      : ""}
                    {" · "}
                    <span
                      className={
                        dialogMeds.length > 0
                          ? "text-emerald-400 font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {dialogLoading
                        ? "Loading…"
                        : `${dialogMeds.length} medicine${dialogMeds.length !== 1 ? "s" : ""} in catalog`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  data-ocid="admin.medicines.dialog.download_template_button"
                  variant="outline"
                  size="sm"
                  disabled={saving || dialogLoading}
                  onClick={downloadExcelTemplate}
                  className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </Button>
                <Button
                  data-ocid="admin.medicines.dialog.upload_excel_button"
                  variant="outline"
                  size="sm"
                  disabled={saving || dialogLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload Excel
                </Button>
                <Button
                  data-ocid="admin.medicines.dialog.add_button"
                  size="sm"
                  disabled={saving || dialogLoading}
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setAddForm(EMPTY_MED);
                  }}
                  className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Medicine
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* ── Add Medicine Form (inline) ── */}
          {showAddForm && (
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex-shrink-0">
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-accent" />
                Add New Medicine
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Medicine Name *
                  </Label>
                  <Input
                    data-ocid="admin.medicines.add_form.name"
                    value={addForm.medicineName}
                    onChange={(e) =>
                      setAddForm((p) => ({
                        ...p,
                        medicineName: e.target.value,
                      }))
                    }
                    placeholder="e.g. BComplex"
                    className="h-8 text-sm bg-card border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select
                    value={addForm.type}
                    onValueChange={(v) =>
                      setAddForm((p) => ({ ...p, type: v }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-sm bg-card border-border"
                      data-ocid="admin.medicines.add_form.type"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Company
                  </Label>
                  <Input
                    data-ocid="admin.medicines.add_form.company"
                    value={addForm.company}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, company: e.target.value }))
                    }
                    placeholder="e.g. ABC Pharma"
                    className="h-8 text-sm bg-card border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Dosage
                  </Label>
                  <Input
                    data-ocid="admin.medicines.add_form.dosage"
                    value={addForm.dosage}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, dosage: e.target.value }))
                    }
                    placeholder="e.g. 500mg"
                    className="h-8 text-sm bg-card border-border"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  data-ocid="admin.medicines.add_form.save_button"
                  size="sm"
                  onClick={handleAddMedicine}
                  disabled={saving || !addForm.medicineName.trim()}
                  className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Add to List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddForm(EMPTY_MED);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── Medicine Table ── */}
          <div className="flex-1 overflow-y-auto">
            {dialogLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading medicines…
                </span>
              </div>
            ) : dialogMeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <Pill className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground">
                    No medicines in catalog
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Click <span className="font-bold">"Upload Excel"</span> or{" "}
                    <span className="font-bold">"Add Medicine"</span> to get
                    started
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="flex items-center gap-6 px-6 py-3 border-b border-border/30 bg-muted/5 text-xs text-muted-foreground">
                  <span>
                    <span className="font-semibold text-foreground">
                      {dialogMeds.length}
                    </span>{" "}
                    medicines in catalog
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">
                      {
                        [
                          ...new Set(
                            dialogMeds.map((m) => m.company).filter(Boolean),
                          ),
                        ].length
                      }
                    </span>{" "}
                    companies
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">
                      {
                        [
                          ...new Set(
                            dialogMeds.map((m) => m.type).filter(Boolean),
                          ),
                        ].length
                      }
                    </span>{" "}
                    types
                  </span>
                </div>

                <table
                  className="w-full"
                  data-ocid="admin.medicines.dialog.table"
                >
                  <thead className="bg-muted/20 sticky top-0 z-10">
                    <tr>
                      {[
                        "#",
                        "Medicine Name",
                        "Type",
                        "Company",
                        "Dosage",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {dialogMeds.map((med, idx) => (
                      <tr
                        key={idx}
                        data-ocid={`admin.medicines.dialog.row.${idx + 1}`}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {/* # */}
                        <td className="px-5 py-3 text-xs text-muted-foreground font-mono w-10">
                          {idx + 1}
                        </td>

                        {/* Medicine Name */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                              <Pill className="w-3 h-3 text-emerald-400" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {med.medicineName}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-3">
                          {med.type ? (
                            <Badge
                              variant="outline"
                              className={`text-xs border ${getBadgeClass(med.type)}`}
                            >
                              {med.type}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </td>

                        {/* Company */}
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {med.company || (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Dosage */}
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/30">
                            {med.dosage || "—"}
                          </span>
                        </td>

                        {/* Delete */}
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            data-ocid={`admin.medicines.dialog.delete.${idx + 1}`}
                            onClick={() => handleDeleteMedicine(idx)}
                            disabled={saving}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Dialog Footer */}
          <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between bg-muted/5">
            <p className="text-xs text-muted-foreground">
              {saving ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving changes…
                </span>
              ) : (
                <span className="text-muted-foreground/60">
                  Changes are saved automatically
                </span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewDoctor(null);
                setShowAddForm(false);
              }}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

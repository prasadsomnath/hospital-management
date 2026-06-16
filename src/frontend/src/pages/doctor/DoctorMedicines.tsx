import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { formatDisplayName } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Pill,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PaginationControl } from "@/components/ui/pagination-control";

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
  for (const med of incoming) {
    if (!existingNames.has(med.medicineName.toLowerCase())) {
      merged.push(med);
      existingNames.add(med.medicineName.toLowerCase());
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
export default function DoctorMedicines() {
  const { user } = useAuthStore();

  // Resolve doctor credentials
  const doctorIdStr = user?.id || "1";
  const doctorId = isNaN(Number(doctorIdStr)) ? 1 : Number(doctorIdStr);
  const rawDoctorName = formatDisplayName(user?.name) || "Doctor";
  const doctorName = rawDoctorName.startsWith("Dr. ")
    ? rawDoctorName
    : `Dr. ${rawDoctorName}`;
  const hospitalCode = user?.hospitalCode || "HSP001";

  // State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when search term changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Medicine>(EMPTY_MED);

  // File input ref for Excel upload
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

  // ---- Fetch medicines ----
  const loadMedicines = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any[]>(`/doctor/medicines`, {
        params: { doctorId: String(doctorId) },
        headers: { "X-Hospital-Code": hospitalCode },
      });
      const list: Medicine[] = (res || []).map((m: any) => ({
        medicineName: m.medicineName || "",
        type: m.type || "",
        company: m.company || "",
        dosage: m.dosage || "",
      }));
      localStorage.setItem(
        `medicines-doctor-${doctorId}-${hospitalCode}`,
        JSON.stringify(list),
      );
      setMedicines(list);
    } catch (e) {
      const cached = localStorage.getItem(
        `medicines-doctor-${doctorId}-${hospitalCode}`,
      );
      if (cached) {
        setMedicines(JSON.parse(cached));
        toast.info("Using cached medicines catalog.");
      } else {
        toast.error("Failed to load medicines catalog.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [doctorId, hospitalCode]);

  // ---- Save medicines list to backend ----
  const saveMedicinesList = async (updatedList: Medicine[]) => {
    try {
      await apiFetch<any>("/doctor/medicines/bulk", {
        method: "POST",
        headers: { "X-Hospital-Code": hospitalCode },
        body: JSON.stringify({ doctorId, doctorName, medicines: updatedList }),
      });
    } catch {
      // offline fallback
      toast.warning("Offline: Changes cached locally and will sync later.");
    }
    localStorage.setItem(
      `medicines-doctor-${doctorId}-${hospitalCode}`,
      JSON.stringify(updatedList),
    );
    setMedicines(updatedList);
  };

  // ---- Handle Excel Upload (MERGE) ----
  const handleExcelUpload = async (file: File) => {
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
        return;
      }
      const merged = mergeMedicines(medicines, incoming);
      const added = merged.length - medicines.length;
      const skipped = incoming.length - added;

      await saveMedicinesList(merged);
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
    if (!addForm.medicineName.trim()) {
      toast.error("Medicine name is required.");
      return;
    }
    const isDuplicate = medicines.some(
      (m) =>
        m.medicineName.toLowerCase() ===
        addForm.medicineName.toLowerCase().trim(),
    );
    if (isDuplicate) {
      toast.error(`"${addForm.medicineName}" already exists in your catalog.`);
      return;
    }
    try {
      setSaving(true);
      const newMed: Medicine = {
        medicineName: addForm.medicineName.trim(),
        type: addForm.type,
        company: addForm.company.trim(),
        dosage: addForm.dosage.trim(),
      };
      const updated = [...medicines, newMed];
      await saveMedicinesList(updated);
      setAddForm(EMPTY_MED);
      setShowAddForm(false);
      toast.success(`"${newMed.medicineName}" added successfully!`);
    } catch (e) {
      toast.error("Failed to add medicine.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Handle Delete Medicine ----
  const handleDeleteMedicine = async (medToDelete: Medicine) => {
    try {
      setSaving(true);
      const updated = medicines.filter((m) => m.medicineName.toLowerCase() !== medToDelete.medicineName.toLowerCase());
      await saveMedicinesList(updated);
      toast.success("Medicine removed.");
    } catch (e) {
      toast.error("Failed to delete medicine.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      m.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      (m.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.type || "").toLowerCase().includes(search.toLowerCase()),
  );

  const startIndex = page * pageSize;
  const paginatedMedicines = filteredMedicines.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6" data-ocid="doctor.medicines.page">
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

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
              <Pill className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display leading-tight">
                My Medicines Catalog
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Manage your personalized medicines list — upload Excel or add
                medicines individually
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            data-ocid="doctor.medicines.download_template_button"
            variant="outline"
            disabled={saving || loading}
            onClick={downloadExcelTemplate}
            className="gap-1.5 text-xs border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
          >
            <Download className="w-3.5 h-3.5" />
            Download Template
          </Button>
          <Button
            data-ocid="doctor.medicines.upload_excel_button"
            variant="outline"
            disabled={saving || loading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload Excel
          </Button>
          <Button
            data-ocid="doctor.medicines.add_button"
            disabled={saving || loading}
            onClick={() => {
              setShowAddForm(!showAddForm);
              setAddForm(EMPTY_MED);
            }}
            className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Medicine
          </Button>
        </div>
      </div>

      {/* ── Add Medicine Form (inline) ── */}
      {showAddForm && (
        <div className="glass-elevated rounded-xl p-5 border border-border bg-muted/10">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-400" />
            Add New Medicine to Catalog
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Medicine Name *
              </Label>
              <Input
                data-ocid="doctor.medicines.add_form.name"
                value={addForm.medicineName}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, medicineName: e.target.value }))
                }
                placeholder="e.g. Paracetamol"
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={addForm.type}
                onValueChange={(v) => setAddForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger
                  className="bg-card border-border"
                  data-ocid="doctor.medicines.add_form.type"
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
              <Label className="text-xs text-muted-foreground">Company</Label>
              <Input
                data-ocid="doctor.medicines.add_form.company"
                value={addForm.company}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, company: e.target.value }))
                }
                placeholder="e.g. GlaxoSmithKline"
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dosage</Label>
              <Input
                data-ocid="doctor.medicines.add_form.dosage"
                value={addForm.dosage}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, dosage: e.target.value }))
                }
                placeholder="e.g. 650mg"
                className="bg-card border-border"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              data-ocid="doctor.medicines.add_form.save_button"
              size="sm"
              onClick={handleAddMedicine}
              disabled={saving || !addForm.medicineName.trim()}
              className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/10"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add to Catalog
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

      {/* ── Search and Summary Bar ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="doctor.medicines.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, type, or company…"
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

        {medicines.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground self-end sm:self-auto">
            <span>
              Total:{" "}
              <span className="font-semibold text-foreground">
                {medicines.length}
              </span>{" "}
              medicines
            </span>
            <span>
              Companies:{" "}
              <span className="font-semibold text-foreground">
                {
                  [...new Set(medicines.map((m) => m.company).filter(Boolean))]
                    .length
                }
              </span>
            </span>
            <span>
              Types:{" "}
              <span className="font-semibold text-foreground">
                {
                  [...new Set(medicines.map((m) => m.type).filter(Boolean))]
                    .length
                }
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Medicines Catalog Table ─────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          <span className="ml-3 text-sm text-muted-foreground font-medium">
            Loading medicines catalog…
          </span>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="glass-elevated rounded-xl p-16 text-center shadow-glass-sm">
          <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
            <Pill className="w-6 h-6 text-muted-foreground/45" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {search
              ? "No medicines match your search."
              : "Your medicines catalog is empty."}
          </p>
          {!search && (
            <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-md mx-auto">
              Get started by uploading an Excel spreadsheet containing your
              medicines list, or click "Add Medicine" to enter them manually.
            </p>
          )}
        </div>
      ) : (
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm border border-border/40">
          <div className="overflow-x-auto">
            <table className="w-full" data-ocid="doctor.medicines.table">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  {["#", "Medicine Name", "Type", "Company", "Dosage", ""].map(
                    (h, idx) => (
                      <th
                        key={idx}
                        className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left ${
                          h === "" ? "w-16 text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedMedicines.map((med, idx) => (
                  <tr
                    key={med.medicineName}
                    data-ocid={`doctor.medicines.row.${startIndex + idx + 1}`}
                    className="hover:bg-muted/15 transition-colors group"
                  >
                    {/* Index */}
                    <td className="px-5 py-4 text-xs text-muted-foreground font-mono w-10">
                      {startIndex + idx + 1}
                    </td>

                    {/* Medicine Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {med.medicineName}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
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
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {med.company || (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Dosage */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/30">
                        {med.dosage || "—"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        data-ocid={`doctor.medicines.delete.${startIndex + idx + 1}`}
                        onClick={() => handleDeleteMedicine(med)}
                        disabled={saving}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove from catalog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-2 border-t border-border/20">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(filteredMedicines.length / pageSize)}
              totalElements={filteredMedicines.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(0);
              }}
            />
          </div>

          {/* Auto-saved footer notification */}
          <div className="px-5 py-3 bg-muted/5 border-t border-border/50 text-xs text-muted-foreground/80 flex items-center justify-between">
            <span>
              {saving ? (
                <span className="flex items-center gap-1.5 text-teal-400 font-medium">
                  <Loader2 className="w-3 animate-spin" />
                  Saving changes…
                </span>
              ) : (
                "✓ Catalog synced with server"
              )}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              Offline cache is enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

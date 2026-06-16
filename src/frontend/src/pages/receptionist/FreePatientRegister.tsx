import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type {
  FreePatientRegisterResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Edit,
  FileText,
  Gift,
  Info,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SERVICES_OPTIONS = [
  "Consultation",
  "OT",
  "Medicine",
  "Lab",
  "Ward",
  "All",
];

export default function FreePatientRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [freeEntries, setFreeEntries] = useState<FreePatientRegisterResponse[]>(
    [],
  );
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<FreePatientRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formPatientSearch, setFormPatientSearch] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formIpOpNo, setFormIpOpNo] = useState("");
  const [formSchemeName, setFormSchemeName] = useState("BPL");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formAuthorisedById, setFormAuthorisedById] = useState("");
  const [formApprovalDate, setFormApprovalDate] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [freeList, patList, docList] = await Promise.all([
        receptionApi.getFreePatientEntries(code),
        receptionApi.getPatients(code),
        apiFetch<any>("/admin/doctors", {
          params: { page: 0, size: 1000 },
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      setFreeEntries(Array.isArray(freeList) ? freeList : []);
      setPatients(Array.isArray(patList) ? patList : []);
      setDoctors(Array.isArray(docList) ? docList : docList?.content || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Free Patient register logs");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const filteredPatientSuggestions = patients.filter((p) => {
    if (p.category?.toUpperCase() !== "IPD") return false;
    if (!formPatientSearch) return false;
    const q = formPatientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.patientNo.toLowerCase().includes(q)
    );
  });

  const handlePatientSelect = (p: PatientResponse) => {
    setFormPatientNo(p.patientNo);
    setFormPatientName(p.name);
    setFormPatientSearch(p.name);
  };

  const handleNewEntry = () => {
    setFormPatientSearch("");
    setFormPatientNo("");
    setFormPatientName("");
    setFormIpOpNo("");
    setFormSchemeName("BPL");
    setSelectedServices([]);
    setFormAuthorisedById("");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 10);
    setFormApprovalDate(todayStr);

    setFormRemarks("");
    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select a Free Patient record to edit.");
      return;
    }
    const entry = freeEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormPatientSearch(entry.patientName);
    setFormIpOpNo(entry.ipOpNo || "");
    setFormSchemeName(entry.schemeName || "BPL");

    const services = entry.servicesCovered
      ? entry.servicesCovered.split(",").map((s) => s.trim())
      : [];
    setSelectedServices(services);

    setFormAuthorisedById(entry.authorisedById || "");
    setFormApprovalDate(entry.approvalDate || "");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    if (service === "All") {
      if (checked) {
        setSelectedServices([
          "All",
          "Consultation",
          "OT",
          "Medicine",
          "Lab",
          "Ward",
        ]);
      } else {
        setSelectedServices([]);
      }
    } else {
      let updated = [...selectedServices];
      if (checked) {
        updated.push(service);
        // If all sub-services are checked, check "All" too
        const subServices = SERVICES_OPTIONS.filter((s) => s !== "All");
        const allChecked = subServices.every((s) => updated.includes(s));
        if (allChecked && !updated.includes("All")) {
          updated.push("All");
        }
      } else {
        updated = updated.filter((s) => s !== service && s !== "All");
      }
      setSelectedServices(updated);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientNo) {
      toast.error("Please select a registered patient.");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please select at least one covered service.");
      return;
    }
    if (!formApprovalDate) {
      toast.error("Please enter the approval date.");
      return;
    }

    const matchedDoc = doctors.find((d) => d.doctorCode === formAuthorisedById);
    const authorisedByName = matchedDoc
      ? `Dr. ${matchedDoc.firstName} ${matchedDoc.lastName || ""}`.trim()
      : "Administrator";

    const payload = {
      patientNo: formPatientNo,
      patientName: formPatientName,
      ipOpNo: formIpOpNo || null,
      schemeName: formSchemeName,
      servicesCovered: selectedServices.join(","),
      authorisedById: formAuthorisedById || null,
      authorisedByName: authorisedByName,
      approvalDate: formApprovalDate,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateFreePatientEntry(selectedRowId, payload, code);
        toast.success("Free Patient entry updated successfully.");
      } else {
        await receptionApi.createFreePatientEntry(payload, code);
        toast.success("New Free Patient entry logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Free Patient entry.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select a Free Patient record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this Free Patient entry?")) {
      return;
    }

    try {
      await receptionApi.deleteFreePatientEntry(selectedRowId, code);
      toast.success("Free Patient record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete Free Patient entry.");
    }
  };

  const handlePrintSlip = (entry: FreePatientRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const approvalDate = new Date(entry.approvalDate).toLocaleDateString();

    const htmlContent = `
      <html>
        <head>
          <title>Free Treatment Clearance - ${entry.freePatientId}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #1f2937; margin: 3rem; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
            .header h1 { font-size: 1.85rem; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
            .header p { font-size: 0.875rem; margin: 0.25rem 0 0; color: #4b5563; font-weight: 600; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem; }
            .field { border-bottom: 1px solid #e5e7eb; padding: 0.5rem 0; font-size: 0.9rem; }
            .field-label { font-weight: 700; color: #4b5563; font-size: 0.75rem; text-transform: uppercase; }
            .field-value { margin-top: 0.25rem; font-size: 1rem; font-weight: 500; }
            .full-width { grid-column: span 2; }
            .badge-container { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
            .badge-item { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; }
            .legal-text { font-size: 0.8rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 2rem; margin-top: 4rem; }
            .signatures { margin-top: 6rem; display: flex; justify-content: space-between; font-size: 0.9rem; }
            .sig-line { border-top: 1px solid #111827; width: 250px; text-align: center; padding-top: 0.5rem; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Free Patient Concession Slip</h1>
            <p>Department of Social Welfare / Hospital Policy &bull; Slip ID: ${entry.freePatientId}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">Registry Free ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #10b981;">${entry.freePatientId}</div>
            </div>
            <div class="field">
              <div class="field-label">Concession Scheme</div>
              <div class="field-value" style="font-weight: 700;">${entry.schemeName}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient ID</div>
              <div class="field-value" style="font-family: monospace;">${entry.patientNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Name</div>
              <div class="field-value" style="font-weight: 700;">${entry.patientName}</div>
            </div>
            <div class="field">
              <div class="field-label">IP/OP Number</div>
              <div class="field-value">${entry.ipOpNo || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Approval Date</div>
              <div class="field-value" style="font-weight: bold;">${approvalDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Authorised By</div>
              <div class="field-value">${entry.authorisedByName || "—"}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Covered Services / Concessions</div>
              <div class="badge-container">
                ${entry.servicesCovered
                  .split(",")
                  .map((s) => `<span class="badge-item">${s.trim()}</span>`)
                  .join("")}
              </div>
            </div>
            <div class="field full-width">
              <div class="field-label">Remarks / Social Review Details</div>
              <div class="field-value" style="font-style: italic;">${entry.remarks || "No additional remarks."}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">Patient / Attendant Signature</div>
            <div class="sig-line">Authorised Officer / Admin</div>
          </div>

          <div class="legal-text">
            This slip authorizes concessions on selected hospital services. All other services, if not marked, will be charged as per standard rates.
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredFreeEntries = freeEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.freePatientId.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.patientNo.toLowerCase().includes(q) ||
      e.schemeName.toLowerCase().includes(q)
    );
  });

  const paginatedFreeEntries = filteredFreeEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="free.patient.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/20 dark:bg-zinc-700/20 flex items-center justify-center shadow-inner">
            <Gift className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Free Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Official hospital registry of free treatments, government scheme
              concessions, BPL policies, and administrative waivers
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Gift className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>
              Total Waivers:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredFreeEntries.length}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Card Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg mt-1">
        {/* Actions panel */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-wrap gap-2 items-center justify-between">
          {user?.role === "receptionist" ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                onClick={handleNewEntry}
                className="h-8.5 px-3 text-xs bg-zinc-800 hover:bg-zinc-900 text-white gap-1.5 font-semibold dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Waiver Entry
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditEntry}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Record
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const entry = freeEntries.find((e) => e.id === selectedRowId);
                  if (entry) {
                    setViewingEntry(entry);
                    setDetailOpen(true);
                  }
                }}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <FileText className="w-3.5 h-3.5" /> View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteEntry}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1.5 rounded-lg">
                View-Only Mode
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const entry = freeEntries.find((e) => e.id === selectedRowId);
                  if (entry) {
                    setViewingEntry(entry);
                    setDetailOpen(true);
                  }
                }}
                disabled={selectedRowId === null}
                className="h-8.5 px-3 text-xs gap-1.5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-50 font-medium rounded-lg"
              >
                <FileText className="w-3.5 h-3.5" /> View Details
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8.5 text-rose-500 hover:bg-rose-500/10 font-bold text-xs"
            onClick={() =>
              navigate({
                to:
                  user?.role === "doctor"
                    ? "/doctor"
                    : user?.role === "admin"
                      ? "/admin"
                      : "/receptionist",
              })
            }
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Free Patient Records
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Free ID, Patient Name, ID, Scheme..."
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
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Srl</th>
                <th className="px-3.5 py-3">Free ID</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">IP/OP Number</th>
                <th className="px-3.5 py-3">Scheme Name</th>
                <th className="px-3.5 py-3">Services Covered</th>
                <th className="px-3.5 py-3">Approval Date</th>
                <th className="px-3.5 py-3">Authorised By</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedFreeEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const formattedDate = new Date(
                  row.approvalDate,
                ).toLocaleDateString("en-US", {
                  dateStyle: "medium",
                });
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRowId(isSelected ? null : row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedRowId(isSelected ? null : row.id);
                      }
                    }}
                    tabIndex={0}
                    className={`cursor-pointer transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 ${
                      isSelected
                        ? "bg-zinc-500/10 hover:bg-zinc-500/15 font-medium"
                        : ""
                    }`}
                  >
                    <td className="px-3.5 py-3 text-zinc-500 font-mono">
                      {page * pageSize + i + 1}
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {row.freePatientId}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.patientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {row.patientNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300 font-mono">
                      {row.ipOpNo || "—"}
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-foreground">
                      {row.schemeName}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.servicesCovered.split(",").map((s, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[9px] px-1 font-semibold uppercase bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                          >
                            {s.trim()}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400 font-mono whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300">
                      {row.authorisedByName || "—"}
                    </td>
                    <td
                      className="px-3.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => {
                            setViewingEntry(row);
                            setDetailOpen(true);
                          }}
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Print Clearance Slip"
                          onClick={() => handlePrintSlip(row)}
                          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredFreeEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching waivers..."
                          : "No Free Patient records registered yet"}
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
          totalPages={Math.ceil(filteredFreeEntries.length / pageSize)}
          totalElements={filteredFreeEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Free Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Gift className="w-4 h-4 text-zinc-700 dark:text-zinc-300 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Free Patient Registry waiver"
                : "Register Free Patient Waiver"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Patient linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION A — Patient Linking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2 relative">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Lookup Patient *
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="Search patient name or ID..."
                      value={formPatientSearch}
                      onChange={(e) => setFormPatientSearch(e.target.value)}
                      className="pl-7 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  {filteredPatientSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredPatientSuggestions.map((p) => (
                        <div
                          key={p.patientNo}
                          onClick={() => handlePatientSelect(p)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handlePatientSelect(p);
                            }
                          }}
                          tabIndex={0}
                          className="px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {p.patientNo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Patient ID
                  </Label>
                  <Input
                    value={formPatientNo}
                    readOnly
                    placeholder="Selected ID"
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Scheme Details */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Waiver Concession Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    IP/OP Number
                  </Label>
                  <Input
                    placeholder="e.g. IP-1234 or OP-4321"
                    value={formIpOpNo}
                    onChange={(e) => setFormIpOpNo(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Scheme Name *
                  </Label>
                  <Select
                    value={formSchemeName}
                    onValueChange={setFormSchemeName}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BPL">
                        BPL (Below Poverty Line)
                      </SelectItem>
                      <SelectItem value="Govt. Scheme">
                        Govt. Scheme (PM-JAY/State)
                      </SelectItem>
                      <SelectItem value="Hospital Policy">
                        Hospital Policy Waiver
                      </SelectItem>
                      <SelectItem value="Doctor Discretion">
                        Doctor Discretion
                      </SelectItem>
                      <SelectItem value="Other">Other Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Authorised By
                  </Label>
                  <Select
                    value={formAuthorisedById}
                    onValueChange={setFormAuthorisedById}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Admin/Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        Administrator / Reception Coordinator
                      </SelectItem>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.doctorCode} value={doc.doctorCode}>
                          Dr. {doc.firstName} {doc.lastName || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Approval Date *
                  </Label>
                  <Input
                    type="date"
                    value={formApprovalDate}
                    onChange={(e) => setFormApprovalDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes for Services Covered */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION C — Services Covered *
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICES_OPTIONS.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service}`}
                      checked={selectedServices.includes(service)}
                      onCheckedChange={(checked) =>
                        handleServiceChange(service, !!checked)
                      }
                    />
                    <Label
                      htmlFor={`service-${service}`}
                      className="text-xs font-semibold cursor-pointer text-zinc-700 dark:text-zinc-300"
                    >
                      {service === "All"
                        ? "All Services (Full Waiver)"
                        : service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Remarks / Concession Notes
              </Label>
              <Textarea
                placeholder="Social review notes, income certificate reference details, or special concession instructions..."
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                className="h-20 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-9 px-4 text-xs font-medium border-zinc-200 dark:border-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                {selectedRowId !== null
                  ? "Save Concessions"
                  : "Authorize Waiver"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Free Detail Dossier Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Free Treatment Registry Concession — {viewingEntry?.freePatientId}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Patient Details
                  </h4>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {viewingEntry.patientName}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Patient ID: {viewingEntry.patientNo}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    IP/OP Number: {viewingEntry.ipOpNo || "—"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Concession registry
                  </h4>
                  <p className="text-sm font-mono font-bold text-emerald-500 mt-1">
                    {viewingEntry.freePatientId}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Authorized:{" "}
                    {new Date(viewingEntry.approvalDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                  Concession Details
                </h4>
                <p className="text-zinc-800 dark:text-zinc-200">
                  <strong>Waiver Scheme:</strong> {viewingEntry.schemeName}
                </p>
                <p className="text-zinc-800 dark:text-zinc-200">
                  <strong>Authorised By:</strong>{" "}
                  {viewingEntry.authorisedByName || "—"}
                </p>
                <div className="flex flex-wrap gap-1 mt-1 items-center">
                  <strong className="text-zinc-800 dark:text-zinc-200 mr-2">
                    Covered Services:
                  </strong>
                  {viewingEntry.servicesCovered.split(",").map((s, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[9px] px-1.5 font-bold bg-zinc-100 dark:bg-zinc-900"
                    >
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              {viewingEntry.remarks && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
                    Remarks / Social Assessment
                  </h4>
                  <p className="text-zinc-700 dark:text-zinc-300 italic">
                    {viewingEntry.remarks}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailOpen(false)}
                  className="h-9 px-4 text-xs font-medium border-zinc-200 dark:border-zinc-800"
                >
                  Close dossier
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePrintSlip(viewingEntry)}
                  className="h-9 px-4 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold gap-1.5 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  <Printer className="w-4 h-4" /> Print Waiver Slip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

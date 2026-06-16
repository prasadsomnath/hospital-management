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
import type {
  BillResponse,
  InsuranceBillRegisterResponse,
} from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Edit,
  FileText,
  Info,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function InsuranceBillRegister() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Data states
  const [insuranceEntries, setInsuranceEntries] = useState<
    InsuranceBillRegisterResponse[]
  >([]);
  const [bills, setBills] = useState<BillResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Selection States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<InsuranceBillRegisterResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields State
  const [formBillSearch, setFormBillSearch] = useState("");
  const [formBillNo, setFormBillNo] = useState("");
  const [formPatientNo, setFormPatientNo] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formIpNo, setFormIpNo] = useState("");
  const [formInsurerName, setFormInsurerName] = useState("");
  const [formPolicyNumber, setFormPolicyNumber] = useState("");
  const [formTpaName, setFormTpaName] = useState("");
  const [formSchemeType, setFormSchemeType] = useState("Cashless");
  const [formClaimAmount, setFormClaimAmount] = useState<number | "">("");
  const [formApprovedAmount, setFormApprovedAmount] = useState<number | "">("");
  const [formBalanceToPatient, setFormBalanceToPatient] = useState<number>(0);
  const [formClaimStatus, setFormClaimStatus] = useState("Submitted");
  const [formSubmissionDate, setFormSubmissionDate] = useState("");
  const [formSettlementDate, setFormSettlementDate] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [insList, billList] = await Promise.all([
        receptionApi.getInsuranceBillEntries(
          code,
          statusFilter !== "ALL" ? statusFilter : undefined,
        ),
        receptionApi.getBills(code),
      ]);
      setInsuranceEntries(Array.isArray(insList) ? insList : []);
      setBills(Array.isArray(billList) ? billList : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Insurance Bill registry logs");
    } finally {
      setLoading(false);
    }
  }, [code, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  // Recalculate balance when claim or approved amount changes
  useEffect(() => {
    const claim = Number(formClaimAmount) || 0;
    const approved = Number(formApprovedAmount) || 0;
    setFormBalanceToPatient(Math.max(0, claim - approved));
  }, [formClaimAmount, formApprovedAmount]);

  const filteredBillSuggestions = bills.filter((b) => {
    if (!formBillSearch) return false;
    const q = formBillSearch.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      b.patientName.toLowerCase().includes(q) ||
      b.patientNo.toLowerCase().includes(q)
    );
  });

  const handleBillSelect = (b: BillResponse) => {
    setFormBillNo(b.billNumber);
    setFormPatientNo(b.patientNo);
    setFormPatientName(b.patientName);
    setFormBillSearch(b.billNumber);
    setFormClaimAmount(b.netAmount);
    setFormIpNo(b.billType === "IPD" ? "IPD Case" : "OPD Case");
  };

  const handleNewEntry = () => {
    setFormBillSearch("");
    setFormBillNo("");
    setFormPatientNo("");
    setFormPatientName("");
    setFormIpNo("");
    setFormInsurerName("");
    setFormPolicyNumber("");
    setFormTpaName("");
    setFormSchemeType("Cashless");
    setFormClaimAmount("");
    setFormApprovedAmount("");
    setFormBalanceToPatient(0);
    setFormClaimStatus("Submitted");

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const todayStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 10);
    setFormSubmissionDate(todayStr);
    setFormSettlementDate("");
    setFormRemarks("");

    setSelectedRowId(null);
    setDialogOpen(true);
  };

  const handleEditEntry = () => {
    if (selectedRowId === null) {
      toast.info("Please select an Insurance Bill record to edit.");
      return;
    }
    const entry = insuranceEntries.find((e) => e.id === selectedRowId);
    if (!entry) return;

    setFormBillNo(entry.billNo);
    setFormPatientNo(entry.patientNo);
    setFormPatientName(entry.patientName);
    setFormBillSearch(entry.billNo);
    setFormIpNo(entry.ipNo || "");
    setFormInsurerName(entry.insurerName);
    setFormPolicyNumber(entry.policyNumber);
    setFormTpaName(entry.tpaName || "");
    setFormSchemeType(entry.schemeType || "Cashless");
    setFormClaimAmount(entry.claimAmount ?? "");
    setFormApprovedAmount(entry.approvedAmount ?? "");
    setFormBalanceToPatient(entry.balanceToPatient ?? 0);
    setFormClaimStatus(entry.claimStatus || "Submitted");
    setFormSubmissionDate(entry.submissionDate || "");
    setFormSettlementDate(entry.settlementDate || "");
    setFormRemarks(entry.remarks || "");

    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBillNo) {
      toast.error("Please link a valid Bill Number.");
      return;
    }
    if (!formInsurerName.trim()) {
      toast.error("Please enter the Insurer Name.");
      return;
    }
    if (!formPolicyNumber.trim()) {
      toast.error("Please enter the Policy Number.");
      return;
    }
    if (formClaimAmount === "") {
      toast.error("Please enter the Claim Amount.");
      return;
    }
    if (!formSubmissionDate) {
      toast.error("Please enter the Submission Date.");
      return;
    }

    const payload = {
      billNo: formBillNo,
      patientNo: formPatientNo,
      patientName: formPatientName,
      ipNo: formIpNo || null,
      insurerName: formInsurerName,
      policyNumber: formPolicyNumber,
      tpaName: formTpaName || null,
      schemeType: formSchemeType,
      claimAmount: Number(formClaimAmount),
      approvedAmount:
        formApprovedAmount === "" ? null : Number(formApprovedAmount),
      balanceToPatient: formBalanceToPatient,
      claimStatus: formClaimStatus,
      submissionDate: formSubmissionDate,
      settlementDate: formSettlementDate || null,
      remarks: formRemarks || null,
    };

    try {
      if (selectedRowId !== null) {
        await receptionApi.updateInsuranceBillEntry(
          selectedRowId,
          payload,
          code,
        );
        toast.success("Insurance claim updated successfully.");
      } else {
        await receptionApi.createInsuranceBillEntry(payload, code);
        toast.success("New Insurance claim logged successfully.");
      }
      setDialogOpen(false);
      setSelectedRowId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Insurance Claim.");
    }
  };

  const handleDeleteEntry = async () => {
    if (selectedRowId === null) {
      toast.info("Please select an Insurance Bill record to delete.");
      return;
    }
    if (!confirm("Are you sure you want to remove this Insurance Claim?")) {
      return;
    }

    try {
      await receptionApi.deleteInsuranceBillEntry(selectedRowId, code);
      toast.success("Insurance Claim record deleted successfully.");
      setSelectedRowId(null);
      loadData();
    } catch {
      toast.error("Failed to delete Insurance Claim.");
    }
  };

  const handlePrintSlip = (entry: InsuranceBillRegisterResponse) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocker prevented printing.");
      return;
    }

    const submissionDate = new Date(entry.submissionDate).toLocaleDateString();
    const settlementDate = entry.settlementDate
      ? new Date(entry.settlementDate).toLocaleDateString()
      : "Pending";

    const htmlContent = `
      <html>
        <head>
          <title>Pre-Auth Claim Submission - ${entry.insuranceBillId}</title>
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
            .block-text { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 1rem; font-size: 0.95rem; }
            .legal-text { font-size: 0.8rem; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 2rem; margin-top: 4rem; }
            .signatures { margin-top: 6rem; display: flex; justify-content: space-between; font-size: 0.9rem; }
            .sig-line { border-top: 1px solid #111827; width: 250px; text-align: center; padding-top: 0.5rem; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pre-Auth Claim Submission Summary</h1>
            <p>Insurance TPA Desk &bull; Claim Registry ID: ${entry.insuranceBillId}</p>
          </div>
          
          <div class="grid">
            <div class="field">
              <div class="field-label">Registry Claim ID</div>
              <div class="field-value" style="font-family: monospace; font-weight: 700; color: #3b82f6;">${entry.insuranceBillId}</div>
            </div>
            <div class="field">
              <div class="field-label">Claim Status</div>
              <div class="field-value" style="font-weight: 700; text-transform: uppercase;">${entry.claimStatus}</div>
            </div>
            <div class="field">
              <div class="field-label">Linked Hospital Bill No.</div>
              <div class="field-value" style="font-family: monospace; font-weight: bold;">${entry.billNo}</div>
            </div>
            <div class="field">
              <div class="field-label">Patient Details</div>
              <div class="field-value" style="font-weight: 700;">${entry.patientName} (${entry.patientNo})</div>
            </div>
            <div class="field">
              <div class="field-label">Insurer & TPA</div>
              <div class="field-value">${entry.insurerName} ${entry.tpaName ? `&bull; TPA: ${entry.tpaName}` : ""}</div>
            </div>
            <div class="field">
              <div class="field-label">Policy Number</div>
              <div class="field-value" style="font-family: monospace;">${entry.policyNumber}</div>
            </div>
            <div class="field">
              <div class="field-label">Scheme Type</div>
              <div class="field-value">${entry.schemeType}</div>
            </div>
            <div class="field">
              <div class="field-label">Intake IP Case Reference</div>
              <div class="field-value">${entry.ipNo || "—"}</div>
            </div>
            <div class="field">
              <div class="field-label">Submission Date</div>
              <div class="field-value">${submissionDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Settlement Date</div>
              <div class="field-value">${settlementDate}</div>
            </div>
            <div class="field">
              <div class="field-label">Claim Amount</div>
              <div class="field-value" style="font-weight: 700;">₹${Number(entry.claimAmount).toFixed(2)}</div>
            </div>
            <div class="field">
              <div class="field-label">Approved Amount</div>
              <div class="field-value" style="color: #047857; font-weight: 700;">₹${entry.approvedAmount ? Number(entry.approvedAmount).toFixed(2) : "0.00"}</div>
            </div>
            <div class="field">
              <div class="field-label">Balance Payable by Patient</div>
              <div class="field-value" style="color: #b91c1c; font-weight: 700;">₹${entry.balanceToPatient ? Number(entry.balanceToPatient).toFixed(2) : "0.00"}</div>
            </div>
            <div class="field full-width">
              <div class="field-label">Remarks / Pre-Auth Details</div>
              <div class="field-value" style="font-style: italic;">${entry.remarks || "No additional remarks."}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">Beneficiary Signature</div>
            <div class="sig-line">Insurance Desk Coordinator</div>
          </div>

          <div class="legal-text">
            This document outlines the pre-authorisation status submitted to the insurer. Final approval is subject to claim processing by TPA/Insurer.
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

  const filteredInsuranceEntries = insuranceEntries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.insuranceBillId.toLowerCase().includes(q) ||
      e.billNo.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.insurerName.toLowerCase().includes(q) ||
      e.policyNumber.toLowerCase().includes(q)
    );
  });

  const paginatedInsuranceEntries = filteredInsuranceEntries.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="insurance.bill.register.page"
    >
      {/* Header and Stats */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/20 dark:bg-zinc-700/20 flex items-center justify-center shadow-inner">
            <Shield className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Insurance Bill Patients
            </h1>
            <p className="text-xs text-muted-foreground">
              Official hospital ledger of TPA cashless/reimbursement claims.
              Supports bill linking, policy tracking, approved waivers, and
              patient balances.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm font-mono">
          <div className="px-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>
              Claims Logged:{" "}
              <b className="text-zinc-900 dark:text-zinc-100">
                {filteredInsuranceEntries.length}
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
                <Plus className="w-4 h-4" /> Log Claim
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
                  const entry = insuranceEntries.find(
                    (e) => e.id === selectedRowId,
                  );
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
                  const entry = insuranceEntries.find(
                    (e) => e.id === selectedRowId,
                  );
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
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Claim Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Partial">Partial Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Pending">Pending Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 relative flex-1 min-w-[200px]">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Search Claims
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Search Claim ID, Bill No, Patient Name, Insurer, Policy..."
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
                setStatusFilter("ALL");
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
                <th className="px-3.5 py-3">Claim ID</th>
                <th className="px-3.5 py-3">Bill No.</th>
                <th className="px-3.5 py-3">Patient Details</th>
                <th className="px-3.5 py-3">Insurer & TPA</th>
                <th className="px-3.5 py-3 text-right">Claim Amount</th>
                <th className="px-3.5 py-3 text-right">Approved</th>
                <th className="px-3.5 py-3 text-right">Patient Balance</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedInsuranceEntries.map((row, i) => {
                const isSelected = selectedRowId === row.id;
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
                      {row.insuranceBillId}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-zinc-850 dark:text-zinc-200 font-bold">
                      {row.billNo}
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.patientName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {row.patientNo}{" "}
                          {row.ipNo ? `&bull; Ref: ${row.ipNo}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {row.insurerName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          No: {row.policyNumber}{" "}
                          {row.tpaName ? `&bull; TPA: ${row.tpaName}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono font-medium">
                      ₹{Number(row.claimAmount).toFixed(2)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-emerald-500 font-semibold">
                      ₹
                      {row.approvedAmount
                        ? Number(row.approvedAmount).toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono text-rose-500 font-bold">
                      ₹
                      {row.balanceToPatient
                        ? Number(row.balanceToPatient).toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="px-3.5 py-2 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          row.claimStatus === "Approved"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : row.claimStatus === "Submitted"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-rose-500/20 text-rose-500 border-rose-500/30"
                        }`}
                      >
                        {row.claimStatus}
                      </Badge>
                    </td>
                    <td
                      className="px-3.5 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="View dossier details"
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
                          title="Print Pre-Auth slip"
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

              {filteredInsuranceEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-20 text-zinc-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-7 h-7 text-zinc-400 stroke-1" />
                      <span>
                        {loading
                          ? "Fetching insurance claims..."
                          : "No insurance claims registered yet"}
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
          totalPages={Math.ceil(filteredInsuranceEntries.length / pageSize)}
          totalElements={filteredInsuranceEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>

      {/* Insurance Entry Form Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-700 dark:text-zinc-300 animate-pulse" />
              {selectedRowId !== null
                ? "Modify Claim Record"
                : "Log Insurance Pre-Auth Claim"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveEntry}
            className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
          >
            {/* Bill linking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION A — Linked Bill Mapping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2 relative">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Lookup Hospital Bill *
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="Search bill number, patient name..."
                      value={formBillSearch}
                      onChange={(e) => setFormBillSearch(e.target.value)}
                      className="pl-7 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                    />
                  </div>
                  {filteredBillSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredBillSuggestions.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => handleBillSelect(b)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleBillSelect(b);
                            }
                          }}
                          tabIndex={0}
                          className="px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                        >
                          <span className="font-semibold font-mono">
                            {b.billNumber}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {b.patientName} (₹{b.netAmount})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Bill Number
                  </Label>
                  <Input
                    value={formBillNo}
                    readOnly
                    placeholder="Selected Bill"
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Patient Name
                  </Label>
                  <Input
                    value={formPatientName}
                    readOnly
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Patient ID
                  </Label>
                  <Input
                    value={formPatientNo}
                    readOnly
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    IP Case Reference
                  </Label>
                  <Input
                    value={formIpNo}
                    onChange={(e) => setFormIpNo(e.target.value)}
                    placeholder="e.g. IP-987"
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Insurance details */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION B — Insurer & Policy Coordinates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Insurer Name *
                  </Label>
                  <Input
                    placeholder="e.g. Star Health / ICICI..."
                    value={formInsurerName}
                    onChange={(e) => setFormInsurerName(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Policy Number *
                  </Label>
                  <Input
                    placeholder="Policy ID / Card No."
                    value={formPolicyNumber}
                    onChange={(e) => setFormPolicyNumber(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    TPA Name (If Any)
                  </Label>
                  <Input
                    placeholder="e.g. Medi Assist / MDIndia..."
                    value={formTpaName}
                    onChange={(e) => setFormTpaName(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Scheme Type *
                  </Label>
                  <Select
                    value={formSchemeType}
                    onValueChange={setFormSchemeType}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Scheme Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cashless">Cashless</SelectItem>
                      <SelectItem value="Reimbursement">
                        Reimbursement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financial tracking */}
            <div className="space-y-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1">
                SECTION C — Financial Claim Auditing
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Claim Amount *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Claimed Total"
                    value={formClaimAmount}
                    onChange={(e) =>
                      setFormClaimAmount(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Approved Amount
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Approved Total"
                    value={formApprovedAmount}
                    onChange={(e) =>
                      setFormApprovedAmount(
                        e.target.value !== "" ? Number(e.target.value) : "",
                      )
                    }
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Balance to Patient
                  </Label>
                  <Input
                    value={`₹${formBalanceToPatient.toFixed(2)}`}
                    readOnly
                    className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-mono text-rose-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Claim Status *
                  </Label>
                  <Select
                    value={formClaimStatus}
                    onValueChange={setFormClaimStatus}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Submitted">
                        Submitted (Pre-Auth)
                      </SelectItem>
                      <SelectItem value="Approved">
                        Approved (Fully Cashless)
                      </SelectItem>
                      <SelectItem value="Partial">Partial Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Pending">
                        Pending Info / Query
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Submission Date *
                  </Label>
                  <Input
                    type="date"
                    value={formSubmissionDate}
                    onChange={(e) => setFormSubmissionDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-zinc-500">
                    Settlement Date
                  </Label>
                  <Input
                    type="date"
                    value={formSettlementDate}
                    onChange={(e) => setFormSettlementDate(e.target.value)}
                    className="h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[9px] uppercase font-bold text-zinc-500">
                Remarks / Extra Notes
              </Label>
              <Textarea
                placeholder="Pre-auth approval codes, reason for query/rejection, or TPA correspondence notes..."
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
                {selectedRowId !== null ? "Save Changes" : "Log Claim"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Insurance Detail Dossier Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Insurance TPA Claim Registry Dossier —{" "}
              {viewingEntry?.insuranceBillId}
            </DialogTitle>
          </DialogHeader>

          {viewingEntry && (
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Patient details
                  </h4>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                    {viewingEntry.patientName}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Patient ID: {viewingEntry.patientNo}
                  </p>
                  <p className="text-zinc-500 font-mono mt-0.5">
                    Linked Bill No: {viewingEntry.billNo}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Claim Registry
                  </h4>
                  <p className="text-sm font-mono font-bold text-blue-500 mt-1">
                    {viewingEntry.insuranceBillId}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Submission:{" "}
                    {new Date(viewingEntry.submissionDate).toLocaleDateString()}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Settlement:{" "}
                    {viewingEntry.settlementDate
                      ? new Date(
                          viewingEntry.settlementDate,
                        ).toLocaleDateString()
                      : "Pending"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Insurer & Policy
                  </h4>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Insurer Name:</strong> {viewingEntry.insurerName}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Policy Number:</strong> {viewingEntry.policyNumber}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>TPA Name:</strong>{" "}
                    {viewingEntry.tpaName || "Direct"}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Scheme Type:</strong> {viewingEntry.schemeType}
                  </p>
                  <p className="text-zinc-800 dark:text-zinc-200">
                    <strong>Claim Status:</strong> {viewingEntry.claimStatus}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase">
                    Financial Overview
                  </h4>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-1 font-mono text-[11px] font-bold">
                    <p className="text-zinc-800 dark:text-zinc-200">
                      Claim Amount: ₹
                      {Number(viewingEntry.claimAmount).toFixed(2)}
                    </p>
                    <p className="text-emerald-500">
                      Approved: ₹
                      {viewingEntry.approvedAmount
                        ? Number(viewingEntry.approvedAmount).toFixed(2)
                        : "0.00"}
                    </p>
                    <p className="text-rose-500">
                      Patient Due: ₹
                      {viewingEntry.balanceToPatient
                        ? Number(viewingEntry.balanceToPatient).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {viewingEntry.remarks && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                  <h4 className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
                    Pre-Auth / Query Remarks
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
                  Close Dossier
                </Button>
                <Button
                  type="button"
                  onClick={() => handlePrintSlip(viewingEntry)}
                  className="h-9 px-4 text-xs bg-zinc-800 hover:bg-zinc-900 text-white font-semibold gap-1.5 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  <Printer className="w-4 h-4" /> Print Summary Slip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

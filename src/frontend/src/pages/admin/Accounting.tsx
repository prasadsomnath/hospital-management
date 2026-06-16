import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Calculator,
  Edit,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function parseUtc(dateStr: string | Date) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  let normalized = dateStr.replace(" ", "T");
  if (
    !normalized.endsWith("Z") &&
    !normalized.includes("+") &&
    !normalized.includes("-")
  ) {
    normalized = normalized + "Z";
  }
  return new Date(normalized);
}

function getLocalTimestamp(d?: string | Date) {
  const date = d ? parseUtc(d) : new Date();
  if (isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function Accounting() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expPage, setExpPage] = useState(0);
  const [expPageSize, setExpPageSize] = useState(10);
  const [recPage, setRecPage] = useState(0);
  const [recPageSize, setRecPageSize] = useState(10);
  const [receipts, setReceipts] = useState<any[]>([]);

  const [selectedExpenseSrl, setSelectedExpenseSrl] = useState<number | null>(
    null,
  );
  const [editingExpenseSrl, setEditingExpenseSrl] = useState<number | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Search parameters
  const [expenseSearch, setExpenseSearch] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");

  // Date filters
  const [expenseFromDate, setExpenseFromDate] = useState("");
  const [expenseToDate, setExpenseToDate] = useState("");
  const [receiptFromDate, setReceiptFromDate] = useState("");
  const [receiptToDate, setReceiptToDate] = useState("");

  // Form State
  const [entryDate, setEntryDate] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [auth, setAuth] = useState("Y");
  const [accountName, setAccountName] = useState("Stationery Supplies");
  const [accountGrp, setAccountGrp] = useState("Office");
  const [approvalDetail, setApprovalDetail] = useState("Admin");
  const [approvalDate, setApprovalDate] = useState("");
  const [billMemo, setBillMemo] = useState("");
  const [note, setNote] = useState("");

  // Item detail lines
  const [itemDescription, setItemDescription] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  const displayTotal =
    (Number.parseFloat(itemAmount) || 0) * (Number.parseInt(itemQty) || 1);

  // Fetch operator bills and expenses from live backend
  const fetchAccountingData = async () => {
    if (!user?.hospitalCode) return;
    try {
      // 1. Fetch live bills from reception-service
      const bills = await apiFetch<any[]>("/reception/bills", {
        headers: { "X-Hospital-Code": user.hospitalCode },
      });
      if (bills && Array.isArray(bills)) {
        const mappedReceipts = bills.map((b, idx) => ({
          srl: idx + 1,
          patNo: b.patientNo || "N/A",
          patientName: b.patientName || "Walk-in Patient",
          receiptDt:
            b.billDate ||
            (b.createdAt
              ? getLocalTimestamp(b.createdAt)
              : getLocalTimestamp()),
          billNo: b.billNumber || `INV-00${b.id}`,
          paid: String(b.paidAmount || b.netAmount || 0.0),
          pMode: b.billType || "Cash",
          user: "Receptionist",
        }));
        setReceipts(mappedReceipts);
      }

      // 2. Fetch live expenses from admin-service
      const expData = await apiFetch<any>("/admin/expenses", {
        headers: { "X-Hospital-Code": user.hospitalCode },
      });
      const expenseList = Array.isArray(expData)
        ? expData
        : expData?.content || [];
      const mappedExpenses = expenseList.map((e: any, idx: number) => ({
        srl: idx + 1,
        id: e.id,
        date: e.expenseDate,
        accountName: e.accountName,
        voucherNo: e.voucherNo,
        billMemo: e.billMemo,
        amount: String(e.amount || 0.0),
        itemGrp: e.itemGroup,
        approvedBy: e.approvedBy,
        approvedOn: e.approvedOn,
        paidTo: e.paidTo,
        user: e.userName,
        auth: e.authStatus,
      }));
      setExpenses(mappedExpenses);
    } catch (err) {
      console.warn(
        "Utilizing offline mock caches for Accounting ledgers:",
        err,
      );
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, [user?.hospitalCode]);

  const handleRefresh = async () => {
    await fetchAccountingData();
    toast.success("Accounting entries refreshed");
  };

  // Open Dialog for Adding
  function handleOpenAdd() {
    setEditingExpenseSrl(null);
    setEntryDate(getLocalTimestamp());
    setPaidTo("");
    setAuth("Y");
    setAccountName("Stationery Supplies");
    setAccountGrp("Office");
    setApprovalDetail("Admin");
    setApprovalDate(getLocalTimestamp());
    setBillMemo("");
    setNote("");
    setItemDescription("");
    setItemQty("");
    setItemAmount("");
    setExpenseOpen(true);
  }

  // Open Dialog for Editing
  function handleOpenEdit() {
    if (selectedExpenseSrl === null) {
      toast.warning(
        "Please select an expense record to edit first by clicking its row.",
      );
      return;
    }
    const item = expenses.find((e) => e.srl === selectedExpenseSrl);
    if (!item) return;

    setEditingExpenseSrl(selectedExpenseSrl);
    setEntryDate(getLocalTimestamp(item.date));
    setPaidTo(item.paidTo);
    setAuth(item.auth === "Yes" ? "Y" : "N");
    setAccountName(item.accountName);
    setAccountGrp(item.itemGrp);
    setApprovalDetail(item.approvedBy);
    setApprovalDate(getLocalTimestamp(item.approvedOn));
    setBillMemo(item.billMemo);
    setNote("");
    setItemDescription(item.accountName + " purchase");
    setItemQty("");
    setItemAmount(item.amount);
    setExpenseOpen(true);
  }

  // Handle Saving Expense
  async function handleSaveExpense() {
    if (!paidTo.trim()) {
      toast.error("Please specify who this was Paid To");
      return;
    }

    const finalAmt = displayTotal.toFixed(2);

    try {
      if (editingExpenseSrl !== null) {
        const currentItem = expenses.find((e) => e.srl === editingExpenseSrl);
        if (!currentItem) return;

        await apiFetch(`/admin/expenses/${currentItem.id}`, {
          method: "PUT",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Auth-User": user?.name || "Admin",
          },
          body: JSON.stringify({
            expenseDate: entryDate,
            accountName: accountName,
            billMemo: billMemo || "N/A",
            amount: Number.parseFloat(finalAmt),
            itemGroup: accountGrp,
            approvedBy: approvalDetail,
            approvedOn: approvalDate,
            paidTo: paidTo,
            userName: user?.name || "Admin",
            authStatus: auth === "Y" ? "Yes" : "No",
          }),
        });
        toast.success("Expense record updated successfully");
      } else {
        await apiFetch("/admin/expenses", {
          method: "POST",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
            "X-Auth-User": user?.name || "Admin",
          },
          body: JSON.stringify({
            expenseDate: entryDate,
            accountName: accountName,
            billMemo: billMemo || "N/A",
            amount: Number.parseFloat(finalAmt),
            itemGroup: accountGrp,
            approvedBy: approvalDetail,
            approvedOn: approvalDate,
            paidTo: paidTo,
            userName: user?.name || "Admin",
            authStatus: auth === "Y" ? "Yes" : "No",
          }),
        });
        toast.success("Expense record created successfully");
      }

      setExpenseOpen(false);
      setSelectedExpenseSrl(null);
      await fetchAccountingData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save expense record");
    }
  }

  // Delete selected item
  function handleDeleteExpense() {
    if (selectedExpenseSrl === null) {
      toast.warning("Please select an expense record to delete first.");
      return;
    }
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteExpense() {
    setDeleteConfirmOpen(false);
    if (selectedExpenseSrl === null) return;
    const currentItem = expenses.find((e) => e.srl === selectedExpenseSrl);
    if (!currentItem) return;

    try {
      await apiFetch(`/admin/expenses/${currentItem.id}`, {
        method: "DELETE",
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
          "X-Auth-User": user?.name || "Admin",
        },
      });
      setSelectedExpenseSrl(null);
      toast.success("Expense record deleted successfully");
      await fetchAccountingData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete expense record");
    }
  }

  // Live aggregates calculations for the Operator Summary
  const cashTotal = receipts
    .filter(
      (r) =>
        r.pMode.toUpperCase() === "CASH" || r.pMode.toUpperCase() === "OPD",
    )
    .reduce((sum, r) => sum + (Number.parseFloat(r.paid) || 0), 0);
  const digitalTotal = receipts
    .filter(
      (r) =>
        r.pMode.toUpperCase() === "PAYTM" ||
        r.pMode.toUpperCase() === "ONLINE" ||
        r.pMode.toUpperCase() === "IPD",
    )
    .reduce((sum, r) => sum + (Number.parseFloat(r.paid) || 0), 0);
  const aggregateTotal = receipts.reduce(
    (sum, r) => sum + (Number.parseFloat(r.paid) || 0),
    0,
  );

  // Filters with Search and datetime-local timestamp boundaries
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.paidTo.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.voucherNo.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.accountName.toLowerCase().includes(expenseSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (expenseFromDate) {
      if (new Date(e.date).getTime() < new Date(expenseFromDate).getTime()) {
        return false;
      }
    }
    if (expenseToDate) {
      if (new Date(e.date).getTime() > new Date(expenseToDate).getTime()) {
        return false;
      }
    }
    return true;
  });

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.billNo.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.patNo.toLowerCase().includes(receiptSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (receiptFromDate) {
      if (
        new Date(r.receiptDt).getTime() < new Date(receiptFromDate).getTime()
      ) {
        return false;
      }
    }
    if (receiptToDate) {
      if (new Date(r.receiptDt).getTime() > new Date(receiptToDate).getTime()) {
        return false;
      }
    }
    return true;
  });

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="accounting.page"
    >
      <div className="flex-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Accounting & Receipts
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Expenses & Operator Receipts (Screens 30, 31)
              </p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-xs px-3 py-1 font-semibold tracking-wider">
            Ledger Workspace
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-slate-100 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm h-10">
          <TabsTrigger
            value="expenses"
            className="rounded-md text-sm font-semibold transition-all text-slate-600 dark:text-slate-400 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:shadow-sm h-full"
          >
            <Wallet className="w-4 h-4 mr-2" /> Expenses
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="rounded-md text-sm font-semibold transition-all text-slate-600 dark:text-slate-400 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:shadow-sm h-full"
          >
            <Receipt className="w-4 h-4 mr-2" /> Operator Receipts
          </TabsTrigger>
        </TabsList>

        {/* SCREEN 30: ACCOUNT EXPENSES */}
        <TabsContent
          value="expenses"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold shadow-sm transition-colors"
                onClick={handleOpenAdd}
              >
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-foreground border-border hover:bg-muted"
                onClick={handleOpenEdit}
              >
                <Edit className="w-3.5 h-3.5 text-orange-400" /> Edit Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-destructive border-border hover:bg-destructive/10"
                onClick={handleDeleteExpense}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>

              {/* Search input in toolbar */}
              <div className="relative group w-60 ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="Find expenses..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3 text-xs gap-1.5"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync
              </Button>
            </div>
          </div>

          {/* Active Dialog for Adding/Editing Expenses */}
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogContent className="max-w-6xl w-[92vw] border border-slate-300 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 rounded-2xl animate-fade-in">
              <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 dark:text-orange-500 tracking-tight flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-orange-600" />
                  {editingExpenseSrl !== null
                    ? "Edit Expense Details"
                    : "Add Expense Entry"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 pt-6">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Entry Date
                  </Label>
                  <Input
                    type="datetime-local"
                    className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Voucher No.
                  </Label>
                  <Input
                    className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                    disabled
                    value={
                      editingExpenseSrl !== null
                        ? "V-" + (1001 + editingExpenseSrl)
                        : "Auto"
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Paid To
                  </Label>
                  <Input
                    className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Recipient / Store Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Auth.
                  </Label>
                  <Select value={auth} onValueChange={setAuth}>
                    <SelectTrigger className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Yes</SelectItem>
                      <SelectItem value="N">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    A/c Name
                  </Label>
                  <Select value={accountName} onValueChange={setAccountName}>
                    <SelectTrigger className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stationery Supplies">
                        Stationery Supplies
                      </SelectItem>
                      <SelectItem value="Medical Supplies">
                        Medical Consumables
                      </SelectItem>
                      <SelectItem value="Equipment Maintenance">
                        Equipment Maintenance
                      </SelectItem>
                      <SelectItem value="Utilities">
                        Utilities & Power
                      </SelectItem>
                      <SelectItem value="Staff Catering">
                        Staff Catering
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Account Grp
                  </Label>
                  <Input
                    className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                    disabled
                    value={accountGrp}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Approval Detail
                  </Label>
                  <Select
                    value={approvalDetail}
                    onValueChange={setApprovalDetail}
                  >
                    <SelectTrigger className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                      <SelectValue placeholder="Select Approver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin Controller</SelectItem>
                      <SelectItem value="Chief Doctor">
                        Chief Medical Officer
                      </SelectItem>
                      <SelectItem value="Director">
                        Managing Director
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Approval Dt.
                  </Label>
                  <Input
                    type="datetime-local"
                    className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Bill / Cash memo
                  </Label>
                  <Input
                    className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={billMemo}
                    onChange={(e) => setBillMemo(e.target.value)}
                    placeholder="Memo / Invoice No."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                    Note
                  </Label>
                  <Textarea
                    rows={2}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Additional context..."
                  />
                </div>
              </div>

              <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300">
                        Item Description
                      </th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-right w-32">
                        Qty
                      </th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-right w-44">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                    <tr>
                      <td className="p-3">
                        <Input
                          className="h-10 text-xs border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/20 text-slate-900 dark:text-slate-100"
                          placeholder="Item description"
                          value={itemDescription}
                          onChange={(e) => setItemDescription(e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          className="h-10 text-xs text-right border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/20 text-slate-900 dark:text-slate-100"
                          value={itemQty}
                          onChange={(e) => setItemQty(e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          className="h-10 text-xs text-right border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/20 text-slate-900 dark:text-slate-100"
                          value={itemAmount}
                          onChange={(e) => setItemAmount(e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 mt-6">
                <div className="flex items-center gap-2 font-bold">
                  <Calculator className="w-4 h-4 text-orange-500" />{" "}
                  <span className="text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
                    Total Amount:
                  </span>
                  <span className="text-orange-600 dark:text-orange-500 font-mono text-xl font-extrabold">
                    ₹{displayTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-10 px-5 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-lg"
                    onClick={() => setExpenseOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20 rounded-lg"
                    onClick={handleSaveExpense}
                  >
                    {editingExpenseSrl !== null
                      ? "Update Record"
                      : "Save Expense"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* TABLE DISPLAY */}
          <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm flex flex-col min-w-0">
            <div className="p-3 border-b border-border bg-muted/20 flex flex-wrap gap-4 items-end">
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  From Date/Time
                </Label>
                <DateTimePicker
                  type="datetime-local"
                  value={expenseFromDate}
                  onChange={setExpenseFromDate}
                  className="h-8 text-xs w-[180px]"
                />
              </div>
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  To Date/Time
                </Label>
                <DateTimePicker
                  type="datetime-local"
                  value={expenseToDate}
                  onChange={setExpenseToDate}
                  className="h-8 text-xs w-[180px]"
                />
              </div>
              <Button
                className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0 self-end"
                onClick={() => {
                  toast.success("Expense filters applied");
                }}
              >
                Apply
              </Button>
              {(expenseFromDate || expenseToDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground font-semibold"
                  onClick={() => {
                    setExpenseFromDate("");
                    setExpenseToDate("");
                  }}
                >
                  Clear
                </Button>
              )}
              <div className="space-y-1 min-w-[120px]">
                <Label className="text-xs">Approved by</Label>
                <Select defaultValue="ALL">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ALL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-4 text-xs gap-1.5"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                  <tr>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Srl
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Date
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Account Name
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Voucher No
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Bill / Cash Memo
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300 text-right">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Item Group
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Approved By
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Approved On
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Paid To
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      User Name
                    </th>
                    <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      Auth.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white dark:bg-transparent">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.slice(expPage * expPageSize, (expPage + 1) * expPageSize).map((row) => {
                      const isSelected = selectedExpenseSrl === row.srl;
                      return (
                        <tr
                          key={row.srl}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-orange-500/5 dark:bg-orange-500/10 hover:bg-orange-500/10 dark:hover:bg-orange-500/20"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedExpenseSrl(isSelected ? null : row.srl)
                          }
                        >
                          <td
                            className={`px-3 py-2.5 text-muted-foreground font-mono transition-all ${
                              isSelected
                                ? "border-l-4 border-orange-500 pl-2 font-bold text-orange-600"
                                : ""
                            }`}
                          >
                            {row.srl}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {row.date.replace("T", " ")}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            {row.accountName}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-orange-600 font-bold">
                            {row.voucherNo}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                            {row.billMemo}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            ₹{Number.parseFloat(row.amount).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                            {row.itemGrp}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                            {row.approvedBy}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {row.approvedOn.replace("T", " ")}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                            {row.paidTo}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {row.user}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 font-bold text-[10px]"
                            >
                              {row.auth}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={12}
                        className="text-center py-8 text-slate-400 dark:text-slate-500 font-medium"
                      >
                        No expense records matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-border mt-auto">
                <PaginationControl
                  currentPage={expPage}
                  totalPages={Math.ceil(filteredExpenses.length / expPageSize) || 1}
                  totalElements={filteredExpenses.length}
                  pageSize={expPageSize}
                  onPageChange={setExpPage}
                  onPageSizeChange={setExpPageSize}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SCREEN 31: OPERATOR RECEIPTS */}
        <TabsContent
          value="receipts"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col glass-elevated rounded-xl border border-border shadow-glass-sm min-h-0 overflow-hidden">
              <div className="p-3 border-b border-border bg-muted/20 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Search Bar */}
                  <div className="relative group w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      placeholder="Find active receipts..."
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                      className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                    />
                  </div>

                  {/* Date Filters with Timestamp Support */}
                  <div className="flex items-center gap-2 border-l border-border pl-3 ml-2">
                    <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                      From:
                    </span>
                    <DateTimePicker
                      type="datetime-local"
                      value={receiptFromDate}
                      onChange={setReceiptFromDate}
                      className="h-8 text-xs bg-background border-border rounded-md w-[180px]"
                    />
                    <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                      To:
                    </span>
                    <DateTimePicker
                      type="datetime-local"
                      value={receiptToDate}
                      onChange={setReceiptToDate}
                      className="h-8 text-xs bg-background border-border rounded-md w-[180px]"
                    />
                    <Button
                      className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0"
                      onClick={() => {
                        toast.success("Receipt filters applied");
                      }}
                    >
                      Apply
                    </Button>
                    {(receiptFromDate || receiptToDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold"
                        onClick={() => {
                          setReceiptFromDate("");
                          setReceiptToDate("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-4 text-xs gap-1.5"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync Receipts
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Srl
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Pat. No
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Patient Name
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Receipt Dt.
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Bill No.
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300 text-right">
                        Paid Amount
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Billing Type
                      </th>
                      <th className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                        Operator
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                    {filteredReceipts.length > 0 ? (
                      filteredReceipts.slice(recPage * recPageSize, (recPage + 1) * recPageSize).map((row) => (
                        <tr
                          key={row.srl}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">
                            {row.srl}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {row.patNo}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                            {row.patientName}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {row.receiptDt.replace("T", " ")}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-orange-600 font-bold">
                            {row.billNo}
                          </td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                            ₹{Number.parseFloat(row.paid).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50 font-bold text-[10px]"
                            >
                              {row.pMode}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-medium">
                            {row.user}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-8 text-slate-400 dark:text-slate-500 font-medium"
                        >
                          No operator receipts recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-border mt-auto">
                  <PaginationControl
                    currentPage={recPage}
                    totalPages={Math.ceil(filteredReceipts.length / recPageSize) || 1}
                    totalElements={filteredReceipts.length}
                    pageSize={recPageSize}
                    onPageChange={setRecPage}
                    onPageSizeChange={setRecPageSize}
                  />
                </div>
              </div>
            </div>

            {/* Summary Side Panel */}
            <div className="w-72 flex flex-col gap-3 flex-none">
              <div className="glass-elevated p-5 rounded-xl border border-border shadow-glass-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2 tracking-widest">
                  Operator Summary
                </h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">
                    OPD Cash Receipts
                  </span>
                  <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                    ₹{cashTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">
                    IPD / Digital Receipts
                  </span>
                  <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                    ₹{digitalTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold text-destructive">
                    Refunds & Returns
                  </span>
                  <span className="font-mono text-destructive font-black">
                    ₹0.00
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2 space-y-3">
                  <div className="flex justify-between items-center font-bold text-sm bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-400 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm">
                    <span className="uppercase text-[10px] tracking-wider font-black">
                      Net Cash Collected
                    </span>
                    <span className="font-mono font-black text-lg">
                      ₹{cashTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-sm bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                    <span className="uppercase text-[10px] tracking-wider font-black">
                      Total Ledger Balance
                    </span>
                    <span className="font-mono font-black text-lg">
                      ₹{aggregateTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Expense Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this expense record? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteExpense}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

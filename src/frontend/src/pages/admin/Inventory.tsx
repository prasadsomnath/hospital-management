import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpDown,
  Barcode,
  ChevronDown,
  Edit,
  FileSpreadsheet,
  History,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Users,
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

function formatToIst(dateStr: string) {
  if (!dateStr) return "N/A";
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      const parsedNormalized = parseUtc(dateStr);
      if (isNaN(parsedNormalized.getTime())) return dateStr;
      return (
        new Intl.DateTimeFormat("en-IN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }).format(parsedNormalized) + " (IST)"
      );
    }
    return (
      new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }).format(parsed) + " (IST)"
    );
  } catch (e) {
    return dateStr;
  }
}

function getExpiryDateForInput(expiryDt?: string) {
  if (!expiryDt || expiryDt === "N/A") return "";
  if (expiryDt.length === 7 && expiryDt.includes("-")) {
    return `${expiryDt}-01`;
  }
  return expiryDt;
}

export default function Inventory() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Dialog Control
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  // Active Datasets
  const [purchases, setPurchases] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // audit/movement logs

  // Sorting State
  const [purchaseSortField, setPurchaseSortField] = useState<string | null>(
    null,
  );
  const [purchaseSortOrder, setPurchaseSortOrder] = useState<"asc" | "desc">(
    "asc",
  );

  // Reorder / Low Stock Filter Alert Toggle
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Prescription Linkage States
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([]);
  const [selectedPrescriptionNo, setSelectedPrescriptionNo] = useState("");

  // Dynamic Registry Datasets for Stock Issue
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  // Selection states
  const [selectedPurchaseSrl, setSelectedPurchaseSrl] = useState<number | null>(
    null,
  );
  const [selectedIssueSrl, setSelectedIssueSrl] = useState<number | null>(null);
  const [deletePurchaseConfirmOpen, setDeletePurchaseConfirmOpen] =
    useState(false);
  const [deleteIssueConfirmOpen, setDeleteIssueConfirmOpen] = useState(false);

  // Search queries
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState("");

  // Date filters
  const [purchaseFromDate, setPurchaseFromDate] = useState("");
  const [purchaseToDate, setPurchaseToDate] = useState("");
  const [issueFromDate, setIssueFromDate] = useState("");
  const [issueToDate, setIssueToDate] = useState("");

  // Movement Log Tab States
  const [movementSearch, setMovementSearch] = useState("");
  const [movementFromDate, setMovementFromDate] = useState("");
  const [movementToDate, setMovementToDate] = useState("");
  const [movementPage, setMovementPage] = useState(0);
  const [movementPageSize, setMovementPageSize] = useState(10);

  // Supplier Management States
  const [suppliers, setSuppliers] = useState<any[]>(() => {
    const saved = localStorage.getItem("inventory_suppliers");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "sup1",
            name: "MedSupply Inc.",
            contact: "John Doe",
            phone: "9876543210",
            email: "john@medsupply.com",
            terms: "Net 30",
          },
          {
            id: "sup2",
            name: "Global Pharma",
            contact: "Alice Smith",
            phone: "9876543211",
            email: "alice@globalpharma.com",
            terms: "COD",
          },
        ];
  });
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(
    null,
  );
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supTerms, setSupTerms] = useState("Net 30");
  const [selectedSupplierName, setSelectedSupplierName] = useState<
    string | null
  >(null); // filter by supplier

  // Loading indicator
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [purchasePage, setPurchasePage] = useState(0);
  const [purchasePageSize, setPurchasePageSize] = useState(10);
  const [issuePage, setIssuePage] = useState(0);
  const [issuePageSize, setIssuePageSize] = useState(10);

  // Fetch live inventory medicines & transactions
  const fetchInventoryData = async () => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);
      // 1. Fetch live medicines from backend
      const medRes = await apiFetch<any>("/pharmacy/medicines", {
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
        },
      });
      const medData = medRes?.content || medRes || [];
      if (medData && Array.isArray(medData)) {
        const savedSuppliersMap = JSON.parse(
          localStorage.getItem("medicine_suppliers") || "{}",
        );
        const mappedPurchases = medData.map((item, index) => ({
          srl: index + 1,
          id: item.id,
          medicineCode: item.medicineCode,
          itemName: item.name,
          company: item.manufacturer || "N/A",
          supplier:
            savedSuppliersMap[item.medicineCode] ||
            item.supplier ||
            "MedSupply Inc.",
          invoiceNo: item.rackLocation || `INV-99${index}`,
          batchNo: item.batchNo || "N/A",
          expiryDt: item.expiryDate || "N/A",
          purchaseDt: item.createdAt
            ? getLocalTimestamp(item.createdAt)
            : getLocalTimestamp(),
          qty: String(item.stockQuantity || 0),
          purRate: String(item.unitPrice || 0.0),
          mrp: String(item.sellingPrice || 0.0),
          amt: String(
            ((item.stockQuantity || 0) * (item.unitPrice || 0.0)).toFixed(2),
          ),
          user: "Admin",
          barcode: item.barcode || "",
          minStockLevel:
            item.minStockLevel !== undefined ? item.minStockLevel : 10,
        }));
        setPurchases(mappedPurchases);
      }

      // 2. Fetch live transactions (STOCK_OUT / DISPENSED only for Issues)
      const txnRes = await apiFetch<any>("/pharmacy/transactions", {
        headers: {
          "X-Hospital-Code": user?.hospitalCode || "HSP001",
        },
      });
      const txnData = txnRes?.content || txnRes || [];
      if (txnData && Array.isArray(txnData)) {
        setTransactions(txnData); // Audit log tab
        const mappedIssues = txnData
          .filter(
            (t) =>
              t.transactionType === "STOCK_OUT" ||
              t.transactionType === "DISPENSED",
          )
          .map((item, index) => ({
            srl: index + 1,
            id: item.id,
            date: item.createdAt
              ? getLocalTimestamp(item.createdAt)
              : getLocalTimestamp(),
            patNo: item.referenceNo || "OPD-99",
            patientName: item.remarks || "Walk-in Patient",
            itemName: item.medicineName || "Medicine Item",
            issue: String(item.quantity || 0),
            issueRate: "3.00",
            amount: String((item.quantity || 0) * 3.0),
            retQty: "0",
            retAmt: "0.0",
            billNo: item.referenceNo || `INV-100${index}`,
          }));
        setIssues(mappedIssues);
      }
    } catch (err) {
      console.warn(
        "Utilizing offline high-fidelity mock data caches for pharmacy medicines:",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending prescriptions
  const fetchPendingPrescriptions = async () => {
    if (!user?.hospitalCode) return;
    try {
      const res = await apiFetch<any>("/pharmacy/prescriptions", {
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
        params: { status: "PENDING", page: 0, size: 1000 },
      });
      const list = res?.content || res || [];
      setPendingPrescriptions(list);
    } catch (e) {
      console.warn(
        "Failed to fetch pending prescriptions for selection linkage",
        e,
      );
    }
  };

  useEffect(() => {
    fetchInventoryData();
    fetchPendingPrescriptions();
  }, [user?.hospitalCode]);

  useEffect(() => {
    if (!user?.hospitalCode) return;

    // Load patients
    receptionApi
      .getPatients(user.hospitalCode)
      .then((list) => {
        if (Array.isArray(list)) setPatients(list);
      })
      .catch((err) =>
        console.warn("Failed to load patients for stock issue:", err),
      );

    // Load doctors
    apiFetch<any>("/admin/doctors", {
      headers: { "X-Hospital-Code": user.hospitalCode },
    })
      .then((res) => {
        const doctorsList = Array.isArray(res) ? res : res?.content || [];
        setDoctors(doctorsList);
      })
      .catch((err) =>
        console.warn("Failed to load doctors for stock issue:", err),
      );
  }, [user?.hospitalCode]);

  const handleRefresh = async () => {
    await fetchInventoryData();
    toast.success("Pharmacy inventory synced");
  };

  // ==========================================
  // FORM STATES: STOCK PURCHASE
  // ==========================================
  const [editingPurchaseSrl, setEditingPurchaseSrl] = useState<number | null>(
    null,
  );
  const [categories, setCategories] = useState<
    { code: string; name: string }[]
  >(() => {
    const saved = localStorage.getItem("inventory_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing categories from localStorage", e);
      }
    }
    return [
      { code: "MED", name: "Medicine" },
      { code: "SURG", name: "Surgical" },
    ];
  });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSaveCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return;
    }
    const code = trimmed.toUpperCase().replace(/\s+/g, "_");
    if (
      categories.some(
        (c) =>
          c.code === code || c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("Category already exists");
      return;
    }
    const newCats = [...categories, { code, name: trimmed }];
    setCategories(newCats);
    localStorage.setItem("inventory_categories", JSON.stringify(newCats));
    toast.success(`Category "${trimmed}" added successfully!`);
    setCategoryDialogOpen(false);
    setNewCategoryName("");
  };

  const [pCategory, setPCategory] = useState("MED");
  const [pItemName, setPItemName] = useState("");
  const [pCompany, setPCompany] = useState("");
  const [pSupplier, setPSupplier] = useState("");
  const [pInvoiceNo, setPInvoiceNo] = useState("");
  const [pInvoiceDt, setPInvoiceDt] = useState("");
  const [pPurchaseDt, setPPurchaseDt] = useState(getLocalTimestamp());
  const [pMfgDt, setPMfgDt] = useState("");
  const [pExpiryDt, setPExpiryDt] = useState("");
  const [pBatchNo, setPBatchNo] = useState("");
  const [pPurRate, setPPurRate] = useState("");
  const [pMrp, setPMrp] = useState("");
  const [pQty, setPQty] = useState("");
  const [pBarcode, setPBarcode] = useState("");
  const [pMinStockLevel, setPMinStockLevel] = useState("10"); // reorder level
  const [isScanningPurchase, setIsScanningPurchase] = useState(false);

  const resetPurchaseForm = () => {
    setEditingPurchaseSrl(null);
    setPCategory(categories[0]?.code || "MED");
    setPItemName("");
    setPCompany("");
    setPSupplier("");
    setPInvoiceNo("");
    setPInvoiceDt("");
    setPPurchaseDt(getLocalTimestamp());
    setPMfgDt("");
    setPExpiryDt("");
    setPBatchNo("");
    setPPurRate("");
    setPMrp("");
    setPQty("");
    setPBarcode("");
    setPMinStockLevel("10");
  };

  const handleBarcodeLookup = async (scannedBarcode: string) => {
    if (!scannedBarcode || scannedBarcode.length < 3) return;
    try {
      const res = await apiFetch<any>(
        `/pharmacy/medicines/barcode/${scannedBarcode}`,
        {
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
          },
        },
      );
      if (res) {
        setPItemName(res.name || "");
        setPCompany(res.manufacturer || "");
        setPCategory(res.category || "MED");
        setPPurRate(String(res.unitPrice || ""));
        setPMrp(String(res.sellingPrice || ""));
        setPMinStockLevel(String(res.minStockLevel || "10"));
        if (res.expiryDate) {
          setPExpiryDt(getExpiryDateForInput(res.expiryDate));
        }
        if (res.batchNo) {
          setPBatchNo(res.batchNo);
        }
        if (res.rackLocation) {
          setPInvoiceNo(res.rackLocation);
        }
        toast.success(`Barcode scanned! Loaded details for: ${res.name}`);
      }
    } catch (err) {
      console.log(
        "Barcode not found in catalog, allowing new entry registration.",
      );
    }
  };

  const handleOpenAddPurchase = () => {
    resetPurchaseForm();
    setPurchaseOpen(true);
  };

  const handleOpenEditPurchase = () => {
    if (selectedPurchaseSrl === null) {
      toast.warning(
        "Please select a purchase record to edit first by clicking its row.",
      );
      return;
    }
    const item = purchases.find((p) => p.srl === selectedPurchaseSrl);
    if (!item) return;

    setEditingPurchaseSrl(item.srl);
    setPItemName(item.itemName);
    setPCompany(item.company);
    setPSupplier(item.supplier);
    setPInvoiceNo(item.invoiceNo || "");
    setPPurchaseDt(item.purchaseDt);
    setPExpiryDt(getExpiryDateForInput(item.expiryDt));
    setPBatchNo(item.batchNo);
    setPPurRate(item.purRate);
    setPMrp(item.mrp);
    setPQty(item.qty);
    setPBarcode(item.barcode || "");
    setPMinStockLevel(String(item.minStockLevel || 10));

    setPurchaseOpen(true);
  };

  const handleDeletePurchase = () => {
    if (selectedPurchaseSrl === null) {
      toast.warning(
        "Please select a purchase record to delete first by clicking its row.",
      );
      return;
    }
    setDeletePurchaseConfirmOpen(true);
  };

  const confirmDeletePurchase = async () => {
    setDeletePurchaseConfirmOpen(false);
    if (selectedPurchaseSrl === null) return;
    const item = purchases.find((p) => p.srl === selectedPurchaseSrl);
    if (item && item.medicineCode) {
      try {
        try {
          await apiFetch(`/pharmacy/medicines/${item.medicineCode}`, {
            method: "DELETE",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "HSP001",
            },
          });
        } catch (apiErr) {
          console.warn("API Offline. Removing record locally.", apiErr);
        }
        setPurchases(purchases.filter((p) => p.srl !== selectedPurchaseSrl));
        setSelectedPurchaseSrl(null);
        toast.success("Purchase record removed successfully!");
        fetchInventoryData();
      } catch (err) {
        toast.error("Failed to delete medicine");
      }
    }
  };

  const handleSavePurchase = async () => {
    if (!pItemName || !pQty || !pPurRate) {
      toast.error("Please fill in the Item Name, Quantity, and Purchase Rate");
      return;
    }

    const calculatedAmt = (
      Number.parseFloat(pQty) * Number.parseFloat(pPurRate)
    ).toFixed(2);
    const code = "MED-" + Date.now().toString().slice(-6);

    const reqBody = {
      name: pItemName,
      category: pCategory,
      manufacturer: pCompany || "General Pharma",
      batchNo: pBatchNo || "B-NEW",
      expiryDate: pExpiryDt
        ? pExpiryDt.includes("-") && pExpiryDt.split("-").length === 2
          ? pExpiryDt + "-01"
          : pExpiryDt
        : new Date().toISOString().split("T")[0],
      stockQuantity: Number.parseInt(pQty) || 0,
      minStockLevel: Number.parseInt(pMinStockLevel) || 10,
      unitPrice: Number.parseFloat(pPurRate) || 0.0,
      sellingPrice: Number.parseFloat(pMrp) || Number.parseFloat(pPurRate),
      medicineCode: code,
      rackLocation: pInvoiceNo || "Rack-A",
      barcode: pBarcode || null,
    };

    try {
      if (editingPurchaseSrl !== null) {
        // Edit Mode
        const itemToUpdate = purchases.find(
          (p) => p.srl === editingPurchaseSrl,
        );
        if (itemToUpdate && itemToUpdate.medicineCode) {
          try {
            reqBody.medicineCode = itemToUpdate.medicineCode;
            await apiFetch(`/pharmacy/medicines/${itemToUpdate.medicineCode}`, {
              method: "PUT",
              headers: {
                "X-Hospital-Code": user?.hospitalCode || "HSP001",
              },
              body: JSON.stringify(reqBody),
            });
          } catch (apiErr) {
            console.warn("API Offline. Updating locally.", apiErr);
          }
          const savedSuppliersMap = JSON.parse(
            localStorage.getItem("medicine_suppliers") || "{}",
          );
          savedSuppliersMap[itemToUpdate.medicineCode] =
            pSupplier || "MedSupply Inc.";
          localStorage.setItem(
            "medicine_suppliers",
            JSON.stringify(savedSuppliersMap),
          );
        }
        setPurchases(
          purchases.map((p) =>
            p.srl === editingPurchaseSrl
              ? {
                  ...p,
                  itemName: pItemName,
                  company: pCompany || "General Pharma",
                  supplier: pSupplier || "MedSupply Inc.",
                  invoiceNo: pInvoiceNo,
                  batchNo: pBatchNo || "N/A",
                  expiryDt: pExpiryDt || "N/A",
                  purchaseDt: pPurchaseDt,
                  qty: pQty,
                  purRate: pPurRate,
                  mrp: pMrp || pPurRate,
                  amt: calculatedAmt,
                  barcode: pBarcode,
                  minStockLevel: Number.parseInt(pMinStockLevel) || 10,
                }
              : p,
          ),
        );
        toast.success("Purchase record updated successfully!");
      } else {
        // Create Mode
        try {
          await apiFetch("/pharmacy/medicines", {
            method: "POST",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "HSP001",
            },
            body: JSON.stringify(reqBody),
          });
        } catch (apiErr) {
          console.warn("API Offline. Appending locally.", apiErr);
        }

        const savedSuppliersMap = JSON.parse(
          localStorage.getItem("medicine_suppliers") || "{}",
        );
        savedSuppliersMap[code] = pSupplier || "MedSupply Inc.";
        localStorage.setItem(
          "medicine_suppliers",
          JSON.stringify(savedSuppliersMap),
        );

        const newSrl =
          purchases.length > 0
            ? Math.max(...purchases.map((p) => p.srl)) + 1
            : 1;
        const newPurchase = {
          srl: newSrl,
          id: newSrl,
          itemName: pItemName,
          company: pCompany || "General Pharma",
          supplier: pSupplier || "MedSupply Inc.",
          invoiceNo: pInvoiceNo,
          batchNo: pBatchNo || "N/A",
          expiryDt: pExpiryDt || "N/A",
          purchaseDt: pPurchaseDt,
          qty: pQty,
          purRate: pPurRate,
          mrp: pMrp || pPurRate,
          amt: calculatedAmt,
          user: user?.role === "admin" ? "Admin" : "Pharmacist",
          medicineCode: code,
          barcode: pBarcode,
          minStockLevel: Number.parseInt(pMinStockLevel) || 10,
        };
        setPurchases([...purchases, newPurchase]);
        toast.success("New stock purchase recorded!");
      }

      setPurchaseOpen(false);
      resetPurchaseForm();
      fetchInventoryData();
    } catch (err) {
      toast.error("Failed to commit purchase records");
    }
  };

  // ==========================================
  // FORM STATES: STOCK ISSUE
  // ==========================================
  const [editingIssueSrl, setEditingIssueSrl] = useState<number | null>(null);
  const [iDate, setIDate] = useState(getLocalTimestamp());
  const [iType, setIType] = useState("IPD");
  const [iPatNo, setIPatNo] = useState("");
  const [iPatientName, setIPatientName] = useState("");
  const [iRefDr, setIRefDr] = useState("");
  const [iItemName, setIItemName] = useState("");
  const [iQty, setIQty] = useState("");
  const [iRate, setIRate] = useState("");
  const [iBarcode, setIBarcode] = useState("");
  const [isScanningIssue, setIsScanningIssue] = useState(false);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  const resetIssueForm = () => {
    setEditingIssueSrl(null);
    setIDate(getLocalTimestamp());
    setIType("IPD");
    setIPatNo("");
    setIPatientName("");
    setIRefDr("");
    setIItemName("");
    setIQty("");
    setIRate("");
    setIBarcode("");
    setSelectedPrescriptionNo("");
    setShowItemSuggestions(false);
  };

  const handleIssueBarcodeLookup = async (scannedBarcode: string) => {
    if (!scannedBarcode || scannedBarcode.length < 3) return;
    try {
      const res = await apiFetch<any>(
        `/pharmacy/medicines/barcode/${scannedBarcode}`,
        {
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "HSP001",
          },
        },
      );
      if (res) {
        setIItemName(res.name || "");
        setIRate(String(res.sellingPrice || ""));
        toast.success(
          `Barcode scanned! Selected: ${res.name} (MRP: ₹${res.sellingPrice})`,
        );
      }
    } catch (err) {
      const localMatch = purchases.find((p) => p.barcode === scannedBarcode);
      if (localMatch) {
        setIItemName(localMatch.itemName);
        setIRate(localMatch.mrp);
        toast.success(
          `Barcode scanned! Selected local item: ${localMatch.itemName}`,
        );
      } else {
        console.log("Barcode not found in catalog.");
      }
    }
  };

  const handleOpenAddIssue = () => {
    resetIssueForm();
    setIssueOpen(true);
  };

  const handleOpenEditIssue = () => {
    if (selectedIssueSrl === null) {
      toast.warning(
        "Please select a stock issue record to edit first by clicking its row.",
      );
      return;
    }
    const item = issues.find((i) => i.srl === selectedIssueSrl);
    if (!item) return;

    setEditingIssueSrl(item.srl);
    setIDate(item.date);
    setIPatNo(item.patNo);
    setIPatientName(item.patientName);
    setIItemName(item.itemName);
    setIQty(item.issue);
    setIRate(item.issueRate);
    setSelectedPrescriptionNo(item.patNo.startsWith("RX") ? item.patNo : "");

    setIssueOpen(true);
  };

  const handleDeleteIssue = () => {
    if (selectedIssueSrl === null) {
      toast.warning(
        "Please select an issue record to delete first by clicking its row.",
      );
      return;
    }
    setDeleteIssueConfirmOpen(true);
  };

  const confirmDeleteIssue = () => {
    setDeleteIssueConfirmOpen(false);
    if (selectedIssueSrl === null) return;
    setIssues(issues.filter((i) => i.srl !== selectedIssueSrl));
    setSelectedIssueSrl(null);
    toast.success("Issue record removed successfully!");
  };

  const handleSaveIssue = async () => {
    if (!iPatientName || !iItemName || !iQty || !iRate) {
      toast.error(
        "Please fill in the Patient Name, Item Name, Quantity, and Issue Rate",
      );
      return;
    }

    const calculatedAmt = (
      Number.parseFloat(iQty) * Number.parseFloat(iRate)
    ).toFixed(2);

    try {
      if (editingIssueSrl !== null) {
        // Edit Mode
        setIssues(
          issues.map((i) =>
            i.srl === editingIssueSrl
              ? {
                  ...i,
                  date: iDate,
                  patNo: selectedPrescriptionNo || iPatNo || "N/A",
                  patientName: iPatientName,
                  itemName: iItemName,
                  issue: iQty,
                  issueRate: iRate,
                  amount: calculatedAmt,
                }
              : i,
          ),
        );
        toast.success("Stock issue updated successfully!");
      } else {
        // Create Mode
        const matchingMedicine = purchases.find(
          (p) => p.itemName.toLowerCase() === iItemName.toLowerCase(),
        );
        const medId = matchingMedicine ? matchingMedicine.id : 1;

        const reqBody = {
          medicineId: medId,
          transactionType: "STOCK_OUT",
          quantity: Number.parseInt(iQty) || 1,
          referenceNo: selectedPrescriptionNo || iPatNo || "OPD-99",
          remarks: `${iPatientName} - Issued via Pharmacist${selectedPrescriptionNo ? ` Linked to Prescription ${selectedPrescriptionNo}` : ""}`,
        };

        try {
          await apiFetch("/pharmacy/transactions", {
            method: "POST",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "HSP001",
              "X-Auth-User": user?.id || "Pharmacist",
            },
            body: JSON.stringify(reqBody),
          });
        } catch (apiErr) {
          console.warn("API Offline. Logging transaction locally.", apiErr);
        }

        // Trigger Dispense prescription patch if prescription linkage is set
        if (selectedPrescriptionNo) {
          try {
            await apiFetch(
              `/pharmacy/prescriptions/${selectedPrescriptionNo}/dispense`,
              {
                method: "PATCH",
                headers: {
                  "X-Hospital-Code": user?.hospitalCode || "HSP001",
                  "X-Auth-User": user?.name || user?.id || "Pharmacist",
                },
              },
            );
            toast.success(
              `Prescription ${selectedPrescriptionNo} marked as dispensed on server`,
            );
          } catch (rxErr) {
            console.warn("Prescription dispense update skipped/failed:", rxErr);
          }
        }

        const newSrl =
          issues.length > 0 ? Math.max(...issues.map((i) => i.srl)) + 1 : 1;
        const newIssue = {
          srl: newSrl,
          id: newSrl,
          date: iDate,
          patNo: selectedPrescriptionNo || iPatNo || "OPD-99",
          patientName: iPatientName,
          itemName: iItemName,
          issue: iQty,
          issueRate: iRate,
          amount: calculatedAmt,
          retQty: "0",
          retAmt: "0.0",
          billNo: `INV-${1000 + newSrl}`,
        };
        setIssues([...issues, newIssue]);
        toast.success("Stock issued to patient successfully!");
      }

      setIssueOpen(false);
      resetIssueForm();
      fetchInventoryData();
      fetchPendingPrescriptions();
    } catch (err) {
      toast.error("Failed to commit stock issue transaction");
    }
  };

  // Date Range Presets Helper
  const setPurchaseDatePreset = (preset: "today" | "week" | "month") => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      return `${y}-${m}-${day}`;
    };

    if (preset === "today") {
      setPurchaseFromDate(`${formatDate(now)}T00:00`);
      setPurchaseToDate(`${formatDate(now)}T23:59`);
      toast.success("Date filter set to Today");
    } else if (preset === "week") {
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setPurchaseFromDate(`${formatDate(monday)}T00:00`);
      setPurchaseToDate(`${formatDate(sunday)}T23:59`);
      toast.success("Date filter set to This Week");
    } else if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setPurchaseFromDate(`${formatDate(firstDay)}T00:00`);
      setPurchaseToDate(`${formatDate(lastDay)}T23:59`);
      toast.success("Date filter set to This Month");
    }
  };

  const handleSortPurchase = (field: string) => {
    if (purchaseSortField === field) {
      setPurchaseSortOrder(purchaseSortOrder === "asc" ? "desc" : "asc");
    } else {
      setPurchaseSortField(field);
      setPurchaseSortOrder("asc");
    }
  };

  const handleExportCSV = () => {
    if (filteredPurchases.length === 0) {
      toast.warning("No records to export.");
      return;
    }
    const headers = [
      "Srl",
      "Item Name",
      "Company",
      "Supplier",
      "Batch No",
      "Expiry Date",
      "Purchase Date",
      "Qty",
      "Purchase Rate",
      "MRP",
      "Amount",
      "User",
    ];
    const csvRows = [
      headers.join(","),
      ...filteredPurchases.map((row) =>
        [
          row.srl,
          row.itemName,
          row.company,
          row.supplier,
          row.batchNo,
          row.expiryDt,
          row.purchaseDt,
          row.qty,
          row.purRate,
          row.mrp,
          row.amt,
          row.user,
        ]
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Inventory_Stock_Purchase_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // Filter lists based on search parameters and datetime-local timestamp boundaries
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.itemName.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
      p.supplier.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
      p.batchNo.toLowerCase().includes(purchaseSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (purchaseFromDate) {
      if (
        new Date(p.purchaseDt).getTime() < new Date(purchaseFromDate).getTime()
      ) {
        return false;
      }
    }
    if (purchaseToDate) {
      if (
        new Date(p.purchaseDt).getTime() > new Date(purchaseToDate).getTime()
      ) {
        return false;
      }
    }
    if (showLowStockOnly) {
      if (Number(p.qty) > Number(p.minStockLevel || 10)) {
        return false;
      }
    }
    if (selectedSupplierName) {
      if (p.supplier !== selectedSupplierName) {
        return false;
      }
    }
    return true;
  });

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (!purchaseSortField) return 0;
    const valA = a[purchaseSortField];
    const valB = b[purchaseSortField];

    if (purchaseSortField === "qty") {
      return purchaseSortOrder === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }
    if (
      purchaseSortField === "expiryDt" ||
      purchaseSortField === "purchaseDt"
    ) {
      const dateA = valA === "N/A" ? new Date(0) : new Date(valA);
      const dateB = valB === "N/A" ? new Date(0) : new Date(valB);
      return purchaseSortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    if (strA < strB) return purchaseSortOrder === "asc" ? -1 : 1;
    if (strA > strB) return purchaseSortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredIssues = issues.filter((i) => {
    const matchesSearch =
      i.patientName.toLowerCase().includes(issueSearch.toLowerCase()) ||
      i.itemName.toLowerCase().includes(issueSearch.toLowerCase()) ||
      i.billNo.toLowerCase().includes(issueSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (issueFromDate) {
      if (new Date(i.date).getTime() < new Date(issueFromDate).getTime()) {
        return false;
      }
    }
    if (issueToDate) {
      if (new Date(i.date).getTime() > new Date(issueToDate).getTime()) {
        return false;
      }
    }
    return true;
  });

  // Filter transactions for movement log
  const filteredTransactions = transactions.filter((t) => {
    const medicineName = t.medicineName || t.medicine?.name || "";
    const matchesSearch =
      medicineName.toLowerCase().includes(movementSearch.toLowerCase()) ||
      t.transactionType.toLowerCase().includes(movementSearch.toLowerCase()) ||
      (t.referenceNo || "")
        .toLowerCase()
        .includes(movementSearch.toLowerCase()) ||
      (t.performedBy || "")
        .toLowerCase()
        .includes(movementSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (movementFromDate) {
      if (
        new Date(t.createdAt).getTime() < new Date(movementFromDate).getTime()
      ) {
        return false;
      }
    }
    if (movementToDate) {
      if (
        new Date(t.createdAt).getTime() > new Date(movementToDate).getTime()
      ) {
        return false;
      }
    }
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const setMovementDatePreset = (preset: "today" | "week" | "month") => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      return `${y}-${m}-${day}`;
    };

    if (preset === "today") {
      setMovementFromDate(`${formatDate(now)}T00:00`);
      setMovementToDate(`${formatDate(now)}T23:59`);
      toast.success("Date filter set to Today");
    } else if (preset === "week") {
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setMovementFromDate(`${formatDate(monday)}T00:00`);
      setMovementToDate(`${formatDate(sunday)}T23:59`);
      toast.success("Date filter set to This Week");
    } else if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setMovementFromDate(`${formatDate(firstDay)}T00:00`);
      setMovementToDate(`${formatDate(lastDay)}T23:59`);
      toast.success("Date filter set to This Month");
    }
  };

  // Calculations for Stock Summary Cards
  const totalItems = purchases.length;
  const totalStockValue = purchases.reduce(
    (acc, p) => acc + Number(p.qty || 0) * Number(p.purRate || 0),
    0,
  );
  const expiringIn30Days = purchases.filter((p) => {
    if (!p.expiryDt || p.expiryDt === "N/A") return false;
    try {
      const expiry = new Date(p.expiryDt);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } catch {
      return false;
    }
  }).length;
  const outOfStockCount = purchases.filter(
    (p) => Number(p.qty || 0) <= 0,
  ).length;
  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="inventory.page"
    >
      <div className="flex-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Inventory Management
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Comprehensive Stock Purchase, Issues, Audits, and Suppliers
              </p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-xs px-3 py-1 font-semibold tracking-wider">
            {user?.role === "admin"
              ? "Administrative Access"
              : "Pharmacist Terminal"}
          </Badge>
        </div>

        {/* Stock Summary Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Total Items
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {totalItems}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Unique catalog entries
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Total Stock Value
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                ₹
                {totalStockValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Based on purchase rate
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-lg">
              ₹
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Expiring in 30 Days
              </p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                {expiringIn30Days}
              </h3>
              <p className="text-[10px] text-amber-500/70 font-medium mt-1">
                Requires urgent review
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${expiringIn30Days > 0 ? "bg-amber-500/20 text-amber-600" : "bg-slate-100 text-slate-400"}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Out of Stock
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 mt-1">
                {outOfStockCount}
              </h3>
              <p className="text-[10px] text-rose-400 font-medium mt-1">
                Needs replenishment
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${outOfStockCount > 0 ? "bg-rose-500/20 text-rose-600" : "bg-slate-100 text-slate-400"}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="purchase" className="flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto w-full no-scrollbar pb-1">
          <TabsList className="flex w-max bg-slate-100 p-1 border border-slate-200 rounded-lg shadow-sm h-10 gap-1">
            <TabsTrigger
              value="purchase"
              className="rounded-md text-sm font-semibold transition-all text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm h-full px-4"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Stock Purchase
            </TabsTrigger>
            <TabsTrigger
              value="issue"
              className="rounded-md text-sm font-semibold transition-all text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm h-full px-4"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Stock Issue
            </TabsTrigger>
            <TabsTrigger
              value="movement"
              className="rounded-md text-sm font-semibold transition-all text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm h-full px-4"
            >
              <History className="w-4 h-4 mr-2" /> Movement Log
            </TabsTrigger>
            <TabsTrigger
              value="supplier"
              className="rounded-md text-sm font-semibold transition-all text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm h-full px-4"
            >
              <Users className="w-4 h-4 mr-2" /> Suppliers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="purchase"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold"
                onClick={handleOpenAddPurchase}
              >
                <Plus className="w-3.5 h-3.5" /> Add Purchase
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-50 gap-1.5 font-bold"
                onClick={() => setCategoryDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-foreground border-border hover:bg-muted"
                onClick={handleOpenEditPurchase}
              >
                <Edit className="w-3.5 h-3.5 text-orange-400" /> Edit Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-destructive border-border hover:bg-destructive/10"
                onClick={handleDeletePurchase}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
              </Button>

              {/* Reactive Search Bar */}
              <div className="relative group w-60 ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="Find by item, batch, or supplier..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                />
              </div>

              {/* Date range quick presets */}
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-sm transition-all"
                  onClick={() => setPurchaseDatePreset("today")}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-sm transition-all"
                  onClick={() => setPurchaseDatePreset("week")}
                >
                  This Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-sm transition-all"
                  onClick={() => setPurchaseDatePreset("month")}
                >
                  This Month
                </Button>
              </div>

              {/* Date Filters with Timestamp Support */}
              <div className="flex flex-wrap items-center gap-2 border-l-0 sm:border-l border-border pl-0 sm:pl-3 ml-0 sm:ml-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 min-w-[36px]">
                    From:
                  </span>
                  <DateTimePicker
                    type="datetime-local"
                    value={purchaseFromDate}
                    onChange={setPurchaseFromDate}
                    className="h-8 text-xs bg-background border-border rounded-md flex-1 sm:flex-initial w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 min-w-[36px]">
                    To:
                  </span>
                  <DateTimePicker
                    type="datetime-local"
                    value={purchaseToDate}
                    onChange={setPurchaseToDate}
                    className="h-8 text-xs bg-background border-border rounded-md flex-1 sm:flex-initial w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0 w-full sm:w-auto"
                    onClick={() => {
                      toast.success("Purchase filters applied");
                    }}
                  >
                    Apply
                  </Button>
                  {(purchaseFromDate || purchaseToDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold shrink-0"
                      onClick={() => {
                        setPurchaseFromDate("");
                        setPurchaseToDate("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Low Stock Alert Toggle Checkbox */}
              <label className="flex items-center gap-1.5 ml-3 border-l border-border pl-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500/20 w-3.5 h-3.5"
                />
                <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Low Stock
                </span>
              </label>

              {/* Supplier Filter Select Option */}
              <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-3">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  Supplier:
                </span>
                <select
                  value={selectedSupplierName || ""}
                  onChange={(e) =>
                    setSelectedSupplierName(e.target.value || null)
                  }
                  className="h-8 text-[11px] font-semibold bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Dialog for Stock Purchase (Add/Edit) */}
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogContent className="max-w-6xl w-[92vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-8 rounded-2xl animate-fade-in">
              <DialogHeader className="border-b border-slate-200 pb-4">
                <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                  {editingPurchaseSrl !== null
                    ? "Edit Stock Purchase Record"
                    : "Stock Purchase Entry"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 pt-6">
                {/* PREMIUM BARCODE SCANNER INTEGRATION ROW */}
                <div className="space-y-1.5 md:col-span-4 bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 flex flex-wrap gap-4 items-end justify-between">
                  <div className="flex-1 min-w-[280px] space-y-1.5">
                    <Label className="text-[13px] font-bold text-orange-700 tracking-wide flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-orange-500" /> Barcode
                      Scan / Lookup
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Scan or enter medicine barcode..."
                        value={pBarcode}
                        onChange={(e) => {
                          setPBarcode(e.target.value);
                          handleBarcodeLookup(e.target.value);
                        }}
                        className="h-11 text-sm bg-white border-orange-300 text-slate-900 font-mono pr-12 focus-visible:ring-2 focus-visible:ring-orange-500/30 placeholder:text-slate-400"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isScanningPurchase ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        ) : (
                          <Package className="w-4 h-4 text-orange-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4 text-xs font-bold border-orange-500/30 text-orange-700 hover:bg-orange-50 gap-1.5 transition-all shadow-sm shrink-0"
                    onClick={() => {
                      setIsScanningPurchase(true);
                      toast.info("Opening scanner simulator...");
                      setTimeout(() => {
                        const mockBarcode = "8901030701041";
                        setPBarcode(mockBarcode);
                        handleBarcodeLookup(mockBarcode);
                        setIsScanningPurchase(false);
                      }, 1200);
                    }}
                  >
                    <Barcode className="w-3.5 h-3.5 text-orange-500" />
                    Simulate Scanner 📷
                  </Button>
                </div>

                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Category
                  </Label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {categories.map((cat) => (
                      <option
                        key={cat.code}
                        value={cat.code}
                        className="bg-white"
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Item Name *
                  </Label>
                  <Input
                    placeholder="e.g. Paracetamol 500mg"
                    value={pItemName}
                    onChange={(e) => setPItemName(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Manufacturer Name
                  </Label>
                  <Input
                    placeholder="e.g. PharmaCorp"
                    value={pCompany}
                    onChange={(e) => setPCompany(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Supplier Name
                  </Label>
                  <select
                    value={pSupplier}
                    onChange={(e) => setPSupplier(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.name}>
                        {sup.name}
                      </option>
                    ))}
                    <option value="Custom Supplier">
                      Enter Custom Supplier...
                    </option>
                  </select>
                  {pSupplier === "Custom Supplier" ||
                  (pSupplier &&
                    !suppliers.some((s) => s.name === pSupplier)) ? (
                    <Input
                      placeholder="Type supplier name..."
                      value={pSupplier === "Custom Supplier" ? "" : pSupplier}
                      onChange={(e) => setPSupplier(e.target.value)}
                      className="h-10 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg mt-1.5 focus-visible:ring-2 focus-visible:ring-orange-500/20"
                    />
                  ) : null}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Invoice No. / Dt.
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Inv#"
                      value={pInvoiceNo}
                      onChange={(e) => setPInvoiceNo(e.target.value)}
                      className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg w-1/3 placeholder:text-slate-400"
                    />
                    <DateTimePicker
                      type="date"
                      value={pInvoiceDt}
                      onChange={setPInvoiceDt}
                      className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg flex-1 w-auto"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Purchase Dt.
                  </Label>
                  <DateTimePicker
                    type="datetime-local"
                    value={pPurchaseDt}
                    onChange={setPPurchaseDt}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg w-full"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    M.F.G. Dt.
                  </Label>
                  <DateTimePicker
                    type="date"
                    value={pMfgDt}
                    onChange={setPMfgDt}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg w-full"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Expiry Dt.
                  </Label>
                  <DateTimePicker
                    type="date"
                    value={pExpiryDt}
                    onChange={setPExpiryDt}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg w-full"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Batch No.
                  </Label>
                  <Input
                    placeholder="Batch Code"
                    value={pBatchNo}
                    onChange={(e) => setPBatchNo(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-mono font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Net Purchase Rate (₹) *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit cost"
                    value={pPurRate}
                    onChange={(e) => setPPurRate(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-mono font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Net MRP (₹)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Max retail price"
                    value={pMrp}
                    onChange={(e) => setPMrp(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-mono font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-orange-700 tracking-wide mb-1.5 block">
                    Purchase Qty *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Stock units"
                    value={pQty}
                    onChange={(e) => setPQty(e.target.value)}
                    className="h-11 text-sm font-bold font-mono bg-orange-50 border-orange-300 text-orange-700 rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-orange-500/40"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Reorder Level *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Min stock units"
                    value={pMinStockLevel}
                    onChange={(e) => setPMinStockLevel(e.target.value)}
                    className="h-11 text-sm font-bold font-mono bg-amber-50 border-amber-300 text-amber-800 rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-amber-800/40"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <Button
                  variant="outline"
                  className="h-11 px-6 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setPurchaseOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                  onClick={handleSavePurchase}
                >
                  {editingPurchaseSrl !== null
                    ? "Update Record"
                    : "Save Purchase"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* STOCK PURCHASE TABLE */}
          <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm min-h-0">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Srl</th>
                  <th className="px-3 py-2.5 font-semibold">Item Name</th>
                  <th className="px-3 py-2.5 font-semibold">Company</th>
                  <th className="px-3 py-2.5 font-semibold">Supplier Name</th>
                  <th className="px-3 py-2.5 font-semibold">Batch No</th>
                  <th
                    className="px-3 py-2.5 font-semibold cursor-pointer select-none hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortPurchase("expiryDt")}
                  >
                    <div className="flex items-center gap-1">
                      Expiry Dt.
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2.5 font-semibold cursor-pointer select-none hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortPurchase("purchaseDt")}
                  >
                    <div className="flex items-center gap-1">
                      Purchase Dt.
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2.5 font-semibold text-right cursor-pointer select-none hover:bg-muted/30 transition-colors"
                    onClick={() => handleSortPurchase("qty")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Qty
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Purchase Rate
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">MRP</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Amt</th>
                  <th className="px-3 py-2.5 font-semibold">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedPurchases.length > 0 ? (
                  sortedPurchases
                    .slice(
                      purchasePage * purchasePageSize,
                      (purchasePage + 1) * purchasePageSize,
                    )
                    .map((row) => {
                      const isSelected = selectedPurchaseSrl === row.srl;

                      // Compute highlight classes for expiry and low stock reorder management
                      let rowHighlightClass = "";
                      let warningBadge: React.ReactNode = null;
                      if (row.expiryDt && row.expiryDt !== "N/A") {
                        try {
                          const expiry = new Date(row.expiryDt);
                          const now = new Date();
                          const diffTime = expiry.getTime() - now.getTime();
                          const diffDays = Math.ceil(
                            diffTime / (1000 * 60 * 60 * 24),
                          );
                          if (diffDays < 0) {
                            rowHighlightClass =
                              "bg-rose-100/50 hover:bg-rose-200/50 border-l-4 border-rose-500";
                            warningBadge = (
                              <Badge className="bg-rose-600 text-white font-bold text-[9px] uppercase ml-2 px-1.5 py-0.5 rounded-sm shrink-0">
                                Expired
                              </Badge>
                            );
                          } else if (diffDays <= 30) {
                            rowHighlightClass =
                              "bg-amber-100/50 hover:bg-amber-200/50 border-l-4 border-amber-500";
                            warningBadge = (
                              <Badge className="bg-amber-500 text-white font-bold text-[9px] uppercase ml-2 px-1.5 py-0.5 rounded-sm shrink-0">
                                Expiring 30d
                              </Badge>
                            );
                          }
                        } catch (err) {
                          // Ignore parsing errs
                        }
                      }

                      // Low stock alert flag
                      if (
                        Number(row.qty || 0) <= Number(row.minStockLevel || 10)
                      ) {
                        if (!rowHighlightClass) {
                          rowHighlightClass =
                            "bg-orange-100/30 hover:bg-orange-200/30 border-l-4 border-orange-400";
                        }
                        warningBadge = (
                          <>
                            {warningBadge}
                            <Badge
                              className="bg-orange-500 text-white font-bold text-[9px] uppercase ml-2 px-1.5 py-0.5 rounded-sm shrink-0"
                              title={`Threshold: ${row.minStockLevel}`}
                            >
                              Low Stock
                            </Badge>
                          </>
                        );
                      }

                      return (
                        <tr
                          key={row.srl}
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${rowHighlightClass} ${
                            isSelected
                              ? "bg-orange-500/10 hover:bg-orange-500/15"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedPurchaseSrl(isSelected ? null : row.srl)
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
                          <td className="px-3 py-2.5 font-semibold text-foreground flex items-center gap-1.5">
                            {row.itemName}
                            {warningBadge}
                          </td>
                          <td className="px-3 py-2.5">{row.company}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {row.supplier}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            {row.batchNo}
                          </td>
                          <td className="px-3 py-2.5">{row.expiryDt}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {formatToIst(row.purchaseDt)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-foreground">
                            {row.qty}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            ₹{Number.parseFloat(row.purRate).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-emerald-600">
                            ₹{Number.parseFloat(row.mrp).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold font-mono">
                            ₹{Number.parseFloat(row.amt).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className={
                                row.user === "Admin"
                                  ? "border-orange-200 text-orange-700 bg-orange-50 font-bold"
                                  : "border-rose-200 text-rose-700 bg-rose-50 font-bold"
                              }
                            >
                              {row.user}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="text-center py-8 text-muted-foreground font-medium"
                    >
                      No matching purchase records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-border mt-auto">
            <PaginationControl
              currentPage={purchasePage}
              totalPages={Math.ceil(
                filteredPurchases.length / purchasePageSize,
              )}
              totalElements={filteredPurchases.length}
              pageSize={purchasePageSize}
              onPageChange={setPurchasePage}
              onPageSizeChange={setPurchasePageSize}
            />

            </div>

          </div>
        </TabsContent>

        {/* SCREEN 34: STOCK ISSUE TO PATIENT */}
        <TabsContent
          value="issue"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold"
                onClick={handleOpenAddIssue}
              >
                <Plus className="w-3.5 h-3.5" /> Add Issue
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-foreground border-border hover:bg-muted"
                onClick={handleOpenEditIssue}
              >
                <Edit className="w-3.5 h-3.5 text-orange-400" /> Edit Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-destructive border-border hover:bg-destructive/10"
                onClick={handleDeleteIssue}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>

              {/* Reactive Search Bar */}
              <div className="relative group w-60 ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="Find by patient, item, or bill no..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                />
              </div>

              {/* Date Filters with Timestamp Support */}
              <div className="flex flex-wrap items-center gap-2 border-l-0 sm:border-l border-border pl-0 sm:pl-3 ml-0 sm:ml-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 min-w-[36px]">
                    From:
                  </span>
                  <DateTimePicker
                    type="datetime-local"
                    value={issueFromDate}
                    onChange={setIssueFromDate}
                    className="h-8 text-xs bg-background border-border rounded-md flex-1 sm:flex-initial w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 min-w-[36px]">
                    To:
                  </span>
                  <DateTimePicker
                    type="datetime-local"
                    value={issueToDate}
                    onChange={setIssueToDate}
                    className="h-8 text-xs bg-background border-border rounded-md flex-1 sm:flex-initial w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0 w-full sm:w-auto"
                    onClick={() => {
                      toast.success("Issue filters applied");
                    }}
                  >
                    Apply
                  </Button>
                  {(issueFromDate || issueToDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold shrink-0"
                      onClick={() => {
                        setIssueFromDate("");
                        setIssueToDate("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Dialog for Stock Issue (Add/Edit) */}
          <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
            <DialogContent className="max-w-6xl w-[92vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-8 rounded-2xl animate-fade-in">
              <DialogHeader className="border-b border-slate-200 pb-4">
                <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
                  <ArrowRightLeft className="w-6 h-6 text-orange-600" />
                  {editingIssueSrl !== null
                    ? "Edit Stock Issue Form"
                    : "Stock Issue to Patient"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-5 pt-6">
                {/* PREMIUM BARCODE SCANNER INTEGRATION ROW */}
                <div className="space-y-1.5 md:col-span-4 bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 flex flex-wrap gap-4 items-end justify-between">
                  <div className="flex-1 min-w-[280px] space-y-1.5">
                    <Label className="text-[13px] font-bold text-orange-700 tracking-wide flex items-center gap-1.5">
                      <Barcode className="w-4 h-4 text-orange-500" /> Barcode
                      Scan / Lookup
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Scan or enter medicine barcode to select..."
                        value={iBarcode}
                        onChange={(e) => {
                          setIBarcode(e.target.value);
                          handleIssueBarcodeLookup(e.target.value);
                        }}
                        className="h-11 text-sm bg-white border-orange-300 text-slate-900 font-mono pr-12 focus-visible:ring-2 focus-visible:ring-orange-500/30 placeholder:text-slate-400"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isScanningIssue ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        ) : (
                          <Package className="w-4 h-4 text-orange-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-4 text-xs font-bold border-orange-500/30 text-orange-700 hover:bg-orange-50 gap-1.5 transition-all shadow-sm shrink-0"
                    onClick={() => {
                      setIsScanningIssue(true);
                      toast.info("Opening scanner simulator...");
                      setTimeout(() => {
                        const mockBarcode = "8901030701041";
                        setIBarcode(mockBarcode);
                        handleIssueBarcodeLookup(mockBarcode);
                        setIsScanningIssue(false);
                      }, 1200);
                    }}
                  >
                    <Barcode className="w-3.5 h-3.5 text-orange-500" />
                    Simulate Scanner 📷
                  </Button>
                </div>

                <div className="space-y-1.5 md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Link Patient Prescription (Optional)
                  </Label>
                  <select
                    value={selectedPrescriptionNo}
                    onChange={(e) => {
                      const rxNo = e.target.value;
                      setSelectedPrescriptionNo(rxNo);
                      if (rxNo) {
                        const rx = pendingPrescriptions.find(
                          (p) => p.prescriptionNo === rxNo,
                        );
                        if (rx) {
                          setIPatientName(rx.patientName || "");
                          setIPatNo(rx.patientNo || "");
                          if (rx.doctorName) {
                            setIRefDr(rx.doctorName);
                          }
                          if (
                            rx.prescriptionItems &&
                            rx.prescriptionItems.length > 0
                          ) {
                            const firstItem = rx.prescriptionItems[0];
                            setIItemName(firstItem.medicineName || "");
                            setIQty(String(firstItem.quantityPrescribed || ""));
                            const matchingMedicine = purchases.find(
                              (p) =>
                                p.itemName.toLowerCase() ===
                                firstItem.medicineName.toLowerCase(),
                            );
                            if (matchingMedicine) {
                              setIRate(
                                matchingMedicine.mrp ||
                                  matchingMedicine.purRate ||
                                  "0.00",
                              );
                              if (matchingMedicine.barcode) {
                                setIBarcode(matchingMedicine.barcode);
                              }
                            } else {
                              setIRate("3.00");
                            }
                          }
                          toast.success(
                            `Prescription ${rxNo} loaded! Form auto-filled.`,
                          );
                        }
                      } else {
                        resetIssueForm();
                      }
                    }}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">
                      -- Direct/Manual Issue (No Linkage) --
                    </option>
                    {pendingPrescriptions.map((rx) => (
                      <option key={rx.prescriptionNo} value={rx.prescriptionNo}>
                        {rx.prescriptionNo} - {rx.patientName} ({rx.patientNo})
                        | {rx.prescriptionDate}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Date
                  </Label>
                  <DateTimePicker
                    type="datetime-local"
                    value={iDate}
                    onChange={setIDate}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Issue Type
                  </Label>
                  <select
                    value={iType}
                    onChange={(e) => setIType(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="IPD" className="bg-white">
                      In-Patient
                    </option>
                    <option value="OPD" className="bg-white">
                      OPD Patient
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Patient Registry No.
                  </Label>
                  <Input
                    placeholder="e.g. IP129 or OPD-99"
                    value={iPatNo}
                    onChange={(e) => setIPatNo(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium font-mono focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Ref. Doctor
                  </Label>
                  <select
                    value={iRefDr}
                    onChange={(e) => setIRefDr(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="" className="bg-white">
                      Select Ref. Doctor
                    </option>
                    {doctors.map((doc: any) => {
                      const rawName =
                        doc.name ||
                        [doc.firstName, doc.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        doc.doctorCode;
                      const name = rawName.toLowerCase().startsWith("dr.")
                        ? rawName
                        : `Dr. ${rawName}`;
                      return (
                        <option
                          key={doc.id || doc.doctorCode}
                          value={name}
                          className="bg-white"
                        >
                          {name} (
                          {doc.specialization || doc.specialty || "General"})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2 relative">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Patient Name *
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Full name of patient"
                      value={iPatientName}
                      onChange={(e) => {
                        setIPatientName(e.target.value);
                        setShowPatientSuggestions(true);
                      }}
                      onFocus={() => setShowPatientSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowPatientSuggestions(false), 200)
                      }
                      className="h-11 pr-10 text-sm font-bold bg-white border-slate-300 text-slate-900 rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400 w-full"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      onClick={() =>
                        setShowPatientSuggestions(!showPatientSuggestions)
                      }
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showPatientSuggestions && (
                    <div className="absolute z-[100] w-full mt-1 bg-white rounded-lg border border-slate-300 shadow-xl max-h-56 overflow-y-auto">
                      {patients.filter((p) => {
                        if (!iPatientName.trim()) return true;
                        return (
                          p.name
                            ?.toLowerCase()
                            .includes(iPatientName.toLowerCase()) ||
                          p.patientNo
                            ?.toLowerCase()
                            .includes(iPatientName.toLowerCase()) ||
                          p.phone
                            ?.toLowerCase()
                            .includes(iPatientName.toLowerCase()) ||
                          p.mobile
                            ?.toLowerCase()
                            .includes(iPatientName.toLowerCase())
                        );
                      }).length > 0 ? (
                        patients
                          .filter((p) => {
                            if (!iPatientName.trim()) return true;
                            return (
                              p.name
                                ?.toLowerCase()
                                .includes(iPatientName.toLowerCase()) ||
                              p.patientNo
                                ?.toLowerCase()
                                .includes(iPatientName.toLowerCase()) ||
                              p.phone
                                ?.toLowerCase()
                                .includes(iPatientName.toLowerCase()) ||
                              p.mobile
                                ?.toLowerCase()
                                .includes(iPatientName.toLowerCase())
                            );
                          })
                          .map((p) => (
                            <button
                              key={p.patientNo}
                              type="button"
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex justify-between items-center gap-2 transition-colors border-b border-slate-100 last:border-b-0 text-xs text-slate-900 font-medium"
                              onClick={() => {
                                setIPatientName(p.name);
                                setIPatNo(p.patientNo);
                                setShowPatientSuggestions(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900">
                                  {p.name}
                                </span>
                                {(p.mobile || p.phone) && (
                                  <span className="text-[10px] text-slate-500">
                                    📞 {p.mobile || p.phone}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                                {p.patientNo}
                              </span>
                            </button>
                          ))
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-500 font-medium">
                          No matching patients found in this hospital
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Bill No.
                  </Label>
                  <Input
                    className="h-11 text-sm bg-slate-100 border-slate-300 text-slate-600 rounded-lg font-mono cursor-not-allowed"
                    disabled
                    value={
                      editingIssueSrl !== null
                        ? `INV-${1000 + editingIssueSrl}`
                        : "Auto-generated Invoice"
                    }
                  />
                </div>
              </div>

              {/* ITEM ENTRY MATRIX */}
              <div className="mt-6 border border-slate-300 rounded-xl bg-slate-50 overflow-visible">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-3 font-semibold text-slate-700">
                        Item Name *
                      </th>
                      <th className="p-3 text-right font-semibold text-slate-700">
                        Issue Qty *
                      </th>
                      <th className="p-3 text-right font-semibold text-slate-700">
                        Unit Rate (₹) *
                      </th>
                      <th className="p-3 text-right font-semibold text-slate-700 pr-6">
                        Total Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3">
                        <div className="relative">
                          <Input
                            placeholder="Item description (e.g. Paracetamol)"
                            value={iItemName}
                            onChange={(e) => {
                              setIItemName(e.target.value);
                              setShowItemSuggestions(true);
                            }}
                            onFocus={() => setShowItemSuggestions(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setShowItemSuggestions(false),
                                200,
                              )
                            }
                            className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400 w-full"
                          />
                          {showItemSuggestions && (
                            <div className="absolute z-[100] w-full mt-1 bg-white rounded-lg border border-slate-300 shadow-xl max-h-56 overflow-y-auto">
                              {purchases.filter((p) => {
                                if (!iItemName.trim()) return true;
                                return p.itemName
                                  ?.toLowerCase()
                                  .includes(iItemName.toLowerCase());
                              }).length > 0 ? (
                                purchases
                                  .filter((p) => {
                                    if (!iItemName.trim()) return true;
                                    return p.itemName
                                      ?.toLowerCase()
                                      .includes(iItemName.toLowerCase());
                                  })
                                  .map((p) => (
                                    <button
                                      key={p.srl}
                                      type="button"
                                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex justify-between items-center gap-2 transition-colors border-b border-slate-100 last:border-b-0 text-xs text-slate-900 font-medium"
                                      onClick={() => {
                                        setIItemName(p.itemName);
                                        setIRate(p.mrp || p.purRate || "0.0");
                                        if (p.barcode) {
                                          setIBarcode(p.barcode);
                                        }
                                        setShowItemSuggestions(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">
                                          {p.itemName}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                          Batch: {p.batchNo || "N/A"} | Stock:{" "}
                                          {p.qty || 0}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded font-bold">
                                        ₹{p.mrp || p.purRate}
                                      </span>
                                    </button>
                                  ))
                              ) : (
                                <div className="p-3 text-center text-xs text-slate-500 font-medium">
                                  No purchased medicines found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 w-1/5">
                        <Input
                          type="number"
                          value={iQty}
                          onChange={(e) => setIQty(e.target.value)}
                          className="h-11 text-sm text-right bg-white border-slate-300 text-slate-900 font-mono font-bold focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                        />
                      </td>
                      <td className="p-3 w-1/5">
                        <Input
                          type="number"
                          step="0.01"
                          value={iRate}
                          onChange={(e) => setIRate(e.target.value)}
                          className="h-11 text-sm text-right bg-white border-slate-300 text-slate-900 font-mono font-medium focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                        />
                      </td>
                      <td className="p-3 text-right font-black text-orange-600 font-mono pr-6 text-base">
                        ₹
                        {(
                          Number.parseFloat(iQty || "0") *
                          Number.parseFloat(iRate || "0")
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-300 mt-6">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                      Total Invoice
                    </span>
                    <span className="font-mono font-black text-orange-600 text-xl">
                      ₹
                      {(
                        Number.parseFloat(iQty || "0") *
                        Number.parseFloat(iRate || "0")
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-11 px-6 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => setIssueOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-11 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                    onClick={handleSaveIssue}
                  >
                    {editingIssueSrl !== null ? "Update Issue" : "Save Issue"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* STOCK ISSUE TABLE */}
          <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm min-h-0">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Srl</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Pat. No</th>
                  <th className="px-3 py-2.5 font-semibold">Patient Name</th>
                  <th className="px-3 py-2.5 font-semibold">Item Name</th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Issue Qty
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Issue Rate
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Ret. Qty
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Ret. Amt
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Bill No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIssues.length > 0 ? (
                  filteredIssues
                    .slice(
                      issuePage * issuePageSize,
                      (issuePage + 1) * issuePageSize,
                    )
                    .map((row) => {
                      const isSelected = selectedIssueSrl === row.srl;
                      return (
                        <tr
                          key={row.srl}
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-orange-500/5 hover:bg-orange-500/10"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedIssueSrl(isSelected ? null : row.srl)
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
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {formatToIst(row.date)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            {row.patNo}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-foreground">
                            {row.patientName}
                          </td>
                          <td className="px-3 py-2.5">{row.itemName}</td>
                          <td className="px-3 py-2.5 text-right font-bold">
                            {row.issue}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            ₹{Number.parseFloat(row.issueRate).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-orange-600">
                            ₹{Number.parseFloat(row.amount).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-destructive font-mono">
                            {row.retQty}
                          </td>
                          <td className="px-3 py-2.5 text-right text-destructive font-mono">
                            ₹{Number.parseFloat(row.retAmt).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground font-semibold">
                            {row.billNo}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-8 text-muted-foreground font-medium"
                    >
                      No matching stock issue records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-border mt-auto">
            <PaginationControl
              currentPage={issuePage}
              totalPages={Math.ceil(filteredIssues.length / issuePageSize)}
              totalElements={filteredIssues.length}
              pageSize={issuePageSize}
              onPageChange={setIssuePage}
              onPageSizeChange={setIssuePageSize}
            />

            </div>

          </div>
        </TabsContent>

        {/* SCREEN 35: AUDIT / MOVEMENT LOG */}
        <TabsContent
          value="movement"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative group w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="Search by item, type, ref, user..."
                  value={movementSearch}
                  onChange={(e) => setMovementSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                />
              </div>

              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-sm transition-all"
                  onClick={() => setMovementDatePreset("today")}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-sm transition-all"
                  onClick={() => setMovementDatePreset("week")}
                >
                  This Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-sm transition-all"
                  onClick={() => setMovementDatePreset("month")}
                >
                  This Month
                </Button>
              </div>

              {/* Date Filters with Timestamp Support */}
              <div className="flex flex-wrap items-center gap-2 border-l-0 sm:border-l border-border pl-0 sm:pl-3 ml-0 sm:ml-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 min-w-[36px]">
                    From:
                  </span>
                  <DateTimePicker
                    type="datetime-local"
                    value={movementFromDate}
                    onChange={setMovementFromDate}
                    className="h-8 text-xs bg-background border-border rounded-md flex-1 sm:flex-initial w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 min-w-[36px]">
                    To:
                  </span>
                  <DateTimePicker
                    type="datetime-local"
                    value={movementToDate}
                    onChange={setMovementToDate}
                    className="h-8 text-xs bg-background border-border rounded-md flex-1 sm:flex-initial w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0 w-full sm:w-auto"
                    onClick={() => {
                      toast.success("Movement log filters applied");
                    }}
                  >
                    Apply
                  </Button>
                  {(movementFromDate || movementToDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold shrink-0"
                      onClick={() => {
                        setMovementFromDate("");
                        setMovementToDate("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm min-h-0">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Srl</th>
                  <th className="px-3 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-3 py-2.5 font-semibold">Item Name</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Qty</th>
                  <th className="px-3 py-2.5 font-semibold">Ref No</th>
                  <th className="px-3 py-2.5 font-semibold">Remarks</th>
                  <th className="px-3 py-2.5 font-semibold">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedTransactions.length > 0 ? (
                  sortedTransactions
                    .slice(
                      movementPage * movementPageSize,
                      (movementPage + 1) * movementPageSize,
                    )
                    .map((row, index) => {
                      const medicineName =
                        row.medicineName ||
                        row.medicine?.name ||
                        "Medicine Item";

                      let typeColor =
                        "border-slate-200 text-slate-700 bg-slate-50";
                      if (row.transactionType === "STOCK_IN") {
                        typeColor =
                          "border-emerald-200 text-emerald-700 bg-emerald-50 font-bold";
                      } else if (row.transactionType === "STOCK_OUT") {
                        typeColor =
                          "border-red-200 text-red-700 bg-red-50 font-bold";
                      } else if (row.transactionType === "DISPENSED") {
                        typeColor =
                          "border-amber-200 text-amber-700 bg-amber-50 font-bold";
                      }

                      return (
                        <tr key={row.id || index} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">
                            {index + 1 + movementPage * movementPageSize}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {formatToIst(row.createdAt)}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-foreground">
                            {medicineName}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className={typeColor}>
                              {row.transactionType}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold font-mono">
                            {row.quantity}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            {row.referenceNo || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-medium">
                            {row.remarks || "—"}
                          </td>
                          <td className="px-3 py-2.5 font-semibold">
                            {row.performedBy}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground font-medium"
                    >
                      No stock movement logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-border bg-white mt-2 rounded-xl shadow-sm">
            <PaginationControl
              currentPage={movementPage}
              totalPages={Math.ceil(
                sortedTransactions.length / movementPageSize,
              )}
              totalElements={sortedTransactions.length}
              pageSize={movementPageSize}
              onPageChange={setMovementPage}
              onPageSizeChange={setMovementPageSize}
            />
          </div>
        </TabsContent>

        {/* SCREEN 36: SUPPLIER MANAGEMENT */}
        <TabsContent
          value="supplier"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col min-h-0 bg-white border border-border rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                  Registered Suppliers
                </h3>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold"
                  onClick={() => {
                    setEditingSupplierId(null);
                    setSupName("");
                    setSupContact("");
                    setSupPhone("");
                    setSupEmail("");
                    setSupTerms("Net 30");
                    setSupplierDialogOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Supplier
                </Button>
              </div>

              <div className="flex-1 overflow-auto border border-slate-100 rounded-lg min-h-0">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Supplier Name</th>
                      <th className="px-3 py-2 font-semibold">Contact</th>
                      <th className="px-3 py-2 font-semibold">Phone</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Terms</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((sup) => {
                      const isSelected = selectedSupplierName === sup.name;
                      return (
                        <tr
                          key={sup.id}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? "bg-orange-500/5 hover:bg-orange-500/10 font-medium" : ""}`}
                          onClick={() =>
                            setSelectedSupplierName(
                              isSelected ? null : sup.name,
                            )
                          }
                        >
                          <td className="px-3 py-2.5 font-semibold text-slate-800">
                            {sup.name}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {sup.contact}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-500">
                            {sup.phone}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {sup.email}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className="border-blue-100 text-blue-700 bg-blue-50 font-medium"
                            >
                              {sup.terms}
                            </Badge>
                          </td>
                          <td
                            className="px-3 py-2.5 text-right flex justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-orange-500 hover:bg-orange-50"
                              onClick={() => {
                                setEditingSupplierId(sup.id);
                                setSupName(sup.name);
                                setSupContact(sup.contact);
                                setSupPhone(sup.phone);
                                setSupEmail(sup.email);
                                setSupTerms(sup.terms);
                                setSupplierDialogOpen(true);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete supplier "${sup.name}"?`,
                                  )
                                ) {
                                  const updated = suppliers.filter(
                                    (s) => s.id !== sup.id,
                                  );
                                  setSuppliers(updated);
                                  localStorage.setItem(
                                    "inventory_suppliers",
                                    JSON.stringify(updated),
                                  );
                                  if (selectedSupplierName === sup.name)
                                    setSelectedSupplierName(null);
                                  toast.success(
                                    "Supplier deleted successfully",
                                  );
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col min-h-0 bg-white border border-border rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide mb-4">
                Supplier Purchase History
              </h3>

              {selectedSupplierName ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="mb-3 p-3 bg-orange-500/5 rounded-lg border border-orange-500/10">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                      Supplier Selected
                    </span>
                    <h4 className="font-bold text-base text-slate-800 mt-0.5">
                      {selectedSupplierName}
                    </h4>
                  </div>

                  <div className="flex-1 overflow-auto divide-y divide-slate-100 min-h-0">
                    {purchases.filter(
                      (p) => p.supplier === selectedSupplierName,
                    ).length > 0 ? (
                      purchases
                        .filter((p) => p.supplier === selectedSupplierName)
                        .map((item) => (
                          <div
                            key={item.srl}
                            className="py-2.5 first:pt-0 last:pb-0"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-slate-800 text-xs">
                                {item.itemName}
                              </span>
                              <span className="font-mono text-xs text-orange-600 font-bold">
                                ₹{Number(item.amt).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-medium">
                              <span>
                                Batch: {item.batchNo} | Qty: {item.qty}
                              </span>
                              <span>
                                {formatToIst(item.purchaseDt).split(" ")[0]}
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                        No purchase invoices recorded for this supplier.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg p-6 text-center">
                  <Users className="w-8 h-8 text-slate-300 mb-2" />
                  Select a supplier from the list to view their transaction
                  history.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD CATEGORY DIALOG */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-6 rounded-2xl animate-fade-in">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              Add Inventory Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                Category Name *
              </Label>
              <Input
                placeholder="e.g. Disinfectants, Dental, etc."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-5">
            <Button
              variant="outline"
              className="h-10 px-4 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold"
              onClick={() => {
                setCategoryDialogOpen(false);
                setNewCategoryName("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md text-xs"
              onClick={handleSaveCategory}
            >
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD/EDIT SUPPLIER DIALOG */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-6 rounded-2xl animate-fade-in">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              {editingSupplierId
                ? "Edit Supplier Info"
                : "Add Supplier Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Supplier Name *
              </Label>
              <Input
                placeholder="e.g. MedSupply Distributors"
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                className="h-10 text-sm bg-white text-slate-900 border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Contact Person
              </Label>
              <Input
                placeholder="e.g. John Doe"
                value={supContact}
                onChange={(e) => setSupContact(e.target.value)}
                className="h-10 text-sm bg-white text-slate-900 border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Phone
                </Label>
                <Input
                  placeholder="Phone number"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="h-10 text-sm bg-white text-slate-900 border-slate-300 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Payment Terms
                </Label>
                <select
                  value={supTerms}
                  onChange={(e) => setSupTerms(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs shadow-sm transition-colors text-slate-900 font-medium focus:outline-none"
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Immediate">Immediate / Advance</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="supplier@example.com"
                value={supEmail}
                onChange={(e) => setSupEmail(e.target.value)}
                className="h-10 text-sm bg-white text-slate-900 border-slate-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-5">
            <Button
              variant="outline"
              className="h-10 px-4 rounded-lg text-slate-600 border-slate-300 text-xs font-semibold"
              onClick={() => {
                setSupplierDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md text-xs"
              onClick={() => {
                const trimmedName = supName.trim();
                if (!trimmedName) {
                  toast.error("Supplier name is required");
                  return;
                }
                let updated;
                if (editingSupplierId) {
                  // Edit
                  updated = suppliers.map((s) =>
                    s.id === editingSupplierId
                      ? {
                          ...s,
                          name: trimmedName,
                          contact: supContact,
                          phone: supPhone,
                          email: supEmail,
                          terms: supTerms,
                        }
                      : s,
                  );
                  toast.success("Supplier info updated");
                } else {
                  // Add
                  const newSup = {
                    id: "sup-" + Date.now(),
                    name: trimmedName,
                    contact: supContact,
                    phone: supPhone,
                    email: supEmail,
                    terms: supTerms,
                  };
                  updated = [...suppliers, newSup];
                  toast.success("New supplier registered");
                }
                setSuppliers(updated);
                localStorage.setItem(
                  "inventory_suppliers",
                  JSON.stringify(updated),
                );
                setSupplierDialogOpen(false);
              }}
            >
              Save Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletePurchaseConfirmOpen}
        onOpenChange={setDeletePurchaseConfirmOpen}
      >
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Purchase Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this purchase record? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePurchaseConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeletePurchase}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteIssueConfirmOpen}
        onOpenChange={setDeleteIssueConfirmOpen}
      >
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Stock Issue Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this stock issue record? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteIssueConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteIssue}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

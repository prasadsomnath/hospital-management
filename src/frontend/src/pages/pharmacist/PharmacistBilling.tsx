import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PaginationControl } from "@/components/ui/pagination-control";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Info,
  Loader2,
  Lock,
  Percent,
  Phone,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Trash,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface MedicineBillItemRequest {
  medicineId?: number;
  medicineCode?: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
}

interface MedicineBillItemResponse {
  id: number;
  medicineId?: number;
  medicineCode?: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface MedicineBillResponse {
  id: number;
  billNo: string;
  patientName: string;
  patientPhone: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: "DRAFT" | "PAID" | "CANCELLED";
  notes?: string;
  hospitalCode: string;
  items: MedicineBillItemResponse[];
  createdAt: string;
  updatedAt: string;
}

interface Medicine {
  id: number;
  medicineCode: string;
  name: string;
  sellingPrice: number;
  unitPrice: number;
  stockQuantity: number;
  category?: string;
}

export default function PharmacistBilling() {
  const { user } = useAuthStore();
  const hospitalCode = user?.hospitalCode || "HSP001";

  // Data State
  const [bills, setBills] = useState<MedicineBillResponse[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showPatientSugg, setShowPatientSugg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PAID">(
    "ALL",
  );

  // Pagination State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal / Sidebar state
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [viewingBill, setViewingBill] = useState<MedicineBillResponse | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Bill Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [billItems, setBillItems] = useState<MedicineBillItemRequest[]>([
    { medicineName: "", quantity: 1, unitPrice: 0 },
  ]);
  const [discountVal, setDiscountVal] = useState<number | string>("");
  const [taxPercent, setTaxPercent] = useState<number | string>(5); // default 5%
  const [notes, setNotes] = useState("");

  // Payment States
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "METHOD" | "CASH" | "UPI" | "CARD" | "PROCESSING" | "SUCCESS"
  >("METHOD");
  const [chosenMethod, setChosenMethod] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [payingDraftBill, setPayingDraftBill] =
    useState<MedicineBillResponse | null>(null);

  // Linked prescription (when coming from Prescriptions page via Process button)
  const [linkedPrescriptionNo, setLinkedPrescriptionNo] = useState<
    string | null
  >(null);

  // Get payment mode from sessionStorage or bill notes
  const getPaymentMode = (bill: MedicineBillResponse) => {
    try {
      const storedModes = sessionStorage.getItem("pharmacy_paid_draft_modes");
      if (storedModes) {
        const modes = JSON.parse(storedModes);
        if (modes[bill.billNo]) {
          return modes[bill.billNo];
        }
      }
    } catch (e) {
      console.error("Error reading payment modes from session storage", e);
    }

    if (bill.notes) {
      const match = bill.notes.match(/Paid via (CASH|UPI|CARD)/i);
      if (match) {
        return match[1].toUpperCase();
      }
    }

    return bill.status === "PAID" ? "CASH" : null;
  };

  // Load Bills and Medicines
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Load Bills
      const billRes = await apiFetch<any>("/pharmacy/bills", {
        headers: { "X-Hospital-Code": hospitalCode },
        params: { page: 0, size: 1000 },
      });
      const billList = billRes?.content || billRes || [];
      setBills(billList);

      // Load Medicines (limit to 1000 to cover inventory)
      const medRes = await apiFetch<any>("/pharmacy/medicines", {
        headers: { "X-Hospital-Code": hospitalCode },
        params: { page: 0, size: 1000 },
      });
      const medList = medRes?.content || medRes || [];
      setMedicines(medList);

      // Load Patients (limit to 1000 to search/auto-fill by phone)
      try {
        const patRes = await apiFetch<any>("/reception/patients", {
          headers: { "X-Hospital-Code": hospitalCode },
          params: { page: 0, size: 1000 },
        });
        const patList = patRes?.content || patRes || [];
        setPatients(patList);
      } catch (patErr) {
        console.warn("Failed to load patients for phone lookup:", patErr);
      }
    } catch (err: any) {
      console.error("Failed to load billing data", err);
      toast.error(err.message || "Failed to load billing data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load hospital details
  useEffect(() => {
    const fetchHospitalDetails = async () => {
      try {
        const info = await apiFetch<any>(
          `/super-admin/hospitals/code/${hospitalCode}`,
        );
        if (info) setHospitalInfo(info);
      } catch (err) {
        console.warn("Could not retrieve hospital details:", err);
      }
    };
    if (hospitalCode) {
      fetchHospitalDetails();
    }
    loadData();

    // Pick up pending prescription from Prescriptions page (via sessionStorage)
    try {
      const raw = sessionStorage.getItem("pharmacist_pending_rx");
      if (raw) {
        sessionStorage.removeItem("pharmacist_pending_rx");
        const rx = JSON.parse(raw);
        // Pre-fill patient name
        setPatientName(rx.patientName || "");
        // Pre-fill notes with prescription reference
        setNotes(`Dispensed from Prescription: ${rx.prescriptionNo}`);
        // Track the linked prescription number for dispense call later
        setLinkedPrescriptionNo(rx.prescriptionNo);
        // Pre-fill medicine items — prices will auto-populate after medicines load
        if (rx.prescriptionItems && rx.prescriptionItems.length > 0) {
          setBillItems(
            rx.prescriptionItems.map((item: any) => ({
              medicineName: item.medicineName || "",
              quantity: item.quantityPrescribed || 1,
              unitPrice: 0, // will be updated once medicines catalog loads
            })),
          );
        }
        // Auto-open the new bill drawer
        setIsNewBillOpen(true);
        toast.info(
          `Prescription ${rx.prescriptionNo} loaded — review items and complete billing`,
        );
      }
    } catch (e) {
      console.warn(
        "Failed to read pending prescription from sessionStorage",
        e,
      );
    }
  }, [hospitalCode]);

  // After medicines are loaded, backfill unit prices for prescription-linked items
  useEffect(() => {
    if (linkedPrescriptionNo && medicines.length > 0) {
      setBillItems((prev) =>
        prev.map((item) => {
          if (item.unitPrice === 0 && item.medicineName) {
            const med = medicines.find(
              (m) => m.name.toLowerCase() === item.medicineName.toLowerCase(),
            );
            if (med) {
              return {
                ...item,
                medicineId: med.id,
                medicineCode: med.medicineCode,
                unitPrice: med.sellingPrice || med.unitPrice || 0,
              };
            }
          }
          return item;
        }),
      );
    }
  }, [medicines, linkedPrescriptionNo]);

  // Filter patients for suggestions
  const patientSuggestions = useMemo(() => {
    if (!patientName.trim()) return [];
    const q = patientName.toLowerCase();
    return patients.filter((p) => {
      const pName = (
        p.name || `${p.firstName} ${p.lastName || ""}`
      ).toLowerCase();
      const pPhone = (p.phone || p.alternativeNum || "").toLowerCase();
      return pName.includes(q) || pPhone.includes(q);
    });
  }, [patients, patientName]);

  // Calculations for New Bill
  const newBillSubtotal = useMemo(() => {
    return billItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );
  }, [billItems]);

  const newBillDiscount = useMemo(() => {
    return Number(discountVal) || 0;
  }, [discountVal]);

  const newBillTaxable = useMemo(() => {
    const taxable = newBillSubtotal - newBillDiscount;
    return taxable < 0 ? 0 : taxable;
  }, [newBillSubtotal, newBillDiscount]);

  const newBillTaxAmount = useMemo(() => {
    const pct = Number(taxPercent) || 0;
    return Number.parseFloat((newBillTaxable * (pct / 100)).toFixed(2));
  }, [newBillTaxable, taxPercent]);

  const newBillTotal = useMemo(() => {
    return Number.parseFloat((newBillTaxable + newBillTaxAmount).toFixed(2));
  }, [newBillTaxable, newBillTaxAmount]);

  const displayPayableTotal = useMemo(() => {
    return payingDraftBill ? payingDraftBill.totalAmount : newBillTotal;
  }, [payingDraftBill, newBillTotal]);

  // Stats Card Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    let revToday = 0;
    let billsToday = 0;
    let unpaidCount = 0;
    let unpaidAmount = 0;
    let discToday = 0;

    bills.forEach((bill) => {
      const billDate = bill.createdAt ? bill.createdAt.split("T")[0] : "";
      const isToday = billDate === todayStr;

      if (isToday) {
        billsToday++;
        discToday += bill.discount || 0;
        if (bill.status === "PAID") {
          revToday += bill.totalAmount || 0;
        }
      }

      if (bill.status === "DRAFT") {
        unpaidCount++;
        unpaidAmount += bill.totalAmount || 0;
      }
    });

    return {
      revenueToday: revToday,
      billsToday,
      outstandingCount: unpaidCount,
      outstandingAmount: unpaidAmount,
      discountsToday: discToday,
    };
  }, [bills]);

  // Filtering Logic
  const filteredBills = useMemo(() => {
    return bills
      .filter((bill) => {
        // Search
        const searchMatch =
          !search.trim() ||
          bill.billNo.toLowerCase().includes(search.toLowerCase()) ||
          bill.patientName.toLowerCase().includes(search.toLowerCase()) ||
          (bill.patientPhone && bill.patientPhone.includes(search));

        // Date Range
        const billDateStr = bill.createdAt ? bill.createdAt.split("T")[0] : "";
        const fromMatch = !fromDate || billDateStr >= fromDate;
        const toMatch = !toDate || billDateStr <= toDate;

        // Status
        const statusMatch =
          statusFilter === "ALL" || bill.status === statusFilter;

        return searchMatch && fromMatch && toMatch && statusMatch;
      })
      .sort((a, b) => b.id - a.id);
  }, [bills, search, fromDate, toDate, statusFilter]);

  const paginatedBills = useMemo(() => {
    const start = page * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, page, pageSize]);

  // Add Item line to New Bill Form
  const addBillItemLine = () => {
    setBillItems([
      ...billItems,
      { medicineName: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  // Remove Item line
  const removeBillItemLine = (index: number) => {
    if (billItems.length === 1) {
      toast.warning("A bill must contain at least one item");
      return;
    }
    setBillItems(billItems.filter((_, idx) => idx !== index));
  };

  // Update Item line
  const updateBillItemLine = (
    index: number,
    field: keyof MedicineBillItemRequest,
    value: any,
  ) => {
    const updated = [...billItems];

    if (field === "medicineName") {
      // Find matching medicine code/price
      const med = medicines.find((m) => m.name === value);
      if (med) {
        updated[index] = {
          ...updated[index],
          medicineName: med.name,
          medicineId: med.id,
          medicineCode: med.medicineCode,
          unitPrice: med.sellingPrice || med.unitPrice || 0,
        };
      } else {
        updated[index] = {
          ...updated[index],
          medicineName: value,
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setBillItems(updated);
  };

  // Trigger Payment modal before Dispensing
  const handlePayDispenseClick = () => {
    if (!patientName.trim()) {
      toast.error("Patient Name is required");
      return;
    }

    // Validate items
    const validItems = billItems.filter(
      (item) => item.medicineName.trim() !== "",
    );
    if (validItems.length === 0) {
      toast.error("Add at least one valid medicine item");
      return;
    }

    if (
      validItems.some(
        (item) => !item.unitPrice || item.unitPrice < 0 || item.quantity <= 0,
      )
    ) {
      toast.error("Each item must have a valid quantity and unit price");
      return;
    }

    setIsPaymentOpen(true);
    setPaymentStep("METHOD");
  };

  const completePayDispense = async (method: string) => {
    setChosenMethod(method);
    setPaymentStep("PROCESSING");

    // Simulate payment processing for 1.5 seconds
    setTimeout(async () => {
      try {
        if (payingDraftBill) {
          // If paying an existing draft bill
          await apiFetch<MedicineBillResponse>(
            `/pharmacy/bills/${payingDraftBill.billNo}/status`,
            {
              method: "PATCH",
              headers: {
                "X-Hospital-Code": hospitalCode,
                "X-Auth-User": user?.name || "Pharmacist",
              },
              params: { status: "PAID" },
            },
          );

          // Store in sessionStorage under "pharmacy_paid_draft_modes"
          try {
            const storedModes =
              sessionStorage.getItem("pharmacy_paid_draft_modes") || "{}";
            const modes = JSON.parse(storedModes);
            modes[payingDraftBill.billNo] = method;
            sessionStorage.setItem(
              "pharmacy_paid_draft_modes",
              JSON.stringify(modes),
            );
          } catch (e) {
            console.error("Failed to write to sessionStorage", e);
          }

          setTransactionId(
            "TXN-" + Math.floor(10000000 + Math.random() * 90000000),
          );
          setPaymentStep("SUCCESS");
          toast.success(
            `Bill ${payingDraftBill.billNo} marked as PAID via ${method}. Stock updated.`,
          );

          // Reload Data
          loadData(true);
        } else {
          // Creating a new bill
          const validItems = billItems.filter(
            (item) => item.medicineName.trim() !== "",
          );
          const payload = {
            patientName,
            patientPhone,
            notes: notes
              ? `${notes} (Paid via ${method})`
              : `Paid via ${method}`,
            status: "PAID" as const,
            discount: newBillDiscount,
            tax: Number(taxPercent) || 0,
            items: validItems,
          };

          const res = await apiFetch<MedicineBillResponse>("/pharmacy/bills", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Hospital-Code": hospitalCode,
            },
            body: JSON.stringify(payload),
          });

          // If this billing originated from a prescription, mark it as DISPENSED
          if (linkedPrescriptionNo) {
            try {
              await apiFetch(
                `/pharmacy/prescriptions/${linkedPrescriptionNo}/dispense`,
                {
                  method: "PATCH",
                  headers: {
                    "X-Hospital-Code": hospitalCode,
                    "X-Auth-User": user?.name || user?.id || "Pharmacist",
                  },
                },
              );
              toast.success(
                `Prescription ${linkedPrescriptionNo} marked as Dispensed.`,
              );
            } catch (dispenseErr: any) {
              console.warn("Dispense API call failed:", dispenseErr);
              toast.warning(
                `Bill created but could not auto-mark prescription as dispensed.`,
              );
            }
            setLinkedPrescriptionNo(null);
          }

          setTransactionId(
            "TXN-" + Math.floor(10000000 + Math.random() * 90000000),
          );
          setPaymentStep("SUCCESS");
          toast.success(
            `Bill ${res.billNo} generated and paid via ${method}. Stock updated.`,
          );

          // Reload Data
          loadData(true);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to process payment");
        setPaymentStep("METHOD");
      }
    }, 1500);
  };

  // Handle Save Bill (Draft or Paid)
  const handleSaveBill = async (status: "DRAFT" | "PAID") => {
    if (!patientName.trim()) {
      toast.error("Patient Name is required");
      return;
    }

    // Validate items
    const validItems = billItems.filter(
      (item) => item.medicineName.trim() !== "",
    );
    if (validItems.length === 0) {
      toast.error("Add at least one valid medicine item");
      return;
    }

    if (
      validItems.some(
        (item) => !item.unitPrice || item.unitPrice < 0 || item.quantity <= 0,
      )
    ) {
      toast.error("Each item must have a valid quantity and unit price");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientName,
        patientPhone,
        notes,
        status,
        discount: newBillDiscount,
        tax: Number(taxPercent) || 0,
        items: validItems,
      };

      const res = await apiFetch<MedicineBillResponse>("/pharmacy/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hospital-Code": hospitalCode,
        },
        body: JSON.stringify(payload),
      });

      toast.success(
        status === "PAID"
          ? `Bill ${res.billNo} generated and paid. Stock quantities deducted.`
          : `Bill ${res.billNo} saved as draft.`,
      );

      // Close Drawer
      setIsNewBillOpen(false);

      // Reset Form State
      setPatientName("");
      setPatientPhone("");
      setNotes("");
      setDiscountVal("");
      setTaxPercent(5);
      setBillItems([{ medicineName: "", quantity: 1, unitPrice: 0 }]);

      // Reload Data
      loadData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to save medicine bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open payment selector dialog for draft bill
  const handlePayDraftClick = (bill: MedicineBillResponse) => {
    setPayingDraftBill(bill);
    setIsPaymentOpen(true);
    setPaymentStep("METHOD");
  };

  // Printable receipt layout
  const handlePrintReceipt = (bill: MedicineBillResponse) => {
    let fallbackHospitalName = "Apollo Hospital Bangalore";
    if (hospitalCode.toLowerCase() === "hsp002")
      fallbackHospitalName = "Skyllx Hospital";
    else if (hospitalCode.toLowerCase().includes("mar"))
      fallbackHospitalName = "Margadarsi Hospital";

    const hName =
      hospitalInfo?.hospitalName || hospitalInfo?.name || fallbackHospitalName;
    const hPhone = hospitalInfo?.phone || "+91 9292929292";
    const hEmail =
      hospitalInfo?.email || `support@${hospitalCode.toLowerCase()}.com`;
    const hAddress =
      hospitalInfo?.address || "123 Healthcare Ave, Medical District";

    const html = `
      <html>
      <head>
        <title>Pharmacy Medicine Bill - ${bill.billNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            font-size: 13px; 
            line-height: 1.5;
            padding: 32px; 
            color: #1f2937; 
            background: #fff;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .hospital-info h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            color: #e11d48;
            letter-spacing: -0.5px;
          }
          .hospital-info p {
            margin: 3px 0 0;
            color: #4b5563;
            font-size: 11px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.3px;
          }
          .invoice-title .status {
            display: inline-block;
            margin-top: 6px;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .status.paid { background: #d1fae5; color: #065f46; }
          .status.draft { background: #fef3c7; color: #92400e; }
          .status.cancelled { background: #fee2e2; color: #991b1b; }
          
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
            background: #f9fafb;
            border: 1px solid #f3f4f6;
            border-radius: 12px;
            padding: 16px;
          }
          .meta-block h4 {
            margin: 0 0 6px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
          }
          .meta-block p {
            margin: 0;
            font-size: 13px;
            color: #1f2937;
          }
          .meta-block .value {
            font-weight: 600;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 12px; 
          }
          th { 
            background: #f3f4f6; 
            color: #374151;
            padding: 10px 14px; 
            text-align: left; 
            font-size: 11px; 
            font-weight: 600;
            text-transform: uppercase; 
            letter-spacing: 0.5px;
          }
          td { 
            padding: 12px 14px; 
            border-bottom: 1px solid #f3f4f6; 
            color: #4b5563;
          }
          .right { text-align: right; }
          .font-mono { font-family: monospace; }
          
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
          }
          .summary-table {
            width: 300px;
          }
          .summary-table td {
            padding: 6px 10px;
            border: none;
          }
          .summary-table tr.total-row td {
            border-top: 2px solid #f3f4f6;
            padding-top: 10px;
            font-weight: 700;
            color: #111827;
            font-size: 15px;
          }
          
          .footer {
            margin-top: 60px;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
          }
          @media print { 
            body { padding: 0; } 
            .meta-grid { background: #fff !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-info">
            <h1>${hName}</h1>
            <p>Hospital Code: <b>${hospitalCode}</b> &nbsp;|&nbsp; Tel: ${hPhone}</p>
            <p>Email: ${hEmail} &nbsp;|&nbsp; Address: ${hAddress}</p>
          </div>
          <div class="invoice-title">
            <h2>MEDICINE INVOICE</h2>
            <span class="status ${bill.status.toLowerCase()}">${bill.status}</span>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-block">
            <h4>Patient Information</h4>
            <p>Full Name: <span class="value">${bill.patientName}</span></p>
            <p>Contact Phone: <span class="value">${bill.patientPhone || "—"}</span></p>
          </div>
          <div class="meta-block" style="text-align: right;">
            <h4>Billing Information</h4>
            <p>Invoice No: <span class="value font-mono">${bill.billNo}</span></p>
            <p>Billing Date: <span class="value">${new Date(
              bill.createdAt,
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span></p>
            ${
              bill.status === "PAID" && getPaymentMode(bill)
                ? `
              <p>Payment Mode: <span class="value">${getPaymentMode(bill) === "UPI" ? "QR CODE" : getPaymentMode(bill)}</span></p>
            `
                : ""
            }
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Medicine Name</th>
              <th class="right" style="width: 100px;">Price (₹)</th>
              <th class="right" style="width: 80px;">Qty</th>
              <th class="right" style="width: 120px;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items
              .map(
                (it, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: 500; color: #111827;">${it.medicineName}</td>
                <td class="right font-mono">₹${it.unitPrice.toLocaleString()}</td>
                <td class="right font-mono">${it.quantity}</td>
                <td class="right font-mono" style="font-weight: 600; color: #111827;">₹${it.lineTotal.toLocaleString()}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary-section">
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="right font-mono">₹${bill.subtotal.toLocaleString()}</td>
            </tr>
            ${
              bill.discount > 0
                ? `
              <tr style="color: #e11d48;">
                <td>Discount Given:</td>
                <td class="right font-mono">-₹${bill.discount.toLocaleString()}</td>
              </tr>
            `
                : ""
            }
            ${
              bill.tax > 0
                ? `
              <tr>
                <td>Tax Added:</td>
                <td class="right font-mono">₹${bill.tax.toLocaleString()}</td>
              </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td>Grand Total:</td>
              <td class="right font-mono">₹${bill.totalAmount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        ${
          bill.notes
            ? `
          <div style="margin-top: 24px; padding: 12px; border: 1px dashed #e5e7eb; border-radius: 8px;">
            <h4 style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: #6b7280;">Notes</h4>
            <p style="margin: 0; color: #4b5563;">${bill.notes}</p>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Thank you for choosing ${hName}. Wishing you a speedy recovery!</p>
          <p style="margin-top: 4px; font-size: 10px;">This is a computer-generated invoice receipt and does not require a physical signature.</p>
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups to print receipt");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto"
      data-ocid="pharmacist.billing.page"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500/85 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground font-display flex items-center gap-2 tracking-tight">
              Medicine Billing Module
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Create customer pharmacy bills, track transactions, and manage
              sales.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewBillOpen(true)}
          className="h-10 px-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Medicine Bill
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales Revenue */}
        <div className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 shadow-glass-sm">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Revenue Today
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              ₹{stats.revenueToday.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Bills today count */}
        <div className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 shadow-glass-sm">
          <div className="p-3 bg-rose-500/10 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Bills Today
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {stats.billsToday}
            </h2>
          </div>
        </div>

        {/* Outstanding DRAFT bills */}
        <div className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 shadow-glass-sm">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Outstanding Bills
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {stats.outstandingCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (₹{stats.outstandingAmount.toLocaleString()})
              </span>
            </h2>
          </div>
        </div>

        {/* Discounts given */}
        <div className="glass-elevated p-5 rounded-2xl border border-border/80 flex items-center gap-4 shadow-glass-sm">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Percent className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Discounts Given (Today)
            </p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              ₹{stats.discountsToday.toLocaleString()}
            </h2>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-elevated p-4 rounded-2xl border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Bill No, Patient Name..."
              className="pl-9 h-10 w-full rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <DateTimePicker
              type="date"
              value={fromDate}
              onChange={(val) => {
                setFromDate(val);
                setPage(0);
              }}
              placeholder="From Date"
              className="h-10 text-xs w-[145px] rounded-xl border border-border bg-card/50"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <DateTimePicker
              type="date"
              value={toDate}
              onChange={(val) => {
                setToDate(val);
                setPage(0);
              }}
              placeholder="To Date"
              className="h-10 text-xs w-[145px] rounded-xl border border-border bg-card/50"
            />
          </div>
        </div>

        {/* Status filters */}
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-inner gap-1">
          {(["ALL", "DRAFT", "PAID"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              {tab === "ALL"
                ? "All Bills"
                : tab === "DRAFT"
                  ? "Drafts"
                  : "Paid"}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Data Table */}
      <div className="glass-elevated rounded-2xl border border-border/80 overflow-hidden shadow-glass-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border/80">
              <tr>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Bill No
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Patient Info
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">
                  Items
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Subtotal
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Discount
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Total
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">
                  Status
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">
                  Mode
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      Fetching medicine bills...
                    </p>
                  </td>
                </tr>
              ) : paginatedBills.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <Receipt className="w-8 h-8 text-muted-foreground/45 mx-auto mb-2" />
                    No medicine bills matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((bill) => (
                  <tr
                    key={bill.billNo}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-bold font-mono text-slate-800 dark:text-slate-100">
                      {bill.billNo}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {bill.patientName}
                      </div>
                      {bill.patientPhone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground/70" />{" "}
                          {bill.patientPhone}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(bill.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-center font-semibold font-mono text-slate-700 dark:text-slate-300">
                      {bill.items?.length || 0}
                    </td>
                    <td className="p-4 text-right font-semibold font-mono text-slate-600 dark:text-slate-400">
                      ₹{bill.subtotal.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-semibold font-mono text-rose-500 dark:text-rose-400">
                      {bill.discount > 0
                        ? `-₹${bill.discount.toLocaleString()}`
                        : "₹0"}
                    </td>
                    <td className="p-4 text-right font-black font-mono text-slate-800 dark:text-slate-100">
                      ₹{bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                          bill.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/35"
                            : bill.status === "DRAFT"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/35 animate-pulse"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/35"
                        }`}
                      >
                        {bill.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      {getPaymentMode(bill) ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                            getPaymentMode(bill) === "CASH"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/35"
                              : getPaymentMode(bill) === "UPI"
                                ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/35"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/35"
                          }`}
                        >
                          {getPaymentMode(bill) === "UPI"
                            ? "QR CODE"
                            : getPaymentMode(bill)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[10px] font-medium">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {bill.status === "DRAFT" && (
                          <Button
                            size="sm"
                            disabled={actionLoading === bill.billNo}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 px-2.5 font-bold rounded-lg shadow-sm flex items-center gap-1"
                            onClick={() => handlePayDraftClick(bill)}
                          >
                            {actionLoading === bill.billNo ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Pay
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => setViewingBill(bill)}
                          title="View Receipt Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => handlePrintReceipt(bill)}
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        <PaginationControl
          currentPage={page}
          totalPages={Math.ceil(filteredBills.length / pageSize)}
          totalElements={filteredBills.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="px-4 border-t border-border/60 bg-card/20 py-2.5"
        />
      </div>

      {/* slide-over panel for New Medicine Bill */}
      {isNewBillOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          data-ocid="pharmacist.new-bill-drawer"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsNewBillOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-card border-l border-border shadow-2xl flex flex-col h-full transform transition-all duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-foreground font-display">
                    New Medicine Invoice
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsNewBillOpen(false);
                    setLinkedPrescriptionNo(null);
                  }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Linked Prescription Banner */}
                {linkedPrescriptionNo && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
                    <span className="text-lg">📋</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">
                        Prescription Linked:{" "}
                        <span className="font-mono">
                          {linkedPrescriptionNo}
                        </span>
                      </p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Prescription will be marked Dispensed automatically on
                        successful payment
                      </p>
                    </div>
                  </div>
                )}
                {/* Patient Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Patient Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="Search by name or phone..."
                          className="pl-9 h-10 w-full rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                          value={patientName}
                          onChange={(e) => {
                            setPatientName(e.target.value);
                            setShowPatientSugg(true);
                          }}
                          onFocus={() => setShowPatientSugg(true)}
                          onBlur={() => {
                            setTimeout(() => setShowPatientSugg(false), 200);
                          }}
                          autoComplete="off"
                        />
                        {showPatientSugg && patientSuggestions.length > 0 && (
                          <div className="absolute z-[100] left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg divide-y divide-border/30">
                            {patientSuggestions.map((p) => {
                              const fullName =
                                p.name ||
                                `${p.firstName} ${p.lastName || ""}`.trim();
                              const phoneNum =
                                p.phone || p.alternativeNum || "";
                              const itemKey = p.patientNo || p.id || fullName;
                              return (
                                <button
                                  key={itemKey}
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex flex-col gap-0.5 bg-popover"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setPatientName(fullName);
                                    setPatientPhone(phoneNum);
                                    setShowPatientSugg(false);
                                  }}
                                >
                                  <span className="font-semibold text-foreground">
                                    {fullName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3 h-3" />{" "}
                                    {phoneNum || "No phone"} ·{" "}
                                    <span className="font-mono">
                                      {p.patientNo}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Patient Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="e.g. +91 9876543210"
                          className="pl-9 h-10 w-full rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                          value={patientPhone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPatientPhone(val);
                            // Look up if any patient matches this phone number
                            const cleanVal = val.replace(/\D/g, "");
                            if (cleanVal.length >= 10) {
                              const found = patients.find((p) => {
                                const pPhoneClean = (
                                  p.phone ||
                                  p.alternativeNum ||
                                  ""
                                ).replace(/\D/g, "");
                                return (
                                  pPhoneClean.endsWith(cleanVal) ||
                                  cleanVal.endsWith(pPhoneClean)
                                );
                              });
                              if (found) {
                                const fullName =
                                  found.name ||
                                  `${found.firstName} ${found.lastName || ""}`.trim();
                                setPatientName(fullName);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medicine Items list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Medicine Line Items
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1 border-dashed"
                      onClick={addBillItemLine}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3.5">
                    {billItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row gap-3 items-start sm:items-end border border-border/40 p-3 rounded-xl bg-muted/10 relative group"
                      >
                        {/* Select Medicine */}
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            Select Medicine
                          </label>
                          <select
                            className="h-9 w-full rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                            value={item.medicineName}
                            onChange={(e) =>
                              updateBillItemLine(
                                idx,
                                "medicineName",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">-- Choose Medicine --</option>
                            {medicines.map((med) => (
                              <option key={med.medicineCode} value={med.name}>
                                {med.name} (Stock: {med.stockQuantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Price (Read-only or Override) */}
                        <div className="w-full sm:w-24">
                          <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-9 w-full rounded-lg border border-border bg-card text-xs text-right font-mono focus:outline-none"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              updateBillItemLine(
                                idx,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>

                        {/* Qty */}
                        <div className="w-full sm:w-20">
                          <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="h-9 w-full rounded-lg border border-border bg-card text-xs text-right font-mono focus:outline-none"
                            value={item.quantity}
                            onChange={(e) =>
                              updateBillItemLine(
                                idx,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>

                        {/* Line total */}
                        <div className="w-full sm:w-24 text-right pb-2 sm:pb-0">
                          <span className="block text-[10px] font-semibold text-muted-foreground mb-1 sm:hidden">
                            Total
                          </span>
                          <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-200">
                            ₹
                            {(
                              (item.unitPrice || 0) * (item.quantity || 1)
                            ).toLocaleString()}
                          </span>
                        </div>

                        {/* Delete line */}
                        <button
                          type="button"
                          className="absolute sm:static right-2 top-2 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                          onClick={() => removeBillItemLine(idx)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Summary Calculations */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Discount & Taxes
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                        Flat Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        className="h-10 w-full rounded-xl border border-border bg-card text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                        value={discountVal}
                        onChange={(e) => setDiscountVal(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="5"
                        className="h-10 w-full rounded-xl border border-border bg-card text-sm text-right font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* live breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-medium">
                        ₹{newBillSubtotal.toLocaleString()}
                      </span>
                    </div>
                    {newBillDiscount > 0 && (
                      <div className="flex justify-between items-center text-xs text-rose-500">
                        <span>Discount Deducted:</span>
                        <span className="font-mono font-medium">
                          -₹{newBillDiscount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Calculated Tax ({taxPercent}%):</span>
                      <span className="font-mono font-medium">
                        ₹{newBillTaxAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border/80">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Grand Total:
                      </span>
                      <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                        ₹{newBillTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter any billing notes or prescription references..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsNewBillOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleSaveBill("DRAFT")}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                  onClick={handlePayDispenseClick}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Pay & Dispense Now"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for payment processing */}
      {isPaymentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          data-ocid="pharmacist.payment-dialog"
        >
          <div
            className={`w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] transition-all duration-300 ${paymentStep === "CARD" ? "max-w-md" : ""}`}
          >
            {/* STEP METHOD: Payment Methods Selection Screen */}
            {paymentStep === "METHOD" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                  <button
                    type="button"
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      setIsPaymentOpen(false);
                      setPayingDraftBill(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-foreground">
                    Select Payment Method
                  </h3>
                </div>

                <div className="flex justify-between items-center p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                  <span className="text-xs text-muted-foreground font-medium">
                    Total Payable
                  </span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    ₹{displayPayableTotal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* CASH METHOD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPaymentStep("CASH")}
                    className="w-full text-left p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        Cash Payment
                      </p>
                      <p className="text-[10px] text-emerald-600/80 mt-0.5">
                        Collect physical cash at counter
                      </p>
                    </div>
                  </button>

                  {/* UPI / QR CODE METHOD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPaymentStep("UPI")}
                    className="w-full text-left p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-indigo-800 dark:text-indigo-400">
                        UPI / QR Code
                      </p>
                      <p className="text-[10px] text-indigo-600/80 mt-0.5">
                        Generate dynamic QR for instant scan
                      </p>
                    </div>
                  </button>

                  {/* CARD METHOD BUTTON */}
                  <button
                    type="button"
                    onClick={() => setPaymentStep("CARD")}
                    className="w-full text-left p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 flex items-center gap-4 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-400">
                        Card / Razorpay
                      </p>
                      <p className="text-[10px] text-blue-600/80 mt-0.5">
                        Secure credit/debit card swipe
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP CASH: Cash checkout page */}
            {paymentStep === "CASH" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3">
                  <button
                    type="button"
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setPaymentStep("METHOD")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-foreground">
                    Record Cash Payment
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Due Cash Amount:
                    </span>
                    <span className="font-bold text-emerald-600">
                      ₹{displayPayableTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider text-center">
                    Collect physical cash at counter
                  </p>
                  <div className="text-center font-bold text-sm py-2 px-4 border border-border bg-background rounded-lg text-foreground/80">
                    Received: ₹{displayPayableTotal.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setPaymentStep("METHOD")}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                    onClick={() => completePayDispense("CASH")}
                  >
                    Confirm Cash Received
                  </Button>
                </div>
              </div>
            )}

            {/* STEP UPI: Dynamic QR Code Simulator */}
            {paymentStep === "UPI" && (
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3 w-full">
                  <button
                    type="button"
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setPaymentStep("METHOD")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-foreground">
                    Dynamic UPI QR Code
                  </h3>
                </div>
                <div className="text-center bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl w-full">
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                    Payable: ₹{displayPayableTotal.toLocaleString()}
                  </p>
                </div>

                {/* GORGEOUS QR CODE CONTAINER */}
                <div className="relative p-4 bg-white dark:bg-zinc-950 border-2 border-indigo-500/30 rounded-2xl shadow-glass-inner group transition-all duration-300">
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xs animate-pulse -z-10"></div>

                  {/* Premium Vector QR */}
                  <svg
                    width="130"
                    height="130"
                    viewBox="0 0 100 100"
                    className="mx-auto text-indigo-600 dark:text-indigo-400"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="22"
                      height="22"
                      fill="currentColor"
                    />
                    <rect x="3" y="3" width="16" height="16" fill="white" />
                    <rect
                      x="6"
                      y="6"
                      width="10"
                      height="10"
                      fill="currentColor"
                    />

                    <rect
                      x="78"
                      y="0"
                      width="22"
                      height="22"
                      fill="currentColor"
                    />
                    <rect x="81" y="3" width="16" height="16" fill="white" />
                    <rect
                      x="84"
                      y="6"
                      width="10"
                      height="10"
                      fill="currentColor"
                    />

                    <rect
                      x="0"
                      y="78"
                      width="22"
                      height="22"
                      fill="currentColor"
                    />
                    <rect x="3" y="81" width="16" height="16" fill="white" />
                    <rect
                      x="6"
                      y="84"
                      width="10"
                      height="10"
                      fill="currentColor"
                    />

                    <rect
                      x="35"
                      y="10"
                      width="8"
                      height="8"
                      fill="currentColor"
                    />
                    <rect
                      x="50"
                      y="25"
                      width="12"
                      height="12"
                      fill="currentColor"
                    />
                    <rect
                      x="15"
                      y="45"
                      width="18"
                      height="8"
                      fill="currentColor"
                    />
                    <rect
                      x="42"
                      y="52"
                      width="8"
                      height="18"
                      fill="currentColor"
                    />
                    <rect
                      x="68"
                      y="68"
                      width="12"
                      height="8"
                      fill="currentColor"
                    />
                    <rect
                      x="30"
                      y="80"
                      width="16"
                      height="12"
                      fill="currentColor"
                    />
                    <rect
                      x="60"
                      y="40"
                      width="14"
                      height="14"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                <div className="flex flex-col items-center gap-2 w-full mt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Waiting for customer payment...</span>
                  </div>

                  {/* QUICK PAY SIMULATOR BUTTON */}
                  <Button
                    size="sm"
                    className="w-full mt-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md border-0"
                    onClick={() => completePayDispense("UPI")}
                  >
                    Simulate Successful Scan & Pay
                  </Button>
                </div>
              </div>
            )}

            {/* STEP CARD: Razorpay checkout form */}
            {paymentStep === "CARD" && (
              <div className="space-y-4">
                <div className="relative border-b border-border/80 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => setPaymentStep("METHOD")}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground/80 flex items-center gap-1.5">
                      <span className="font-mono bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20 text-[10px]">
                        Razorpay
                      </span>{" "}
                      Secure Terminal
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                    <Lock className="w-3 h-3 text-emerald-500" /> Secure SSL
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="flex justify-between items-center p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                    <span className="text-xs text-blue-800 dark:text-blue-400 font-medium">
                      Card Checkout Amount
                    </span>
                    <span className="text-sm font-bold font-mono text-blue-600">
                      ₹{displayPayableTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-3.5 p-3.5 border border-border/80 rounded-xl bg-muted/15 relative">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="pl-9 h-8 text-xs font-mono w-full rounded-lg border border-border bg-card focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Expiry
                        </label>
                        <input
                          placeholder="MM / YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="h-8 text-xs text-center font-mono w-full rounded-lg border border-border bg-card focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          placeholder="***"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="h-8 text-xs text-center font-mono w-full rounded-lg border border-border bg-card focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 h-9 text-xs"
                      onClick={() => setPaymentStep("METHOD")}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 shadow-md"
                      onClick={() => completePayDispense("CARD")}
                    >
                      Pay ₹{displayPayableTotal.toLocaleString()} via Razorpay
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP PROCESSING: Transaction authorization page */}
            {paymentStep === "PROCESSING" && (
              <div className="py-10 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto shadow-md">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-foreground">
                    Authorizing Transaction
                  </h3>
                  <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                    {chosenMethod === "CARD"
                      ? "Securing 256-bit connection with Razorpay Payment Gateway..."
                      : chosenMethod === "UPI"
                        ? "Verifying UPI ledger signature and settling balance..."
                        : "Logging cash transaction in safe ledger..."}
                  </p>
                </div>
              </div>
            )}

            {/* STEP SUCCESS: Receipt success screen */}
            {paymentStep === "SUCCESS" && (
              <div className="py-6 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <CheckCircle className="w-8 h-8 text-emerald-500 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Payment Received
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Authorized & Settled Successfully
                  </p>
                </div>

                <div className="bg-muted/40 rounded-xl p-3.5 text-xs space-y-1.5 border border-border/40 text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">
                      Amount Received:
                    </span>
                    <span className="font-bold font-mono text-emerald-600">
                      ₹{displayPayableTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">
                      Payment Mode:
                    </span>
                    <span className="font-bold uppercase">{chosenMethod}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1.5 mt-1 text-[10px]">
                    <span className="text-muted-foreground">
                      Transaction ID:
                    </span>
                    <span className="font-mono font-bold text-rose-500">
                      {transactionId}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-9 shadow-md"
                  onClick={() => {
                    // Reset Form State if we were not paying a draft
                    if (!payingDraftBill) {
                      setPatientName("");
                      setPatientPhone("");
                      setNotes("");
                      setDiscountVal("");
                      setTaxPercent(5);
                      setBillItems([
                        { medicineName: "", quantity: 1, unitPrice: 0 },
                      ]);
                      setLinkedPrescriptionNo(null);
                    }

                    // Reset Payment states
                    setIsPaymentOpen(false);
                    setIsNewBillOpen(false);
                    setCardNumber("");
                    setCardExpiry("");
                    setCardCvv("");
                    setPayingDraftBill(null);
                  }}
                >
                  Close & Print Receipt
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog for viewing Bill detail receipt */}
      {viewingBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          data-ocid="pharmacist.view-bill-dialog"
        >
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-foreground">
                  Medicine Bill Receipt
                </h3>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Top Meta info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 border border-border/80 rounded-xl p-4 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Patient
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {viewingBill.patientName}
                  </div>
                  {viewingBill.patientPhone && (
                    <div className="text-muted-foreground mt-0.5">
                      {viewingBill.patientPhone}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Invoice Info
                  </div>
                  <div className="font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                    {viewingBill.billNo}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {new Date(viewingBill.createdAt).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Dispensed Medicines
                </h4>
                <div className="border border-border rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="p-2.5 font-semibold text-muted-foreground">
                          Medicine
                        </th>
                        <th className="p-2.5 font-semibold text-muted-foreground text-right w-20">
                          Price
                        </th>
                        <th className="p-2.5 font-semibold text-muted-foreground text-center w-16">
                          Qty
                        </th>
                        <th className="p-2.5 font-semibold text-muted-foreground text-right w-24">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {viewingBill.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {it.medicineName}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            ₹{it.unitPrice.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center font-mono">
                            {it.quantity}
                          </td>
                          <td className="p-2.5 text-right font-bold font-mono">
                            ₹{it.lineTotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary calculations block */}
              <div className="flex justify-end text-xs">
                <table className="w-64 space-y-1.5">
                  <tbody>
                    <tr className="text-muted-foreground">
                      <td className="py-1">Subtotal:</td>
                      <td className="py-1 text-right font-mono">
                        ₹{viewingBill.subtotal.toLocaleString()}
                      </td>
                    </tr>
                    {viewingBill.discount > 0 && (
                      <tr className="text-rose-500">
                        <td className="py-1 font-semibold">Discount:</td>
                        <td className="py-1 text-right font-mono font-semibold">
                          -₹{viewingBill.discount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {viewingBill.tax > 0 && (
                      <tr className="text-muted-foreground">
                        <td className="py-1">Tax:</td>
                        <td className="py-1 text-right font-mono">
                          ₹{viewingBill.tax.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-border pt-1.5 text-sm font-bold">
                      <td className="py-2 text-slate-800 dark:text-slate-100">
                        Total Amount:
                      </td>
                      <td className="py-2 text-right font-black font-mono text-rose-600 dark:text-rose-400">
                        ₹{viewingBill.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 border border-border/80 p-3.5 rounded-xl text-xs">
                <div className="flex items-center gap-3.5">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Payment Status:{" "}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ml-1 rounded-full ${
                        viewingBill.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/35"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/35"
                      }`}
                    >
                      {viewingBill.status}
                    </Badge>
                  </div>
                </div>
                {viewingBill.status === "PAID" &&
                  getPaymentMode(viewingBill) && (
                    <div>
                      <span className="font-semibold text-muted-foreground">
                        Payment Mode:{" "}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ml-1 rounded-full ${
                          getPaymentMode(viewingBill) === "CASH"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/35"
                            : getPaymentMode(viewingBill) === "UPI"
                              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/35"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/35"
                        }`}
                      >
                        {getPaymentMode(viewingBill) === "UPI"
                          ? "QR CODE"
                          : getPaymentMode(viewingBill)}
                      </Badge>
                    </div>
                  )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/10 rounded-b-2xl">
              <Button variant="ghost" onClick={() => setViewingBill(null)}>
                Close
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5"
                onClick={() => {
                  handlePrintReceipt(viewingBill);
                  setViewingBill(null);
                }}
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

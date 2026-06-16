import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  ExternalLink,
  Eye,
  Loader2,
  Printer,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PharmacistPrescriptions() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [viewingRx, setViewingRx] = useState<any | null>(null);
  const [isPrinting, setIsPrinting] = useState<Record<string, boolean>>({});
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  // Redirect to Medicine Billing with prescription pre-loaded
  const handleProcessRedirect = (rx: any) => {
    try {
      sessionStorage.setItem("pharmacist_pending_rx", JSON.stringify(rx));
    } catch (e) {
      console.warn("sessionStorage not available", e);
    }
    toast.info(`Loading prescription ${rx.prescriptionNo} into billing...`);
    navigate({ to: "/pharmacist/billing" });
  };

  // Tabs: PENDING vs DISPENSED
  const [activeTab, setActiveTab] = useState<"PENDING" | "DISPENSED">(
    "PENDING",
  );

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when tab changes or length of prescriptions changes
  useEffect(() => {
    setPage(0);
  }, [activeTab, prescriptions.length]);

  // Load hospital details
  useEffect(() => {
    const fetchHospitalDetails = async () => {
      const code = user?.hospitalCode || "HSP001";
      try {
        const info = await apiFetch<any>(`/super-admin/hospitals/code/${code}`);
        if (info) {
          setHospitalInfo(info);
        }
      } catch (err) {
        console.warn("Could not retrieve hospital details:", err);
      }
    };
    if (user) {
      fetchHospitalDetails();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const res = await apiFetch<any>("/pharmacy/prescriptions", {
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
        params: { status: activeTab, page: 0, size: 1000 },
      });
      const list = res?.content || res || [];
      setPrescriptions(list);
    } catch (e) {
      console.warn(`Failed to fetch ${activeTab} prescriptions`, e);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user, activeTab]);

  const handleDelete = async (rx: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete prescription ${rx.prescriptionNo}?`,
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/pharmacy/prescriptions/${rx.prescriptionNo}`, {
        method: "DELETE",
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });
      toast.success("Prescription deleted successfully!");
      fetchPrescriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete prescription");
    }
  };

  const handlePrintInvoice = async (rx: any) => {
    const code = user?.hospitalCode || "HSP001";
    const rxNo = rx.prescriptionNo;
    setIsPrinting((prev) => ({ ...prev, [rxNo]: true }));
    try {
      // 1. Patient details (optional fallback)
      let patientDetails: any = null;
      try {
        patientDetails = await apiFetch<any>(
          `/reception/patients/${rx.patientNo}`,
          {
            headers: { "X-Hospital-Code": code },
          },
        );
      } catch (_) {
        /* silent */
      }

      // 2. Medicines catalog for pricing
      let medicines: any[] = [];
      try {
        const medRes = await apiFetch<any>("/pharmacy/medicines", {
          headers: { "X-Hospital-Code": code },
          params: { page: 0, size: 1000 },
        });
        medicines = medRes?.content || medRes || [];
      } catch (_) {
        /* silent */
      }

      const getMedPrice = (name: string) => {
        const m = medicines.find(
          (x: any) => x.name?.toLowerCase() === name?.toLowerCase(),
        );
        return m ? m.sellingPrice || m.unitPrice || 0 : 0;
      };

      // 3. Line items from prescription itself
      const lineItems = (rx.prescriptionItems || []).map(
        (item: any, i: number) => {
          const unitPrice = getMedPrice(item.medicineName);
          const qty = item.quantityPrescribed || 1;
          return {
            sno: i + 1,
            name: item.medicineName || "—",
            dosage: item.dosage || "",
            duration: item.duration || "",
            qty,
            unitPrice,
            total: unitPrice * qty,
          };
        },
      );
      const subtotal = lineItems.reduce((s: number, x: any) => s + x.total, 0);

      // 4. Hospital + patient info
      let hospitalName =
        hospitalInfo?.hospitalName ||
        hospitalInfo?.name ||
        "Apollo Hospital Bangalore";
      if (hospitalName === "Charlie General Hospital")
        hospitalName = "Apollo Hospital Bangalore";
      const hospitalPhone = hospitalInfo?.phone || "+91 9292929292";
      const hospitalEmail =
        hospitalInfo?.email || `support@${code.toLowerCase()}.com`;
      const hospitalAddress =
        hospitalInfo?.address || "123 Healthcare Ave, Medical District";
      const patientName =
        rx.patientName || patientDetails?.name || "Unknown Patient";
      const patientPhone2 =
        patientDetails?.phone || patientDetails?.alternativeNum || "—";
      const patientAge =
        patientDetails?.age ||
        (patientDetails?.dob
          ? `${new Date().getFullYear() - new Date(patientDetails.dob).getFullYear()} yrs`
          : "—");
      const patientGender = patientDetails?.gender || "—";
      const dispensedDate =
        rx.dispensedDate ||
        rx.updatedAt ||
        rx.prescriptionDate ||
        new Date().toISOString().split("T")[0];

      const rowsHtml =
        lineItems.length === 0
          ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8;font-style:italic">No medicine items recorded in this prescription.</td></tr>`
          : lineItems
              .map(
                (it: any) => `
          <tr>
            <td style="color:#94a3b8;font-size:10.5px;width:36px">${it.sno}</td>
            <td>
              <div style="font-weight:600;color:#1e293b">${it.name}</div>
              ${it.dosage || it.duration ? `<div style="font-size:9.5px;color:#94a3b8;margin-top:2px">${[it.dosage, it.duration].filter(Boolean).join(" · ")}</div>` : ""}
            </td>
            <td style="text-align:right;font-weight:600;color:#334155">${it.qty}</td>
            <td style="text-align:right;font-family:monospace;color:#334155">${it.unitPrice > 0 ? "\u20b9" + it.unitPrice.toLocaleString("en-IN") : "\u2014"}</td>
            <td style="text-align:right;font-family:monospace;font-weight:700;color:#0f766e">${it.total > 0 ? "\u20b9" + it.total.toLocaleString("en-IN") : "\u2014"}</td>
          </tr>`,
              )
              .join("");

      const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Pharmacy Receipt \u2013 ${rxNo}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1a1a2e;background:#fff}
  .page{max-width:780px;margin:0 auto;padding:36px 40px 40px}
  .header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:18px;border-bottom:3px solid #0f766e;margin-bottom:22px;gap:16px}
  .logo-circle{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:900;letter-spacing:-1px;flex-shrink:0}
  .logo-row{display:flex;align-items:center;gap:10px}
  h1{font-size:20px;font-weight:800;color:#0f766e;letter-spacing:-0.5px;line-height:1}
  .sub{font-size:9.5px;color:#64748b;margin-top:3px;line-height:1.6}
  .rx-badge{text-align:right;flex-shrink:0}
  .doc-type{font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
  .rx-no{font-size:17px;font-weight:900;color:#0f766e;font-family:monospace}
  .stamp{display:inline-block;margin-top:6px;background:#d1fae5;color:#065f46;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:3px 12px;border-radius:999px;border:1.5px solid #6ee7b7}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
  .info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
  .card-title{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
  .irow{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;font-size:11.5px}
  .lbl{color:#64748b;font-weight:500}.val{color:#1e293b;font-weight:600;text-align:right}
  .sec-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%)}
  thead th{color:#fff;font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:9px 12px;text-align:left}
  thead th.r{text-align:right}
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:last-child{border-bottom:none}
  tbody tr:nth-child(even){background:#fafcff}
  tbody td{padding:9px 12px;font-size:11.5px;color:#334155;vertical-align:top}
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:16px}
  .totals-box{width:270px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
  .trow{display:flex;justify-content:space-between;padding:7px 14px;font-size:12px}
  .trow .tl{color:#64748b;font-weight:500}.trow .tv{font-family:monospace;color:#1e293b;font-weight:600}
  .trow.grand{background:#0f766e}
  .trow.grand .tl{color:#a7f3d0;font-weight:700;font-size:13px}
  .trow.grand .tv{color:#fff;font-size:16px;font-weight:900;font-family:monospace}
  .tdiv{border:none;border-top:1px solid #e2e8f0;margin:0}
  .disp-note{margin-top:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #0f766e;border-radius:8px;padding:10px 14px;font-size:10.5px;color:#065f46}
  .footer{margin-top:28px;border-top:1.5px dashed #cbd5e1;padding-top:14px}
  .fgrid{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
  .fleft{font-size:10px;color:#94a3b8;line-height:1.7}
  .fleft strong{color:#475569;font-weight:700}
  .sign-block{text-align:center;min-width:140px}
  .sign-line{border-top:1px solid #334155;margin-bottom:4px;margin-top:32px}
  .sign-lbl{font-size:9px;letter-spacing:0.5px;color:#64748b;text-transform:uppercase;font-weight:600}
  .gen-note{margin-top:12px;text-align:center;font-size:9px;color:#b0bec5;letter-spacing:0.3px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:20px}}
</style></head>
<body><div class="page">
  <div class="header">
    <div class="hosp-brand">
      <div class="logo-row">
        <div class="logo-circle">H+</div>
        <div>
          <h1>${hospitalName}</h1>
          <div class="sub">${hospitalAddress}</div>
          <div class="sub">\u260e ${hospitalPhone} &nbsp;|&nbsp; \u2709 ${hospitalEmail}</div>
        </div>
      </div>
    </div>
    <div class="rx-badge">
      <div class="doc-type">Pharmacy Receipt</div>
      <div class="rx-no">${rxNo}</div>
      <div><span class="stamp">\u2713 Dispensed</span></div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-card">
      <div class="card-title">Patient Information</div>
      <div class="irow"><span class="lbl">Full Name</span><span class="val">${patientName}</span></div>
      <div class="irow"><span class="lbl">Patient ID</span><span class="val" style="font-family:monospace">${rx.patientNo || "\u2014"}</span></div>
      <div class="irow"><span class="lbl">Age / Gender</span><span class="val">${patientAge} / ${patientGender}</span></div>
      <div class="irow"><span class="lbl">Mobile</span><span class="val">${patientPhone2}</span></div>
    </div>
    <div class="info-card">
      <div class="card-title">Prescription Details</div>
      <div class="irow"><span class="lbl">Prescription No</span><span class="val" style="font-family:monospace">${rxNo}</span></div>
      <div class="irow"><span class="lbl">Prescribed By</span><span class="val">${rx.doctorName || "\u2014"}</span></div>
      <div class="irow"><span class="lbl">Prescribed Date</span><span class="val">${rx.prescriptionDate || "\u2014"}</span></div>
      <div class="irow"><span class="lbl">Dispensed On</span><span class="val">${dispensedDate}</span></div>
    </div>
  </div>
  <div class="sec-title">Dispensed Medicines</div>
  <table>
    <thead><tr>
      <th style="width:36px">#</th>
      <th>Medicine Name</th>
      <th class="r" style="width:60px">Qty</th>
      <th class="r" style="width:100px">Unit Price</th>
      <th class="r" style="width:110px">Amount</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="totals-wrap">
    <div class="totals-box">
      <div class="trow"><span class="tl">Subtotal</span><span class="tv">\u20b9${subtotal > 0 ? subtotal.toLocaleString("en-IN") : "\u2014"}</span></div>
      <hr class="tdiv"/>
      <div class="trow grand"><span class="tl">Total Payable</span><span class="tv">\u20b9${subtotal > 0 ? subtotal.toLocaleString("en-IN") : "\u2014"}</span></div>
    </div>
  </div>
  <div class="disp-note">
    <strong>Dispensing Note:</strong> All medicines above have been dispensed against prescription <strong>${rxNo}</strong>. Inventory stock deducted. Please retain this receipt for your records.
  </div>
  <div class="footer">
    <div class="fgrid">
      <div class="fleft">
        <strong>${hospitalName}</strong><br/>
        ${hospitalAddress}<br/>
        Tel: ${hospitalPhone} &nbsp;|&nbsp; ${hospitalEmail}
      </div>
      <div class="sign-block">
        <div class="sign-line"></div>
        <div class="sign-lbl">Pharmacist Signature &amp; Stamp</div>
      </div>
    </div>
    <p class="gen-note">Computer-generated pharmacy dispensing receipt &nbsp;|&nbsp; Powered by HealthMatrix360 HMS</p>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) {
        toast.error("Pop-up blocked — please allow pop-ups and try again");
        return;
      }
      win.document.write(html);
      win.document.close();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate print receipt");
    } finally {
      setIsPrinting((prev) => ({ ...prev, [rxNo]: false }));
    }
  };

  return (
    <div className="space-y-6" data-ocid="pharmacist.prescriptions.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Dispense Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Process incoming prescriptions and issue medications
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border pb-1 flex-shrink-0">
        <button
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x -mb-[1px] transition-all ${
            activeTab === "PENDING"
              ? "bg-background border-border text-primary shadow-sm"
              : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
          }`}
          onClick={() => setActiveTab("PENDING")}
        >
          Pending Prescriptions
        </button>
        <button
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x -mb-[1px] transition-all ${
            activeTab === "DISPENSED"
              ? "bg-background border-border text-primary shadow-sm"
              : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
          }`}
          onClick={() => setActiveTab("DISPENSED")}
        >
          Dispensed Prescriptions
        </button>
      </div>

      <div className="glass-elevated rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-semibold">
            {activeTab === "PENDING"
              ? "Pending Prescriptions"
              : "Processed Prescriptions"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prescriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No prescriptions found in queue.
                  </td>
                </tr>
              ) : (
                prescriptions
                  .slice(page * pageSize, (page + 1) * pageSize)
                  .map((rx) => (
                    <tr key={rx.prescriptionNo} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        {rx.patientName || "Unknown"}{" "}
                        <span className="text-xs text-muted-foreground block">
                          {rx.patientNo}
                        </span>
                      </td>
                      <td className="p-3">{rx.doctorName}</td>
                      <td className="p-3">{rx.prescriptionDate}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            activeTab === "PENDING"
                              ? "bg-amber-500/20 text-amber-500"
                              : "bg-green-500/20 text-green-600 border-green-500/30"
                          }
                        >
                          {rx.status || activeTab}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {activeTab === "PENDING" ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                              onClick={() => handleProcessRedirect(rx)}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Process
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => setViewingRx(rx)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(rx)}
                              title="Delete Prescription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex items-center gap-1"
                              onClick={() => setViewingRx(rx)}
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </Button>
                            <Button
                              size="sm"
                              disabled={isPrinting[rx.prescriptionNo]}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs flex items-center gap-1.5"
                              onClick={() => handlePrintInvoice(rx)}
                            >
                              {isPrinting[rx.prescriptionNo] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Printer className="w-3.5 h-3.5" />
                              )}
                              Print Receipt
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControl
          currentPage={page}
          totalPages={Math.ceil(prescriptions.length / pageSize)}
          totalElements={prescriptions.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          className="px-4 border-t border-border/60 bg-card/20 py-2.5"
        />
      </div>

      {/* Dispense modal removed — Process button now redirects to /pharmacist/billing */}

      {/* View Modal */}
      <Dialog
        open={!!viewingRx}
        onOpenChange={(open) => !open && setViewingRx(null)}
      >
        <DialogContent className="max-w-md glass-elevated border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display font-bold">
              Prescription details - {viewingRx?.prescriptionNo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Patient Profile
                </p>
                <p className="font-semibold text-foreground">
                  {viewingRx?.patientName || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {viewingRx?.patientNo}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Issued Date
                </p>
                <p className="font-semibold text-foreground">
                  {viewingRx?.prescriptionDate || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Prescribing Doctor
                </p>
                <p className="font-semibold text-foreground">
                  {viewingRx?.doctorName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Status
                </p>
                <Badge
                  variant="outline"
                  className={
                    viewingRx?.status?.toUpperCase() === "DISPENSED"
                      ? "bg-green-500/20 text-green-600 border-green-500/30"
                      : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                  }
                >
                  {viewingRx?.status || "Pending"}
                </Badge>
              </div>
            </div>

            <div className="h-[1px] w-full bg-border" />

            <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/10 max-h-[300px] overflow-y-auto">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Medications
              </h4>
              {viewingRx?.prescriptionItems?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.medicineName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dose: {item.dosage} | Duration: {item.duration}
                    </p>
                    {item.instructions && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5">
                        Instructions: {item.instructions}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                    Qty: {item.quantityPrescribed || 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setViewingRx(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

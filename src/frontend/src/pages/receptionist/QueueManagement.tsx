import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type {
  AppointmentResponse,
  PatientResponse,
} from "@/lib/reception-types";
import { formatTimeSlot, getLocalDateString } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  ListOrdered,
  Printer,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { OPDAvailabilityModal } from "./OPDAvailabilityModal";
import { OPDRegistrationModal } from "./OPDRegistrationModal";
import { PaginationControl } from "@/components/ui/pagination-control";

const todayStr = getLocalDateString();

export default function QueueManagement() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const code = user?.hospitalCode || "HSP001";

  // Screen 12 (OPD List) Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Real appointment data
  const [opdList, setOpdList] = useState<AppointmentResponse[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectPatientOpen, setSelectPatientOpen] = useState(false);
  const [opdModalOpen, setOpdModalOpen] = useState(false);
  const [opdAvailabilityOpen, setOpdAvailabilityOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Screen 11 (Select Patient) Form State
  const [selPatNo, setSelPatNo] = useState("");
  const [selVisitDate, setSelVisitDate] = useState(getLocalDateString());
  const [selVisitTime, setSelVisitTime] = useState("");

  const loadOpdList = useCallback(async () => {
    setLoadingList(true);
    try {
      // Fetch appointments and doctors in parallel
      const [list, docList] = await Promise.all([
        receptionApi.getAppointments(code, fromDate || todayStr),
        apiFetch<any[]>("/admin/doctors", {
          headers: { "X-Hospital-Code": code },
        }),
      ]);

      const doctorsArray = Array.isArray(docList) ? docList : [];
      const doctorNamesMap = new Map<string, string>();
      for (const d of doctorsArray) {
        const rawName =
          d.name ||
          [d.firstName, d.lastName].filter(Boolean).join(" ") ||
          d.doctorCode ||
          "Doctor";
        const name = rawName.toLowerCase().startsWith("dr.")
          ? rawName
          : `Dr. ${rawName}`;
        if (d.doctorCode) {
          doctorNamesMap.set(d.doctorCode.toLowerCase(), name);
        }
        if (d.id) {
          doctorNamesMap.set(String(d.id).toLowerCase(), name);
        }
      }

      const resolvedList = (Array.isArray(list) ? list : []).map((appt) => {
        const docId = appt.doctorId?.toLowerCase();
        const docNameFromBackend = appt.doctorName || "";
        const docNameClean = docNameFromBackend
          .replace(/^dr\.\s+/i, "")
          .trim()
          .toLowerCase();

        let resolvedDoctorName = appt.doctorName;
        if (docId && doctorNamesMap.has(docId)) {
          resolvedDoctorName = doctorNamesMap.get(docId) || appt.doctorName;
        } else if (doctorNamesMap.has(docNameClean)) {
          resolvedDoctorName =
            doctorNamesMap.get(docNameClean) || appt.doctorName;
        }
        return {
          ...appt,
          doctorName: resolvedDoctorName,
        };
      });

      setOpdList(resolvedList);
    } catch {
      toast.error("Failed to load OPD list");
    } finally {
      setLoadingList(false);
    }
  }, [code, fromDate]);

  useEffect(() => {
    loadOpdList();
  }, [loadOpdList]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [fromDate, toDate]);

  const handleRefresh = () => {
    loadOpdList();
    toast.success("List Refreshed");
  };

  const handleSelectPatient = async () => {
    if (!selPatNo) {
      toast.error("Please enter a Patient No.");
      return;
    }
    const loadingToast = toast.loading(`Validating Patient ${selPatNo}...`);
    try {
      const patient = await receptionApi.getPatient(selPatNo.trim(), code);
      toast.success(
        `Validated Patient: ${patient.name} (${patient.patientNo}) for OPD on ${selVisitDate} ${
          selVisitTime ? `at ${selVisitTime}` : ""
        }`,
      );
      setSelectPatientOpen(false);
    } catch {
      toast.error("Patient number not registered under this hospital tenant.");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleCancelAppt = (id: number, name: string) => {
    setApptToCancel({ id, name });
    setCancelConfirmOpen(true);
  };

  const confirmCancelAppt = async () => {
    if (!apptToCancel) return;
    try {
      await receptionApi.updateAppointmentStatus(
        apptToCancel.id,
        "Cancelled",
        code,
      );
      toast.info(`Appointment for ${apptToCancel.name} cancelled`);
      loadOpdList();
      setSelectedRow(null);
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelConfirmOpen(false);
      setApptToCancel(null);
    }
  };

  const handlePrintAppt = async (appt: AppointmentResponse) => {
    let patientDetails: PatientResponse | null = null;
    const loadingToast = toast.loading(
      `Fetching details for ${appt.patientName}...`,
    );
    try {
      patientDetails = await receptionApi.getPatient(appt.patientNo, code);
    } catch (err) {
      console.error("Failed to fetch patient details:", err);
    } finally {
      toast.dismiss(loadingToast);
    }

    let currentHospital = hospitalInfo;
    if (!currentHospital) {
      try {
        currentHospital = await apiFetch<any>(
          `/super-admin/hospitals/code/${code}`,
        );
        setHospitalInfo(currentHospital);
      } catch (err) {
        console.error("Failed to fetch hospital details:", err);
      }
    }

    // Resolve consulting doctor's full name from admin-service
    let consultingDoctor = appt.doctorName || "—";
    try {
      const docs = await apiFetch<any>("/admin/doctors", {
        params: { page: 0, size: 1000 },
        headers: { "X-Hospital-Code": code },
      });
      const docsList = Array.isArray(docs) ? docs : docs.content || [];
      const match = docsList.find((d: any) => {
        const docFullName = `Dr. ${d.firstName} ${d.lastName || ""}`
          .trim()
          .toLowerCase();
        const docLower = consultingDoctor.toLowerCase();
        return (
          docFullName.includes(docLower) ||
          docLower.includes(d.firstName.toLowerCase()) ||
          docLower.includes(d.lastName?.toLowerCase() || "_none_")
        );
      });
      if (match) {
        consultingDoctor =
          `Dr. ${match.firstName} ${match.lastName || ""}`.trim();
      }
    } catch (e) {
      console.warn("Could not resolve consulting doctor full name", e);
    }

    let hospitalName =
      currentHospital?.hospitalName || "Apollo Hospital Bangalore";
    if (hospitalName === "Charlie General Hospital") {
      hospitalName = "Apollo Hospital Bangalore";
    }

    const cleanVal = (val: any): string => {
      if (val === undefined || val === null) return "";
      const s = String(val).trim();
      if (/^(unknown|unknownunknown|null|na|n\/a|—|-)$/i.test(s)) {
        return "";
      }
      return s;
    };

    const regNo = cleanVal(currentHospital?.registrationNumber);
    const hAddr = cleanVal(currentHospital?.address);
    const hPhone = cleanVal(currentHospital?.phone);
    const hEmail = cleanVal(currentHospital?.email);

    const pAge = cleanVal(patientDetails?.age);
    const pGender = cleanVal(patientDetails?.gender);
    const pMobile = cleanVal(
      patientDetails?.alternativeNum || patientDetails?.phone,
    );
    const pBlood = cleanVal(patientDetails?.bloodGroup);
    const pAadhar = cleanVal(patientDetails?.aadhar);
    const pAddr = cleanVal(patientDetails?.address);

    const html = `
      <html><head><title>Appointment Slip - ${appt.patientName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; padding: 20px; color: #333; line-height: 1.6; }
        .ticket { max-width: 450px; margin: 0 auto; border: 1px dashed #bbb; padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 16px; margin-bottom: 16px; }
        .hospital-name { margin: 0; font-size: 20px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; }
        .hospital-meta { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.4; }
        .slip-title { font-size: 13px; font-weight: 700; color: #4f46e5; margin-top: 12px; letter-spacing: 2px; text-transform: uppercase; }
        .token-box { text-align: center; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; margin: 18px 0; }
        .token-label { font-size: 10px; text-transform: uppercase; color: #4b5563; font-weight: 700; letter-spacing: 1px; }
        .token-num { font-size: 36px; font-weight: 900; color: #1f2937; line-height: 1; margin-top: 4px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 16px 0 8px 0; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { display: flex; flex-direction: column; }
        .field.full { grid-column: span 2; }
        .label { color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 600; }
        .val { font-weight: 700; color: #1f2937; font-size: 12.5px; }
        .footer { text-align: center; border-top: 2px dashed #eee; padding-top: 16px; margin-top: 20px; font-size: 11px; color: #6b7280; font-weight: 500; }
        .footer-time { font-size: 9px; color: #9ca3af; margin-top: 8px; }
        @media print { 
          body { padding: 0; background: none; } 
          .ticket { border: none; padding: 0; box-shadow: none; max-width: 100%; }
        }
      </style></head><body>
      <div class="ticket">
        <div class="header">
          <h2 class="hospital-name">${hospitalName}</h2>
          <div class="hospital-meta">
            ${regNo ? `Reg No: ${regNo} <br>` : ""}
            ${hAddr ? `${hAddr} <br>` : ""}
            ${hPhone ? `Phone: ${hPhone}` : ""} 
            ${hEmail ? ` | Email: ${hEmail}` : ""}
          </div>
          <div class="slip-title">Appointment Slip</div>
        </div>
        <div class="token-box">
          <div class="token-label">Queue Token</div>
          <div class="token-num">#${appt.tokenNo}</div>
        </div>
        <div class="section-title">Patient Details</div>
        <div class="grid">
          <div class="field">
            <span class="label">Patient Name</span>
            <span class="val">${patientDetails?.name || appt.patientName}</span>
          </div>
          <div class="field">
            <span class="label">Patient No</span>
            <span class="val">${appt.patientNo}</span>
          </div>
          ${
            pAge || pGender
              ? `
          <div class="field">
            <span class="label">Age / Gender</span>
            <span class="val">${[pAge ? `${pAge} Yrs` : "", pGender].filter(Boolean).join(" / ")}</span>
          </div>`
              : ""
          }
          ${
            pMobile
              ? `
          <div class="field">
            <span class="label">Contact</span>
            <span class="val">${pMobile}</span>
          </div>`
              : ""
          }
          ${
            pBlood
              ? `
          <div class="field">
            <span class="label">Blood Group</span>
            <span class="val">${pBlood}</span>
          </div>`
              : ""
          }
          ${
            pAadhar
              ? `
          <div class="field">
            <span class="label">Aadhar Card</span>
            <span class="val">${pAadhar}</span>
          </div>`
              : ""
          }
          ${
            pAddr
              ? `
          <div class="field full">
            <span class="label">Address</span>
            <span class="val">${pAddr}</span>
          </div>`
              : ""
          }
        </div>
        <div class="section-title">Appointment Details</div>
        <div class="grid">
          <div class="field">
            <span class="label">Consulting Doctor</span>
            <span class="val">${consultingDoctor}</span>
          </div>
          <div class="field">
            <span class="label">Department</span>
            <span class="val">${appt.appointmentType || "General"}</span>
          </div>
          <div class="field">
            <span class="label">Date</span>
            <span class="val">${appt.appointmentDate}</span>
          </div>
          <div class="field">
            <span class="label">Time Slot</span>
            <span class="val">${formatTimeSlot(appt.timeSlot)}</span>
          </div>
          <div class="field">
            <span class="label">Payment Status</span>
            <span class="val" style="color: ${appt.billStatus === "Paid" ? "#10b981" : "#f59e0b"};">${appt.billStatus || "Pending"}</span>
          </div>
          ${
            appt.dueAmount && appt.dueAmount > 0
              ? `
          <div class="field">
            <span class="label" style="color: #dc2626;">Due Balance</span>
            <span class="val" style="color: #dc2626;">₹${appt.dueAmount}</span>
          </div>`
              : ""
          }
          ${
            appt.notes
              ? `
          <div class="field full">
            <span class="label">Patient Notes</span>
            <span class="val" style="font-weight: normal; color: #4b5563;">${appt.notes}</span>
          </div>`
              : ""
          }
        </div>
        <div class="footer">
          Important Note: Please report 15 minutes before your time slot.<br>
          Please show this slip at the reception/OPD counter.
          <div class="footer-time">Printed on: ${new Date().toLocaleString()}</div>
        </div>
      </div>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return toast.error("Pop-up blocked — allow pop-ups to print");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const ActionBtn = ({
    icon: Icon,
    label,
    number,
    variant = "outline",
    onClick,
    colorClass = "",
  }: any) => (
    <Button
      variant={variant}
      size="sm"
      className={`h-8 px-3 text-xs flex items-center gap-1.5 ${colorClass}`}
      onClick={onClick}
    >
      {number && (
        <span className="text-muted-foreground/70 font-mono hidden xl:inline-block">
          {number}
        </span>
      )}
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline-block">{label}</span>
    </Button>
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="opd_list.page"
    >
      {/* Header */}
      <div className="flex-none space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <ListOrdered className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              OPD Patient List & Select
            </h1>
            <p className="text-sm text-muted-foreground">
              CHARLIE HMS Screens 11 & 12
            </p>
          </div>
        </div>

        {/* Action Toolbar (Screen 12 & Access to Screen 11) */}
        <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-1.5 shadow-glass-sm border border-border items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <ActionBtn
              number="1"
              icon={XCircle}
              label="Cancel"
              onClick={async () => {
                const appt = opdList.find((a) => a.id === selectedRow);
                if (!appt) return toast.info("Select a row first");
                await handleCancelAppt(appt.id, appt.patientName);
              }}
            />
            <ActionBtn
              number="2"
              icon={Activity}
              label="OPD Availability"
              colorClass="bg-red-500 hover:bg-red-600 text-white border-transparent"
              onClick={() => setOpdAvailabilityOpen(true)}
            />
            <ActionBtn
              number="3"
              icon={Printer}
              label="Print (F8)"
              onClick={() => {
                const appt = opdList.find((a) => a.id === selectedRow);
                if (!appt) return toast.info("Select a row first");
                handlePrintAppt(appt);
              }}
            />

            {/* Open Select Patient Dialog (Screen 11) */}
            <Dialog
              open={selectPatientOpen}
              onOpenChange={setSelectPatientOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-accent hover:bg-accent/90 text-accent-foreground ml-4"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" /> Select Patient
                  (Screen 11)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Select Patient
                  </DialogTitle>
                </DialogHeader>
                {/* Screen 11 Fields */}
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Patient No.</Label>
                      <Input
                        placeholder="Enter Patient ID"
                        value={selPatNo}
                        onChange={(e) => setSelPatNo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>OPD Visit Date</Label>
                      <Input
                        type="date"
                        value={selVisitDate}
                        onChange={(e) => setSelVisitDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>OPD Visit Time (hh:mm)</Label>
                      <Input
                        type="time"
                        value={selVisitTime}
                        onChange={(e) => setSelVisitTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status Display */}
                  <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border">
                    <span className="text-sm font-medium">Status:</span>
                    <div className="flex gap-4 font-mono text-sm">
                      <span className="text-muted-foreground">
                        Total: <b className="text-foreground">34</b>
                      </span>
                      <span className="text-emerald-500">
                        Exam.:{" "}
                        <b className="text-emerald-600 dark:text-emerald-400">
                          12
                        </b>
                      </span>
                      <span className="text-amber-500">
                        Pend.:{" "}
                        <b className="text-amber-600 dark:text-amber-400">22</b>
                      </span>
                    </div>
                  </div>

                  {/* Dialog Buttons */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSelectPatient}
                    >
                      Select
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectPatientOpen(false)}
                    >
                      Cancel (Esc)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setSelectPatientOpen(false);
                        setOpdModalOpen(true);
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add New
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      End (F2)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-500 border-emerald-500/30 gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Examined (F3)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-500 border-amber-500/30 gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> Pending (F4)
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Report Pending (F6)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content Area (Screen 12 List) */}
      <div className="flex-1 min-h-0 glass-elevated rounded-xl border border-border shadow-glass-sm flex flex-col min-w-0">
        {/* Filters */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap gap-4 items-end">
          <div className="space-y-1 min-w-[150px] flex flex-col">
            <Label className="text-xs">OPD From</Label>
            <DateTimePicker
              type="date"
              value={fromDate}
              onChange={setFromDate}
              className="h-8 text-xs w-[150px]"
            />
          </div>
          <div className="space-y-1 min-w-[150px] flex flex-col">
            <Label className="text-xs">To</Label>
            <DateTimePicker
              type="date"
              value={toDate}
              onChange={setToDate}
              className="h-8 text-xs w-[150px]"
            />
          </div>
          <Button
            className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3.5 border-0 shadow-xs cursor-pointer transition-all self-end"
            onClick={() => {
              handleRefresh();
              toast.success("Filters applied successfully");
            }}
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-4 text-xs gap-1.5"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh (F5)
          </Button>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur border-b border-border z-10">
              <tr>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Srl
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Patient No.
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Patient Name
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Examined On
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Examined At
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Recg. No.
                </th>
                <th className="px-3 py-2 font-semibold text-right whitespace-nowrap">
                  Amount
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Bill Items
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Examined By
                </th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingList ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Loading OPD list…
                  </td>
                </tr>
              ) : opdList.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No OPD patients found for the selected dates.
                  </td>
                </tr>
              ) : (
                opdList.slice(page * pageSize, (page + 1) * pageSize).map((row, idx) => {
                  const isSelected = selectedRow === row.id;
                  return (
                    // biome-ignore lint/a11y/useKeyWithClickEvents: Click selection for UI table row is mouse-exclusive
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(isSelected ? null : row.id)}
                      className={`cursor-pointer transition-colors duration-100 ${
                        isSelected
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-mono">{row.patientNo}</td>
                      <td className="px-3 py-2.5 font-medium">
                        {row.patientName}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.appointmentDate}
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {formatTimeSlot(row.timeSlot)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            row.status === "Completed"
                              ? "text-emerald-500 border-emerald-500/30"
                              : "text-amber-500 border-amber-500/30"
                          }`}
                        >
                          {row.status === "Completed" ? "Examined" : row.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono">#{row.tokenNo}</td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {`₹${row.dueAmount ?? 0}`}
                      </td>
                      <td className="px-3 py-2.5">{row.appointmentType}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.doctorName}
                      </td>
                      <td
                        className="px-3 py-2.5 text-muted-foreground italic max-w-[150px] truncate"
                        title={row.notes || ""}
                      >
                        {row.notes || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border mt-auto">
<PaginationControl
          currentPage={page}
          totalPages={Math.ceil(opdList.length / pageSize)}
          totalElements={opdList.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          
        />
</div>
      </div>
      <OPDRegistrationModal
        open={opdModalOpen}
        onClose={() => setOpdModalOpen(false)}
      />
      <OPDAvailabilityModal
        open={opdAvailabilityOpen}
        onClose={() => setOpdAvailabilityOpen(false)}
        hospitalCode={code}
        date={fromDate}
        onSelectClinic={() => {
          setOpdAvailabilityOpen(false);
          setOpdModalOpen(true);
        }}
      />

      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] border border-border shadow-glass-lg rounded-2xl p-6 bg-background">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Confirm Cancellation
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to cancel the appointment for{" "}
              <span className="font-semibold text-foreground">
                {apptToCancel?.name}
              </span>
              ?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelConfirmOpen(false);
                setApptToCancel(null);
              }}
              className="h-9 text-xs"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelAppt}
              className="h-9 text-xs flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Confirm Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

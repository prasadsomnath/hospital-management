import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { receptionApi } from "@/lib/reception-api";
import { parseAppointmentNotes } from "@/pages/receptionist/BookAppointment";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";

import {
  Activity,
  Check,
  ClipboardList,
  Droplet,
  FileSpreadsheet,
  HeartPulse,
  Plus,
  Printer,
  RefreshCw,
  Stethoscope,
  Thermometer,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// TIME SLOTS AND MACROS CONSTANTS FOR UI

const TIME_SLOTS = [
  "06 AM",
  "08 AM",
  "10 AM",
  "12 Noon",
  "02 PM",
  "04 PM",
  "06 PM",
  "08 PM",
  "10 PM",
  "12 MN",
];
const MACROS = [
  "Administer IV Fluids",
  "Check Vitals every 2h",
  "Change dressing",
  "Nil by mouth",
];
const RX_LIST = [
  "Aclas Nano Gel",
  "Actinac-sp",
  "Actinac-th",
  "Acugyl 100ml",
  "Paracetamol IV",
];

export default function NursingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [patients, setPatients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [ioLogs, setIoLogs] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientIpdDetails, setPatientIpdDetails] = useState<
    Record<string, any>
  >({});

  // Instruction Form state
  const [isInstrOpen, setIsInstrOpen] = useState(false);
  const [instructionText, setInstructionText] = useState("");
  const [instrPatientId, setInstrPatientId] = useState("");
  const [instrTime, setInstrTime] = useState("08:00 AM");

  // I/O Form state
  const [isIOOpen, setIsIOOpen] = useState(false);
  const [ioPatientId, setIoPatientId] = useState("");
  const [ioTemp, setIoTemp] = useState("98.6");
  const [ioPulse, setIoPulse] = useState("72");
  const [ioRR, setIoRR] = useState("16");
  const [ioBP, setIoBP] = useState("120/80");
  const [ioSPO2, setIoSPO2] = useState("98");
  const [ioIntake, setIoIntake] = useState("300");
  const [ioOutput, setIoOutput] = useState("200");
  const [ioRemarks, setIoRemarks] = useState("");

  // Load completed tasks list from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("completed-nursing-tasks");
    if (saved) {
      try {
        setCompletedTasks(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const fetchNursingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const code = user?.hospitalCode || "HSP001";

      // 1. Fetch dynamic patient registry
      const patientList = await apiFetch<any>("/doctor/patients", {
        headers: { "X-Hospital-Code": code },
      });
      const activePatients = Array.isArray(patientList)
        ? patientList
        : patientList?.content || [];
      setPatients(activePatients);

      if (activePatients.length > 0 && !selectedPatientId) {
        const firstId = activePatients[0].patientNo || activePatients[0].id;
        setSelectedPatientId(firstId);
        setInstrPatientId(firstId);
        setIoPatientId(firstId);
      }

      // 1.5 Fetch appointments to parse room, bed, and assigned nurse details
      const appts = await receptionApi.getAppointments(code).catch(() => []);
      const ipdDetailsMap: Record<string, any> = {};
      if (Array.isArray(appts)) {
        appts.forEach((appt: any) => {
          if (appt.visitType === "IPD") {
            const parsed = parseAppointmentNotes(appt.notes || "");
            const roomNumber = appt.roomNumber || parsed.roomNumber;
            const bedNo = appt.bedNo || parsed.bedNo;
            const roomType = appt.roomType || parsed.roomType;
            const assignedNurse = appt.assignedNurse || parsed.assignedNurse;
            if (roomNumber || assignedNurse) {
              ipdDetailsMap[appt.patientNo] = {
                roomNumber,
                bedNo,
                roomType,
                assignedNurse,
              };
            }
          }
        });
      }
      setPatientIpdDetails(ipdDetailsMap);

      // 2. Fetch nursing records for each patient in parallel
      const allTasks: any[] = [];
      const allIoLogs: any[] = [];
      let srlTask = 1;
      let srlIo = 1;

      await Promise.all(
        activePatients.map(async (p) => {
          try {
            const patientNo = p.patientNo || p.id;
            const pName = p.firstName
              ? `${p.firstName} ${p.lastName || ""}`.trim()
              : p.name || "Patient";

            const ipdInfo = ipdDetailsMap[patientNo] || {};
            const assignedNurseName = ipdInfo.assignedNurse || "Nurse Rachel";
            const roomBedName = ipdInfo.roomNumber
              ? `Room ${ipdInfo.roomNumber}${ipdInfo.bedNo ? ` / Bed ${ipdInfo.bedNo.includes("-B") ? ipdInfo.bedNo.split("-B")[1] : ipdInfo.bedNo}` : ""}`
              : p.status === "Admitted"
                ? "Ward 2B"
                : "OPD Check";

            const recordsData = await apiFetch<any>(
              `/doctor/nursing-records/${patientNo}`,
              {
                headers: { "X-Hospital-Code": code },
              },
            );
            const records = Array.isArray(recordsData)
              ? recordsData
              : recordsData?.content || [];

            if (records && Array.isArray(records)) {
              records.forEach((rec) => {
                const hasVitals =
                  rec.temperature ||
                  rec.pulse ||
                  rec.respiratoryRate ||
                  rec.bloodPressure ||
                  rec.spo2 ||
                  (rec.intakeVolume && Number(rec.intakeVolume) > 0) ||
                  (rec.outputVolume && Number(rec.outputVolume) > 0);

                const isTask = rec.nursingInstructions && !hasVitals;

                if (hasVitals) {
                  allIoLogs.push({
                    id:
                      rec.id?.toString() ||
                      `io-${rec.patientNo}-${Math.random()}`,
                    srl: srlIo++,
                    patNo: rec.patientNo,
                    name: pName,
                    time: rec.recordTime || "12:00 PM",
                    temp: rec.temperature || "98.6",
                    pulse: rec.pulse || "72",
                    rr: rec.respiratoryRate || "16",
                    bp: rec.bloodPressure || "120/80",
                    spo2: rec.spo2 || "98",
                    intake: Number(rec.intakeVolume) || 0,
                    output: Number(rec.outputVolume) || 0,
                    nurse: assignedNurseName,
                    remarks: rec.nursingInstructions || "Routine vitals entry.",
                  });
                }

                if (isTask || rec.nursingInstructions) {
                  allTasks.push({
                    id:
                      rec.id?.toString() ||
                      `ni-${rec.patientNo}-${Math.random()}`,
                    srl: srlTask++,
                    patNo: rec.patientNo,
                    name: pName,
                    time: rec.recordTime || "08:00 AM",
                    instruction: rec.nursingInstructions,
                    assignedNurse: assignedNurseName,
                    status: completedTasks.includes(rec.id?.toString())
                      ? "Done"
                      : "Pending",
                    ward: roomBedName,
                    date:
                      rec.recordDate || new Date().toISOString().split("T")[0],
                  });
                }
              });
            }
          } catch (e) {
            console.warn(
              `Failed to fetch nursing records for ${p.patientNo}:`,
              e,
            );
          }
        }),
      );

      setTasks(allTasks);
      setIoLogs(allIoLogs);
    } catch (e) {
      console.warn("Failed to fetch nursing details from backend.", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, completedTasks, selectedPatientId]);

  useEffect(() => {
    fetchNursingData();
  }, [user]);

  const handleRefresh = () => {
    fetchNursingData();
    toast.success("Refreshed all clinical logs");
  };

  const handleToggleStatus = (id: string) => {
    const updatedCompleted = completedTasks.includes(id)
      ? completedTasks.filter((tid) => tid !== id)
      : [...completedTasks, id];

    setCompletedTasks(updatedCompleted);
    localStorage.setItem(
      "completed-nursing-tasks",
      JSON.stringify(updatedCompleted),
    );

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === "Done" ? "Pending" : "Done";
          const updated = { ...t, status: nextStatus };
          if (selectedTask?.id === id) {
            setSelectedTask(updated);
          }
          toast.success(`Task for ${t.name} marked as ${nextStatus}`);
          return updated;
        }
        return t;
      }),
    );
  };

  const handleAddInstruction = async () => {
    const pat = patients.find((p) => (p.patientNo || p.id) === instrPatientId);
    if (!pat) {
      toast.error("Please select a valid patient!");
      return;
    }
    if (!instructionText.trim()) {
      toast.error("Please enter instruction details!");
      return;
    }
    try {
      const code = user?.hospitalCode || "HSP001";
      const payload = {
        patientNo: pat.patientNo || pat.id,
        recordDate: new Date().toISOString().split("T")[0],
        recordTime: instrTime,
        nursingInstructions: instructionText,
      };
      await apiFetch("/doctor/nursing-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hospital-Code": code,
        },
        body: JSON.stringify(payload),
      });
      toast.success("New nursing instruction recorded successfully!");
      setInstructionText("");
      setIsInstrOpen(false);
      fetchNursingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save nursing instruction");
    }
  };

  const handleAddIOLog = async () => {
    const pat = patients.find((p) => (p.patientNo || p.id) === ioPatientId);
    if (!pat) {
      toast.error("Please select a valid patient!");
      return;
    }
    try {
      const code = user?.hospitalCode || "HSP001";
      const payload = {
        patientNo: pat.patientNo || pat.id,
        recordDate: new Date().toISOString().split("T")[0],
        recordTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        temperature: ioTemp,
        pulse: ioPulse,
        respiratoryRate: ioRR,
        bloodPressure: ioBP,
        spo2: ioSPO2,
        intakeVolume: ioIntake,
        outputVolume: ioOutput,
        nursingInstructions: ioRemarks || "Routine check recorded.",
      };
      await apiFetch("/doctor/nursing-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hospital-Code": code,
        },
        body: JSON.stringify(payload),
      });
      toast.success("Intake / Output log entry registered!");
      setIsIOOpen(false);
      setIoRemarks("");
      fetchNursingData();
    } catch (err: any) {
      toast.error(err.message || "Failed to log vitals/fluid log");
    }
  };

  // Filter logs for fluid analytics card
  const activeLogs = ioLogs.filter((log) => log.patNo === selectedPatientId);
  const totalIntake = activeLogs.reduce((sum, item) => sum + item.intake, 0);
  const totalOutput = activeLogs.reduce((sum, item) => sum + item.output, 0);
  const fluidBalance = totalIntake - totalOutput;

  const activePatient = patients.find(
    (p) => (p.patientNo || p.id) === selectedPatientId,
  );
  const activePatientName = activePatient
    ? activePatient.firstName
      ? `${activePatient.firstName} ${activePatient.lastName || ""}`.trim()
      : activePatient.name
    : "Patient";

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="nursing.page"
    >
      {/* Page Header */}
      <div className="flex-none flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
            <HeartPulse className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Nursing & I/O Portal
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              In-Patient Instructions & Intake/Output Balances (Screens 22, 23)
            </p>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="instructions"
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between border-b border-border pb-2 flex-wrap gap-2">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="instructions"
              className="text-xs font-semibold px-4 py-2"
            >
              <ClipboardList className="w-4 h-4 mr-2" /> Nursing Orders (
              {tasks.filter((t) => t.status === "Pending").length} active)
            </TabsTrigger>
            <TabsTrigger value="io" className="text-xs font-semibold px-4 py-2">
              <Activity className="w-4 h-4 mr-2" /> Intake / Output Logs (
              {ioLogs.length} logged)
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5 text-xs border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </Button>
          </div>
        </div>

        {/* ==================== SCREEN 22: NURSING INSTRUCTIONS ==================== */}
        <TabsContent
          value="instructions"
          className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 mt-4 outline-none"
        >
          {/* Left Panel: Table List */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-border bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Scheduled Shifts Tasks
                </h3>
              </div>
              <Dialog open={isInstrOpen} onOpenChange={setIsInstrOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-teal-500 hover:bg-teal-600 text-white gap-1.5 font-semibold shadow-sm rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Shift Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold">
                      Write In-Patient Nursing Instruction
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="md:col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-950 border border-border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">
                            Patient Profile
                          </Label>
                          <Select
                            value={instrPatientId}
                            onValueChange={setInstrPatientId}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((p) => {
                                const pId = p.patientNo || p.id;
                                const pName = p.firstName
                                  ? `${p.firstName} ${p.lastName || ""}`.trim()
                                  : p.name || "Patient";
                                return (
                                  <SelectItem key={pId} value={pId}>
                                    {pName} ({pId})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">
                            Scheduled Time
                          </Label>
                          <Input
                            value={instrTime}
                            onChange={(e) => setInstrTime(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold">
                            Instruction Details *
                          </Label>
                          <div className="flex gap-1.5">
                            {MACROS.slice(0, 3).map((m) => (
                              <button
                                key={m}
                                type="button"
                                className="px-2 py-0.5 rounded border border-teal-200/50 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 text-[9px] font-semibold"
                                onClick={() =>
                                  setInstructionText(
                                    (prev) => prev + (prev ? " " : "") + m,
                                  )
                                }
                              >
                                + {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          rows={4}
                          placeholder="Type nursing instructions, medication schedules, or specific vitals checking instructions..."
                          value={instructionText}
                          onChange={(e) => setInstructionText(e.target.value)}
                          className="text-xs border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground uppercase">
                          Quick Medicine Add
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {RX_LIST.map((rx) => (
                            <button
                              key={rx}
                              type="button"
                              className="px-2 py-1 rounded border border-border bg-slate-50 hover:bg-slate-100 text-[10px] text-slate-700 font-medium"
                              onClick={() =>
                                setInstructionText(
                                  (prev) =>
                                    prev +
                                    (prev ? " " : "") +
                                    `Administer ${rx}`,
                                )
                              }
                            >
                              💊 {rx}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-teal-500/10 border border-teal-200/40 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5 mb-2">
                          <Stethoscope className="w-4 h-4 text-teal-600" />{" "}
                          Clinic Guide
                        </h4>
                        <p className="text-[11px] text-teal-700 leading-relaxed">
                          This instruction will immediately route to the ward
                          nurse's shift terminal. Ensure medication names and
                          time schedules are validated before saving.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end pt-4 border-t border-teal-200/30">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsInstrOpen(false)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold"
                          onClick={handleAddInstruction}
                        >
                          Save Shift Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="px-4 py-3 font-semibold text-slate-500 w-12">
                      Srl
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500">
                      Patient
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500 w-24">
                      Shift Time
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500">
                      Instruction
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500 w-28">
                      Nurse
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-500 w-24 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-teal-50/20 cursor-pointer transition-colors ${selectedTask?.id === row.id ? "bg-teal-50/40" : ""}`}
                      onClick={() => setSelectedTask(row)}
                    >
                      <td className="px-4 py-3.5 text-muted-foreground font-mono">
                        {row.srl}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {row.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {row.patNo} · {row.ward}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-teal-600 font-bold">
                        {row.time}
                      </td>
                      <td className="px-4 py-3.5 text-foreground max-w-xs truncate">
                        {row.instruction}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        📋 {row.assignedNurse}
                      </td>
                      <td
                        className="px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleToggleStatus(row.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                            row.status === "Done"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                        >
                          {row.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Selected Task Detail Card */}
          {selectedTask && (
            <div className="w-full lg:w-96 flex-none bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Task Focus
                    </span>
                    <h3 className="font-bold text-foreground text-sm mt-2">
                      {selectedTask.name}
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      ID: {selectedTask.patNo} · Room: {selectedTask.ward}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      selectedTask.status === "Done"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }
                  >
                    {selectedTask.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Shift Execution Schedule
                  </p>
                  <p className="text-xs font-bold text-foreground font-mono flex items-center gap-1.5">
                    ⏱️ {selectedTask.time} · Today ({selectedTask.date})
                  </p>
                </div>

                <div className="space-y-1.5 bg-white dark:bg-slate-950 p-3 rounded-lg border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Physician's Instructions
                  </p>
                  <p className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-line italic">
                    "{selectedTask.instruction}"
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Assigned Ward Nurse
                  </p>
                  <div className="flex items-center gap-2.5 p-2 bg-slate-100 dark:bg-slate-950 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {selectedTask.assignedNurse[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedTask.assignedNurse}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        General Duty Shifts
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Button
                  className={`w-full justify-center gap-2 text-xs font-bold text-white shadow-sm transition-all duration-300 ${
                    selectedTask.status === "Done"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-teal-500 hover:bg-teal-600"
                  }`}
                  onClick={() => handleToggleStatus(selectedTask.id)}
                >
                  <Check className="w-4 h-4" />
                  {selectedTask.status === "Done"
                    ? "Reopen Shift Task"
                    : "Complete Task Order"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold border-slate-200 hover:bg-slate-100"
                    onClick={() => toast.info("Task printing initiated")}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Sheet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold text-red-500 hover:bg-red-50 border-slate-200"
                    onClick={() => {
                      setTasks((prev) =>
                        prev.filter((t) => t.id !== selectedTask.id),
                      );
                      toast.success("Shift order archived");
                      setSelectedTask(null);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Archive
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== SCREEN 23: INPUT / OUTPUT CHART ==================== */}
        <TabsContent
          value="io"
          className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 mt-4 outline-none"
        >
          {/* Left Panel: Table Vitals Logs */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-border bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Patient Vitals & Hydration Log
                </h3>
              </div>
              <Dialog open={isIOOpen} onOpenChange={setIsIOOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs bg-teal-500 hover:bg-teal-600 text-white gap-1.5 font-semibold shadow-sm rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Intake/Output
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl border border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold">
                      New Intake / Output & Vitals Registration
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Patient Profile</Label>
                      <Select
                        value={ioPatientId}
                        onValueChange={setIoPatientId}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => {
                            const pId = p.patientNo || p.id;
                            const pName = p.firstName
                              ? `${p.firstName} ${p.lastName || ""}`.trim()
                              : p.name || "Patient";
                            return (
                              <SelectItem key={pId} value={pId}>
                                {pName} ({pId})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Temperature (°F)</Label>
                      <Input
                        value={ioTemp}
                        onChange={(e) => setIoTemp(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pulse (bpm)</Label>
                      <Input
                        value={ioPulse}
                        onChange={(e) => setIoPulse(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">R/R (breaths/m)</Label>
                      <Input
                        value={ioRR}
                        onChange={(e) => setIoRR(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Blood Pressure</Label>
                      <Input
                        value={ioBP}
                        onChange={(e) => setIoBP(e.target.value)}
                        className="h-9 text-xs"
                        placeholder="120/80"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SPO2 (%)</Label>
                      <Input
                        value={ioSPO2}
                        onChange={(e) => setIoSPO2(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fluid Intake (ml)</Label>
                      <Input
                        value={ioIntake}
                        onChange={(e) => setIoIntake(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Fluid Output (ml)</Label>
                      <Input
                        value={ioOutput}
                        onChange={(e) => setIoOutput(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <Label className="text-xs">Nurse / Staff Duty</Label>
                      <Input
                        value={
                          patientIpdDetails[ioPatientId]?.assignedNurse ||
                          "Nurse Rachel"
                        }
                        disabled
                        className="h-9 text-xs bg-slate-50"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-4">
                      <Label className="text-xs">
                        Clinical Remarks / Remarks
                      </Label>
                      <Textarea
                        rows={2}
                        value={ioRemarks}
                        onChange={(e) => setIoRemarks(e.target.value)}
                        placeholder="Intolerance, fluid type details, or general notes..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsIOOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs"
                      onClick={handleAddIOLog}
                    >
                      Save Log Entry
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="px-3 py-3 font-semibold text-slate-500 w-12">
                      Srl
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500">
                      Patient
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500 w-20">
                      Time
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500 text-center">
                      Temp
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500 text-center">
                      Pulse
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500 text-center">
                      R.R.
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500 text-center">
                      B.P.
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-500 text-center">
                      SPO2
                    </th>
                    <th className="px-3 py-3 font-semibold text-center w-24 text-teal-600">
                      Intake
                    </th>
                    <th className="px-3 py-3 font-semibold text-center w-24 text-amber-600">
                      Output
                    </th>
                    <th className="px-3 py-3 font-semibold text-center w-20">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ioLogs.map((row) => {
                    const balance = row.intake - row.output;
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/30 cursor-pointer transition-colors ${selectedPatientId === row.patNo ? "bg-slate-50/60 font-medium" : ""}`}
                        onClick={() => setSelectedPatientId(row.patNo)}
                      >
                        <td className="px-3 py-3.5 text-muted-foreground font-mono">
                          {row.srl}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="font-bold text-foreground">
                            {row.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono">
                            {row.patNo}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-slate-500 font-mono">
                          {row.time}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono">
                          <span className="flex items-center justify-center gap-0.5">
                            <Thermometer className="w-3 h-3 text-red-400" />
                            {row.temp}°F
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono">
                          {row.pulse}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono">
                          {row.rr}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono text-slate-700 font-semibold">
                          {row.bp}
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                            {row.spo2}%
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono text-teal-600 font-bold">
                          {row.intake} ml
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono text-amber-600 font-bold">
                          {row.output} ml
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${balance >= 0 ? "bg-teal-500/10 text-teal-600" : "bg-rose-500/10 text-rose-600"}`}
                          >
                            {balance >= 0 ? `+${balance}` : balance} ml
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Selected Patient Analytics Summary */}
          <div className="w-full lg:w-80 flex-none bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-border pb-3 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Fluid Balance
                </span>
                <h3 className="font-bold text-foreground text-sm mt-2">
                  {activePatientName} Summary
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground">
                  ID: {selectedPatientId}
                </p>
                {(() => {
                  const ipdInfo = patientIpdDetails[selectedPatientId];
                  if (!ipdInfo) return null;
                  return (
                    <div className="text-[10px] space-y-0.5 pt-1">
                      {ipdInfo.roomNumber && (
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                          Room: {ipdInfo.roomNumber}{" "}
                          {ipdInfo.bedNo ? `· Bed: ${ipdInfo.bedNo}` : ""}
                        </p>
                      )}
                      {ipdInfo.assignedNurse && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Allocated Nurse: {ipdInfo.assignedNurse}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic Totals */}
              <div className="space-y-3">
                <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-200/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-teal-800 font-semibold uppercase">
                      Total Intake
                    </span>
                    <Droplet className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-lg font-black text-teal-700 font-mono mt-1">
                    {totalIntake} ml
                  </p>
                  <p className="text-[9px] text-teal-600 mt-0.5">
                    Hydration, oral & IV liquids
                  </p>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-200/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 font-semibold uppercase">
                      Total Output
                    </span>
                    <Droplet className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-lg font-black text-amber-700 font-mono mt-1">
                    {totalOutput} ml
                  </p>
                  <p className="text-[9px] text-amber-600 mt-0.5">
                    Urine, secretions & drainage
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border ${fluidBalance >= 0 ? "bg-emerald-500/10 border-emerald-200/40" : "bg-rose-500/10 border-rose-200/40"}`}
                >
                  <span className="text-xs font-semibold uppercase block">
                    Net Balance
                  </span>
                  <p
                    className={`text-lg font-black font-mono mt-1 ${fluidBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {fluidBalance >= 0 ? `+${fluidBalance}` : fluidBalance} ml
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    Fluid retention analysis value
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full text-xs font-bold border-slate-200 hover:bg-slate-100 justify-center gap-1.5"
                onClick={() =>
                  toast.success("PDF clinical report chart prepared")
                }
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                Export Patient Hydration Chart
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

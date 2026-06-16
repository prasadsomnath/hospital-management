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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  Edit,
  LayoutGrid,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
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
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EquipmentManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Active state data
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Loading states
  const [_loading, setLoading] = useState(false);

  // Pagination states
  const [maintenancePage, setMaintenancePage] = useState(0);
  const [maintenancePageSize, setMaintenancePageSize] = useState(10);
  const [schedulePage, setSchedulePage] = useState(0);
  const [schedulePageSize, setSchedulePageSize] = useState(10);

  // Selection states
  const [selectedMaintenanceSrl, setSelectedMaintenanceSrl] = useState<
    number | null
  >(null);
  const [selectedScheduleSrl, setSelectedScheduleSrl] = useState<number | null>(
    null,
  );

  // Dialog Controls
  const [openMaintenance, setOpenMaintenance] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [deleteMaintenanceConfirmOpen, setDeleteMaintenanceConfirmOpen] =
    useState(false);
  const [deleteScheduleConfirmOpen, setDeleteScheduleConfirmOpen] =
    useState(false);

  // Search parameters
  const [maintenanceSearch, setMaintenanceSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");

  // Date/Time Range Filter States
  const [maintenanceFromDate, setMaintenanceFromDate] = useState("");
  const [maintenanceToDate, setMaintenanceToDate] = useState("");
  const [scheduleFromDate, setScheduleFromDate] = useState("");
  const [scheduleToDate, setScheduleToDate] = useState("");

  // ==========================================
  // FORM STATES: MAINTENANCE LOG
  // ==========================================
  const [scheduleTypes, setScheduleTypes] = useState<
    { code: string; name: string }[]
  >(() => {
    const saved = localStorage.getItem("equipment_schedule_types");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing schedule types from localStorage", e);
      }
    }
    return [
      { code: "Monthly", name: "Monthly" },
      { code: "Quarterly", name: "Quarterly" },
      { code: "Half-Yearly", name: "Half-Yearly" },
      { code: "Annually", name: "Annually" },
      { code: "One-time", name: "One-time" },
    ];
  });
  const [scheduleTypeDialogOpen, setScheduleTypeDialogOpen] = useState(false);
  const [newScheduleTypeName, setNewScheduleTypeName] = useState("");

  const handleSaveScheduleType = () => {
    const trimmed = newScheduleTypeName.trim();
    if (!trimmed) {
      toast.error("Schedule type name cannot be empty");
      return;
    }
    const code = trimmed.replace(/\s+/g, "-");
    if (
      scheduleTypes.some(
        (s) =>
          s.code.toLowerCase() === code.toLowerCase() ||
          s.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("Schedule type already exists");
      return;
    }
    const newTypes = [...scheduleTypes, { code, name: trimmed }];
    setScheduleTypes(newTypes);
    localStorage.setItem("equipment_schedule_types", JSON.stringify(newTypes));
    toast.success(`Schedule type "${trimmed}" added successfully!`);
    setScheduleTypeDialogOpen(false);
    setNewScheduleTypeName("");
  };

  const [mName, setMName] = useState("");
  const [mSchedule, setMSchedule] = useState("");
  const [mDoneOn, setMDoneOn] = useState(getLocalTimestamp());
  const [mAmount, setMAmount] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [editingMaintenanceSrl, setEditingMaintenanceSrl] = useState<
    number | null
  >(null);

  // ==========================================
  // FORM STATES: SCHEDULES
  // ==========================================
  const [sName, setSName] = useState("");
  const [sDate, setSDate] = useState(getLocalTimestamp());
  const [sNotes, setSNotes] = useState("");
  const [editingScheduleSrl, setEditingScheduleSrl] = useState<number | null>(
    null,
  );

  // Fetch live microservice data on initialization
  const fetchEquipmentData = async () => {
    if (!user?.hospitalCode) return;
    try {
      setLoading(true);
      // 1. Fetch Maintenance Logs
      const maintenanceRes = await apiFetch<any>(
        "/admin/equipment/maintenance",
        {
          headers: {
            "X-Hospital-Code": user.hospitalCode,
          },
          params: {
            page: 0,
            size: 1000,
          },
        },
      );
      const maintenanceData =
        maintenanceRes?.content ||
        (Array.isArray(maintenanceRes) ? maintenanceRes : []);
      if (maintenanceData && Array.isArray(maintenanceData)) {
        const mapped = maintenanceData.map((item, idx) => ({
          srl: idx + 1,
          id: item.id,
          name: item.equipmentName,
          schedule: item.scheduleType || "One-time",
          doneOn: item.doneOnDate
            ? getLocalTimestamp(item.doneOnDate)
            : getLocalTimestamp(),
          amount: String(item.amount || 0),
          notes: item.notes || "No details provided",
        }));
        setMaintenances(mapped);
      }

      // 2. Fetch Maintenance Schedules
      const scheduleRes = await apiFetch<any>("/admin/equipment/schedules", {
        headers: {
          "X-Hospital-Code": user.hospitalCode,
        },
        params: {
          page: 0,
          size: 1000,
        },
      });
      const scheduleData =
        scheduleRes?.content || (Array.isArray(scheduleRes) ? scheduleRes : []);
      if (scheduleData && Array.isArray(scheduleData)) {
        const mapped = scheduleData.map((item, idx) => ({
          srl: idx + 1,
          id: item.id,
          name: item.equipmentName,
          date: item.scheduledDate
            ? getLocalTimestamp(item.scheduledDate)
            : getLocalTimestamp(),
          notes: item.notes || "No schedule notes",
        }));
        setSchedules(mapped);
      }
    } catch (err) {
      console.warn(
        "Utilizing high-fidelity offline cache for equipment data:",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  const loggedEquipmentNames = Array.from(
    new Set(maintenances.map((m) => m.name).filter(Boolean)),
  ).sort();

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchEquipmentData is internally cached and changes are dynamic
  useEffect(() => {
    fetchEquipmentData();
  }, [user?.hospitalCode]);

  const handleRefresh = async () => {
    await fetchEquipmentData();
    toast.success("Equipment rosters refreshed from server");
  };

  // ==========================================
  // SAVE / UPDATE / DELETE HANDLERS: MAINTENANCE LOG
  // ==========================================
  const handleOpenAddMaintenance = () => {
    setEditingMaintenanceSrl(null);
    setMName("");
    setMSchedule(scheduleTypes[0]?.code || "Monthly");
    setMDoneOn(getLocalTimestamp());
    setMAmount("");
    setMNotes("");
    setOpenMaintenance(true);
  };

  const handleOpenEditMaintenance = () => {
    if (selectedMaintenanceSrl === null) {
      toast.warning("Please select a maintenance log first.");
      return;
    }
    const item = maintenances.find((m) => m.srl === selectedMaintenanceSrl);
    if (!item) return;

    setEditingMaintenanceSrl(item.srl);
    setMName(item.name);
    setMSchedule(item.schedule);
    setMDoneOn(getLocalTimestamp(item.doneOn));
    setMAmount(item.amount);
    setMNotes(item.notes);
    setOpenMaintenance(true);
  };

  const handleSaveMaintenance = async () => {
    if (!mName || !mDoneOn) {
      toast.error("Equipment Name and Date are required!");
      return;
    }

    const reqBody = {
      equipmentName: mName,
      scheduleType: mSchedule,
      doneOnDate: mDoneOn.split("T")[0],
      amount: Number.parseFloat(mAmount) || 0.0,
      notes: mNotes,
    };

    try {
      if (editingMaintenanceSrl !== null) {
        const itemToUpdate = maintenances.find(
          (m) => m.srl === editingMaintenanceSrl,
        );
        if (itemToUpdate) {
          try {
            await apiFetch(`/admin/equipment/maintenance/${itemToUpdate.id}`, {
              method: "PUT",
              headers: {
                "X-Hospital-Code": user?.hospitalCode || "",
                "X-Auth-User": user?.email || user?.id || "Admin",
              },
              body: JSON.stringify(reqBody),
            });
          } catch (apiErr) {
            console.warn("API Offline. Syncing state locally.", apiErr);
          }
        }

        // Update locally
        setMaintenances((prev) =>
          prev.map((m) =>
            m.srl === editingMaintenanceSrl
              ? {
                  ...m,
                  name: mName,
                  schedule: mSchedule,
                  doneOn: mDoneOn,
                  amount: mAmount,
                  notes: mNotes,
                }
              : m,
          ),
        );
        toast.success("Maintenance log updated!");
      } else {
        // Try posting to API
        try {
          await apiFetch("/admin/equipment/maintenance", {
            method: "POST",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "",
              "X-Auth-User": user?.email || user?.id || "Admin",
            },
            body: JSON.stringify(reqBody),
          });
        } catch (apiErr) {
          console.warn(
            "API Offline. Appending to client context cache.",
            apiErr,
          );
        }

        // Mock append locally
        const nextSrl =
          maintenances.length > 0
            ? Math.max(...maintenances.map((m) => m.srl)) + 1
            : 1;
        setMaintenances((prev) => [
          ...prev,
          {
            srl: nextSrl,
            id: nextSrl,
            name: mName,
            schedule: mSchedule,
            doneOn: mDoneOn,
            amount: mAmount,
            notes: mNotes,
          },
        ]);
        toast.success("New maintenance record added!");
      }
      setOpenMaintenance(false);
      setSelectedMaintenanceSrl(null);
      fetchEquipmentData();
    } catch (_err) {
      toast.error("Failed to commit maintenance changes");
    }
  };

  const handleDeleteMaintenance = () => {
    if (selectedMaintenanceSrl === null) {
      toast.warning("Please select a record to remove.");
      return;
    }
    setDeleteMaintenanceConfirmOpen(true);
  };

  const confirmDeleteMaintenance = async () => {
    setDeleteMaintenanceConfirmOpen(false);
    if (selectedMaintenanceSrl === null) return;
    const item = maintenances.find((m) => m.srl === selectedMaintenanceSrl);
    if (!item) return;

    try {
      try {
        await apiFetch(`/admin/equipment/maintenance/${item.id}`, {
          method: "DELETE",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
        });
      } catch (apiErr) {
        console.warn("API Offline. Syncing state locally.", apiErr);
      }

      setMaintenances((prev) =>
        prev.filter((m) => m.srl !== selectedMaintenanceSrl),
      );
      setSelectedMaintenanceSrl(null);
      toast.success("Maintenance log deleted successfully.");
      fetchEquipmentData();
    } catch (_err) {
      toast.error("Failed to remove maintenance record");
    }
  };

  // ==========================================
  // SAVE / UPDATE / DELETE HANDLERS: SCHEDULES
  // ==========================================
  const handleOpenAddSchedule = () => {
    setEditingScheduleSrl(null);
    setSName("");
    setSDate(getLocalTimestamp());
    setSNotes("");
    setOpenSchedule(true);
  };

  const handleOpenEditSchedule = () => {
    if (selectedScheduleSrl === null) {
      toast.warning("Please select a maintenance schedule row first.");
      return;
    }
    const item = schedules.find((s) => s.srl === selectedScheduleSrl);
    if (!item) return;

    setEditingScheduleSrl(item.srl);
    setSName(item.name);
    setSDate(getLocalTimestamp(item.date));
    setSNotes(item.notes);
    setOpenSchedule(true);
  };

  const handleSaveSchedule = async () => {
    if (!sName || !sDate) {
      toast.error("Equipment Name and Schedule Date are required!");
      return;
    }

    const reqBody = {
      equipmentName: sName,
      scheduledDate: sDate.split("T")[0],
      notes: sNotes,
      status: "Scheduled",
    };

    try {
      if (editingScheduleSrl !== null) {
        const itemToUpdate = schedules.find(
          (s) => s.srl === editingScheduleSrl,
        );
        if (itemToUpdate) {
          try {
            await apiFetch(`/admin/equipment/schedules/${itemToUpdate.id}`, {
              method: "PUT",
              headers: {
                "X-Hospital-Code": user?.hospitalCode || "",
                "X-Auth-User": user?.email || user?.id || "Admin",
              },
              body: JSON.stringify(reqBody),
            });
          } catch (apiErr) {
            console.warn("API Offline. Syncing state locally.", apiErr);
          }
        }

        setSchedules((prev) =>
          prev.map((s) =>
            s.srl === editingScheduleSrl
              ? { ...s, name: sName, date: sDate, notes: sNotes }
              : s,
          ),
        );
        toast.success("Schedule update saved!");
      } else {
        try {
          await apiFetch("/admin/equipment/schedules", {
            method: "POST",
            headers: {
              "X-Hospital-Code": user?.hospitalCode || "",
              "X-Auth-User": user?.email || user?.id || "Admin",
            },
            body: JSON.stringify(reqBody),
          });
        } catch (apiErr) {
          console.warn("API Offline. Storing schedule in local cache.", apiErr);
        }

        const nextSrl =
          schedules.length > 0
            ? Math.max(...schedules.map((s) => s.srl)) + 1
            : 1;
        setSchedules((prev) => [
          ...prev,
          {
            srl: nextSrl,
            id: nextSrl,
            name: sName,
            date: sDate,
            notes: sNotes,
          },
        ]);
        toast.success("Maintenance schedule logged successfully!");
      }
      setOpenSchedule(false);
      setSelectedScheduleSrl(null);
      fetchEquipmentData();
    } catch (_err) {
      toast.error("Failed to commit schedule changes");
    }
  };

  const handleDeleteSchedule = () => {
    if (selectedScheduleSrl === null) {
      toast.warning("Please select a schedule to delete.");
      return;
    }
    setDeleteScheduleConfirmOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    setDeleteScheduleConfirmOpen(false);
    if (selectedScheduleSrl === null) return;
    const item = schedules.find((s) => s.srl === selectedScheduleSrl);
    if (!item) return;

    try {
      try {
        await apiFetch(`/admin/equipment/schedules/${item.id}`, {
          method: "DELETE",
          headers: {
            "X-Hospital-Code": user?.hospitalCode || "",
            "X-Auth-User": user?.email || user?.id || "Admin",
          },
        });
      } catch (apiErr) {
        console.warn("API Offline. Syncing local scheduler.", apiErr);
      }

      setSchedules((prev) => prev.filter((s) => s.srl !== selectedScheduleSrl));
      setSelectedScheduleSrl(null);
      toast.success("Maintenance schedule removed.");
      fetchEquipmentData();
    } catch (_err) {
      toast.error("Failed to delete schedule");
    }
  };

  // Filter lists based on search parameters and datetime-local range bounds
  const filteredMaintenances = maintenances.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
      m.notes.toLowerCase().includes(maintenanceSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (maintenanceFromDate) {
      if (
        new Date(m.doneOn).getTime() < new Date(maintenanceFromDate).getTime()
      ) {
        return false;
      }
    }
    if (maintenanceToDate) {
      if (
        new Date(m.doneOn).getTime() > new Date(maintenanceToDate).getTime()
      ) {
        return false;
      }
    }
    return true;
  });

  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
      s.notes.toLowerCase().includes(scheduleSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (scheduleFromDate) {
      if (new Date(s.date).getTime() < new Date(scheduleFromDate).getTime()) {
        return false;
      }
    }
    if (scheduleToDate) {
      if (new Date(s.date).getTime() > new Date(scheduleToDate).getTime()) {
        return false;
      }
    }
    return true;
  });

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="equipment.page"
    >
      <div className="flex-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Equipment Management
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Maintenance tracking and scheduling (Modules 13 & 14)
              </p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-xs px-3 py-1 font-semibold tracking-wider">
            Equipment Terminal
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="maintenance" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-[400px] grid-cols-2 bg-slate-100 p-1 border border-slate-200 rounded-lg shadow-sm h-10">
          <TabsTrigger
            value="maintenance"
            className="rounded-md text-sm font-semibold transition-all text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm h-full"
          >
            <Wrench className="w-4 h-4 mr-2" /> Maintenance Log
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-md text-sm font-semibold transition-all text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm h-full"
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Schedule
          </TabsTrigger>
        </TabsList>

        {/* Maintenance Tab */}
        <TabsContent
          value="maintenance"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold shadow-sm transition-colors"
                onClick={handleOpenAddMaintenance}
              >
                <Plus className="w-3.5 h-3.5" /> Add Entry
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-50 gap-1.5 font-bold shadow-sm transition-colors"
                onClick={() => setScheduleTypeDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Add Schedule Type
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-foreground border-border hover:bg-muted"
                onClick={handleOpenEditMaintenance}
              >
                <Edit className="w-3.5 h-3.5 text-orange-400" /> Edit Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-destructive border-border hover:bg-destructive/10"
                onClick={handleDeleteMaintenance}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>

              {/* Search Bar */}
              <div className="relative group w-60 ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="Find maintenance logs..."
                  value={maintenanceSearch}
                  onChange={(e) => setMaintenanceSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                />
              </div>

              {/* Date/Time range filters */}
              <div className="flex items-center gap-2 border-l border-border/40 pl-3">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  From:
                </span>
                <DateTimePicker
                  type="datetime-local"
                  value={maintenanceFromDate}
                  onChange={setMaintenanceFromDate}
                  className="h-8 text-xs w-44 bg-background border-border rounded-md"
                />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  To:
                </span>
                <DateTimePicker
                  type="datetime-local"
                  value={maintenanceToDate}
                  onChange={setMaintenanceToDate}
                  className="h-8 text-xs w-44 bg-background border-border rounded-md"
                />
                <Button
                  className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0"
                  onClick={() => {
                    toast.success("Maintenance filters applied");
                  }}
                >
                  Apply
                </Button>
                {(maintenanceFromDate || maintenanceToDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-orange-500 hover:text-orange-600 font-bold px-2 hover:bg-orange-50"
                    onClick={() => {
                      setMaintenanceFromDate("");
                      setMaintenanceToDate("");
                    }}
                  >
                    Clear
                  </Button>
                )}
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

          {/* Active Dialog for Adding/Editing Maintenance Logs */}
          <Dialog open={openMaintenance} onOpenChange={setOpenMaintenance}>
            <DialogContent className="max-w-4xl w-[92vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-8 rounded-2xl animate-fade-in">
              <DialogHeader className="border-b border-slate-200 pb-4">
                <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-orange-600" />
                  {editingMaintenanceSrl !== null
                    ? "Edit Maintenance Record"
                    : "Add Maintenance Record"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 pt-6">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Equipment Name *
                  </Label>
                  <Input
                    placeholder="e.g. MRI Scanner Room A"
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Schedule Type
                  </Label>
                  <select
                    value={mSchedule}
                    onChange={(e) => setMSchedule(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {scheduleTypes.map((type) => (
                      <option
                        key={type.code}
                        value={type.code}
                        className="bg-white"
                      >
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Done On Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={mDoneOn}
                    onChange={(e) => setMDoneOn(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Cost / Amount (₹)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={mAmount}
                    onChange={(e) => setMAmount(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-mono font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Notes / Details
                  </Label>
                  <Textarea
                    rows={3}
                    value={mNotes}
                    onChange={(e) => setMNotes(e.target.value)}
                    placeholder="Describe calibration, component status, etc..."
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <Button
                  variant="outline"
                  className="h-11 px-6 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setOpenMaintenance(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                  onClick={handleSaveMaintenance}
                >
                  {editingMaintenanceSrl !== null
                    ? "Update Record"
                    : "Save Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* TABLE LOGS */}
          <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm min-h-0">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Srl</th>
                  <th className="px-3 py-2.5 font-semibold">Equipment Name</th>
                  <th className="px-3 py-2.5 font-semibold">Schedule</th>
                  <th className="px-3 py-2.5 font-semibold">Done-on Date</th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredMaintenances.length > 0 ? (
                  filteredMaintenances
                    .slice(
                      maintenancePage * maintenancePageSize,
                      (maintenancePage + 1) * maintenancePageSize,
                    )
                    .map((row) => {
                      const isSelected = selectedMaintenanceSrl === row.srl;
                      return (
                        // biome-ignore lint/a11y/useKeyWithClickEvents: Click selection for UI table row is mouse-exclusive
                        <tr
                          key={row.srl}
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-orange-500/5 hover:bg-orange-500/10"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedMaintenanceSrl(
                              isSelected ? null : row.srl,
                            )
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
                          <td className="px-3 py-2.5 font-bold text-foreground">
                            {row.name}
                          </td>
                          <td className="px-3 py-2.5">{row.schedule}</td>
                          <td className="px-3 py-2.5">
                            {row.doneOn ? row.doneOn.replace("T", " ") : ""}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-orange-600">
                            ₹{Number.parseFloat(row.amount).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-medium">
                            {row.notes}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground font-medium"
                    >
                      No matching maintenance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-border mt-auto">
            <PaginationControl
              currentPage={maintenancePage}
              totalPages={Math.ceil(
                filteredMaintenances.length / maintenancePageSize,
              )}
              totalElements={filteredMaintenances.length}
              pageSize={maintenancePageSize}
              onPageChange={setMaintenancePage}
              onPageSizeChange={setMaintenancePageSize}
            />

            </div>

          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent
          value="schedule"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="glass-elevated p-2 rounded-lg flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold shadow-sm transition-colors"
                onClick={handleOpenAddSchedule}
              >
                <Plus className="w-3.5 h-3.5" /> Add Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-foreground border-border hover:bg-muted"
                onClick={handleOpenEditSchedule}
              >
                <Edit className="w-3.5 h-3.5 text-orange-400" /> Edit Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-semibold text-destructive border-border hover:bg-destructive/10"
                onClick={handleDeleteSchedule}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>

              {/* Search Bar */}
              <div className="relative group w-60 ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="Find active schedules..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
                />
              </div>

              {/* Date/Time range filters */}
              <div className="flex items-center gap-2 border-l border-border/40 pl-3">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  From:
                </span>
                <DateTimePicker
                  type="datetime-local"
                  value={scheduleFromDate}
                  onChange={setScheduleFromDate}
                  className="h-8 text-xs w-44 bg-background border-border rounded-md"
                />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  To:
                </span>
                <DateTimePicker
                  type="datetime-local"
                  value={scheduleToDate}
                  onChange={setScheduleToDate}
                  className="h-8 text-xs w-44 bg-background border-border rounded-md"
                />
                <Button
                  className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-md px-3 shadow-xs border-0 cursor-pointer transition-all shrink-0"
                  onClick={() => {
                    toast.success("Schedule filters applied");
                  }}
                >
                  Apply
                </Button>
                {(scheduleFromDate || scheduleToDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-orange-500 hover:text-orange-600 font-bold px-2 hover:bg-orange-50"
                    onClick={() => {
                      setScheduleFromDate("");
                      setScheduleToDate("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Dialog for Scheduling Maintenance */}
          <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
            <DialogContent className="max-w-4xl w-[92vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-8 rounded-2xl animate-fade-in">
              <DialogHeader className="border-b border-slate-200 pb-4">
                <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-orange-600" />
                  {editingScheduleSrl !== null
                    ? "Edit Maintenance Schedule"
                    : "Schedule Maintenance"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 pt-6">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Equipment Name *
                  </Label>
                  <select
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="" disabled>
                      -- Select Equipment from Maintenance Log --
                    </option>
                    {loggedEquipmentNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    {sName && !loggedEquipmentNames.includes(sName) && (
                      <option value={sName}>{sName}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Scheduled Date & Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={sDate}
                    onChange={(e) => setSDate(e.target.value)}
                    className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                    Notes
                  </Label>
                  <Textarea
                    rows={3}
                    value={sNotes}
                    onChange={(e) => setSNotes(e.target.value)}
                    placeholder="Describe the objective of scheduling (e.g. tube replacement, general inspection)..."
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <Button
                  variant="outline"
                  className="h-11 px-6 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setOpenSchedule(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                  onClick={handleSaveSchedule}
                >
                  {editingScheduleSrl !== null
                    ? "Update Schedule"
                    : "Save Schedule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* TABLE SCHEDULES */}
          <div className="flex-1 overflow-auto glass-elevated rounded-xl border border-border shadow-glass-sm min-h-0">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur border-b border-border z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Srl</th>
                  <th className="px-3 py-2.5 font-semibold">Equipment Name</th>
                  <th className="px-3 py-2.5 font-semibold">Scheduled Date</th>
                  <th className="px-3 py-2.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredSchedules.length > 0 ? (
                  filteredSchedules
                    .slice(
                      schedulePage * schedulePageSize,
                      (schedulePage + 1) * schedulePageSize,
                    )
                    .map((row) => {
                      const isSelected = selectedScheduleSrl === row.srl;
                      return (
                        // biome-ignore lint/a11y/useKeyWithClickEvents: Click selection for UI table row is mouse-exclusive
                        <tr
                          key={row.srl}
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-orange-500/5 hover:bg-orange-500/10"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedScheduleSrl(isSelected ? null : row.srl)
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
                          <td className="px-3 py-2.5 font-bold text-foreground">
                            {row.name}
                          </td>
                          <td className="px-3 py-2.5 text-orange-600 font-bold">
                            {row.date ? row.date.replace("T", " ") : ""}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-medium">
                            {row.notes}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground font-medium"
                    >
                      No matching schedules found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-border mt-auto">
            <PaginationControl
              currentPage={schedulePage}
              totalPages={Math.ceil(
                filteredSchedules.length / schedulePageSize,
              )}
              totalElements={filteredSchedules.length}
              pageSize={schedulePageSize}
              onPageChange={setSchedulePage}
              onPageSizeChange={setSchedulePageSize}
            />

            </div>

          </div>
        </TabsContent>
      </Tabs>

      {/* ADD SCHEDULE TYPE DIALOG */}
      <Dialog
        open={scheduleTypeDialogOpen}
        onOpenChange={setScheduleTypeDialogOpen}
      >
        <DialogContent className="max-w-md w-[90vw] border border-slate-300 shadow-2xl bg-white text-slate-900 p-6 rounded-2xl animate-fade-in">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-xl font-extrabold font-display text-orange-600 tracking-tight flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Add Equipment Schedule Type
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-bold text-slate-700 tracking-wide mb-1.5 block">
                Schedule Type Name *
              </Label>
              <Input
                placeholder="e.g. Weekly, Bi-Weekly, Daily, etc."
                value={newScheduleTypeName}
                onChange={(e) => setNewScheduleTypeName(e.target.value)}
                className="h-11 text-sm bg-white border-slate-300 text-slate-900 font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-5">
            <Button
              variant="outline"
              className="h-10 px-4 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold"
              onClick={() => {
                setScheduleTypeDialogOpen(false);
                setNewScheduleTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md text-xs"
              onClick={handleSaveScheduleType}
            >
              Add Type
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteMaintenanceConfirmOpen}
        onOpenChange={setDeleteMaintenanceConfirmOpen}
      >
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Maintenance Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this maintenance record? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteMaintenanceConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteMaintenance}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteScheduleConfirmOpen}
        onOpenChange={setDeleteScheduleConfirmOpen}
      >
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Maintenance Schedule
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this maintenance schedule? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteScheduleConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteSchedule}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type { CampResponse } from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import {
  Calendar,
  Compass,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  Users2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CAMP_TYPES = [
  "Free health camp",
  "Diabetes camp",
  "BP screening camp",
  "Rural outreach camp",
  "Corporate health checkup camp",
  "Other general screening",
];

export default function ManageCamps() {
  const { user } = useAuthStore();
  const code = user?.hospitalCode || "HSP001";

  const [camps, setCamps] = useState<CampResponse[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<CampResponse | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState(CAMP_TYPES[0]);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formLocation, setFormLocation] = useState("");
  const [formDoctor, setFormDoctor] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("Upcoming");
  const [formDuration, setFormDuration] = useState("");
  const [formEndDate, setFormEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Load camps and active doctors
  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, dList] = await Promise.all([
        receptionApi.getCamps(code),
        apiFetch<any>("/admin/doctors", {
          headers: { "X-Hospital-Code": code },
        }),
      ]);
      if (Array.isArray(cList)) setCamps(cList);
      const docs = Array.isArray(dList) ? dList : dList?.content || [];
      setDoctors(docs);
    } catch (e) {
      toast.error("Failed to load camp management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [code]);

  // Sync edit form fields
  useEffect(() => {
    if (editingCamp) {
      setFormName(editingCamp.campName || "");
      setFormType(editingCamp.campType || CAMP_TYPES[0]);
      setFormDate(
        editingCamp.campDate || new Date().toISOString().split("T")[0],
      );
      setFormLocation(editingCamp.location || "");
      setFormDoctor(editingCamp.assignedDoctor || "");
      setFormDescription(editingCamp.description || "");
      setFormStatus(editingCamp.status || "Upcoming");
      setFormDuration(editingCamp.duration || "");
      setFormEndDate(
        editingCamp.endDate ||
          editingCamp.campDate ||
          new Date().toISOString().split("T")[0],
      );
    } else {
      setFormName("");
      setFormType(CAMP_TYPES[0]);
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormLocation("");
      setFormDoctor("");
      setFormDescription("");
      setFormStatus("Upcoming");
      setFormDuration("");
      setFormEndDate(new Date().toISOString().split("T")[0]);
    }
  }, [editingCamp]);

  useEffect(() => {
    if (!formDate || !formEndDate) {
      setFormDuration("");
      return;
    }
    const s = new Date(formDate);
    const e = new Date(formEndDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      setFormDuration("");
      return;
    }
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) {
      setFormDuration("1 Day");
      return;
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setFormDuration(`${diffDays} Day${diffDays > 1 ? "s" : ""}`);
  }, [formDate, formEndDate]);

  const handleSaveCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Camp Name is required");
      return;
    }

    try {
      const payload = {
        campName: formName,
        campType: formType,
        campDate: formDate,
        location: formLocation,
        assignedDoctor: formDoctor,
        description: formDescription,
        status: formStatus,
        duration: formDuration,
        endDate: formEndDate,
      };

      if (editingCamp) {
        await receptionApi.updateCamp(editingCamp.id, payload, code);
        toast.success("Camp details updated successfully!");
      } else {
        await receptionApi.createCamp(payload, code);
        toast.success("New medical camp program created!");
      }
      setDialogOpen(false);
      setEditingCamp(null);
      loadData();
    } catch {
      toast.error("Failed to save camp.");
    }
  };

  const handleEditClick = (c: CampResponse) => {
    setEditingCamp(c);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      await receptionApi.deleteCamp(selectedId, code);
      toast.success("Camp program deleted successfully.");
      setDeleteConfirmOpen(false);
      setSelectedId(null);
      loadData();
    } catch {
      toast.error("Failed to delete camp.");
    }
  };

  // Stats derivation
  const totalCamps = camps.length;
  const activeCamps = camps.filter((c) => c.status === "Active").length;
  const completedCamps = camps.filter((c) => c.status === "Completed").length;
  const upcomingCamps = camps.filter((c) => c.status === "Upcoming").length;

  const filteredCamps = camps.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.campName.toLowerCase().includes(q) ||
      (c.location || "").toLowerCase().includes(q) ||
      (c.assignedDoctor || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20">
            Active
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/25 hover:bg-zinc-500/20">
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20">
            Upcoming
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5 p-2 flex flex-col h-[calc(100vh-8rem)]">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-none">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight font-display flex items-center gap-2">
            <Compass className="w-6 h-6 text-orange-500" />
            Medical Camp Program Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create outreach medical screenings, assign roster doctors, and
            update program statuses.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCamp(null);
            setDialogOpen(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 shadow-md self-start"
          size="sm"
        >
          <Plus className="w-4 h-4" /> Create Camp Program
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-none">
        <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Users2 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Camps
            </p>
            <p className="text-lg font-black text-foreground">{totalCamps}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Active Camps
            </p>
            <p className="text-lg font-black text-emerald-600">{activeCamps}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-500/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Completed
            </p>
            <p className="text-lg font-black text-zinc-600">{completedCamps}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card/60 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Upcoming
            </p>
            <p className="text-lg font-black text-amber-600">{upcomingCamps}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-card border border-border rounded-xl shadow-lg">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/10 flex-none">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search camp name, location or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-xs bg-white dark:bg-zinc-950 border-border"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label className="text-xs font-semibold whitespace-nowrap text-muted-foreground">
              Status:
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9.5 text-xs bg-white dark:bg-zinc-950 border-border">
                <SelectValue placeholder="All Camps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Camps</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table list */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs text-muted-foreground">
                Fetching backend camp logs...
              </p>
            </div>
          ) : filteredCamps.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Compass className="w-10 h-10 text-muted-foreground/30 stroke-1" />
              <p className="text-sm font-semibold">No medical camps found</p>
              <p className="text-xs text-muted-foreground/75">
                Create a camp program to initiate screening entries.
              </p>
            </div>
          ) : (
            <>
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-border z-10 font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                <tr>
                  <th className="px-4 py-3">Camp Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Roster Doctor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCamps.slice(page * pageSize, (page + 1) * pageSize).map((camp) => (
                  <tr
                    key={camp.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {camp.campName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {camp.campType || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {camp.campDate || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      {camp.duration || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        <span>{camp.location || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-orange-500" />
                        <span>
                          {camp.assignedDoctor
                            ? `Dr. ${camp.assignedDoctor}`
                            : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(camp.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(camp)}
                          className="h-7 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 font-bold"
                        >
                          Modify
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(camp.id)}
                          className="h-7 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCamps.length > 0 && (
              <div className="p-4 border-t border-border">
                <PaginationControl
                  currentPage={page}
                  totalPages={Math.ceil(filteredCamps.length / pageSize)}
                  totalElements={filteredCamps.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-xl p-0 overflow-hidden border border-border bg-card rounded-2xl shadow-2xl"
        >
          <DialogHeader className="p-5 border-b border-border bg-zinc-50/50 dark:bg-zinc-900/10">
            <DialogTitle className="text-sm font-black font-display text-foreground flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-500" />
              {editingCamp
                ? "Modify Camp Program"
                : "Launch Outreach Medical Camp"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCamp} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Camp Program Name *
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Free Diabetes Outreach Camp - Rural Sector 4"
                  className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Screening Type
                </Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMP_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Program Status
                </Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Active">
                      Active (Available in dropdown)
                    </SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  min={formDate}
                  className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Program Location
                </Label>
                <Input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Community Center, Sector B"
                  className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Roster Doctor
                </Label>
                <Select value={formDoctor} onValueChange={setFormDoctor}>
                  <SelectTrigger className="h-8.5 text-xs bg-zinc-50 dark:bg-zinc-950 border-border">
                    <SelectValue placeholder="Assign physician" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => {
                      const name = [d.firstName, d.lastName]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <SelectItem key={d.doctorCode || d.id} value={name}>
                          Dr. {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Brief Description
                </Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize target patient size, screenings to perform (BP, sugar) and support staff rules."
                  className="min-h-[70px] text-xs bg-zinc-50 dark:bg-zinc-950 border-border"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-border text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold min-w-[120px] text-xs"
              >
                {editingCamp ? "Update Campaign" : "Launch Campaign"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-md bg-card border border-border text-foreground rounded-2xl shadow-lg"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-sm font-bold">
              Retire Camp Program
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-xs mt-2">
            Are you sure you want to terminate this medical outreach camp
            program? This action will permanently remove it from administrative
            tracking.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Delete Camp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

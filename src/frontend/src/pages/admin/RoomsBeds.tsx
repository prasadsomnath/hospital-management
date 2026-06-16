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
import { apiFetch } from "@/lib/api";
const MOCK_ROOMS: any[] = [];
import type { Room } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { BedDouble, Edit2, Plus, Trash2, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Occupied: "bg-accent/20 text-accent border-accent/30",
  Maintenance: "bg-destructive/20 text-destructive border-destructive/30",
};

const TYPE_STYLES: Record<string, string> = {
  ICU: "bg-destructive/20 text-destructive border-destructive/30",
  General: "bg-primary/20 text-primary border-primary/30",
  Private: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Semi-Private": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const BED_COUNT: Record<string, number> = {
  ICU: 1,
  General: 4,
  Private: 1,
  "Semi-Private": 2,
};

const TYPE_MAP: Record<string, string> = {
  ICU: "ICU",
  GENERAL: "General",
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-Private",
};

const BACKEND_TYPE_MAP: Record<string, string> = {
  ICU: "ICU",
  General: "GENERAL",
  Private: "PRIVATE",
  "Semi-Private": "SEMI_PRIVATE",
};

type FormState = {
  number: string;
  type: string;
  floor: string;
  totalBeds: number;
  departmentId?: number;
};

const EMPTY_FORM: FormState = {
  number: "",
  type: "General",
  floor: "Ground Floor",
  totalBeds: 4,
  departmentId: undefined,
};

export default function RoomsBeds() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filter, setFilter] = useState<"All" | Room["type"] | Room["status"]>(
    "All",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchAllData = async (currentPage = page, size = pageSize) => {
    if (!user?.hospitalCode) return;
    const hdr = { "X-Hospital-Code": user.hospitalCode };
    try {
      setLoading(true);

      // Fetch rooms
      const res = await apiFetch<any>("/admin/rooms", {
        headers: hdr,
        params: { page: currentPage, size },
      });

      const roomsList = res.content || res || [];
      if (res.content) {
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } else {
        setTotalPages(1);
        setTotalElements(roomsList.length);
      }

      // Fetch departments to map departmentId
      let depts: any[] = [];
      try {
        const deptsRes = await apiFetch<any>("/admin/departments", {
          headers: hdr,
        });
        depts = Array.isArray(deptsRes) ? deptsRes : (deptsRes?.content ?? []);
        setDepartments(depts);
      } catch (err) {
        console.warn("Failed to load departments from backend", err);
      }

      // Fetch inpatients to associate patient names
      let inpatients: any[] = [];
      try {
        const inpatientsRes = await apiFetch<any>("/admin/inpatients", {
          headers: hdr,
        });
        inpatients = Array.isArray(inpatientsRes)
          ? inpatientsRes
          : (inpatientsRes?.content ?? []);
      } catch (err) {
        console.warn("Failed to load inpatients from backend", err);
      }

      const mapped = roomsList
        .filter((r: any) => r.isActive !== false)
        .map((r: any): Room => {
          const typeStr = r.roomType || "GENERAL";
          const uiType = TYPE_MAP[typeStr] || "General";

          // Find matching inpatient if any
          const activeInpatient = inpatients.find(
            (ip) =>
              ip.status === "ADMITTED" &&
              ip.bedNo &&
              ip.bedNo.startsWith(r.roomNumber),
          );

          let derivedFloor: string | number = 1;
          if (r.roomNumber.includes("-")) {
            const numPart = r.roomNumber.split("-")[1];
            if (numPart && !Number.isNaN(Number(numPart.charAt(0)))) {
              derivedFloor = Number(numPart.charAt(0));
            }
          }
          const roomFloor = r.floor || derivedFloor;

          let uiStatus: "Available" | "Occupied" | "Maintenance" = "Available";
          if (r.availableBeds === 0 && r.totalBeds > 0) {
            uiStatus = "Occupied";
          } else if (activeInpatient) {
            uiStatus = "Occupied";
          }

          return {
            id: String(r.id),
            number: r.roomNumber,
            type: uiType as Room["type"],
            floor: roomFloor,
            patientName: activeInpatient
              ? activeInpatient.patientName
              : undefined,
            status: uiStatus,
            departmentId: r.departmentId,
            totalBeds: r.totalBeds,
            availableBeds: r.availableBeds,
          };
        });

      setRooms(mapped);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load rooms from backend");
      // Fallback
      setRooms(MOCK_ROOMS);
      setTotalPages(1);
      setTotalElements(MOCK_ROOMS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(page, pageSize);
  }, [user?.hospitalCode, page, pageSize]);

  const counts = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === "Available").length,
    occupied: rooms.filter((r) => r.status === "Occupied").length,
    maintenance: rooms.filter((r) => r.status === "Maintenance").length,
  };

  const FILTERS: (typeof filter)[] = [
    "All",
    "Available",
    "Occupied",
    "Maintenance",
    "ICU",
    "General",
    "Private",
    "Semi-Private",
  ];

  const filtered =
    filter === "All"
      ? rooms
      : rooms.filter((r) => r.status === filter || r.type === filter);

  const allocationBreakdown = {
    General: {
      rooms: rooms.filter((r) => r.type === "General").length,
      beds: rooms
        .filter((r) => r.type === "General")
        .reduce((sum, r) => sum + (r.totalBeds || 0), 0),
      occupied: rooms
        .filter((r) => r.type === "General")
        .reduce(
          (sum, r) => sum + ((r.totalBeds || 0) - (r.availableBeds || 0)),
          0,
        ),
    },
    Private: {
      rooms: rooms.filter((r) => r.type === "Private").length,
      beds: rooms
        .filter((r) => r.type === "Private")
        .reduce((sum, r) => sum + (r.totalBeds || 0), 0),
      occupied: rooms
        .filter((r) => r.type === "Private")
        .reduce(
          (sum, r) => sum + ((r.totalBeds || 0) - (r.availableBeds || 0)),
          0,
        ),
    },
    "Semi-Private": {
      rooms: rooms.filter((r) => r.type === "Semi-Private").length,
      beds: rooms
        .filter((r) => r.type === "Semi-Private")
        .reduce((sum, r) => sum + (r.totalBeds || 0), 0),
      occupied: rooms
        .filter((r) => r.type === "Semi-Private")
        .reduce(
          (sum, r) => sum + ((r.totalBeds || 0) - (r.availableBeds || 0)),
          0,
        ),
    },
    ICU: {
      rooms: rooms.filter((r) => r.type === "ICU").length,
      beds: rooms
        .filter((r) => r.type === "ICU")
        .reduce((sum, r) => sum + (r.totalBeds || 0), 0),
      occupied: rooms
        .filter((r) => r.type === "ICU")
        .reduce(
          (sum, r) => sum + ((r.totalBeds || 0) - (r.availableBeds || 0)),
          0,
        ),
    },
  };

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(r: Room) {
    setEditingId(r.id);
    setForm({
      number: r.number,
      type: r.type,
      floor: String(r.floor),
      totalBeds: r.totalBeds ?? BED_COUNT[r.type] ?? 1,
      departmentId: r.departmentId,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.number.trim()) return;
    const hdr = { "X-Hospital-Code": user?.hospitalCode || "HSP001" };

    try {
      const deptId = form.departmentId || departments[0]?.id || 1;
      const backendType = BACKEND_TYPE_MAP[form.type] || "GENERAL";

      const totalBeds = Number(form.totalBeds) || 1;

      // Calculate available beds when editing or creating
      let occupiedBeds = 0;
      if (editingId) {
        const existingRoom = rooms.find((r) => r.id === editingId);
        if (existingRoom) {
          occupiedBeds =
            (existingRoom.totalBeds || 0) - (existingRoom.availableBeds || 0);
        }
      }
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);

      const body = {
        roomNumber: form.number,
        floor: form.floor,
        roomType: backendType,
        departmentId: deptId,
        isActive: true,
        totalBeds: totalBeds,
        availableBeds: availableBeds,
      };

      if (editingId) {
        await apiFetch(`/admin/rooms/${editingId}`, {
          method: "PUT",
          headers: hdr,
          body: JSON.stringify(body),
        });
        toast.success("Room updated successfully!");
      } else {
        await apiFetch("/admin/rooms", {
          method: "POST",
          headers: hdr,
          body: JSON.stringify(body),
        });
        toast.success("Room registered successfully!");
      }

      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchAllData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save room");
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/admin/rooms/${id}`, {
        method: "DELETE",
        headers: { "X-Hospital-Code": user?.hospitalCode || "HSP001" },
      });
      setDeleteId(null);
      fetchAllData();
      toast.success("Room removed successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove room");
    }
  }

  const totalBedsSum = rooms.reduce((sum, r) => sum + (r.totalBeds || 0), 0);
  const occupiedBedsSum = rooms.reduce(
    (sum, r) => sum + ((r.totalBeds || 0) - (r.availableBeds || 0)),
    0,
  );

  return (
    <div className="space-y-6" data-ocid="admin.rooms.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Rooms & Beds
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {counts.occupied} occupied · {counts.available} available ·{" "}
            {counts.maintenance} under maintenance
          </p>
        </div>
        <Button
          data-ocid="admin.rooms.add_button"
          onClick={openAdd}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
        >
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Rooms",
            value: counts.total,
            color: "text-foreground",
            bg: "bg-muted/30",
          },
          {
            label: "Available Rooms",
            value: counts.available,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Occupied Rooms",
            value: counts.occupied,
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            label: "Maintenance Rooms",
            value: counts.maintenance,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`glass-elevated rounded-xl p-4 text-center shadow-glass-sm ${s.bg}`}
          >
            <p className={`text-3xl font-bold font-display ${s.color}`}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="glass-elevated rounded-xl p-4 shadow-glass-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Occupancy Rate
          </span>
          <span className="text-sm font-bold text-accent">
            {totalBedsSum > 0
              ? Math.round((occupiedBedsSum / totalBedsSum) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all"
            style={{
              width: `${totalBedsSum > 0 ? (occupiedBedsSum / totalBedsSum) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>{occupiedBedsSum} beds occupied</span>
          <span>{totalBedsSum} total beds</span>
        </div>
      </div>

      {/* Allocations Breakdown */}
      <div className="glass-elevated rounded-xl p-5 shadow-glass-sm bg-gradient-to-br from-card/30 to-card/10 border border-border/40">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-accent" /> Allocations Breakdown
          (Rooms & Beds)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["General", "Private", "Semi-Private", "ICU"] as const).map(
            (type) => {
              const data = allocationBreakdown[type];
              return (
                <div
                  key={type}
                  className="bg-background/20 rounded-lg p-3 border border-border/20 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={`text-xs border ${TYPE_STYLES[type]}`}
                    >
                      {type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {data.occupied} of {data.beds} beds occupied
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-2xl font-bold text-foreground font-display">
                        {data.rooms}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        Rooms
                      </span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-accent font-display">
                        {data.beds}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        Beds
                      </span>
                    </div>
                  </div>
                  {/* Micro progress bar for each type */}
                  <div className="h-1 bg-muted rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{
                        width: `${data.beds > 0 ? (data.occupied / data.beds) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" data-ocid="admin.rooms.filter.tab">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-ocid={`admin.rooms.filter.${f.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((room, i) => (
          <div
            key={room.id}
            data-ocid={`admin.rooms.item.${i + 1}`}
            className="glass-elevated rounded-xl p-4 shadow-glass-sm hover:scale-[1.01] transition-smooth bg-gradient-to-br from-card/30 to-card/10 border border-border/40"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    room.status === "Available"
                      ? "bg-emerald-500/20"
                      : room.status === "Occupied"
                        ? "bg-accent/20"
                        : "bg-destructive/20"
                  }`}
                >
                  {room.status === "Maintenance" ? (
                    <Wrench className="w-4 h-4 text-destructive" />
                  ) : (
                    <BedDouble
                      className={`w-4 h-4 ${room.status === "Available" ? "text-emerald-400" : "text-accent"}`}
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground font-display">
                    {room.number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Floor {room.floor}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  data-ocid={`admin.rooms.edit_button.${i + 1}`}
                  onClick={() => openEdit(room)}
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  data-ocid={`admin.rooms.delete_button.${i + 1}`}
                  onClick={() => setDeleteId(room.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={`text-xs border ${TYPE_STYLES[room.type] ?? ""}`}
              >
                {room.type}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs border ${STATUS_STYLES[room.status] ?? ""}`}
              >
                {room.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {room.patientName ? (
                  <p className="text-sm text-foreground font-medium">
                    {room.patientName}
                  </p>
                ) : room.status === "Occupied" ? (
                  <p className="text-sm text-accent font-semibold">Occupied</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Unoccupied
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {(room.totalBeds ?? BED_COUNT[room.type] ?? 1) -
                    (room.availableBeds ??
                      room.totalBeds ??
                      BED_COUNT[room.type] ??
                      1)}{" "}
                  of {room.totalBeds ?? BED_COUNT[room.type] ?? 1} bed(s)
                  occupied
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 || totalElements > pageSize ? (
        <div className="glass-elevated rounded-xl p-4 shadow-glass-sm mt-6">
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : null}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="admin.rooms.dialog"
          className="bg-card border-border max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Room" : "Add Room"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-number">Room Number</Label>
                <Input
                  id="room-number"
                  data-ocid="admin.rooms.number.input"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="G-104"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Floor</Label>
                <Select
                  value={form.floor}
                  onValueChange={(v) => setForm({ ...form, floor: v })}
                >
                  <SelectTrigger
                    data-ocid="admin.rooms.floor.select"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ground Floor">Ground Floor</SelectItem>
                    <SelectItem value="First Floor">First Floor</SelectItem>
                    <SelectItem value="Second Floor">Second Floor</SelectItem>
                    <SelectItem value="Third Floor">Third Floor</SelectItem>
                    <SelectItem value="Fourth Floor">Fourth Floor</SelectItem>
                    <SelectItem value="Fifth Floor">Fifth Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Room Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => {
                    const defaultBeds = BED_COUNT[v] ?? 1;
                    setForm({ ...form, type: v, totalBeds: defaultBeds });
                  }}
                >
                  <SelectTrigger
                    data-ocid="admin.rooms.type.select"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ICU">ICU</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-beds">Bed Count</Label>
                <Input
                  id="room-beds"
                  type="number"
                  min={1}
                  data-ocid="admin.rooms.beds.input"
                  value={form.totalBeds}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      totalBeds: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  placeholder="4"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="admin.rooms.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                data-ocid="admin.rooms.submit_button"
                onClick={handleSave}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                {editingId ? "Save Changes" : "Add Room"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent
          data-ocid="admin.rooms.confirm_dialog"
          className="bg-card border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Remove Room</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to remove this room from the hospital
            registry? This action is irreversible.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.rooms.delete_cancel_button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="admin.rooms.confirm_button"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { receptionApi } from "@/lib/reception-api";
import type { Doctor, Receptionist } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  BedDouble,
  Calendar,
  DollarSign,
  FlaskConical,
  Pill,
  Stethoscope,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Admitted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Discharged: "bg-muted text-muted-foreground border-border",
  "In-Progress": "bg-accent/20 text-accent border-accent/30",
  Scheduled: "bg-primary/20 text-primary border-primary/30",
  Confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Checked-In": "bg-accent/20 text-accent border-accent/30",
  Completed: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Busy: "bg-accent/20 text-accent border-accent/30",
  "On Leave": "bg-destructive/20 text-destructive border-destructive/30",
};

const WEEKLY_REVENUE = [
  { day: "Mon", revenue: 14200 },
  { day: "Tue", revenue: 18500 },
  { day: "Wed", revenue: 12800 },
  { day: "Thu", revenue: 21400 },
  { day: "Fri", revenue: 19700 },
  { day: "Sat", revenue: 9300 },
  { day: "Sun", revenue: 6200 },
];

const PATIENT_FLOW = [
  { hour: "8am", patients: 4 },
  { hour: "9am", patients: 9 },
  { hour: "10am", patients: 14 },
  { hour: "11am", patients: 12 },
  { hour: "12pm", patients: 7 },
  { hour: "1pm", patients: 5 },
  { hour: "2pm", patients: 11 },
  { hour: "3pm", patients: 16 },
  { hour: "4pm", patients: 10 },
  { hour: "5pm", patients: 6 },
];

const DEPT_DISTRIBUTION = [
  { name: "Cardiology", value: 28, fill: "#3b82f6" },
  { name: "Orthopedics", value: 35, fill: "#f97316" },
  { name: "Neurology", value: 19, fill: "#8b5cf6" },
  { name: "Pediatrics", value: 22, fill: "#10b981" },
  { name: "Surgery", value: 18, fill: "#f59e0b" },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [labTechs, setLabTechs] = useState<any[]>([]);
  const [pharmacists, setPharmacists] = useState<any[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState<any[]>([]);

  // Real-time chart states initialized with mock baselines as fallback
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>(WEEKLY_REVENUE);
  const [patientFlow, setPatientFlow] = useState<any[]>(PATIENT_FLOW);
  const [deptDistribution, setDeptDistribution] =
    useState<any[]>(DEPT_DISTRIBUTION);
  const [bedsOccupiedText, setBedsOccupiedText] = useState("24/150");

  const [hospitalName, setHospitalName] = useState(
    user?.hospitalCode === "HSP001"
      ? "St. Mary's General Hospital"
      : `Hospital ${user?.hospitalCode || "HealthKare Pro"}`,
  );

  useEffect(() => {
    const loadBranding = async () => {
      if (!user?.hospitalCode) return;
      const saved = localStorage.getItem(
        `hospital-settings-${user.hospitalCode}`,
      );
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) {
            setHospitalName(parsed.name);
          }
        } catch (e) {
          console.error("Failed to parse branding settings", e);
        }
      } else {
        try {
          const res = await apiFetch<any>(
            `/super-admin/hospitals/code/${user.hospitalCode}`,
          );
          if (res && res.hospitalName) {
            setHospitalName(res.hospitalName);
          }
        } catch (e) {
          console.error("Failed to fetch hospital name in dashboard", e);
        }
      }
    };
    loadBranding();
  }, [user?.hospitalCode]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.hospitalCode) return;
      try {
        // Fetch active doctors from database
        const resDocs = await apiFetch<any>(
          `/auth/users?hospitalCode=${user.hospitalCode}&role=DOCTOR`,
        );
        const credentialsDoctors = resDocs?.content || resDocs || [];
        const storedDocMetadata = localStorage.getItem("medicore-doctors-meta");
        const docMetadataMap = storedDocMetadata
          ? JSON.parse(storedDocMetadata)
          : {};
        const mappedDocs = credentialsDoctors.map((c: any): Doctor => {
          const meta = docMetadataMap[c.email] || {};
          return {
            id: c.entityId || c.email,
            name:
              meta.name ||
              "Dr. " +
                c.email.split("@")[0].charAt(0).toUpperCase() +
                c.email.split("@")[0].slice(1),
            specialty: meta.specialty || "General Medicine",
            department: meta.department || "Cardiology",
            phone: c.mobile || "N/A",
            email: c.email,
            status: c.isActive ? "Active" : "On Leave",
            patients: meta.patients || 0,
            experience: meta.experience || 5,
          };
        });
        setDoctors(mappedDocs);

        // Fetch active receptionists from database
        const resRecs = await apiFetch<any>(
          `/auth/users?hospitalCode=${user.hospitalCode}&role=RECEPTIONIST`,
        );
        const credentialsRecs = resRecs?.content || resRecs || [];
        const storedRecMetadata = localStorage.getItem(
          "medicore-receptionists-meta",
        );
        const recMetadataMap = storedRecMetadata
          ? JSON.parse(storedRecMetadata)
          : {};
        const mappedRecs = credentialsRecs.map((c: any): Receptionist => {
          const meta = recMetadataMap[c.email] || {};
          return {
            id: c.entityId || c.email,
            name:
              meta.name ||
              "Receptionist " +
                c.email.split("@")[0].charAt(0).toUpperCase() +
                c.email.split("@")[0].slice(1),
            email: c.email,
            phone: c.mobile || "N/A",
            shift: meta.shift || "Morning",
            status: c.isActive ? "Active" : "Inactive",
            assignedCounter: meta.assignedCounter || "Counter A",
            joinDate: meta.joinDate || new Date().toISOString().split("T")[0],
          };
        });
        setReceptionists(mappedRecs);

        // Fetch active lab technicians from database
        try {
          const resLab = await apiFetch<any>(
            `/auth/users?hospitalCode=${user.hospitalCode}&role=LAB_TECHNICIAN`,
          );
          const credentialsLab = resLab?.content || resLab || [];
          const storedLabMetadata = localStorage.getItem(
            "medicore-technicians-meta",
          );
          const labMetadataMap = storedLabMetadata
            ? JSON.parse(storedLabMetadata)
            : {};
          const mappedLabTechs = credentialsLab.map((c: any) => {
            const meta = labMetadataMap[c.email] || {};
            return {
              id: c.entityId || c.email,
              name:
                meta.name ||
                "Lab Tech " +
                  c.email.split("@")[0].charAt(0).toUpperCase() +
                  c.email.split("@")[0].slice(1),
              email: c.email,
              phone: c.mobile || "N/A",
              status: c.isActive ? "Active" : "Inactive",
              specialty: meta.specialty || "Diagnostics",
              shift: meta.shift || "Morning",
            };
          });
          setLabTechs(mappedLabTechs);
        } catch (e) {
          console.warn("Failed to fetch lab technicians", e);
        }

        // Fetch active pharmacists from database
        try {
          const resPharm = await apiFetch<any>(
            `/auth/users?hospitalCode=${user.hospitalCode}&role=PHARMACIST`,
          );
          const credentialsPharm = resPharm?.content || resPharm || [];
          const storedPharmMetadata = localStorage.getItem(
            "medicore-pharmacists-meta",
          );
          const pharmMetadataMap = storedPharmMetadata
            ? JSON.parse(storedPharmMetadata)
            : {};
          const mappedPharmacists = credentialsPharm.map((c: any) => {
            const meta = pharmMetadataMap[c.email] || {};
            return {
              id: c.entityId || c.email,
              name:
                meta.name ||
                "Pharmacist " +
                  c.email.split("@")[0].charAt(0).toUpperCase() +
                  c.email.split("@")[0].slice(1),
              email: c.email,
              phone: c.mobile || "N/A",
              status: c.isActive ? "Active" : "Inactive",
              specialty: meta.specialty || "Pharmacy Admin",
              shift: meta.shift || "Morning",
            };
          });
          setPharmacists(mappedPharmacists);
        } catch (e) {
          console.warn("Failed to fetch pharmacists", e);
        }

        // Fetch live Patients from database
        let patientsList: any[] = [];
        try {
          patientsList = await receptionApi.getPatients(user.hospitalCode);
          setPatientsCount(patientsList.length);
        } catch (e) {
          console.warn(
            "Failed to load patients dynamically, falling back to local storage",
            e,
          );
          const savedPatients = localStorage.getItem("medicore-patients");
          if (savedPatients) {
            const parsed = JSON.parse(savedPatients);
            patientsList = parsed;
            setPatientsCount(parsed.length);
          } else {
            setPatientsCount(8);
          }
        }

        // Fetch live Appointments from database
        let appointmentsList: any[] = [];
        const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        try {
          appointmentsList = await receptionApi.getAppointments(
            user.hospitalCode,
          );

          // Filter appointments booked for today
          const todayAppts = appointmentsList.filter(
            (appt: any) =>
              appt.appointmentDate && appt.appointmentDate.startsWith(todayStr),
          );

          const mappedTodayAppts = todayAppts.map((appt: any) => ({
            id: appt.id.toString(),
            token: appt.tokenNo || appt.id,
            patientName: appt.patientName,
            doctorName: appt.doctorName,
            time: appt.timeSlot,
            type: appt.appointmentType,
            status: appt.status || "Confirmed",
          }));

          setAppointmentsToday(mappedTodayAppts.slice(0, 5));
          setAppointmentsCount(todayAppts.length);

          // RENDER DYNAMIC DAILY PATIENT FLOW
          const flowBuckets: Record<string, number> = {
            "8am": 0,
            "9am": 0,
            "10am": 0,
            "11am": 0,
            "12pm": 0,
            "1pm": 0,
            "2pm": 0,
            "3pm": 0,
            "4pm": 0,
            "5pm": 0,
          };

          const mapTimeToBucket = (timeStr: string): string => {
            if (!timeStr) return "10am";
            const clean = timeStr.toLowerCase().trim();
            const isPm = clean.includes("pm");
            const isAm = clean.includes("am");
            const match = clean.match(/(\d+)/);
            if (!match) return "10am";
            let hour = Number.parseInt(match[1], 10);
            if (isPm && hour < 12) hour += 12;
            if (isAm && hour === 12) hour = 0;
            if (hour <= 8) return "8am";
            if (hour === 9) return "9am";
            if (hour === 10) return "10am";
            if (hour === 11) return "11am";
            if (hour === 12) return "12pm";
            if (hour === 13) return "1pm";
            if (hour === 14) return "2pm";
            if (hour === 15) return "3pm";
            if (hour === 16) return "4pm";
            return "5pm";
          };

          todayAppts.forEach((appt: any) => {
            const bucket = mapTimeToBucket(appt.timeSlot);
            flowBuckets[bucket] = (flowBuckets[bucket] || 0) + 1;
          });

          const livePatientFlow = Object.keys(flowBuckets).map((hour) => ({
            hour,
            patients: flowBuckets[hour],
          }));

          const hasFlowData = Object.values(flowBuckets).some((v) => v > 0);
          if (hasFlowData) {
            setPatientFlow(livePatientFlow);
          } else {
            setPatientFlow(PATIENT_FLOW);
          }

          // RENDER DYNAMIC DEPARTMENT DISTRIBUTION
          const doctorDeptMap: Record<string, string> = {};
          mappedDocs.forEach((d) => {
            doctorDeptMap[d.id] = d.department;
            if (d.name) doctorDeptMap[d.name] = d.department;
          });

          const deptCounts: Record<string, number> = {
            Cardiology: 0,
            Orthopedics: 0,
            Neurology: 0,
            Pediatrics: 0,
            Surgery: 0,
          };

          appointmentsList.forEach((appt: any) => {
            let dept =
              doctorDeptMap[appt.doctorId] || doctorDeptMap[appt.doctorName];
            if (!dept) {
              const matchedDoc = mappedDocs.find(
                (d) => d.id === appt.doctorId || d.name === appt.doctorName,
              );
              if (matchedDoc) dept = matchedDoc.department;
            }
            if (dept && deptCounts[dept] !== undefined) {
              deptCounts[dept] += 1;
            } else if (dept) {
              deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            }
          });

          const hasDeptData = Object.values(deptCounts).some((v) => v > 0);
          const deptColors = [
            "#3b82f6",
            "#f97316",
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#ec4899",
            "#14b8a6",
          ];

          if (hasDeptData) {
            const liveDeptDistribution = Object.keys(deptCounts).map(
              (key, index) => ({
                name: key,
                value: deptCounts[key],
                fill: deptColors[index % deptColors.length],
              }),
            );
            setDeptDistribution(liveDeptDistribution);
          } else {
            const fallbackDeptCounts: Record<string, number> = {};
            mappedDocs.forEach((d) => {
              if (d.department) {
                fallbackDeptCounts[d.department] =
                  (fallbackDeptCounts[d.department] || 0) + 1;
              }
            });
            const hasDocDeptData = Object.values(fallbackDeptCounts).some(
              (v) => v > 0,
            );
            if (hasDocDeptData) {
              const docDeptDistribution = Object.keys(fallbackDeptCounts).map(
                (key, index) => ({
                  name: key,
                  value: fallbackDeptCounts[key],
                  fill: deptColors[index % deptColors.length],
                }),
              );
              setDeptDistribution(docDeptDistribution);
            } else {
              setDeptDistribution(DEPT_DISTRIBUTION);
            }
          }
        } catch (e) {
          console.warn("Failed to load live appointments", e);
          const savedAppts = localStorage.getItem("medicore-appointments");
          if (savedAppts) {
            const parsed = JSON.parse(savedAppts);
            setAppointmentsCount(parsed.length);
            setAppointmentsToday(parsed.slice(0, 5));
          } else {
            const fallbackAppts = mappedDocs.slice(0, 2).map((doc, idx) => ({
              id: `appt-${idx}`,
              token: idx + 1,
              patientName: idx === 0 ? "Jane Doe" : "John Smith",
              doctorName: doc.name,
              time: idx === 0 ? "09:30 AM" : "11:00 AM",
              type: "Checkup",
              status: "Confirmed",
            }));
            setAppointmentsToday(fallbackAppts);
            setAppointmentsCount(fallbackAppts.length);
          }
        }

        // Fetch live Bills & calculate Weekly Revenue from database
        try {
          const billsList = await receptionApi.getBills(user.hospitalCode);

          const weeklyRevenueMap: Record<string, number> = {
            Mon: 0,
            Tue: 0,
            Wed: 0,
            Thu: 0,
            Fri: 0,
            Sat: 0,
            Sun: 0,
          };

          const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          billsList.forEach((bill: any) => {
            if (bill.netAmount && bill.billDate) {
              const d = new Date(bill.billDate);
              const dayName = daysShort[d.getDay()];
              if (weeklyRevenueMap[dayName] !== undefined) {
                weeklyRevenueMap[dayName] += bill.netAmount;
              }
            }
          });

          const liveWeeklyRevenue = [
            { day: "Mon", revenue: weeklyRevenueMap.Mon },
            { day: "Tue", revenue: weeklyRevenueMap.Tue },
            { day: "Wed", revenue: weeklyRevenueMap.Wed },
            { day: "Thu", revenue: weeklyRevenueMap.Thu },
            { day: "Fri", revenue: weeklyRevenueMap.Fri },
            { day: "Sat", revenue: weeklyRevenueMap.Sat },
            { day: "Sun", revenue: weeklyRevenueMap.Sun },
          ];

          const hasRevenue = Object.values(weeklyRevenueMap).some((v) => v > 0);
          if (hasRevenue) {
            setWeeklyRevenue(liveWeeklyRevenue);
          } else {
            setWeeklyRevenue(WEEKLY_REVENUE);
          }
        } catch (e) {
          console.warn("Failed to load bills for dynamic revenue graph", e);
          setWeeklyRevenue(WEEKLY_REVENUE);
        }

        // Fetch live Rooms & Beds configuration from database
        try {
          const roomsRes = await apiFetch<any>("/admin/rooms", {
            params: { page: 0, size: 100 },
          });
          console.log("Rooms API Response:", roomsRes);
          const roomsList = Array.isArray(roomsRes)
            ? roomsRes
            : roomsRes && Array.isArray(roomsRes.content)
              ? roomsRes.content
              : [];
          let totalBedsCount = 0;
          let occupiedBedsCount = 0;

          roomsList.forEach((r: any) => {
            totalBedsCount += r.totalBeds || 0;
            occupiedBedsCount += (r.totalBeds || 0) - (r.availableBeds || 0);
          });

          if (totalBedsCount > 0) {
            setBedsOccupiedText(`${occupiedBedsCount}/${totalBedsCount}`);
          } else {
            setBedsOccupiedText("0/0");
          }
        } catch (e) {
          console.warn("Failed to fetch live rooms/beds dynamic statistics", e);
          setBedsOccupiedText("0/0");
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics dynamically", err);
      }
    };

    fetchDashboardData();
  }, [user?.hospitalCode]);

  return (
    <div className="space-y-6" data-ocid="admin.dashboard.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-display">
            Healthcare Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {hospitalName} — Real-time overview ·{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          data-ocid="admin.stat.total_patients"
          label="Total Patients"
          value={patientsCount}
          icon={Users}
          trend={{ value: "Dynamic roster", up: true }}
          accentColor="text-primary"
        />
        <StatCard
          data-ocid="admin.stat.appointments"
          label="Appointments Today"
          value={appointmentsToday.length}
          icon={Calendar}
          trend={{ value: `Total: ${appointmentsCount}`, up: true }}
          accentColor="text-accent"
        />
        <StatCard
          data-ocid="admin.stat.doctors"
          label="Doctors on Duty"
          value={doctors.filter((d) => d.status === "Active").length}
          icon={Stethoscope}
          trend={{ value: `${doctors.length} Registered`, up: true }}
          accentColor="text-primary"
        />
        <StatCard
          data-ocid="admin.stat.revenue"
          label="Active Receptionists"
          value={receptionists.filter((r) => r.status === "Active").length}
          icon={UserCog}
          trend={{ value: `${receptionists.length} Registered`, up: true }}
          accentColor="text-emerald-400"
        />
        <StatCard
          data-ocid="admin.stat.lab_techs"
          label="Active Lab Techs"
          value={labTechs.filter((l) => l.status === "Active").length}
          icon={FlaskConical}
          trend={{ value: `${labTechs.length} Registered`, up: true }}
          accentColor="text-sky-400"
        />
        <StatCard
          data-ocid="admin.stat.pharmacists"
          label="Active Pharmacists"
          value={pharmacists.filter((p) => p.status === "Active").length}
          icon={Pill}
          trend={{ value: `${pharmacists.length} Registered`, up: true }}
          accentColor="text-indigo-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weekly revenue bar chart */}
        <div className="xl:col-span-2 glass-elevated rounded-xl p-5 shadow-glass-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Weekly Revenue</h3>
              <p className="text-xs text-muted-foreground">
                Mon – Sun breakdown
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyRevenue} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(20,24,48,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dept distribution pie */}
        <div className="glass-elevated rounded-xl p-5 shadow-glass-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">
              Department Distribution
            </h3>
            <p className="text-xs text-muted-foreground">
              Patient distribution by dept
            </p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={deptDistribution}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {deptDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(20,24,48,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {deptDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: d.fill }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily patient flow line chart */}
      <div className="glass-elevated rounded-xl p-5 shadow-glass-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">
              Daily Patient Flow
            </h3>
            <p className="text-xs text-muted-foreground">
              Hourly patient volume today
            </p>
          </div>
          <Activity className="w-4 h-4 text-accent" />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={patientFlow}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
            />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(20,24,48,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
              formatter={(v: number) => [v, "Patients"]}
            />
            <Line
              type="monotone"
              dataKey="patients"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: "#f97316", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: appointments + doctor availability */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent appointments */}
        <div className="xl:col-span-2 glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">
                Today's Appointments
              </h3>
              <p className="text-xs text-muted-foreground">
                {appointmentsToday.length} scheduled for today
              </p>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                {["Token", "Patient", "Doctor", "Time", "Type", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointmentsToday.map((appt, i) => (
                <tr
                  key={appt.id}
                  data-ocid={`admin.appointments.item.${i + 1}`}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                    #{appt.token.toString().padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {appt.patientName}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appt.doctorName}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appt.time}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appt.type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs border ${STATUS_STYLES[appt.status] ?? ""}`}
                    >
                      {appt.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Staff Availability tabbed panel */}
        <div className="glass-elevated rounded-xl overflow-hidden shadow-glass-sm">
          <Tabs defaultValue="doctors" className="w-full">
            <div className="px-5 py-3 border-b border-border bg-muted/10">
              <TabsList className="bg-background/40 border border-border/50 grid grid-cols-4 w-full h-9 p-0.5">
                <TabsTrigger
                  value="doctors"
                  className="text-[10px] sm:text-xs font-semibold py-1 px-1"
                >
                  Doctors ({doctors.length})
                </TabsTrigger>
                <TabsTrigger
                  value="receptionists"
                  className="text-[10px] sm:text-xs font-semibold py-1 px-1"
                >
                  Recs ({receptionists.length})
                </TabsTrigger>
                <TabsTrigger
                  value="labtechs"
                  className="text-[10px] sm:text-xs font-semibold py-1 px-1"
                >
                  Lab ({labTechs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pharmacists"
                  className="text-[10px] sm:text-xs font-semibold py-1 px-1"
                >
                  Pharm ({pharmacists.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="doctors" className="m-0">
              <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
                <div className="px-5 py-2 bg-muted/20 text-[10px] text-muted-foreground font-bold tracking-wider flex items-center justify-between">
                  <span>DOCTOR ROSTER</span>
                  <span>
                    {doctors.filter((d) => d.status === "Active").length} ACTIVE
                  </span>
                </div>
                {doctors.map((doctor, i) => (
                  <div
                    key={doctor.id}
                    data-ocid={`admin.doctors.item.${i + 1}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {doctor.name.split(" ").slice(-1)[0][0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs border flex-shrink-0 ml-2 ${STATUS_STYLES[doctor.status] ?? ""}`}
                    >
                      {doctor.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="receptionists" className="m-0">
              <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
                <div className="px-5 py-2 bg-muted/20 text-[10px] text-muted-foreground font-bold tracking-wider flex items-center justify-between">
                  <span>RECEPTIONIST ROSTER</span>
                  <span>
                    {receptionists.filter((r) => r.status === "Active").length}{" "}
                    ACTIVE
                  </span>
                </div>
                {receptionists.map((rec, i) => (
                  <div
                    key={rec.id}
                    data-ocid={`admin.receptionists.item.${i + 1}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {rec.name.split(" ").slice(-1)[0][0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {rec.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rec.shift} • {rec.assignedCounter}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs border flex-shrink-0 ml-2 ${STATUS_STYLES[rec.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {rec.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="labtechs" className="m-0">
              <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
                <div className="px-5 py-2 bg-muted/20 text-[10px] text-muted-foreground font-bold tracking-wider flex items-center justify-between">
                  <span>LAB TECHNICIAN ROSTER</span>
                  <span>
                    {labTechs.filter((l) => l.status === "Active").length}{" "}
                    ACTIVE
                  </span>
                </div>
                {labTechs.map((tech, i) => (
                  <div
                    key={tech.id}
                    data-ocid={`admin.labtechs.item.${i + 1}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-sky-400">
                          {tech.name.split(" ").slice(-1)[0][0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tech.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tech.specialty} • {tech.shift}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs border flex-shrink-0 ml-2 ${STATUS_STYLES[tech.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {tech.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pharmacists" className="m-0">
              <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
                <div className="px-5 py-2 bg-muted/20 text-[10px] text-muted-foreground font-bold tracking-wider flex items-center justify-between">
                  <span>PHARMACIST ROSTER</span>
                  <span>
                    {pharmacists.filter((p) => p.status === "Active").length}{" "}
                    ACTIVE
                  </span>
                </div>
                {pharmacists.map((pharm, i) => (
                  <div
                    key={pharm.id}
                    data-ocid={`admin.pharmacists.item.${i + 1}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-400">
                          {pharm.name.split(" ").slice(-1)[0][0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {pharm.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pharm.specialty} • {pharm.shift}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs border flex-shrink-0 ml-2 ${STATUS_STYLES[pharm.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {pharm.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Beds Occupied",
            value: bedsOccupiedText,
            icon: BedDouble,
            color: "text-accent",
          },
          {
            label: "Active Roster Size",
            value: `${doctors.length + receptionists.length + labTechs.length + pharmacists.length} staff`,
            icon: Users,
            color: "text-emerald-400",
          },
          {
            label: "Total Registered Patients",
            value: patientsCount,
            icon: Users,
            color: "text-primary",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="glass rounded-xl p-4 flex items-center gap-4 shadow-glass-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold font-display ${item.color}`}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

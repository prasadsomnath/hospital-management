import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  FileText,
  FlaskConical,
  Globe,
  Heart,
  LayoutDashboard,
  Lock,
  Menu,
  Microscope,
  Moon,
  PieChart,
  Pill,
  Plus,
  Shield,
  Stethoscope,
  Sun,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

// --- UTILITY COMPONENTS ---

const CountUp = ({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
}: { end: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min(
          (timestamp - startTime) / (duration * 1000),
          1,
        );
        const currentCount = Math.floor(progress * end);

        setDisplayValue(currentCount);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setDisplayValue(end);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {end % 1 === 0 ? displayValue.toLocaleString() : displayValue.toFixed(1)}
      {suffix}
    </span>
  );
};

const MiniLineGraph = ({ color = "#047857" }) => (
  <div className="w-24 h-10 overflow-hidden">
    <svg viewBox="0 0 100 40" className="w-full h-full">
      <motion.path
        d="M0 35 Q 20 10, 40 30 T 80 15 T 100 25"
        fill="none"
        stroke={color}
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      <motion.path
        d="M0 35 Q 20 10, 40 30 T 80 15 T 100 25 V 40 H 0 Z"
        fill={`url(#grad-${color.replace("#", "")})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.2 }}
        transition={{ duration: 1, delay: 1 }}
      />
      <defs>
        <linearGradient
          id={`grad-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const CircularProgress = ({ percent, color = "#047857" }) => (
  <div className="relative w-16 h-16">
    <svg className="w-full h-full -rotate-90">
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="opacity-10"
      />
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray="176"
        initial={{ strokeDashoffset: 176 }}
        whileInView={{ strokeDashoffset: 176 - (176 * percent) / 100 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
      {percent}%
    </div>
  </div>
);

// --- DATA ---

const FEATURE_CARDS = [
  {
    icon: Users,
    title: "Patient Management",
    desc: "Digital health records, history tracking, and patient admission workflows.",
  },
  {
    icon: LayoutDashboard,
    title: "Doctor Dashboard",
    desc: "Personalized portals for clinicians with schedule and patient oversight.",
  },
  {
    icon: Calendar,
    title: "Appointment Scheduling",
    desc: "Smart booking system with automated reminders and queue management.",
  },
  {
    icon: CreditCard,
    title: "Billing & Invoicing",
    desc: "Automated billing, insurance processing, and detailed financial tracking.",
  },
  {
    icon: FlaskConical,
    title: "Laboratory Management",
    desc: "Sample tracking, digital report generation, and lab result history.",
  },
  {
    icon: Pill,
    title: "Pharmacy & Inventory",
    desc: "Real-time stock monitoring, prescription fulfillment, and expiry alerts.",
  },
  {
    icon: PieChart,
    title: "Analytics Dashboard",
    desc: "Advanced data visualization for operational and financial insights.",
  },
  {
    icon: UserCheck,
    title: "Role-Based Access",
    desc: "Granular permission layers for staff, ensuring data security and privacy.",
  },
  {
    icon: FileText,
    title: "Notifications & Reports",
    desc: "Instant alerts and comprehensive automated report generation.",
  },
];

const ROLE_CARDS = [
  {
    icon: Shield,
    role: "Admin",
    desc: "Full institutional control, resource allocation, and system configuration.",
  },
  {
    icon: Stethoscope,
    role: "Doctor",
    desc: "Clinical management, patient diagnosis, and prescription authoring.",
  },
  {
    icon: Users,
    role: "Receptionist",
    desc: "Patient registration, appointment booking, and billing initiation.",
  },
];

const WORKFLOW_STEPS = [
  { label: "Registration", icon: UserCheck },
  { label: "Appointment", icon: Calendar },
  { label: "Consultation", icon: Stethoscope },
  { label: "Billing", icon: CreditCard },
  { label: "Pharmacy", icon: Pill },
  { label: "Reports", icon: FileText },
];

const STATS = [
  {
    label: "Patients Managed",
    value: 10000,
    prefix: "",
    suffix: "K+",
    icon: Users,
  },
  {
    label: "Elite Doctors",
    value: 250,
    prefix: "",
    suffix: "+",
    icon: Stethoscope,
  },
  {
    label: "Daily Appointments",
    value: 500,
    prefix: "",
    suffix: "+",
    icon: Calendar,
  },
  { label: "System Uptime", value: 99.9, prefix: "", suffix: "%", icon: Zap },
];

export default function SuperAdminLanding() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme] = useState<"dark" | "light">("light");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const [isDemoModalOpen, setDemoModalOpen] = useState(false);
  const [demoFullName, setDemoFullName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoPhone, setDemoPhone] = useState("");
  const [demoHospital, setDemoHospital] = useState("");

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = {
      fullName: demoFullName,
      email: demoEmail,
      phone: demoPhone,
      hospitalName: demoHospital,
      role: "admin",
    };
    localStorage.setItem("demo-lead-reference", JSON.stringify(lead));
    localStorage.setItem("prefill-demo-role", "admin");
    setDemoModalOpen(false);
    navigate({ to: "/login" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const toggleTheme = () => { };

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white overflow-hidden"
        >
          {/* Ambient Background Radial Glows */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_60%)]" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none"
          />

          {/* Logo container that zooms in to fill the screen on exit */}
          <motion.div
            initial={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{
              scale: 12, // Netflix-style massive zoom
              opacity: 0,
              filter: "blur(10px)",
              transition: { duration: 0.6, ease: [0.7, 0, 0.3, 1] },
            }}
            className="flex flex-col items-center justify-center relative z-10 select-none"
          >
            {/* Letter Stagger Animation */}
            <div className="flex items-center text-4xl sm:text-6xl tracking-tight select-none font-montserrat font-black animate-pulse">
              {Array.from("HEALTHMATRIX").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{
                    opacity: 0,
                    y: 30,
                    filter: "blur(10px)",
                    scale: 0.8,
                  }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.05,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  className="text-slate-900"
                >
                  {char}
                </motion.span>
              ))}
              {Array.from("360").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{
                    opacity: 0,
                    y: 30,
                    filter: "blur(10px)",
                    scale: 0.8,
                  }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: (index + 12) * 0.05,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  className="text-emerald-600"
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Glowing underline draw */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-1 w-full max-w-[280px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-full mt-5 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            />

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
              className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-4"
            >
              {/* Initializing Healthcare Intellect */}
            </motion.p>
          </motion.div>
        </motion.div>
      ) : (
        <>
          {/* Scroll Progress Bar */}
          <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-800 origin-left z-[100]"
            style={{ scaleX }}
          />

          {/* Dynamic Background Glow */}
          <div
            className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 opacity-50 md:opacity-100"
            style={{
              background: `radial-gradient(400px at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.08), transparent)`,
            }}
          />

          {/* Background Decor */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[url('/images/medical-tech-bg.png')] bg-cover bg-center mix-blend-overlay opacity-[0.03]" />
            <div className="absolute top-[-10%] left-[-10%] w-[100%] sm:w-[60%] h-[60%] rounded-full blur-[120px] sm:blur-[180px] animate-pulse bg-emerald-500/10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[100%] sm:w-[60%] h-[60%] rounded-full blur-[120px] sm:blur-[180px] bg-teal-500/10" />
          </div>

          {/* Navigation - Floating Pill Style */}
          <nav className="fixed top-0 w-full z-50 pointer-events-none">
            <div className="mx-auto mt-2.5 sm:mt-3 px-4 sm:px-6 transition-all duration-700 pointer-events-auto">
              <div
                className={`max-w-[1440px] mx-auto transition-all duration-700 flex items-center justify-between backdrop-blur-3xl rounded-xl sm:rounded-[1.5rem] border ${theme === "dark"
                    ? "bg-[#060D17]/80 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    : "bg-white/80 border-gray-200 shadow-lg"
                  } ${isScrolled ? "py-2" : "py-3"} px-4 sm:px-8`}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:rotate-12 transition-transform duration-500">
                    <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl font-black font-montserrat tracking-tight">
                    HealthMatrix<span className="text-emerald-700">360</span>
                  </span>
                </motion.div>

                <div
                  className={`hidden lg:flex items-center gap-8 text-[10px] font-black tracking-[0.2em] uppercase ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}
                >
                  {["Features", "Platform", "Roles", "Workflow"].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.toLowerCase());
                      }}
                      className="hover:text-emerald-700 transition-all hover:scale-105"
                    >
                      {item}
                    </a>
                  ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    onClick={() => {
                      localStorage.setItem("prefill-demo-role", "admin");
                      navigate({ to: "/login" });
                    }}
                    className="hidden lg:flex bg-transparent hover:bg-emerald-500/10 font-bold px-4 h-9 rounded-lg text-[10px] border transition-all uppercase tracking-widest text-emerald-700 border-emerald-500/30 hover:border-emerald-500/80 active:scale-95"
                  >
                    Try Demo
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem("prefill-demo-role");
                      navigate({ to: "/login" });
                    }}
                    className="hidden lg:flex bg-transparent hover:bg-emerald-500/10 font-bold px-4 h-9 rounded-lg text-[10px] border transition-all uppercase tracking-widest text-gray-600 border-gray-200"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/super-admin-login" })}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg px-4 sm:px-6 h-9 sm:h-10 font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 border-b-2 border-emerald-900 text-[10px] sm:text-xs uppercase tracking-widest"
                  >
                    Get Started
                  </Button>
                  <button
                    className={`lg:hidden p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-100 border-gray-200 text-gray-600"}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <motion.div
            key="landing-content"
            initial={{ opacity: 0, filter: "blur(12px)", scale: 0.96 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            ref={containerRef}
            className="min-h-screen selection:bg-emerald-600/30 font-poppins overflow-x-hidden leading-relaxed bg-white text-[#0F172A]"
          >
            {/* 1. HERO SECTION */}
            <section className="relative pt-28 sm:pt-36 lg:pt-40 xl:pt-44 pb-6 sm:pb-8 px-6 sm:px-8 z-10 overflow-hidden">
              <div className="max-w-[1400px] mx-auto text-center relative">
                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[clamp(2rem,8vw,5.5rem)] font-black font-montserrat leading-[1] sm:leading-[0.9] tracking-tighter mb-6 sm:mb-8"
                >
                  The Intelligent <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">
                    Hospital Engine
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className={`text-[clamp(1rem,1.8vw,1.3rem)] max-w-[950px] mx-auto mb-8 sm:mb-12 leading-relaxed font-medium px-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Synchronize clinical workflows, manage multi-layered pharmacy
                  inventory, and automate patient administration with atomic
                  precision on a unified cloud interface.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-0 px-4"
                >
                  <Button
                    onClick={() => {
                      localStorage.setItem("prefill-demo-role", "admin");
                      navigate({ to: "/login" });
                    }}
                    className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-8 bg-transparent hover:bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-[2rem] font-black text-xs sm:text-base gap-4 border-2 border-emerald-500/30 hover:border-emerald-500 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)] transition-all hover:scale-105 uppercase tracking-widest"
                  >
                    Try Interactive Demo
                  </Button>
                </motion.div>
              </div>

              {/* Dashboard Preview Removed */}
            </section>

            {/* 2. ANALYTICS STATS */}
            <section
              className={`relative pt-12 pb-24 sm:pt-16 sm:pb-32 px-6 sm:px-8 lg:px-20 z-10 ${theme === "dark" ? "bg-white/[0.01]" : "bg-gray-50"}`}
            >
              <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-16">
                  {STATS.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center group"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-8 flex items-center justify-center transition-all border bg-white border-gray-200 group-hover:bg-emerald-500/10">
                        <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-700" />
                      </div>
                      <div className="text-3xl sm:text-5xl font-black font-montserrat mb-4">
                        <CountUp
                          end={stat.value}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                        />
                      </div>
                      <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-gray-400">
                        {stat.label}
                      </p>
                      <div className="mt-6 flex justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <MiniLineGraph
                          color={i % 2 === 0 ? "#047857" : "#0f766e"}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. FEATURES SECTION */}
            <section
              id="features"
              className="relative py-32 sm:py-64 px-6 sm:px-8 lg:px-20 z-10"
            >
              <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 sm:gap-12 mb-20 sm:mb-32">
                  <div className="max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 text-emerald-700 font-black text-[10px] sm:text-[12px] uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-6"
                    >
                      <Database size={16} />
                      Atomic Infrastructure
                    </motion.div>
                    <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-black font-montserrat tracking-tight leading-[1] sm:leading-[0.95] mb-8">
                      The Platform of <br className="hidden sm:block" />{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800">
                        Clinical Certainty
                      </span>
                    </h2>
                  </div>
                  <p className="text-lg sm:text-xl max-w-md font-medium leading-relaxed pb-2 border-b text-gray-600 border-gray-200">
                    Every clinical interaction is captured, validated, and
                    synchronized across your entire network.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                  {FEATURE_CARDS.map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className="group relative p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border transition-all duration-700 hover:-translate-y-3 sm:hover:-translate-y-5 shadow-2xl overflow-hidden bg-white border-gray-100 hover:border-emerald-500/30 hover:shadow-gray-200/50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 transition-all duration-700 group-hover:from-emerald-500/3" />
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 shadow-3xl border bg-gray-50 border-gray-100 group-hover:bg-emerald-600 group-hover:border-transparent">
                        <card.icon className="w-8 h-8 sm:w-10 sm:h-10 transition-all duration-700 group-hover:scale-110 text-gray-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 font-montserrat leading-tight group-hover:text-emerald-700 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed font-medium transition-colors text-gray-600 group-hover:text-gray-800">
                        {card.desc}
                      </p>
                      <div className="mt-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <div className="h-1 w-12 bg-emerald-600 rounded-full" />
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${theme === "dark" ? "text-white/30" : "text-gray-400"}`}
                        >
                          Live Analytics Available
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. ROLE-BASED */}
            <section
              id="roles"
              className="relative py-32 sm:py-64 px-6 sm:px-8 lg:px-20 z-10 transition-colors duration-700 bg-gray-50"
            >
              <div className="max-w-[1400px] mx-auto">
                <div className="text-center mb-20 sm:mb-40">
                  <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-black font-montserrat tracking-tight mb-8 leading-tight">
                    Empowering Every <br className="hidden sm:block" />{" "}
                    <span className="text-emerald-700">Medical Persona</span>
                  </h2>
                  <div className="w-24 sm:w-32 h-1.5 sm:h-2 bg-emerald-600 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-6xl mx-auto">
                  {ROLE_CARDS.map((card, i) => (
                    <motion.div
                      key={card.role}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className="relative p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border transition-all duration-700 text-center group bg-white border-gray-100 hover:border-emerald-500/50 hover:shadow-xl"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-700 group-hover:scale-125 shadow-2xl border bg-gray-50 border-gray-100 group-hover:bg-emerald-600 group-hover:border-transparent">
                        <card.icon className="w-8 h-8 sm:w-10 sm:h-10 transition-colors text-gray-400 group-hover:text-white" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 font-montserrat tracking-tight group-hover:text-emerald-700 transition-colors">
                        {card.role}
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed font-bold transition-colors text-[#94A3B8] group-hover:text-[#475569]">
                        {card.desc}
                      </p>

                      <div className="mt-8 pt-8 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-30">
                            Efficiency
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600">
                            98%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full overflow-hidden bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "98%" }}
                            transition={{ duration: 1 }}
                            className="h-full bg-emerald-600"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* 5. WORKFLOW */}
            <section
              id="workflow"
              className="relative py-32 sm:py-64 px-6 sm:px-8 lg:px-20 z-10 overflow-hidden"
            >
              <div className="max-w-[1400px] mx-auto text-center mb-20 sm:mb-40">
                <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-black font-montserrat tracking-tight mb-8 leading-[1.1]">
                  Seamless{" "}
                  <span className="text-emerald-700">Clinical Synchrony</span>
                </h2>
                <p className="text-sm sm:text-xl max-w-2xl mx-auto font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400">
                  The Path to Recovery
                </p>
              </div>

              <div className="max-w-[1500px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-10 lg:gap-0 justify-items-center relative">
                <div className="absolute top-1/2 left-[10%] w-[80%] h-1 -translate-y-1/2 z-0 hidden lg:block rounded-full bg-gray-200">
                  <motion.div
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="w-1/4 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                  />
                </div>

                {WORKFLOW_STEPS.map((step, i) => (
                  <div
                    key={step.label}
                    className="relative z-10 w-full flex flex-col items-center group"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.8 }}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2.5rem] border flex items-center justify-center mb-4 sm:mb-6 transition-all duration-700 relative group-hover:border-emerald-500 group-hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.3)] bg-white border-gray-200"
                    >
                      <div className="absolute inset-2 rounded-xl sm:rounded-[2rem] border transition-all border-gray-50 group-hover:border-emerald-500/10" />
                      <step.icon className="w-8 h-8 sm:w-12 sm:h-12 transition-all transform group-hover:scale-125 duration-700 text-gray-300 group-hover:text-emerald-600" />
                      <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-[8px] sm:text-[10px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-all bg-white border-gray-200">
                        0{i + 1}
                      </span>
                    </motion.div>
                    <p className="text-[9px] sm:text-[11px] font-black font-montserrat text-center uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all duration-700 px-2 text-gray-400 group-hover:text-gray-800">
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. PERFORMANCE SECTION */}
            <section className="relative py-16 sm:py-20 px-6 sm:px-8 lg:px-20 z-10">
              <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="space-y-12 sm:space-y-16 text-center sm:text-left">
                  <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-black font-montserrat tracking-tight leading-[1.1] sm:leading-[0.95]">
                    Architected for <br className="hidden sm:block" />{" "}
                    <span className="text-emerald-700">Global Scale</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                    {[
                      { label: "Server Response", val: "12ms", icon: Zap },
                      { label: "Data Encryption", val: "AES-256", icon: Lock },
                      { label: "Global Reach", val: "24/7", icon: Globe },
                      {
                        label: "Intelligent AI",
                        val: "Neural",
                        icon: Activity,
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border transition-all duration-500 bg-white border-gray-100 hover:border-emerald-500/30 hover:shadow-lg"
                      >
                        <div className="flex items-center gap-6 mb-8">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-emerald-600">
                            <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 transition-colors text-gray-400 group-hover:text-white" />
                          </div>
                          <div className="flex-1">
                            <MiniLineGraph color="#047857" />
                          </div>
                        </div>
                        <p className="text-3xl sm:text-4xl font-black font-montserrat tracking-tighter mb-2">
                          {stat.val}
                        </p>
                        <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <motion.div
                    initial={{ opacity: 0, rotate: -2 }}
                    whileInView={{ opacity: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                    className="relative z-10 p-6 sm:p-12 md:p-16 rounded-2xl sm:rounded-[3rem] border backdrop-blur-3xl shadow-3xl text-center sm:text-left overflow-hidden bg-white border-gray-200"
                  >
                    <div className="absolute top-[-20%] right-[-10%] opacity-5">
                      <PieChart size={300} className="text-emerald-600" />
                    </div>

                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 sm:mb-8 animate-pulse mx-auto sm:mx-0">
                      <Heart
                        size={32}
                        className="text-emerald-700 sm:size-[40px]"
                      />
                    </div>
                    <p className="text-lg sm:text-2xl md:text-3xl font-bold font-montserrat leading-tight mb-8 sm:mb-12 italic tracking-tight relative z-10">
                      "HealthMatrix360 has completely redefined our expectations
                      of what a healthcare engine can achieve. Total visibility,
                      total security."
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=cmo_thorne"
                        alt="Dr. Adrian"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] border-4 border-emerald-500/40 shadow-2xl"
                      />
                      <div className="text-center sm:text-left">
                        <p className="text-xl sm:text-2xl font-black font-montserrat">
                          Dr. Adrian Thorne
                        </p>
                        <p className="text-[9px] sm:text-xs uppercase font-black tracking-[0.3em] sm:tracking-[0.4em] mt-1 text-emerald-700">
                          Chief Medical Officer • HealthMatrix360 Global
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-gray-100 bg-white">
              {/* Main footer content */}
              <div className="w-full px-8 sm:px-14 lg:px-24 xl:px-32 pt-20 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

                  {/* Left: Brand + tagline + address */}
                  <div>
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
                        <Stethoscope className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-2xl font-black tracking-tight text-gray-900">
                        HealthMatrix<span className="text-emerald-600">360</span>
                      </span>
                    </div>

                    {/* Tagline */}
                    <p className="text-base text-gray-500 leading-relaxed mb-10 max-w-sm">
                      Intelligent hospital management platform built for modern
                      healthcare — secure, scalable, and multi-role ready.
                      Reducing reliance on fragmented systems through innovation.
                    </p>

                    {/* Company info */}
                    <div className="space-y-3 text-sm text-gray-400">
                      <p className="text-sm font-semibold text-gray-600">Skyllx Technologies</p>
                      <p>2nd Floor, Building No. 805/A, 7th Cross Rd,</p>
                      <p>above Lenskart, opp. Kotak Mahindra Bank,</p>
                      <p>BTM Layout, Bengaluru, Karnataka 560076</p>
                      <a href="tel:+919187696360" className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.28a2 2 0 011.9 1.37l.87 2.6a2 2 0 01-.45 2.05L8.5 10.06a11.04 11.04 0 005.44 5.44l1.04-1.04a2 2 0 012.05-.45l2.6.87A2 2 0 0121 16.72V19a2 2 0 01-2 2C9.16 21 3 14.84 3 7V5z" />
                        </svg>
                        +91 91876 96360
                      </a>
                      <a href="mailto:hello@skyllx.com" className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        support@healthmatrix360.com
                      </a>
                    </div>
                  </div>

                  {/* Right: Two link columns */}
                  <div className="grid grid-cols-2 gap-12">
                    {/* Product */}
                    <div>
                      <h4 className="text-xs font-black tracking-[0.2em] uppercase text-gray-400 mb-6">Product</h4>
                      <ul className="space-y-4">
                        {[
                          { label: "Overview", href: "#features" },
                          { label: "Features", href: "#features" },
                          { label: "Pricing", href: "#pricing" },
                          { label: "Sign In", href: "/login" },
                        ].map((link) => (
                          <li key={link.label}>
                            <a href={link.href} className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Legal & Support */}
                    <div>
                      <h4 className="text-xs font-black tracking-[0.2em] uppercase text-gray-400 mb-6">Legal &amp; Support</h4>
                      <ul className="space-y-4">
                        {[
                          { label: "Privacy Policy", href: "#" },
                          { label: "Terms of Service", href: "#" },
                          { label: "Contact Support", href: "tel:+919187696360" },
                          { label: "About Us", href: "#" },
                        ].map((link) => (
                          <li key={link.label}>
                            <a href={link.href} className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom bar — Skyllx branding + socials + copyright */}
              <div className="border-t border-gray-100">
                <div className="w-full px-8 sm:px-14 lg:px-24 xl:px-32 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  {/* Left: Skyllx + socials stacked */}
                  <div className="flex flex-col gap-4">
                    {/* A Product Of Skyllx */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400">A Product of</span>
                      <img src="/skyllxf.png" alt="Skyllx" className="h-12 w-auto object-contain" />
                    </div>

                    {/* Social icons */}
                    <div className="flex items-center gap-4">
                      {[
                        { label: "X (Twitter)", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", hover: "hover:text-gray-700" },
                        { label: "LinkedIn", d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", hover: "hover:text-blue-600" },
                        { label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z", hover: "hover:text-pink-500" },
                        { label: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", hover: "hover:text-blue-700" },
                      ].map((icon) => (
                        <a key={icon.label} href="#" aria-label={icon.label} className={`text-gray-400 ${icon.hover} transition-colors`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d={icon.d} />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Right: Copyright */}
                  <p className="text-xs text-gray-400">
                    © {new Date().getFullYear()} HealthMatrix360. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>

            {/* Custom Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  className="fixed inset-0 z-[60] pt-24 sm:pt-32 px-6 sm:px-12 flex flex-col gap-6 sm:gap-8 text-2xl sm:text-3xl font-bold font-montserrat uppercase tracking-tight overflow-y-auto bg-white"
                >
                  <div className="flex justify-between items-center mb-8 border-b pb-8 border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                        <Stethoscope className="text-white" />
                      </div>
                      <span className="text-2xl font-black tracking-tight">
                        HealthMatrix360
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 sm:p-3 rounded-xl bg-gray-100 transition-colors hover:bg-gray-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {["Features", "Platform", "Roles", "Workflow"].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        scrollToSection(item.toLowerCase());
                      }}
                      className="hover:text-emerald-700 border-b pb-4 border-gray-100 font-black text-gray-800"
                    >
                      {item}
                    </a>
                  ))}
                  <a
                    href="#/login"
                    onClick={(e) => {
                      e.preventDefault();
                      localStorage.removeItem("prefill-demo-role");
                      setMobileMenuOpen(false);
                      navigate({ to: "/login" });
                    }}
                    className="hover:text-emerald-700 border-b pb-4 border-gray-100 font-black text-gray-800"
                  >
                    Login
                  </a>
                  <Button
                    onClick={() => navigate({ to: "/super-admin-login" })}
                    className="mt-8 bg-emerald-700 h-12 sm:h-14 rounded-xl text-sm sm:text-base font-bold uppercase tracking-wider border-b-4 border-emerald-900 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    Get Started
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Client Reference / Contact Details Modal */}
            <AnimatePresence>
              {isDemoModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-lg p-8 sm:p-10 rounded-[2.5rem] border shadow-2xl overflow-hidden backdrop-blur-3xl ${theme === "dark"
                        ? "bg-[#060D17]/95 border-white/10 text-white"
                        : "bg-white/95 border-gray-200 text-[#0F172A]"
                      }`}
                  >
                    {/* Glossy top border light */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <button
                      onClick={() => setDemoModalOpen(false)}
                      className={`absolute top-6 right-6 p-2 rounded-xl transition-all border hover:scale-105 active:scale-95 ${theme === "dark"
                          ? "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white"
                          : "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                        }`}
                    >
                      <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">
                          Interactive Demo Access
                        </h3>
                        <p
                          className={`text-xs mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}
                        >
                          Please provide your contact details for preview
                          reference.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleDemoSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={demoFullName}
                          onChange={(e) => setDemoFullName(e.target.value)}
                          className={`w-full h-12 px-4 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${theme === "dark"
                              ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500"
                              : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500"
                            }`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">
                          Work Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="john@hospital.com"
                          value={demoEmail}
                          onChange={(e) => setDemoEmail(e.target.value)}
                          className={`w-full h-12 px-4 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${theme === "dark"
                              ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500"
                              : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500"
                            }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            value={demoPhone}
                            onChange={(e) => setDemoPhone(e.target.value)}
                            className={`w-full h-12 px-4 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${theme === "dark"
                                ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500"
                                : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500"
                              }`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">
                            Institution Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. City Clinic"
                            value={demoHospital}
                            onChange={(e) => setDemoHospital(e.target.value)}
                            className={`w-full h-12 px-4 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${theme === "dark"
                                ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500"
                                : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-500"
                              }`}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] mt-4"
                      >
                        Submit & Open Demo Login
                      </Button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

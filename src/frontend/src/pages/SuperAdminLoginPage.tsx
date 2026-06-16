import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Cpu,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Lock,
  Moon,
  Network,
  Server,
  ShieldAlert,
  Sun,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function SuperAdminLoginPage() {
  const { loginWithCredentials } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [securityStatus, setSecurityStatus] = useState("SECURE");

  useEffect(() => {
    const statuses = ["SECURE", "ENCRYPTED", "MONITORED", "ACTIVE"];
    const interval = setInterval(() => {
      setSecurityStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const success = await loginWithCredentials(email, password);
      if (success) {
        const user = useAuthStore.getState().user;
        if (user && user.role === "superAdmin") {
          navigate({ to: "/super-admin" });
        } else {
          setLoginError("UNAUTHORIZED_ACCESS_DETECTED");
          useAuthStore.getState().logout();
        }
      } else {
        setLoginError("INVALID_MASTER_KEY");
      }
    } catch (error: any) {
      setLoginError("PROTOCOL_ERROR_INITIATED");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden font-poppins selection:bg-emerald-500/30 transition-colors duration-300 relative text-slate-900 dark:text-white">
      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm backdrop-blur-md"
        title="Toggle Theme"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.button>

      {/* LEFT SIDE: CINEMATIC SECURITY CORE (60% width) */}
      <div className="hidden lg:flex lg:w-[60%] relative items-center justify-center p-20 bg-slate-100 dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-white/5 transition-colors duration-300">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          {/* Moving Grid */}
          <div
            className="absolute inset-0 opacity-[0.06] dark:opacity-[0.1] text-slate-900 dark:text-white"
            style={{
              backgroundImage:
                "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
              backgroundSize: "100px 100px",
            }}
          />
        </div>

        {/* Central Core Graphic */}
        <div className="relative z-10 w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative"
          >
            {/* Pulsing Rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute inset-0 border border-emerald-500 rounded-full blur-[1px]"
                style={{ margin: `-${i * 30}px` }}
              />
            ))}

            {/* Central Icon */}
            <div className="w-52 h-52 rounded-full bg-white dark:bg-[#060D17] border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.2)] dark:shadow-[0_0_60px_rgba(16,185,129,0.4)] relative overflow-hidden group transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent animate-pulse" />
              <Fingerprint className="w-24 h-24 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-1000" />
            </div>

            {/* Floating Data Nodes */}
            {[
              { icon: Cpu, label: "Neural Engine", top: "0%", left: "100%" },
              {
                icon: Server,
                label: "Core Database",
                top: "100%",
                left: "80%",
              },
              { icon: Network, label: "Global Sync", top: "80%", left: "-10%" },
              { icon: Globe, label: "Nexus Node", top: "-10%", left: "0%" },
            ].map((node, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                }}
                transition={{
                  duration: 5 + i,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                className="absolute flex items-center gap-3 bg-white/90 dark:bg-[#060D17]/40 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-2xl scale-90 p-3 rounded-xl transition-colors duration-300"
                style={{ top: node.top, left: node.left }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30 transition-colors">
                  <node.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 transition-colors">
                    {node.label}
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 transition-colors">
                    Status: {securityStatus}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Live Security Feed (Bottom Left) */}
        <div className="absolute bottom-10 left-10 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 opacity-50 dark:opacity-30 text-[10px] font-mono text-emerald-650 dark:text-emerald-400 transition-opacity duration-300"
            >
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>
                &gt; SECURITY_LOG_{1024 + i}: PACKET_ENCRYPTION_LAYER_{i} ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN PORTAL (40% width) */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-6 sm:p-10 lg:py-10 lg:px-16 relative z-10 bg-white dark:bg-slate-950 overflow-y-auto lg:h-screen border-l border-slate-200 dark:border-none transition-all duration-300">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[380px] sm:max-w-[400px] my-auto"
        >
          <header className="mb-4 lg:mb-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em] mb-3 lg:mb-4 transition-colors">
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Restricted Area</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter mb-2.5 font-montserrat uppercase transition-colors">
              HealthMatrix<span className="text-emerald-500">360</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm lg:text-base leading-relaxed transition-colors">
              System-level institutional management portal. Secure access only.
            </p>
          </header>

          <div className="relative group">
            {/* Subtle Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />

            <div className="relative p-6 sm:p-8 rounded-[2rem] bg-white/90 dark:bg-[#060D17]/40 border border-slate-200 dark:border-white/5 backdrop-blur-3xl shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-5 lg:mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white transition-colors">Auth Core</h3>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-1 transition-colors">
                    Multi-Layer Encryption
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 text-emerald-500 dark:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-1 transition-colors"
                  >
                    Identifier
                  </Label>
                  <div className="relative group/input">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within/input:text-emerald-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="superadmin@healthmatrix360.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-12 rounded-xl bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label
                      htmlFor="password"
                      className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] transition-colors"
                    >
                      Cipher Key
                    </Label>
                  </div>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within/input:text-emerald-500 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-12 pr-12 rounded-xl bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest text-center"
                  >
                    {loginError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] gap-3 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] border-b-2 border-emerald-700 dark:border-emerald-600"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Unlock System</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 lg:mt-6 text-center">
                <p className="text-[9px] text-slate-400 dark:text-slate-700 font-black uppercase tracking-[0.4em] leading-loose transition-colors">
                  Encrypted by HealthMatrix360 Quantum Protocol <br />
                  Status: {securityStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-6 text-center lg:text-left">
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center justify-center lg:justify-start gap-2 mx-auto lg:mx-0"
            >
              ← Back to Command Center
            </button>
          </div>
        </motion.div>
      </div>

      {/* Dynamic Security Scan Line */}
      <motion.div
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="fixed left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent z-50 pointer-events-none"
      />
    </div>
  );
}

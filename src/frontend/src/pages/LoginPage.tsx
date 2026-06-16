// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useTheme } from "@/hooks/useTheme";
// import type { UserRole } from "@/lib/types";
// import { useAuthStore } from "@/store/auth-store";
// import { useNavigate } from "@tanstack/react-router";
// import {
//   Activity,
//   ArrowLeft,
//   ArrowRight,
//   Building2,
//   ChevronRight,
//   Eye,
//   EyeOff,
//   Headset,
//   Lock,
//   Mail,
//   Microscope,
//   Moon,
//   Pill,
//   Shield,
//   ShieldCheck,
//   Stethoscope,
//   Sun,
//   Users,
// } from "lucide-react";
// import { AnimatePresence, motion } from "motion/react";
// import { useEffect, useState } from "react";

// interface RoleOption {
//   role: UserRole;
//   label: string;
//   description: string;
//   color: string;
//   icon: any;
//   activeBorderClass: string;
//   activeBgClass: string;
//   activeTextClass: string;
//   activeShadowClass: string;
//   indicatorBgClass: string;
// }

// const ROLES: RoleOption[] = [
//   {
//     role: "admin",
//     label: "Administrator",
//     description: "System Oversight",
//     color: "from-blue-500/20 to-indigo-500/20",
//     icon: ShieldCheck,
//     activeBorderClass: "border-blue-500",
//     activeBgClass: "bg-blue-500/10",
//     activeTextClass: "text-blue-400",
//     activeShadowClass: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
//     indicatorBgClass: "bg-blue-500",
//   },
//   {
//     role: "doctor",
//     label: "Doctor",
//     description: "Clinical Care",
//     color: "from-emerald-500/20 to-teal-500/20",
//     icon: Stethoscope,
//     activeBorderClass: "border-teal-500",
//     activeBgClass: "bg-teal-500/10",
//     activeTextClass: "text-teal-400",
//     activeShadowClass: "shadow-[0_0_20px_rgba(20,184,166,0.25)]",
//     indicatorBgClass: "bg-teal-500",
//   },
//   {
//     role: "receptionist",
//     label: "Receptionist",
//     description: "Patient Front-Desk",
//     color: "from-amber-500/20 to-orange-500/20",
//     icon: Headset,
//     activeBorderClass: "border-amber-500",
//     activeBgClass: "bg-amber-500/10",
//     activeTextClass: "text-amber-400",
//     activeShadowClass: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
//     indicatorBgClass: "bg-amber-500",
//   },
//   {
//     role: "pharmacist",
//     label: "Pharmacist",
//     description: "Pharmacy Management",
//     color: "from-rose-500/20 to-pink-500/20",
//     icon: Pill,
//     activeBorderClass: "border-rose-500",
//     activeBgClass: "bg-rose-500/10",
//     activeTextClass: "text-rose-400",
//     activeShadowClass: "shadow-[0_0_20px_rgba(244,63,94,0.25)]",
//     indicatorBgClass: "bg-rose-500",
//   },
//   {
//     role: "lab_technician",
//     label: "Lab Tech",
//     description: "Diagnostics & Labs",
//     color: "from-cyan-500/20 to-sky-500/20",
//     icon: Microscope,
//     activeBorderClass: "border-cyan-500",
//     activeBgClass: "bg-cyan-500/10",
//     activeTextClass: "text-cyan-400",
//     activeShadowClass: "shadow-[0_0_20px_rgba(6,182,212,0.25)]",
//     indicatorBgClass: "bg-cyan-500",
//   },
// ];

// const ROLE_REDIRECTS: Record<UserRole, string> = {
//   admin: "/admin",
//   doctor: "/doctor",
//   receptionist: "/receptionist",
//   pharmacist: "/pharmacist",
//   lab_technician: "/lab-technician",
//   superAdmin: "/super-admin",
// };

// const PARTICLE_PRESETS = [
//   { x: "10%", y: "15%", duration: 40, size: "text-lg", delay: 0 },
//   { x: "85%", y: "25%", duration: 55, size: "text-2xl", delay: 2 },
//   { x: "20%", y: "70%", duration: 48, size: "text-sm", delay: 1 },
//   { x: "75%", y: "80%", duration: 60, size: "text-xl", delay: 3 },
//   { x: "40%", y: "10%", duration: 50, size: "text-md", delay: 0.5 },
//   { x: "90%", y: "60%", duration: 42, size: "text-lg", delay: 1.5 },
//   { x: "5%", y: "45%", duration: 52, size: "text-2xl", delay: 2.5 },
//   { x: "60%", y: "85%", duration: 45, size: "text-sm", delay: 0.8 },
//   { x: "30%", y: "90%", duration: 58, size: "text-xl", delay: 4 },
//   { x: "70%", y: "5%", duration: 38, size: "text-md", delay: 1.2 },
// ];

// export default function LoginPage() {
//   const { loginWithCredentials } = useAuthStore();
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useTheme();
//   const [isDemoMode, setIsDemoMode] = useState(false);
//   const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [hospitalCode, setHospitalCode] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loginError, setLoginError] = useState("");

//   useEffect(() => {
//     const prefillRole = localStorage.getItem(
//       "prefill-demo-role",
//     ) as UserRole | null;

//     if (prefillRole) {
//       setIsDemoMode(true);
//       setSelectedRole(prefillRole);
//       setHospitalCode("HSP001");
//       setPassword("password");

//       // Select appropriate email
//       if (prefillRole === "admin") setEmail("admin@skyllx.com");
//       else if (prefillRole === "doctor") setEmail("doctor@skyllx.com");
//       else if (prefillRole === "receptionist")
//         setEmail("receptionist@skyllx.com");
//       else if (prefillRole === "pharmacist") setEmail("pharmacist@skyllx.com");
//       else if (prefillRole === "lab_technician") setEmail("lab@skyllx.com");

//       // Clean up prefill key immediately so it doesn't persist across direct visits or reloads
//       localStorage.removeItem("prefill-demo-role");
//     }
//   }, []);

//   const handleRoleSelect = (role: UserRole) => {
//     setSelectedRole(role);
//     setLoginError("");

//     if (isDemoMode) {
//       setHospitalCode("HSP001");
//       setPassword("password");
//       if (role === "admin") setEmail("admin@skyllx.com");
//       else if (role === "doctor") setEmail("doctor@skyllx.com");
//       else if (role === "receptionist") setEmail("receptionist@skyllx.com");
//       else if (role === "pharmacist") setEmail("pharmacist@skyllx.com");
//       else if (role === "lab_technician") setEmail("lab@skyllx.com");
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setLoginError("");

//     try {
//       const success = await loginWithCredentials(
//         email,
//         password,
//         hospitalCode,
//         isDemoMode,
//       );
//       if (success) {
//         const user = useAuthStore.getState().user;
//         if (user) {
//           navigate({ to: ROLE_REDIRECTS[user.role] });
//         }
//         return;
//       } else {
//         setLoginError("Invalid credentials. Please try again.");
//       }
//     } catch (error: any) {
//       setLoginError(
//         error.message || "Login failed. Please check your connection.",
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="relative min-h-screen w-full flex items-center justify-center overflow-y-auto py-8 lg:py-12 bg-slate-950 font-sans selection:bg-emerald-500/30">
//       {/* Dynamic Background */}
//       <div className="absolute inset-0 z-0">
//         <motion.div
//           animate={{
//             scale: [1.02, 1.08, 1.02],
//             x: [0, 15, -15, 0],
//             y: [0, -10, 10, 0],
//           }}
//           transition={{
//             duration: 35,
//             repeat: Number.POSITIVE_INFINITY,
//             ease: "easeInOut",
//           }}
//           className="absolute inset-0 bg-cover bg-center opacity-45 blur-md"
//           style={{
//             backgroundImage: "url(/assets/generated/green_medical_hero.png)",
//           }}
//         />
//         <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-900" />

//         {/* Floating Medical Particles */}
//         <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
//           {PARTICLE_PRESETS.map((p, i) => (
//             <motion.div
//               key={i}
//               animate={{
//                 y: [0, -45, 0],
//                 x: [0, 25, 0],
//                 rotate: [0, 360],
//               }}
//               transition={{
//                 duration: p.duration,
//                 delay: p.delay,
//                 repeat: Number.POSITIVE_INFINITY,
//                 ease: "easeInOut",
//               }}
//               className={`absolute text-emerald-500/15 font-light select-none ${p.size}`}
//               style={{ left: p.x, top: p.y }}
//             >
//               +
//             </motion.div>
//           ))}
//         </div>

//         {/* Animated Orbs */}
//         <motion.div
//           animate={{
//             scale: [1, 1.2, 1],
//             x: [0, 50, 0],
//             y: [0, -30, 0],
//           }}
//           transition={{
//             duration: 10,
//             repeat: Number.POSITIVE_INFINITY,
//             ease: "easeInOut",
//           }}
//           className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"
//         />
//         <motion.div
//           animate={{
//             scale: [1, 1.3, 1],
//             x: [0, -40, 0],
//             y: [0, 60, 0],
//           }}
//           transition={{
//             duration: 15,
//             repeat: Number.POSITIVE_INFINITY,
//             ease: "easeInOut",
//           }}
//           className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"
//         />
//       </div>

//       {/* Back Button */}
//       <motion.button
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         onClick={() => navigate({ to: "/" })}
//         className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-white/10 text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-glass-sm"
//         title="Back to Landing Page"
//       >
//         <ArrowLeft className="w-4 h-4" />
//         <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Back to Home</span>
//       </motion.button>

//       {/* Theme Toggle */}
//       <motion.button
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         onClick={toggleTheme}
//         className="fixed top-6 right-6 z-50 p-3 rounded-full glass border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
//       >
//         {theme === "dark" ? (
//           <Sun className="w-5 h-5" />
//         ) : (
//           <Moon className="w-5 h-5" />
//         )}
//       </motion.button>

//       {/* Main Container */}
//       <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
//         {/* Left Side: Brand & Value Prop */}
//         <div className="w-full lg:w-1/2 text-center lg:text-left">
//           <motion.div
//             initial={{ opacity: 0, x: -30 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.8 }}
//           >
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
//               <Activity className="w-3.5 h-3.5" />
//               <span>Hospital Intelligence Platform</span>
//             </div>

//             <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
//               Smart Care, <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300">
//                 Hospital Intellect.
//               </span>
//             </h1>

//             <p className="text-slate-400 text-lg lg:text-xl max-w-lg leading-relaxed mb-10">
//               The unified, next-generation hospital management system.
//               Streamline clinical workflows, coordinate departments, and manage
//               care with state-of-the-art precision.
//             </p>

//             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
//               {[
//                 { icon: Users, label: "Patient Care", value: "24/7" },
//                 { icon: Shield, label: "Security", value: "HIPAA" },
//                 { icon: Stethoscope, label: "Uptime", value: "99.9%" },
//               ].map((stat) => (
//                 <div key={stat.label} className="flex flex-col">
//                   <div className="flex items-center gap-2 mb-1">
//                     <stat.icon className="w-4 h-4 text-emerald-400" />
//                     <span className="text-white font-bold">{stat.value}</span>
//                   </div>
//                   <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">
//                     {stat.label}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         </div>

//         {/* Right Side: Glass Login Card */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95, y: 20 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//           className="w-full lg:w-[460px]"
//         >
//           <div className="glass-card relative overflow-hidden p-6 lg:p-8 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-3xl">
//             {/* Glossy Overlay */}
//             <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

//             <div className="relative z-10">
//               <div className="flex items-center justify-between mb-5 lg:mb-6">
//                 <div>
//                   <h2 className="text-2xl font-bold text-white tracking-tight">
//                     Welcome Back
//                   </h2>
//                   <p className="text-slate-400 text-sm">
//                     Sign in to your workspace
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
//                   <Lock className="w-6 h-6 text-emerald-400" />
//                 </div>
//               </div>

//               {/* Role Selector Grid */}
//               <div className="grid grid-cols-3 gap-2.5 mb-5 lg:mb-6">
//                 {ROLES.map((r) => (
//                   <button
//                     key={r.role}
//                     type="button"
//                     onClick={() => handleRoleSelect(r.role)}
//                     className={`group relative p-2.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 ${
//                       selectedRole === r.role
//                         ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
//                         : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
//                     }`}
//                   >
//                     <div
//                       className={`p-1.5 rounded-lg transition-colors ${
//                         selectedRole === r.role
//                           ? "text-emerald-400"
//                           : "text-slate-500 group-hover:text-slate-300"
//                       }`}
//                     >
//                       <r.icon className="w-5 h-5" />
//                     </div>
//                     <span
//                       className={`text-[10px] font-black uppercase tracking-widest ${
//                         selectedRole === r.role
//                           ? "text-emerald-400"
//                           : "text-slate-500 group-hover:text-slate-400"
//                       }`}
//                     >
//                       {r.role}
//                     </span>
//                     {selectedRole === r.role && (
//                       <motion.div
//                         layoutId="role-indicator"
//                         className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"
//                       />
//                     )}
//                   </button>
//                 ))}
//               </div>

//               <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
//                 <div className="space-y-1.5">
//                   <Label
//                     htmlFor="hospitalCode"
//                     className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
//                   >
//                     Hospital Code
//                   </Label>
//                   <div className="relative group">
//                     <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
//                     <Input
//                       id="hospitalCode"
//                       type="text"
//                       placeholder="e.g. HSP001"
//                       value={hospitalCode}
//                       onChange={(e) => setHospitalCode(e.target.value)}
//                       className="h-11 pl-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1.5">
//                   <Label
//                     htmlFor="email"
//                     className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
//                   >
//                     Work Email
//                   </Label>
//                   <div className="relative group">
//                     <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
//                     <Input
//                       id="email"
//                       type="email"
//                       placeholder="name@skyllx.com"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       className="h-11 pl-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1.5">
//                   <div className="flex items-center justify-between ml-1">
//                     <Label
//                       htmlFor="password"
//                       className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
//                     >
//                       Secret Key
//                     </Label>
//                     <button
//                       type="button"
//                       className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
//                     >
//                       Forgot?
//                     </button>
//                   </div>
//                   <div className="relative group">
//                     <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
//                     <Input
//                       id="password"
//                       type={showPassword ? "text" : "password"}
//                       placeholder="••••••••"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       className="h-11 pl-10 pr-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
//                       required
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
//                     >
//                       {showPassword ? (
//                         <EyeOff className="w-3.5 h-3.5" />
//                       ) : (
//                         <Eye className="w-3.5 h-3.5" />
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 {loginError && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center"
//                   >
//                     {loginError}
//                   </motion.div>
//                 )}

//                 <Button
//                   type="submit"
//                   disabled={isLoading}
//                   className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
//                 >
//                   {isLoading ? (
//                     <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
//                   ) : (
//                     <>
//                       <span>Enter Dashboard</span>
//                       <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//                     </>
//                   )}
//                 </Button>
//               </form>

//               {isDemoMode && (
//                 <div className="mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-white/5">
//                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3 text-center">
//                     ✨ Interactive Demo Credentials
//                   </p>
//                   <div className="grid grid-cols-2 gap-2 text-left">
//                     {[
//                       {
//                         label: "Admin",
//                         email: "admin@skyllx.com",
//                         role: "admin",
//                       },
//                       {
//                         label: "Doctor",
//                         email: "doctor@skyllx.com",
//                         role: "doctor",
//                       },
//                       {
//                         label: "Receptionist",
//                         email: "receptionist@skyllx.com",
//                         role: "receptionist",
//                       },
//                       {
//                         label: "Pharmacist",
//                         email: "pharmacist@skyllx.com",
//                         role: "pharmacist",
//                       },
//                       {
//                         label: "Lab Tech",
//                         email: "lab@skyllx.com",
//                         role: "lab_technician",
//                         span: true,
//                       },
//                     ].map((demo) => (
//                       <button
//                         key={demo.role}
//                         type="button"
//                         onClick={() => {
//                           setIsDemoMode(true);
//                           setSelectedRole(demo.role as UserRole);
//                           setHospitalCode("HSP001");
//                           setEmail(demo.email);
//                           setPassword("password");
//                         }}
//                         className={`p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col text-left active:scale-[0.98] group ${demo.span ? "col-span-2" : ""}`}
//                       >
//                         <span className="text-[10px] font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
//                           {demo.label}
//                         </span>
//                         <span className="text-[9px] text-slate-500 truncate">
//                           {demo.email} / password
//                         </span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div className="mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-white/5 text-center">
//                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1.5">
//                   Hospital Management System v2.0
//                 </p>
//                 <p className="text-[9px] text-slate-600 font-medium">
//                   Secure Enterprise Environment. All sessions are logged.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* Decorative Foreground elements */}
//       <div className="fixed bottom-10 left-10 z-20 hidden lg:block">
//         <div className="flex items-center gap-3 glass px-4 py-2 rounded-full border border-white/10">
//           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
//           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//             Server Status: Online
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import type { UserRole } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  Headset,
  Lock,
  Mail,
  Microscope,
  Moon,
  Pill,
  Shield,
  ShieldCheck,
  Stethoscope,
  Sun,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  color: string;
  icon: any;
  activeBorderClass: string;
  activeBgClass: string;
  activeTextClass: string;
  activeShadowClass: string;
  indicatorBgClass: string;
}

const ROLES: RoleOption[] = [
  {
    role: "admin",
    label: "Administrator",
    description: "System Oversight",
    color: "from-blue-500/20 to-indigo-500/20",
    icon: ShieldCheck,
    activeBorderClass: "border-blue-500",
    activeBgClass: "bg-blue-500/10",
    activeTextClass: "text-blue-400",
    activeShadowClass: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    indicatorBgClass: "bg-blue-500",
  },
  {
    role: "doctor",
    label: "Doctor",
    description: "Clinical Care",
    color: "from-emerald-500/20 to-teal-500/20",
    icon: Stethoscope,
    activeBorderClass: "border-teal-500",
    activeBgClass: "bg-teal-500/10",
    activeTextClass: "text-teal-400",
    activeShadowClass: "shadow-[0_0_20px_rgba(20,184,166,0.25)]",
    indicatorBgClass: "bg-teal-500",
  },
  {
    role: "receptionist",
    label: "Receptionist",
    description: "Patient Front-Desk",
    color: "from-amber-500/20 to-orange-500/20",
    icon: Headset,
    activeBorderClass: "border-amber-500",
    activeBgClass: "bg-amber-500/10",
    activeTextClass: "text-amber-400",
    activeShadowClass: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    indicatorBgClass: "bg-amber-500",
  },
  {
    role: "pharmacist",
    label: "Pharmacist",
    description: "Pharmacy Management",
    color: "from-rose-500/20 to-pink-500/20",
    icon: Pill,
    activeBorderClass: "border-rose-500",
    activeBgClass: "bg-rose-500/10",
    activeTextClass: "text-rose-400",
    activeShadowClass: "shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    indicatorBgClass: "bg-rose-500",
  },
  {
    role: "lab_technician",
    label: "Lab Tech",
    description: "Diagnostics & Labs",
    color: "from-cyan-500/20 to-sky-500/20",
    icon: Microscope,
    activeBorderClass: "border-cyan-500",
    activeBgClass: "bg-cyan-500/10",
    activeTextClass: "text-cyan-400",
    activeShadowClass: "shadow-[0_0_20px_rgba(6,182,212,0.25)]",
    indicatorBgClass: "bg-cyan-500",
  },
];

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  pharmacist: "/pharmacist",
  lab_technician: "/lab-technician",
  superAdmin: "/super-admin",
};

const PARTICLE_PRESETS = [
  { x: "10%", y: "15%", duration: 40, size: "text-lg", delay: 0 },
  { x: "85%", y: "25%", duration: 55, size: "text-2xl", delay: 2 },
  { x: "20%", y: "70%", duration: 48, size: "text-sm", delay: 1 },
  { x: "75%", y: "80%", duration: 60, size: "text-xl", delay: 3 },
  { x: "40%", y: "10%", duration: 50, size: "text-md", delay: 0.5 },
  { x: "90%", y: "60%", duration: 42, size: "text-lg", delay: 1.5 },
  { x: "5%", y: "45%", duration: 52, size: "text-2xl", delay: 2.5 },
  { x: "60%", y: "85%", duration: 45, size: "text-sm", delay: 0.8 },
  { x: "30%", y: "90%", duration: 58, size: "text-xl", delay: 4 },
  { x: "70%", y: "5%", duration: 38, size: "text-md", delay: 1.2 },
];

export default function LoginPage() {
  const { loginWithCredentials } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const prefillRole = localStorage.getItem(
      "prefill-demo-role",
    ) as UserRole | null;

    if (prefillRole) {
      setIsDemoMode(true);
      setSelectedRole(prefillRole);
      setHospitalCode("HSP001");
      setPassword("password");

      // Select appropriate email
      if (prefillRole === "admin") setEmail("admin@skyllx.com");
      else if (prefillRole === "doctor") setEmail("doctor@skyllx.com");
      else if (prefillRole === "receptionist")
        setEmail("receptionist@skyllx.com");
      else if (prefillRole === "pharmacist") setEmail("pharmacist@skyllx.com");
      else if (prefillRole === "lab_technician") setEmail("lab@skyllx.com");

      // Clean up prefill key immediately so it doesn't persist across direct visits or reloads
      localStorage.removeItem("prefill-demo-role");
    }
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setLoginError("");

    if (isDemoMode) {
      setHospitalCode("HSP001");
      setPassword("password");
      if (role === "admin") setEmail("admin@skyllx.com");
      else if (role === "doctor") setEmail("doctor@skyllx.com");
      else if (role === "receptionist") setEmail("receptionist@skyllx.com");
      else if (role === "pharmacist") setEmail("pharmacist@skyllx.com");
      else if (role === "lab_technician") setEmail("lab@skyllx.com");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const success = await loginWithCredentials(
        email,
        password,
        hospitalCode,
        isDemoMode,
      );
      if (success) {
        const user = useAuthStore.getState().user;
        if (user) {
          navigate({ to: ROLE_REDIRECTS[user.role] });
        }
        return;
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch (error: any) {
      setLoginError(
        error.message || "Login failed. Please check your connection.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-y-auto py-8 lg:py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-emerald-500/30 transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1.02, 1.08, 1.02],
            x: [0, 15, -15, 0],
            y: [0, -10, 10, 0],
          }}
          transition={{
            duration: 35,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-45 blur-md transition-opacity duration-300"
          style={{
            backgroundImage: "url(/assets/generated/green_medical_hero.png)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-900 transition-colors duration-300" />

        {/* Floating Medical Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {PARTICLE_PRESETS.map((p, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -45, 0],
                x: [0, 25, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute text-emerald-500/15 font-light select-none text-lg"
              style={{ left: p.x, top: p.y }}
            >
              +
            </motion.div>
          ))}
        </div>

        {/* Animated Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] transition-colors duration-300"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[120px] transition-colors duration-300"
        />
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => navigate({ to: "/" })}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm dark:shadow-glass-sm backdrop-blur-md"
        title="Back to Landing Page"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
          Back to Home
        </span>
      </motion.button>



      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left Side: Brand & Value Prop */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Activity className="w-3.5 h-3.5" />
              <span>Hospital Intelligence Platform</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-slate-800 dark:text-white leading-[1.1] tracking-tight mb-6 transition-colors duration-300">
              Smart Care, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-300">
                Hospital Intellect.
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl max-w-lg leading-relaxed mb-10 transition-colors duration-300">
              The unified, next-generation hospital management system.
              Streamline clinical workflows, coordinate departments, and manage
              care with state-of-the-art precision.
            </p>


          </motion.div>
        </div>

        {/* Right Side: Glass Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full lg:w-[460px]"
        >
          <div className="bg-white/90 dark:bg-slate-900/40 relative overflow-hidden p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-3xl transition-all duration-300">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 dark:from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5 lg:mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors duration-300">
                    Welcome Back
                  </h2>
                  <p className="text-slate-550 dark:text-slate-400 text-sm transition-colors duration-300">
                    Sign in to your workspace
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-650 dark:text-emerald-400 transition-colors duration-300">
                  <Lock className="w-6 h-6" />
                </div>
              </div>

              {/* Role Selector Grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-5 lg:mb-6">
                {ROLES.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleSelect(r.role)}
                    className={`group relative p-2.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 ${
                      selectedRole === r.role
                        ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 hover:text-slate-750 dark:hover:text-slate-350"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        selectedRole === r.role
                          ? "text-emerald-650 dark:text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      }`}
                    >
                      <r.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        selectedRole === r.role
                          ? "text-emerald-650 dark:text-emerald-400"
                          : "text-slate-500 dark:group-hover:text-slate-450"
                      }`}
                    >
                      {r.role}
                    </span>
                    {selectedRole === r.role && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"
                      />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="hospitalCode"
                    className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 transition-colors duration-300"
                  >
                    Hospital Code
                  </Label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-650 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <Input
                      id="hospitalCode"
                      type="text"
                      placeholder="e.g. HSP001"
                      value={hospitalCode}
                      onChange={(e) => setHospitalCode(e.target.value)}
                      className="h-11 pl-10 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 transition-colors duration-300"
                  >
                    Work Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-655 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@skyllx.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest ml-1 transition-colors duration-300"
                  >
                    Secret Key
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-655 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-655 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center"
                  >
                    {loginError}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-emerald-500/15 dark:shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Dashboard</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {isDemoMode && (
                <div className="mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-slate-200 dark:border-white/5">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3 text-center transition-colors duration-300">
                    ✨ Interactive Demo Credentials
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    {[
                      {
                        label: "Admin",
                        email: "admin@skyllx.com",
                        role: "admin",
                      },
                      {
                        label: "Doctor",
                        email: "doctor@skyllx.com",
                        role: "doctor",
                      },
                      {
                        label: "Receptionist",
                        email: "receptionist@skyllx.com",
                        role: "receptionist",
                      },
                      {
                        label: "Pharmacist",
                        email: "pharmacist@skyllx.com",
                        role: "pharmacist",
                      },
                      {
                        label: "Lab Tech",
                        email: "lab@skyllx.com",
                        role: "lab_technician",
                        span: true,
                      },
                    ].map((demo) => (
                      <button
                        key={demo.role}
                        type="button"
                        onClick={() => {
                          setIsDemoMode(true);
                          setSelectedRole(demo.role as UserRole);
                          setHospitalCode("HSP001");
                          setEmail(demo.email);
                          setPassword("password");
                        }}
                        className={`p-2 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col text-left active:scale-[0.98] group ${demo.span ? "col-span-2" : ""}`}
                      >
                        <span className="text-[10px] font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                          {demo.label}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 truncate">
                          {demo.email} / password
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}


            </div>
          </div>
        </motion.div>
      </div>


    </div>
  );
}

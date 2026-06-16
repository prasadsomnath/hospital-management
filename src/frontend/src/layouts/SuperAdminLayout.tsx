import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/super-admin" },
  { label: "Hospitals", icon: Building2, to: "/super-admin/hospitals" },
  { label: "Hospital Admins", icon: UserCog, to: "/super-admin/admins" },
  { label: "Analytics", icon: BarChart3, to: "/super-admin/analytics" },
  { label: "Audit Logs", icon: ClipboardList, to: "/super-admin/audit-logs" },
  { label: "User Oversight", icon: Users, to: "/super-admin/users" },
  { label: "System Config", icon: Settings, to: "/super-admin/config" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SuperAdminLayout() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchGlobalTheme = async () => {
      try {
        const config = await apiFetch<any>("/super-admin/config");
        if (config && config.theme) {
          const root = document.documentElement;
          if (config.theme === "dark") {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
          localStorage.setItem("healthmatrix360-theme", config.theme);
        }
      } catch (err) {
        console.error("Failed to load global theme config:", err);
      }
    };

    if (isAuthenticated && user?.role === "superAdmin") {
      fetchGlobalTheme();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "superAdmin") {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== "superAdmin") return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Super Admin Sidebar — distinct navy */}
      <aside
        data-ocid="super-admin.sidebar"
        className="w-64 flex flex-col flex-shrink-0 bg-[oklch(0.15_0.04_265)] border-r border-[oklch(0.25_0.04_265)]"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[oklch(0.25_0.04_265)]">
          <div className="w-9 h-9 rounded-xl bg-[oklch(0.55_0.15_265)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white font-display leading-none">
              HealthMatrix360
            </p>
            <p className="text-xs text-[oklch(0.65_0.05_265)] mt-0.5">
              Platform Admin
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-5 pb-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Activity className="w-3 h-3" />
            Super Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === item.to ||
              (item.to !== "/super-admin" && currentPath.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={`super-admin.nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-[oklch(0.55_0.15_265)]/20 text-[oklch(0.75_0.12_265)] border-l-2 border-[oklch(0.6_0.15_265)]"
                    : "text-[oklch(0.72_0.03_265)] hover:bg-[oklch(0.22_0.04_265)] hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-4 border-t border-[oklch(0.25_0.04_265)]">
          <button
            type="button"
            data-ocid="super-admin.sidebar.logout_button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-[oklch(0.72_0.03_265)] hover:bg-[oklch(0.22_0.04_265)] hover:text-white transition-smooth"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Super Admin Navbar */}
        <header
          data-ocid="super-admin.navbar"
          className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0 shadow-xs"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">
                Platform Administration
              </span>
              <Badge
                variant="outline"
                className="text-xs border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
              >
                Developer Only
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              data-ocid="super-admin.navbar.theme_toggle"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* User chip dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-ocid="super-admin.navbar.user_chip_trigger"
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-smooth text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="w-8 h-8 rounded-full bg-[oklch(0.55_0.15_265)] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user.name)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Platform Admin
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 rounded-2xl p-1.5 shadow-2xl border border-border bg-popover text-popover-foreground"
              >
                <div className="px-3 py-2 text-xs border-b border-border/50 mb-1">
                  <p className="font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-muted-foreground truncate mt-0.5">
                    Platform Admin
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-accent hover:text-accent-foreground text-rose-500 hover:text-rose-600 transition-all font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}

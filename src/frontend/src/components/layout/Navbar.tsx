import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { apiFetch } from "@/lib/api";
import { formatDisplayName } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Calendar,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Syringe,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  doctor:
    "bg-emerald-500/20 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  receptionist: "bg-accent/20 text-accent border-accent/30",
  superAdmin:
    "bg-violet-500/20 text-violet-700 border-violet-500/30 dark:text-violet-400",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getNotificationIcon(type?: string) {
  if (type === "REGISTRATION") return UserPlus;
  if (type === "LAB") return Syringe;
  if (type === "APPOINTMENT") return Calendar;
  return Bell;
}

function getNotificationIconBg(type?: string) {
  if (type === "REGISTRATION") return "bg-blue-500/10 dark:bg-blue-500/20";
  if (type === "LAB") return "bg-rose-500/10 dark:bg-rose-500/20";
  if (type === "APPOINTMENT") return "bg-emerald-500/10 dark:bg-emerald-500/20";
  return "bg-muted";
}

function getNotificationIconColor(type?: string) {
  if (type === "REGISTRATION") return "text-blue-500 dark:text-blue-400";
  if (type === "LAB") return "text-rose-500 dark:text-rose-400";
  if (type === "APPOINTMENT") return "text-emerald-500 dark:text-emerald-400";
  return "text-muted-foreground";
}

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // useEffect(() => {
  //   if (!user?.id) return;
  // 
  //   const fetchNotifications = async () => {
  //     try {
  //       const data = await apiFetch<any[]>(`/notifications/${user.id}`);
  //       if (Array.isArray(data)) {
  //         setNotifications(data);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch notifications:", err);
  //     }
  //   };
  // 
  //   fetchNotifications();
  //   const interval = setInterval(fetchNotifications, 15000);
  //   return () => clearInterval(interval);
  // }, [user?.id]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    // try {
    //   await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
    // } catch (err) {
    //   console.error("Failed to mark notification as read:", err);
    // }
  };

  const handleClearAll = async () => {
    setNotifications([]);

    // try {
    //   await apiFetch("/notifications/clear", { method: "DELETE" });
    //   toast.success("All notifications cleared");
    // } catch (err) {
    //   console.error("Failed to clear notifications:", err);
    // }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const roleLabel =
    user.role === "superAdmin"
      ? "Super Admin"
      : user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <header
      data-ocid="navbar"
      className="h-16 bg-card border-b border-border flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 shadow-xs"
    >
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground active:scale-95 transition-transform flex-shrink-0"
        aria-label="Open sidebar"
        data-ocid="navbar.menu_toggle"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-ocid="navbar.search_input"
            type="text"
            placeholder="Search patients, doctors..."
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          data-ocid="navbar.theme_toggle"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground transition-smooth"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="View notifications"
              data-ocid="navbar.notifications_button"
              className="relative text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 p-0 overflow-hidden rounded-xl border border-border shadow-lg bg-card z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    All caught up!
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    No new notifications at this time.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = getNotificationIcon(n.type);
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer outline-none hover:bg-muted/50 transition-colors focus:bg-muted/50 ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${getNotificationIconBg(n.type)} flex-shrink-0`}
                      >
                        <Icon
                          className={`w-4 h-4 ${getNotificationIconColor(n.type)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs font-bold truncate ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 self-center" />
                      )}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="navbar.user_menu"
              className="flex items-center gap-2.5 pl-2 pr-1 py-1.5 rounded-lg hover:bg-muted/50 transition-smooth"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {getInitials(formatDisplayName(user.name))}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-none">
                  {formatDisplayName(user.name)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.specialty ?? roleLabel}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-xs border ${ROLE_COLORS[user.role] ?? ""}`}
                >
                  {roleLabel}
                </Badge>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              data-ocid="navbar.profile_link"
              onClick={() => setProfileOpen(true)}
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-ocid="navbar.logout_button"
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProfileSettingsModal open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}

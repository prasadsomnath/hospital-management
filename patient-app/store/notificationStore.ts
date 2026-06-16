import { create } from "zustand";
import notificationService, { NotificationItem } from "../services/notificationService";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNotifications: (patientId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await notificationService.getNotifications(patientId);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, error: null });
    } catch (e: any) {
      set({ error: e.message || "Failed to fetch notifications list" });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      const updated = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = updated.filter((n) => !n.isRead).length;
      set({ notifications: updated, unreadCount });
    } catch (e) {
      console.log("Failed to mark single notification as read", e);
    }
  },

  markAllAsRead: async () => {
    try {
      const { notifications } = get();
      const promises = notifications
        .filter((n) => !n.isRead)
        .map((n) => notificationService.markAsRead(n.id));
      await Promise.all(promises);

      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (e) {
      console.log("Failed to mark all notifications as read", e);
    }
  },

  clearAll: async () => {
    set({ isLoading: true });
    try {
      await notificationService.clearNotifications();
      set({ notifications: [], unreadCount: 0, error: null });
    } catch (e: any) {
      set({ error: e.message || "Failed to delete notifications history" });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useNotificationStore;

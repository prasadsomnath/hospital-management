import api from "./api";
import API_ENDPOINTS from "../constants/api.endpoints";

export interface NotificationItem {
  id: string;
  type: "APPOINTMENT" | "TOKEN" | "REPORT" | "MEDICINE" | "BILL" | "DISCHARGE" | "FOLLOW_UP" | "ALERT";
  title: string;
  body: string;
  timestamp: string; // ISO
  isRead: boolean;
  screenPath?: string;
  meta?: Record<string, any>;
}

export const notificationService = {
  getNotifications: async (patientId: string): Promise<NotificationItem[]> => {
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST(patientId));
    const data = response.data;
    const rawList: any[] = Array.isArray(data) ? data : (data?.content ?? []);
    return rawList.map((n: any) => ({
      id: String(n.id || ""),
      type: n.type || "ALERT",
      title: n.title || "",
      body: n.body || n.message || "",
      timestamp: n.timestamp || n.createdAt || new Date().toISOString(),
      isRead: Boolean(n.isRead ?? n.read ?? false),
      screenPath: n.screenPath || undefined,
      meta: n.meta || undefined,
    }));
  },

  markAsRead: async (id: string): Promise<boolean> => {
    await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return true;
  },

  registerDevice: async (token: string, patientId: string): Promise<boolean> => {
    await api.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE, { token, patientId });
    return true;
  },

  clearNotifications: async (): Promise<boolean> => {
    await api.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR);
    return true;
  },
};

export default notificationService;

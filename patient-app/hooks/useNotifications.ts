import { useEffect, useCallback } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { useAuth } from "./useAuth";
import { registerForPushNotificationsAsync } from "../utils/notification.utils";

export const useNotifications = () => {
  const { patient } = useAuth();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const error = useNotificationStore((state) => state.error);

  const loadNotifications = useNotificationStore((state) => state.loadNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);

  const fetchNotifications = useCallback(async () => {
    if (patient?.id) {
      await loadNotifications(patient.id);
    }
  }, [patient?.id, loadNotifications]);

  // Handle device push registration
  const setupDevicePush = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log("Device push token successfully resolved:", token);
        // Register token with notification microservice
        const notificationService = require("../services/notificationService").default;
        await notificationService.registerDevice(token, patient.id);
      }
    } catch (e) {
      console.log("Failed to setup device push registration", e);
    }
  }, [patient?.id]);

  useEffect(() => {
    if (patient?.id) {
      fetchNotifications();
      setupDevicePush();
    }
  }, [patient?.id, fetchNotifications, setupDevicePush]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};

export default useNotifications;

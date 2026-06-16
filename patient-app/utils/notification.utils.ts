import { Platform } from "react-native";

// Lazy-loaded notifications reference
let NotificationsModule: any = null;

const getNotificationsModule = async () => {
  if (NotificationsModule) return NotificationsModule;
  try {
    const Constants = require("expo-constants").default;
    if (Constants.appOwnership === "expo") {
      console.log("[Notification Utils] Expo Go detected. Suppressing expo-notifications load to avoid SDK 53 errors.");
      return null;
    }
  } catch (e) {}

  try {
    // In Expo Go SDK 53, importing expo-notifications statically throws an error.
    // By using dynamic import and catching, we prevent the app from crashing.
    const mod = await import("expo-notifications");
    NotificationsModule = mod;
    
    // Configure notifications handler on first successful import
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      } as any),
    });
    
    return NotificationsModule;
  } catch (err) {
    console.warn("expo-notifications is not supported or failed to load in this environment (e.g. Expo Go SDK 53):", err);
    return null;
  }
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      console.log("Push notifications token registration skipped on Web");
      return null;
    }

    try {
      const Constants = require("expo-constants").default;
      if (Constants.appOwnership === "expo") {
        console.log("[Notification Utils] Returning mock push token for Expo Go environment");
        return "mock_push_token_expo_fallback";
      }
    } catch (e) {}

    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      console.log("Push notifications not supported in this environment");
      return null;
    }
    
    let token = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0D9488",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notifications!");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => {
        return { data: "mock_push_token_expo_fallback" };
      });
      token = tokenData.data || "mock_push_token_expo_fallback";
    } catch (error) {
      console.log("Error fetching expo push token, using fallback:", error);
      token = "mock_push_token_expo_fallback";
    }

    return token;
  } catch (error) {
    console.warn("Failed to register for push notifications:", error);
    return null;
  }
};

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerSeconds: number,
  data?: Record<string, any>
): Promise<string> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.log("Local notifications not supported in this environment");
    return "noop-id";
  }
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      seconds: triggerSeconds,
    } as any,
  });
};

export const scheduleDailyMedicationReminder = async (
  medicineId: string,
  medicineName: string,
  doseSlot: "morning" | "noon" | "evening" | "night",
  timeString: string // e.g. "08:00 AM" or "20:00"
): Promise<string> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.log("Local medication reminder notifications not supported in this environment");
    return "noop-med-id";
  }

  // Parse time
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  
  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Medication Reminder",
      body: `Time for ${medicineName} — ${doseSlot.charAt(0).toUpperCase() + doseSlot.slice(1)} dose.`,
      data: { medicineId, doseSlot, screen: "/prescription" },
      sound: true,
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    } as any,
  });
};

export const cancelScheduledNotification = async (notificationId: string): Promise<void> => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

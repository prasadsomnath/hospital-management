import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error("localStorage setItem failed", e);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error("localStorage getItem failed", e);
        return null;
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("localStorage removeItem failed", e);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export default storage;

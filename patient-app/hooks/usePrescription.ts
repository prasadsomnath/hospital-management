import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import prescriptionService from "../services/prescriptionService";
import { Prescription } from "../types/prescription.types";
import { useAuth } from "./useAuth";
import APP_CONFIG from "../constants/app.config";
import {
  scheduleDailyMedicationReminder,
  cancelScheduledNotification,
} from "../utils/notification.utils";

export const usePrescription = () => {
  const { patient } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [prescriptionDetail, setPrescriptionDetail] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    if (!patient?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await prescriptionService.getPrescriptions(patient.id);
      setPrescriptions(data);
      // Offline cache backup
      await AsyncStorage.setItem(
        `polyclinic_cached_rx_${patient.id}`,
        JSON.stringify(data)
      );
    } catch (e: any) {
      console.log("Failed to load online prescriptions, check offline cache", e);
      // Try load offline cache
      const cached = await AsyncStorage.getItem(`polyclinic_cached_rx_${patient?.id}`);
      if (cached) {
        setPrescriptions(JSON.parse(cached));
      } else {
        setError(e.message || "Failed to load prescriptions");
      }
    } finally {
      setIsLoading(false);
    }
  }, [patient?.id]);

  const fetchPrescriptionDetail = useCallback(async (visitId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await prescriptionService.getPrescriptionDetail(visitId);
      setPrescriptionDetail(data);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to load prescription detail");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleMedicineReminder = async (
    prescriptionId: string,
    medicineId: string,
    enabled: boolean
  ): Promise<boolean> => {
    try {
      const cachedPrefs = await AsyncStorage.getItem(APP_CONFIG.reminderPrefsKey);
      const prefs = cachedPrefs ? JSON.parse(cachedPrefs) : {};
      
      const prefKey = `${prescriptionId}_${medicineId}`;

      if (enabled) {
        // Mock default alarm times or check if defined
        const alarmIds: string[] = [];
        
        // Find prescription to schedule actual times
        const currentRx = prescriptions.find(p => p.id === prescriptionId) || prescriptionDetail;
        const medicine = currentRx?.medicines.find(m => m.id === medicineId);
        
        if (medicine) {
          const times = medicine.reminderTimes || {
            morning: "08:00 AM",
            noon: "01:30 PM",
            evening: "05:00 PM",
            night: "09:00 PM",
          };

          if (medicine.schedule.morning && times.morning) {
            const id = await scheduleDailyMedicationReminder(medicineId, medicine.name, "morning", times.morning);
            alarmIds.push(id);
          }
          if (medicine.schedule.noon && times.noon) {
            const id = await scheduleDailyMedicationReminder(medicineId, medicine.name, "noon", times.noon);
            alarmIds.push(id);
          }
          if (medicine.schedule.evening && times.evening) {
            const id = await scheduleDailyMedicationReminder(medicineId, medicine.name, "evening", times.evening);
            alarmIds.push(id);
          }
          if (medicine.schedule.night && times.night) {
            const id = await scheduleDailyMedicationReminder(medicineId, medicine.name, "night", times.night);
            alarmIds.push(id);
          }
        }
        
        prefs[prefKey] = { enabled: true, alarmIds };
      } else {
        // Cancel all active notifications for this medicine
        const existing = prefs[prefKey];
        if (existing?.alarmIds) {
          for (const alarmId of existing.alarmIds) {
            await cancelScheduledNotification(alarmId);
          }
        }
        prefs[prefKey] = { enabled: false, alarmIds: [] };
      }

      await AsyncStorage.setItem(APP_CONFIG.reminderPrefsKey, JSON.stringify(prefs));
      
      // Update local states
      const updateRxList = prescriptions.map((rx) => {
        if (rx.id === prescriptionId) {
          return {
            ...rx,
            medicines: rx.medicines.map((m) =>
              m.id === medicineId ? { ...m, reminderEnabled: enabled } : m
            ),
          };
        }
        return rx;
      });
      setPrescriptions(updateRxList);

      if (prescriptionDetail?.id === prescriptionId) {
        setPrescriptionDetail({
          ...prescriptionDetail,
          medicines: prescriptionDetail.medicines.map((m) =>
            m.id === medicineId ? { ...m, reminderEnabled: enabled } : m
          ),
        });
      }

      return true;
    } catch (e) {
      console.log("Error toggling medicine alarm", e);
      return false;
    }
  };

  return {
    prescriptions,
    prescriptionDetail,
    isLoading,
    error,
    fetchPrescriptions,
    fetchPrescriptionDetail,
    toggleMedicineReminder,
  };
};

export default usePrescription;

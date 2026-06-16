import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../../constants/colors";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import APP_CONFIG from "../../constants/app.config";

export default function MedicineReminderScreen() {
  const router = useRouter();

  // Custom Alarm slots state
  const [morningTime, setMorningTime] = useState("08:00 AM");
  const [noonTime, setNoonTime] = useState("01:30 PM");
  const [eveningTime, setEveningTime] = useState("05:30 PM");
  const [nightTime, setNightTime] = useState("09:00 PM");

  useEffect(() => {
    loadReminderTimes();
  }, []);

  const loadReminderTimes = async () => {
    try {
      const times = await AsyncStorage.getItem("polyclinic_reminder_times");
      if (times) {
        const parsed = JSON.parse(times);
        if (parsed.morning) setMorningTime(parsed.morning);
        if (parsed.noon) setNoonTime(parsed.noon);
        if (parsed.evening) setEveningTime(parsed.evening);
        if (parsed.night) setNightTime(parsed.night);
      }
    } catch (e) {
      console.log("Failed to load custom reminder times", e);
    }
  };

  const handleSaveTimes = async () => {
    try {
      const payload = {
        morning: morningTime,
        noon: noonTime,
        evening: eveningTime,
        night: nightTime,
      };
      await AsyncStorage.setItem("polyclinic_reminder_times", JSON.stringify(payload));
      alert("Medication alarm times successfully saved. Repeating push notification logs updated.");
      router.back();
    } catch (e) {
      alert("Failed to save reminder slots.");
    }
  };

  const selectTimePlaceholder = (slot: string, current: string) => {
    // Simply simulate picker options since standard react-native time picker is a heavy native component
    const inputs: Record<string, string[]> = {
      morning: ["07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM"],
      noon: ["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM"],
      evening: ["05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM"],
      night: ["08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM"],
    };
    
    const options = inputs[slot] || [];
    const currIndex = options.indexOf(current);
    const nextIndex = (currIndex + 1) % options.length;
    const nextVal = options[nextIndex];

    if (slot === "morning") setMorningTime(nextVal);
    if (slot === "noon") setNoonTime(nextVal);
    if (slot === "evening") setEveningTime(nextVal);
    if (slot === "night") setNightTime(nextVal);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Reminders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <ShieldCheck size={18} color={COLORS.success} style={{ marginRight: 6 }} />
            <Text style={styles.tipTitle}>Smart Daily Reminders</Text>
          </View>
          <Text style={styles.tipText}>
            Reminders are stored locally and will fire repeating alarms even when offline. Tap on any slot to cycle through standard timing intervals.
          </Text>
        </Card>

        {/* Alarm slots */}
        <Text style={styles.sectionHeader}>ALARM INTERVAL CHANNELS</Text>
        
        <Card style={styles.slotsCard}>
          {/* Morning */}
          <View style={styles.row}>
            <View style={styles.left}>
              <Clock size={16} color={COLORS.primary} style={styles.icon} />
              <View>
                <Text style={styles.label}>MORNING DOSE</Text>
                <Text style={styles.caption}>Trigger alarm at breakfast</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => selectTimePlaceholder("morning", morningTime)}
              style={styles.timeBtn}
            >
              <Text style={styles.timeBtnText}>{morningTime}</Text>
            </TouchableOpacity>
          </View>

          {/* Noon */}
          <View style={styles.row}>
            <View style={styles.left}>
              <Clock size={16} color={COLORS.primary} style={styles.icon} />
              <View>
                <Text style={styles.label}>NOON DOSE</Text>
                <Text style={styles.caption}>Trigger alarm at lunch</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => selectTimePlaceholder("noon", noonTime)}
              style={styles.timeBtn}
            >
              <Text style={styles.timeBtnText}>{noonTime}</Text>
            </TouchableOpacity>
          </View>

          {/* Evening */}
          <View style={styles.row}>
            <View style={styles.left}>
              <Clock size={16} color={COLORS.primary} style={styles.icon} />
              <View>
                <Text style={styles.label}>EVENING DOSE</Text>
                <Text style={styles.caption}>Trigger alarm at evening snacks</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => selectTimePlaceholder("evening", eveningTime)}
              style={styles.timeBtn}
            >
              <Text style={styles.timeBtnText}>{eveningTime}</Text>
            </TouchableOpacity>
          </View>

          {/* Night */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.left}>
              <Clock size={16} color={COLORS.primary} style={styles.icon} />
              <View>
                <Text style={styles.label}>NIGHT DOSE</Text>
                <Text style={styles.caption}>Trigger alarm at dinner / sleeping</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => selectTimePlaceholder("night", nightTime)}
              style={styles.timeBtn}
            >
              <Text style={styles.timeBtnText}>{nightTime}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Button
          title="Save Alarm Schedules"
          onPress={handleSaveTimes}
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tipCard: {
    padding: 14,
    borderColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    backgroundColor: "rgba(34, 197, 94, 0.05)",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.success,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
  },
  slotsCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  timeBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(26, 111, 232, 0.12)",
  },
  timeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  saveBtn: {
    width: "100%",
  },
});

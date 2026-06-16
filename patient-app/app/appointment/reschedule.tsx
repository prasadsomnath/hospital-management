import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Calendar } from "lucide-react-native";
import COLORS from "../../constants/colors";
import SlotPicker from "../../components/appointment/SlotPicker";
import Button from "../../components/ui/Button";
import { useAppointments } from "../../hooks/useAppointments";
import { formatLongDate } from "../../utils/date.utils";

export default function RescheduleAppointmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    appointments,
    slots,
    isLoading,
    fetchSlots,
    rescheduleAppointment,
  } = useAppointments();

  const appointment = appointments.find((a) => a.id === id);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  useEffect(() => {
    if (appointment) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
      fetchSlots(appointment.doctorId, today);
    }
  }, [appointment?.id]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot("");
    if (appointment) {
      fetchSlots(appointment.doctorId, dateStr);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot || !appointment) return;
    
    const success = await rescheduleAppointment(appointment.id, selectedDate, selectedSlot);
    if (success) {
      alert(`Successfully rescheduled appointment with ${appointment.doctorName} to ${formatLongDate(selectedDate)} at ${selectedSlot}.`);
      router.back();
    } else {
      alert("Failed to reschedule slot. Please choose another date or time.");
    }
  };

  // Generate next 7 days
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const day = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = d.getDate();
      dates.push({ iso, day, dateNum });
    }
    return dates;
  };

  const next7Days = getNext7Days();

  if (!appointment) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reschedule Slot</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.headerPadding}>
        <Text style={styles.sectionTitle}>Select New Date & Time</Text>
        <Text style={styles.docName}>Doctor: {appointment.doctorName}</Text>

        {/* Date Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
          {next7Days.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                activeOpacity={0.8}
                onPress={() => handleSelectDate(d.iso)}
                style={[styles.dateChip, isSelected && styles.dateChipActive]}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>{d.dateNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Slots picker grid */}
      <View style={styles.slotsWrap}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <SlotPicker
            slots={slots}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
          />
        )}
      </View>

      {selectedSlot ? (
        <View style={styles.nextBar}>
          <Button
            title="Reschedule Now"
            onPress={handleReschedule}
            isLoading={isLoading}
            variant="primary"
          />
        </View>
      ) : null}
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPadding: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  docName: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  dateStrip: {
    marginTop: 12,
    marginBottom: 6,
  },
  dateChip: {
    width: 50,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateDay: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  dateNum: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  dateTextActive: {
    color: COLORS.white,
  },
  slotsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nextBar: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
});

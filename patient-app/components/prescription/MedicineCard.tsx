import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pill } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import DoseSchedule from "./DoseSchedule";
import ReminderToggle from "./ReminderToggle";

interface MedicineProps {
  medicine: {
    id: string;
    name: string;
    dosage: string;
    form: "tablet" | "capsule" | "syrup" | "injection" | "ointment";
    schedule: { morning: boolean; noon: boolean; evening: boolean; night: boolean };
    durationDays: number;
    qtyToTake: string;
    instructions?: string;
    reminderEnabled: boolean;
  };
  prescriptionId: string;
  onToggleReminder: (enabled: boolean) => void;
}

export const MedicineCard: React.FC<MedicineProps> = ({
  medicine,
  prescriptionId,
  onToggleReminder,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <Pill size={16} color={COLORS.success} />
          </View>
          <View>
            <Text style={styles.name}>{medicine.name} {medicine.dosage}</Text>
            <Text style={styles.sub}>{medicine.qtyToTake} • {medicine.durationDays} days course</Text>
          </View>
        </View>
        
        {/* Medicine Alarm Toggle */}
        <ReminderToggle
          enabled={medicine.reminderEnabled}
          onToggle={onToggleReminder}
        />
      </View>

      <View style={styles.divider} />

      {/* Dose ticks */}
      <DoseSchedule schedule={medicine.schedule} />

      {medicine.instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionLabel}>Instructions: </Text>
          <Text style={styles.instructionText}>{medicine.instructions}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  instructionsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
});

export default MedicineCard;

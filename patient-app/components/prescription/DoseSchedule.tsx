import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Check, X } from "lucide-react-native";
import COLORS from "../../constants/colors";

interface DoseScheduleProps {
  schedule: {
    morning: boolean;
    noon: boolean;
    evening: boolean;
    night: boolean;
  };
}

export const DoseSchedule: React.FC<DoseScheduleProps> = ({ schedule }) => {
  const slots: Array<{ label: string; active: boolean }> = [
    { label: "Morning", active: schedule.morning },
    { label: "Noon", active: schedule.noon },
    { label: "Evening", active: schedule.evening },
    { label: "Night", active: schedule.night },
  ];

  return (
    <View style={styles.container}>
      {slots.map((s, i) => {
        const Icon = s.active ? Check : X;
        
        return (
          <View key={i} style={styles.slot}>
            <View
              style={[
                styles.circle,
                s.active ? styles.circleActive : styles.circleInactive,
              ]}
            >
              <Icon size={12} color={s.active ? COLORS.success : COLORS.textSecondary} strokeWidth={2.5} />
            </View>
            <Text style={[styles.label, s.active ? styles.labelActive : styles.labelInactive]}>
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  slot: {
    alignItems: "center",
    flex: 1,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 6,
  },
  circleActive: {
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderColor: COLORS.success,
  },
  circleInactive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
  labelActive: {
    color: COLORS.textPrimary,
  },
  labelInactive: {
    color: COLORS.textSecondary,
  },
});

export default DoseSchedule;

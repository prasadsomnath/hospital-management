import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import COLORS from "../../constants/colors";

interface StatusChipProps {
  status: string;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, style }) => {
  const getStyleAndLabel = (): { bg: string; text: string; label: string } => {
    const s = typeof status === "string" ? status.toLowerCase() : "";
    const displayLabel = status || "";
    
    switch (s) {
      case "confirmed":
      case "ready":
      case "paid":
        return { bg: "rgba(16, 185, 129, 0.08)", text: COLORS.success, label: displayLabel };
      case "pending":
      case "unpaid":
      case "yellow":
        return { bg: "rgba(245, 158, 11, 0.08)", text: COLORS.warning, label: displayLabel };
      case "processing":
      case "blue":
        return { bg: "rgba(13, 148, 136, 0.08)", text: COLORS.primary, label: displayLabel };
      case "danger":
      case "cancelled":
      case "overdue":
      case "unconfirmed":
        return { bg: "rgba(244, 63, 94, 0.08)", text: COLORS.danger, label: displayLabel };
      case "examined":
        return { bg: "rgba(71, 85, 105, 0.08)", text: COLORS.textSecondary, label: "Examined" };
      default:
        return { bg: "rgba(71, 85, 105, 0.08)", text: COLORS.textSecondary, label: displayLabel };
    }
  };

  const { bg, text, label } = getStyleAndLabel();

  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default StatusChip;

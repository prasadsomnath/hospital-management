import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import COLORS from "../../constants/colors";

interface BadgeProps {
  label: string;
  variant?: "primary" | "success" | "warning" | "danger" | "accent" | "muted";
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = "primary", style }) => {
  const getBadgeColors = (): { bg: string; text: string } => {
    switch (variant) {
      case "primary":
        return { bg: COLORS.primaryLight, text: COLORS.primary };
      case "success":
        return { bg: "rgba(34, 197, 94, 0.12)", text: COLORS.success };
      case "warning":
        return { bg: "rgba(245, 158, 11, 0.12)", text: COLORS.warning };
      case "danger":
        return { bg: "rgba(239, 68, 68, 0.12)", text: COLORS.danger };
      case "accent":
        return { bg: "rgba(249, 115, 22, 0.12)", text: COLORS.accent };
      case "muted":
      default:
        return { bg: COLORS.background, text: COLORS.textSecondary };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

export default Badge;

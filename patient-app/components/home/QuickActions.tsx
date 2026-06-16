import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Calendar, FileText, Pill, CreditCard } from "lucide-react-native";
import COLORS from "../../constants/colors";

interface QuickActionsProps {
  onActionPress: (route: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionPress }) => {
  const actions = [
    {
      label: "Book Appointment",
      icon: Calendar,
      color: COLORS.primary,
      bgColor: "rgba(13, 148, 136, 0.06)",
      route: "/appointment/book",
    },
    {
      label: "My Reports",
      icon: FileText,
      color: "#8B5CF6", // Soft Royal Purple
      bgColor: "rgba(139, 92, 246, 0.06)",
      route: "/reports",
    },
    {
      label: "Prescriptions",
      icon: Pill,
      color: COLORS.success,
      bgColor: "rgba(16, 185, 129, 0.06)",
      route: "/prescription",
    },
    {
      label: "My Bills",
      icon: CreditCard,
      color: COLORS.accent,
      bgColor: "rgba(249, 115, 22, 0.06)",
      route: "/billing",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              style={styles.card}
              onPress={() => onActionPress(act.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: act.bgColor }]}>
                <Icon size={24} color={act.color} strokeWidth={2.2} />
              </View>
              <Text style={styles.label}>{act.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.02), 0 2px 4px -2px rgba(15, 23, 42, 0.02)",
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.7)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});

export default QuickActions;

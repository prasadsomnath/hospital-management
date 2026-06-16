import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Bell, BellOff } from "lucide-react-native";
import COLORS from "../../constants/colors";

interface ReminderToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ReminderToggle: React.FC<ReminderToggleProps> = ({ enabled, onToggle }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onToggle(!enabled)}
      style={[
        styles.container,
        enabled ? styles.containerActive : styles.containerInactive,
      ]}
    >
      {enabled ? (
        <View style={styles.row}>
          <Bell size={13} color={COLORS.primary} style={styles.icon} />
          <Text style={styles.textActive}>Reminder ON</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <BellOff size={13} color={COLORS.textSecondary} style={styles.icon} />
          <Text style={styles.textInactive}>Set Reminder</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  containerActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "rgba(26, 111, 232, 0.15)",
  },
  containerInactive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 4,
  },
  textActive: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  textInactive: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});

export default ReminderToggle;

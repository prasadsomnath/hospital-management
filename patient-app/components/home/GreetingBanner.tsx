import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Bell } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Avatar from "../ui/Avatar";
import { getGreeting } from "../../utils/date.utils";

interface GreetingBannerProps {
  firstName: string;
  lastName: string;
  patientNo: string;
  notificationCount: number;
  onProfilePress: () => void;
  onNotificationsPress: () => void;
}

export const GreetingBanner: React.FC<GreetingBannerProps> = ({
  firstName,
  lastName,
  patientNo,
  notificationCount,
  onProfilePress,
  onNotificationsPress,
}) => {
  const greetingText = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity activeOpacity={0.7} onPress={onProfilePress} style={styles.avatarWrap}>
          <Avatar firstName={firstName} lastName={lastName} size={44} />
        </TouchableOpacity>
        <View>
          <Text style={styles.greeting}>{greetingText},</Text>
          <Text style={styles.name}>{firstName} 👋</Text>
          <Text style={styles.patientNo}>ID: {patientNo}</Text>
        </View>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={onNotificationsPress} style={styles.bellWrap}>
        <Bell size={24} color={COLORS.textPrimary} strokeWidth={2} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 16 : 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.02), 0 2px 4px -2px rgba(15, 23, 42, 0.02)",
      },
    }),
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: 12,
  },
  greeting: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  patientNo: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  bellWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "900",
  },
});

export default GreetingBanner;

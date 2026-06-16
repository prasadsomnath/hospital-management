import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Calendar, Clock, ChevronRight } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import { formatDate } from "../../utils/date.utils";

interface UpcomingAppointmentCardProps {
  appointment?: {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    tokenNo: string;
    status: "Confirmed" | "Pending" | "Examined" | "Cancelled";
  };
  onPress: () => void;
  onBookPress: () => void;
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({
  appointment,
  onPress,
  onBookPress,
}) => {
  if (!appointment) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onBookPress} style={styles.container}>
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Calendar size={20} color={COLORS.primary} strokeWidth={2.2} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.emptyTitle}>Stay on Track</Text>
              <Text style={styles.emptyText}>No upcoming appointments scheduled</Text>
            </View>
          </View>
          <View style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>Book Now</Text>
            <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.doctorName}>{appointment.doctorName}</Text>
            <Text style={styles.specialty}>{appointment.specialty}</Text>
          </View>
          <Badge label={appointment.status} variant={appointment.status === "Confirmed" ? "success" : "warning"} />
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.row}>
            <View style={styles.item}>
              <Calendar size={14} color={COLORS.textSecondary} style={styles.icon} />
              <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
            </View>
            <View style={[styles.item, { marginLeft: 16 }]}>
              <Clock size={14} color={COLORS.textSecondary} style={styles.icon} />
              <Text style={styles.detailText}>{appointment.time}</Text>
            </View>
          </View>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>TOKEN</Text>
            <Text style={styles.tokenNo}>{appointment.tokenNo}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  card: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  specialty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(226, 232, 240, 0.6)",
    marginVertical: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  tokenContainer: {
    alignItems: "center",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
  },
  tokenLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tokenNo: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 1,
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  emptyContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emptyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    marginRight: 2,
  },
});

export default UpcomingAppointmentCard;

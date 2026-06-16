import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, Clock, MessageSquare } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import StatusChip from "../ui/StatusChip";
import { formatDate } from "../../utils/date.utils";

interface AppointmentHistoryCardProps {
  appointment: {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    tokenNo: string;
    status: "Confirmed" | "Pending" | "Examined" | "Cancelled";
    notes?: string;
  };
  onPress?: () => void;
}

export const AppointmentHistoryCard: React.FC<AppointmentHistoryCardProps> = ({
  appointment,
  onPress,
}) => {
  const isCancelled = appointment.status === "Cancelled";

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={styles.container}
    >
      <Card style={[styles.card, isCancelled && styles.cancelledCard]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.doctorName, isCancelled && styles.greyedText]}>
              {appointment.doctorName}
            </Text>
            <Text style={styles.specialty}>{appointment.specialty}</Text>
          </View>
          <StatusChip status={appointment.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.item}>
            <Calendar size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
          </View>
          <View style={[styles.item, { marginLeft: 16 }]}>
            <Clock size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailText}>{appointment.time}</Text>
          </View>
          <View style={[styles.item, { marginLeft: "auto" }]}>
            <Text style={styles.tokenLabel}>TOKEN </Text>
            <Text style={styles.tokenNo}>{appointment.tokenNo}</Text>
          </View>
        </View>

        {appointment.notes && (
          <View style={styles.notesContainer}>
            <MessageSquare size={13} color={COLORS.textSecondary} style={styles.notesIcon} />
            <Text style={styles.notesText} numberOfLines={1}>
              {appointment.notes}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
  },
  cancelledCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  greyedText: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  specialty: {
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
  detailsRow: {
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
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  tokenNo: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  notesIcon: {
    marginRight: 6,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    fontStyle: "italic",
  },
});

export default AppointmentHistoryCard;

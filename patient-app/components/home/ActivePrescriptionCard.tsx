import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pill, ArrowRight, Clock } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";

interface ActivePrescriptionCardProps {
  prescription?: {
    visitId: string;
    doctorName: string;
    date: string;
    medicineCount: number;
    nextDoseTime?: string;
    nextDoseName?: string;
  };
  onPress: () => void;
}

export const ActivePrescriptionCard: React.FC<ActivePrescriptionCardProps> = ({
  prescription,
  onPress,
}) => {
  if (!prescription) return null;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Pill size={18} color={COLORS.success} style={styles.titleIcon} />
            <Text style={styles.titleText}>Active Prescriptions</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.viewAll}>
            <Text style={styles.viewAllText}>View details</Text>
            <ArrowRight size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.meta}>
            Prescribed by <Text style={styles.bold}>{prescription.doctorName}</Text> on {prescription.date}
          </Text>
          <Text style={styles.sub}>
            Contains <Text style={styles.successText}>{prescription.medicineCount} active medicines</Text>
          </Text>
        </View>

        {prescription.nextDoseTime && prescription.nextDoseName && (
          <View style={styles.doseAlert}>
            <Clock size={14} color={COLORS.success} style={styles.clockIcon} />
            <Text style={styles.doseAlertText}>
              Next Dose: <Text style={styles.bold}>{prescription.nextDoseName}</Text> at {prescription.nextDoseTime}
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  card: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    marginRight: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    marginRight: 2,
  },
  body: {
    marginBottom: 12,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  successText: {
    color: COLORS.success,
    fontWeight: "700",
  },
  doseAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.15)",
  },
  clockIcon: {
    marginRight: 6,
  },
  doseAlertText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
});

export default ActivePrescriptionCard;

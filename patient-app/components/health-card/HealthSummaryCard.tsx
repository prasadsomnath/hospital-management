import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Heart, Activity, Calendar, Shield } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import { formatDate } from "../../utils/date.utils";

interface HealthSummaryCardProps {
  bloodGroup?: string;
  lastVisitDate?: string;
  allergies?: string;
  chronic?: string;
  insurance?: string;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  bloodGroup = "B+",
  lastVisitDate = "2026-05-20",
  allergies = "Dust allergy, Penicillin",
  chronic = "None",
  insurance = "Star Health Insurance",
}) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Medical Record Summary</Text>
      
      <View style={styles.divider} />

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Heart size={16} color={COLORS.danger} style={styles.icon} />
          <View>
            <Text style={styles.label}>BLOOD GROUP</Text>
            <Text style={styles.val}>{bloodGroup}</Text>
          </View>
        </View>

        <View style={styles.cell}>
          <Calendar size={16} color={COLORS.primary} style={styles.icon} />
          <View>
            <Text style={styles.label}>LAST CLINIC VISIT</Text>
            <Text style={styles.val}>{formatDate(lastVisitDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dashedDivider} />

      <View style={styles.row}>
        <Shield size={14} color={COLORS.success} style={styles.rowIcon} />
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Known Allergies</Text>
          <Text style={styles.rowValue}>{allergies}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Activity size={14} color={COLORS.accent} style={styles.rowIcon} />
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Chronic Conditions</Text>
          <Text style={styles.rowValue}>{chronic}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Shield size={14} color={COLORS.primary} style={styles.rowIcon} />
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Insurance Details</Text>
          <Text style={styles.rowValue}>{insurance}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  val: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  dashedDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  rowIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
});

export default HealthSummaryCard;

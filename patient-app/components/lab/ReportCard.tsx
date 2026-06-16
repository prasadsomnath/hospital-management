import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FlaskConical, Image, ChevronRight, Eye } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import StatusChip from "../ui/StatusChip";
import { formatDate } from "../../utils/date.utils";

interface ReportCardProps {
  report: {
    id: string;
    testName: string;
    serviceType: string;
    orderDate: string;
    status: "Pending" | "Processing" | "Ready";
  };
  onPress: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
  const IsLab = report.serviceType === "Lab";
  const Icon = IsLab ? FlaskConical : Image;
  const isReady = report.status === "Ready";

  return (
    <TouchableOpacity
      activeOpacity={isReady ? 0.9 : 1}
      onPress={onPress}
      disabled={!isReady}
      style={styles.container}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.left}>
            <View style={[styles.iconWrap, { backgroundColor: IsLab ? COLORS.primaryLight : "rgba(139, 92, 246, 0.08)" }]}>
              <Icon size={18} color={IsLab ? COLORS.primary : "#8B5CF6"} />
            </View>
            <View style={styles.meta}>
              <Text style={styles.name}>{report.testName}</Text>
              <Text style={styles.sub}>{report.serviceType} • Ordered on {formatDate(report.orderDate)}</Text>
            </View>
          </View>
          <StatusChip status={report.status} />
        </View>

        {isReady && (
          <View style={styles.footer}>
            <View style={styles.viewBtn}>
              <Eye size={14} color={COLORS.primary} style={styles.btnIcon} />
              <Text style={styles.btnText}>View Lab Report</Text>
            </View>
            <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 12,
    marginTop: 14,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  btnIcon: {
    marginRight: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default ReportCard;

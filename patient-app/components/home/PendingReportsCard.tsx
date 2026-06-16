import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FileText, ArrowRight, FlaskConical, Image } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import StatusChip from "../ui/StatusChip";

interface PendingReportsCardProps {
  pendingCount: number;
  reports: Array<{
    id: string;
    testName: string;
    serviceType: "Lab" | "X-Ray" | "USG" | "CT Scan" | "ECG" | "Others";
    date: string;
    status: "Pending" | "Processing" | "Ready";
  }>;
  onPress: () => void;
}

export const PendingReportsCard: React.FC<PendingReportsCardProps> = ({
  pendingCount,
  reports = [],
  onPress,
}) => {
  if (!reports || reports.length === 0) return null;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <FileText size={18} color={COLORS.primary} style={styles.titleIcon} />
            <Text style={styles.titleText}>Lab & Radiology Reports</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.viewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {pendingCount > 0 && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              🔥 {pendingCount} {pendingCount === 1 ? "report is" : "reports are"} ready to view!
            </Text>
          </View>
        )}

        <View style={styles.list}>
          {reports.slice(0, 2).map((item, index) => {
            const IsLab = item.serviceType === "Lab";
            const Icon = IsLab ? FlaskConical : Image;
            
            return (
              <View key={item.id} style={[styles.item, index === 0 && styles.firstItem]}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconWrap}>
                    <Icon size={16} color={COLORS.textSecondary} />
                  </View>
                  <View style={styles.meta}>
                    <Text numberOfLines={1} style={styles.testName}>{item.testName}</Text>
                    <Text style={styles.date}>{item.serviceType} • {item.date}</Text>
                  </View>
                </View>
                <StatusChip status={item.status} />
              </View>
            );
          })}
        </View>
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
  banner: {
    backgroundColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  list: {
    width: "100%",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  firstItem: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  meta: {
    flex: 1,
  },
  testName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default PendingReportsCard;

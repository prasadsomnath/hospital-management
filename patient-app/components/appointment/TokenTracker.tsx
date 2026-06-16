import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Users } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";

interface TokenTrackerProps {
  currentlyServing: number;
  yourToken: number;
  positionInQueue: number;
  totalInQueue: number;
  isLoading?: boolean;
}

export const TokenTracker: React.FC<TokenTrackerProps> = ({
  currentlyServing,
  yourToken,
  positionInQueue,
  totalInQueue,
  isLoading = false,
}) => {
  // Compute progress bar percentage
  const progress = totalInQueue > 0 ? (currentlyServing / yourToken) * 100 : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 100);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Users size={16} color={COLORS.primary} style={styles.icon} />
          <Text style={styles.title}>Live Token Queue Tracker</Text>
        </View>
        {isLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.numLabel}>CURRENTLY SERVING</Text>
          <Text style={styles.currentNum}>{currentlyServing}</Text>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.gridCell}>
          <Text style={styles.numLabel}>YOUR TOKEN</Text>
          <Text style={styles.yourNum}>{yourToken}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressClamped}%` }]} />
        </View>
      </View>

      <Text style={styles.footerText}>
        👉 You are at <Text style={styles.bold}>position {positionInQueue}</Text> of {totalInQueue} patients in the queue.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 12,
  },
  gridCell: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1.5,
    height: 40,
    backgroundColor: COLORS.border,
  },
  numLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  currentNum: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.accent,
    marginTop: 2,
  },
  yourNum: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    width: "100%",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: "center",
    fontWeight: "500",
  },
  bold: {
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default TokenTracker;

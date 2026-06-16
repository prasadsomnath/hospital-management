import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react-native";
import COLORS from "../../constants/colors";
import RangeIndicator from "./RangeIndicator";

interface ResultRowProps {
  testName: string;
  result: number;
  unit: string;
  refRangeStart: number;
  refRangeEnd: number;
  status: "Normal" | "High" | "Low";
}

export const ResultRow: React.FC<ResultRowProps> = ({
  testName,
  result,
  unit,
  refRangeStart,
  refRangeEnd,
  status,
}) => {
  const isNormal = status === "Normal";
  const isHigh = status === "High";

  const getStatusDetails = () => {
    switch (status) {
      case "Normal":
        return { color: COLORS.success, icon: CheckCircle2, text: "Normal" };
      case "High":
        return { color: COLORS.warning, icon: AlertTriangle, text: "High" };
      case "Low":
      default:
        return { color: COLORS.danger, icon: AlertOctagon, text: "Low" };
    }
  };

  const { color: statusColor, icon: StatusIcon, text: statusText } = getStatusDetails();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={styles.testName}>{testName}</Text>
          <Text style={styles.rangeText}>Ref Range: {refRangeStart}–{refRangeEnd} {unit}</Text>
        </View>
        
        <View style={styles.right}>
          <View style={styles.valueRow}>
            <Text style={[styles.resultVal, !isNormal && { color: statusColor }]}>{result}</Text>
            <Text style={styles.unitText}> {unit}</Text>
          </View>
          <View style={styles.statusWrap}>
            <StatusIcon size={12} color={statusColor} style={styles.statusIcon} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
      </View>

      {/* Visual Range Indicator Bar */}
      <RangeIndicator
        value={result}
        start={refRangeStart}
        end={refRangeEnd}
        status={status}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  testName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  rangeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  right: {
    alignItems: "flex-end",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  resultVal: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

export default ResultRow;

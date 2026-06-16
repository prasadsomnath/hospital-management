import React from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import COLORS from "../../constants/colors";

interface RangeIndicatorProps {
  value: number;
  start: number;
  end: number;
  status: "Normal" | "High" | "Low";
}

export const RangeIndicator: React.FC<RangeIndicatorProps> = ({
  value,
  start,
  end,
  status,
}) => {
  // Compute percentage positions for rendering
  // We want to scale value relative to [start * 0.7, end * 1.3] so the dot stays in bounds
  const minBound = start * 0.6;
  const maxBound = end * 1.4;
  const range = maxBound - minBound;

  const dotPosition = range > 0 ? ((value - minBound) / range) * 100 : 50;
  const dotPositionClamped = Math.min(Math.max(dotPosition, 2), 98);

  const startPercent = range > 0 ? ((start - minBound) / range) * 100 : 30;
  const endPercent = range > 0 ? ((end - minBound) / range) * 100 : 70;

  const isLow = status === "Low";
  const isHigh = status === "High";

  const getMarkerColor = () => {
    if (isLow) return COLORS.danger;
    if (isHigh) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {/* Background track representing abnormal bounds */}
        <View style={styles.abnormalTrack} />
        
        {/* Highlighted normal range track (Green Zone) */}
        <View
          style={[
            styles.normalTrack,
            {
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            },
          ]}
        />

        {/* Dynamic Patient Value Indicator Dot */}
        <View
          style={[
            styles.valueDot,
            {
              left: `${dotPositionClamped}%`,
              backgroundColor: getMarkerColor(),
            },
          ]}
        >
          {/* Inner ring */}
          <View style={styles.valueDotInner} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 18,
    justifyContent: "center",
    width: "100%",
    marginTop: 6,
  },
  barContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    width: "100%",
    position: "relative",
  },
  abnormalTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: 3,
  },
  normalTrack: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(34, 197, 94, 0.22)",
    borderRadius: 3,
  },
  valueDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -4,
    marginLeft: -7,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1.5px 3px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  valueDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
});

export default RangeIndicator;

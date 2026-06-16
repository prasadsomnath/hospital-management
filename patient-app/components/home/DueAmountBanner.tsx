import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle, CreditCard } from "lucide-react-native";
import COLORS from "../../constants/colors";
import { formatCurrency } from "../../utils/format.utils";

interface DueAmountBannerProps {
  dueAmount: number;
  onPayPress: () => void;
}

export const DueAmountBanner: React.FC<DueAmountBannerProps> = ({ dueAmount, onPayPress }) => {
  if (dueAmount <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <AlertCircle size={18} color={COLORS.accent} style={styles.icon} />
        <Text style={styles.text}>
          You have <Text style={styles.bold}>{formatCurrency(dueAmount)}</Text> pending dues.
        </Text>
      </View>
      <TouchableOpacity activeOpacity={0.8} onPress={onPayPress} style={styles.payBtn}>
        <CreditCard size={13} color={COLORS.white} style={styles.payIcon} />
        <Text style={styles.payBtnText}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(249, 115, 22, 0.06)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.12)",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  bold: {
    fontWeight: "800",
    color: COLORS.accent,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payIcon: {
    marginRight: 4,
  },
  payBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
});

export default DueAmountBanner;

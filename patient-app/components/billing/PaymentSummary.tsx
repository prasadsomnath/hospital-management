import React from "react";
import { View, Text, StyleSheet } from "react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import { formatCurrency } from "../../utils/format.utils";

interface PaymentSummaryProps {
  subtotal: number;
  discount: number;
  companyShare: number;
  total: number;
  paid: number;
  due: number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  subtotal,
  discount,
  companyShare,
  total,
  paid,
  due,
}) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Payment Summary</Text>
      
      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.val}>{formatCurrency(subtotal)}</Text>
      </View>

      {discount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Discount</Text>
          <Text style={[styles.val, styles.discountText]}>-{formatCurrency(discount)}</Text>
        </View>
      )}

      {companyShare > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Sponsor</Text>
          <Text style={[styles.val, styles.discountText]}>-{formatCurrency(companyShare)}</Text>
        </View>
      )}

      <View style={styles.dashedLine} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
        <Text style={styles.totalVal}>{formatCurrency(total)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.paidLabel}>PAID AMOUNT</Text>
        <Text style={styles.paidVal}>{formatCurrency(paid)}</Text>
      </View>

      <View style={styles.dashedLine} />

      <View style={styles.row}>
        <Text style={styles.dueLabel}>DUE OUTSTANDING</Text>
        <Text style={[styles.dueVal, due > 0 ? styles.dueActive : styles.dueSettled]}>
          {formatCurrency(due)}
        </Text>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  val: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  discountText: {
    color: COLORS.success,
  },
  dashedLine: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  paidLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.success,
  },
  paidVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.success,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  dueVal: {
    fontSize: 15,
    fontWeight: "800",
  },
  dueActive: {
    color: COLORS.danger,
  },
  dueSettled: {
    color: COLORS.success,
  },
});

export default PaymentSummary;

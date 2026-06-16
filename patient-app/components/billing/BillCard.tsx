import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FileSpreadsheet, CreditCard, ChevronRight } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import StatusChip from "../ui/StatusChip";
import { formatDate } from "../../utils/date.utils";
import { formatCurrency } from "../../utils/format.utils";

interface BillCardProps {
  bill: {
    id: string;
    billNo: string;
    date: string;
    billType: "OPD" | "IPD" | "Lab" | "Services";
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: "Paid" | "Partially Paid" | "Unpaid";
  };
  onPress: () => void;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onPress }) => {
  const isPartiallyPaid = bill.dueAmount > 0 && bill.paidAmount > 0;
  const isUnpaid = bill.dueAmount === bill.totalAmount;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.left}>
            <View style={styles.iconCircle}>
              <FileSpreadsheet size={16} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.billNo}>{bill.billNo}</Text>
              <Text style={styles.sub}>{bill.billType} • {formatDate(bill.date)}</Text>
            </View>
          </View>
          <StatusChip status={bill.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.label}>TOTAL BILL</Text>
            <Text style={styles.val}>{formatCurrency(bill.totalAmount)}</Text>
          </View>

          <View style={styles.cell}>
            <Text style={styles.label}>PAID</Text>
            <Text style={[styles.val, styles.paidColor]}>{formatCurrency(bill.paidAmount)}</Text>
          </View>

          <View style={styles.cell}>
            <Text style={styles.label}>DUE BALANCE</Text>
            <Text style={[styles.val, bill.dueAmount > 0 ? styles.dueColor : styles.paidColor]}>
              {formatCurrency(bill.dueAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.viewReceipt}>
            <CreditCard size={13} color={COLORS.primary} style={styles.footerIcon} />
            <Text style={styles.footerText}>View invoice details</Text>
          </View>
          <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
        </View>
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
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  billNo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    marginBottom: 14,
  },
  cell: {
    alignItems: "flex-start",
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  val: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  paidColor: {
    color: COLORS.success,
  },
  dueColor: {
    color: COLORS.accent,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 10,
  },
  viewReceipt: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerIcon: {
    marginRight: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default BillCard;

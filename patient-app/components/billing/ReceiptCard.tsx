import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import COLORS from "../../constants/colors";
import { formatDate } from "../../utils/date.utils";
import { formatCurrency } from "../../utils/format.utils";

interface ReceiptItem {
  id: string;
  name: string;
  rate: number;
  qty: number;
  total: number;
}

interface ReceiptCardProps {
  bill: {
    billNo: string;
    date: string;
    patientName: string;
    patientId: string;
    items: ReceiptItem[];
    subtotal: number;
    discount: number;
    companyShare: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    operatorName?: string;
    hospitalName?: string;
    hospitalAddress?: string;
    hospitalPhone?: string;
  };
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ bill }) => {
  return (
    <View style={styles.container}>
      {/* Decorative receipt edges */}
      <View style={styles.paper}>
        {/* Hospital Header */}
        <View style={styles.header}>
          <Text style={styles.hospitalName}>{bill.hospitalName || "PolyClinic Hospital"}</Text>
          <Text style={styles.hospitalAddr}>{bill.hospitalAddress || "Near Bial Junction, Bangalore"}</Text>
          <Text style={styles.hospitalPhone}>Tel: {bill.hospitalPhone || "+91 80-2345-6789"}</Text>
        </View>

        <View style={styles.dashedDivider} />

        {/* Receipt Meta */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>RECEIPT NO</Text>
            <Text style={styles.metaValue}>{bill.billNo}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>{formatDate(bill.date)}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>PATIENT NAME</Text>
            <Text style={styles.metaValue}>{bill.patientName}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>PATIENT ID</Text>
            <Text style={styles.metaValue}>#{bill.patientId}</Text>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* Items Table */}
        <Text style={styles.tableTitle}>BILL ITEMS</Text>
        
        {bill.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.itemMeta}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemRate}>
                {formatCurrency(item.rate)} x {item.qty}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
          </View>
        ))}

        <View style={styles.dashedDivider} />

        {/* Financial Aggregation */}
        <View style={styles.aggregateRow}>
          <Text style={styles.aggregateLabel}>Subtotal</Text>
          <Text style={styles.aggregateValue}>{formatCurrency(bill.subtotal)}</Text>
        </View>

        {bill.discount > 0 && (
          <View style={styles.aggregateRow}>
            <Text style={styles.aggregateLabel}>Discount</Text>
            <Text style={styles.aggregateValue}>-{formatCurrency(bill.discount)}</Text>
          </View>
        )}

        {bill.companyShare > 0 && (
          <View style={styles.aggregateRow}>
            <Text style={styles.aggregateLabel}>Insurance Share</Text>
            <Text style={styles.aggregateValue}>-{formatCurrency(bill.companyShare)}</Text>
          </View>
        )}

        <View style={styles.aggregateRow}>
          <Text style={[styles.aggregateLabel, styles.grandLabel]}>Grand Total</Text>
          <Text style={[styles.aggregateValue, styles.grandVal]}>
            {formatCurrency(bill.totalAmount)}
          </Text>
        </View>

        <View style={styles.dashedDivider} />

        {/* Transaction Dues Status */}
        <View style={styles.paymentBanner}>
          <View style={styles.paidCircle}>
            <ShieldCheck size={18} color={COLORS.success} />
          </View>
          <View>
            <Text style={styles.paymentLabel}>TOTAL PAID AMOUNT</Text>
            <Text style={styles.paymentValue}>{formatCurrency(bill.paidAmount)}</Text>
            {bill.dueAmount > 0 && (
              <Text style={styles.dueAlert}>Dues Pending: {formatCurrency(bill.dueAmount)}</Text>
            )}
          </View>
        </View>

        {bill.operatorName && (
          <Text style={styles.footerText}>Billed by: {bill.operatorName}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  paper: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  hospitalAddr: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  hospitalPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  dashedDivider: {
    height: 1.5,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 14,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metaCell: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 1.5,
  },
  tableTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemMeta: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  itemRate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1.5,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  aggregateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  aggregateLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  aggregateValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  grandLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  grandVal: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  paymentBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  paidCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  paymentLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.success,
  },
  dueAlert: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.danger,
    marginTop: 1.5,
  },
  footerText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 14,
  },
});

export default ReceiptCard;

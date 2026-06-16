import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CreditCard, ChevronRight, Download, Receipt } from "lucide-react-native";
import COLORS from "../../constants/colors";
import PaymentSummary from "../../components/billing/PaymentSummary";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useBilling } from "../../hooks/useBilling";
import { formatCurrency } from "../../utils/format.utils";

export default function BillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { billDetail, isLoading, fetchBillDetail } = useBilling();

  useEffect(() => {
    if (id) {
      fetchBillDetail(id as string);
    }
  }, [id]);

  if (isLoading || !billDetail) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/billing");
          }
        }} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice INV-{billDetail.billNo}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Bill Items List Card */}
        <Card style={styles.itemsCard}>
          <Text style={styles.cardTitle}>Bill Items Table</Text>
          <View style={styles.divider} />

          {/* Items Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>ITEM DESCRIPTION</Text>
            <Text style={[styles.th, styles.thRight, { flex: 1 }]}>RATE</Text>
            <Text style={[styles.th, styles.thCenter, { flex: 0.5 }]}>QTY</Text>
            <Text style={[styles.th, styles.thRight, { flex: 1.2 }]}>TOTAL</Text>
          </View>

          {/* Table rows */}
          {billDetail.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tdName, { flex: 2 }]}>{item.name}</Text>
              <Text style={[styles.td, styles.thRight, { flex: 1 }]}>{formatCurrency(item.rate)}</Text>
              <Text style={[styles.td, styles.thCenter, { flex: 0.5 }]}>{item.qty}</Text>
              <Text style={[styles.tdTotal, styles.thRight, { flex: 1.2 }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </Card>

        {/* Payment Summary */}
        <PaymentSummary
          subtotal={billDetail.subtotal}
          discount={billDetail.discount}
          companyShare={billDetail.companyShare}
          total={billDetail.totalAmount}
          paid={billDetail.paidAmount}
          due={billDetail.dueAmount}
        />

        {/* Quick Receipt access */}
        <View style={styles.actions}>
          <Button
            title="View Receipt Card"
            onPress={() => router.push(`/billing/receipt?id=${billDetail.id}`)}
            variant="primary"
            style={styles.actionBtn}
          />
          {billDetail.dueAmount > 0 && (
            <Button
              title={`Pay Dues (${formatCurrency(billDetail.dueAmount)})`}
              onPress={() => alert(" UPI gateway initialized successfully.")}
              variant="accent"
              style={[styles.actionBtn, { marginTop: 12 }]}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemsCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  th: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  thRight: {
    textAlign: "right",
  },
  thCenter: {
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  tdName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  td: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  tdTotal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  actions: {
    width: "100%",
    marginTop: 12,
  },
  actionBtn: {
    width: "100%",
  },
});

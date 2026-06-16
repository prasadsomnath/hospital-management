import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { CreditCard, AlertCircle } from "lucide-react-native";
import COLORS from "../../constants/colors";
import BillCard from "../../components/billing/BillCard";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { useBilling } from "../../hooks/useBilling";
import { formatCurrency } from "../../utils/format.utils";

export default function BillingScreen() {
  const router = useRouter();
  const { bills, isLoading, fetchBills } = useBilling();
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  const filters = ["All", "OPD", "IPD", "Lab", "Services"];

  const filteredBills = bills.filter((b) => {
    if (selectedFilter === "All") return true;
    return b.billType === selectedFilter;
  });

  // Calculate total outstanding due balance
  const totalOutstanding = bills.reduce((acc, curr) => acc + curr.dueAmount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Invoices</Text>
        <Text style={styles.sub}>Track your hospital bills and payment logs</Text>
      </View>

      {/* Outstanding Dues Summary Block */}
      {totalOutstanding > 0 && (
        <View style={styles.summaryWrap}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.warningCircle}>
                <AlertCircle size={18} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>TOTAL OUTSTANDING DUES</Text>
                <Text style={styles.summaryVal}>{formatCurrency(totalOutstanding)}</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => alert("Simulating UPI/Gateway integration... Payment success!")}
              style={styles.payBtn}
            >
              <Text style={styles.payBtnText}>Clear All</Text>
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
        renderItem={({ item }) => (
          <BillCard
            bill={item}
            onPress={() => router.push(`/billing/detail?id=${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              iconName="CreditCard"
              title="No invoices found"
              description={`Hospital billing records for '${selectedFilter}' will appear here once processed by reception.`}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  summaryWrap: {
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    paddingBottom: 16,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(249, 115, 22, 0.06)",
    borderColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 1,
    padding: 12,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.accent,
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});

import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import COLORS from "../../constants/colors";
import ReportCard from "../../components/lab/ReportCard";
import EmptyState from "../../components/ui/EmptyState";
import { useLabReports } from "../../hooks/useLabReports";

export default function ReportsScreen() {
  const router = useRouter();
  const { reports, isLoading, fetchReports } = useLabReports();
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const filters = ["All", "Lab", "X-Ray", "USG", "CT Scan", "ECG", "Others"];

  const getFilterCategory = (serviceType: string): string => {
    if (!serviceType) return "Others";
    const s = serviceType.toLowerCase().trim();
    if (s === "lab" || s === "laboratory") return "Lab";
    if (s === "x-ray" || s === "xray") return "X-Ray";
    if (s === "usg") return "USG";
    if (s === "ct scan" || s === "ct-scan" || s === "ct") return "CT Scan";
    if (s === "ecg" || s === "echo" || s === "udr-echo") return "ECG";
    return "Others";
  };

  const filteredReports = reports.filter((r) => {
    if (selectedFilter === "All") return true;
    return getFilterCategory(r.serviceType) === selectedFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Lab Reports</Text>
        <Text style={styles.sub}>Access test results and imaging files</Text>
      </View>

      {/* Filter Chips Horizontal Scroll */}
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

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => router.push(`/lab/report-detail?id=${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              iconName="FileText"
              title="No reports found"
              description={`Diagnostic tests and imaging results for '${selectedFilter}' will appear once uploaded by the lab.`}
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

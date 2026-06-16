import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import COLORS from "../../constants/colors";
import AppointmentHistoryCard from "../../components/appointment/AppointmentHistoryCard";
import TokenTracker from "../../components/appointment/TokenTracker";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useAppointments } from "../../hooks/useAppointments";

export default function AppointmentsScreen() {
  const router = useRouter();
  const {
    appointments,
    tokenStatus,
    isLoading,
    fetchAppointments,
    fetchTokenStatus,
  } = useAppointments();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Check if there is an appointment scheduled for today to show the live token tracker
  const todayStr = new Date().toISOString().split("T")[0];
  const todayApt = appointments.find(
    (a) => a.date === todayStr && a.status === "Confirmed"
  );

  // Poll token status if there's an appointment today
  useEffect(() => {
    if (todayApt) {
      const deptId = todayApt.deptId || "1";
      fetchTokenStatus(deptId);
      const interval = setInterval(() => {
        fetchTokenStatus(deptId);
      }, 30000); // 30s poll as requested
      return () => clearInterval(interval);
    }
  }, [todayApt?.id]);

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === "upcoming") return a.status === "Confirmed" || a.status === "Pending";
    if (activeTab === "past") return a.status === "Examined";
    return a.status === "Cancelled";
  });

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <Button
          title="+ Book New"
          onPress={() => router.push("/appointment/book")}
          variant="primary"
          size="sm"
          style={styles.bookBtn}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(["upcoming", "past", "cancelled"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.8}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live token tracker if appointment is scheduled for today */}
      {activeTab === "upcoming" && todayApt && tokenStatus && (
        <View style={styles.trackerWrap}>
          <TokenTracker
            currentlyServing={tokenStatus.currentlyServing}
            yourToken={tokenStatus.yourToken}
            positionInQueue={tokenStatus.positionInQueue}
            totalInQueue={tokenStatus.totalInQueue}
            isLoading={isLoading}
          />
        </View>
      )}

      {/* Appointment History List */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
        renderItem={({ item }) => (
          <AppointmentHistoryCard
            appointment={item}
            onPress={() => router.push(`/appointment/detail?id=${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              iconName="Calendar"
              title={`No ${activeTab} appointments`}
              description={`Your ${activeTab} clinic visits and token queues will be listed here.`}
              actionLabel={activeTab === "upcoming" ? "Book an Appointment" : undefined}
              onActionPress={() => router.push("/appointment/book")}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  bookBtn: {
    width: "auto",
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: COLORS.transparent,
  },
  tabActive: {
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  trackerWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});

import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ShieldAlert, ArrowRight, Activity, Calendar, FileText } from "lucide-react-native";
import COLORS from "../../constants/colors";
import GreetingBanner from "../../components/home/GreetingBanner";
import DueAmountBanner from "../../components/home/DueAmountBanner";
import UpcomingAppointmentCard from "../../components/home/UpcomingAppointmentCard";
import QuickActions from "../../components/home/QuickActions";
import PendingReportsCard from "../../components/home/PendingReportsCard";
import ActivePrescriptionCard from "../../components/home/ActivePrescriptionCard";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import { usePatient } from "../../hooks/usePatient";
import { useNotifications } from "../../hooks/useNotifications";
import { formatLongDate } from "../../utils/date.utils";

export default function HomeDashboardScreen() {
  const router = useRouter();
  const { patient, dashboard, activeIPD, isLoading, refreshDashboard } = usePatient();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  };

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Greetings header */}
      <GreetingBanner
        firstName={patient?.firstName || "Patient"}
        lastName={patient?.lastName || ""}
        patientNo={patient?.patientNo || "0"}
        notificationCount={unreadCount}
        onProfilePress={() => router.push("/(tabs)/profile")}
        onNotificationsPress={() => router.push("/notifications")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Outstanding Dues warning Banner */}
        {dashboard?.dueAmount && dashboard.dueAmount > 0 ? (
          <DueAmountBanner
            dueAmount={dashboard.dueAmount}
            onPayPress={() => router.push("/(tabs)/billing")}
          />
        ) : null}



        {/* Upcoming appointments card */}
        <SectionHeader
          title="Upcoming Appointments"
          actionLabel="View all"
          onActionPress={() => router.push("/(tabs)/appointments")}
          style={styles.sectionHeader}
        />
        <UpcomingAppointmentCard
          appointment={dashboard?.upcomingAppointment}
          onPress={() => router.push(`/appointment/detail?id=${dashboard?.upcomingAppointment?.id}`)}
          onBookPress={() => router.push("/appointment/book")}
        />

        {/* 2x2 quick actions grid */}
        <QuickActions onActionPress={handleQuickAction} />

        {/* Dynamic Pending Reports */}
        {dashboard && dashboard.pendingReportsCount > 0 && (
          <PendingReportsCard
            pendingCount={dashboard.pendingReportsCount}
            reports={dashboard.pendingReports}
            onPress={() => router.push("/(tabs)/reports")}
          />
        )}

        {/* Active prescriptions banner */}
        {dashboard?.activePrescription && (
          <ActivePrescriptionCard
            prescription={dashboard.activePrescription}
            onPress={() => router.push("/prescription")}
          />
        )}

        {/* Recent Visits section */}
        {dashboard?.recentVisits && dashboard.recentVisits.length > 0 && (
          <View style={styles.visitsContainer}>
            <SectionHeader title="Recent OPD Visits" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.visitsScroll}>
              {dashboard.recentVisits.map((v) => (
                <TouchableOpacity
                  key={v.visitId}
                  activeOpacity={0.8}
                  onPress={() => router.push("/prescription")}
                  style={styles.visitCardWrap}
                >
                  <Card style={styles.visitCard}>
                    <Text style={styles.visitDate}>{formatLongDate(v.date)}</Text>
                    <Text style={styles.visitDoc}>{v.doctorName}</Text>
                    <Text style={styles.visitDept}>{v.department}</Text>
                    {v.diagnosis && (
                      <Text numberOfLines={1} style={styles.visitDiag}>
                        {v.diagnosis}
                      </Text>
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Health card strip */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/health-card")}
          style={styles.healthStrip}
        >
          <Card style={styles.healthCard}>
            <View style={styles.healthRow}>
              <View style={styles.healthCell}>
                <Text style={styles.healthLabel}>BLOOD GROUP</Text>
                <Text style={styles.healthVal}>{patient?.bloodGroup || "—"}</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthCell}>
                <Text style={styles.healthLabel}>LAST VISIT</Text>
                <Text style={styles.healthVal}>
                  {dashboard?.recentVisits?.[0] ? formatLongDate(dashboard.recentVisits[0].date) : "N/A"}
                </Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthCell}>
                <Text style={styles.healthLabel}>ACTIVE RX</Text>
                <Text style={styles.healthVal}>
                  {dashboard?.activePrescription ? "1 Active" : "None"}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  ipdAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0px 4px 8px ${COLORS.primary}26`, // adds 15% opacity to primary HSL/Hex color for web
      },
    }),
  },
  ipdAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  ipdIcon: {
    marginRight: 12,
  },
  ipdTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  ipdSub: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  visitsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  visitsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  visitCardWrap: {
    marginRight: 12,
    width: 220,
    paddingBottom: 10,
  },
  visitCard: {
    padding: 14,
  },
  visitDate: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
  },
  visitDoc: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  visitDept: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  visitDiag: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: 8,
    borderTopWidth: 0.5,
    borderColor: COLORS.border,
    paddingTop: 6,
  },
  healthStrip: {
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  healthCard: {
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  healthCell: {
    alignItems: "center",
  },
  healthLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  healthVal: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  healthDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
});

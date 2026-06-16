import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Calendar, Clock, User, Phone, CheckCircle, Trash } from "lucide-react-native";
import COLORS from "../../constants/colors";
import TokenTracker from "../../components/appointment/TokenTracker";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatusChip from "../../components/ui/StatusChip";
import { useAppointments } from "../../hooks/useAppointments";
import { usePatient } from "../../hooks/usePatient";
import { formatLongDate } from "../../utils/date.utils";

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    appointments,
    tokenStatus,
    isLoading,
    cancelAppointment,
    fetchTokenStatus,
  } = useAppointments();
  
  const { patient } = usePatient();

  const appointment = appointments.find((a) => a.id === id);

  // Poll status if it is today
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = appointment?.date === todayStr && appointment?.status === "Confirmed";

  useEffect(() => {
    if (isToday && appointment) {
      const deptId = appointment.deptId || "1";
      fetchTokenStatus(deptId);
      const interval = setInterval(() => {
        fetchTokenStatus(deptId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isToday, appointment?.id]);

  const handleCancel = () => {
    if (Platform.OS === "web") {
      const confirmCancel = window.confirm("Are you sure you want to cancel this slot? Your token will be permanently released.");
      if (confirmCancel) {
        cancelAppointment(id as string).then((success) => {
          if (success) {
            alert("Appointment cancelled successfully.");
            router.back();
          } else {
            alert("Failed to cancel slot. Try again.");
          }
        });
      }
      return;
    }

    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this slot? Your token will be permanently released.", [
      { text: "No, keep it", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const success = await cancelAppointment(id as string);
          if (success) {
            alert("Appointment cancelled successfully.");
            router.back();
          } else {
            alert("Failed to cancel slot. Try again.");
          }
        },
      },
    ]);
  };

  if (!appointment) {
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Highlight Card */}
        <Card style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.docName}>{appointment.doctorName}</Text>
              <Text style={styles.spec}>{appointment.specialty}</Text>
            </View>
            <StatusChip status={appointment.status} />
          </View>

          <View style={styles.divider} />

          {/* Slots details */}
          <View style={styles.itemRow}>
            <Calendar size={16} color={COLORS.primary} style={styles.icon} />
            <Text style={styles.valText}>{formatLongDate(appointment.date)}</Text>
          </View>
          <View style={[styles.itemRow, { marginTop: 10 }]}>
            <Clock size={16} color={COLORS.primary} style={styles.icon} />
            <Text style={styles.valText}>{appointment.time}</Text>
          </View>

          <View style={styles.divider} />

          {/* Large Token display */}
          <View style={styles.tokenHighlight}>
            <Text style={styles.tokenLabel}>YOUR RESIDUE TOKEN</Text>
            <Text style={styles.tokenNo}>{appointment.tokenNo}</Text>
            <Text style={styles.tokenSub}>Please carry your health QR card</Text>
          </View>
        </Card>

        {/* Live Token Tracker if active today */}
        {isToday && tokenStatus && (
          <View style={styles.trackerContainer}>
            <TokenTracker
              currentlyServing={tokenStatus.currentlyServing}
              yourToken={tokenStatus.yourToken}
              positionInQueue={tokenStatus.positionInQueue}
              totalInQueue={tokenStatus.totalInQueue}
              isLoading={isLoading}
            />
          </View>
        )}

        {/* Patient Details */}
        <Card style={[styles.detailCard, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Patient Information</Text>
          <View style={styles.divider} />
          
          <View style={styles.metaRow}>
            <User size={14} color={COLORS.textSecondary} style={styles.metaIcon} />
            <Text style={styles.metaLabel}>PATIENT NAME: </Text>
            <Text style={styles.metaVal}>{appointment.patientName}</Text>
          </View>
          <View style={[styles.metaRow, { marginTop: 10 }]}>
            <Phone size={14} color={COLORS.textSecondary} style={styles.metaIcon} />
            <Text style={styles.metaLabel}>MOBILE NUMBER: </Text>
            <Text style={styles.metaVal}>+91 {patient?.mobile?.slice(-10)}</Text>
          </View>
          {appointment.notes && (
            <View style={[styles.metaRow, { marginTop: 10, alignItems: "flex-start" }]}>
              <Text style={styles.metaLabel}>REASON / NOTES: </Text>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          )}
        </Card>

        {/* Actions panel */}
        {appointment.status !== "Cancelled" && appointment.status !== "Examined" && (
          <View style={styles.actionsPanel}>
            <Button
              title="Reschedule Slot"
              onPress={() => router.push(`/appointment/reschedule?id=${appointment.id}`)}
              variant="outline"
              style={styles.actionBtn}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCancel}
              style={styles.cancelBtnWrap}
            >
              <Trash size={14} color={COLORS.danger} style={styles.cancelIcon} />
              <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
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
  detailCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  docName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  spec: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  valText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  tokenHighlight: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    borderColor: "rgba(26, 111, 232, 0.12)",
    borderWidth: 1,
  },
  tokenLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tokenNo: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginVertical: 4,
  },
  tokenSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  trackerContainer: {
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: 6,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  actionsPanel: {
    marginTop: 28,
  },
  actionBtn: {
    width: "100%",
  },
  cancelBtnWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 14,
  },
  cancelIcon: {
    marginRight: 6,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },
});

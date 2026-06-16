import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Pill, AlertCircle, ChevronRight, Calendar, User, Clock } from "lucide-react-native";
import COLORS from "../../constants/colors";
import MedicineCard from "../../components/prescription/MedicineCard";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import { usePrescription } from "../../hooks/usePrescription";
import { formatDate, formatLongDate } from "../../utils/date.utils";

export default function PrescriptionIndexScreen() {
  const router = useRouter();
  const { prescriptions, isLoading, fetchPrescriptions, toggleMedicineReminder } = usePrescription();
  const [refreshing, setRefreshing] = useState(false);

  // Selected visit prescription for detailing
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  };

  const handleToggleAlarm = async (rxId: string, medId: string, enabled: boolean) => {
    const success = await toggleMedicineReminder(rxId, medId, enabled);
    if (success) {
      // Alarm scheduled / cancelled success
      const msg = enabled
        ? "Daily repeating push alarms scheduled for this medication."
        : "Alarms cancelled for this medication.";
      alert(msg);
    }
  };

  const selectedRx = prescriptions.find((p) => p.id === selectedRxId);

  // Render Visit Lists
  const renderVisitItem = ({ item }: { item: typeof prescriptions[0] }) => {
    const isActive = selectedRxId === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelectedRxId(isActive ? null : item.id)}
        style={styles.visitCardWrap}
      >
        <Card style={[styles.visitCard, isActive && styles.visitCardActive]}>
          <View style={styles.visitHeader}>
            <View style={styles.visitLeft}>
              <View style={[styles.calendarIconCircle, isActive && { backgroundColor: COLORS.white }]}>
                <Calendar size={16} color={isActive ? COLORS.primary : COLORS.textSecondary} />
              </View>
              <View>
                <Text style={[styles.visitDate, isActive && { color: COLORS.white }]}>
                  {formatLongDate(item.date)}
                </Text>
                <Text style={[styles.visitDoc, isActive && { color: COLORS.white }]}>
                  {item.doctorName}
                </Text>
                <Text style={[styles.visitDept, isActive && { color: "rgba(255,255,255,0.8)" }]}>
                  {item.department}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={isActive ? COLORS.white : COLORS.textSecondary} />
          </View>

          {item.diagnosis && (
            <View style={[styles.diagBox, isActive && { borderTopColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={[styles.diagLabel, isActive && { color: "rgba(255,255,255,0.7)" }]}>DIAGNOSIS</Text>
              <Text numberOfLines={1} style={[styles.diagText, isActive && { color: COLORS.white }]}>
                {item.diagnosis}
              </Text>
            </View>
          )}

          {isActive && (
            <View style={styles.expandedContent}>
              <View style={styles.innerDivider} />
              
              {item.instructions && (
                <View style={styles.instrBlock}>
                  <Text style={styles.expandedLabel}>DOCTOR INSTRUCTIONS</Text>
                  <Text style={styles.expandedText}>{item.instructions}</Text>
                </View>
              )}

              <View style={styles.expandedMeta}>
                <Text style={styles.expandedLabel}>PRESCRIBED MEDICINES ({item.medicines.length})</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/prescription/medicine-reminder")}
                  style={styles.alarmPrefs}
                >
                  <Clock size={12} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.alarmPrefsText}>Manage Alarm Times</Text>
                </TouchableOpacity>
              </View>

              {item.medicines.map((med) => (
                <MedicineCard
                  key={med.id}
                  medicine={med}
                  prescriptionId={item.id}
                  onToggleReminder={(enabled) => handleToggleAlarm(item.id, med.id, enabled)}
                />
              ))}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Prescriptions</Text>
        <Text style={styles.sub}>Check dosage schedules and set daily alarms</Text>
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
        renderItem={renderVisitItem}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              iconName="Pill"
              title="No prescriptions yet"
              description="Medicines prescribed during your doctor consultations will appear here automatically."
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
    borderBottomWidth: 1,
    borderColor: COLORS.border,
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
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  visitCardWrap: {
    marginBottom: 16,
  },
  visitCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visitCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  visitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  calendarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  visitDate: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  visitDoc: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 3,
  },
  visitDept: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  diagBox: {
    borderTopWidth: 0.5,
    borderColor: COLORS.border,
    paddingTop: 8,
    marginTop: 12,
  },
  diagLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  diagText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 16,
  },
  innerDivider: {
    height: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 16,
  },
  instrBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  expandedLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  expandedText: {
    fontSize: 12,
    color: COLORS.white,
    lineHeight: 18,
    fontWeight: "600",
  },
  expandedMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alarmPrefs: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alarmPrefsText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
});

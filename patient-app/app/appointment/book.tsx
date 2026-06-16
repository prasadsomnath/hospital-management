import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Activity, CheckCircle } from "lucide-react-native";
import COLORS from "../../constants/colors";
import DoctorCard from "../../components/appointment/DoctorCard";
import SlotPicker from "../../components/appointment/SlotPicker";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAppointments } from "../../hooks/useAppointments";
import { usePatient } from "../../hooks/usePatient";
import { formatLongDate } from "../../utils/date.utils";

export default function BookAppointmentScreen() {
  const router = useRouter();
  const {
    departments,
    doctors,
    slots,
    isLoading,
    fetchDepartments,
    fetchDoctors,
    fetchSlots,
    bookAppointment,
  } = useAppointments();
  
  const { patient } = usePatient();

  // Booking Funnel Steps: 1 = Dept, 2 = Doctor, 3 = Date/Slot, 4 = Confirm, 5 = Success
  const [step, setStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  
  // Created appointment response
  const [createdApt, setCreatedApt] = useState<any | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSelectDept = (deptId: string, deptName: string) => {
    setSelectedDept(deptId);
    setSelectedDeptName(deptName);
    fetchDoctors(deptId);
    setStep(2);
  };

  const handleSelectDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    
    // Default to today as selected date
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    fetchSlots(doctor.id, today);
    setStep(3);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot("");
    if (selectedDoctor) {
      fetchSlots(selectedDoctor.id, dateStr);
    }
  };

  const handleSelectSlot = (slotTime: string) => {
    setSelectedSlot(slotTime);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    
    const apt = await bookAppointment({
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialization,
      date: selectedDate,
      time: selectedSlot,
      deptId: selectedDept || "",
      notes,
    });

    if (apt) {
      setCreatedApt(apt);
      setStep(5);
    } else {
      alert("Failed to confirm your booking. Please try again.");
    }
  };

  // Generate next 7 days for the slot picker date strip
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const day = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = d.getDate();
      dates.push({ iso, day, dateNum });
    }
    return dates;
  };

  const next7Days = getNext7Days();

  // Render Functions for each funnel step
  const renderStep1_Departments = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Select Department</Text>
      {departments.length === 0 && !isLoading ? (
        <Text style={styles.emptyText}>
          No departments found. Please contact hospital administration.
        </Text>
      ) : (
        <View style={styles.deptGrid}>
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept.id}
              activeOpacity={0.8}
              onPress={() => handleSelectDept(dept.id, dept.name)}
              style={styles.deptCard}
            >
              <View style={styles.deptIconWrap}>
                <Activity size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.deptName}>{dept.name}</Text>
              {dept.description ? (
                <Text style={styles.deptDesc} numberOfLines={2}>{dept.description}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderStep2_Doctors = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setStep(1)} style={styles.backBtn}>
        <ArrowLeft size={16} color={COLORS.primary} style={styles.backIcon} />
        <Text style={styles.backText}>Back to Departments</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Available Doctors</Text>
      
      {doctors.length === 0 ? (
        <Text style={styles.emptyText}>No doctors currently active in this department.</Text>
      ) : (
        doctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onBookPress={() => handleSelectDoctor(doctor)}
          />
        ))
      )}
    </ScrollView>
  );

  const renderStep3_Slots = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.headerPadding}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setStep(2)} style={styles.backBtn}>
          <ArrowLeft size={16} color={COLORS.primary} style={styles.backIcon} />
          <Text style={styles.backText}>Back to Doctors</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Choose Date & Time</Text>

        {/* Date Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
          {next7Days.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                activeOpacity={0.8}
                onPress={() => handleSelectDate(d.iso)}
                style={[styles.dateChip, isSelected && styles.dateChipActive]}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>{d.dateNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Slots picker grid */}
      <View style={styles.slotsWrap}>
        <SlotPicker
          slots={slots}
          selectedSlot={selectedSlot}
          onSlotSelect={handleSelectSlot}
        />
      </View>

      {selectedSlot ? (
        <View style={styles.nextBar}>
          <Button
            title="Continue"
            onPress={() => setStep(4)}
            variant="primary"
          />
        </View>
      ) : null}
    </View>
  );

  const renderStep4_Confirm = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setStep(3)} style={styles.backBtn}>
        <ArrowLeft size={16} color={COLORS.primary} style={styles.backIcon} />
        <Text style={styles.backText}>Back to Slot Picker</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Review Appointment Details</Text>

      {/* Confirmation Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Clinic Visit Summary</Text>
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>DEPARTMENT</Text>
          <Text style={styles.summaryVal}>{selectedDeptName || "—"}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>DOCTOR</Text>
          <Text style={styles.summaryVal}>{selectedDoctor?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>SPECIALITY</Text>
          <Text style={styles.summaryVal}>{selectedDoctor?.specialization}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>DATE</Text>
          <Text style={styles.summaryVal}>{formatLongDate(selectedDate)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>TIME SLOT</Text>
          <Text style={styles.summaryVal}>{selectedSlot}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>PATIENT</Text>
          <Text style={styles.summaryVal}>
            {patient?.firstName} {patient?.lastName}
          </Text>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Reason for Visit (Optional)</Text>
      <TextInput
        placeholder="Brief description of symptoms, follow-up, etc."
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
      />

      <Button
        title="Confirm Appointment"
        onPress={handleConfirmBooking}
        isLoading={isLoading}
        style={styles.confirmBtn}
      />
    </ScrollView>
  );

  const renderStep5_Success = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <CheckCircle size={64} color={COLORS.success} strokeWidth={2} />
      </View>
      
      <Text style={styles.successTitle}>Booking Confirmed!</Text>
      <Text style={styles.successSub}>
        Your token slot has been successfully reserved with{"\n"}
        <Text style={styles.bold}>{selectedDoctor?.name}</Text>
      </Text>

      {/* Large Token highlight */}
      <Card style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>YOUR QUEUE TOKEN</Text>
        <Text style={styles.tokenNo}>{createdApt?.tokenNo}</Text>
        <Text style={styles.tokenSub}>Please arrive 15 minutes before {selectedSlot}</Text>
      </Card>

      <View style={styles.successActions}>
        <Button
          title="Add to Calendar"
          onPress={() => {
            alert("Appointment successfully added to your device calendar!");
          }}
          variant="outline"
          style={styles.successBtn}
        />
        <Button
          title="Go to Home"
          onPress={() => router.replace("/(tabs)")}
          variant="primary"
          style={[styles.successBtn, { marginTop: 12 }]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      {step < 5 && (
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
            style={styles.headerClose}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <Text style={styles.stepsText}>Step {step} of 4</Text>
        </View>
      )}

      {isLoading && step < 3 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {step === 1 && renderStep1_Departments()}
          {step === 2 && renderStep2_Doctors()}
          {step === 3 && renderStep3_Slots()}
          {step === 4 && renderStep4_Confirm()}
          {step === 5 && renderStep5_Success()}
        </View>
      )}
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
  headerClose: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  stepsText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  deptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  deptCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.04)",
      },
    }),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  deptName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  deptDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backIcon: {
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
  headerPadding: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  dateStrip: {
    marginTop: 8,
    marginBottom: 6,
  },
  dateChip: {
    width: 50,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateDay: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  dateNum: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  dateTextActive: {
    color: COLORS.white,
  },
  slotsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nextBar: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  summaryCard: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
    height: 80,
    textAlignVertical: "top",
  },
  confirmBtn: {
    marginTop: 32,
  },
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  tokenCard: {
    marginVertical: 32,
    width: "100%",
    padding: 20,
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderColor: "rgba(26, 111, 232, 0.15)",
    borderWidth: 1,
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  tokenNo: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.primary,
    marginVertical: 8,
  },
  tokenSub: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  successActions: {
    width: "100%",
    marginTop: "auto",
    paddingBottom: 40,
  },
  successBtn: {
    width: "100%",
  },
});

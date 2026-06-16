import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Share2, Shield, Calendar, Heart, MessageSquare } from "lucide-react-native";
import COLORS from "../../constants/colors";
import HealthSummaryCard from "../../components/health-card/HealthSummaryCard";
import QRCard from "../../components/health-card/QRCard";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import { usePatient } from "../../hooks/usePatient";
import { calculateAge } from "../../utils/date.utils";

export default function HealthCardScreen() {
  const router = useRouter();
  const { patient, dashboard } = usePatient();

  const name = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient";
  const first = patient?.firstName || "P";
  const last = patient?.lastName || "";
  const age = patient?.dob ? calculateAge(patient.dob) : "—";

  // QR payload metadata
  const qrPayload = {
    patientId: patient?.id || "",
    name,
    bloodGroup: patient?.bloodGroup || "—",
    allergies: patient?.allergies || "None",
    emergencyContact: patient?.mobile || "",
    hospitalId: "POLY-BLR-01",
  };

  const handleShare = async () => {
    try {
      const msg = `PolyClinic Health Card — ${name}\nPatient No: ${patient?.patientNo || ""}\nBlood Group: ${patient?.bloodGroup || "—"}\nAllergies: ${patient?.allergies || "None"}\nScan this to review medical history!`;
      await Share.share({ message: msg });
    } catch (e) {
      console.log("Failed to share health card", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PolyClinic Health Card</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Aesthetic Health Card layout */}
        <Card style={styles.digitalCard}>
          <Text style={styles.cardHeader}>POLYCLINIC HEALTH NETWORK</Text>
          
          <View style={styles.avatarRow}>
            <Avatar firstName={first} lastName={last} size={64} style={styles.avatar} />
            <View style={styles.meta}>
              <Text style={styles.nameText}>{name}</Text>
              <Text style={styles.idText}>Patient No: {patient?.patientNo || "—"}  •  Age: {age}  •  {patient?.sex || "—"}</Text>
            </View>
          </View>

          <View style={styles.strip}>
            <Text style={styles.stripText}>🩸 {patient?.bloodGroup || "—"}   |   📍 {patient?.place || "—"}   |   📞 {patient?.mobile ? `+91 ${patient.mobile.slice(-10)}` : "—"}</Text>
          </View>
        </Card>

        {/* Medical record summary card */}
        <HealthSummaryCard
          bloodGroup={patient?.bloodGroup}
          lastVisitDate={dashboard?.recentVisits?.[0]?.date}
          allergies={patient?.allergies}
          chronic={patient?.chronic}
          insurance={patient?.insuranceCompany}
        />

        {/* Embed Large QRCard */}
        <QRCard
          qrData={qrPayload}
          onDownloadPress={() => alert("Digital Health QR card saved to Apple/Google Wallet mock successfully!")}
          onSharePress={handleShare}
        />
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
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  digitalCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
  },
  avatar: {
    borderWidth: 2,
    borderColor: COLORS.white,
    marginRight: 12,
  },
  meta: {
    flex: 1,
  },
  nameText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  idText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  strip: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  stripText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import COLORS from "../../constants/colors";
import QRCard from "../../components/health-card/QRCard";
import { usePatient } from "../../hooks/usePatient";

export default function QRViewScreen() {
  const router = useRouter();
  const { patient } = usePatient();

  const name = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient";

  const qrPayload = {
    patientId: patient?.id || "",
    name,
    bloodGroup: patient?.bloodGroup || "—",
    allergies: patient?.allergies || "None",
    emergencyContact: patient?.mobile || "",
    hospitalId: "POLY-BLR-01",
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital QR Scanner</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <QRCard
          qrData={qrPayload}
          onDownloadPress={() => alert("Saved to Wallet!")}
          onSharePress={() => alert("Sharing QR card...")}
        />
      </View>
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
  content: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
});

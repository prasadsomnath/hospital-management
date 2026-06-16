import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Shield, Settings, Info, LogOut, Camera, Trash } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { usePatient } from "../../hooks/usePatient";
import { useAuth } from "../../hooks/useAuth";
import { maskAadhar } from "../../utils/format.utils";

export default function ProfileScreen() {
  const router = useRouter();
  const { patient, updateProfile, isLoading } = usePatient();
  const { logout } = useAuth();

  // Editable fields states
  const [firstName, setFirstName] = useState(patient?.firstName || "");
  const [lastName, setLastName] = useState(patient?.lastName || "");
  const [email, setEmail] = useState(patient?.email || "");
  const [address, setAddress] = useState(patient?.address || "");
  const [place, setPlace] = useState(patient?.place || "");

  React.useEffect(() => {
    if (patient) {
      setFirstName(patient.firstName || "");
      setLastName(patient.lastName || "");
      setEmail(patient.email || "");
      setAddress(patient.address || "");
      setPlace(patient.place || "");
    }
  }, [patient]);

  // Settings states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderSound, setReminderSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("First and Last Name are required.");
      return;
    }
    const success = await updateProfile(patient?.id || "", {
      firstName,
      lastName,
      email,
      address,
      place,
    });
    if (success) {
      alert("Profile updated successfully!");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmLogout = window.confirm("Are you sure you want to log out of PolyClinic?");
      if (confirmLogout) {
        logout().then(() => {
          router.replace("/(auth)/login");
        });
      }
      return;
    }

    Alert.alert("Confirm Logout", "Are you sure you want to log out of PolyClinic?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Profile Avatar Card */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarWrap}>
            <Avatar firstName={firstName || "P"} lastName={lastName || ""} size={72} />
            <TouchableOpacity activeOpacity={0.8} style={styles.cameraIcon}>
              <Camera size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{firstName} {lastName}</Text>
          <Text style={styles.profileNo}>Patient No: {patient?.patientNo || "0"}</Text>
        </Card>

        {/* Section: PERSONAL INFO */}
        <Text style={styles.sectionHeader}>PERSONAL DETAILS</Text>
        <Card style={styles.infoCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.fieldInput}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Street Address</Text>
            <TextInput
              style={styles.fieldInput}
              value={address}
              onChangeText={setAddress}
            />
          </View>
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>City / Place</Text>
            <TextInput
              style={styles.fieldInput}
              value={place}
              onChangeText={setPlace}
            />
          </View>
          
          <Button
            title="Save Details"
            onPress={handleUpdateProfile}
            isLoading={isLoading}
            variant="primary"
            size="sm"
            style={styles.saveBtn}
          />
        </Card>

        {/* Section: MEDICAL INFO (Read-only) */}
        <Text style={styles.sectionHeader}>MEDICAL RECORDS (HMS SECURE)</Text>
        <Card style={styles.infoCard}>
          <View style={styles.readField}>
            <Text style={styles.readLabel}>Blood Group</Text>
            <Text style={styles.readValue}>{patient?.bloodGroup || "—"}</Text>
          </View>
          <View style={styles.readField}>
            <Text style={styles.readLabel}>Known Allergies</Text>
            <Text style={styles.readValue}>{patient?.allergies || "—"}</Text>
          </View>
          <View style={styles.readField}>
            <Text style={styles.readLabel}>Chronic Ailments</Text>
            <Text style={styles.readValue}>{patient?.chronic || "None"}</Text>
          </View>
          <View style={styles.readField}>
            <Text style={styles.readLabel}>Aadhar Number</Text>
            <Text style={styles.readValue}>{patient?.aadharNo ? maskAadhar(patient.aadharNo) : "—"}</Text>
          </View>
          <View style={[styles.readField, { borderBottomWidth: 0 }]}>
            <Text style={styles.readLabel}>Insurance Company</Text>
            <Text style={styles.readValue}>{patient?.insuranceCompany || "—"}</Text>
          </View>
        </Card>

        {/* Section: SETTINGS */}
        <Text style={styles.sectionHeader}>APP SETTINGS</Text>
        <Card style={styles.infoCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Medication Alarm Sound</Text>
            <Switch
              value={reminderSound}
              onValueChange={setReminderSound}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>Dark Mode (Beta)</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        </Card>

        {/* Section: ACCOUNT OPERATIONS */}
        <Text style={styles.sectionHeader}>ACCOUNT ACTIONS</Text>
        <Card style={styles.infoCard}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.actionBtn}>
            <LogOut size={16} color={COLORS.danger} style={styles.actionIcon} />
            <Text style={styles.actionTextDanger}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => alert("Simulating dynamic account deletion review. Contact hub admin.")}
            style={[styles.actionBtn, { borderBottomWidth: 0, marginTop: 12 }]}
          >
            <Trash size={16} color={COLORS.danger} style={styles.actionIcon} />
            <Text style={styles.actionTextDanger}>Request Account Deletion</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.versionText}>PolyClinic App v{require("../../package.json").version || "1.0.0"}</Text>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarCard: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 20,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 12,
  },
  cameraIcon: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  profileNo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 12,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    flex: 1,
  },
  fieldInput: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "700",
    flex: 2,
    textAlign: "right",
    padding: 0,
  },
  saveBtn: {
    marginVertical: 12,
  },
  readField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  readLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  readValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  actionIcon: {
    marginRight: 10,
  },
  actionTextDanger: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  versionText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
});

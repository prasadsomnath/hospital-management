import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Phone, Mail, MapPin, Globe, CreditCard } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, mobile, isLoading, error, clearError } = useAuth();

  // Registration Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [sex, setSex] = useState<"Male" | "Female" | "Other">("Male");
  const [email, setEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [aadharNo, setAadharNo] = useState("");
  const [address, setAddress] = useState("");
  const [place, setPlace] = useState("");
  const [pin, setPin] = useState("");
  const [language, setLanguage] = useState<"English" | "Kannada">("English");
  const [referredBy, setReferredBy] = useState("");

  const handleRegister = async () => {
    clearError();
    if (!firstName.trim() || !lastName.trim() || !dob.trim()) {
      alert("Please fill all required (*) fields.");
      return;
    }

    const payload = {
      firstName,
      lastName,
      dob,
      sex,
      mobile: mobile || "",
      email,
      bloodGroup,
      aadharNo,
      address,
      place,
      pin,
      language,
      referredBy,
    };

    const success = await register(payload);
    if (success) {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Profile</Text>
          <Text style={styles.sub}>Complete your profile setup to register at PolyClinic HMS.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionHeader}>PERSONAL DETAILS</Text>

          {/* First Name */}
          <Text style={styles.label}>First Name *</Text>
          <View style={styles.inputWrap}>
            <User size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="Hemanth"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <Text style={[styles.label, { marginTop: 12 }]}>Last Name *</Text>
          <View style={styles.inputWrap}>
            <User size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="Kadler"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* DOB */}
          <Text style={[styles.label, { marginTop: 12 }]}>Date of Birth *</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="YYYY-MM-DD (e.g. 2004-03-12)"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={dob}
              onChangeText={setDob}
            />
          </View>

          {/* Sex Pill Selector */}
          <Text style={[styles.label, { marginTop: 12 }]}>Gender *</Text>
          <View style={styles.pillSelector}>
            {(["Male", "Female", "Other"] as const).map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[styles.pill, sex === gender && styles.pillActive]}
                onPress={() => setSex(gender)}
              >
                <Text style={[styles.pillText, sex === gender && styles.pillTextActive]}>
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pre-filled Mobile */}
          <Text style={[styles.label, { marginTop: 12 }]}>Mobile Number (Registered)</Text>
          <View style={[styles.inputWrap, styles.disabledInput]}>
            <Phone size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              editable={false}
              style={[styles.input, { color: COLORS.textSecondary }]}
              value={mobile || ""}
            />
          </View>

          {/* Email */}
          <Text style={[styles.label, { marginTop: 12 }]}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Mail size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Blood Group */}
          <Text style={[styles.label, { marginTop: 12 }]}>Blood Group</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="B+ / O+ / A-"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={bloodGroup}
              onChangeText={setBloodGroup}
            />
          </View>

          {/* Aadhar */}
          <Text style={[styles.label, { marginTop: 12 }]}>Aadhar Number</Text>
          <View style={styles.inputWrap}>
            <CreditCard size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="12-digit Aadhar No."
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              maxLength={12}
              style={styles.input}
              value={aadharNo}
              onChangeText={setAadharNo}
            />
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>CONTACT & ADDRESS</Text>

          {/* Address */}
          <Text style={styles.label}>Residential Address</Text>
          <View style={styles.inputWrap}>
            <MapPin size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="Street name, area..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Place */}
          <Text style={[styles.label, { marginTop: 12 }]}>City / Place</Text>
          <View style={styles.inputWrap}>
            <MapPin size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="Bangalore"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={place}
              onChangeText={setPlace}
            />
          </View>

          {/* Pin */}
          <Text style={[styles.label, { marginTop: 12 }]}>PIN Code</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="560001"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
              value={pin}
              onChangeText={setPin}
            />
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>PREFERENCES</Text>

          {/* Language preference selector */}
          <Text style={styles.label}>Language Preference</Text>
          <View style={styles.pillSelector}>
            {(["English", "Kannada"] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.pill, language === lang && styles.pillActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.pillText, language === lang && styles.pillTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Referred By */}
          <Text style={[styles.label, { marginTop: 12 }]}>Referred By (Optional)</Text>
          <View style={styles.inputWrap}>
            <Globe size={16} color={COLORS.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="Doctor code / name"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={referredBy}
              onChangeText={setReferredBy}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: COLORS.background,
  },
  disabledInput: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  pillSelector: {
    flexDirection: "row",
    marginBottom: 6,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  submitBtn: {
    marginTop: 32,
  },
});

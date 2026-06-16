import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Phone, User, Calendar as CalendarIcon, ArrowRight } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { validateMobile } from "../../utils/validation.utils";

export default function LoginScreen() {
  const router = useRouter();
  const {
    sendOtp,
    setMobile,
    isLoading,
    error,
    clearError,
    hospitals,
    hospitalCode,
    loadHospitals,
    setHospitalCode,
    loginWithIdAndDob,
  } = useAuth();
  
  const [loginMode, setLoginMode] = useState<"mobile" | "patientId">("mobile");
  const [mobileNum, setMobileNum] = useState("");
  
  // Patient ID alternative state
  const [patientId, setPatientId] = useState("");
  const [dob, setDob] = useState("");

  const [showHospitals, setShowHospitals] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleSendOtp = async () => {
    clearError();
    if (!validateMobile(mobileNum)) {
      alert("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }
    
    // Call Zustand Send OTP
    const isExisting = await sendOtp(mobileNum);
    setMobile(mobileNum);
    
    // Redirect to OTP verification
    router.push({
      pathname: "/(auth)/otp-verify",
      params: { isExisting: isExisting ? "true" : "false" },
    });
  };

  const handlePatientIdLogin = async () => {
    clearError();
    if (!patientId.trim() || !dob.trim()) {
      alert("Please enter both Patient ID and Date of Birth.");
      return;
    }
    
    const success = await loginWithIdAndDob(patientId.trim(), dob.trim());
    if (success) {
      router.replace("/(tabs)");
    } else {
      alert(error || "Invalid Patient ID or Date of Birth.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Onboarding Illustration & Logo */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoSymbol}>🏥</Text>
          </View>
          <Text style={styles.brandName}>PolyClinic</Text>
          <Text style={styles.brandTagline}>Your Trustworthy Digital Health Companion</Text>
        </View>

        {/* Hospital Selector */}
        <View style={styles.hospitalContainer}>
          <Text style={styles.label}>Select Registered Hospital</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowHospitals(!showHospitals)}
            style={styles.hospitalSelector}
          >
            <Text style={styles.hospitalSelectorText}>
              {hospitals.find(h => h.hospitalCode === hospitalCode)?.hospitalName || "PolyClinic Hospital Hub"}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>▼</Text>
          </TouchableOpacity>
          {showHospitals && (
            <View style={styles.dropdown}>
              {hospitals.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setHospitalCode(h.hospitalCode);
                    setShowHospitals(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, h.hospitalCode === hospitalCode && { color: COLORS.primary, fontWeight: "700" }]}>
                    {h.hospitalName} ({h.hospitalCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, loginMode === "mobile" && styles.tabActive]}
            onPress={() => setLoginMode("mobile")}
          >
            <Text style={[styles.tabText, loginMode === "mobile" && styles.tabTextActive]}>
              Mobile Number
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, loginMode === "patientId" && styles.tabActive]}
            onPress={() => setLoginMode("patientId")}
          >
            <Text style={[styles.tabText, loginMode === "patientId" && styles.tabTextActive]}>
              Patient ID
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form fields */}
        {loginMode === "mobile" ? (
          <View style={styles.form}>
            <Text style={styles.label}>Enter Mobile Number</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.prefix}>+91</Text>
              <Phone size={18} color={COLORS.textSecondary} style={styles.icon} />
              <TextInput
                placeholder="98765 43210"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
                value={mobileNum}
                onChangeText={setMobileNum}
              />
            </View>
            <Text style={styles.caption}>
              An OTP will be sent to this number for verification.
            </Text>

            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              isLoading={isLoading}
              style={styles.submitBtn}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Patient ID</Text>
            <View style={styles.inputWrap}>
              <User size={18} color={COLORS.textSecondary} style={styles.icon} />
              <TextInput
                placeholder="Enter Patient ID (e.g. P10005)"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="default"
                autoCapitalize="characters"
                style={styles.input}
                value={patientId}
                onChangeText={setPatientId}
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Date of Birth</Text>
            <View style={styles.inputWrap}>
              <CalendarIcon size={18} color={COLORS.textSecondary} style={styles.icon} />
              <TextInput
                placeholder="YYYY-MM-DD (e.g. 2004-03-12)"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                value={dob}
                onChangeText={setDob}
              />
            </View>

            <Button
              title="Verify Account"
              onPress={handlePatientIdLogin}
              isLoading={isLoading}
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* Brand Footer links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{"\n"}
            <Text style={styles.link}>Terms of Service</Text> & <Text style={styles.link}>Privacy Policy</Text>
          </Text>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoSymbol: {
    fontSize: 32,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  hospitalContainer: {
    marginBottom: 20,
  },
  hospitalSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: COLORS.background,
  },
  hospitalSelectorText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingVertical: 4,
    maxHeight: 150,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: COLORS.background,
  },
  prefix: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  caption: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 16,
    fontWeight: "500",
  },
  submitBtn: {
    marginTop: 24,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
  link: {
    color: COLORS.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

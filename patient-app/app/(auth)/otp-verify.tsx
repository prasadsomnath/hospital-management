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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyOtp, mobile, isLoading, error, clearError } = useAuth();
  
  const isExisting = params.isExisting === "true";
  
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    clearError();
    if (otp.length !== 6) {
      alert("Please enter the 6-digit OTP code.");
      return;
    }

    const success = await verifyOtp(otp);
    if (success) {
      if (isExisting) {
        // Dynamic guard: redirects to (tabs)
        router.replace("/(tabs)");
      } else {
        // Redirect to new patient details setup
        router.replace("/(auth)/register");
      }
    }
  };

  const handleResend = () => {
    setTimer(30);
    alert("OTP has been resent successfully!");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={32} color={COLORS.primary} strokeWidth={2} />
          </View>
          
          <Text style={styles.title}>Enter OTP Code</Text>
          <Text style={styles.sub}>
            We've sent a 6-digit OTP code to your number{"\n"}
            <Text style={styles.bold}>+91 {mobile?.slice(-10)}</Text>
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="0 0 0 0 0 0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              isLoading={isLoading}
              style={styles.submitBtn}
            />

            <View style={styles.timerRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
    paddingTop: 80,
    paddingBottom: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
  bold: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  form: {
    width: "100%",
    marginTop: 36,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    height: 52,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 8,
    color: COLORS.textPrimary,
    textAlign: "center",
    width: "100%",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  submitBtn: {
    marginTop: 24,
  },
  timerRow: {
    alignItems: "center",
    marginTop: 18,
  },
  timerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  resendText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },
});

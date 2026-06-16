import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import QRCode from "react-native-qrcode-svg";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface QRCardProps {
  qrData: {
    patientId: string;
    name: string;
    bloodGroup: string;
    allergies: string;
    emergencyContact: string;
    hospitalId: string;
  };
  onDownloadPress: () => void;
  onSharePress: () => void;
}

export const QRCard: React.FC<QRCardProps> = ({
  qrData,
  onDownloadPress,
  onSharePress,
}) => {
  // Convert object to string to encode
  const qrString = JSON.stringify(qrData);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Digital Health Identity QR</Text>
      <Text style={styles.sub}>Scan this QR code at any PolyClinic counter to quickly retrieve your complete medical file.</Text>
      
      <View style={styles.qrContainer}>
        <View style={styles.qrBorder}>
          <QRCode
            value={qrString}
            size={180}
            color={COLORS.textPrimary}
            backgroundColor={COLORS.white}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Download Card"
          onPress={onDownloadPress}
          variant="outline"
          size="sm"
          style={styles.btn}
        />
        <Button
          title="Share Card"
          onPress={onSharePress}
          variant="primary"
          size="sm"
          style={[styles.btn, { marginLeft: 12 }]}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  qrContainer: {
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  qrBorder: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.04)",
      },
    }),
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  btn: {
    flex: 1,
  },
});

export default QRCard;

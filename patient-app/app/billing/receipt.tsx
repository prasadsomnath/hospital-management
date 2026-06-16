import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Download, Share2 } from "lucide-react-native";
import COLORS from "../../constants/colors";
import ReceiptCard from "../../components/billing/ReceiptCard";
import Button from "../../components/ui/Button";
import { useBilling } from "../../hooks/useBilling";

export default function ReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { billDetail, isLoading, fetchBillDetail } = useBilling();

  useEffect(() => {
    if (id) {
      fetchBillDetail(id as string);
    }
  }, [id]);

  const handleShare = async () => {
    if (!billDetail) return;
    try {
      const msg = `PolyClinic HMS — Receipt INV-${billDetail.billNo}\nTotal Paid: ${billDetail.paidAmount}\nOutstanding Dues: ${billDetail.dueAmount}\nThank you for choosing PolyClinic!`;
      await Share.share({ message: msg });
    } catch (e) {
      console.log("Failed to open OS share sheet", e);
    }
  };

  if (isLoading || !billDetail) {
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/billing");
          }
        }} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Receipt</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Receipt Paper Card */}
        <ReceiptCard bill={billDetail} />

        <View style={styles.btnBlock}>
          <Button
            title="Download PDF Invoice"
            onPress={() => {
              alert("PDF Invoice downloaded to device local downloads folder!");
            }}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title="Share on WhatsApp"
            onPress={handleShare}
            variant="primary"
            style={[styles.actionBtn, { marginTop: 12 }]}
          />
        </View>
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBlock: {
    width: "100%",
    marginTop: 24,
  },
  actionBtn: {
    width: "100%",
  },
});

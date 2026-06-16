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
import { ArrowLeft, Download, Share2, Printer, ShieldAlert } from "lucide-react-native";
import COLORS from "../../constants/colors";
import ResultRow from "../../components/lab/ResultRow";
import Card from "../../components/ui/Card";
import StatusChip from "../../components/ui/StatusChip";
import Button from "../../components/ui/Button";
import { useLabReports } from "../../hooks/useLabReports";
import { formatDate } from "../../utils/date.utils";

export default function LabReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { reportDetail, isLoading, fetchReportDetail } = useLabReports();

  useEffect(() => {
    if (id) {
      fetchReportDetail(id as string);
    }
  }, [id]);

  const handleShare = async () => {
    if (!reportDetail) return;
    try {
      const msg = `PolyClinic HMS — Lab Report: ${reportDetail.testName}\nStatus: ${reportDetail.status}\nOrder No: ${reportDetail.reportNo}\nView your reports on the PolyClinic app!`;
      await Share.share({ message: msg });
    } catch (e) {
      console.log("Error triggering share sheet", e);
    }
  };

  const handleDownloadPdf = () => {
    if (!reportDetail) return;
    router.push(`/lab/report-pdf?id=${reportDetail.id}` as any);
  };

  if (isLoading || !reportDetail) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const IsLab = reportDetail.serviceType === "Lab";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>{reportDetail.testName}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient & Report Meta Card */}
        <Card style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <Text style={styles.cardTitle}>Diagnostic Record Files</Text>
            <StatusChip status={reportDetail.status} />
          </View>
          <View style={styles.divider} />
          
          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.label}>PATIENT NAME</Text>
              <Text style={styles.val}>{reportDetail.patientName}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>REPORT NO / LAB NO</Text>
              <Text style={styles.val}>{reportDetail.reportNo}</Text>
            </View>
          </View>

          <View style={[styles.grid, { marginTop: 12 }]}>
            <View style={styles.cell}>
              <Text style={styles.label}>AGE / GENDER</Text>
              <Text style={styles.val}>{reportDetail.patientAge} Yrs / {reportDetail.patientSex}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>REFERRING DOCTOR</Text>
              <Text style={styles.val}>{reportDetail.referredDoctor}</Text>
            </View>
          </View>

          <View style={[styles.grid, { marginTop: 12 }]}>
            <View style={styles.cell}>
              <Text style={styles.label}>ORDERED ON</Text>
              <Text style={styles.val}>{formatDate(reportDetail.orderDate)} • {reportDetail.orderTime}</Text>
            </View>
          </View>
        </Card>

        {/* Action triggers */}
        <View style={styles.actionsBar}>
          <Button
            title="Download PDF"
            onPress={handleDownloadPdf}
            variant="outline"
            size="sm"
            style={styles.actionBtn}
          />
          <Button
            title="Print Report"
            onPress={handleDownloadPdf}
            variant="secondary"
            size="sm"
            style={[styles.actionBtn, { marginLeft: 12 }]}
          />
        </View>

        {/* Diagnostic Results section */}
        <Text style={styles.sectionHeader}>TEST FINDINGS</Text>
        
        {IsLab ? (
          <Card style={styles.resultsCard}>
            {reportDetail.results && reportDetail.results.length > 0 ? (
              reportDetail.results.map((row, i) => (
                <ResultRow
                  key={i}
                  testName={row.testName}
                  result={row.result}
                  unit={row.unit}
                  refRangeStart={row.refRangeStart}
                  refRangeEnd={row.refRangeEnd}
                  status={row.status}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No blood findings attached.</Text>
            )}
          </Card>
        ) : (
          /* Radiology scan readings */
          <Card style={styles.radiologyCard}>
            {reportDetail.observationText && (
              <View style={styles.radBlock}>
                <Text style={styles.radLabel}>CLINICAL OBSERVATIONS</Text>
                <Text style={styles.radText}>{reportDetail.observationText}</Text>
              </View>
            )}
            
            {reportDetail.reportText && (
              <View style={[styles.radBlock, { marginTop: 16 }]}>
                <Text style={styles.radLabel}>RADIOLOGIST CONCLUSION</Text>
                <Text style={styles.conclusionText}>{reportDetail.reportText}</Text>
              </View>
            )}

            {!reportDetail.observationText && !reportDetail.reportText && (
              <Text style={styles.emptyText}>Observations are currently being prepared by the radiologist.</Text>
            )}
          </Card>
        )}
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
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
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
  metaCard: {
    padding: 16,
  },
  metaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cell: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  val: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 24,
  },
  resultsCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  radiologyCard: {
    padding: 16,
  },
  radBlock: {
    width: "100%",
  },
  radLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  radText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontWeight: "500",
  },
  conclusionText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
    fontWeight: "500",
  },
});

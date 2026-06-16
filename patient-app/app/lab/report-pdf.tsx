import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import COLORS from "../../constants/colors";
import Button from "../../components/ui/Button";
import { useLabReports } from "../../hooks/useLabReports";
import { formatDate } from "../../utils/date.utils";

export default function ReportPdfScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { reportDetail, fetchReportDetail } = useLabReports();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReportDetail(id as string);
    }
  }, [id]);

  const generatePDF = async () => {
    if (!reportDetail) return;
    
    setIsGenerating(true);
    try {
      // Build HTML template
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #0F172A; }
              .header { text-align: center; border-bottom: 2px solid #1A6FE8; padding-bottom: 12px; margin-bottom: 20px; }
              .hospital { font-size: 20px; font-weight: bold; color: #1A6FE8; }
              .addr { font-size: 11px; color: #64748B; margin-top: 4px; }
              .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
              .meta-table td { padding: 6px; border-bottom: 1px solid #E2E8F0; }
              .meta-label { font-weight: bold; color: #64748B; width: 25%; }
              .meta-val { font-weight: 600; }
              .title { font-size: 16px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 16px; color: #0F172A; }
              .results-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
              .results-table th { background-color: #EBF2FF; color: #1A6FE8; font-weight: bold; padding: 8px; border: 1px solid #E2E8F0; text-align: left; }
              .results-table td { padding: 8px; border: 1px solid #E2E8F0; }
              .abnormal-High { color: #F59E0B; font-weight: bold; }
              .abnormal-Low { color: #EF4444; font-weight: bold; }
              .notes { background-color: #F4F6FA; border-left: 3px solid #1A6FE8; padding: 12px; font-size: 12px; line-height: 18px; border-radius: 4px; margin-top: 24px; }
              .footer { text-align: center; font-size: 9px; color: #64748B; margin-top: 40px; border-top: 1px dashed #E2E8F0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hospital">POLYCLINIC HOSPITAL HUB</div>
              <div class="addr">Near Bial Junction, Sanjay Nagar, Bangalore • Tel: +91 80-2345-6789</div>
            </div>
            
            <div class="title">${reportDetail.testName}</div>

            <table class="meta-table">
              <tr>
                <td class="meta-label">Patient Name:</td>
                <td class="meta-val">${reportDetail.patientName}</td>
                <td class="meta-label">Report Number:</td>
                <td class="meta-val">${reportDetail.reportNo}</td>
              </tr>
              <tr>
                <td class="meta-label">Age / Gender:</td>
                <td class="meta-val">${reportDetail.patientAge} Yrs / ${reportDetail.patientSex}</td>
                <td class="meta-label">Referred Doctor:</td>
                <td class="meta-val">${reportDetail.referredDoctor}</td>
              </tr>
              <tr>
                <td class="meta-label">Order Date:</td>
                <td class="meta-val">${formatDate(reportDetail.orderDate)} • ${reportDetail.orderTime}</td>
                <td class="meta-label">Status:</td>
                <td class="meta-val">${reportDetail.status}</td>
              </tr>
            </table>

            ${
              reportDetail.serviceType === "Lab" && reportDetail.results
                ? `
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Result Value</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportDetail.results
                    .map(
                      (row) => `
                    <tr>
                      <td>${row.testName}</td>
                      <td><b>${row.result}</b> ${row.unit}</td>
                      <td>${row.refRangeStart} – ${row.refRangeEnd} ${row.unit}</td>
                      <td class="abnormal-${row.status}">${row.status}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            `
                : `
              <div class="notes">
                <b>CLINICAL FINDINGS / OBSERVATIONS:</b><br/>
                <p style="margin-top: 6px; font-style: italic;">${reportDetail.observationText || "Preparing findings..."}</p>
                <br/>
                <b>IMPRESSION / CONCLUSION:</b><br/>
                <p style="margin-top: 6px; font-weight: bold; color: #1A6FE8;">${reportDetail.reportText || "N/A"}</p>
              </div>
            `
            }

            <div class="footer">
              This is a digitally generated medical report authenticated by PolyClinic Hub.
            </div>
          </body>
        </html>
      `;

      // Generate PDF File
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log("PDF successfully printed to:", uri);

      // Open Share sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        if (Platform.OS === "web") {
          alert(`PDF Generated. Saved to: ${uri}`);
        } else {
          Alert.alert("PDF Generated", `Saved to: ${uri}`);
        }
      }
    } catch (e) {
      console.log("Failed to print PDF file", e);
      alert("Error printing report PDF. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!reportDetail) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Lab PDF</Text>
      <Text style={styles.sub}>Compile a printable PDF layout for:{"\n"}<Text style={styles.bold}>{reportDetail.testName}</Text></Text>

      {isGenerating ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Structuring PDF contents...</Text>
        </View>
      ) : (
        <View style={styles.btnBlock}>
          <Button
            title="Generate & Export PDF"
            onPress={generatePDF}
            variant="primary"
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 32,
  },
  bold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingBlock: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 10,
  },
  btnBlock: {
    width: "100%",
  },
});

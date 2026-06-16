import { useState, useCallback } from "react";
import labService from "../services/labService";
import { LabReportSummary, LabReportDetail } from "../types/lab.types";
import { useAuth } from "./useAuth";

export const useLabReports = () => {
  const { patient } = useAuth();
  const [reports, setReports] = useState<LabReportSummary[]>([]);
  const [reportDetail, setReportDetail] = useState<LabReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!patient?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await labService.getReports(patient.id);
      setReports(data);
    } catch (e: any) {
      setError(e.message || "Failed to load laboratory reports");
    } finally {
      setIsLoading(false);
    }
  }, [patient?.id]);

  const fetchReportDetail = useCallback(async (reportId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await labService.getReportDetail(reportId);
      setReportDetail(data);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to load report details");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reports,
    reportDetail,
    isLoading,
    error,
    fetchReports,
    fetchReportDetail,
  };
};

export default useLabReports;

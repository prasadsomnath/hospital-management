import { useState, useCallback } from "react";
import billingService from "../services/billingService";
import { Bill } from "../types/billing.types";
import { useAuth } from "./useAuth";

export const useBilling = () => {
  const { patient } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [billDetail, setBillDetail] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    if (!patient?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingService.getBills(patient.id);
      setBills(data);
    } catch (e: any) {
      setError(e.message || "Failed to load billing history");
    } finally {
      setIsLoading(false);
    }
  }, [patient?.id]);

  const fetchBillDetail = useCallback(async (billId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingService.getBillDetail(billId);
      setBillDetail(data);
      return data;
    } catch (e: any) {
      setError(e.message || "Failed to load bill invoice details");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bills,
    billDetail,
    isLoading,
    error,
    fetchBills,
    fetchBillDetail,
  };
};

export default useBilling;

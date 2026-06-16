import { useState, useCallback } from "react";
import appointmentService from "../services/appointmentService";
import { Department, Doctor, Slot, Appointment, TokenQueueStatus } from "../types/appointment.types";
import { useAuth } from "./useAuth";

export const useAppointments = () => {
  const { patient } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tokenStatus, setTokenStatus] = useState<TokenQueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getDepartments();
      setDepartments(data);
    } catch (e: any) {
      setError(e.message || "Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDoctors = useCallback(async (deptId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getDoctors(deptId);
      setDoctors(data);
    } catch (e: any) {
      setError(e.message || "Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(async (doctorId: string, date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getSlots(doctorId, date);
      setSlots(data);
    } catch (e: any) {
      setError(e.message || "Failed to load slots");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!patient?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments(patient.id);
      setAppointments(data);
    } catch (e: any) {
      setError(e.message || "Failed to load appointment history");
    } finally {
      setIsLoading(false);
    }
  }, [patient?.id]);

  const bookAppointment = useCallback(async (appointmentData: Partial<Appointment>) => {
    if (!patient?.id) return null;
    setIsLoading(true);
    setError(null);
    try {
      const created = await appointmentService.createAppointment({
        ...appointmentData,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
      });
      // Refresh list
      await fetchAppointments();
      return created;
    } catch (e: any) {
      setError(e.message || "Failed to book appointment");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [patient, fetchAppointments]);

  const rescheduleAppointment = useCallback(async (id: string, date: string, time: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await appointmentService.rescheduleAppointment(id, date, time);
      await fetchAppointments();
      return success;
    } catch (e: any) {
      setError(e.message || "Failed to reschedule appointment");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const cancelAppointment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await appointmentService.cancelAppointment(id);
      await fetchAppointments();
      return success;
    } catch (e: any) {
      setError(e.message || "Failed to cancel appointment");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const fetchTokenStatus = useCallback(async (deptId: string) => {
    if (!deptId) return null;
    setError(null);
    try {
      const status = await appointmentService.getTokenStatus(deptId);
      setTokenStatus(status);
      return status;
    } catch (e: any) {
      console.log("Failed to fetch token live status", e);
      return null;
    }
  }, []);

  return {
    departments,
    doctors,
    slots,
    appointments,
    tokenStatus,
    isLoading,
    error,
    fetchDepartments,
    fetchDoctors,
    fetchSlots,
    fetchAppointments,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    fetchTokenStatus,
  };
};

export default useAppointments;

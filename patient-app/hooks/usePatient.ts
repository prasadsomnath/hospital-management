import { useEffect, useCallback } from "react";
import { usePatientStore } from "../store/patientStore";
import { useAuth } from "./useAuth";

export const usePatient = () => {
  const { patient: authPatient } = useAuth();
  
  const patient = usePatientStore((state) => state.patient);
  const dashboard = usePatientStore((state) => state.dashboard);

  const isLoading = usePatientStore((state) => state.isLoading);
  const error = usePatientStore((state) => state.error);

  const loadDashboard = usePatientStore((state) => state.loadDashboard);
  const loadProfile = usePatientStore((state) => state.loadProfile);
  const updateProfile = usePatientStore((state) => state.updateProfile);

  const clearPatientState = usePatientStore((state) => state.clearPatientState);

  // Automatically refresh patient state if auth patient changes
  useEffect(() => {
    if (authPatient?.id) {
      loadProfile(authPatient.id);
    }
  }, [authPatient?.id]);

  const refreshDashboard = useCallback(async () => {
    if (authPatient?.id) {
      await loadDashboard(authPatient.id);
    }
  }, [authPatient?.id, loadDashboard]);

  return {
    patient: patient || authPatient,
    dashboard,
    isLoading,
    error,
    loadDashboard,
    loadProfile,
    updateProfile,
    clearPatientState,
    refreshDashboard,
  };
};

export default usePatient;

import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const patient = useAuthStore((state) => state.patient);
  const isLoading = useAuthStore((state) => state.isLoading);
  const mobile = useAuthStore((state) => state.mobile);
  const error = useAuthStore((state) => state.error);
  const hospitalCode = useAuthStore((state) => state.hospitalCode);
  const hospitals = useAuthStore((state) => state.hospitals);

  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  const setMobile = useAuthStore((state) => state.setMobile);
  const setHospitalCode = useAuthStore((state) => state.setHospitalCode);
  const loadHospitals = useAuthStore((state) => state.loadHospitals);
  const loginWithIdAndDob = useAuthStore((state) => state.loginWithIdAndDob);

  return {
    token,
    isAuthenticated,
    patient,
    isLoading,
    mobile,
    error,
    hospitalCode,
    hospitals,
    initializeAuth,
    sendOtp,
    verifyOtp,
    register,
    logout,
    clearError,
    setMobile,
    setHospitalCode,
    loadHospitals,
    loginWithIdAndDob,
  };
};

export default useAuth;

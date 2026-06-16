export const validateMobile = (mobile: string): boolean => {
  const cleaned = mobile.replace(/\D/g, "");
  // Indian mobile standard: 10 digits, starts with 6-9
  return /^[6-9]\d{9}$/.test(cleaned);
};

export const validateOtp = (otp: string): boolean => {
  const cleaned = otp.replace(/\D/g, "");
  return cleaned.length === 6;
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export const validateAadhar = (aadhar: string): boolean => {
  const cleaned = aadhar.replace(/\D/g, "");
  return cleaned.length === 12;
};

export const validateRequired = (val: string): boolean => {
  return val.trim().length > 0;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const maskAadhar = (aadhar: string): string => {
  if (!aadhar) return "";
  const cleaned = aadhar.replace(/\D/g, "");
  if (cleaned.length !== 12) return aadhar;
  return `XXXX-XXXX-${cleaned.slice(8)}`;
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
};

export const getInitials = (firstName: string, lastName: string): string => {
  const f = firstName ? firstName.charAt(0).toUpperCase() : "";
  const l = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${f}${l}` || "?";
};

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Returns a YYYY-MM-DD representation of the date in the local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayName(
  emailOrName: string | undefined | null,
): string {
  if (!emailOrName) return "";
  if (emailOrName.includes("@")) {
    const part = emailOrName.split("@")[0];
    return part
      .split(/[\._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return emailOrName;
}

/**
 * Calculates a highly accurate age from a DOB string in years, months, and days.
 * Supports both standard descriptive format and a compact format.
 *
 * @param dobString - The date of birth string (e.g. "YYYY-MM-DD")
 * @param compact - If true, returns a short representation (e.g. "25y 3m 12d"). Otherwise "25 years, 3 months, 12 days"
 */
export function calculateDetailedAge(
  dobString: string | undefined | null,
  compact = false,
): string | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();

  if (isNaN(dob.getTime())) return null;

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  // Adjust days and months if needed
  if (days < 0) {
    // Borrow days from the previous month of "today"
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  // If DOB is in the future
  if (years < 0) {
    return "Invalid DOB (future date)";
  }

  const parts: string[] = [];
  if (compact) {
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    if (days > 0 || parts.length === 0) parts.push(`${days}d`);
    return parts.join(" ");
  } else {
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0)
      parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (days > 0 || parts.length === 0)
      parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    return parts.join(", ");
  }
}

/**
 * Formats appointment timeSlot cleanly, handling custom IPD/OT unique slots.
 */
export function formatTimeSlot(time: string | null | undefined): string {
  if (!time) return "IPD (Admission)";
  if (time.startsWith("IPD-")) return "IPD (Admission)";
  return time;
}

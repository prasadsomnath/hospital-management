export interface PresetTheme {
  id: string;
  name: string;
  color: string; // CSS-like hex for preview circles
  primaryLight: string; // "L C H"
  primaryDark: string;
  accentLight: string;
  accentDark: string;
  fgLight: string;
  fgDark: string;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: "default",
    name: "Apollo Indigo (Default)",
    color: "#6366f1",
    primaryLight: "0.5 0.15 265",
    primaryDark: "0.55 0.15 265",
    accentLight: "0.9 0.02 265",
    accentDark: "0.26 0.03 265",
    fgLight: "0.3 0.02 265",
    fgDark: "0.85 0.005 260",
  },
  {
    id: "emerald",
    name: "Emerald Healing",
    color: "#10b981",
    primaryLight: "0.62 0.16 150",
    primaryDark: "0.68 0.16 150",
    accentLight: "0.95 0.02 150",
    accentDark: "0.2 0.03 150",
    fgLight: "0.25 0.03 150",
    fgDark: "0.85 0.02 150",
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    color: "#0ea5e9",
    primaryLight: "0.58 0.16 220",
    primaryDark: "0.64 0.16 220",
    accentLight: "0.94 0.02 220",
    accentDark: "0.22 0.03 220",
    fgLight: "0.3 0.02 220",
    fgDark: "0.85 0.02 220",
  },
  {
    id: "sunset",
    name: "Sunset Rose",
    color: "#f43f5e",
    primaryLight: "0.6 0.18 10",
    primaryDark: "0.66 0.18 10",
    accentLight: "0.95 0.02 10",
    accentDark: "0.21 0.03 10",
    fgLight: "0.3 0.03 10",
    fgDark: "0.85 0.02 10",
  },
  {
    id: "royal",
    name: "Royal Amethyst",
    color: "#8b5cf6",
    primaryLight: "0.52 0.18 290",
    primaryDark: "0.58 0.18 290",
    accentLight: "0.94 0.02 290",
    accentDark: "0.22 0.03 290",
    fgLight: "0.3 0.02 290",
    fgDark: "0.85 0.02 290",
  },
  {
    id: "teal",
    name: "Teal Synergy",
    color: "#14b8a6",
    primaryLight: "0.58 0.15 180",
    primaryDark: "0.64 0.15 180",
    accentLight: "0.94 0.02 180",
    accentDark: "0.22 0.03 180",
    fgLight: "0.3 0.02 180",
    fgDark: "0.85 0.02 180",
  },
  {
    id: "amber",
    name: "Golden Glow",
    color: "#f59e0b",
    primaryLight: "0.7 0.15 80",
    primaryDark: "0.76 0.15 80",
    accentLight: "0.96 0.02 80",
    accentDark: "0.22 0.03 80",
    fgLight: "0.35 0.02 80",
    fgDark: "0.85 0.02 80",
  },
  {
    id: "crimson",
    name: "Crimson Care",
    color: "#dc2626",
    primaryLight: "0.55 0.18 20",
    primaryDark: "0.61 0.18 20",
    accentLight: "0.94 0.02 20",
    accentDark: "0.22 0.03 20",
    fgLight: "0.3 0.02 20",
    fgDark: "0.85 0.02 20",
  },
];

export function hexToOklch(
  hex: string,
): { L: number; C: number; H: number } | null {
  let cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (cleaned.length !== 6) return null;

  const r = Number.parseInt(cleaned.substring(0, 2), 16);
  const g = Number.parseInt(cleaned.substring(2, 4), 16);
  const b = Number.parseInt(cleaned.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  // sRGB to Linear
  const r_lin =
    r / 255 <= 0.04045
      ? r / 255 / 12.92
      : Math.pow((r / 255 + 0.055) / 1.055, 2.4);
  const g_lin =
    g / 255 <= 0.04045
      ? g / 255 / 12.92
      : Math.pow((g / 255 + 0.055) / 1.055, 2.4);
  const b_lin =
    b / 255 <= 0.04045
      ? b / 255 / 12.92
      : Math.pow((b / 255 + 0.055) / 1.055, 2.4);

  // LMS
  const l = 0.4122214708 * r_lin + 0.5363325363 * g_lin + 0.0514459929 * b_lin;
  const m = 0.2119034982 * r_lin + 0.6806995451 * g_lin + 0.1073969614 * b_lin;
  const s = 0.0883024619 * r_lin + 0.2817188376 * g_lin + 0.6299787005 * b_lin;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // Oklab
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // Oklch
  const C = Math.sqrt(a * a + b_ * b_);
  let H = Math.atan2(b_, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return { L, C, H };
}

export function getThemeStyles(
  selectedTheme: string,
  isDark: boolean,
): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!selectedTheme || selectedTheme === "default") {
    return styles;
  }

  let primary = "";
  let accent = "";
  let fg = "";

  if (selectedTheme.startsWith("#")) {
    const oklch = hexToOklch(selectedTheme);
    if (oklch) {
      const { L, C, H } = oklch;

      // Calculate optimized lightness and colors
      if (isDark) {
        // Ensure color has sufficient lightness on dark bg but isn't washed out
        const L_dark = Math.max(0.62, L);
        const C_val = Math.max(0.08, Math.min(0.2, C));
        primary = `${L_dark.toFixed(3)} ${C_val.toFixed(3)} ${H.toFixed(1)}`;
        accent = `0.22 ${(C_val * 0.2).toFixed(3)} ${H.toFixed(1)}`;
        fg = `0.85 ${(C_val * 0.1).toFixed(3)} ${H.toFixed(1)}`;
      } else {
        // Ensure color has sufficient contrast on light bg
        const L_light = Math.min(0.55, L);
        const C_val = Math.max(0.08, Math.min(0.2, C));
        primary = `${L_light.toFixed(3)} ${C_val.toFixed(3)} ${H.toFixed(1)}`;
        accent = `0.94 ${(C_val * 0.2).toFixed(3)} ${H.toFixed(1)}`;
        fg = `0.3 ${(C_val * 0.8).toFixed(3)} ${H.toFixed(1)}`;
      }
    }
  } else {
    const preset = PRESET_THEMES.find((t) => t.id === selectedTheme);
    if (preset) {
      if (isDark) {
        primary = preset.primaryDark;
        accent = preset.accentDark;
        fg = preset.fgDark;
      } else {
        primary = preset.primaryLight;
        accent = preset.accentLight;
        fg = preset.fgLight;
      }
    }
  }

  if (primary) {
    styles["--primary"] = primary;
    styles["--ring"] = primary;
    styles["--sidebar-primary"] = primary;
    styles["--sidebar-accent"] = accent;
    styles["--sidebar-accent-foreground"] = fg;
  }

  return styles;
}

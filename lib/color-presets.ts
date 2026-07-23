/**
 * Color preset system for template photo-overlays.
 * Each preset defines all text/accent/border colors a template can use,
 * plus a shadow color for legibility over photos.
 */

// ── Font Families ──

export const FONT_FAMILIES = [
  { id: "system" as const, name: "System", family: undefined },
  { id: "serif" as const, name: "Serif", family: "Georgia" },
  { id: "mono" as const, name: "Mono", family: "Courier" },
  { id: "bold-system" as const, name: "Bold System", family: undefined, fontWeight: "900" as const },
  { id: "light-system" as const, name: "Light", family: undefined, fontWeight: "300" as const },
];

export type FontFamily = typeof FONT_FAMILIES[number]["id"];
export const DEFAULT_FONT_FAMILY: FontFamily = "system";

export function getFontFamily(id: FontFamily) {
  return FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0];
}

// ── Custom color grid ──

export const CUSTOM_COLORS = [
  "#FFFFFF", "#FF6B35", "#FF453A", "#FF9F0A",
  "#FFD60A", "#32D74B", "#30D158", "#0A84FF",
  "#5E5CE6", "#8B5CF6", "#FF375F", "#BF5AF2",
  "#000000", "#333333", "#666666", "#999999",
];

/** Merge partial colour overrides into a full palette — falls back to preset then defaults */
export function resolveColors(
  paletteId: string,
  customColors?: Partial<TemplateColors>,
): TemplateColors {
  const preset = ALL_PRESETS.find((p) => p.id === paletteId);
  const base = preset?.colors ?? BRIGHT_WHITE.colors;
  if (!customColors) return base;
  return { ...base, ...customColors };
}

// ── Types ──

export interface TemplateColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentRun: string;
  accentRide: string;
  accentWorkout: string;
  accentElev: string;
  chipBg: string;
  shadowColor: string;
  fontFamily?: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  colors: TemplateColors;
}

// ── Helper ──

/** Append a 2‑character alpha hex to a 6‑character hex color, e.g. "#FF6B35" + "22" → "#FF6B3522" */
export function alpha(hex: string, aa: string): string {
  return hex + aa;
}

// ── 5 Presets ──

export const BRIGHT_WHITE: ColorPreset = {
  id: "bright-white",
  name: "Bright White",
  colors: {
    textPrimary: "#FFFFFF",
    textSecondary: "#AAAAAA",
    textMuted: "#888888",
    border: "#1C1C1E",
    accent: "#FF6B35",
    accentRun: "#0A84FF",
    accentRide: "#34C759",
    accentWorkout: "#FF9F0A",
    accentElev: "#8B5CF6",
    chipBg: "#111111",
    shadowColor: "rgba(0,0,0,0.6)",
  },
};

export const WARM_GOLD: ColorPreset = {
  id: "warm-gold",
  name: "Warm Gold",
  colors: {
    textPrimary: "#FFD700",
    textSecondary: "#D4A574",
    textMuted: "#A08060",
    border: "#5A4A3A",
    accent: "#FF8C00",
    accentRun: "#FF6B35",
    accentRide: "#FFD700",
    accentWorkout: "#E8A000",
    accentElev: "#CD853F",
    chipBg: "#2A1F10",
    shadowColor: "rgba(0,0,0,0.7)",
  },
};

export const COOL_MINT: ColorPreset = {
  id: "cool-mint",
  name: "Cool Mint",
  colors: {
    textPrimary: "#E0FFF0",
    textSecondary: "#A0E8C0",
    textMuted: "#70A890",
    border: "#2A4A3A",
    accent: "#00FF88",
    accentRun: "#00D4FF",
    accentRide: "#34C759",
    accentWorkout: "#00CED1",
    accentElev: "#48D1CC",
    chipBg: "#0A2A1A",
    shadowColor: "rgba(0,0,0,0.6)",
  },
};

export const NEON_POP: ColorPreset = {
  id: "neon-pop",
  name: "Neon Pop",
  colors: {
    textPrimary: "#FFFFFF",
    textSecondary: "#FF00FF",
    textMuted: "#AA66AA",
    border: "#FF00FF",
    accent: "#00FFFF",
    accentRun: "#FF0080",
    accentRide: "#00FF80",
    accentWorkout: "#FFFF00",
    accentElev: "#FF6600",
    chipBg: "#1A001A",
    shadowColor: "rgba(0,0,0,0.7)",
  },
};

export const MINIMAL_MONO: ColorPreset = {
  id: "minimal-mono",
  name: "Minimal Mono",
  colors: {
    textPrimary: "#FFFFFF",
    textSecondary: "#CCCCCC",
    textMuted: "#999999",
    border: "#333333",
    accent: "#FFFFFF",
    accentRun: "#FFFFFF",
    accentRide: "#FFFFFF",
    accentWorkout: "#FFFFFF",
    accentElev: "#FFFFFF",
    chipBg: "#222222",
    shadowColor: "rgba(0,0,0,0.6)",
  },
};

// ── Registry ──

export const ALL_PRESETS: ColorPreset[] = [
  BRIGHT_WHITE,
  WARM_GOLD,
  COOL_MINT,
  NEON_POP,
  MINIMAL_MONO,
];

export const DEFAULT_PRESET_ID = BRIGHT_WHITE.id;

export function getPresetById(id: string): ColorPreset {
  return ALL_PRESETS.find((p) => p.id === id) ?? BRIGHT_WHITE;
}

import { Platform } from "react-native";

import themeConfig from "@/theme.config";

export type ColorScheme = "light" | "dark";

export const ThemeColors = themeConfig.themeColors;

type ThemeColorTokens = typeof ThemeColors;
type ThemeColorName = keyof ThemeColorTokens;
type SchemePalette = Record<ColorScheme, Record<ThemeColorName, string>>;
type SchemePaletteItem = SchemePalette[ColorScheme];

function buildSchemePalette(colors: ThemeColorTokens): SchemePalette {
  const palette: SchemePalette = {
    light: {} as SchemePalette["light"],
    dark: {} as SchemePalette["dark"],
  };

  (Object.keys(colors) as ThemeColorName[]).forEach((name) => {
    const swatch = colors[name];
    palette.light[name] = swatch.light;
    palette.dark[name] = swatch.dark;
  });

  return palette;
}

export const SchemeColors = buildSchemePalette(ThemeColors);

type RuntimePalette = SchemePaletteItem & {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
};

function buildRuntimePalette(scheme: ColorScheme): RuntimePalette {
  const base = SchemeColors[scheme];
  return {
    ...base,
    text: base.foreground,
    background: base.background,
    tint: base.primary,
    icon: base.muted,
    tabIconDefault: base.muted,
    tabIconSelected: base.primary,
    border: base.border,
  };
}

export const Colors = {
  light: buildRuntimePalette("light"),
  dark: buildRuntimePalette("dark"),
} satisfies Record<ColorScheme, RuntimePalette>;

export type ThemeColorPalette = (typeof Colors)[ColorScheme];

// ──────────────────────────────────────────────────────────────
// Font families — StrideStudio design handoff
//
// Three families loaded via expo-font:
//   Archivo (500–900)   — all UI text, headings
//   IBM Plex Mono (600–700) — stat values, counters, labels
//   Instrument Serif (400)   — editorial sticker theme only
//
// RN note: reference by fontFamily, not fontWeight.
// Register one font file per weight.
// ──────────────────────────────────────────────────────────────

const FONT_UI = "'Archivo', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
const FONT_SERIF = "'Instrument Serif', Georgia, serif";

export const Fonts = Platform.select({
  ios: {
    sans: FONT_UI,
    serif: FONT_SERIF,
    display: FONT_UI,
    rounded: "ui-rounded",
    mono: FONT_MONO,
  },
  default: {
    sans: FONT_UI,
    serif: FONT_SERIF,
    display: FONT_UI,
    rounded: "normal",
    mono: FONT_MONO,
  },
  web: {
    sans: FONT_UI,
    serif: FONT_SERIF,
    display: FONT_UI,
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: FONT_MONO,
  },
});

export { FONT_UI, FONT_MONO, FONT_SERIF };

// ── Typography Scale ──────────────────────────────────────────
// Lifted directly from the prototype. Sizes at 393pt-wide device.
// ──────────────────────────────────────────────────────────────

export const Typography = {
  /** 32 / 1.02 — display hero */
  hero: {
    fontFamily: FONT_UI,
    fontSize: 32,
    fontWeight: "900" as const,
    lineHeight: 32.64,
    letterSpacing: -0.035 * 32,
  },
  /** 27 / 1.06 — screen title */
  h1: {
    fontFamily: FONT_UI,
    fontSize: 27,
    fontWeight: "900" as const,
    lineHeight: 28.62,
    letterSpacing: -0.03 * 27,
  },
  /** 25 / 1 — section title */
  h2: {
    fontFamily: FONT_UI,
    fontSize: 25,
    fontWeight: "900" as const,
    lineHeight: 25,
    letterSpacing: -0.03 * 25,
  },
  /** 19 / 1 — card heading */
  h3: {
    fontFamily: FONT_UI,
    fontSize: 19,
    fontWeight: "800" as const,
    lineHeight: 19,
  },
  /** 15 / 1 — nav / bar title */
  navTitle: {
    fontFamily: FONT_UI,
    fontSize: 15,
    fontWeight: "800" as const,
    lineHeight: 15,
  },
  /** 14 / 1 — button label */
  button: {
    fontFamily: FONT_UI,
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 14,
  },
  /** 13 / 1.5 — body */
  body: {
    fontFamily: FONT_UI,
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 19.5,
  },
  /** 13.5 / 1.35 — stat value (mono) */
  statValue: {
    fontFamily: FONT_MONO,
    fontSize: 13.5,
    fontWeight: "700" as const,
    lineHeight: 18.225,
  },
  /** 12 / 1 — mono meta */
  meta: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 12,
    letterSpacing: 0.08 * 12,
  },
  /** 11.5 / 1 — small label */
  bodySmall: {
    fontFamily: FONT_UI,
    fontSize: 11.5,
    fontWeight: "500" as const,
    lineHeight: 11.5,
  },
  /** 10 / 1 — eyebrow (uppercase, tracked) */
  caption: {
    fontFamily: FONT_UI,
    fontSize: 10,
    fontWeight: "700" as const,
    lineHeight: 10,
    letterSpacing: 0.24 * 10,
  },
  /** 9.5 / 1 — mono micro */
  micro: {
    fontFamily: FONT_MONO,
    fontSize: 9.5,
    fontWeight: "600" as const,
    lineHeight: 9.5,
    letterSpacing: 0.1 * 9.5,
  },
  /** 28 — big stat (deprecated by statValue but kept for compat) */
  stat: {
    fontFamily: FONT_UI,
    fontSize: 28,
    fontWeight: "800" as const,
    lineHeight: 28,
  },
  /** 12 — stat label */
  statLabel: {
    fontFamily: FONT_UI,
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
} as const;

// ── Spacing Scale ─────────────────────────────────────────────
// Base scale from the prototype (px):
// 2, 4, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 26, 30, 34
// Screen horizontal padding: 16 (content), 22 (auth), 26 (splash)
// ──────────────────────────────────────────────────────────────

export const Spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 6px */
  tight: 6,
  /** 8px */
  sm: 8,
  /** 10px */
  mdTight: 10,
  /** 12px */
  md: 12,
  /** 14px */
  mdLoose: 14,
  /** 16px */
  lg: 16,
  /** 18px */
  lgLoose: 18,
  /** 20px */
  xl: 20,
  /** 22px */
  xlLoose: 22,
  /** 26px */
  "2xl": 26,
  /** 30px */
  "3xl": 30,
  /** 34px */
  "4xl": 34,
} as const;

// ── Radii ─────────────────────────────────────────────────────

export const Radii = {
  /** 12 — small tiles, gallery thumbs */
  sm: 12,
  /** 16 — logo squares, chips */
  md: 16,
  /** 18 — cards, stat panels, glass pills */
  lg: 18,
  /** 22 — app icon */
  xl: 22,
  /** 26–27 — primary buttons (height 52–54) */
  pill: 26,
  /** 50% — avatars (38), back buttons (38–40), shutter */
  circle: "50%" as const,
} as const;

// ── Shadows ───────────────────────────────────────────────────
// RN: use shadowColor/shadowOffset/shadowOpacity/shadowRadius on iOS
// and elevation + translucent border on Android.
// Large colored glows: absolutely-positioned blurred sibling view.

export const Shadows = {
  /** Primary CTA glow (shutter) */
  accentGlow: {
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  /** Strava-specific CTA glow */
  stravaGlow: {
    shadowColor: "#FC4C02",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 34,
    elevation: 16,
  },
  /** App icon glow */
  iconGlow: {
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 50,
    elevation: 20,
  },
} as const;

// ── Control Sizes ─────────────────────────────────────────────

export const Controls = {
  /** Primary button: height 52–54, radius 26–27, full width */
  buttonHeight: 52,
  buttonRadius: 26,
  /** Back button: 38–40 circle */
  backButtonSize: 38,
  /** Shutter: 78 outer ring, 60 inner disc */
  shutterOuter: 78,
  shutterInner: 60,
  /** Capture side buttons: 46 square/circle */
  captureSide: 46,
  /** Bottom tab bar height */
  tabBarHeight: 64,
  /** Minimum hit target */
  minHitTarget: 44,
} as const;

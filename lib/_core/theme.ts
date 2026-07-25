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

/**
 * Font families — UI/UX Pro Max skill recommendation for fitness/sports apps:
 * Barlow Condensed (display/headings) + Barlow (body text).
 * Falls back gracefully when custom fonts aren't loaded.
 */
const FONT_DISPLAY = "'Barlow Condensed', 'Impact', 'Arial Black', sans-serif";
const FONT_BODY = "'Barlow', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const Fonts = Platform.select({
  ios: {
    sans: FONT_BODY,
    serif: "ui-serif",
    display: FONT_DISPLAY,
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: FONT_BODY,
    serif: "serif",
    display: FONT_DISPLAY,
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: FONT_BODY,
    serif: "Georgia, 'Times New Roman', serif",
    display: FONT_DISPLAY,
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ── Typography Scale ──
// Barlow Condensed for display/stats, Barlow for body text.
// Uses Major Third ratio (1.250) from 16px base.

export const Typography = {
  /** 48px — hero title, landing page brand */
  hero: {
    fontFamily: FONT_DISPLAY,
    fontSize: 48,
    fontWeight: "900" as const,
    lineHeight: 52,
  },
  /** 32px — screen titles */
  h1: {
    fontFamily: FONT_DISPLAY,
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 38,
  },
  /** 24px — section headers */
  h2: {
    fontFamily: FONT_DISPLAY,
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 30,
  },
  /** 20px — card titles, panel headers */
  h3: {
    fontFamily: FONT_DISPLAY,
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  /** 16px — body text */
  body: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  /** 14px — secondary body, list items */
  bodySmall: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  /** 12px — captions, labels, helper text */
  caption: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
  /** 10px — micro-copy, badges */
  micro: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: "600" as const,
    lineHeight: 14,
  },
  /** 28px — big stat numbers (distance, time) */
  stat: {
    fontFamily: FONT_DISPLAY,
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
  },
  /** 12px — stat label above/below numbers */
  statLabel: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
} as const;

// ── Spacing Scale (8pt grid) ──

export const Spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 16px */
  md: 16,
  /** 24px */
  lg: 24,
  /** 32px */
  xl: 32,
  /** 48px */
  "2xl": 48,
  /** 64px */
  "3xl": 64,
} as const;

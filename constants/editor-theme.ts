/**
 * Editor-specific design tokens — Photo Editor & Filters palette.
 *
 * These complement the global fitness theme (Energy Orange) with a
 * dedicated dark-editor identity: violet primary + cyan accent on
 * deep OLED backgrounds. Use only within editor surfaces; the rest
 * of the app keeps the fitness theme.
 *
 * Source: UI/UX Pro Max — Photo Editor & Filters category
 */

// ── Core Palette ──

export const EditorColors = {
  /** Violet — primary actions, selected states, sliders */
  primary: "#7C3AED",
  /** Indigo — secondary elements, hover states */
  secondary: "#6366F1",
  /** Cyan — accents, filter badges, adjustment icons */
  accent: "#0891B2",
  /** Deep navy — main editor background */
  background: "#0F172A",
  /** Slightly lighter — card surfaces, panels */
  surface: "#192134",
  /** Card elevated — raised surfaces, tooltips */
  card: "#1E293B",
  /** White — primary text */
  foreground: "#FFFFFF",
  /** Muted purple — subtle backgrounds */
  muted: "#171939",
  /** Muted text — secondary labels, hints */
  mutedText: "#94A3B8",
  /** Semi-transparent border */
  border: "rgba(255,255,255,0.08)",
  /** Solid border for high-contrast modes */
  borderSolid: "#334155",
  /** Destructive / delete */
  destructive: "#DC2626",
  /** Focus ring */
  ring: "#7C3AED",
} as const;

// ── Semantic Tokens ──

export const EditorSemantic = {
  /** Canvas area when no media is selected */
  canvasEmpty: "#1A1534",
  /** Filter carousel background strip */
  filterStripBg: "rgba(15, 23, 42, 0.95)",
  /** Selected filter indicator */
  filterSelected: "#7C3AED",
  /** Slider track (inactive portion) */
  sliderTrack: "rgba(255,255,255,0.12)",
  /** Slider track (active / filled portion) */
  sliderTrackActive: "#7C3AED",
  /** Slider thumb */
  sliderThumb: "#FFFFFF",
  /** Tool panel handle / grabber */
  panelHandle: "rgba(255,255,255,0.2)",
  /** Overlay behind modals */
  overlay: "rgba(0,0,0,0.6)",
  /** Glass panel background */
  glass: "rgba(25, 33, 52, 0.85)",
  /** Glass panel border */
  glassBorder: "rgba(255,255,255,0.06)",
  /** Success toast / confirmations */
  success: "#22C55E",
  /** Warning states */
  warning: "#F59E0B",
} as const;

// ── Spacing Scale (editor-specific, tighter than app default) ──

export const EditorSpace = {
  /** 4px — icon-inline gaps */
  xs: 4,
  /** 8px — element gaps */
  sm: 8,
  /** 12px — compact padding */
  md: 12,
  /** 16px — standard padding */
  lg: 16,
  /** 20px — section gaps */
  xl: 20,
  /** 24px — panel padding */
  "2xl": 24,
  /** 32px — large separators */
  "3xl": 32,
} as const;

// ── Touch Targets ──

export const EditorTouch = {
  /** Minimum touch target (WCAG 2.5.5) */
  min: 44,
  /** Comfortable icon button size */
  iconButton: 44,
  /** Standard small button height */
  buttonSm: 36,
  /** Standard button height */
  buttonMd: 44,
  /** Large / primary button height */
  buttonLg: 48,
} as const;

// ── Border Radii ──

export const EditorRadius = {
  /** Filter pills, small chips */
  pill: 20,
  /** Cards, panels, sliders */
  card: 12,
  /** Modals, bottom sheets */
  modal: 20,
  /** Circular buttons, color swatches */
  circle: 999,
  /** Canvas corners */
  canvas: 16,
} as const;

// ── Typography Scale (editor) ──

export const EditorType = {
  /** 10px — filter labels, badges, micro-copy */
  micro: { size: 10, weight: "600" as const, lineHeight: 14 },
  /** 12px — secondary labels, helper text */
  caption: { size: 12, weight: "500" as const, lineHeight: 16 },
  /** 14px — body, list items, slider labels */
  body: { size: 14, weight: "500" as const, lineHeight: 20 },
  /** 16px — panel titles, section headers */
  heading: { size: 16, weight: "700" as const, lineHeight: 22 },
  /** 20px — modal titles */
  title: { size: 20, weight: "800" as const, lineHeight: 26 },
  /** 24px — screen titles */
  screenTitle: { size: 24, weight: "800" as const, lineHeight: 30 },
} as const;

// ── Animation Tokens ──

export const EditorMotion = {
  /** Fast micro-interactions (press feedback, toggle) */
  fast: 150,
  /** Standard transitions (panel open, filter change) */
  normal: 250,
  /** Slow reveals (modal, page enter) */
  slow: 350,
  /** Spring config for interactive gestures */
  spring: {
    damping: 20,
    stiffness: 200,
    mass: 0.5,
  },
} as const;

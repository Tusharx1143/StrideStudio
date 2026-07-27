/**
 * Lens system — canonical type definitions.
 *
 * A Lens is a dynamic design preset (replaces "template") that combines a layout,
 * color palette, typography, and metric bindings into an interactive overlay.
 * Inspired by Snapchat Lenses — live preview, instant apply, fully editable.
 */
import type { ReactNode } from "react";
import type { Activity } from "@/shared/types";
import type { PaletteColors } from "@/lib/stickers/types";

// ── Strava Metric ─────────────────────────────────────────────

export interface StravaMetric {
  id: string;
  /** Human-readable label */
  label: string;
  /** Group this metric belongs to */
  group: MetricGroupId;
  /** Short unit string (e.g., "km", "bpm", "kcal") */
  unit: string;
  /** Format function: (activity, metric) => formatted string */
  format: (a: Activity, u?: "metric" | "imperial") => string;
  /** Whether this metric is numeric (for sorting, scaling) */
  numeric: boolean;
  /** Decimal places to show */
  decimals: number;
  /** Available for these activity types (empty = all) */
  activityTypes: string[];
  /** Icon / emoji for the picker */
  icon: string;
}

export type MetricGroupId =
  | "running"
  | "performance"
  | "elevation"
  | "ride"
  | "achievements"
  | "swimming"
  | "hiking"
  | "gym";

export interface MetricGroup {
  id: MetricGroupId;
  label: string;
  icon: string;
}

// ── Lens Layer ────────────────────────────────────────────────

export type LensLayerType = "stat" | "label" | "decoration" | "chart";

export interface MetricBinding {
  /** The metric ID this element displays */
  metricId: string;
  /** Display mode */
  display: "full" | "value-only" | "label-only" | "label-value";
  /** Whether to show the unit */
  showUnit: boolean;
  /** Override decimals (defaults to metric def) */
  decimals?: number;
  /** Custom prefix text */
  prefix?: string;
  /** Custom suffix text */
  suffix?: string;
}

export interface TextStyle {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  fontStyle: "normal" | "italic";
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface LensLayerDef {
  /** Layer type */
  type: LensLayerType;
  /** Unique ID within this lens */
  id: string;
  /** Display name */
  name: string;
  /** Metric binding (only for stat/label types) */
  binding?: MetricBinding;
  /** Static text (for labels, decorations) */
  staticText?: string;
  /** Position (fractional 0-1, relative to canvas) */
  x: number;
  y: number;
  /** Size (fractional 0-1, relative to canvas) */
  w: number;
  h: number;
  /** Rotation in degrees */
  rotation: number;
  /** Typography */
  textStyle: TextStyle;
  /** Fill/ink color preset key or hex */
  color: string;
  /** Background fill */
  background?: string;
  /** Effect flags */
  shadow: boolean;
  blur: boolean;
  border: boolean;
  /** Corner radius */
  borderRadius: number;
  /** Opacity 0-1 */
  opacity: number;
}

// ── Style Preset ──────────────────────────────────────────────

export interface QuickStylePreset {
  id: string;
  name: string;
  icon: string;
  /** Palette override */
  paletteId?: string;
  /** Font override */
  fontFamily?: string;
  /** Font weight override */
  fontWeight?: string;
  /** Background override */
  background?: string;
  /** Text transform override */
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  /** Effect toggles override */
  shadow?: boolean;
  blur?: boolean;
  border?: boolean;
  /** Description for tooltip */
  description: string;
}

// ── Lens Definition ───────────────────────────────────────────

export interface LensDef {
  id: string;
  name: string;
  /** Category for organization */
  category: string;
  /** Sub-category / sport focus */
  sport?: string;
  /** Description */
  description: string;
  /** Preview thumbnail renderer (live with actual data) */
  thumbnail?: (ctx: LensContext) => ReactNode;
  /** Full canvas renderer */
  render: (ctx: LensContext) => ReactNode;
  /** Default palette ID */
  defaultPalette: string;
  /** Default font family */
  defaultFont: string;
  /** Pre-configured layers */
  layers: LensLayerDef[];
  /** Which metrics this lens prominently features */
  features: string[];
  /** Tags for search/filter */
  tags: string[];
}

export interface LensContext {
  /** The bound Strava activity */
  a: Activity;
  /** Computed weekly totals */
  t: import("@/lib/stickers/types").WeekTotals;
  /** Unit preference */
  u: "metric" | "imperial";
  /** Active palette */
  c: PaletteColors;
  /** Active font family */
  fontFamily: string;
  /** Active font weight */
  fontWeight: string;
  /** Active text transform */
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  /** Active style preset ID */
  activePresetId?: string;
  /** Metric overrides (layerId -> metricId) */
  metricOverrides?: Record<string, string>;
  /** Whether to show debug labels */
  debug?: boolean;
}

// ── Lens Category ─────────────────────────────────────────────

export interface LensCategory {
  id: string;
  label: string;
  icon: string;
  /** Whether this is a dynamic category (Recently Used, Trending, etc.) */
  dynamic: boolean;
}

// ── Recently used / favorites tracking ────────────────────────

export interface LensUsage {
  lensId: string;
  lastUsedAt: number;
  useCount: number;
}

// ── Barrel exports for convenience ────────────────────────────

export type { PaletteColors } from "@/lib/stickers/types";

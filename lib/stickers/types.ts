/**
 * Sticker system types — canonical definitions for the 54-sticker registry.
 *
 * Architecture: each sticker is a pure function of (activity, totals, palette, units).
 * The render engine adapts the existing Activity type from shared/types.ts.
 */
import type { Activity } from "@/shared/types";
import type { ReactNode } from "react";

// ── Palette ──────────────────────────────────────────────────

export interface PaletteColors {
  /** Primary text / ink color */
  ink: string;
  /** Secondary / subdued text */
  sub: string;
  /** Accent / highlight */
  accent: string;
  /** Hairline border */
  hair: string;
}

// ── Sticker context passed to every render function ──────────

export interface StickerContext {
  /** The bound Strava activity */
  a: Activity;
  /** Computed weekly totals */
  t: WeekTotals;
  /** Unit preference */
  u: "metric" | "imperial";
  /** Active palette */
  c: PaletteColors;
  /** Optional layer data (for text layers) */
  layer?: { text?: string };
}

// ── Week totals ──────────────────────────────────────────────

export interface WeekTotals {
  totalKm: number;
  count: number;
  streak: number;
  monthKm: number;
  monthCount: number;
  days: { day: string; km: number }[];
}

// ── Sticker definition ───────────────────────────────────────

export interface StickerDef {
  id: string;
  name: string;
  /** Category for filtering (distance, pace, multi, etc.) */
  cat: string;
  /** Visual theme (led, mono, terminal, glass, chart, poster, tape, serif) */
  theme: StickerTheme;
  /** Natural width of the sticker at 1× scale */
  w: number;
  /** Render function returning a React node */
  render: (ctx: StickerContext) => ReactNode;
}

export type StickerTheme =
  | "led"
  | "mono"
  | "terminal"
  | "glass"
  | "chart"
  | "poster"
  | "tape"
  | "serif";

// ── Sticker categories ───────────────────────────────────────

export const STICKER_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "distance", label: "Distance" },
  { id: "pace", label: "Pace" },
  { id: "time", label: "Time" },
  { id: "hr", label: "Heart rate" },
  { id: "elev", label: "Elevation" },
  { id: "splits", label: "Splits" },
  { id: "route", label: "Route" },
  { id: "achievement", label: "Records" },
  { id: "totals", label: "Totals" },
  { id: "date", label: "Date & place" },
  { id: "gear", label: "Gear" },
  { id: "weather", label: "Weather" },
  { id: "multi", label: "Multi-stat" },
];

export const STICKER_THEMES = [
  { id: "all", label: "All themes" },
  { id: "led", label: "LED" },
  { id: "mono", label: "Minimal" },
  { id: "terminal", label: "Terminal" },
  { id: "glass", label: "Glass" },
  { id: "chart", label: "Chart" },
  { id: "poster", label: "Poster" },
  { id: "tape", label: "Tape" },
  { id: "serif", label: "Serif" },
] as const;

// ── Available field (salience-ranked) ─────────────────────────

export interface AvailableField {
  k: string;
  label: string;
  v: string;
  unit: string;
  s: number; // salience 0..1
}

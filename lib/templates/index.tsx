/**
 * Dynamic Templates — templates that adapt their layout, content, and styling
 * based on the actual activity data they receive.
 *
 * Every render function accepts an optional 3rd `colors` argument so the
 * caller can override the colour scheme (e.g. for photo‑overlay use).
 *
 * Architecture: shared helpers live in ./templates/shared/ and individual
 * template files can be extracted into ./templates/templates/ incrementally.
 */

import React from "react";
import { Text, View } from "react-native";
import { Activity, formatDuration } from "../app-data";
import { alpha, BRIGHT_WHITE, type TemplateColors } from "../color-presets";
import { analyseFields, heroField, type AvailableField } from "./shared/analyse-fields";
import { ts, ff, typeEmoji, typeLabel } from "./shared/styling";
import { fmtDateShort, fmtDateFull, fmtTime12, fmtWeekday, paceStr, timeStr } from "./shared/helpers";

// ── Types ──

export interface WeekTotals {
  runKm: number;
  otherKm: number;
  totalKm: number;
  totalMinutes: number;
  items: { day: string; km: number; type: string }[];
}

export interface TemplateDef {
  id: string;
  name: string;
  tab: "activity" | "totals";
  fullWidth?: boolean;
  badge?: "New" | "Dynamic" | "Auto" | "Customize";
  lightCard?: boolean;
  description: string;
  render: (a: Activity, totals: WeekTotals, colors?: TemplateColors) => React.ReactNode;
}

/** @deprecated Use TemplateDef instead */
export type { TemplateDef as DynamicTemplateDef };

// ── Inline style tokens (used by template renders) ──
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

// ── Dynamic template definitions ──

// ── Aggregated template registry ──
// Templates organized by category. Add new templates by creating files
// in templates/activity/ or templates/totals/ and importing them here.

import { ADAPTIVE_CORE } from "./activity/adaptive-core";
import { FANCY } from "./activity/fancy";
import { IDEAS } from "./activity/ideas";
import { BIG_STATS } from "./activity/big-stats";
import { COMBOS } from "./activity/combos";
import { LAYOUTS } from "./activity/layouts";
import { STYLE } from "./activity/style";
import { EXTRAS } from "./activity/extras";
import { TOTALS } from "./totals/totals";

/** All dynamic templates — aggregated from category files */
export const DYNAMIC_TEMPLATES: TemplateDef[] = [
  ...ADAPTIVE_CORE,
  ...FANCY,
  ...IDEAS,
  ...BIG_STATS,
  ...COMBOS,
  ...LAYOUTS,
  ...STYLE,
  ...EXTRAS,
  ...TOTALS,
];

/**
 * Compute weekly totals from an array of activities.
 * Used across the editor and template gallery screens.
 */
export function computeWeekTotals(activities: Activity[]): WeekTotals {
  const runKm = activities.filter((a) => a.type === "run").reduce((s, a) => s + a.distance, 0);
  const otherKm = activities.filter((a) => a.type !== "run").reduce((s, a) => s + a.distance, 0);
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);
  return {
    runKm,
    otherKm,
    totalKm: runKm + otherKm,
    totalMinutes,
    items: activities.map((a) => ({ day: a.date, km: a.distance, type: a.type === "ride" ? "ride" : a.type })),
  };
}

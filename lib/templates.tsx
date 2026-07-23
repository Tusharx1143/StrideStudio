import React from "react";
import { View, Text } from "react-native";
import { Activity, formatDuration } from "./app-data";
import { DYNAMIC_TEMPLATES } from "./dynamic-templates";
import type { TemplateColors } from "./color-presets";

/**
 * Template type definition — a pure function of activity + week data.
 * All templates are now dynamic: they adapt to whatever fields the
 * Strava activity provides.
 *
 * Render functions accept an optional 3rd `colors` argument so the
 * caller can override the colour scheme (e.g. for photo‑overlay use).
 */

export interface TemplateDef {
  id: string;
  name: string;
  tab: "activity" | "totals";
  fullWidth?: boolean;
  badge?: "New" | "Customize";
  lightCard?: boolean;
  render: (a: Activity, totals: WeekTotals, colors?: TemplateColors) => React.ReactNode;
}

export interface WeekTotals {
  runKm: number;
  walkKm: number;
  totalKm: number;
  totalMinutes: number;
  items: { day: string; km: number; type: string }[];
}

export { DYNAMIC_TEMPLATES } from "./dynamic-templates";

/**
 * ALL_TEMPLATES — the full template collection.
 * All templates are dynamically adaptive; no hardcoded layouts remain.
 */
export const ALL_TEMPLATES: TemplateDef[] = DYNAMIC_TEMPLATES.map((dt) => ({
  id: dt.id,
  name: dt.name,
  tab: dt.tab,
  fullWidth: dt.fullWidth,
  badge: dt.badge as "New" | "Customize" | undefined,
  lightCard: dt.lightCard,
  render: dt.render as (a: Activity, totals: WeekTotals, colors?: TemplateColors) => React.ReactNode,
}));

export function computeWeekTotals(activities: Activity[]): WeekTotals {
  const runKm = activities.filter((a) => a.type === "run").reduce((s, a) => s + a.distance, 0);
  const walkKm = activities.filter((a) => a.type !== "run").reduce((s, a) => s + a.distance, 0);
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);
  return {
    runKm,
    walkKm,
    totalKm: runKm + walkKm,
    totalMinutes,
    items: activities.map((a) => ({ day: a.date, km: a.distance, type: a.type === "ride" ? "ride" : a.type })),
  };
}

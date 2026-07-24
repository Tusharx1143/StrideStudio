/**
 * Core types for the StrideStudio app.
 * Activities are now fetched live from Strava via the backend.
 * No mock data.
 */

import type { Activity } from "@/shared/types";
export type { Activity };

export type PeriodId = "all" | "today" | "week" | "month";

export function filterActivitiesByPeriod(activities: Activity[], period: PeriodId): Activity[] {
  const now = new Date();
  const today = now.toDateString();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const mondayStr = monday.toDateString();
  return activities.filter((a) => {
    if (!a.startDate) return true;
    const d = new Date(a.startDate).toDateString();
    switch (period) {
      case "today": return d === today;
      case "week": return d >= mondayStr;
      case "month":
        return (
          new Date(a.startDate).getMonth() === now.getMonth() &&
          new Date(a.startDate).getFullYear() === now.getFullYear()
        );
      default: return true;
    }
  });
}

export interface StatToggles {
  distance: boolean;
  duration: boolean;
  pace: boolean;
  elevation: boolean;
  heartRate: boolean;
  calories: boolean;
}

export function formatDuration(minutes: number, opts?: { compact?: boolean }): string {
  const compact = opts?.compact ?? false;
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h > 0) return `${h}h ${m}m`;
  return compact ? `${m}m` : `${m} min`;
}

export function formatPace(pace: number): string {
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

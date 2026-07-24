/**
 * Core types for the StrideStudio app.
 * Activities are now fetched live from Strava via the backend.
 * No mock data.
 */

export type { Activity } from "@/shared/types";

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

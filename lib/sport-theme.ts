/**
 * Sport-type theming system for StrideStudio.
 * Color-codes each activity type with Strava-inspired palette:
 *   Run → orange, Ride → blue, Workout → green.
 *
 * Used to replace emoji-based indicators with proper icons and sport-aware colors.
 */

import type { Activity } from "./app-data";

export type SportType = Activity["type"];

export interface SportConfig {
  color: string;
  icon: string; // MaterialIcons name
  sfSymbol: string; // SF Symbol name for iOS
  label: string;
  emoji: string; // Keep for text-only fallback contexts
}

export const SPORT_CONFIG: Record<SportType, SportConfig> = {
  run: {
    color: "#FF6B35", // Strava orange
    icon: "directions-run",
    sfSymbol: "figure.run",
    label: "Run",
    emoji: "🏃",
  },
  ride: {
    color: "#0A84FF", // Cycling blue
    icon: "directions-bike",
    sfSymbol: "bicycle",
    label: "Ride",
    emoji: "🚴",
  },
  workout: {
    color: "#34C759", // Fitness green
    icon: "fitness-center",
    sfSymbol: "figure.strengthtraining.traditional",
    label: "Workout",
    emoji: "💪",
  },
};

/** Get sport config for an activity */
export function getSportConfig(type: SportType): SportConfig {
  return SPORT_CONFIG[type];
}

/** Get sport color by type */
export function getSportColor(type: SportType): string {
  return SPORT_CONFIG[type]?.color ?? SPORT_CONFIG.workout.color;
}

/** Format a timestamp as relative time ("2h ago", "Yesterday", "Jul 23") */
export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  // Fall back to date format
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const d = new Date(iso);
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/** Compute achievement badges from activity history */
export interface Achievement {
  id: string;
  label: string;
  value: string;
  emoji: string;
}

export function computeAchievements(activities: Activity[]): Achievement[] {
  const badges: Achievement[] = [];

  const runs = activities.filter((a) => a.type === "run");
  const rides = activities.filter((a) => a.type === "ride");

  // Longest run
  if (runs.length > 0) {
    const longest = runs.reduce((max, a) => (a.distance > max.distance ? a : max), runs[0]);
    badges.push({ id: "longest-run", label: "Longest Run", value: `${longest.distance.toFixed(1)} km`, emoji: "🏆" });
  }

  // Longest ride
  if (rides.length > 0) {
    const longest = rides.reduce((max, a) => (a.distance > max.distance ? a : max), rides[0]);
    badges.push({ id: "longest-ride", label: "Longest Ride", value: `${longest.distance.toFixed(1)} km`, emoji: "🚀" });
  }

  // Fastest pace (run)
  const pacedRuns = runs.filter((a) => a.pace != null && a.pace > 0);
  if (pacedRuns.length > 0) {
    const fastest = pacedRuns.reduce((min, a) => ((a.pace ?? 99) < (min.pace ?? 99) ? a : min), pacedRuns[0]);
    const paceStr = `${Math.floor(fastest.pace!)}:${Math.round(((fastest.pace ?? 0) - Math.floor(fastest.pace ?? 0)) * 60).toString().padStart(2, "0")}/km`;
    badges.push({ id: "fastest-pace", label: "Fastest Pace", value: paceStr, emoji: "⚡" });
  }

  // Highest elevation
  const withElev = activities.filter((a) => a.elevation != null && a.elevation > 0);
  if (withElev.length > 0) {
    const highest = withElev.reduce((max, a) => ((a.elevation ?? 0) > (max.elevation ?? 0) ? a : max), withElev[0]);
    badges.push({ id: "highest-elevation", label: "Most Elevation", value: `${highest.elevation}m`, emoji: "⛰️" });
  }

  // Most calories
  const withCal = activities.filter((a) => a.calories != null && a.calories > 0);
  if (withCal.length > 0) {
    const most = withCal.reduce((max, a) => ((a.calories ?? 0) > (max.calories ?? 0) ? a : max), withCal[0]);
    badges.push({ id: "most-calories", label: "Most Calories", value: `${most.calories} cal`, emoji: "🔥" });
  }

  return badges;
}

/** Compute weekly totals for goal tracking */
export interface WeekStats {
  totalKm: number;
  totalMinutes: number;
  runKm: number;
  rideKm: number;
  workoutCount: number;
  activitiesCount: number;
}

export function computeWeekStats(activities: Activity[]): WeekStats {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weekActs = activities.filter((a) => new Date(a.startDate) >= monday);

  return {
    totalKm: weekActs.reduce((s, a) => s + a.distance, 0),
    totalMinutes: weekActs.reduce((s, a) => s + a.duration, 0),
    runKm: weekActs.filter((a) => a.type === "run").reduce((s, a) => s + a.distance, 0),
    rideKm: weekActs.filter((a) => a.type === "ride").reduce((s, a) => s + a.distance, 0),
    workoutCount: weekActs.filter((a) => a.type === "workout").length,
    activitiesCount: weekActs.length,
  };
}

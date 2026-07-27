/**
 * Strava metric definitions — every statistic available for binding to Lens layers.
 *
 * Groups: Running, Performance, Elevation, Ride, Achievements, Swimming, Hiking, Gym
 * Each metric includes format functions and metadata for the Smart Stats Picker.
 */
import type { Activity } from "@/shared/types";
import type { StravaMetric, MetricGroup, MetricGroupId } from "./types";

// ── Shared helpers ────────────────────────────────────────────

const NS = "—";
const pad = (n: number): string => String(n).padStart(2, "0");
export const NS_SYMBOL = NS;

/** Format duration minutes → "1:23:45" or "23:45" */
function fmtDuration(minutes?: number): string {
  if (minutes == null || isNaN(minutes)) return NS;
  const sec = Math.round(minutes * 60);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Duration in words: "1h 23m" */
function fmtDurationWords(minutes?: number): string {
  if (minutes == null || isNaN(minutes)) return NS;
  const sec = Math.round(minutes * 60);
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Distance in km/mi */
function fmtDist(a: Activity, u: "metric" | "imperial"): string {
  if (a.distance == null) return NS;
  return u === "imperial" ? (a.distance * 0.621371).toFixed(2) : a.distance.toFixed(2);
}

/** Pace: "5:32 /km" */
function fmtPace(a: Activity, u: "metric" | "imperial"): string {
  if (a.pace == null) return "--:--";
  const paceSec = a.pace * 60;
  const p = u === "imperial" ? paceSec / 0.621371 : paceSec;
  return `${Math.floor(p / 60)}:${pad(Math.round(p % 60))}`;
}

/** Speed: "28.6" */
function fmtSpeed(a: Activity, u: "metric" | "imperial"): string {
  if (a.speed == null) return NS;
  return u === "imperial" ? (a.speed * 0.621371).toFixed(1) : a.speed.toFixed(1);
}

/** Elevation in m/ft */
function fmtElev(a: Activity, u: "metric" | "imperial"): string {
  if (a.elevation == null) return NS;
  return u === "imperial" ? String(Math.round(a.elevation * 3.28084)) : String(Math.round(a.elevation));
}

/** Heart rate as bpm */
function fmtHR(a: Activity): string {
  if (a.heartRate == null) return NS;
  return `${Math.round(a.heartRate)}`;
}

/** Max heart rate */
function fmtMaxHR(a: Activity): string {
  if (a.maxHeartRate == null) return NS;
  return `${Math.round(a.maxHeartRate)}`;
}

/** Calories */
function fmtCal(a: Activity): string {
  if (a.calories == null) return NS;
  return `${Math.round(a.calories)}`;
}

/** Average grade */
function fmtGrade(a: Activity): string {
  if (a.elevation == null || a.distance == null || a.distance === 0) return NS;
  return ((a.elevation / 1000 / a.distance) * 100).toFixed(1);
}

// ── Metric Groups ─────────────────────────────────────────────

export const METRIC_GROUPS: MetricGroup[] = [
  { id: "running", label: "Running", icon: "🏃" },
  { id: "performance", label: "Performance", icon: "📊" },
  { id: "elevation", label: "Elevation", icon: "⛰️" },
  { id: "ride", label: "Ride Metrics", icon: "🚴" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "hiking", label: "Hiking", icon: "🥾" },
  { id: "gym", label: "Gym", icon: "💪" },
];

// ── All Metrics ───────────────────────────────────────────────

export const METRICS: StravaMetric[] = [
  // ── Running ──
  {
    id: "distance", label: "Distance", group: "running",
    unit: "km", format: (a, u) => `${fmtDist(a, u || "metric")}`,
    numeric: true, decimals: 2, activityTypes: [], icon: "📏",
  },
  {
    id: "pace", label: "Pace", group: "running",
    unit: "/km", format: (a, u) => fmtPace(a, u || "metric"),
    numeric: false, decimals: 0, activityTypes: ["run", "hike"], icon: "⏱️",
  },
  {
    id: "moving_time", label: "Moving Time", group: "running",
    unit: "", format: (a) => fmtDuration(a.duration),
    numeric: false, decimals: 0, activityTypes: [], icon: "⏰",
  },
  {
    id: "elapsed_time", label: "Elapsed Time", group: "running",
    unit: "", format: (a) => fmtDuration(a.elapsedTime),
    numeric: false, decimals: 0, activityTypes: [], icon: "🕐",
  },
  {
    id: "splits", label: "Splits (best avg)", group: "running",
    unit: "/km", format: (a, u) => a.pace ? fmtPace(a, u || "metric") : NS,
    numeric: false, decimals: 0, activityTypes: ["run"], icon: "📊",
  },

  // ── Performance ──
  {
    id: "avg_heart_rate", label: "Avg Heart Rate", group: "performance",
    unit: "bpm", format: (a) => fmtHR(a),
    numeric: true, decimals: 0, activityTypes: [], icon: "❤️",
  },
  {
    id: "max_heart_rate", label: "Max Heart Rate", group: "performance",
    unit: "bpm", format: (a) => fmtMaxHR(a),
    numeric: true, decimals: 0, activityTypes: [], icon: "💓",
  },
  {
    id: "power", label: "Power", group: "performance",
    unit: "W", format: (a) => NS, // Not in current Activity type — placeholder
    numeric: true, decimals: 0, activityTypes: ["ride"], icon: "⚡",
  },
  {
    id: "cadence", label: "Cadence", group: "performance",
    unit: "rpm", format: (a) => NS,
    numeric: true, decimals: 0, activityTypes: ["ride", "run"], icon: "🔄",
  },
  {
    id: "calories", label: "Calories", group: "performance",
    unit: "kcal", format: (a) => fmtCal(a),
    numeric: true, decimals: 0, activityTypes: [], icon: "🔥",
  },
  {
    id: "suffer_score", label: "Suffer Score", group: "performance",
    unit: "", format: (a) => a.sufferScore != null ? String(a.sufferScore) : NS,
    numeric: true, decimals: 0, activityTypes: [], icon: "😰",
  },
  {
    id: "avg_temp", label: "Average Temp", group: "performance",
    unit: "°C", format: (a) => a.averageTemp != null ? `${Math.round(a.averageTemp)}°` : NS,
    numeric: true, decimals: 0, activityTypes: [], icon: "🌡️",
  },

  // ── Elevation ──
  {
    id: "elevation_gain", label: "Elevation Gain", group: "elevation",
    unit: "m", format: (a, u) => fmtElev(a, u || "metric"),
    numeric: true, decimals: 0, activityTypes: [], icon: "⛰️",
  },
  {
    id: "max_elevation", label: "Max Elevation", group: "elevation",
    unit: "m", format: (a, u) => a.elevation != null
      ? (u === "imperial" ? `${Math.round(a.elevation * 3.28084)}` : `${Math.round(a.elevation)}`)
      : NS,
    numeric: true, decimals: 0, activityTypes: [], icon: "🏔️",
  },
  {
    id: "avg_grade", label: "Average Grade", group: "elevation",
    unit: "%", format: (a) => fmtGrade(a),
    numeric: true, decimals: 1, activityTypes: [], icon: "📈",
  },

  // ── Ride ──
  {
    id: "speed", label: "Speed", group: "ride",
    unit: "km/h", format: (a, u) => fmtSpeed(a, u || "metric"),
    numeric: true, decimals: 1, activityTypes: ["ride"], icon: "🚴",
  },
  {
    id: "max_speed", label: "Max Speed", group: "ride",
    unit: "km/h", format: (a, u) => a.maxSpeed != null
      ? (u === "imperial" ? (a.maxSpeed * 0.621371).toFixed(1) : a.maxSpeed.toFixed(1))
      : NS,
    numeric: true, decimals: 1, activityTypes: ["ride"], icon: "💨",
  },
  {
    id: "avg_speed", label: "Average Speed", group: "ride",
    unit: "km/h", format: (a, u) => a.speed != null
      ? (u === "imperial" ? (a.speed * 0.621371).toFixed(1) : a.speed.toFixed(1))
      : NS,
    numeric: true, decimals: 1, activityTypes: ["ride"], icon: "📊",
  },

  // ── Achievements ──
  {
    id: "achievement_count", label: "Achievements", group: "achievements",
    unit: "", format: () => "3", // Placeholder — Strava achievements via API
    numeric: true, decimals: 0, activityTypes: [], icon: "🏆",
  },
  {
    id: "pr_count", label: "Personal Records", group: "achievements",
    unit: "", format: () => "1",
    numeric: true, decimals: 0, activityTypes: [], icon: "⭐",
  },
  {
    id: "date", label: "Date", group: "achievements",
    unit: "", format: (a) => a.date || a.startDate?.slice(0, 10) || NS,
    numeric: false, decimals: 0, activityTypes: [], icon: "📅",
  },
  {
    id: "activity_type", label: "Activity Type", group: "achievements",
    unit: "", format: (a) => a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : NS,
    numeric: false, decimals: 0, activityTypes: [], icon: "🏃",
  },
  {
    id: "device", label: "Device", group: "achievements",
    unit: "", format: (a) => a.deviceName || NS,
    numeric: false, decimals: 0, activityTypes: [], icon: "⌚",
  },

  // ── Gym ──
  {
    id: "workout_type", label: "Workout Type", group: "gym",
    unit: "", format: (a) => a.type === "workout" ? "Workout" : NS,
    numeric: false, decimals: 0, activityTypes: ["workout"], icon: "💪",
  },
];

// ── Lookup helpers ────────────────────────────────────────────

export function getMetric(id: string): StravaMetric | undefined {
  return METRICS.find((m) => m.id === id);
}

export function getMetricsByGroup(groupId: MetricGroupId): StravaMetric[] {
  return METRICS.filter((m) => m.group === groupId);
}

export function getAvailableMetrics(activity: Activity): StravaMetric[] {
  const { type } = activity;
  return METRICS.filter((m) => m.activityTypes.length === 0 || m.activityTypes.includes(type));
}

export function getMetricsForActivityType(type: string): StravaMetric[] {
  return METRICS.filter((m) => m.activityTypes.length === 0 || m.activityTypes.includes(type));
}

/** Format a metric value for display */
export function formatMetricValue(
  metricId: string,
  activity: Activity,
  units: "metric" | "imperial" = "metric",
): string {
  const metric = getMetric(metricId);
  if (!metric) return NS;
  return metric.format(activity, units);
}

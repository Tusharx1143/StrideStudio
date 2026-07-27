/**
 * Sticker formatters — ported from the design-handoff stickers.js.
 *
 * Every formatter takes the existing Activity type (shared/types.ts)
 * and an optional units parameter. Missing fields render "Not specified".
 *
 * These bridge the gap between the existing data model and the handoff's
 * expected field names (distanceKm, movingSec, paceSecPerKm, etc.).
 */
import type { Activity } from "@/shared/types";

// ── Constants ────────────────────────────────────────────────

export const NS = "Not specified";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
const MONTHS_LONG = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
const DAYS = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
  "THURSDAY", "FRIDAY", "SATURDAY",
];

const pad = (n: number): string => String(n).padStart(2, "0");

// ── Duration formatters ──────────────────────────────────────

/** Convert minutes to seconds, format as h:mm:ss or m:ss */
export function dur(minutes?: number): string {
  if (minutes == null) return NS;
  const sec = Math.round(minutes * 60);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Convert minutes to human-readable duration like "1H 04M" or "42 MIN" */
export function durWords(minutes?: number): string {
  if (minutes == null) return NS;
  const sec = Math.round(minutes * 60);
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}H ${pad(m)}M` : `${m} MIN`;
}

// ── Distance ─────────────────────────────────────────────────

export function dist(a: Activity, u: "metric" | "imperial" = "metric"): string {
  if (a.distance == null) return NS;
  return u === "imperial"
    ? (a.distance * 0.621371).toFixed(2)
    : a.distance.toFixed(2);
}

export function distUnit(
  u: "metric" | "imperial" = "metric",
): string {
  return u === "imperial" ? "MILES" : "KILOMETERS";
}

export function distUnitShort(
  u: "metric" | "imperial" = "metric",
): string {
  return u === "imperial" ? "mi" : "km";
}

// ── Pace ─────────────────────────────────────────────────────

export function pace(
  a: Activity,
  u: "metric" | "imperial" = "metric",
): string {
  if (a.pace == null) return "--:--";
  // a.pace is in min/km; handoff expects sec/km
  const paceSecPerKm = a.pace * 60;
  const p =
    u === "imperial" ? paceSecPerKm / 0.621371 : paceSecPerKm;
  return `${Math.floor(p / 60)}:${pad(Math.round(p % 60))}`;
}

export function paceUnit(
  u: "metric" | "imperial" = "metric",
): string {
  return u === "imperial" ? "MIN / MI" : "MIN / KM";
}

// ── Speed ────────────────────────────────────────────────────

export function speed(
  a: Activity,
  u: "metric" | "imperial" = "metric",
): string {
  if (a.speed == null) return NS;
  return u === "imperial"
    ? (a.speed * 0.621371).toFixed(1)
    : a.speed.toFixed(1);
}

export function speedUnit(
  u: "metric" | "imperial" = "metric",
): string {
  return u === "imperial" ? "MPH" : "KM/H";
}

// ── Elevation ────────────────────────────────────────────────

export function elev(
  a: Activity,
  u: "metric" | "imperial" = "metric",
): number | string {
  if (a.elevation == null) return NS;
  return u === "imperial"
    ? Math.round(a.elevation * 3.28084)
    : a.elevation;
}

export function elevUnit(
  u: "metric" | "imperial" = "metric",
): string {
  return u === "imperial" ? "FEET" : "METERS";
}

// ── Date / time ──────────────────────────────────────────────

export function dateShort(a: Activity): string {
  if (!a.startDate) return NS;
  const d = new Date(a.startDate);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function dateFull(a: Activity): string {
  if (!a.startDate) return NS;
  const d = new Date(a.startDate);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function weekday(a: Activity): string {
  if (!a.startDate) return NS;
  return DAYS[new Date(a.startDate).getDay()];
}

export function time12(a: Activity): string {
  if (!a.startDate) return NS;
  const d = new Date(a.startDate);
  const h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
}

// ── Activity type label ──────────────────────────────────────

export function typeLabel(a: Activity): string {
  const t: string = a.type;
  switch (t) {
    case "run":
      return "RUN";
    case "ride":
      return "RIDE";
    case "workout":
      return "WORKOUT";
    default:
      return (t || "activity").toUpperCase();
  }
}

// ── Fields: salience-ranked available fields ──────────────────
// The adaptive core — mirrors the handoff's `fields()` exactly.

export interface AvailableField {
  k: string;
  label: string;
  v: string;
  unit: string;
  s: number;
}

export function fields(
  a: Activity,
  u: "metric" | "imperial" = "metric",
): AvailableField[] {
  const out: AvailableField[] = [];

  if (a.distance != null)
    out.push({
      k: "distance",
      label: "DISTANCE",
      v: dist(a, u),
      unit: distUnitShort(u),
      s: 0.8,
    });
  if (a.duration != null)
    out.push({
      k: "duration",
      label: "MOVING TIME",
      v: dur(a.duration),
      unit: "",
      s: 0.6,
    });
  if (a.pace != null)
    out.push({
      k: "pace",
      label: "PACE",
      v: pace(a, u),
      unit: u === "imperial" ? "/mi" : "/km",
      s: 0.75,
    });
  if (a.speed != null && a.type === "ride")
    out.push({
      k: "speed",
      label: "AVG SPEED",
      v: speed(a, u),
      unit: speedUnit(u).toLowerCase(),
      s: 0.7,
    });
  if (a.elevation != null && a.elevation > 0)
    out.push({
      k: "elev",
      label: "ELEV GAIN",
      v: String(elev(a, u)),
      unit: u === "imperial" ? "ft" : "m",
      s: Math.min(1, a.elevation / 500),
    });
  if (a.hasHeartrate && a.heartRate != null && a.heartRate > 0)
    out.push({
      k: "hr",
      label: "AVG HR",
      v: String(a.heartRate),
      unit: "bpm",
      s: Math.min(1, (a.heartRate - 80) / 100),
    });
  if (a.calories != null && a.calories > 0)
    out.push({
      k: "cal",
      label: "CALORIES",
      v: String(a.calories),
      unit: "cal",
      s: Math.min(1, a.calories / 1000),
    });

  return out.sort((x, y) => y.s - x.s);
}

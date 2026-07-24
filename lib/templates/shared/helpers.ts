/**
 * Shared template rendering helpers.
 */
import type { Activity } from "@/lib/app-data";

export const serif = { fontFamily: "Georgia" as const };
export const mono = { fontFamily: "Courier" as const };

export function paceStr(a: Activity): string {
  if (a.pace == null) return "--";
  const min = Math.floor(a.pace);
  const sec = Math.round((a.pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

export function timeStr(a: Activity): string {
  return durationStr(a.duration).toUpperCase();
}

export function durationStr(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
export const MONTHS_LONG = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
export const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

export function fmtDateShort(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function fmtDateFull(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function fmtTime12(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${d.getMinutes().toString().padStart(2, "0")} ${ampm}`;
}

export function fmtWeekday(iso?: string): string {
  if (!iso) return "";
  return DAYS[new Date(iso).getDay()];
}

export function typeEmoji(type: string): string {
  switch (type) {
    case "run": return "🏃";
    case "ride": return "🚴";
    case "workout": return "💪";
    default: return "🏃";
  }
}

export function typeLabel(type: string): string {
  switch (type) {
    case "run": return "RUN";
    case "ride": return "RIDE";
    case "workout": return "WORKOUT";
    default: return "ACTIVITY";
  }
}

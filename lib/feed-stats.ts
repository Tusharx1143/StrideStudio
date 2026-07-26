import type { Activity } from "@/lib/app-data";

/** Per-type accent + label, shared by the Home feed, Activity detail, and editor. */
export const ACTIVITY_META: Record<Activity["type"], { label: string; accent: string }> = {
  run: { label: "Run", accent: "#FF6B35" },
  ride: { label: "Ride", accent: "#0A84FF" },
  workout: { label: "Workout", accent: "#BF5AF2" },
};

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Rolling 7-day distance strip ending today (not calendar-week aligned, so it
 * always shows "the last week" regardless of what day it is).
 */
export function computeWeekStrip(activities: Activity[]): { day: string; km: number | null }[] {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return { date, km: 0, hasActivity: false };
  });

  for (const activity of activities) {
    const activityDay = startOfDay(new Date(activity.startDate));
    const bucket = buckets.find((b) => b.date.getTime() === activityDay.getTime());
    if (bucket) {
      bucket.km += activity.distance;
      bucket.hasActivity = true;
    }
  }

  return buckets.map((b) => ({
    day: DAY_LABELS[b.date.getDay()],
    km: b.hasActivity ? b.km : null,
  }));
}

/** Total distance across the same rolling 7-day window. */
export function computeWeekTotalKm(activities: Activity[]): number {
  return computeWeekStrip(activities).reduce((sum, d) => sum + (d.km ?? 0), 0);
}

/**
 * Count of consecutive calendar weeks (Monday-anchored), walking back from
 * the current week, that contain at least one activity. Limited by however
 * much activity history is loaded, so this is a lower bound, not an exact
 * lifetime streak.
 */
export function computeStreakWeeks(activities: Activity[]): number {
  if (activities.length === 0) return 0;

  const weekKey = (date: Date) => {
    const d = startOfDay(date);
    // Shift so Monday = 0 .. Sunday = 6, then find that week's Monday.
    const dayIndex = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayIndex);
    return d.getTime();
  };

  const weeksWithActivity = new Set(activities.map((a) => weekKey(new Date(a.startDate))));

  let streak = 0;
  const cursor = new Date();
  for (;;) {
    if (!weeksWithActivity.has(weekKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

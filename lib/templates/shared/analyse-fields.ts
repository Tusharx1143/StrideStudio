/**
 * Activity data analysis — extracts available fields from an activity
 * and ranks them by salience for smart template rendering.
 *
 * Updated to match the design-handoff `fields()` logic with
 * units support (metric / imperial) and proper speed/pace conditionals.
 */
import type { Activity } from "@/shared/types";
import { dist, distUnitShort, dur, pace, speed, speedUnit, elev } from "@/lib/stickers/formatters";

export interface AvailableField {
  key: string;
  label: string;
  value: string;
  salience: number; // 0..1
}

export function analyseFields(
  a: Activity,
  units: "metric" | "imperial" = "metric",
): AvailableField[] {
  const fields: AvailableField[] = [];

  if (a.distance != null)
    fields.push({
      key: "distance",
      label: "DISTANCE",
      value: `${dist(a, units)} ${distUnitShort(units)}`,
      salience: 0.8,
    });

  if (a.duration != null)
    fields.push({
      key: "duration",
      label: "MOVING TIME",
      value: dur(a.duration),
      salience: 0.6,
    });

  if (a.pace != null) {
    const paceSalience = Math.min(1, Math.max(0.3, 1 - a.pace / 12));
    fields.push({
      key: "pace",
      label: "PACE",
      value: `${pace(a, units)} ${units === "imperial" ? "/mi" : "/km"}`,
      salience: paceSalience,
    });
  }

  // Speed is ride-only per the handoff spec
  if (a.speed != null && a.type === "ride") {
    fields.push({
      key: "speed",
      label: "AVG SPEED",
      value: `${speed(a, units)} ${speedUnit(units).toLowerCase()}`,
      salience: 0.7,
    });
  }

  if (a.elevation != null && a.elevation > 0) {
    fields.push({
      key: "elevation",
      label: "ELEV GAIN",
      value: `${elev(a, units)} ${units === "imperial" ? "ft" : "m"}`,
      salience: Math.min(1, Math.max(0.2, a.elevation / 500)),
    });
  }

  if (a.hasHeartrate && a.heartRate != null && a.heartRate > 0) {
    fields.push({
      key: "heartRate",
      label: "AVG HR",
      value: `${a.heartRate} bpm`,
      salience: Math.min(1, Math.max(0.3, (a.heartRate - 80) / 100)),
    });
  }

  if (a.calories != null && a.calories > 0) {
    fields.push({
      key: "calories",
      label: "CALORIES",
      value: `${a.calories} cal`,
      salience: Math.min(1, Math.max(0.2, a.calories / 1000)),
    });
  }

  fields.sort((x, y) => y.salience - x.salience);
  return fields;
}

export function heroField(
  fields: AvailableField[],
): AvailableField | null {
  return fields.length > 0 ? fields[0] : null;
}

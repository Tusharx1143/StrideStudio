/**
 * Activity data analysis — extracts available fields from an activity
 * and ranks them by salience for smart template rendering.
 */
import type { Activity } from "@/lib/app-data";
import { formatDuration } from "@/lib/app-data";

export interface AvailableField {
  key: string;
  label: string;
  value: string;
  salience: number; // 0..1
}

export function analyseFields(a: Activity): AvailableField[] {
  const fields: AvailableField[] = [];

  fields.push({ key: "distance", label: "DISTANCE", value: `${a.distance.toFixed(2)} km`, salience: 0.8 });
  fields.push({ key: "duration", label: "DURATION", value: formatDuration(a.duration), salience: 0.6 });

  if (a.pace != null) {
    const paceMin = Math.floor(a.pace);
    const paceSec = Math.round((a.pace - paceMin) * 60);
    const paceSalience = Math.min(1, Math.max(0.3, 1 - (a.pace / 12)));
    fields.push({ key: "pace", label: "PACE", value: `${paceMin}:${String(paceSec).padStart(2, "0")}/km`, salience: paceSalience });
  }

  if (a.speed != null) {
    fields.push({ key: "speed", label: "SPEED", value: `${a.speed.toFixed(1)} km/h`, salience: Math.min(1, Math.max(0.3, a.speed / 30)) });
  }

  if (a.elevation != null && a.elevation > 0) {
    fields.push({ key: "elevation", label: "ELEVATION", value: `${a.elevation} m`, salience: Math.min(1, Math.max(0.2, a.elevation / 500)) });
  }

  if (a.hasHeartrate && a.heartRate != null && a.heartRate > 0) {
    fields.push({ key: "heartRate", label: "AVG HR", value: `${a.heartRate} bpm`, salience: Math.min(1, Math.max(0.3, (a.heartRate - 80) / 100)) });
  }

  if (a.calories != null && a.calories > 0) {
    fields.push({ key: "calories", label: "CALORIES", value: `${a.calories} cal`, salience: Math.min(1, Math.max(0.2, a.calories / 1000)) });
  }

  fields.sort((x, y) => y.salience - x.salience);
  return fields;
}

export function heroField(fields: AvailableField[]): AvailableField | null {
  return fields.length > 0 ? fields[0] : null;
}

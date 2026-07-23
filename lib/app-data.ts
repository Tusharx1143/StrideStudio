/**
 * Core types for the StrideStudio app.
 * Activities are now fetched live from Strava via the backend.
 * No mock data.
 */

export interface Activity {
  id: string;
  stravaId: number;
  type: "run" | "ride" | "workout";
  title: string;
  distance: number; // km
  duration: number; // minutes (moving time)
  elapsedTime: number; // minutes (total elapsed)
  date: string;
  startDate: string; // ISO 8601
  pace?: number; // min/km
  speed?: number; // km/h
  maxSpeed?: number; // km/h
  elevation?: number; // meters
  heartRate?: number; // avg bpm
  maxHeartRate?: number;
  calories?: number;
  averageTemp?: number;
  hasHeartrate: boolean;
  sufferScore?: number;
  startLatlng?: [number, number];
  summaryPolyline?: string;
  deviceName?: string;
}

export interface StatToggles {
  distance: boolean;
  duration: boolean;
  pace: boolean;
  elevation: boolean;
  heartRate: boolean;
  calories: boolean;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function formatPace(pace: number): string {
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

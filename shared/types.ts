/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ── Core Domain Types ────────────────────────────────────────────────────

/**
 * Activity represents a single Strava activity synced to the app.
 * Single source of truth — both client and server import from here.
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

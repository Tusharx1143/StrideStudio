/**
 * App configuration — reads from expo-constants (app.config.ts extra fields)
 * with sensible dev fallbacks. No hardcoded URLs.
 */
import Constants from "expo-constants";

function getExtra(key: string, fallback: string): string;
function getExtra(key: string, fallback: boolean): boolean;
function getExtra(key: string, fallback: string | boolean): string | boolean {
  const extras = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extras?.[key];
  // Guard against empty string placeholders
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "boolean") return value;
  return fallback;
}

/** Backend API base URL (configurable via API_URL env var) */
export const API_BASE = getExtra("apiUrl", "http://localhost:3000") as string;

/** Whether mock Strava mode is enabled (no real OAuth needed) */
export const USE_MOCK_STRAVA = getExtra("useMockStrava", false) as boolean;

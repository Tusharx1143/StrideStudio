/**
 * App configuration — reads from expo-constants (app.config.ts extra fields)
 * with sensible dev fallbacks. No hardcoded URLs.
 */
import Constants from "expo-constants";

function getExtra(key: string, fallback: string): string {
  const extras = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const value = extras?.[key];
  // Guard against empty string placeholders
  if (typeof value === "string" && value.length > 0) return value;
  return fallback;
}

/** Backend API base URL (configurable via API_URL env var) */
export const API_BASE = getExtra("apiUrl", "http://localhost:3000");

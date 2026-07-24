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

/** Strava OAuth client ID (exposed via EXPO_PUBLIC_STRAVA_CLIENT_ID) */
export function getStravaClientId(): string {
  // Expo injects EXPO_PUBLIC_* vars at build time
  const fromEnv = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID as string | undefined;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  // Fallback to extra field (for app.config.ts extra.stravaClientId)
  return getExtra("stravaClientId", "267147");
}

/**
 * Whether mock Strava mode is enabled (no real OAuth needed).
 * Uses EXPO_PUBLIC_ prefix so Metro inlines it into the client bundle.
 * Falls back to extra field (from app.config.ts) for compatibility.
 */
export const USE_MOCK_STRAVA: boolean =
  process.env.EXPO_PUBLIC_USE_MOCK_STRAVA === "true" ||
  (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.useMockStrava === true;

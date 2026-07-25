export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// ── AsyncStorage Key Registry ──
// Centralized key namespace to prevent collisions and improve discoverability.

export const STORAGE_KEYS = {
  /** Persistent UI state (selected activity, template, stat toggles, etc.) */
  APP_STATE: "stride-studio-state",
  /** Cached Strava activities list */
  CACHED_ACTIVITIES: "stride-cached-activities",
  /** Cached Strava athlete profile */
  CACHED_ATHLETE: "stride-cached-athlete",
  /** Session token for auth */
  SESSION_TOKEN: "app_session_token",
  /** Runtime user info (manus preview environment) */
  USER_INFO: "manus-runtime-user-info",
} as const;

/**
 * StravaDataSource — client-side data seam for Strava integration.
 *
 * Mirrors the server-side StravaService adapter pattern. The interface
 * is the test surface: swap implementations to test without a running
 * tRPC server, or to add future data sources (HealthKit, Garmin, etc.).
 *
 * One real implementation + one test implementation = real seam.
 */

import type { Activity } from "@/shared/types";
import type { StravaAthlete } from "./strava-data";

// ── Types ──────────────────────────────────────────────────────────────────

export interface StravaStatusResult {
  connected: boolean;
  athlete: StravaAthlete | null;
}

export interface StravaActivitiesResult {
  activities: Activity[];
}

/**
 * Query state mirroring the shape returned by tRPC's useQuery.
 * Keeps the interface agnostic to the underlying fetch mechanism.
 */
export interface QueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ── Interface ──────────────────────────────────────────────────────────────

export interface StravaDataSource {
  /** Connection status + athlete profile */
  useStatus(): QueryState<StravaStatusResult>;

  /** Paginated activity list */
  useActivities(opts: { enabled: boolean }): QueryState<StravaActivitiesResult>;
}

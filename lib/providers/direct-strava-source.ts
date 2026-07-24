/**
 * direct-strava-source.ts — Production Strava data source.
 *
 * Uses @tanstack/react-query useQuery hooks calling the StravaApiClient directly.
 * No tRPC, no server proxy — direct fetch from the Strava REST API.
 */

import { useQuery } from "@tanstack/react-query";
import { stravaApi } from "@/lib/strava-api";
import type {
  StravaDataSource,
  QueryState,
  StravaStatusResult,
  StravaActivitiesResult,
} from "./strava-source";

export function createDirectStravaSource(): StravaDataSource {
  return {
    useStatus(): QueryState<StravaStatusResult> {
      const query = useQuery<StravaStatusResult>({
        queryKey: ["strava", "status"],
        queryFn: async () => {
          const status = await stravaApi.getConnectionStatus();
          if (!status.connected) {
            return { connected: false, athlete: null };
          }
          try {
            const athlete = await stravaApi.getAthlete();
            return { connected: true, athlete };
          } catch {
            return { connected: true, athlete: null };
          }
        },
        retry: 1,
        retryDelay: 2000,
        staleTime: 30_000,
      });

      return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error
          ? new Error(query.error.message ?? "Failed to load Strava status")
          : null,
        refetch: () => query.refetch(),
      };
    },

    useActivities(opts: { enabled: boolean }): QueryState<StravaActivitiesResult> {
      const query = useQuery<StravaActivitiesResult>({
        queryKey: ["strava", "activities"],
        queryFn: async () => {
          const activities = await stravaApi.getActivities(1, 50);
          return { activities };
        },
        enabled: opts.enabled,
        retry: 1,
        retryDelay: 2000,
        staleTime: 30_000,
      });

      return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error
          ? new Error(query.error.message ?? "Failed to load activities from Strava")
          : null,
        refetch: () => query.refetch(),
      };
    },
  };
}

// Mock/production selection is done in strava-data.tsx via static imports.

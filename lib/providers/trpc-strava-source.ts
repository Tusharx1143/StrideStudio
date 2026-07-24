/**
 * TRPCStravaSource — production implementation of StravaDataSource
 * backed by the tRPC client.
 */

import { trpc } from "@/lib/trpc";
import type { StravaDataSource, QueryState } from "./strava-source";

export function createTRPCStravaSource(): StravaDataSource {
  return {
    useStatus() {
      const { data, isLoading, error, refetch } =
        trpc.strava.status.useQuery(undefined, {
          retry: 1,
          retryDelay: 2000,
          staleTime: 30_000,
        });

      return {
        data: data as any,
        isLoading,
        error: error ? new Error("Failed to load Strava status") : null,
        refetch,
      };
    },

    useActivities(opts: { enabled: boolean }) {
      const { data, isLoading, error, refetch } =
        trpc.strava.activities.list.useQuery(
          { page: 1, perPage: 50 },
          {
            enabled: opts.enabled,
            retry: 1,
            retryDelay: 2000,
            staleTime: 30_000,
          },
        );

      return {
        data: data as any,
        isLoading,
        error: error ? new Error("Failed to load activities from Strava") : null,
        refetch,
      };
    },
  };
}

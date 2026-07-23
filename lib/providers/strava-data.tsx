/**
 * StravaDataProvider — fetches and caches Strava activities/athlete data.
 *
 * Separated from UI state and persistence concerns so it can be tested
 * independently or swapped for mock data.
 */
import React, { createContext, useContext, useCallback, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import type { Activity } from "@/lib/app-data";

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  city: string | null;
  country: string | null;
  profile: string;
  premium: boolean;
}

export interface StravaDataState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  stravaConnected: boolean;
  athlete: StravaAthlete | null;
  refresh: () => void;
}

const StravaDataContext = createContext<StravaDataState | null>(null);

export function StravaDataProvider({ children }: { children: ReactNode }) {
  const { data: statusData, refetch: refetchStatus } = trpc.strava.status.useQuery(undefined, {
    retry: 1,
    retryDelay: 2000,
    staleTime: 30_000,
  });

  const stravaConnected = statusData?.connected ?? false;
  const athlete = statusData?.athlete ?? null;

  const {
    data: activitiesData,
    isLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = trpc.strava.activities.list.useQuery(
    { page: 1, perPage: 50 },
    {
      enabled: stravaConnected,
      retry: 1,
      retryDelay: 2000,
      staleTime: 30_000,
    },
  );

  const activities = activitiesData?.activities ?? [];
  const error = activitiesError ? "Failed to load activities from Strava" : null;

  const refresh = useCallback(() => {
    refetchStatus();
    refetchActivities();
  }, [refetchStatus, refetchActivities]);

  const value: StravaDataState = { activities, loading: isLoading, error, stravaConnected, athlete, refresh };

  return <StravaDataContext.Provider value={value}>{children}</StravaDataContext.Provider>;
}

export function useStravaData(): StravaDataState {
  const ctx = useContext(StravaDataContext);
  if (!ctx) throw new Error("useStravaData must be used within StravaDataProvider");
  return ctx;
}

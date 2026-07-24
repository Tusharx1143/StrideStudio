/**
 * StravaDataProvider — fetches and caches Strava activities/athlete data.
 *
 * Accepts an optional StravaDataSource for testability. Defaults to the
 * tRPC-backed production implementation so existing callers work unchanged.
 *
 * The data source interface is the test surface — swap in a fixture
 * implementation to test without a running server.
 */
import React, { createContext, useContext, useCallback, type ReactNode } from "react";
import type { Activity } from "@/shared/types";
import type { StravaDataSource } from "./strava-source";
import { createTRPCStravaSource } from "./trpc-strava-source";

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

export function StravaDataProvider({
  children,
  source,
}: {
  children: ReactNode;
  /** Injectable data source — defaults to tRPC. Swap for tests. */
  source?: StravaDataSource;
}) {
  const ds = source ?? createTRPCStravaSource();

  const { data: statusData, refetch: refetchStatus } = ds.useStatus();

  const stravaConnected = statusData?.connected ?? false;
  const athlete = (statusData?.athlete ?? null) as StravaAthlete | null;

  const {
    data: activitiesData,
    isLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = ds.useActivities({ enabled: stravaConnected });

  const activities = (activitiesData?.activities ?? []) as Activity[];
  const error = activitiesError ? activitiesError.message : null;

  const refresh = useCallback(() => {
    refetchStatus();
    refetchActivities();
  }, [refetchStatus, refetchActivities]);

  const value: StravaDataState = {
    activities,
    loading: isLoading,
    error,
    stravaConnected,
    athlete,
    refresh,
  };

  return (
    <StravaDataContext.Provider value={value}>
      {children}
    </StravaDataContext.Provider>
  );
}

export function useStravaData(): StravaDataState {
  const ctx = useContext(StravaDataContext);
  if (!ctx) throw new Error("useStravaData must be used within StravaDataProvider");
  return ctx;
}

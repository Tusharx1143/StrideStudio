/**
 * StravaDataProvider — fetches and caches Strava activities/athlete data.
 *
 * Accepts an optional StravaDataSource for testability. Defaults to the
 * tRPC-backed production implementation so existing callers work unchanged.
 *
 * The data source interface is the test surface — swap in a fixture
 * implementation to test without a running server.
 *
 * Offline cache: activities are persisted to AsyncStorage so the app
 * shows data immediately on relaunch while fresh data loads in the
 * background.
 */
import React, { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const ACTIVITIES_CACHE_KEY = "stride-cached-activities";
const ATHLETE_CACHE_KEY = "stride-cached-athlete";

/** Attempt to load previously cached data for instant display */
async function loadCache(): Promise<{ activities: Activity[]; athlete: StravaAthlete | null }> {
  try {
    const [rawActivities, rawAthlete] = await Promise.all([
      AsyncStorage.getItem(ACTIVITIES_CACHE_KEY),
      AsyncStorage.getItem(ATHLETE_CACHE_KEY),
    ]);
    return {
      activities: rawActivities ? JSON.parse(rawActivities) : [],
      athlete: rawAthlete ? JSON.parse(rawAthlete) : null,
    };
  } catch {
    return { activities: [], athlete: null };
  }
}

async function persistCache(activities: Activity[], athlete: StravaAthlete | null) {
  try {
    await Promise.all([
      AsyncStorage.setItem(ACTIVITIES_CACHE_KEY, JSON.stringify(activities)),
      athlete
        ? AsyncStorage.setItem(ATHLETE_CACHE_KEY, JSON.stringify(athlete))
        : Promise.resolve(),
    ]);
  } catch { /* cache write failures are non-critical */ }
}

export function StravaDataProvider({
  children,
  source,
}: {
  children: ReactNode;
  /** Injectable data source — defaults to tRPC. Swap for tests. */
  source?: StravaDataSource;
}) {
  const ds = source ?? createTRPCStravaSource();

  const [cachedActivities, setCachedActivities] = useState<Activity[]>([]);
  const [cachedAthlete, setCachedAthlete] = useState<StravaAthlete | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Load cached data on mount for instant display
  useEffect(() => {
    loadCache().then((cached) => {
      setCachedActivities(cached.activities);
      setCachedAthlete(cached.athlete);
      setCacheLoaded(true);
    });
  }, []);

  const { data: statusData, refetch: refetchStatus } = ds.useStatus();

  const stravaConnected = statusData?.connected ?? false;
  const athlete = (statusData?.athlete ?? cachedAthlete) as StravaAthlete | null;

  const {
    data: activitiesData,
    isLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = ds.useActivities({ enabled: stravaConnected });

  const freshActivities = (activitiesData?.activities ?? []) as Activity[];
  const activities = freshActivities.length > 0 ? freshActivities : cachedActivities;
  const error = activitiesError ? activitiesError.message : null;

  // Persist fresh data to cache whenever it updates
  useEffect(() => {
    if (freshActivities.length > 0) {
      persistCache(freshActivities, athlete);
    }
  }, [freshActivities, athlete]);

  // Keep cached state in sync (ensures stale cache gets overwritten in state)
  useEffect(() => {
    if (freshActivities.length > 0) {
      setCachedActivities(freshActivities);
    }
  }, [freshActivities]);

  const refresh = useCallback(() => {
    refetchStatus();
    refetchActivities();
  }, [refetchStatus, refetchActivities]);

  const value: StravaDataState = {
    activities,
    loading: isLoading && !cacheLoaded,
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

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "./trpc";
import { Activity, StatToggles } from "./app-data";

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  city: string | null;
  country: string | null;
  profile: string;
  premium: boolean;
}

interface AppState {
  /** Real activities fetched from Strava via backend */
  activities: Activity[];
  /** Whether data is still loading from the server */
  loading: boolean;
  /** Error message if fetching failed */
  error: string | null;
  /** Whether Strava is connected */
  stravaConnected: boolean;
  /** Athlete info when Strava is connected */
  athlete: StravaAthlete | null;
  /** Trigger a manual refresh of activities */
  refresh: () => void;
  selectedActivityId: string;
  selectedTemplateId: string;
  statToggles: StatToggles;
  savedPostsCount: number;
  selectActivity: (id: string) => void;
  selectTemplate: (id: string) => void;
  setStatToggle: (key: keyof StatToggles, value: boolean) => void;
  incrementSavedPosts: () => void;
  getSelectedActivity: () => Activity;
}

const DEFAULT_TOGGLES: StatToggles = {
  distance: true,
  duration: true,
  pace: true,
  elevation: false,
  heartRate: false,
  calories: false,
};

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = "stride-studio-state";

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Strava data from backend ──
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

  // ── UI state (persisted) ──
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("1");
  const [statToggles, setStatToggles] = useState<StatToggles>(DEFAULT_TOGGLES);
  const [savedPostsCount, setSavedPostsCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Auto-select first activity when data arrives
  useEffect(() => {
    if (activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activities, selectedActivityId]);

  // Load persisted state from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const data = JSON.parse(raw);
          if (data.selectedTemplateId) setSelectedTemplateId(data.selectedTemplateId);
          if (data.statToggles) setStatToggles(data.statToggles);
          if (typeof data.savedPostsCount === "number") setSavedPostsCount(data.savedPostsCount);
          if (data.selectedActivityId && activities.some((a) => a.id === data.selectedActivityId)) {
            setSelectedActivityId(data.selectedActivityId);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [activities]);

  // Persist selected state to AsyncStorage on change
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedActivityId, selectedTemplateId, statToggles, savedPostsCount }),
    ).catch(() => {});
  }, [loaded, selectedActivityId, selectedTemplateId, statToggles, savedPostsCount]);

  const value: AppState = {
    activities,
    loading: isLoading,
    error,
    stravaConnected,
    athlete,
    refresh,
    selectedActivityId,
    selectedTemplateId,
    statToggles,
    savedPostsCount,
    selectActivity: setSelectedActivityId,
    selectTemplate: setSelectedTemplateId,
    setStatToggle: (key, v) => setStatToggles((prev) => ({ ...prev, [key]: v })),
    incrementSavedPosts: () => setSavedPostsCount((c) => c + 1),
    getSelectedActivity: () => activities.find((a) => a.id === selectedActivityId) ?? activities[0],
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

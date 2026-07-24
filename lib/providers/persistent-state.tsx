/**
 * PersistentStateProvider — UI state that survives app restarts via AsyncStorage.
 *
 * Handles selection state, stat toggles, and post counts independently
 * of the Strava data fetching layer.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Activity, StatToggles, PeriodId } from "@/lib/app-data";
import { useStravaData } from "./strava-data";

// ── Types ──

export interface PersistedUIState {
  selectedActivityId: string;
  selectedTemplateId: string;
  statToggles: StatToggles;
  savedPostsCount: number;
  periodFilter: PeriodId;
  selectActivity: (id: string) => void;
  selectTemplate: (id: string) => void;
  setStatToggle: (key: keyof StatToggles, value: boolean) => void;
  incrementSavedPosts: () => void;
  getSelectedActivity: () => Activity;
  setPeriodFilter: (period: PeriodId) => void;
}

// ── Constants ──

const DEFAULT_TOGGLES: StatToggles = {
  distance: true,
  duration: true,
  pace: true,
  elevation: false,
  heartRate: false,
  calories: false,
};

const STORAGE_KEY = "stride-studio-state";

// ── Context ──

const PersistentStateContext = createContext<PersistedUIState | null>(null);

export function PersistentStateProvider({ children }: { children: ReactNode }) {
  const { activities } = useStravaData();

  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("1");
  const [statToggles, setStatToggles] = useState<StatToggles>(DEFAULT_TOGGLES);
  const [savedPostsCount, setSavedPostsCount] = useState(0);
  const [periodFilter, setPeriodFilter] = useState<PeriodId>("all");
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
          if (data.periodFilter) setPeriodFilter(data.periodFilter);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [activities]);

  // Persist selected state to AsyncStorage on change (300ms debounce)
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedActivityId, selectedTemplateId, statToggles, savedPostsCount, periodFilter }),
      ).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [loaded, selectedActivityId, selectedTemplateId, statToggles, savedPostsCount, periodFilter]);

  const value: PersistedUIState = {
    selectedActivityId,
    selectedTemplateId,
    statToggles,
    savedPostsCount,
    periodFilter,
    selectActivity: setSelectedActivityId,
    selectTemplate: setSelectedTemplateId,
    setStatToggle: (key, v) => setStatToggles((prev) => ({ ...prev, [key]: v })),
    setPeriodFilter: setPeriodFilter,
    incrementSavedPosts: () => setSavedPostsCount((c) => c + 1),
    getSelectedActivity: () => {
      if (activities.length === 0) {
        console.warn("[PersistentState] getSelectedActivity called with no activities available — returning fallback.");
        return { id: "", stravaId: 0, type: "run", title: "", distance: 0, duration: 0, elapsedTime: 0, date: "", startDate: "", hasHeartrate: false } as Activity;
      }
      const found = activities.find((a) => a.id === selectedActivityId);
      if (found) return found;
      console.warn(
        `[PersistentState] Selected activity "${selectedActivityId}" not found in ${activities.length} activities, falling back to first.`,
      );
      return activities[0];
    },
  };

  return <PersistentStateContext.Provider value={value}>{children}</PersistentStateContext.Provider>;
}

export function usePersistentState(): PersistedUIState {
  const ctx = useContext(PersistentStateContext);
  if (!ctx) throw new Error("usePersistentState must be used within PersistentStateProvider");
  return ctx;
}

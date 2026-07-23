/**
 * AppContext — top-level application context.
 *
 * Composes StravaDataProvider (server data) and PersistentStateProvider (UI state)
 * into a single convenient `useApp()` hook. Screens that need only one concern
 * can import `useStravaData` or `usePersistentState` directly.
 */
import React, { createContext, useContext, type ReactNode } from "react";
import type { Activity, StatToggles } from "./app-data";
import { StravaDataProvider, useStravaData, type StravaAthlete } from "./providers/strava-data";
import { PersistentStateProvider, usePersistentState, type PersistedUIState } from "./providers/persistent-state";

// ── Public API (kept identical for backward compatibility) ──

export interface AppState {
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

// ── Merged context ──

const AppContext = createContext<AppState | null>(null);

function AppStateProvider({ children }: { children: ReactNode }) {
  const strava = useStravaData();
  const ui = usePersistentState();

  const value: AppState = {
    // Strava data
    activities: strava.activities,
    loading: strava.loading,
    error: strava.error,
    stravaConnected: strava.stravaConnected,
    athlete: strava.athlete,
    refresh: strava.refresh,
    // UI state
    selectedActivityId: ui.selectedActivityId,
    selectedTemplateId: ui.selectedTemplateId,
    statToggles: ui.statToggles,
    savedPostsCount: ui.savedPostsCount,
    selectActivity: ui.selectActivity,
    selectTemplate: ui.selectTemplate,
    setStatToggle: ui.setStatToggle,
    incrementSavedPosts: ui.incrementSavedPosts,
    getSelectedActivity: ui.getSelectedActivity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Top-level provider ──

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <StravaDataProvider>
      <PersistentStateProvider>
        <AppStateProvider>
          {children}
        </AppStateProvider>
      </PersistentStateProvider>
    </StravaDataProvider>
  );
}

// ── Hook ──

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

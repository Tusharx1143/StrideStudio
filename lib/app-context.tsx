import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Activity, Template, StatToggles, MOCK_ACTIVITIES, TEMPLATES } from "./app-data";

interface AppState {
  activities: Activity[];
  selectedActivityId: string;
  selectedTemplateId: string;
  statToggles: StatToggles;
  savedPostsCount: number;
  selectActivity: (id: string) => void;
  selectTemplate: (id: string) => void;
  setStatToggle: (key: keyof StatToggles, value: boolean) => void;
  incrementSavedPosts: () => void;
  getSelectedActivity: () => Activity;
  getSelectedTemplate: () => Template;
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

const STORAGE_KEY = "share-aura-state";

export function AppProvider({ children }: { children: ReactNode }) {
  const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [selectedActivityId, setSelectedActivityId] = useState("1");
  const [selectedTemplateId, setSelectedTemplateId] = useState("1");
  const [statToggles, setStatToggles] = useState<StatToggles>(DEFAULT_TOGGLES);
  const [savedPostsCount, setSavedPostsCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const data = JSON.parse(raw);
          if (data.selectedActivityId) setSelectedActivityId(data.selectedActivityId);
          if (data.selectedTemplateId) setSelectedTemplateId(data.selectedTemplateId);
          if (data.statToggles) setStatToggles(data.statToggles);
          if (typeof data.savedPostsCount === "number") setSavedPostsCount(data.savedPostsCount);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedActivityId, selectedTemplateId, statToggles, savedPostsCount })
    ).catch(() => {});
  }, [loaded, selectedActivityId, selectedTemplateId, statToggles, savedPostsCount]);

  const value: AppState = {
    activities,
    selectedActivityId,
    selectedTemplateId,
    statToggles,
    savedPostsCount,
    selectActivity: setSelectedActivityId,
    selectTemplate: setSelectedTemplateId,
    setStatToggle: (key, v) => setStatToggles((prev) => ({ ...prev, [key]: v })),
    incrementSavedPosts: () => setSavedPostsCount((c) => c + 1),
    getSelectedActivity: () => activities.find((a) => a.id === selectedActivityId) ?? activities[0],
    getSelectedTemplate: () => TEMPLATES.find((t) => t.id === selectedTemplateId) ?? TEMPLATES[0],
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

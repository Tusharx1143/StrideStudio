/**
 * mock-strava-source.ts — Fixture data for development without real Strava API.
 *
 * Activated by EXPO_PUBLIC_USE_MOCK_STRAVA=true in .env.
 * Returns instant fixture data with no network calls.
 */

import type { Activity } from "@/lib/app-data";
import type { StravaDataSource, QueryState, StravaStatusResult, StravaActivitiesResult } from "./strava-source";

const NOW = new Date();

const MOCK_ATHLETE = {
  id: 12345,
  firstname: "Demo",
  lastname: "Runner",
  city: "San Francisco",
  country: "United States",
  profile: "",
  premium: false,
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1001", stravaId: 1001, type: "run", title: "Morning 5K",
    distance: 5.01, duration: 25.5, elapsedTime: 28.0,
    date: "Today", startDate: NOW.toISOString(),
    pace: 5.09, speed: 11.8, elevation: 45, heartRate: 152,
    hasHeartrate: true, calories: 320, maxHeartRate: 172,
  },
  {
    id: "1002", stravaId: 1002, type: "ride", title: "Evening Ride",
    distance: 32.5, duration: 75.0, elapsedTime: 82.0,
    date: "Yesterday", startDate: new Date(NOW.getTime() - 86400000).toISOString(),
    pace: 2.31, speed: 26.0, elevation: 320,
    hasHeartrate: false, calories: 850,
  },
  {
    id: "1003", stravaId: 1003, type: "run", title: "Interval Training",
    distance: 8.2, duration: 45.0, elapsedTime: 52.0,
    date: "Jul 22", startDate: new Date(NOW.getTime() - 172800000).toISOString(),
    pace: 5.49, speed: 10.9, elevation: 110, heartRate: 162,
    hasHeartrate: true, calories: 480, maxHeartRate: 185,
  },
  {
    id: "1004", stravaId: 1004, type: "workout", title: "Strength Session",
    distance: 0, duration: 60.0, elapsedTime: 65.0,
    date: "Jul 21", startDate: new Date(NOW.getTime() - 259200000).toISOString(),
    hasHeartrate: false, calories: 400,
  },
  {
    id: "1005", stravaId: 1005, type: "ride", title: "Weekend Gravel Ride",
    distance: 55.8, duration: 150.0, elapsedTime: 168.0,
    date: "Jul 20", startDate: new Date(NOW.getTime() - 345600000).toISOString(),
    pace: 2.69, speed: 22.3, elevation: 680,
    hasHeartrate: true, heartRate: 145, calories: 1800, maxHeartRate: 168,
    summaryPolyline: "mock_polyline",
    startLatlng: [37.7749, -122.4194],
  },
];

export function createMockStravaSource(): StravaDataSource {
  return {
    useStatus(): QueryState<StravaStatusResult> {
      return {
        data: {
          connected: true,
          athlete: MOCK_ATHLETE,
        },
        isLoading: false,
        error: null,
        refetch: () => {},
      };
    },

    useActivities(_opts: { enabled: boolean }): QueryState<StravaActivitiesResult> {
      return {
        data: { activities: MOCK_ACTIVITIES },
        isLoading: false,
        error: null,
        refetch: () => {},
      };
    },
  };
}

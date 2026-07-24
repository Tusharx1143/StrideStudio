/**
 * strava-api.ts — Client-side Strava API client.
 *
 * Ported from server/_core/strava.ts (ProdStrava class).
 * Calls the Strava REST API directly from the client with automatic token
 * refresh. No server proxy needed.
 */

import type { Activity } from "@/lib/app-data";
import type { StravaAthlete } from "@/lib/providers/strava-data";
import {
  getStoredTokens,
  refreshStravaToken,
  clearStoredTokens,
  getConnectionStatus,
  STRAVA_API_BASE,
} from "./strava-oauth";

// ── Types ───────────────────────────────────────────────────────────────────

interface StravaApiActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  average_temp?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  map?: {
    id: string;
    summary_polyline: string;
  };
  device_name?: string;
  has_heartrate: boolean;
  suffer_score?: number;
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function stravaActivityType(type: string): Activity["type"] {
  const t = type.toLowerCase();
  if (t === "run" || t === "trailrun" || t === "virtualrun") return "run";
  if (
    t === "ride" ||
    t === "ebikeride" ||
    t === "mountainbikeride" ||
    t === "gravelride"
  )
    return "ride";
  return "workout";
}

export function toAppActivity(sa: StravaApiActivity): Activity {
  const durationMin = sa.moving_time / 60;
  const distanceKm = sa.distance / 1000;
  const pace = distanceKm > 0 ? durationMin / distanceKm : undefined;
  const speedKmh = sa.average_speed * 3.6;

  return {
    id: String(sa.id),
    stravaId: sa.id,
    type: stravaActivityType(sa.sport_type || sa.type),
    title: sa.name,
    distance: Math.round(distanceKm * 100) / 100,
    duration: Math.round(durationMin * 10) / 10,
    elapsedTime: Math.round((sa.elapsed_time / 60) * 10) / 10,
    date: formatStravaDate(sa.start_date),
    startDate: sa.start_date,
    pace: pace ? Math.round(pace * 100) / 100 : undefined,
    speed: speedKmh > 0 ? Math.round(speedKmh * 100) / 100 : undefined,
    maxSpeed:
      sa.max_speed > 0
        ? Math.round(sa.max_speed * 3.6 * 100) / 100
        : undefined,
    elevation: Math.round(sa.total_elevation_gain),
    heartRate: sa.average_heartrate
      ? Math.round(sa.average_heartrate)
      : undefined,
    maxHeartRate: sa.max_heartrate
      ? Math.round(sa.max_heartrate)
      : undefined,
    calories: sa.calories ? Math.round(sa.calories) : undefined,
    averageTemp: sa.average_temp,
    hasHeartrate: sa.has_heartrate,
    sufferScore: sa.suffer_score,
    startLatlng: sa.start_latlng,
    summaryPolyline: sa.map?.summary_polyline,
    deviceName: sa.device_name,
  };
}

export function formatStravaDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const dateDay = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  );
  const diffDays = Math.round(
    (today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// ── API Client ──────────────────────────────────────────────────────────────

class StravaApiClient {
  /**
   * Get a valid access token, refreshing if within 5 minutes of expiry.
   */
  private async getValidToken(): Promise<string> {
    const tokens = await getStoredTokens();
    if (!tokens) {
      throw new Error("Strava not connected");
    }

    // Refresh if token expires within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expiresAt - now < 300) {
      const refreshed = await refreshStravaToken(tokens.refreshToken);
      return refreshed.accessToken;
    }

    return tokens.accessToken;
  }

  /**
   * Make an authenticated GET request to the Strava API.
   * Auto-refreshes tokens on 401.
   */
  private async apiFetch<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const token = await this.getValidToken();
    const url = new URL(`${STRAVA_API_BASE}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, v),
      );
    }

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (resp.status === 401) {
      // Token might have just expired — try refresh once
      const tokens = await getStoredTokens();
      if (tokens) {
        await refreshStravaToken(tokens.refreshToken);
        return this.apiFetch<T>(path, params);
      }
    }

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Strava API error ${resp.status}: ${body}`);
    }

    return resp.json() as Promise<T>;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  async getAthlete(): Promise<StravaAthlete> {
    const data = await this.apiFetch<{
      id: number;
      firstname: string;
      lastname: string;
      city: string | null;
      country: string | null;
      profile: string;
      premium: boolean;
    }>("/athlete");

    return {
      id: data.id,
      firstname: data.firstname,
      lastname: data.lastname,
      city: data.city ?? null,
      country: data.country ?? null,
      profile: data.profile,
      premium: data.premium,
    };
  }

  async getAthleteStats(
    athleteId: number,
  ): Promise<Record<string, unknown>> {
    return this.apiFetch<Record<string, unknown>>(
      `/athletes/${athleteId}/stats`,
    );
  }

  async getActivities(
    page = 1,
    perPage = 50,
  ): Promise<Activity[]> {
    const data = await this.apiFetch<StravaApiActivity[]>(
      "/athlete/activities",
      {
        page: String(page),
        per_page: String(perPage),
      },
    );

    return data.map(toAppActivity);
  }

  async getActivityById(id: number): Promise<Activity> {
    const data = await this.apiFetch<StravaApiActivity>(
      `/activities/${id}`,
    );
    return toAppActivity(data);
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    athleteId: number | null;
  }> {
    return getConnectionStatus();
  }

  async disconnect(): Promise<void> {
    await clearStoredTokens();
  }
}

/** Singleton instance — single-user client, no need for multiple instances. */
export const stravaApi = new StravaApiClient();

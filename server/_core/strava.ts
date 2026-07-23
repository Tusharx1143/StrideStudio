import { ENV } from "./env";

// ─── Types ───────────────────────────────────────────────────────────────

interface StravaTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

interface StravaTokenStore {
  get(userId: string): Promise<StravaTokenSet | null>;
  set(userId: string, tokens: StravaTokenSet): Promise<void>;
  delete(userId: string): Promise<void>;
}

interface ExchangeResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    username: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    sex: string | null;
    premium: boolean;
    created_at: string;
    updated_at: string;
    profile_medium: string;
    profile: string;
  };
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: string | null;
  premium: boolean;
  profile: string;
  profileMedium: string;
  stats?: {
    recentRunTotal: number;
    recentRideTotal: number;
    allRunTotals: number;
    allRideTotals: number;
  };
}

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

export interface Activity {
  id: string;
  stravaId: number;
  type: "run" | "ride" | "workout";
  title: string;
  distance: number; // km
  duration: number; // minutes (moving time)
  elapsedTime: number; // minutes (total elapsed)
  date: string;
  startDate: string; // ISO date
  pace?: number; // min/km
  speed?: number; // km/h
  maxSpeed?: number; // km/h
  elevation?: number; // meters
  heartRate?: number; // avg bpm
  maxHeartRate?: number;
  calories?: number;
  averageTemp?: number;
  hasHeartrate: boolean;
  sufferScore?: number;
  startLatlng?: [number, number];
  summaryPolyline?: string;
  deviceName?: string;
}

// ─── In-memory token store (fallback when no DB) ────────────────────────

class InMemoryTokenStore implements StravaTokenStore {
  private store = new Map<string, StravaTokenSet>();

  async get(userId: string): Promise<StravaTokenSet | null> {
    return this.store.get(userId) ?? null;
  }

  async set(userId: string, tokens: StravaTokenSet): Promise<void> {
    this.store.set(userId, tokens);
  }

  async delete(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

// Pick the best available store
let tokenStore: StravaTokenStore = new InMemoryTokenStore();

// ─── Helpers ─────────────────────────────────────────────────────────────

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

function toAppActivity(sa: StravaApiActivity): Activity {
  const durationMin = sa.moving_time / 60;
  const distanceKm = sa.distance / 1000;
  const pace =
    distanceKm > 0 ? durationMin / distanceKm : undefined;
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
    maxSpeed: sa.max_speed > 0 ? Math.round(sa.max_speed * 3.6 * 100) / 100 : undefined,
    elevation: Math.round(sa.total_elevation_gain),
    heartRate: sa.average_heartrate ? Math.round(sa.average_heartrate) : undefined,
    maxHeartRate: sa.max_heartrate ? Math.round(sa.max_heartrate) : undefined,
    calories: sa.calories ? Math.round(sa.calories) : undefined,
    averageTemp: sa.average_temp,
    hasHeartrate: sa.has_heartrate,
    sufferScore: sa.suffer_score,
    startLatlng: sa.start_latlng,
    summaryPolyline: sa.map?.summary_polyline,
    deviceName: sa.device_name,
  };
}

function formatStravaDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// ─── Strava Service Interface ────────────────────────────────────────────

/**
 * StravaService — seam between Strava API and the rest of the app.
 *
 * The interface exposes every operation the app needs against Strava.
 * Multiple implementations allow testing without live credentials.
 */
export interface StravaService {
  setStore(store: StravaTokenStore): void;
  getAuthorizationUrl(userId: string, redirectUri: string): string;
  exchangeCode(code: string, userId: string): Promise<StravaTokenSet>;
  refreshToken(userId: string): Promise<StravaTokenSet>;
  getAthlete(userId: string): Promise<StravaAthlete>;
  getAthleteStats(userId: string, athleteId: number): Promise<Record<string, unknown>>;
  getActivities(userId: string, page?: number, perPage?: number): Promise<Activity[]>;
  getActivityById(userId: string, id: number): Promise<Activity>;
  getConnectionStatus(userId: string): Promise<{ connected: boolean; athleteId: number | null }>;
  disconnect(userId: string): Promise<void>;
}

/**
 * Production Strava adapter — calls the live Strava API.
 */
export class ProdStrava implements StravaService {
  private readonly apiBase = "https://www.strava.com/api/v3";
  private readonly oauthBase = "https://www.strava.com/oauth";

  setStore(store: StravaTokenStore) {
    tokenStore = store;
  }

  // ── OAuth URL ──

  getAuthorizationUrl(userId: string, redirectUri: string): string {
    const url = new URL(`${this.oauthBase}/authorize`);
    url.searchParams.set("client_id", ENV.stravaClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      "read,activity:read_all,profile:read_all"
    );
    url.searchParams.set("state", userId);
    return url.toString();
  }

  // ── Token Exchange ──

  async exchangeCode(code: string, userId: string): Promise<StravaTokenSet> {
    const resp = await fetch(`${this.oauthBase}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: ENV.stravaClientId,
        client_secret: ENV.stravaClientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Strava token exchange failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as ExchangeResponse;

    const tokenSet: StravaTokenSet = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athleteId: data.athlete.id,
    };

    await tokenStore.set(userId, tokenSet);
    return tokenSet;
  }

  // ── Token Refresh ──

  async refreshToken(userId: string): Promise<StravaTokenSet> {
    const existing = await tokenStore.get(userId);
    if (!existing) {
      throw new Error("No Strava tokens found for this user");
    }

    const resp = await fetch(`${this.oauthBase}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: ENV.stravaClientId,
        client_secret: ENV.stravaClientSecret,
        grant_type: "refresh_token",
        refresh_token: existing.refreshToken,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Strava token refresh failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as ExchangeResponse;
    const tokenSet: StravaTokenSet = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athleteId: data.athlete.id,
    };

    await tokenStore.set(userId, tokenSet);
    return tokenSet;
  }

  // ── Get Valid Token (auto-refresh if expired) ──

  private async getValidToken(userId: string): Promise<string> {
    const tokens = await tokenStore.get(userId);
    if (!tokens) {
      throw new Error("Strava not connected");
    }

    // Refresh if token expires within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expiresAt - now < 300) {
      const refreshed = await this.refreshToken(userId);
      return refreshed.accessToken;
    }

    return tokens.accessToken;
  }

  // ── API Fetch ──

  private async apiFetch<T>(
    userId: string,
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    const token = await this.getValidToken(userId);
    const url = new URL(`${this.apiBase}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, v)
      );
    }

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (resp.status === 401) {
      // Token might have just expired - try refresh once
      await this.refreshToken(userId);
      return this.apiFetch<T>(userId, path, params);
    }

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Strava API error ${resp.status}: ${body}`);
    }

    return resp.json() as Promise<T>;
  }

  // ── Athlete Profile ──

  async getAthlete(userId: string): Promise<StravaAthlete> {
    const data = await this.apiFetch<StravaAthlete>(userId, "/athlete");
    return data;
  }

  async getAthleteStats(
    userId: string,
    athleteId: number
  ): Promise<Record<string, unknown>> {
    return this.apiFetch<Record<string, unknown>>(
      userId,
      `/athletes/${athleteId}/stats`
    );
  }

  // ── Activities ──

  async getActivities(
    userId: string,
    page = 1,
    perPage = 30
  ): Promise<Activity[]> {
    const data = await this.apiFetch<StravaApiActivity[]>(
      userId,
      "/athlete/activities",
      {
        page: String(page),
        per_page: String(perPage),
      }
    );

    return data.map(toAppActivity);
  }

  async getActivityById(userId: string, id: number): Promise<Activity> {
    const data = await this.apiFetch<StravaApiActivity>(
      userId,
      `/activities/${id}`
    );
    return toAppActivity(data);
  }

  // ── Connection Status ──

  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    athleteId: number | null;
  }> {
    try {
      const tokens = await tokenStore.get(userId);
      if (!tokens) {
        return { connected: false, athleteId: null };
      }
      return { connected: true, athleteId: tokens.athleteId };
    } catch {
      return { connected: false, athleteId: null };
    }
  }

  async disconnect(userId: string): Promise<void> {
    await tokenStore.delete(userId);
  }
}

export const strava: StravaService = new ProdStrava();

// ─── Test / In-Memory Adapter ─────────────────────────────────────────

/**
 * In-memory Strava adapter for tests and demos.
 * Returns fixture data without network calls.
 */
export class TestStrava implements StravaService {
  private athlete: StravaAthlete = {
    id: 12345,
    firstname: "Test",
    lastname: "User",
    city: "Testville",
    state: "TS",
    country: "Testland",
    sex: null,
    premium: false,
    profile: "",
    profileMedium: "",
  };

  private activities: Activity[] = [];

  setStore(_store: StravaTokenStore) {}
  getAuthorizationUrl(_userId: string, _redirectUri: string): string { return "http://localhost/mock-auth"; }
  async exchangeCode(_code: string, _userId: string): Promise<StravaTokenSet> {
    return { accessToken: "mock", refreshToken: "mock", expiresAt: 9999999999, athleteId: 12345 };
  }
  async refreshToken(_userId: string): Promise<StravaTokenSet> {
    return { accessToken: "mock", refreshToken: "mock", expiresAt: 9999999999, athleteId: 12345 };
  }
  async getAthlete(_userId: string): Promise<StravaAthlete> { return this.athlete; }
  async getAthleteStats(_userId: string, _athleteId: number): Promise<Record<string, unknown>> { return {}; }
  async getActivities(_userId: string, _page?: number, _perPage?: number): Promise<Activity[]> { return this.activities; }
  async getActivityById(_userId: string, _id: number): Promise<Activity> {
    return this.activities[0] ?? { id: "0", stravaId: 0, type: "run", title: "Test Run", distance: 5, duration: 30, elapsedTime: 35, date: "Today", startDate: new Date().toISOString(), pace: 6, speed: 10, elevation: 50, hasHeartrate: false };
  }
  async getConnectionStatus(_userId: string): Promise<{ connected: boolean; athleteId: number | null }> {
    return { connected: true, athleteId: 12345 };
  }
  async disconnect(_userId: string): Promise<void> {}

  /** Seed fixture activities for tests. */
  setFixtureActivities(activities: Activity[]) { this.activities = activities; }
}

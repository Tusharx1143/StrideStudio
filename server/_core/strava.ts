import { eq } from "drizzle-orm";
import { ENV } from "./env";
import { getDb } from "../db";
import { stravaTokens } from "../../drizzle/schema";
import type { Activity } from "../../shared/types";

const isDev = process.env.NODE_ENV !== "production";

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

// ─── Token Stores ───────────────────────────────────────────────────────

/** In-memory fallback when no database is available. */
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

/** Database-backed token store using the strava_tokens table. */
class DrizzleTokenStore implements StravaTokenStore {
  async get(userId: string): Promise<StravaTokenSet | null> {
    try {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(stravaTokens)
        .where(eq(stravaTokens.userId, userId))
        .limit(1);
      if (rows.length === 0) return null;
      return {
        accessToken: rows[0].accessToken,
        refreshToken: rows[0].refreshToken,
        expiresAt: rows[0].expiresAt,
        athleteId: rows[0].athleteId,
      };
    } catch (err) {
      if (isDev) console.warn("[Strava] DB token read failed, falling back:", err);
      return null;
    }
  }

  async set(userId: string, tokens: StravaTokenSet): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db
      .insert(stravaTokens)
      .values({
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        athleteId: tokens.athleteId,
      })
      .onDuplicateKeyUpdate({
        set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          athleteId: tokens.athleteId,
        },
      });
  }

  async delete(userId: string): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.delete(stravaTokens).where(eq(stravaTokens.userId, userId));
  }
}

// ── Store selection (lazy: tries DB on first use, keeps in-memory as fallback) ──

let tokenStore: StravaTokenStore = new InMemoryTokenStore();
let _storeProbed = false;

async function _ensureDbStore(): Promise<void> {
  if (_storeProbed) return;
  _storeProbed = true;
  try {
    const db = await getDb();
    if (db) {
      tokenStore = new DrizzleTokenStore();
      if (isDev) console.log("[Strava] Using database-backed token store");
    }
  } catch {
    if (isDev) console.warn("[Strava] DB not available, keeping in-memory token store");
  }
}

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

  /** Resolves the active token store, upgrading to DB on first call. */
  private async _store(): Promise<StravaTokenStore> {
    await _ensureDbStore();
    return tokenStore;
  }

  setStore(store: StravaTokenStore) {
    tokenStore = store;
    _storeProbed = true; // manual override — don't auto-upgrade
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

    await (await this._store()).set(userId, tokenSet);
    return tokenSet;
  }

  // ── Token Refresh ──

  async refreshToken(userId: string): Promise<StravaTokenSet> {
    const existing = await (await this._store()).get(userId);
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

    await (await this._store()).set(userId, tokenSet);
    return tokenSet;
  }

  // ── Get Valid Token (auto-refresh if expired) ──

  private async getValidToken(userId: string): Promise<string> {
    const tokens = await (await this._store()).get(userId);
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
      const tokens = await (await this._store()).get(userId);
      if (!tokens) {
        return { connected: false, athleteId: null };
      }
      return { connected: true, athleteId: tokens.athleteId };
    } catch {
      return { connected: false, athleteId: null };
    }
  }

  async disconnect(userId: string): Promise<void> {
    await (await this._store()).delete(userId);
  }
}

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

  /** Seed athlete profile. */
  setAthlete(athlete: StravaAthlete) { this.athlete = athlete; }
}

// ─── Mock Data Factory ─────────────────────────────────────────────────

/**
 * Build a pre-seeded TestStrava instance with realistic fixture data.
 * Dates are computed relative to "now" so the data always looks recent.
 */
function createSeededMockStrava(): TestStrava {
  const mock = new TestStrava();

  mock.setAthlete({
    id: 47291834,
    firstname: "Alex",
    lastname: "Runner",
    city: "San Francisco",
    state: "California",
    country: "United States",
    sex: "M",
    premium: true,
    profile: "",
    profileMedium: "",
    stats: {
      recentRunTotal: 186420,
      recentRideTotal: 0,
      allRunTotals: 5432000,
      allRideTotals: 823000,
    },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const YESTERDAY = new Date(today.getTime() - 86400000);
  const DAY2 = new Date(today.getTime() - 2 * 86400000);
  const DAY3 = new Date(today.getTime() - 3 * 86400000);
  const DAY4 = new Date(today.getTime() - 4 * 86400000);
  const DAY5 = new Date(today.getTime() - 5 * 86400000);
  const DAY7 = new Date(today.getTime() - 7 * 86400000);
  const DAY10 = new Date(today.getTime() - 10 * 86400000);
  const DAY14 = new Date(today.getTime() - 14 * 86400000);

  function ts(d: Date, hour: number, min: number): string {
    const dt = new Date(d);
    dt.setHours(hour, min, 0, 0);
    return dt.toISOString();
  }

  const mockActivities: Activity[] = [
    {
      id: "mock-1", stravaId: 10001, type: "run",
      title: "Morning Tempo Run",
      distance: 8.34, duration: 38.5, elapsedTime: 42.0,
      date: "Today", startDate: ts(today, 7, 15),
      pace: 4.62, speed: 13.0, maxSpeed: 15.2,
      elevation: 85, heartRate: 152, maxHeartRate: 171,
      calories: 520, hasHeartrate: true, sufferScore: 45,
      deviceName: "Garmin Forerunner 265",
    },
    {
      id: "mock-2", stravaId: 10002, type: "run",
      title: "Easy Recovery Jog",
      distance: 5.21, duration: 30.0, elapsedTime: 31.5,
      date: "Yesterday", startDate: ts(YESTERDAY, 18, 30),
      pace: 5.76, speed: 10.4, maxSpeed: 11.8,
      elevation: 32, heartRate: 135, maxHeartRate: 148,
      calories: 310, hasHeartrate: true, sufferScore: 18,
      deviceName: "Garmin Forerunner 265",
    },
    {
      id: "mock-3", stravaId: 10003, type: "run",
      title: "Interval Session — 6×800m",
      distance: 10.05, duration: 52.0, elapsedTime: 58.0,
      date: formatStravaDate(ts(DAY2, 6, 45)), startDate: ts(DAY2, 6, 45),
      pace: 5.17, speed: 11.6, maxSpeed: 17.9,
      elevation: 120, heartRate: 163, maxHeartRate: 184,
      calories: 680, hasHeartrate: true, sufferScore: 92,
      deviceName: "Garmin Forerunner 265",
    },
    {
      id: "mock-4", stravaId: 10004, type: "run",
      title: "Long Run — Golden Gate Park",
      distance: 21.1, duration: 105.0, elapsedTime: 112.0,
      date: formatStravaDate(ts(DAY3, 7, 0)), startDate: ts(DAY3, 7, 0),
      pace: 4.98, speed: 12.1, maxSpeed: 14.3,
      elevation: 245, heartRate: 158, maxHeartRate: 174,
      calories: 1350, hasHeartrate: true, sufferScore: 78,
      startLatlng: [37.7694, -122.4862],
      summaryPolyline: "}z~eFp~m_V",
      deviceName: "Garmin Forerunner 265",
    },
    {
      id: "mock-5", stravaId: 10005, type: "ride",
      title: "Marin Headlands Loop",
      distance: 45.8, duration: 132.0, elapsedTime: 145.0,
      date: formatStravaDate(ts(DAY4, 8, 30)), startDate: ts(DAY4, 8, 30),
      speed: 20.8, maxSpeed: 52.4,
      elevation: 680, heartRate: 145, maxHeartRate: 168,
      calories: 1620, hasHeartrate: true, sufferScore: 65,
      deviceName: "Wahoo ELEMNT ROAM",
    },
    {
      id: "mock-6", stravaId: 10006, type: "run",
      title: "Hill Repeats — Twin Peaks",
      distance: 7.62, duration: 45.0, elapsedTime: 50.0,
      date: formatStravaDate(ts(DAY5, 6, 0)), startDate: ts(DAY5, 6, 0),
      pace: 5.91, speed: 10.2, maxSpeed: 13.5,
      elevation: 310, heartRate: 161, maxHeartRate: 179,
      calories: 490, hasHeartrate: true, sufferScore: 72,
      deviceName: "Garmin Forerunner 265",
    },
    {
      id: "mock-7", stravaId: 10007, type: "run",
      title: "Progression Run",
      distance: 12.45, duration: 56.0, elapsedTime: 58.5,
      date: formatStravaDate(ts(DAY7, 7, 30)), startDate: ts(DAY7, 7, 30),
      pace: 4.5, speed: 13.3, maxSpeed: 15.8,
      elevation: 95, heartRate: 156, maxHeartRate: 175,
      calories: 780, hasHeartrate: true, sufferScore: 55,
      deviceName: "Apple Watch Ultra 2",
    },
    {
      id: "mock-8", stravaId: 10008, type: "ride",
      title: "Commute — Downtown Loop",
      distance: 18.3, duration: 48.0, elapsedTime: 52.0,
      date: formatStravaDate(ts(DAY7, 17, 0)), startDate: ts(DAY7, 17, 0),
      speed: 22.9, maxSpeed: 38.6,
      elevation: 120, heartRate: 132, maxHeartRate: 155,
      calories: 480, hasHeartrate: true, sufferScore: 22,
      deviceName: "Wahoo ELEMNT ROAM",
    },
    {
      id: "mock-9", stravaId: 10009, type: "run",
      title: "Trail Run — Muir Woods",
      distance: 14.8, duration: 85.0, elapsedTime: 92.0,
      date: formatStravaDate(ts(DAY10, 8, 0)), startDate: ts(DAY10, 8, 0),
      pace: 5.74, speed: 10.5, maxSpeed: 12.1,
      elevation: 420, heartRate: 149, maxHeartRate: 167,
      calories: 920, hasHeartrate: true, sufferScore: 60,
      startLatlng: [37.8922, -122.5713],
      deviceName: "Garmin Forerunner 265",
    },
    {
      id: "mock-10", stravaId: 10010, type: "run",
      title: "5K Race Simulation",
      distance: 5.0, duration: 19.5, elapsedTime: 20.0,
      date: formatStravaDate(ts(DAY14, 7, 0)), startDate: ts(DAY14, 7, 0),
      pace: 3.9, speed: 15.4, maxSpeed: 17.2,
      elevation: 28, heartRate: 171, maxHeartRate: 192,
      calories: 340, hasHeartrate: true, sufferScore: 95,
      deviceName: "Garmin Forerunner 265",
    },
  ];

  mock.setFixtureActivities(mockActivities);
  return mock;
}

// ─── Service Selection ─────────────────────────────────────────────────

/**
 * The active Strava service instance.
 *
 * When USE_MOCK_STRAVA=true, returns a pre-seeded TestStrava with
 * realistic fixture data — no real Strava credentials needed.
 * Otherwise uses the production Strava API adapter.
 */
export const strava: StravaService = ENV.useMockStrava
  ? createSeededMockStrava()
  : new ProdStrava();

if (ENV.useMockStrava) {
  console.log("[Strava] 🧪 Using MOCK Strava — fixture data, no API calls");
}

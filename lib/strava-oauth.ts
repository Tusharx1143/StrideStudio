/**
 * strava-oauth.ts — Client-side Strava PKCE OAuth helpers.
 *
 * Replaces the server-side OAuth flow (server/_core/strava-oauth.ts).
 * Uses PKCE (Proof Key for Code Exchange) so no client_secret is needed.
 *
 * Token storage:
 *   - Native: expo-secure-store (encrypted)
 *   - Web: localStorage (browser)
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getStravaClientId } from "@/lib/config";

// ── Constants ───────────────────────────────────────────────────────────────

const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const SCOPES = "read,activity:read_all,profile:read_all";

const STORAGE_KEYS = {
  codeVerifier: "strava_code_verifier",
  accessToken: "strava_access_token",
  refreshToken: "strava_refresh_token",
  expiresAt: "strava_expires_at",
  athleteId: "strava_athlete_id",
} as const;

// ── Types ───────────────────────────────────────────────────────────────────

export interface StravaTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

interface StravaExchangeResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number };
}

// ── Secure Storage Helpers (platform-aware) ─────────────────────────────────

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ── PKCE Helpers ────────────────────────────────────────────────────────────

/**
 * Base64url-encode a Uint8Array (no padding, URL-safe).
 */
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate a cryptographically random PKCE code_verifier (128 chars).
 * Uses crypto.getRandomValues — available in React Native 0.81+ and all browsers.
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(96); // 96 bytes → 128 base64url chars
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate PKCE code_challenge from verifier using SHA-256 + base64url.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

// ── OAuth URL Construction ──────────────────────────────────────────────────

/**
 * Build the Strava OAuth authorization URL with PKCE parameters.
 *
 * @param codeChallenge  SHA-256 hash of the code_verifier (base64url-encoded)
 * @param redirectUri    Where Strava redirects after authorization.
 *                       Use Linking.createURL("/oauth/callback") to get the
 *                       correct scheme for the current platform.
 * @param state          Opaque state value (we use a random string for CSRF).
 * @returns              Full URL to redirect the user to.
 */
export function buildStravaAuthUrl(
  codeChallenge: string,
  redirectUri: string,
  state: string,
): string {
  const clientId = getStravaClientId();
  const url = new URL(`${STRAVA_OAUTH_BASE}/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", codeChallenge);
  return url.toString();
}

// ── Token Exchange ──────────────────────────────────────────────────────────

/**
 * Exchange an authorization code for tokens (PKCE — no client_secret).
 * Stores tokens in SecureStore / localStorage on success.
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<StravaTokenSet> {
  const clientId = getStravaClientId();

  const resp = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Strava token exchange failed: ${resp.status} ${body}`);
  }

  const data = (await resp.json()) as StravaExchangeResponse;

  const tokenSet: StravaTokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete.id,
  };

  await storeTokens(tokenSet);
  return tokenSet;
}

/**
 * Refresh an expired access token.
 * Stores updated tokens on success.
 */
export async function refreshStravaToken(
  refreshToken: string,
): Promise<StravaTokenSet> {
  const clientId = getStravaClientId();

  const resp = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Strava token refresh failed: ${resp.status} ${body}`);
  }

  const data = (await resp.json()) as StravaExchangeResponse;

  const tokenSet: StravaTokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete.id,
  };

  await storeTokens(tokenSet);
  return tokenSet;
}

// ── Token Storage ───────────────────────────────────────────────────────────

export async function storeTokens(tokens: StravaTokenSet): Promise<void> {
  await Promise.all([
    secureSet(STORAGE_KEYS.accessToken, tokens.accessToken),
    secureSet(STORAGE_KEYS.refreshToken, tokens.refreshToken),
    secureSet(STORAGE_KEYS.expiresAt, String(tokens.expiresAt)),
    secureSet(STORAGE_KEYS.athleteId, String(tokens.athleteId)),
  ]);
}

export async function getStoredTokens(): Promise<StravaTokenSet | null> {
  const [accessToken, refreshToken, expiresAt, athleteId] = await Promise.all([
    secureGet(STORAGE_KEYS.accessToken),
    secureGet(STORAGE_KEYS.refreshToken),
    secureGet(STORAGE_KEYS.expiresAt),
    secureGet(STORAGE_KEYS.athleteId),
  ]);

  if (!accessToken || !refreshToken || !expiresAt) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt, 10),
    athleteId: athleteId ? parseInt(athleteId, 10) : 0,
  };
}

export async function clearStoredTokens(): Promise<void> {
  await Promise.all([
    secureDelete(STORAGE_KEYS.accessToken),
    secureDelete(STORAGE_KEYS.refreshToken),
    secureDelete(STORAGE_KEYS.expiresAt),
    secureDelete(STORAGE_KEYS.athleteId),
  ]);
}

// ── Code Verifier Storage (temporary, used once during OAuth flow) ──────────

export async function storeCodeVerifier(verifier: string): Promise<void> {
  await secureSet(STORAGE_KEYS.codeVerifier, verifier);
}

export async function getStoredCodeVerifier(): Promise<string | null> {
  return secureGet(STORAGE_KEYS.codeVerifier);
}

export async function clearStoredCodeVerifier(): Promise<void> {
  await secureDelete(STORAGE_KEYS.codeVerifier);
}

// ── Connection Status ───────────────────────────────────────────────────────

export async function getConnectionStatus(): Promise<{
  connected: boolean;
  athleteId: number | null;
}> {
  const tokens = await getStoredTokens();
  return {
    connected: !!tokens?.accessToken,
    athleteId: tokens?.athleteId ?? null,
  };
}

// ── Exported for use by strava-api.ts ───────────────────────────────────────

export { STRAVA_API_BASE };

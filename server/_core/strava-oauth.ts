import type { Express, Request, Response } from "express";
import { strava } from "./strava";

/**
 * Strava OAuth routes — handles the authorize → callback → token flow.
 *
 * Flow:
 *   1. Frontend redirects user to GET /api/strava/auth → Strava OAuth page
 *   2. User authorizes → Strava redirects to /api/strava/callback
 *   3. Backend exchanges code for tokens, stores them
 *   4. Backend redirects back to frontend with ?strava=connected
 *
 * For local dev the user is identified by a simple "userId" state param.
 * In production this would be tied to your session/JWT system.
 */

const DEFAULT_USER_ID = "default";
const API_URL = "http://localhost:3000";
const FRONTEND_URL = "http://localhost:8081";
// Expo Router maps filesystem routes like app/(tabs)/profile.tsx to /profile on web
const CALLBACK_PATH = "/profile";

function getUserId(req: Request): string {
  // Could read from session cookie here in production
  return DEFAULT_USER_ID;
}

export function registerStravaOAuthRoutes(app: Express) {
  // ── Step 1: Initiate Strava OAuth ──
  app.get("/api/strava/auth", (_req: Request, res: Response) => {
    if (!strava.getAuthorizationUrl) {
      // Defensive: shouldn't happen, but type-safe handling
      res.status(500).json({ error: "Strava SDK not initialized" });
      return;
    }

    const userId = getUserId(_req);
    const redirectUri = `${API_URL}/api/strava/callback`;
    const authUrl = strava.getAuthorizationUrl(userId, redirectUri);
    res.redirect(302, authUrl);
  });

  // ── Step 2: Handle OAuth callback ──
  app.get("/api/strava/callback", async (req: Request, res: Response) => {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    const userId = typeof state === "string" ? state : DEFAULT_USER_ID;

    try {
      await strava.exchangeCode(code, userId);
      // Redirect back to frontend with success flag
      res.redirect(302, `${FRONTEND_URL}${CALLBACK_PATH}?strava=connected`);
    } catch (error) {
      console.error("[Strava] OAuth callback failed:", error);
      res.redirect(302, `${FRONTEND_URL}${CALLBACK_PATH}?strava=error`);
    }
  });

  // ── Check connection status ──
  app.get("/api/strava/status", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const status = await strava.getConnectionStatus(userId);

      if (status.connected) {
        const athlete = await strava.getAthlete(userId);
        res.json({
          connected: true,
          athlete: {
            id: athlete.id,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            city: athlete.city,
            country: athlete.country,
            profile: athlete.profile,
            premium: athlete.premium,
          },
        });
      } else {
        res.json({ connected: false, athlete: null });
      }
    } catch (error) {
      console.error("[Strava] Status check failed:", error);
      res.json({ connected: false, athlete: null });
    }
  });

  // ── Disconnect Strava ──
  app.post("/api/strava/disconnect", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      await strava.disconnect(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("[Strava] Disconnect failed:", error);
      res.status(500).json({ error: "Failed to disconnect Strava" });
    }
  });

  // ── Fetch activities ──
  app.get("/api/strava/activities", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 30;

      const activities = await strava.getActivities(userId, page, perPage);

      // Also fetch athlete info to include in response
      let athlete = null;
      try {
        athlete = await strava.getAthlete(userId);
      } catch {
        // Athlete fetch is optional
      }

      res.json({ activities, athlete });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[Strava] Fetch activities failed:", error);

      if (message.includes("not connected") || message.includes("No Strava tokens")) {
        res.status(401).json({ error: "Strava not connected", activities: [], athlete: null });
      } else {
        res.status(500).json({ error: message, activities: [], athlete: null });
      }
    }
  });
}

/**
 * Root index route.
 *
 * When USE_MOCK_STRAVA=true: redirects straight to /home.
 * No dependencies beyond expo-router — no tRPC, no theme providers.
 *
 * When USE_MOCK_STRAVA=false: loads the full landing page with Strava connect.
 */

import { Redirect } from "expo-router";

// Inlined by Metro at build time
const IS_MOCK =
  typeof process !== "undefined" &&
  process.env?.EXPO_PUBLIC_USE_MOCK_STRAVA === "true";

export default function Index() {
  if (IS_MOCK) {
    return <Redirect href="/home" />;
  }

  // Real mode — lazy-load the heavy landing page
  const LandingPage = require("./landing-page").default;
  return <LandingPage />;
}

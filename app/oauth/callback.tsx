import { ThemedView } from "@/components/themed-view";
import * as Auth from "@/lib/_core/auth";
import { logger } from "@/lib/_core/logger";
import {
  exchangeCodeForToken,
  getStoredCodeVerifier,
  clearStoredCodeVerifier,
} from "@/lib/strava-oauth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    sessionToken?: string;
    user?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      logger.log("[OAuth] Callback handler triggered");
      logger.log("[OAuth] Params received:", {
        code: params.code,
        state: params.state,
        error: params.error,
        sessionToken: params.sessionToken ? "present" : "missing",
        user: params.user ? "present" : "missing",
      });
      try {
        // ── Strava PKCE callback ──────────────────────────────────────────
        // Strava redirects back with ?code=...&state=...&scope=...activity...
        // Detect it by the presence of "activity" in the scope param.
        // Strava PKCE callback is identified by the scope param containing "activity"
        const scope = (params as Record<string, string>).scope;
        if (params.code && scope?.includes("activity")) {
          logger.log("[OAuth] Detected Strava PKCE callback");

          const codeVerifier = await getStoredCodeVerifier();
          if (!codeVerifier) {
            setStatus("error");
            setErrorMessage("Missing code verifier. Please try connecting again.");
            return;
          }

          await exchangeCodeForToken(params.code, codeVerifier);
          await clearStoredCodeVerifier();

          setStatus("success");
          logger.log("[OAuth] Strava PKCE exchange successful, redirecting to home...");
          setTimeout(() => {
            router.replace("/home");
          }, 1000);
          return;
        }

        // Check for sessionToken in params first (web OAuth callback from server redirect)
        if (params.sessionToken) {
          logger.log("[OAuth] Session token found in params (web callback)");
          await Auth.setSessionToken(params.sessionToken);

          // Decode and store user info if available
          if (params.user) {
            try {
              // Use atob for base64 decoding (works in both web and React Native)
              const userJson =
                typeof atob !== "undefined"
                  ? atob(params.user)
                  : Buffer.from(params.user, "base64").toString("utf-8");
              const userData = JSON.parse(userJson);
              const userInfo: Auth.User = {
                id: userData.id,
                openId: userData.openId,
                name: userData.name,
                email: userData.email,
                loginMethod: userData.loginMethod,
                lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
              };
              await Auth.setUserInfo(userInfo);
              logger.log("[OAuth] User info stored:", userInfo);
            } catch (err) {
              logger.error("[OAuth] Failed to parse user data:", err);
            }
          }

          setStatus("success");
          logger.log("[OAuth] Web authentication successful, redirecting to home...");
          setTimeout(() => {
            router.replace("/home");
          }, 1000);
          return;
        }

        // Get URL from params or Linking
        let url: string | null = null;

        // Try to get from local search params first (works with expo-router)
        if (params.code || params.state || params.error) {
          logger.log("[OAuth] Found params in route params");
          // Extract from params
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
          logger.log("[OAuth] Constructed URL from params:", url);
        } else {
          logger.log("[OAuth] No params found, checking Linking.getInitialURL()...");
          // Fallback: try to get from Linking
          const initialUrl = await Linking.getInitialURL();
          logger.log("[OAuth] Linking.getInitialURL():", initialUrl);
          if (initialUrl) {
            url = initialUrl;
          }
        }

        // Check for error
        const error =
          params.error || (url ? new URL(url, "http://dummy").searchParams.get("error") : null);
        if (error) {
          logger.error("[OAuth] Error parameter found:", error);
          setStatus("error");
          setErrorMessage(error || "OAuth error occurred");
          return;
        }

        // Check for code and state
        let code: string | null = null;
        let state: string | null = null;
        let sessionToken: string | null = null;

        // Try to get from params first
        if (params.code && params.state) {
          logger.log("[OAuth] Using code and state from route params");
          code = params.code;
          state = params.state;
        } else if (url) {
          logger.log("[OAuth] Parsing code and state from URL:", url);
          // Parse from URL
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get("code");
            state = urlObj.searchParams.get("state");
            sessionToken = urlObj.searchParams.get("sessionToken");
            logger.log("[OAuth] Extracted from URL:", {
              code: code?.substring(0, 20) + "...",
              state: state?.substring(0, 20) + "...",
              sessionToken: sessionToken ? "present" : "missing",
            });
          } catch (e) {
            logger.log("[OAuth] Failed to parse as full URL, trying regex:", e);
            // Try parsing as relative URL with query params
            const match = url.match(/[?&](code|state|sessionToken)=([^&]+)/g);
            if (match) {
              match.forEach((param) => {
                const [key, value] = param.substring(1).split("=");
                if (key === "code") code = decodeURIComponent(value);
                if (key === "state") state = decodeURIComponent(value);
                if (key === "sessionToken") sessionToken = decodeURIComponent(value);
              });
              logger.log("[OAuth] Extracted from regex:", {
                code: code?.substring(0, 20) + "...",
                state: state?.substring(0, 20) + "...",
                sessionToken: sessionToken ? "present" : "missing",
              });
            }
          }
        }

        logger.log("[OAuth] Final extracted values:", {
          hasCode: !!code,
          hasState: !!state,
          hasSessionToken: !!sessionToken,
        });

        // If we have sessionToken directly from URL, use it
        if (sessionToken) {
          logger.log("[OAuth] Session token found in URL, storing...");
          await Auth.setSessionToken(sessionToken);
          logger.log("[OAuth] Session token stored successfully");
          // User info is already in the OAuth callback response
          // No need to fetch from API
          setStatus("success");
          logger.log("[OAuth] Redirecting to home...");
          setTimeout(() => {
            router.replace("/home");
          }, 1000);
          return;
        }

        // If we have code + state but no sessionToken and it's not a Strava PKCE
        // callback, the server-based OAuth flow is no longer available.
        if (!code || !state) {
          logger.error("[OAuth] Missing code or state parameter", {
            hasCode: !!code,
            hasState: !!state,
          });
          setStatus("error");
          setErrorMessage("Missing code or state parameter");
          return;
        }

        // Server-side OAuth code exchange is no longer available.
        // Strava auth uses PKCE (handled above). Other auth methods
        // should go through the client-side flow.
        setStatus("error");
        setErrorMessage("Server-based authentication is no longer available.");
        return;
      } catch (error) {
        logger.error("[OAuth] Callback error:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to complete authentication",
        );
      }
    };

    handleCallback();
  }, [params.code, params.state, params.error, params.sessionToken, params.user, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completing authentication...
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">
              Authentication successful!
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecting...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Authentication failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

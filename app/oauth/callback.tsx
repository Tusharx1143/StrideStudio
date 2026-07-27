/**
 * OAuth callback handler — processes Strava/Google auth redirects.
 *
 * Three states: processing (spinner), success (redirect), error (message).
 * Restyled to match the design handoff tokens.
 */
import { View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { logger } from "@/lib/_core/logger";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

export default function OAuthCallback() {
  const router = useRouter();
  const colors = useColors();
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
        // Check for sessionToken in params first (web OAuth callback from server redirect)
        if (params.sessionToken) {
          logger.log("[OAuth] Session token found in params (web callback)");
          await Auth.setSessionToken(params.sessionToken);

          // Decode and store user info if available
          if (params.user) {
            try {
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
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
          logger.log("[OAuth] Constructed URL from params:", url);
        } else {
          logger.log("[OAuth] No params found, checking Linking.getInitialURL()...");
          const { getInitialURL } = require("expo-linking");
          const initialUrl = await getInitialURL();
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
          setStatus("success");
          logger.log("[OAuth] Redirecting to home...");
          setTimeout(() => {
            router.replace("/home");
          }, 1000);
          return;
        }

        // Otherwise, exchange code for session token
        if (!code || !state) {
          logger.error("[OAuth] Missing code or state parameter", {
            hasCode: !!code,
            hasState: !!state,
          });
          setStatus("error");
          setErrorMessage("Missing code or state parameter");
          return;
        }

        // Exchange code for session token
        logger.log("[OAuth] Exchanging code for session token...", {
          code: code.substring(0, 20) + "...",
          state: state.substring(0, 20) + "...",
        });
        const result = await Api.exchangeOAuthCode(code, state);
        logger.log("[OAuth] Exchange result:", {
          hasSessionToken: !!result.sessionToken,
          hasUser: !!result.user,
        });

        if (result.sessionToken) {
          logger.log("[OAuth] Session token received, storing...");
          await Auth.setSessionToken(result.sessionToken);
          logger.log("[OAuth] Session token stored successfully");

          if (result.user) {
            logger.log("[OAuth] User data received:", result.user);
            const userInfo: Auth.User = {
              id: result.user.id,
              openId: result.user.openId,
              name: result.user.name,
              email: result.user.email,
              loginMethod: result.user.loginMethod,
              lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
            };
            await Auth.setUserInfo(userInfo);
            logger.log("[OAuth] User info stored:", userInfo);
          } else {
            logger.log("[OAuth] No user data in result");
          }

          setStatus("success");
          logger.log("[OAuth] Authentication successful, redirecting to home...");

          setTimeout(() => {
            logger.log("[OAuth] Executing redirect...");
            router.replace("/home");
          }, 1000);
        } else {
          logger.error("[OAuth] No session token in result:", result);
          setStatus("error");
          setErrorMessage("No session token received");
        }
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 16,
        }}
      >
        {/* ── Processing ─────────────────────────────────── */}
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "500",
                fontSize: 13,
                lineHeight: 19.5,
                color: "rgba(255,255,255,0.55)",
                textAlign: "center",
              }}
            >
              Completing authentication...
            </Text>
          </>
        )}

        {/* ── Success ────────────────────────────────────── */}
        {status === "success" && (
          <>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(50,215,75,0.14)",
                borderWidth: 1,
                borderColor: "rgba(50,215,75,0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>✓</Text>
            </View>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 19,
                color: colors.foreground,
              }}
            >
              Authentication successful
            </Text>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "600",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Redirecting...
            </Text>
          </>
        )}

        {/* ── Error ──────────────────────────────────────── */}
        {status === "error" && (
          <>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255,69,58,0.14)",
                borderWidth: 1,
                borderColor: "rgba(255,69,58,0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>✕</Text>
            </View>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 19,
                color: colors.error,
              }}
            >
              Authentication failed
            </Text>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "500",
                fontSize: 13,
                lineHeight: 19.5,
                color: "rgba(255,255,255,0.55)",
                textAlign: "center",
              }}
            >
              {errorMessage}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

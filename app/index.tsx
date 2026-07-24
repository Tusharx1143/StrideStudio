/**
 * Landing page — shown before the main app for unauthenticated users.
 *
 * Design direction: "Data Runner" — inspired by high-end sports watch
 * interfaces and running shoe design. Dark, precise, geometric. Orange
 * serves as the single accent against deep near-black backgrounds.
 *
 * Auth flow:
 *   1. Check if Strava is already connected → redirect to /home
 *   2. Show landing page with "Connect with Strava" CTA
 *   3. Redirect to backend /api/strava/auth to initiate OAuth
 */

import { Text, View, TouchableOpacity, Platform, Linking } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { useApp } from "@/lib/app-context";
import { API_BASE } from "@/lib/config";
import { useColors } from "@/hooks/use-colors";

// ── Background Art ──────────────────────────────────────────────────────────
// Abstract geometric composition suggesting movement, routes, and data.
// Three concentric circles (watch face / GPS accuracy rings) + a route line.

const ROUTE_POINTS = [
  [40, 180],
  [90, 120],
  [140, 150],
  [190, 80],
  [240, 110],
  [290, 60],
  [340, 100],
  [370, 70],
];

function BackgroundArt() {
  const pointsStr = ROUTE_POINTS.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.12,
      }}
      pointerEvents="none"
    >
      <Svg viewBox="0 0 400 700" style={{ width: "100%", height: "100%" }}>
        {/* Concentric rings — GPS accuracy / watch face */}
        <Circle cx="200" cy="280" r="220" stroke="#F97316" strokeWidth="0.6" fill="none" opacity={0.35} />
        <Circle cx="200" cy="280" r="170" stroke="#64748B" strokeWidth="0.5" fill="none" opacity={0.2} />
        <Circle cx="200" cy="280" r="120" stroke="#64748B" strokeWidth="0.4" fill="none" opacity={0.15} />

        {/* Radial tick marks at 45° intervals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const inner = 105;
          const outer = angle % 90 === 0 ? 125 : 115;
          return (
            <Line
              key={angle}
              x1={200 + inner * Math.cos(rad)}
              y1={280 + inner * Math.sin(rad)}
              x2={200 + outer * Math.cos(rad)}
              y2={280 + outer * Math.sin(rad)}
              stroke="#64748B"
              strokeWidth={angle % 90 === 0 ? 1 : 0.4}
              opacity={0.25}
            />
          );
        })}

        {/* Crosshairs at center */}
        <Line x1={170} y1={280} x2={230} y2={280} stroke="#F97316" strokeWidth="0.3" opacity={0.3} />
        <Line x1={200} y1={250} x2={200} y2={310} stroke="#F97316" strokeWidth="0.3" opacity={0.3} />

        {/* Activity route line */}
        <Polyline
          points={pointsStr}
          fill="none"
          stroke="#F97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />

        {/* Waypoint dots */}
        {ROUTE_POINTS.map(([cx, cy], i) => (
          <Circle
            key={`wp-${i}`}
            cx={cx}
            cy={cy}
            r={i === 0 || i === ROUTE_POINTS.length - 1 ? 3 : 2}
            fill="#F97316"
            opacity={i === 0 || i === ROUTE_POINTS.length - 1 ? 0.6 : 0.35}
          />
        ))}

        {/* Vertical grid lines */}
        {[50, 130, 200, 270, 350].map((x) => (
          <Line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={700} stroke="#64748B" strokeWidth="0.3" opacity={0.08} />
        ))}
      </Svg>
    </View>
  );
}

// ── Stat Preview ────────────────────────────────────────────────────────────

function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify().damping(15)}
      style={{ alignItems: "center", gap: 2 }}
    >
      <Text
        style={{
          color: "#F8FAFC",
          fontSize: 26,
          fontWeight: "900",
          letterSpacing: -0.5,
          fontFamily: "Courier",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: "#64748B",
          fontSize: 10,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

// ── Landing Page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { stravaConnected, loading } = useApp();
  const [connecting, setConnecting] = useState(false);
  const [ready, setReady] = useState(false);

  // ── Auth gate ──
  // Redirect immediately if already connected. The landing page acts as a
  // branded loading state while the tRPC status check is in flight (~300ms).
  useEffect(() => {
    if (!loading && stravaConnected) {
      router.replace("/home");
      return;
    }
    // Brief delay so the entrance animation doesn't fight the status check
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, [stravaConnected, loading, router]);

  // ── Connect handler ──
  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      if (Platform.OS === "web") {
        window.location.href = `${API_BASE}/api/strava/auth`;
      } else {
        const supported = await Linking.canOpenURL(`${API_BASE}/api/strava/auth`);
        if (supported) await Linking.openURL(`${API_BASE}/api/strava/auth`);
      }
    } catch (error) {
      console.error("[Landing] Failed to initiate Strava auth:", error);
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Don't render anything if redirecting ──
  if (stravaConnected) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#090D14" }}>
      {/* Decorative background */}
      <BackgroundArt />

      {/* Subtle top-to-bottom gradient vignette */}
      <LinearGradient
        colors={["#090D14", "transparent", "transparent", "#090D14"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      {/* Main layout */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* ── HERO: Brand + tagline ── */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          {ready && (
            <>
              {/* Accent dash above brand */}
              <Animated.View
                entering={FadeInDown.delay(80).springify().damping(15)}
                style={{
                  width: 36,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: "#F97316",
                  marginBottom: 28,
                }}
              />

              {/* Brand name — huge, condensed, tight tracking */}
              <Animated.Text
                entering={FadeInDown.delay(180).springify().damping(15)}
                style={{
                  color: "#F8FAFC",
                  fontSize: 58,
                  fontWeight: "900",
                  letterSpacing: -1.5,
                  textAlign: "center",
                  lineHeight: 58,
                }}
              >
                STRIDE{"\n"}STUDIO
              </Animated.Text>

              {/* Tagline */}
              <Animated.Text
                entering={FadeInDown.delay(300).springify().damping(15)}
                style={{
                  color: "#64748B",
                  fontSize: 15,
                  fontWeight: "500",
                  textAlign: "center",
                  marginTop: 18,
                  lineHeight: 23,
                  letterSpacing: 0.2,
                }}
              >
                Turn your workouts{"\n"}into art worth sharing.
              </Animated.Text>
            </>
          )}
        </View>

        {/* ── FOOTER: Stats + CTA ── */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 32, gap: 28 }}>
          {ready && (
            <>
              {/* Preview stats — hint at what you'll see after connecting */}
              <Animated.View
                entering={FadeInUp.delay(450).springify().damping(15)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <StatItem value="150+" label="km / wk" delay={460} />
                <View style={{ width: 1, height: "100%", backgroundColor: "#334155" }} />
                <StatItem value="12" label="activities" delay={540} />
                <View style={{ width: 1, height: "100%", backgroundColor: "#334155" }} />
                <StatItem value="3.2k" label="elev (m)" delay={620} />
              </Animated.View>

              {/* CTA Button */}
              <Animated.View entering={FadeInUp.delay(600).springify().damping(15)}>
                <TouchableOpacity
                  onPress={handleConnect}
                  disabled={connecting}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Connect with Strava to get started"
                  style={{ minHeight: 56 }}
                >
                  <LinearGradient
                    colors={["#F97316", "#EA580C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 17,
                      paddingHorizontal: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 10,
                    }}
                  >
                    {/* Runner icon */}
                    <Text style={{ fontSize: 20, fontWeight: "800" }}>🏃</Text>
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 16,
                        fontWeight: "700",
                        letterSpacing: -0.2,
                      }}
                    >
                      {connecting ? "Connecting..." : "Connect with Strava"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Legal / Footer note */}
              <Animated.View entering={FadeIn.delay(780)}>
                <Text
                  style={{
                    color: "#475569",
                    fontSize: 11,
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  Powered by Strava.{" "}
                  <Text style={{ color: "#64748B" }}>Terms</Text> ·{" "}
                  <Text style={{ color: "#64748B" }}>Privacy</Text>
                </Text>
              </Animated.View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

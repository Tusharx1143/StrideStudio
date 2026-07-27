/**
 * Profile Screen — athlete stats, achievements, Strava connection, settings.
 *
 * Standalone profile used as navigation target from HomeEmptyState and
 * the OAuth flow. Restyled to match the design handoff tokens.
 *
 * Token alignment:
 *   bg.base: #0A0A0B, bg.card: #0E0E10, bg.surface: #16161A
 *   border.hairline: #1C1C1E, brand.orange: #FF6B35
 *   text.primary: #FFFFFF, text.muted: #8E8E93
 */
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Platform,
  Linking,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { API_BASE } from "@/lib/config";
import { StrideButton } from "@/components/stride-button";
import { computeWeekStats, computeAchievements, getSportColor } from "@/lib/sport-theme";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const WEEKLY_GOAL_KM = 40;

// ── Progress Ring ──────────────────────────────────────────────

function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "800",
          fontSize: 19,
          color: colors.foreground,
        }}
      >
        {Math.round(progress * 100)}%
      </Text>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "600",
          fontSize: 9,
          letterSpacing: 0.08 * 9,
          color: "#8E8E93",
          marginTop: 2,
        }}
      >
        OF GOAL
      </Text>
    </View>
  );
}

// ── Sport Breakdown Bar ─────────────────────────────────────────

function SportBreakdownBar({
  runKm,
  rideKm,
  workoutCount,
}: {
  runKm: number;
  rideKm: number;
  workoutCount: number;
}) {
  const colors = useColors();
  const total = runKm + rideKm + workoutCount;
  if (total === 0) return null;

  const runPct = runKm / total;
  const ridePct = rideKm / total;

  return (
    <View style={{ marginTop: 12 }}>
      <View
        style={{ flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden" }}
      >
        {runKm > 0 && (
          <View style={{ flex: runPct, backgroundColor: getSportColor("run") }} />
        )}
        {rideKm > 0 && (
          <View style={{ flex: ridePct, backgroundColor: getSportColor("ride") }} />
        )}
        {workoutCount > 0 && (
          <View
            style={{
              flex: 1 - runPct - ridePct,
              backgroundColor: getSportColor("workout"),
            }}
          />
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 16,
          marginTop: 8,
        }}
      >
        {runKm > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getSportColor("run"),
              }}
            />
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "600",
                fontSize: 10,
                color: "#8E8E93",
              }}
            >
              Run {runKm.toFixed(1)}km
            </Text>
          </View>
        )}
        {rideKm > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getSportColor("ride"),
              }}
            />
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "600",
                fontSize: 10,
                color: "#8E8E93",
              }}
            >
              Ride {rideKm.toFixed(1)}km
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, savedPostsCount, stravaConnected, athlete, loading, refresh } =
    useApp();
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const [notifications, setNotifications] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Pre-filter to current week
  const weekActivities = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return activities.filter((a) => a.startDate && new Date(a.startDate) >= monday);
  }, [activities]);
  const weekStats = useMemo(() => computeWeekStats(weekActivities), [weekActivities]);
  const achievements = useMemo(() => computeAchievements(activities), [activities]);
  const goalProgress = Math.min(weekStats.totalKm / WEEKLY_GOAL_KM, 1);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("strava") === "connected") {
        refresh();
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [refresh]);

  const connectStrava = async () => {
    setConnecting(true);
    try {
      if (Platform.OS === "web") {
        window.location.href = `${API_BASE}/api/strava/auth`;
      } else {
        const supported = await Linking.canOpenURL(`${API_BASE}/api/strava/auth`);
        if (supported) await Linking.openURL(`${API_BASE}/api/strava/auth`);
      }
    } catch (error) {
      console.error("[Strava] Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectStrava = () => {
    Alert.alert(
      "Disconnect Strava?",
      "Your activity data and posts won't be deleted, but new activities won't sync until you reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              const resp = await fetch(`${API_BASE}/api/strava/disconnect`, {
                method: "POST",
              });
              if (resp.ok) refresh();
            } catch (error) {
              console.error("[Strava] Disconnect failed:", error);
            }
          },
        },
      ],
    );
  };

  const avatarInitials = athlete
    ? (athlete.firstname?.[0] ?? "") + (athlete.lastname?.[0] ?? "")
    : "";

  const displayName = athlete
    ? `${athlete.firstname ?? ""} ${athlete.lastname ?? ""}`.trim()
    : stravaConnected
      ? "Athlete"
      : "StrideStudio";

  return (
    <ScreenContainer className="p-0">
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* ── Profile Header ──────────────────────────── */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 30,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: 10,
            }}
          >
            {/* Avatar */}
            {athlete?.profile ? (
              <View
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 41,
                  overflow: "hidden",
                  backgroundColor: "#0E0E10",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Image
                  source={{ uri: athlete.profile }}
                  style={{ width: 82, height: 82, borderRadius: 41 }}
                />
              </View>
            ) : (
              <View
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 41,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {athlete ? (
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "900",
                      fontSize: 26,
                      color: "#FFFFFF",
                    }}
                  >
                    {avatarInitials}
                  </Text>
                ) : (
                  <Ionicons name="person" size={34} color="#FFFFFF" />
                )}
              </View>
            )}

            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 21,
                color: colors.foreground,
              }}
            >
              {displayName}
            </Text>
            {athlete?.city ? (
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "500",
                  fontSize: 12.5,
                  color: "#8E8E93",
                }}
              >
                {athlete.city}
                {athlete.country ? `, ${athlete.country}` : ""}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "500",
                  fontSize: 12.5,
                  color: "#8E8E93",
                }}
              >
                {stravaConnected ? "Training is an art" : "Connect Strava to get started"}
              </Text>
            )}

            {/* Status chips */}
            <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
              {stravaConnected && (
                <View
                  style={{
                    backgroundColor: "rgba(50,215,75,0.14)",
                    borderWidth: 1,
                    borderColor: "rgba(50,215,75,0.35)",
                    borderRadius: 14,
                    paddingVertical: 5,
                    paddingHorizontal: 11,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "700",
                      fontSize: 9.5,
                      letterSpacing: 0.08 * 9.5,
                      color: "#32D74B",
                    }}
                  >
                    CONNECTED
                  </Text>
                </View>
              )}
              {activities.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#16161A",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    paddingVertical: 5,
                    paddingHorizontal: 11,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "700",
                      fontSize: 9.5,
                      letterSpacing: 0.08 * 9.5,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {activities.length} ACTIVITIES
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Weekly Goal Progress ────────────────────── */}
          {activities.length > 0 && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 9,
                  letterSpacing: 0.18 * 9,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                }}
              >
                THIS WEEK
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                <ProgressRing progress={goalProgress} color={colors.primary} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "800",
                      fontSize: 19,
                      color: colors.primary,
                    }}
                  >
                    {weekStats.totalKm.toFixed(1)} km
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "500",
                      fontSize: 12.5,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    of {WEEKLY_GOAL_KM} km goal
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "500",
                      fontSize: 10.5,
                      color: "#8E8E93",
                    }}
                  >
                    {weekStats.activitiesCount} activities · {Math.round(weekStats.totalMinutes)} min
                  </Text>
                  <SportBreakdownBar
                    runKm={weekStats.runKm}
                    rideKm={weekStats.rideKm}
                    workoutCount={weekStats.workoutCount}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ── Stats Summary ───────────────────────────── */}
          {activities.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                paddingVertical: 16,
                gap: 9,
              }}
            >
              {[
                {
                  value: String(activities.length),
                  label: "Activities",
                },
                {
                  value: `${totalDistance.toFixed(0)} km`,
                  label: "Total Distance",
                },
                {
                  value: String(savedPostsCount),
                  label: "Posts",
                },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{
                    flex: 1,
                    backgroundColor: "#0E0E10",
                    borderRadius: 14,
                    paddingVertical: 13,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    gap: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  accessibilityRole="summary"
                >
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "800",
                      fontSize: 19,
                      color: colors.primary,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "600",
                      fontSize: 9,
                      letterSpacing: 0.12 * 9,
                      color: "#8E8E93",
                      textAlign: "center",
                    }}
                  >
                    {stat.label.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Personal Records ────────────────────────── */}
          {achievements.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 9,
                  letterSpacing: 0.18 * 9,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 9,
                }}
              >
                PERSONAL RECORDS
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {achievements.map((ach) => (
                  <View
                    key={ach.id}
                    style={{
                      backgroundColor: "#0E0E10",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                      minWidth: 100,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{ach.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontWeight: "700",
                        fontSize: 13,
                        color: colors.foreground,
                        marginTop: 6,
                      }}
                    >
                      {ach.value}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: "600",
                        fontSize: 9,
                        color: "#8E8E93",
                        marginTop: 2,
                        textAlign: "center",
                      }}
                    >
                      {ach.label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Strava Connection ───────────────────────── */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                letterSpacing: 0.18 * 9,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 9,
              }}
            >
              DATA SOURCE
            </Text>
            <View
              style={{
                backgroundColor: "#0E0E10",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      backgroundColor: "#FC4C02",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="flash" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: "700",
                        fontSize: 13,
                        color: colors.foreground,
                      }}
                    >
                      Strava
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontWeight: "500",
                        fontSize: 10.5,
                        color: "#8E8E93",
                        marginTop: 2,
                      }}
                    >
                      {loading
                        ? "Checking..."
                        : stravaConnected
                          ? athlete
                            ? `Connected as ${athlete.firstname}`
                            : "Connected"
                          : "Not connected"}
                    </Text>
                  </View>
                </View>
                {stravaConnected ? (
                  <TouchableOpacity
                    onPress={disconnectStrava}
                    accessibilityRole="button"
                    accessibilityLabel="Disconnect Strava"
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,69,58,0.14)",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: "700",
                        fontSize: 10,
                        color: "#FF453A",
                      }}
                    >
                      Disconnect
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <StrideButton
                    onPress={connectStrava}
                    loading={connecting}
                    style={{
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      minHeight: 36,
                    }}
                    textStyle={{ fontSize: 12 }}
                  >
                    Connect
                  </StrideButton>
                )}
              </View>
            </View>
          </View>

          {/* ── Settings ────────────────────────────────── */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                letterSpacing: 0.18 * 9,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 9,
              }}
            >
              SETTINGS
            </Text>
            <View
              style={{
                backgroundColor: "#0E0E10",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {/* Notifications row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "500",
                    fontSize: 13,
                    color: colors.foreground,
                  }}
                >
                  Notifications
                </Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityRole="switch"
                  accessibilityLabel="Notifications"
                  accessibilityState={{ checked: notifications }}
                />
              </View>

              {/* All Settings row */}
              <TouchableOpacity
                onPress={() => router.push("/settings")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  minHeight: 48,
                }}
                accessibilityRole="button"
                accessibilityLabel="Open full settings"
              >
                <View>
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "500",
                      fontSize: 13,
                      color: colors.foreground,
                    }}
                  >
                    All Settings
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "500",
                      fontSize: 10.5,
                      color: "#8E8E93",
                      marginTop: 2,
                    }}
                  >
                    Appearance, privacy, account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Refresh from Strava ─────────────────────── */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            <StrideButton variant="secondary" onPress={refresh} loading={loading}>
              Refresh from Strava
            </StrideButton>
          </View>
        </ScrollView>

        {/* ── Back button — outside ScrollView ──────────── */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          accessibilityRole="button"
          accessibilityLabel="Go back to home"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#16161A",
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

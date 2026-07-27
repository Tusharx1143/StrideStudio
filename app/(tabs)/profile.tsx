import { ScrollView, Text, View, TouchableOpacity, Switch, Platform, Linking, Image, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { API_BASE } from "@/lib/config";
import { StrideButton } from "@/components/stride-button";
import { computeWeekStats, computeAchievements, getSportColor } from "@/lib/sport-theme";
import Svg, { Circle } from "react-native-svg";
const WEEKLY_GOAL_KM = 40; // Default weekly goal

// ── Progress Ring ──
function ProgressRing({ progress, size = 100, strokeWidth = 8, color }: { progress: number; size?: number; strokeWidth?: number; color: string }) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
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
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800" }}>
        {Math.round(progress * 100)}%
      </Text>
      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "600", marginTop: 2 }}>of goal</Text>
    </View>
  );
}

// ── Sport Breakdown Bar ──
function SportBreakdownBar({ runKm, rideKm, workoutCount }: { runKm: number; rideKm: number; workoutCount: number }) {
  const colors = useColors();
  const total = runKm + rideKm + workoutCount;
  if (total === 0) return null;

  const runPct = runKm / total;
  const ridePct = rideKm / total;

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden" }}>
        {runKm > 0 && (
          <View style={{ flex: runPct, backgroundColor: getSportColor("run") }} />
        )}
        {rideKm > 0 && (
          <View style={{ flex: ridePct, backgroundColor: getSportColor("ride") }} />
        )}
        {workoutCount > 0 && (
          <View style={{ flex: 1 - runPct - ridePct, backgroundColor: getSportColor("workout") }} />
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getSportColor("run") }} />
          <Text style={{ color: colors.muted, fontSize: 10 }}>Run {runKm.toFixed(1)}km</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getSportColor("ride") }} />
          <Text style={{ color: colors.muted, fontSize: 10 }}>Ride {rideKm.toFixed(1)}km</Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, savedPostsCount, stravaConnected, athlete, loading, refresh } = useApp();
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const [notifications, setNotifications] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Pre-filter to current week since computeWeekStats no longer does this internally
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
              const resp = await fetch(`${API_BASE}/api/strava/disconnect`, { method: "POST" });
              if (resp.ok) refresh();
            } catch (error) {
              console.error("[Strava] Disconnect failed:", error);
            }
          },
        },
      ],
    );
  };

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
          {/* Profile Header */}
          <View style={{ alignItems: "center", paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {athlete?.profile ? (
              <View style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12, overflow: "hidden", backgroundColor: colors.surface }}>
                <Image source={{ uri: athlete.profile }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              </View>
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 36 }}>🏃</Text>
              </View>
            )}
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "bold" }}>
              {athlete ? `${athlete.firstname} ${athlete.lastname}` : stravaConnected ? "Athlete" : "StrideStudio"}
            </Text>
            {athlete?.city && (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>{athlete.city}{athlete.country ? `, ${athlete.country}` : ""}</Text>
            )}
            {!athlete && (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>{stravaConnected ? "Training is an art" : "Connect Strava to get started"}</Text>
            )}
          </View>

          {/* Weekly Goal Progress */}
          {activities.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>This Week</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                <ProgressRing progress={goalProgress} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800" }}>{weekStats.totalKm.toFixed(1)} km</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>of {WEEKLY_GOAL_KM} km goal</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {weekStats.activitiesCount} activities · {Math.round(weekStats.totalMinutes)} min
                  </Text>
                  <SportBreakdownBar runKm={weekStats.runKm} rideKm={weekStats.rideKm} workoutCount={weekStats.workoutCount} />
                </View>
              </View>
            </View>
          )}

          {/* Stats Summary */}
          {activities.length > 0 && (
            <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
              {[
                { value: activities.length, label: "Activities", accessibilityLabel: `${activities.length} activities` },
                { value: `${totalDistance.toFixed(0)} km`, label: "Total Distance", accessibilityLabel: `${totalDistance.toFixed(0)} kilometers total` },
                { value: savedPostsCount, label: "Posts", accessibilityLabel: `${savedPostsCount} posts created` },
              ].map((stat) => (
                <View key={stat.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
                  accessibilityRole="summary" accessibilityLabel={stat.accessibilityLabel}>
                  <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>{stat.value}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Personal Records */}
          {achievements.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 10 }}>Personal Records</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {achievements.map((ach) => (
                  <View key={ach.id} style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", minWidth: 100 }}>
                    <Text style={{ fontSize: 20 }}>{ach.emoji}</Text>
                    <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", marginTop: 4 }}>{ach.value}</Text>
                    <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>{ach.label}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Strava Connection */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Data Source</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>🏃</Text>
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>Strava</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {loading ? "Checking..." : stravaConnected ? (athlete ? `Connected as ${athlete.firstname}` : "Connected") : "Not connected"}
                    </Text>
                  </View>
                </View>
                {stravaConnected ? (
                  <TouchableOpacity onPress={disconnectStrava} accessibilityRole="button" accessibilityLabel="Disconnect Strava"
                    style={{ backgroundColor: colors.error + "20", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, minHeight: 44, justifyContent: "center" }}>
                    <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>Disconnect</Text>
                  </TouchableOpacity>
                ) : (
                  <StrideButton onPress={connectStrava} loading={connecting} style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, minHeight: 36 }} textStyle={{ fontSize: 12 }}>
                    Connect
                  </StrideButton>
                )}
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Settings</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Notifications</Text>
                <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityRole="switch" accessibilityLabel="Notifications" accessibilityState={{ checked: notifications }} />
              </View>
              <TouchableOpacity
                onPress={() => router.push("/settings")}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, minHeight: 48 }}
                accessibilityRole="button" accessibilityLabel="Open full settings"
              >
                <View>
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>All Settings</Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 1 }}>Appearance, privacy, account</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Refresh */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <StrideButton variant="secondary" onPress={refresh} loading={loading}>Refresh from Strava</StrideButton>
          </View>
        </ScrollView>

        {/* Back button — outside ScrollView to avoid aria-hidden conflicts */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          accessibilityRole="button"
          accessibilityLabel="Go back to home"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

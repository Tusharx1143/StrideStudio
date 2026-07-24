import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform, Image } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration } from "@/lib/app-data";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityListSkeleton } from "@/components/skeleton";
import { getSportConfig, relativeTime, computeWeekStats } from "@/lib/sport-theme";
import { polylineToSvgPath } from "@/lib/map-utils";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Svg, { Polyline, Circle } from "react-native-svg";

const WEEKLY_GOAL = 40;

// ── Header Gradient Colors by Sport ──
const RUN_GRADIENT: readonly [string, string] = ["#FF6B35", "#FF3D00"];
const RIDE_GRADIENT: readonly [string, string] = ["#0A84FF", "#0055D4"];
const WORKOUT_GRADIENT: readonly [string, string] = ["#34C759", "#1B8C3A"];

// ── Mini Route Map ──
function MiniRouteMap({ polyline, sportColor }: { polyline: string; sportColor: string }) {
  const pathData = polylineToSvgPath(polyline);
  if (!pathData) return null;
  const coords = pathData.replace("M ", "").split(" L ").map((p) => {
    const [x, y] = p.split(" ").map(Number);
    return `${x * 100},${y * 100}`;
  }).join(" ");
  return (
    <Svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", position: "absolute" }}>
      <Polyline points={coords} fill="none" stroke={sportColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
    </Svg>
  );
}

// ── Activity Card ──
function StoryCard({ activity, onShare, onOpen }: { activity: Activity; onShare: () => void; onOpen: () => void }) {
  const colors = useColors();
  const sport = getSportConfig(activity.type);
  const relTime = relativeTime(activity.startDate);

  const gradientColors = activity.type === "run" ? RUN_GRADIENT : activity.type === "ride" ? RIDE_GRADIENT : WORKOUT_GRADIENT;

  const paceOrSpeed =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60).toString().padStart(2, "0")}/km`
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : null;

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.96}
      accessibilityRole="button"
      accessibilityLabel={`${sport.label}: ${activity.title}, ${activity.distance.toFixed(1)} kilometers, ${relTime}`}
      accessibilityHint="Tap to view activity details"
      style={{ marginBottom: 16 }}
    >
      <View style={{ borderRadius: 20, overflow: "hidden", backgroundColor: colors.surface }}>
        {/* Hero section with gradient */}
        <View style={{ height: 150, position: "relative" }}>
          <LinearGradient colors={gradientColors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />

          {/* Route map overlay */}
          {activity.summaryPolyline && (
            <MiniRouteMap polyline={activity.summaryPolyline} sportColor="rgba(255,255,255,0.5)" />
          )}

          {/* Large activity type watermark */}
          <Text style={{ position: "absolute", right: -8, top: -8, fontSize: 90, fontWeight: "900", opacity: 0.12, color: "#000" }}>
            {sport.emoji}
          </Text>

          {/* Top row badges */}
          <View style={{ position: "absolute", top: 14, left: 14, right: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" }} />
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>{sport.label.toUpperCase()}</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>{relTime}</Text>
          </View>

          {/* Big stat over gradient */}
          <View style={{ position: "absolute", bottom: 14, left: 14 }}>
            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600", opacity: 0.85, marginBottom: 2 }} numberOfLines={1}>
              {activity.title}
            </Text>
            <Text style={{ color: "#FFF", fontSize: 34, fontWeight: "900", letterSpacing: -0.5 }}>
              {activity.distance.toFixed(1)} <Text style={{ fontSize: 16, fontWeight: "700", opacity: 0.8 }}>km</Text>
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Duration</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 2 }}>{formatDuration(activity.duration)}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>{activity.pace != null ? "Pace" : "Speed"}</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 2, fontFamily: "Courier" }}>
                {paceOrSpeed ?? "--"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Elevation</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginTop: 2, fontFamily: "Courier" }}>
                {activity.elevation ? `${activity.elevation}m` : "--"}
              </Text>
            </View>
          </View>

          {/* Bottom row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
              {activity.deviceName && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <IconSymbol name="gear" size={12} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>{activity.deviceName}</Text>
                </View>
              )}
              {activity.sufferScore != null && activity.sufferScore > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <IconSymbol name="flame.fill" size={12} color="#FF6B35" />
                  <Text style={{ color: "#FF6B35", fontSize: 11, fontWeight: "600" }}>{activity.sufferScore}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel={`Share ${activity.title}`}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, minHeight: 36, justifyContent: "center" }}
            >
              <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Week Summary Card ──
function WeekSummaryCard() {
  const colors = useColors();
  const { activities } = useApp();
  const weekStats = useMemo(() => computeWeekStats(activities), [activities]);
  const progress = Math.min(weekStats.totalKm / WEEKLY_GOAL, 1);

  if (activities.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <LinearGradient
        colors={["#1E293B", "#0F172A"] as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border }}
      >
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          This Week
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          {/* Total KM */}
          <View>
            <Text style={{ color: colors.foreground, fontSize: 42, fontWeight: "900", letterSpacing: -1 }}>
              {weekStats.totalKm.toFixed(0)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>
              of {WEEKLY_GOAL} km
            </Text>
          </View>

          {/* Mini progress bar + stats */}
          <View style={{ flex: 1, marginLeft: 24 }}>
            {/* Progress bar */}
            <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${progress * 100}%`, backgroundColor: colors.primary, borderRadius: 2 }} />
            </View>

            {/* Sport breakdown */}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B35" }} />
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{weekStats.runKm.toFixed(0)}</Text>
                <Text style={{ color: colors.muted, fontSize: 10 }}>km run</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#0A84FF" }} />
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{weekStats.rideKm.toFixed(0)}</Text>
                <Text style={{ color: colors.muted, fontSize: 10 }}>km ride</Text>
              </View>
            </View>

            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
              {weekStats.activitiesCount} activities · {Math.round(weekStats.totalMinutes)} min
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Home Screen ──
export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, error, stravaConnected, athlete, refresh, selectActivity } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const goToEditor = (activityId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activityId);
    router.push("/editor");
  };

  const openDetails = (activityId: string) => {
    selectActivity(activityId);
    router.push({ pathname: "/activity/[id]", params: { id: activityId } });
  };

  // ── Loading ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800" }}>StrideStudio</Text>
          </View>
          <ActivityListSkeleton count={3} />
        </View>
      </ScreenContainer>
    );
  }

  // ── Error ──
  if (error && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ color: colors.error, fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", textAlign: "center" }}>{error}</Text>
          <View style={{ marginTop: 20 }}>
            <StrideButton variant="secondary" onPress={onRefresh}>Try Again</StrideButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <LinearGradient colors={["#0F172A", "#1E293B"] as any} style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 44 }}>🏃</Text>
          </View>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800", textAlign: "center" }}>
            {stravaConnected ? "Ready to roll?" : "Connect your Strava"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 10, textAlign: "center", lineHeight: 22, maxWidth: 280 }}>
            {stravaConnected
              ? "Pull to refresh and sync your latest activities from Strava."
              : "Link your Strava account to see your rides, runs, and workouts — then turn them into beautiful shareable posts."}
          </Text>
          {!stravaConnected && (
            <View style={{ marginTop: 24 }}>
              <StrideButton onPress={() => router.push("/(tabs)/profile")}>Connect Strava</StrideButton>
            </View>
          )}
          {stravaConnected && (
            <View style={{ marginTop: 24 }}>
              <StrideButton variant="secondary" onPress={onRefresh}>Sync Activities</StrideButton>
            </View>
          )}
        </LinearGradient>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
              {/* Greeting row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
                    {athlete ? `Welcome back` : "StrideStudio"}
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>
                    {athlete ? athlete.firstname : "Training is an art"}
                  </Text>
                </View>
                {athlete?.profile ? (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} accessibilityRole="button" accessibilityLabel="View profile">
                    <Image source={{ uri: athlete.profile }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.primary }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} accessibilityRole="button" accessibilityLabel="View profile"
                    style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 22 }}>🏃</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Week summary */}
              <WeekSummaryCard />
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <StoryCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />
          }
        />
      </View>
    </ScreenContainer>
  );
}

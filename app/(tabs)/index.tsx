import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration } from "@/lib/app-data";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityListSkeleton } from "@/components/skeleton";
import { getSportConfig, relativeTime } from "@/lib/sport-theme";
import { polylineToSvgPath } from "@/lib/map-utils";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Svg, { Polyline } from "react-native-svg";

// ── Mini Route Map ──
function MiniRouteMap({ polyline, sportColor }: { polyline: string; sportColor: string }) {
  const pathData = polylineToSvgPath(polyline);
  if (!pathData) return null;

  // Parse the SVG path into polyline points
  const coords = pathData
    .replace("M ", "")
    .split(" L ")
    .map((p) => {
      const [x, y] = p.split(" ").map(Number);
      return `${x * 100},${y * 100}`;
    })
    .join(" ");

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15 }}>
      <Svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
        <Polyline points={coords} fill="none" stroke={sportColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// ── Stat Pill ──
function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color, fontSize: 20, fontWeight: "800", fontFamily: "Courier" }}>{value}</Text>
      <Text style={{ color: "#64748B", fontSize: 10, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

// ── Activity Card ──
function StoryCard({ activity, onShare, onOpen }: { activity: Activity; onShare: () => void; onOpen: () => void }) {
  const colors = useColors();
  const sport = getSportConfig(activity.type);

  const paceOrSpeed =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60).toString().padStart(2, "0")}/km`
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : null;

  const relTime = relativeTime(activity.startDate);

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${sport.label}: ${activity.title}, ${activity.distance.toFixed(1)} kilometers, ${relTime}`}
      accessibilityHint="Tap to view activity details"
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 18,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {/* Top section with sport accent + map preview */}
        <View
          style={{
            height: 160,
            backgroundColor: colors.surface,
            position: "relative",
            borderLeftWidth: 4,
            borderLeftColor: sport.color,
          }}
        >
          {activity.summaryPolyline ? (
            <MiniRouteMap polyline={activity.summaryPolyline} sportColor={sport.color} />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.08 }}>
              <Text style={{ fontSize: 64 }}>{sport.emoji}</Text>
            </View>
          )}

          {/* Gradient overlay at bottom */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              backgroundColor: "rgba(0,0,0,0.0)",
            }}
          />

          {/* Top row: sport badge + relative time */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 5,
                gap: 4,
              }}
            >
              <IconSymbol name={sport.sfSymbol as any} size={14} color={sport.color} />
              <Text style={{ color: sport.color, fontSize: 12, fontWeight: "700" }}>{sport.label}</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
              {relTime}
            </Text>
          </View>

          {/* Title at bottom of hero */}
          <View style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }} numberOfLines={1}>
              {activity.title}
            </Text>
          </View>
        </View>

        {/* Stat grid */}
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <StatPill value={`${activity.distance.toFixed(1)}`} label="km" color={sport.color} />
            <StatPill value={formatDuration(activity.duration)} label="duration" color={colors.foreground} />
            <StatPill value={activity.elevation ? `${activity.elevation}m` : "--"} label="elevation" color={colors.foreground} />
          </View>

          {/* Bottom row: extra info */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {paceOrSpeed && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <IconSymbol name="speedometer" size={13} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "500" }}>{paceOrSpeed}</Text>
                </View>
              )}
              {activity.deviceName && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <IconSymbol name="gear" size={12} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>{activity.deviceName}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel={`Create post from ${activity.title}`}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 7,
                minHeight: 36,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Home Screen ──
export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, error, stravaConnected, refresh, selectActivity } = useApp();
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
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>StrideStudio</Text>
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
          <Text style={{ color: colors.error, fontSize: 16, fontWeight: "600", textAlign: "center" }}>⚠️</Text>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginTop: 12, textAlign: "center" }}>{error}</Text>
          <View style={{ marginTop: 16 }}>
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
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏃</Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {stravaConnected ? "No activities yet" : "Connect your Strava"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "We couldn't find any activities. Sync your Strava and pull to refresh."
              : "Link your Strava account to see your rides, runs, and workouts here."}
          </Text>
          {!stravaConnected && (
            <View style={{ marginTop: 20 }}>
              <StrideButton onPress={() => router.push("/(tabs)/profile")}>Connect Strava</StrideButton>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>StrideStudio</Text>
        </View>

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoryCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />
          }
        />
      </View>
    </ScreenContainer>
  );
}

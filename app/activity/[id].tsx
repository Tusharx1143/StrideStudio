import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { formatDuration } from "@/lib/app-data";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityCardSkeleton } from "@/components/skeleton";
import { getSportConfig, relativeTime, computeAchievements } from "@/lib/sport-theme";
import { polylineToSvgPath } from "@/lib/map-utils";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { ActivityAnimatedIcon } from "@/components/activity-animated-icon";
import Svg, { Polyline, Circle } from "react-native-svg";

// ── Route Map Widget ──
function RouteMapWidget({ polyline, sportColor }: { polyline: string; sportColor: string }) {
  const pathData = polylineToSvgPath(polyline);
  if (!pathData) return null;

  const coords = pathData
    .replace("M ", "")
    .split(" L ")
    .map((p) => {
      const [x, y] = p.split(" ").map(Number);
      return `${x * 100},${y * 100}`;
    })
    .join(" ");

  return (
    <View style={{ height: 180, borderRadius: 14, overflow: "hidden", backgroundColor: "#0A0E14" }}>
      <Svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
        <Polyline points={coords} fill="none" stroke={sportColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Start marker */}
        {(() => {
          const pts = coords.split(" ");
          if (pts.length < 2) return null;
          const [sx, sy] = pts.slice(0, 2);
          return <Circle cx={sx} cy={sy} r="2.5" fill={sportColor} />;
        })()}
      </Svg>
    </View>
  );
}

// ── Stat Icon Card ──
function StatIconCard({ icon, label, value, color }: { icon: IconSymbolName; label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        width: "48%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
      }}
    >
      <IconSymbol name={icon} size={18} color={color} />
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800", marginTop: 6 }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

// ── Achievement Chip ──
function AchievementChip({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: "center",
        minWidth: 100,
      }}
    >
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", marginTop: 4 }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, selectActivity } = useApp();

  const activity = activities.find((a) => a.id === id);
  const achievements = computeAchievements(activities);

  // ── Loading ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <ActivityCardSkeleton />
        </View>
      </ScreenContainer>
    );
  }

  // ── Not found ──
  if (!activity) {
    return (
      <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>Activity not found</Text>
          <View style={{ marginTop: 16 }}>
            <StrideButton variant="secondary" onPress={() => router.back()}>Go Back</StrideButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const sport = getSportConfig(activity.type);
  const relTime = relativeTime(activity.startDate);

  const onShare = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activity.id);
    router.push("/editor");
  };

  const statCards: Array<{ icon: IconSymbolName; label: string; value: string; color: string }> = [
    { icon: "speedometer", label: "Distance", value: `${activity.distance.toFixed(2)} km`, color: sport.color },
    { icon: "clock.fill", label: "Duration", value: formatDuration(activity.duration), color: colors.foreground },
    ...(activity.pace != null
      ? [{ icon: "speedometer" as const, label: "Avg Pace", value: `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60).toString().padStart(2, "0")} /km`, color: sport.color }]
      : activity.speed != null
        ? [{ icon: "speedometer" as const, label: "Avg Speed", value: `${activity.speed.toFixed(1)} km/h`, color: sport.color }]
        : []),
    { icon: "mountain.2.fill", label: "Elevation", value: `${activity.elevation ?? 0} m`, color: colors.muted },
    ...(activity.hasHeartrate
      ? [{ icon: "heart.fill" as const, label: "Heart Rate", value: `${activity.heartRate ?? 0} bpm`, color: "#FF375F" }]
      : []),
    { icon: "flame.fill", label: "Calories", value: `${activity.calories ?? 0} cal`, color: "#FF9F0A" },
  ];

  return (
    <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header bar */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Create post from this activity"
            style={{ backgroundColor: colors.foreground, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9, minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: colors.background, fontSize: 13, fontWeight: "700" }}>Create Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Sport header with animated icon */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ActivityAnimatedIcon type={activity.type} size={32} />
            <Text style={{ color: sport.color, fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>{sport.label}</Text>
          </View>

          <Text style={{ color: colors.foreground, fontSize: 34, fontWeight: "800" }}>{activity.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2, marginBottom: 20 }}>
            {relTime} · {activity.date}
          </Text>

          {/* Route map */}
          {activity.summaryPolyline && (
            <View style={{ marginBottom: 16 }}>
              <RouteMapWidget polyline={activity.summaryPolyline} sportColor={sport.color} />
            </View>
          )}

          {/* Device info */}
          {activity.deviceName && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <IconSymbol name="gear" size={14} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 12 }}>Recorded with {activity.deviceName}</Text>
            </View>
          )}

          {/* Stat cards grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {statCards.map((sc, i) => (
              <StatIconCard key={i} icon={sc.icon} label={sc.label} value={sc.value} color={sc.color} />
            ))}
          </View>

          {/* Elapsed vs moving time */}
          {activity.elapsedTime > 0 && activity.elapsedTime !== activity.duration && (
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8, marginBottom: 16 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Moving: {formatDuration(activity.duration)}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Elapsed: {formatDuration(activity.elapsedTime)}</Text>
            </View>
          )}

          {/* Suffer score */}
          {activity.sufferScore != null && activity.sufferScore > 0 && (
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <IconSymbol name="flame.fill" size={16} color="#FF6B35" />
                <Text style={{ color: "#FF6B35", fontSize: 13, fontWeight: "700" }}>Suffer Score: {activity.sufferScore}</Text>
              </View>
            </View>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 10 }}>Personal Records</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {achievements.map((ach) => (
                  <AchievementChip key={ach.id} label={ach.label} value={ach.value} emoji={ach.emoji} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* CTA */}
          <View style={{ marginTop: 24 }}>
            <StrideButton variant="secondary" onPress={onShare}>
              Create Post from Activity
            </StrideButton>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

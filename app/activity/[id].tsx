/**
 * Activity detail screen — matched to the design handoff.
 *
 * Full stat table with IBM Plex Mono values, route map card,
 * and a full-width "CREATE POST FROM ACTIVITY" CTA.
 */
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityCardSkeleton } from "@/components/skeleton";
import { getSportConfig } from "@/lib/sport-theme";
import { polylineToSvgPath } from "@/lib/map-utils";
import { BackButton } from "@/components/back-button";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import {
  dist,
  distUnitShort,
  dur,
  pace,
  speed,
  speedUnit,
  elev,
  elevUnit,
  typeLabel,
  weekday,
  dateShort,
  NS,
} from "@/lib/stickers/formatters";
import Svg, { Polyline, Circle } from "react-native-svg";

// ── Route Map Widget ────────────────────────────────────────

function RouteMapCard({
  polyline,
  sportColor,
}: {
  polyline?: string;
  sportColor: string;
}) {
  if (!polyline) return null;
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
    <View
      style={{
        height: 150,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#0E0E10",
        borderWidth: 1,
        borderColor: "#1C1C1E",
        marginBottom: 16,
      }}
    >
      <Svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
        <Polyline
          points={coords}
          fill="none"
          stroke={sportColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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

// ── Main Screen ─────────────────────────────────────────────

export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, selectActivity } = useApp();

  const activity = activities.find((a) => a.id === id);

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
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            Activity not found
          </Text>
          <View style={{ marginTop: 16 }}>
            <StrideButton variant="secondary" onPress={() => router.back()}>
              Go Back
            </StrideButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const sport = getSportConfig(activity.type);
  const dayLabel = `${weekday(activity)} ${dateShort(activity)}`;
  const typeLine = `${typeLabel(activity)} · ${activity.title || ""}`;

  const onShare = () => {
    if (typeof window === "undefined" || !("navigator" in window)) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    selectActivity(activity.id);
    router.push("/editor");
  };

  // Stat rows — matching the handoff's field list
  const statRows: [string, string][] = [
    ["Distance", activity.distance ? `${dist(activity, "metric")} ${distUnitShort("metric")}` : NS],
    ["Moving time", dur(activity.duration)],
    ["Elapsed time", dur(activity.elapsedTime)],
    ...(activity.pace != null
      ? [["Avg pace", `${pace(activity, "metric")}/km`] as [string, string]]
      : []),
    ...(activity.speed != null
      ? [["Avg speed", `${speed(activity, "metric")} ${speedUnit("metric").toLowerCase()}`] as [string, string]]
      : []),
    ...(activity.elevation != null && activity.elevation > 0
      ? [["Elevation gain", `${elev(activity, "metric")} m`] as [string, string]]
      : []),
    ...(activity.hasHeartrate && activity.heartRate != null
      ? [["Avg heart rate", `${activity.heartRate} bpm`] as [string, string]]
      : []),
    ...(activity.calories != null && activity.calories > 0
      ? [["Calories", `${activity.calories} cal`] as [string, string]]
      : []),
    ...(activity.deviceName
      ? [["Device", activity.deviceName] as [string, string]]
      : []),
    ["Started", `${activity.date || ""}`],
  ];

  return (
    <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <BackButton />
          <TouchableOpacity
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Create post from this activity"
            style={{
              backgroundColor: colors.foreground,
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 9,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 13,
                color: colors.background,
              }}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Title */}
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 32,
              letterSpacing: -0.03 * 32,
              color: colors.foreground,
            }}
          >
            {dayLabel}
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 13,
              color: "#8E8E93",
              marginTop: 6,
              marginBottom: 20,
            }}
          >
            {typeLine}
          </Text>

          {/* Route map */}
          {activity.summaryPolyline && (
            <RouteMapCard
              polyline={activity.summaryPolyline}
              sportColor={sport.color}
            />
          )}

          {/* Stat table — handoff style */}
          <View
            style={{
              backgroundColor: "#0E0E10",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#1C1C1E",
              overflow: "hidden",
            }}
          >
            {statRows.map(([label, value], i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 13,
                  paddingHorizontal: 15,
                  ...(i < statRows.length - 1
                    ? { borderBottomWidth: 1, borderColor: "#1C1C1E" }
                    : {}),
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "500",
                    fontSize: 13.5,
                    color: "#8E8E93",
                  }}
                >
                  {label}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "700",
                    fontSize: 13.5,
                    color: "#fff",
                  }}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create post from activity"
            style={{
              marginTop: 22,
              height: 54,
              borderRadius: 27,
              backgroundColor: colors.foreground,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 14,
                color: colors.background,
              }}
            >
              CREATE POST FROM ACTIVITY
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * ActivityFeedCard — Enhanced story-style activity card.
 *
 * Extracted from the inline StoryCard in app/(tabs)/index.tsx.
 * Adds animated SVG sport figure, staggered entrance, press animation,
 * and sport-colored accent border.
 */

import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/lib/_core/theme";
import { Activity, formatDuration } from "@/lib/app-data";
import { getSportConfig, relativeTime } from "@/lib/sport-theme";
import { polylineToSvgPath } from "@/lib/map-utils";
import { ActivityAnimatedIcon } from "@/components/activity-animated-icon";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BUTTON_SPRING,
  staggeredEnter,
  cardPressIn,
  cardPressOut,
} from "@/lib/animations";

// ── Sport Gradient Colors ──

const RUN_GRADIENT: readonly [string, string] = ["#FF6B35", "#FF3D00"];
const RIDE_GRADIENT: readonly [string, string] = ["#0A84FF", "#0055D4"];
const WORKOUT_GRADIENT: readonly [string, string] = ["#34C759", "#1B8C3A"];

// ── Mini Route Map ──

function MiniRouteMap({
  polyline,
  sportColor,
}: {
  polyline: string;
  sportColor: string;
}) {
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
    <Svg
      viewBox="0 0 100 100"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
      }}
    >
      <Polyline
        points={coords}
        fill="none"
        stroke={sportColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
    </Svg>
  );
}

// ── Props ──

interface ActivityFeedCardProps {
  activity: Activity;
  index: number;
  onShare: () => void;
  onOpen: () => void;
}

// ── Main Component ──

export function ActivityFeedCard({
  activity,
  index,
  onShare,
  onOpen,
}: ActivityFeedCardProps) {
  const colors = useColors();
  const sport = getSportConfig(activity.type);
  const relTime = relativeTime(activity.startDate);
  const scale = useSharedValue(1);

  const gradientColors =
    activity.type === "run"
      ? RUN_GRADIENT
      : activity.type === "ride"
        ? RIDE_GRADIENT
        : WORKOUT_GRADIENT;

  const paceOrSpeed =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round(
          (activity.pace - Math.floor(activity.pace)) * 60,
        )
          .toString()
          .padStart(2, "0")}/km`
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : null;

  // Press animation
  const onPressIn = useCallback(() => {
    cardPressIn(scale);
  }, [scale]);

  const onPressOut = useCallback(() => {
    cardPressOut(scale);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleShare = useCallback(() => {
    if (typeof window === "undefined" || !("navigator" in window)) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onShare();
  }, [onShare]);

  return (
    <Animated.View
      entering={staggeredEnter(index)}
      style={[
        {
          marginBottom: 16,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colors.surface,
          // Sport-colored left border accent
          borderLeftWidth: 3,
          borderLeftColor: sport.color,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onOpen}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.96}
        accessibilityRole="button"
        accessibilityLabel={`${sport.label}: ${activity.title}, ${activity.distance.toFixed(1)} kilometers, ${relTime}`}
        accessibilityHint="Tap to view activity details"
      >
        <Animated.View style={animatedStyle}>
          {/* Hero section with gradient */}
          <View style={{ height: 150, position: "relative" }}>
            <LinearGradient
              colors={[...gradientColors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />

            {/* Route map overlay */}
            {activity.summaryPolyline && (
              <MiniRouteMap
                polyline={activity.summaryPolyline}
                sportColor="rgba(255,255,255,0.5)"
              />
            )}

            {/* Animated sport figure (replaces emoji watermark) */}
            <View
              style={{
                position: "absolute",
                right: -4,
                top: -4,
                opacity: 0.18,
              }}
              pointerEvents="none"
            >
              <ActivityAnimatedIcon type={activity.type} size={90} />
            </View>

            {/* Top row badges */}
            <View
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                right: 14,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  gap: 5,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#FFF",
                  }}
                />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                  }}
                >
                  {sport.label.toUpperCase()}
                </Text>
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  fontWeight: "600",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                {relTime}
              </Text>
            </View>

            {/* Big stat over gradient */}
            <View style={{ position: "absolute", bottom: 14, left: 14 }}>
              <Text
                style={{
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: "600",
                  opacity: 0.85,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {activity.title}
              </Text>
              <Text
                style={{
                  color: "#FFF",
                  fontSize: 34,
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                {activity.distance.toFixed(1)}{" "}
                <Text style={{ fontSize: 16, fontWeight: "700", opacity: 0.8 }}>
                  km
                </Text>
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ padding: 14 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <View style={{ alignItems: "flex-start" }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 10,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Duration
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  {formatDuration(activity.duration)}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 10,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {activity.pace != null ? "Pace" : "Speed"}
                </Text>
                <Text
                  style={[
                    Typography.body,
                    {
                      color: colors.foreground,
                      fontWeight: "700",
                      marginTop: 2,
                      fontFamily: "monospace",
                    },
                  ]}
                >
                  {paceOrSpeed ?? "--"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 10,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Elevation
                </Text>
                <Text
                  style={[
                    Typography.body,
                    {
                      color: colors.foreground,
                      fontWeight: "700",
                      marginTop: 2,
                      fontFamily: "monospace",
                    },
                  ]}
                >
                  {activity.elevation ? `${activity.elevation}m` : "--"}
                </Text>
              </View>
            </View>

            {/* Bottom row */}
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
              <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
                {activity.deviceName && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <IconSymbol name="gear" size={12} color={colors.muted} />
                    <Text
                      style={{ color: colors.muted, fontSize: 11 }}
                      numberOfLines={1}
                    >
                      {activity.deviceName}
                    </Text>
                  </View>
                )}
                {activity.sufferScore != null && activity.sufferScore > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <IconSymbol name="flame.fill" size={12} color="#FF6B35" />
                    <Text
                      style={{
                        color: "#FF6B35",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {activity.sufferScore}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  minHeight: 36,
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>
                  Share
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

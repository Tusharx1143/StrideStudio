/**
 * ActivityFeedCard — handoff-style story card with gradient background,
 * overlay gradient for legibility, mono stat lines, and PR badge.
 *
 * Matches the design prototype's "05 Home feed" card layout:
 * - 296px height, 20px border radius, 1px #1C1C1E border
 * - Gradient background from the 12-preset palette
 * - Overlay: transparent → 86% black at bottom
 * - Top row: weekday label + SHARE glass pill
 * - Bottom stats: type label, distance, pace, time (mono)
 * - PR badge pill (orange) for activities with achievements
 */
import { View, Text, TouchableOpacity } from "react-native";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import type { Activity } from "@/shared/types";
import { getSportConfig } from "@/lib/sport-theme";
import {
  BUTTON_SPRING,
  staggeredEnter,
  cardPressIn,
  cardPressOut,
} from "@/lib/animations";
import {
  FONT_UI,
  FONT_MONO,
} from "@/lib/_core/theme";
import {
  dist,
  distUnitShort,
  dur,
  pace,
  typeLabel as fmtTypeLabel,
  weekday,
  dateShort,
} from "@/lib/stickers/formatters";

// ── 12 background palettes for card variety ──────────────────

const CARD_BGS: string[][] = [
  ["#1B1014", "#7A2E12", "#FF8A3D"],
  ["#0B1220", "#1E3A5F", "#6FA8C7"],
  ["#12100D", "#4A3A24", "#A67C48"],
  ["#07070B", "#191B33", "#4C3E6B"],
  ["#0C1310", "#22392C", "#6E8F72"],
  ["#121214", "#2A2A2E", "#55555C"],
  ["#1A0A0A", "#8C1E12", "#FFC247"],
  ["#0A0F12", "#14403F", "#48A79A"],
  ["#0B0810", "#3A1B54", "#B06AA8"],
  ["#0E0E0F", "#333339", "#6D6D74"],
  ["#141009", "#5E4A22", "#D9B168"],
  ["#05080D", "#0F2A4A", "#2F7EA8"],
];

// ── Props ────────────────────────────────────────────────────

interface ActivityFeedCardProps {
  activity: Activity;
  index: number;
  onShare: () => void;
  onOpen: () => void;
}

export function ActivityFeedCard({
  activity,
  index,
  onShare,
  onOpen,
}: ActivityFeedCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const bg = CARD_BGS[index % CARD_BGS.length];

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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onShare();
  }, [onShare]);

  const dayLabel = `${weekday(activity).slice(0, 3)} ${dateShort(activity)}`;
  const typeLine = `${fmtTypeLabel(activity)} · ${activity.title || ""}`;
  const distLine = activity.distance
    ? `${dist(activity, "metric")} ${distUnitShort("metric")}`
    : "—";
  const paceLine = activity.pace
    ? `${pace(activity, "metric")}/km`
    : activity.speed
      ? `${activity.speed.toFixed(1)} km/h`
      : "—";
  const timeLine = dur(activity.duration);
  const hasPR = (activity.sufferScore ?? 0) > 0;

  return (
    <Animated.View
      entering={staggeredEnter(index)}
      style={[
        {
          marginBottom: 14,
          height: 296,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onOpen}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.96}
        accessibilityRole="button"
        accessibilityLabel={`${typeLine}, ${distLine}`}
        accessibilityHint="Tap to view activity details"
        style={{ flex: 1 }}
      >
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {/* Gradient background */}
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: bg[1],
              opacity: 0.5,
            }}
          />

          {/* Overlay gradient for text legibility */}
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />

          {/* Top row: day label + SHARE button */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: 16,
              paddingBottom: 0,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "900",
                fontSize: 24,
                letterSpacing: -0.02 * 24,
                color: "#fff",
              }}
            >
              {dayLabel}
            </Text>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              accessibilityRole="button"
              accessibilityLabel="Share this activity"
              style={{
                backgroundColor: "rgba(255,255,255,0.14)",
                borderRadius: 16,
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "800",
                  fontSize: 11,
                  letterSpacing: 0.06 * 11,
                  color: "#fff",
                }}
              >
                SHARE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom stats */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              gap: 4,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 11,
                letterSpacing: 0.14 * 11,
                color: "rgba(255,255,255,0.62)",
                textTransform: "uppercase",
              }}
            >
              {typeLine}
            </Text>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "700",
                fontSize: 15,
                lineHeight: 20.25,
                color: "#fff",
              }}
            >
              {distLine}
            </Text>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "500",
                fontSize: 12,
                lineHeight: 16.2,
                color: "rgba(255,255,255,0.66)",
              }}
            >
              {paceLine}
            </Text>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "500",
                fontSize: 12,
                lineHeight: 16.2,
                color: "rgba(255,255,255,0.66)",
              }}
            >
              {timeLine}
            </Text>
          </View>

          {/* PR badge */}
          {hasPR && (
            <View
              style={{
                position: "absolute",
                top: 60,
                right: 16,
                backgroundColor: "#FF6B35",
                borderRadius: 10,
                paddingVertical: 5,
                paddingHorizontal: 9,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "800",
                  fontSize: 9,
                  letterSpacing: 0.1 * 9,
                  color: "#0B0B0C",
                }}
              >
                {activity.sufferScore} PR
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

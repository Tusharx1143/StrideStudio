/**
 * Sticker library — design-handoff style grid.
 *
 * 54 stickers across 8 themes, live-previews with the selected activity.
 * Theme filter pills, 2-column grid, live sticker node previews.
 */
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import {
  STICKERS,
  STICKER_THEMES,
  getPalette,
  typeLabel,
  dist,
  distUnitShort,
} from "@/lib/stickers";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import { PALETTES } from "@/lib/stickers/palettes";
import type { WeekTotals } from "@/lib/stickers/types";

export default function TemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, getSelectedActivity } = useApp();
  const [theme, setTheme] = useState("all");

  const activity = getSelectedActivity();
  const palette = getPalette("stride");
  const units = "metric" as const;

  // Simple week totals
  const totals: WeekTotals = useMemo(() => {
    const totalKm = activities.reduce((s, a) => s + a.distance, 0);
    return {
      totalKm,
      count: activities.length,
      streak: 6,
      monthKm: totalKm,
      monthCount: activities.length,
      days: [],
    };
  }, [activities]);

  // Filter stickers by theme
  const filtered = useMemo(() => {
    if (theme === "all") return STICKERS;
    return STICKERS.filter((s) => s.theme === theme);
  }, [theme]);

  const activityLabel = activity.distance
    ? `${dist(activity, units)} ${distUnitShort(units)} ${activity.type}`
    : activity.title || "No activity";

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 25,
              letterSpacing: -0.03 * 25,
              color: colors.foreground,
            }}
          >
            Sticker library
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 11.5,
              color: "#8E8E93",
              marginTop: 4,
            }}
          >
            {STICKERS.length} designs · live data from {activityLabel}
          </Text>
        </View>

        {/* Theme filter pills */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 6,
          }}
        >
          {STICKER_THEMES.map((t) => {
            const on = theme === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTheme(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${t.label}`}
                accessibilityState={{ selected: on }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: on ? colors.primary : "#1C1C1E",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 9.5,
                    letterSpacing: 0.06 * 9.5,
                    color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2-column grid */}
        <ScrollView
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 92,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {filtered.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => router.push("/editor")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Sticker: ${s.name}`}
              style={{
                width: "47%",
                height: 140,
                borderRadius: 14,
                backgroundColor: "#0E0E10",
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
              }}
            >
              {/* Live sticker preview */}
              <View style={{ transform: [{ scale: 0.55 }], pointerEvents: "none" }}>
                {s.render({
                  a: activity,
                  t: totals,
                  u: units,
                  c: palette.colors,
                })}
              </View>

              {/* Sticker name */}
              <Text
                style={{
                  position: "absolute",
                  left: 7,
                  bottom: 6,
                  fontFamily: FONT_MONO,
                  fontWeight: "600",
                  fontSize: 8.5,
                  letterSpacing: 0.08 * 8.5,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {s.name}
              </Text>

              {/* Theme badge */}
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  paddingVertical: 3,
                  paddingHorizontal: 6,
                  borderRadius: 6,
                  backgroundColor: "rgba(255,107,53,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(255,107,53,0.4)",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 7,
                    letterSpacing: 0.1 * 7,
                    color: colors.primary,
                    textTransform: "uppercase",
                  }}
                >
                  {s.theme}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && (
            <View
              style={{
                width: "100%",
                alignItems: "center",
                paddingVertical: 60,
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.muted,
                }}
              >
                No stickers in this theme
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

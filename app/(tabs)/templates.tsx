/**
 * Sticker library — design-handoff style grid.
 *
 * 54 stickers across 8 themes, live-previews with the selected activity.
 * Theme filter pills (horizontal scroll), 2-column grid, live sticker previews.
 *
 * Token alignment:
 *   bg.base: #0A0A0B, bg.card: #0E0E10, bg.surface: #16161A
 *   border.hairline: #1C1C1E, brand.orange: #FF6B35
 *   text.primary: #FFFFFF, text.secondary: rgba(255,255,255,.55)
 *   text.muted: #8E8E93
 */
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
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
import { FONT_UI, FONT_MONO, Radii, Spacing } from "@/lib/_core/theme";
import type { WeekTotals } from "@/lib/stickers/types";

export default function TemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, getSelectedActivity } = useApp();
  const [theme, setTheme] = useState("all");
  const { width: screenWidth } = useWindowDimensions();

  const activity = getSelectedActivity();
  const palette = getPalette("stride");
  const units = "metric" as const;

  // Simple week totals for sticker rendering
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

  // Grid math — 2 columns with 10px gap, 16px screen padding
  const GAP = 10;
  const H_PAD = Spacing.lg; // 16
  const cardWidth = (screenWidth - H_PAD * 2 - GAP) / 2;
  const cardHeight = cardWidth * 1.18; // portrait-ish card

  const activityLabel = activity.distance
    ? `${dist(activity, units)} ${distUnitShort(units)} ${typeLabel(activity)}`
    : activity.title || "No activity";

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ── Header ────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: H_PAD,
            paddingTop: 10,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 25,
              letterSpacing: -0.03 * 25,
              lineHeight: 25,
              color: colors.foreground,
            }}
            accessibilityRole="header"
          >
            Sticker library
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 11.5,
              lineHeight: 15,
              color: "#8E8E93",
              marginTop: 4,
            }}
          >
            {STICKERS.length} designs · live preview with{" "}
            <Text style={{ color: colors.primary }}>{activityLabel}</Text>
          </Text>
        </View>

        {/* ── Theme filter pills ────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: H_PAD,
            paddingBottom: 12,
            gap: 7,
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
                  paddingVertical: 7,
                  paddingHorizontal: 13,
                  borderRadius: 16,
                  backgroundColor: on ? colors.primary : "#16161A",
                  borderWidth: 1,
                  borderColor: on
                    ? "rgba(255,107,53,0.2)"
                    : colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 10,
                    letterSpacing: 0.24 * 10,
                    textTransform: "uppercase",
                    color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 2-column grid ─────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: H_PAD,
            paddingBottom: 92, // clears bottom tab bar
            flexDirection: "row",
            flexWrap: "wrap",
            gap: GAP,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => router.push("/editor")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Sticker: ${s.name}`}
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: Radii.md, // 16
                backgroundColor: "#0E0E10",
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Live sticker preview — scaled to fit card */}
              <View
                style={{
                  transform: [{ scale: Math.min(cardWidth / s.w, cardHeight / s.w) * 0.78 }],
                  pointerEvents: "none",
                }}
              >
                {s.render({
                  a: activity,
                  t: totals,
                  u: units,
                  c: palette.colors,
                })}
              </View>

              {/* Sticker name — bottom-left */}
              <View
                style={{
                  position: "absolute",
                  left: 8,
                  bottom: 7,
                  right: 64,
                  flexDirection: "row",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "600",
                    fontSize: 9,
                    letterSpacing: 0.08 * 9,
                    color: "rgba(255,255,255,0.55)",
                  }}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
              </View>

              {/* Theme badge — top-right */}
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  paddingVertical: 3.5,
                  paddingHorizontal: 7,
                  borderRadius: 7,
                  backgroundColor: "rgba(255,107,53,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(255,107,53,0.35)",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 7.5,
                    letterSpacing: 0.1 * 7.5,
                    color: colors.primary,
                    textTransform: "uppercase",
                  }}
                >
                  {s.theme}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* ── Empty state ──────────────────────────────── */}
          {filtered.length === 0 && (
            <View
              style={{
                width: "100%",
                alignItems: "center",
                paddingVertical: 60,
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontWeight: "600",
                  fontSize: 32,
                  color: "rgba(255,255,255,0.08)",
                }}
              >
                —
              </Text>
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                No stickers in this theme
              </Text>
              <TouchableOpacity
                onPress={() => setTheme("all")}
                accessibilityRole="button"
                accessibilityLabel="Show all stickers"
                style={{
                  marginTop: 4,
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  borderRadius: Radii.md,
                  backgroundColor: "#16161A",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 11,
                    letterSpacing: 0.08 * 11,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  Show all themes
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * Dynamic Templates — templates that adapt their layout, content, and styling
 * based on the actual activity data they receive.
 *
 * Every render function accepts an optional 3rd `colors` argument so the
 * caller can override the colour scheme (e.g. for photo‑overlay use).
 *
 * Architecture: shared helpers live in ./templates/shared/ and individual
 * template files can be extracted into ./templates/templates/ incrementally.
 */

import React from "react";
import { Text, View } from "react-native";
import { Activity, formatDuration } from "../../app-data";
import { alpha, BRIGHT_WHITE, type TemplateColors } from "../../color-presets";
import { analyseFields, heroField, type AvailableField } from "../shared/analyse-fields";
import { ts, ff, typeEmoji, typeLabel } from "../shared/styling";
import { fmtDateShort, fmtDateFull, fmtTime12, fmtWeekday, paceStr, timeStr } from "../shared/helpers";

// ── Types ──

export interface WeekTotals {
  runKm: number;
  otherKm: number;
  totalKm: number;
  totalMinutes: number;
  items: { day: string; km: number; type: string }[];
}

export interface TemplateDef {
  id: string;
  name: string;
  tab: "activity" | "totals";
  fullWidth?: boolean;
  badge?: "New" | "Dynamic" | "Auto" | "Customize";
  lightCard?: boolean;
  description: string;
  render: (a: Activity, totals: WeekTotals, colors?: TemplateColors) => React.ReactNode;
}

/** @deprecated Use TemplateDef instead */
export type { TemplateDef as DynamicTemplateDef };

// ── Inline style tokens (used by template renders) ──
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

// ── Dynamic template definitions ──

// ─── TOTALS ───

export const TOTALS: TemplateDef[] = [
  {
    id: "dynamic-week",
    name: "Dynamic Week",
    tab: "totals",
    badge: "Auto",
    description: "Week totals that adapt to show what matters this week",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const showRun = t.runKm > 0;
      const showOther = t.otherKm > 0;
      const ratio = showRun && showOther ? (t.runKm / (t.runKm + t.otherKm) * 100) : showRun ? 100 : 0;

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={[{ color: c.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
            {t.totalKm.toFixed(1)} km
          </Text>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 6 }, ts(c.shadowColor, c.fontFamily)]}>
            THIS WEEK · {formatDuration(t.totalMinutes).toUpperCase()}
          </Text>

          {showRun && showOther && (
            <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
              <View style={{ width: `${ratio}%`, backgroundColor: c.accentRun, height: "100%" }} />
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            {showRun && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accentRun }} />
                <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>
                  RUN {t.runKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {showOther && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accentRide }} />
                <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>
                  RIDE {t.otherKm.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>

          {t.items.length > 0 && (
            <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
              {t.items.slice(0, 7).map((item: { day: string; km: number; type: string }, i: number) => (
                <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.type === "run" ? c.accentRun : c.accentRide, opacity: 0.3 + (i / Math.min(t.items.length, 7)) * 0.7 }} />
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── TOTALS: Activity Type Breakdown ───,

  {
    id: "type-breakdown",
    name: "Type Breakdown",
    tab: "totals",
    badge: "Auto",
    description: "Breaks down your week by activity type",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const runCount = t.items.filter((i) => i.type === "run").length;
      const rideCount = t.items.filter((i) => i.type !== "run").length;

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={[{ color: c.textPrimary, fontSize: 8, fontWeight: "700", letterSpacing: 1, marginBottom: 6 }, ts(c.shadowColor, c.fontFamily)]}>
            THIS WEEK
          </Text>

          {runCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 }}>
              <Text style={{ fontSize: 10 }}>🏃</Text>
              <View style={{ flex: 1 }}>
                <View style={{ height: 6, backgroundColor: c.border, borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ width: `${(t.runKm / t.totalKm) * 100}%`, backgroundColor: c.accentRun, height: "100%" }} />
                </View>
              </View>
              <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", fontFamily: c.fontFamily ?? "Courier", minWidth: 50, textAlign: "right" }, ts(c.shadowColor, c.fontFamily)]}>
                {t.runKm.toFixed(1)} km
              </Text>
              <Text style={[{ color: c.textMuted, fontSize: 7 }]}>{runCount}x</Text>
            </View>
          )}

          {rideCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 }}>
              <Text style={{ fontSize: 10 }}>🚴</Text>
              <View style={{ flex: 1 }}>
                <View style={{ height: 6, backgroundColor: c.border, borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ width: `${(t.otherKm / t.totalKm) * 100}%`, backgroundColor: c.accentRide, height: "100%" }} />
                </View>
              </View>
              <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", fontFamily: c.fontFamily ?? "Courier", minWidth: 50, textAlign: "right" }, ts(c.shadowColor, c.fontFamily)]}>
                {t.otherKm.toFixed(1)} km
              </Text>
              <Text style={[{ color: c.textMuted, fontSize: 7 }]}>{rideCount}x</Text>
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: c.border, marginTop: 4, paddingTop: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[{ color: c.textPrimary, fontSize: 10, fontWeight: "800" }, ts(c.shadowColor, c.fontFamily)]}>TOTAL</Text>
              <Text style={[{ color: c.textPrimary, fontSize: 10, fontWeight: "800" }, ts(c.shadowColor, c.fontFamily)]}>{t.totalKm.toFixed(1)} km</Text>
            </View>
          </View>
        </View>
      );
    },
  },

  // ─── FANCY: Gradient Glow ───,

  {
    id: "mini-activity",
    name: "Mini Activity",
    tab: "totals",
    badge: "New",
    description: "Compact weekly summary with activity pills",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const runKm = t.runKm;
      const otherKm = t.otherKm;

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 8 }}>
          <Text style={[{ color: c.textPrimary, fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 }, ts(c.shadowColor, c.fontFamily)]}>
            {t.totalKm.toFixed(1)}
          </Text>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 6 }, ts(c.shadowColor, c.fontFamily)]}>
            KM THIS WEEK
          </Text>
          <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
            {runKm > 0 && (
              <View style={{ backgroundColor: alpha(c.accentRun, "20"), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontSize: 8 }}>🏃</Text>
                <Text style={[{ color: c.accentRun, fontSize: 8, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>
                  {runKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {otherKm > 0 && (
              <View style={{ backgroundColor: alpha(c.accentRide, "20"), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontSize: 8 }}>🚴</Text>
                <Text style={[{ color: c.accentRide, fontSize: 8, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>
                  {otherKm.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
          {t.items.length > 0 && (
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "500", marginTop: 4 }, ts(c.shadowColor, c.fontFamily)]}>
              {t.items.length} activities
            </Text>
          )}
        </View>
      );
    },
  },

  // ─── BIG STAT: Distance Focus ───,

  {
    id: "week-big-total",
    name: "Week Big Total",
    tab: "totals", badge: "New",
    description: "Massive week total no distractions",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2 }, ts(c.shadowColor, c.fontFamily)]}>THIS WEEK</Text>
          <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>{t.totalKm.toFixed(1)}</Text>
          <Text style={[{ color: c.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>KILOMETERS</Text>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", marginTop: 4 }, ts(c.shadowColor, c.fontFamily)]}>{formatDuration(t.totalMinutes)}</Text>
        </View>
      );
    },
  },

  {
    id: "week-breakdown-pills",
    name: "Week Breakdown",
    tab: "totals", badge: "New",
    description: "Individual activities as coloured pills",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={[{ color: c.textPrimary, fontSize: 14, fontWeight: "900", marginBottom: 6 }, ts(c.shadowColor, c.fontFamily)]}>{t.totalKm.toFixed(1)} km</Text>
          <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
            {t.items.slice(0, 5).map((item, i) => (
              <View key={i} style={{ backgroundColor: alpha(item.type === "run" ? c.accentRun : c.accentRide, "20"), borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={[{ color: item.type === "run" ? c.accentRun : c.accentRide, fontSize: 7, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>
                  {item.km.toFixed(1)} km {item.type === "run" ? "🏃" : "🚴"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  // ─── MORE ACTIVITY TEMPLATES ───,
];

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
  walkKm: number;
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

// ─── IDEAS ───

export const IDEAS: TemplateDef[] = [
  {
    id: "blue-bar-quote",
    name: "Blue Bar Quote",
    tab: "activity",
    fullWidth: true,
    badge: "New",
    description: "Inspired by the blue accent bar design — clean quote with highlight",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const top = fields.slice(0, 3);
      const quotes = ["PUSH HARDER", "NO SHORTCUTS", "KEEP GOING", "STAY STRONG", "ONE MORE"];
      const quote = quotes[Math.floor(Math.abs(a.distance) % quotes.length)];

      return (
        <View style={{ flex: 1, flexDirection: "row", padding: 0 }}>
          {/* Blue accent bar */}
          <View style={{ width: 6, backgroundColor: c.accent, borderRadius: 3, margin: 6 }} />
          <View style={{ flex: 1, paddingVertical: 8, paddingRight: 8, justifyContent: "center" }}>
            {/* Quote */}
            <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
              "{quote}"
            </Text>
            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              {top.map((f, i) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
                  <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: i === 0 ? 18 : 11, fontWeight: "900", letterSpacing: -0.5 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.value.split(" ")[0]}
                  </Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.value.includes(" ") ? f.value.split(" ").slice(1).join(" ") : f.label.slice(0, 3)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[{ color: c.textMuted, fontSize: 5, fontWeight: "500", letterSpacing: 1, marginTop: 4 }, ts(c.shadowColor, c.fontFamily)]}>
              {a.title?.toUpperCase() ?? typeLabel(a.type)} · {fmtDateShort(a.startDate)}
            </Text>
          </View>
        </View>
      );
    },
  },

  // ─── .IDEA: Stats Strip (horizontal stat bars) ───,

  {
    id: "stats-strip",
    name: "Stats Strip",
    tab: "activity",
    badge: "New",
    description: "Horizontal stat bars inspired by the wide card layout",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 8, gap: 4 }}>
          {fields.slice(0, 4).map((f) => {
            // Compute a bar width from the stat's salience
            const barWidth = Math.max(30, f.salience * 80);
            return (
              <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1, width: 22 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.label.slice(0, 4)}
                </Text>
                <View style={{ flex: 1, height: 14, backgroundColor: c.border, borderRadius: 7, overflow: "hidden" }}>
                  <View style={{ width: `${barWidth}%`, height: "100%", backgroundColor: c.accent, borderRadius: 7, opacity: 0.8 }} />
                </View>
                <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", minWidth: 40, textAlign: "right" }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.value}
                </Text>
              </View>
            );
          })}
        </View>
      );
    },
  },

  // ─── .IDEA: Minimal Dot Concentric ───,

  {
    id: "minimal-dot",
    name: "Minimal Dot",
    tab: "activity",
    badge: "New",
    description: "Single hero stat in a minimalist dot/circle layout",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 3);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          {/* Outer decorative dot */}
          <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: alpha(c.accent, "30"), alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
            {/* Inner dot */}
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: alpha(c.accent, "10"), alignItems: "center", justifyContent: "center" }}>
              <Text style={[{ color: c.accent, fontSize: 16, fontWeight: "900" }, ff(c.fontFamily)]}>
                {hero ? hero.value.split(" ")[0] : "--"}
              </Text>
            </View>
          </View>
          {hero && (
            <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
              {hero.label}
            </Text>
          )}
          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.accent }} />
                  <Text style={[{ color: c.textSecondary, fontSize: 7, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── .IDEA: Data Dash (dense stats) ───,

  {
    id: "data-dash",
    name: "Data Dash",
    tab: "activity",
    fullWidth: true,
    badge: "New",
    description: "Dense data display with decorative corner accents",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const rows = [];
      for (let i = 0; i < fields.length; i += 2) {
        rows.push(fields.slice(i, i + 2));
      }

      return (
        <View style={{ flex: 1, padding: 10, justifyContent: "center" }}>
          {/* Corner decorations */}
          <View style={{ position: "absolute", top: 6, left: 6, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: alpha(c.accent, "40"), borderRadius: 2 }} />
          <View style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderTopWidth: 2, borderRightWidth: 2, borderColor: alpha(c.accent, "40"), borderRadius: 2 }} />
          <View style={{ position: "absolute", bottom: 6, left: 6, width: 16, height: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: alpha(c.accent, "40"), borderRadius: 2 }} />
          <View style={{ position: "absolute", bottom: 6, right: 6, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: alpha(c.accent, "40"), borderRadius: 2 }} />

          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginBottom: 6, textAlign: "center" }, ts(c.shadowColor, c.fontFamily)]}>
            {a.type.toUpperCase()} · {fmtDateShort(a.startDate)}
          </Text>

          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 0, marginBottom: 2 }}>
              {row.map((f) => (
                <View key={f.key} style={{ flex: 1, alignItems: "center", paddingVertical: 4, borderRightWidth: 1, borderRightColor: alpha(c.border, "50") }}>
                  <Text style={[{ color: c.textPrimary, fontSize: ri === 0 ? 16 : 13, fontWeight: "900", letterSpacing: -0.3 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.value.split(" ")[0]}
                  </Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── .IDEA: Mini Activity Card ───,
];

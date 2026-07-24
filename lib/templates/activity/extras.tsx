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

// ─── EXTRAS ───

export const EXTRAS: TemplateDef[] = [
  {
    id: "split-diagonal",
    name: "Split Diagonal",
    tab: "activity", description: "Two stats split diagonally with accent background",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 2);
      return (
        <View style={{ flex: 1, flexDirection: "row", padding: 0 }}>
          {fields.map((f, i) => (
            <View key={f.key} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: i === 0 ? alpha(c.accent, "12") : "transparent", padding: 8 }}>
              <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
            </View>
          ))}
        </View>
      );
    },
  },

  {
    id: "badge-corner",
    name: "Badge Corner",
    tab: "activity", description: "Stat badge in the corner with subtle background",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);
      return (
        <View style={{ flex: 1, padding: 8 }}>
          <View style={{ position: "absolute", top: 0, right: 0, backgroundColor: alpha(c.accent, "15"), borderBottomLeftRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
            {hero && <Text style={[{ color: c.accent, fontSize: 14, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{hero.value.split(" ")[0]}</Text>}
            {hero && <Text style={[{ color: c.textMuted, fontSize: 5, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{hero.label}</Text>}
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 4 }, ts(c.shadowColor, c.fontFamily)]}>{typeLabel(a.type)}</Text>
            {rest.map((f) => (
              <View key={f.key} style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                <Text style={[{ color: c.textPrimary, fontSize: 11, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  {
    id: "hero-bottom",
    name: "Hero Bottom",
    tab: "activity", fullWidth: true, description: "Big stat at the bottom like a hero bar",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);
      return (
        <View style={{ flex: 1, justifyContent: "space-between", padding: 0 }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 8 }}>
            {rest.map((f) => (
              <View key={f.key} style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                <Text style={[{ color: c.textPrimary, fontSize: 10, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
              </View>
            ))}
          </View>
          {hero && (
            <View style={{ backgroundColor: alpha(c.accent, "15"), paddingVertical: 8, alignItems: "center" }}>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>{hero.label}</Text>
              <Text style={[{ color: c.accent, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }, ts(c.shadowColor, c.fontFamily)]}>{hero.value}</Text>
            </View>
          )}
        </View>
      );
    },
  },

  {
    id: "stripes",
    name: "Stripes",
    tab: "activity", fullWidth: true, description: "Alternating striped rows of stats",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 5);
      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 0 }}>
          {fields.map((f, i) => (
            <View key={f.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, backgroundColor: i % 2 === 0 ? alpha(c.border, "20") : "transparent" }}>
              <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
              <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 16 : 12, fontWeight: i === 0 ? "900" : "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
            </View>
          ))}
        </View>
      );
    },
  },

  {
    id: "pill-stats",
    name: "Pill Stats",
    tab: "activity", badge: "New", description: "Each stat in its own pill/chip container",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 5);
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 6 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            {fields.map((f, i) => (
              <View key={f.key} style={{ backgroundColor: i === 0 ? alpha(c.accent, "15") : alpha(c.border, "30"), borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, alignItems: "center" }}>
                <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: i === 0 ? 14 : 10, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
                <Text style={[{ color: c.textMuted, fontSize: 5, fontWeight: "600", marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  {
    id: "watermark-bg",
    name: "Watermark BG",
    tab: "activity", description: "Giant watermark number in background, clean stats",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 4);
      const hero = fields[0];
      return (
        <View style={{ flex: 1, padding: 8, justifyContent: "center" }}>
          {hero && <Text style={[{ color: alpha(c.textPrimary, "6"), fontSize: 64, fontWeight: "900", position: "absolute", right: 0, top: -10 }, ff(c.fontFamily)]}>{hero.value.split(" ")[0]}</Text>}
          {fields.map((f, i) => (
            <View key={f.key} style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1, width: 24 }, ts(c.shadowColor, c.fontFamily)]}>{f.label.slice(0, 4)}</Text>
              <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 18 : 12, fontWeight: i === 0 ? "900" : "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
            </View>
          ))}
        </View>
      );
    },
  },
];

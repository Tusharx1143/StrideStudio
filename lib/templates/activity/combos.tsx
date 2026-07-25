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
import type { WeekTotals, TemplateDef } from "../shared/types";

/** @deprecated Use TemplateDef from shared/types instead */
export type DynamicTemplateDef = TemplateDef;
import { analyseFields, heroField, type AvailableField } from "../shared/analyse-fields";
import { ts, ff, typeEmoji, typeLabel } from "../shared/styling";
import { fmtDateShort, fmtDateFull, fmtTime12, fmtWeekday, paceStr, timeStr } from "../shared/helpers";



// ── Inline style tokens (used by template renders) ──
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

// ── Dynamic template definitions ──

// ─── COMBOS ───

export const COMBOS: TemplateDef[] = [
  {
    id: "combo-dist-pace",
    name: "Distance + Pace",
    tab: "activity", badge: "New",
    description: "Distance and pace side by side",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const p = a.pace != null ? `${Math.floor(a.pace)}:${String(Math.round((a.pace - Math.floor(a.pace)) * 60)).padStart(2, "0")}` : "--:--";
      return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 8 }}>
          <View style={{ alignItems: "center", flex: 1, borderRightWidth: 1, borderRightColor: alpha(c.border, "50") }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>DISTANCE</Text>
            <Text style={[{ color: c.textPrimary, fontSize: 22, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{a.distance.toFixed(2)}</Text>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>km</Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>PACE</Text>
            <Text style={[{ color: c.accent, fontSize: 22, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{p}</Text>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>/km</Text>
          </View>
        </View>
      );
    },
  },

  {
    id: "combo-dist-time",
    name: "Distance + Time",
    tab: "activity", badge: "New",
    description: "Distance and duration paired cleanly",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 8 }}>
          <View style={{ alignItems: "center", flex: 1, borderRightWidth: 1, borderRightColor: alpha(c.border, "50") }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>DISTANCE</Text>
            <Text style={[{ color: c.textPrimary, fontSize: 22, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{a.distance.toFixed(2)}</Text>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>km</Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>TIME</Text>
            <Text style={[{ color: c.accent, fontSize: 22, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{formatDuration(a.duration).toUpperCase()}</Text>
          </View>
        </View>
      );
    },
  },

  {
    id: "combo-elev-hr",
    name: "Elevation + HR",
    tab: "activity", badge: "New",
    description: "Elevation meets heart rate",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const el = fields.find((f) => f.key === "elevation");
      const hr = fields.find((f) => f.key === "heartRate");
      if (!el && !hr) {
        const top2 = fields.slice(0, 2);
        return (
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 8 }}>
            {top2.map((f) => (
              <View key={f.key} style={{ alignItems: "center", flex: 1 }}>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                <Text style={[{ color: c.textPrimary, fontSize: 20, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
              </View>
            ))}
          </View>
        );
      }
      return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 8 }}>
          {el && (
            <View style={{ alignItems: "center", flex: 1, borderRightWidth: 1, borderRightColor: alpha(c.border, "50") }}>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>ELEVATION</Text>
              <Text style={[{ color: c.accentElev, fontSize: 20, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{a.elevation} m</Text>
            </View>
          )}
          {hr && (
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>AVG HR</Text>
              <Text style={[{ color: c.accent, fontSize: 20, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{a.heartRate} bpm</Text>
            </View>
          )}
        </View>
      );
    },
  },

  // ─── LAYOUT: Left / Right / Grid ───,
];

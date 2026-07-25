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

// ─── LAYOUTS ───

export const LAYOUTS: TemplateDef[] = [
  {
    id: "layout-left",
    name: "Left Aligned",
    tab: "activity", badge: "New",
    description: "Left aligned stats with labels",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 5);
      return (
        <View style={{ flex: 1, justifyContent: "center", paddingLeft: 12 }}>
          <Text style={[{ color: c.accent, fontSize: 7, fontWeight: "800", letterSpacing: 1, marginBottom: 4 }, ts(c.shadowColor, c.fontFamily)]}>{typeLabel(a.type)}</Text>
          {fields.map((f, i) => (
            <View key={f.key} style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
              <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 18 : 12, fontWeight: i === 0 ? "900" : "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
              <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.includes(" ") ? f.value.split(" ").slice(1).join(" ") : ""} · {f.label}</Text>
            </View>
          ))}
        </View>
      );
    },
  },

  {
    id: "layout-right",
    name: "Right Aligned",
    tab: "activity", badge: "New",
    description: "Right aligned stats for variety",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 5);
      return (
        <View style={{ flex: 1, justifyContent: "center", paddingRight: 12 }}>
          <Text style={[{ color: c.accent, fontSize: 7, fontWeight: "800", letterSpacing: 1, marginBottom: 4, textAlign: "right" }, ts(c.shadowColor, c.fontFamily)]}>{typeLabel(a.type)}</Text>
          {fields.map((f, i) => (
            <View key={f.key} style={{ flexDirection: "row", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
              <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label} · {f.value.includes(" ") ? f.value.split(" ").slice(1).join(" ") : ""}</Text>
              <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 18 : 12, fontWeight: i === 0 ? "900" : "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
            </View>
          ))}
        </View>
      );
    },
  },

  {
    id: "grid-2x2",
    name: "2x2 Grid",
    tab: "activity", fullWidth: true, badge: "New",
    description: "Four stats in a balanced 2x2 grid",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 4);
      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 6 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {fields.map((f, i) => (
              <View key={f.key} style={{ width: "50%", padding: 6, alignItems: "center", borderRightWidth: i % 2 === 0 ? 1 : 0, borderRightColor: alpha(c.border, "50"), borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: alpha(c.border, "50") }}>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: 18, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.includes(" ") ? f.value.split(" ").slice(1).join(" ") : ""}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  {
    id: "mini-stats-row",
    name: "Mini Stats Row",
    tab: "activity", badge: "New",
    description: "Compact row of all your key stats",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 6);
      return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 4, gap: 2 }}>
          {fields.map((f) => (
            <View key={f.key} style={{ flex: 1, alignItems: "center", paddingHorizontal: 2, borderRightWidth: 1, borderRightColor: alpha(c.border, "30") }}>
              <Text style={[{ color: c.textPrimary, fontSize: 10, fontWeight: "900" }, ts(c.shadowColor, c.fontFamily)]} numberOfLines={1} adjustsFontSizeToFit>{f.value.split(" ")[0]}</Text>
              <Text style={[{ color: c.textMuted, fontSize: 5, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label.slice(0, 4)}</Text>
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── STYLE: Aesthetic variants ───,
];

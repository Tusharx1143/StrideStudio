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

// ─── STYLE ───

export const STYLE: TemplateDef[] = [
  {
    id: "thin-line",
    name: "Thin Line",
    tab: "activity", badge: "New",
    description: "Elegant serif with fine separator lines",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 4);
      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={[serif, { color: c.accent, fontSize: 7, fontWeight: "400", fontStyle: "italic", letterSpacing: 1, marginBottom: 4 }, ts(c.shadowColor, c.fontFamily)]}>{typeLabel(a.type)}</Text>
          {fields.map((f, i) => (
            <View key={f.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderBottomWidth: 0.5, borderBottomColor: alpha(c.border, "30"), paddingVertical: 2 }}>
              <Text style={[serif, { color: c.textPrimary, fontSize: i === 0 ? 16 : 11, fontWeight: "400", fontStyle: "italic" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
              <Text style={[serif, { color: c.textMuted, fontSize: 7, fontWeight: "400" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
            </View>
          ))}
        </View>
      );
    },
  },

  {
    id: "bold-block",
    name: "Bold Block",
    tab: "activity", fullWidth: true, badge: "New",
    description: "Bold colour blocks with primary stat highlighted",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 3);
      return (
        <View style={{ flex: 1, padding: 0 }}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            {fields.map((f, i) => (
              <View key={f.key} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: i === 0 ? alpha(c.accent, "15") : "transparent", borderRightWidth: i < fields.length - 1 ? 1 : 0, borderRightColor: alpha(c.border, "30") }}>
                <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: i === 0 ? 24 : 16, fontWeight: "900", letterSpacing: -0.5 }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  {
    id: "magazine",
    name: "Magazine",
    tab: "activity", fullWidth: true, badge: "New",
    description: "Editorial layout with date and headline",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);
      return (
        <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
          <Text style={[{ color: c.accent, fontSize: 7, fontWeight: "800", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>{fmtDateFull(a.startDate)?.toUpperCase()}</Text>
          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }, ts(c.shadowColor, c.fontFamily)]}>{typeLabel(a.type)} · {a.title?.toUpperCase() ?? "ACTIVITY"}</Text>
          {hero && <Text style={[{ color: c.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginBottom: 8 }, ts(c.shadowColor, c.fontFamily)]}>{hero.value}</Text>}
          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value.split(" ")[0]}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label.slice(0, 3)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  {
    id: "retro-led",
    name: "Retro LED",
    tab: "activity", badge: "New",
    description: "Retro terminal/display style",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a).slice(0, 3);
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <View style={{ backgroundColor: alpha(c.border, "40"), borderRadius: 4, padding: 6, width: "100%" }}>
            {fields.map((f, i) => (
              <View key={f.key} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottomWidth: i < fields.length - 1 ? 1 : 0, borderBottomColor: alpha(c.border, "30") }}>
                <Text style={[mono, { color: c.accent, fontSize: i === 0 ? 14 : 9, fontWeight: "700", letterSpacing: 2 }, ts(c.shadowColor, c.fontFamily)]}>{f.value.toUpperCase()}</Text>
                <Text style={[mono, { color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
              </View>
            ))}
            <Text style={[mono, { color: alpha(c.textMuted, "60"), fontSize: 5, letterSpacing: 1, marginTop: 4 }, ts(c.shadowColor, c.fontFamily)]}>{fmtDateShort(a.startDate)} · SYS:ONLINE</Text>
          </View>
        </View>
      );
    },
  },

  // ─── TOTALS: More week/month ───,
];

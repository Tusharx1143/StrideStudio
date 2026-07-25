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
import { analyseFields, heroField, type AvailableField } from "../shared/analyse-fields";
import { ts, ff, typeEmoji, typeLabel } from "../shared/styling";
import { fmtDateShort, fmtDateFull, fmtTime12, fmtWeekday, paceStr, timeStr } from "../shared/helpers";

/** @deprecated Use TemplateDef from shared/types instead */
export type DynamicTemplateDef = TemplateDef;

// ── Inline style tokens (used by template renders) ──
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

// ── Dynamic template definitions ──

// ─── BIG STATS ───

export const BIG_STATS: TemplateDef[] = [
  {
    id: "big-distance",
    name: "Big Distance",
    tab: "activity", badge: "New", description: "Huge distance stat, minimal distraction",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>DISTANCE</Text>
          <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>{a.distance.toFixed(2)}</Text>
          <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>KILOMETERS</Text>
        </View>
      );
    },
  },

  {
    id: "big-duration",
    name: "Big Duration",
    tab: "activity", badge: "New", description: "Massive duration — bold and direct",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>DURATION</Text>
          <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>{formatDuration(a.duration).toUpperCase()}</Text>
        </View>
      );
    },
  },

  {
    id: "big-pace",
    name: "Big Pace",
    tab: "activity", badge: "New", description: "Pace as the hero — pure running focus",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const pace = a.pace != null ? `${Math.floor(a.pace)}:${String(Math.round((a.pace - Math.floor(a.pace)) * 60)).padStart(2, "0")}` : "--:--";
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>PACE</Text>
          <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>{pace}</Text>
          <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>MIN / KM</Text>
        </View>
      );
    },
  },

  {
    id: "big-speed",
    name: "Big Speed",
    tab: "activity", badge: "New",
    description: "Speed in the spotlight",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const speed = a.speed != null ? a.speed.toFixed(1) : a.pace != null ? (60 / a.pace).toFixed(1) : "--";
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>SPEED</Text>
          <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>{speed}</Text>
          <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>KM / H</Text>
        </View>
      );
    },
  },

  {
    id: "big-elevation",
    name: "Big Elevation",
    tab: "activity", badge: "New",
    description: "Elevation gain front and centre",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const elev = a.elevation != null && a.elevation > 0 ? a.elevation : "--";
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>ELEVATION</Text>
          <Text style={[{ color: c.accentElev, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>{elev}</Text>
          <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>METERS</Text>
        </View>
      );
    },
  },

  // ─── COMBO: Paired stats ───,
];

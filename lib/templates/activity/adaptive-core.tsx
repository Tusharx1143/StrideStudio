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

// ─── ADAPTIVE CORE ───

export const ADAPTIVE_CORE: TemplateDef[] = [
  {
    id: "auto-adapt",
    name: "Auto Adapt",
    tab: "activity",
    fullWidth: true,
    badge: "Dynamic",
    description: "Automatically arranges all available stats from your activity",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const first = fields.slice(0, 4);
      const second = fields.slice(4);

      return (
        <View style={{ flex: 1, padding: 10, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <Text style={{ fontSize: 14 }}>{typeEmoji(a.type)}</Text>
            <Text style={[{ color: c.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
              {typeLabel(a.type)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[{ color: c.textMuted, fontSize: 8, fontFamily: c.fontFamily ?? "Courier" }, ts(c.shadowColor, c.fontFamily)]}>
              {fmtDateShort(a.startDate)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {first.map((f, i) => (
              <View key={f.key} style={{ width: i === 0 ? "100%" : "33.333%", paddingVertical: i === 0 ? 6 : 4, paddingHorizontal: 4 }}>
                <Text style={[{ color: i === 0 ? c.textPrimary : c.textSecondary, fontSize: i === 0 ? 9 : 7, fontWeight: "700", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 22 : 13, fontWeight: i === 0 ? "900" : "700", letterSpacing: i === 0 ? -0.5 : 0 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
          {second.length > 0 && (
            <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: c.border, marginTop: 6, paddingTop: 6, gap: 12 }}>
              {second.map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 2. SMART HERO ───,

  {
    id: "smart-hero",
    name: "Smart Hero",
    tab: "activity",
    badge: "Dynamic",
    description: "Highlights the most impressive stat from your activity",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = heroField(fields);
      const rest = fields.slice(1, 4);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {hero && (
            <View style={{ alignItems: "center", marginBottom: rest.length > 0 ? 6 : 0 }}>
              <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                {hero.label}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 28, fontWeight: "900", letterSpacing: -1, textAlign: "center" }, ts(c.shadowColor, c.fontFamily)]}>
                {hero.value}
              </Text>
            </View>
          )}
          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.label}
                  </Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8 }}>{typeEmoji(a.type)}</Text>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
              {a.type.toUpperCase()} · {fmtDateShort(a.startDate)}
            </Text>
          </View>
        </View>
      );
    },
  },

  // ─── 3. ACTIVITY SHAPE ───,

  {
    id: "activity-shape",
    name: "Activity Shape",
    tab: "activity",
    fullWidth: true,
    badge: "Dynamic",
    description: "Layout and colours adapt to whether you ran, rode, or worked out",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const isRun = a.type === "run";
      const isRide = a.type === "ride";
      const accentColor = isRun ? c.accentRun : isRide ? c.accentRide : c.accentWorkout;
      const emoji = typeEmoji(a.type);
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
            <View style={{ backgroundColor: alpha(accentColor, "22"), borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={[{ color: accentColor, fontSize: 8, fontWeight: "800", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                {typeLabel(a.type)}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {a.title && (
              <Text style={[{ color: c.textMuted, fontSize: 7, fontFamily: c.fontFamily ?? "Courier", maxWidth: 100 }, ts(c.shadowColor, c.fontFamily)]} numberOfLines={1}>
                {a.title}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 36, marginBottom: 8, textAlign: "center" }}>{emoji}</Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
            {fields.slice(0, 3).map((f, i) => (
              <View key={f.key} style={{ alignItems: "center", backgroundColor: i === 0 ? alpha(accentColor, "15") : "transparent", borderRadius: 8, padding: i === 0 ? 8 : 4, minWidth: i === 0 ? 90 : 60 }}>
                <Text style={[{ color: i === 0 ? accentColor : c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 18 : 11, fontWeight: i === 0 ? "900" : "700" }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, textAlign: "center", marginTop: 8 }, ts(c.shadowColor, c.fontFamily)]}>
            {fmtDateFull(a.startDate)} · {fmtTime12(a.startDate)}
          </Text>
        </View>
      );
    },
  },

  // ─── 4. ADAPTIVE GRID ───,

  {
    id: "adaptive-grid",
    name: "Adaptive Grid",
    tab: "activity",
    badge: "Auto",
    description: "Clean 3-column grid showing every available metric",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {fields.map((f) => (
              <View key={f.key} style={{ width: "50%", paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: c.border, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: 14, fontWeight: "800", letterSpacing: -0.3 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  // ─── 5. STORY CARD ───,

  {
    id: "story-card",
    name: "Story Card",
    tab: "activity",
    fullWidth: true,
    badge: "Auto",
    description: "Story-style layout with title, date, and key stats",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }}>
            <Text style={{ fontSize: 12 }}>{typeEmoji(a.type)}</Text>
            <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", opacity: 0.6 }, ts(c.shadowColor, c.fontFamily)]}>
              {typeLabel(a.type)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[{ color: c.textMuted, fontSize: 7, fontFamily: c.fontFamily ?? "Courier" }, ts(c.shadowColor, c.fontFamily)]}>
              {fmtDateShort(a.startDate)}
            </Text>
          </View>

          {a.title && (
            <Text style={[{ color: c.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 }, ts(c.shadowColor, c.fontFamily)]} numberOfLines={1}>
              {a.title}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
            {fields.slice(0, 3).map((f, i) => (
              <View key={f.key} style={{ flex: 1 }}>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: i === 0 ? 20 : 12, fontWeight: i === 0 ? "900" : "700", letterSpacing: i === 0 ? -0.5 : 0 }, ts(c.shadowColor, c.fontFamily)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>

          {fields.length > 3 && (
            <View style={{ flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 5 }}>
              {fields.slice(3, 6).map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                  <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 6. FIELD STACK ───,

  {
    id: "field-stack",
    name: "Field Stack",
    tab: "activity",
    badge: "Auto",
    description: "Clean vertical list showing only the fields with data",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12 }}>
          {fields.map((f, i) => (
            <View key={f.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: i < fields.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
              <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                {f.label}
              </Text>
              <Text style={[{ color: c.textPrimary, fontSize: 12, fontWeight: "700", fontFamily: c.fontFamily ?? "Courier" }, ts(c.shadowColor, c.fontFamily)]}>
                {f.value}
              </Text>
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── 7. SPEED DEMON ───,

  {
    id: "speed-demon",
    name: "Speed Demon",
    tab: "activity",
    badge: "Dynamic",
    description: "Heroes the most relevant speed/pace metric for your activity",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const isRide = a.type === "ride";
      const heroLabel = isRide ? "AVG SPEED" : "PACE";
      const heroValue = isRide ? `${a.speed?.toFixed(1) ?? "--"} km/h` : paceStr(a);
      const rest = analyseFields(a).filter((f) => (isRide ? f.key !== "speed" : f.key !== "pace"));

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>{typeEmoji(a.type)}</Text>

          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
            {heroLabel}
          </Text>
          <Text style={[{ color: c.accentRide, fontSize: 30, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>
            {heroValue}
          </Text>

          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
              {rest.slice(0, 3).map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 8. PEAK ELEVATION ───,

  {
    id: "peak-elevation",
    name: "Peak Elevation",
    tab: "activity",
    badge: "Dynamic",
    description: "Elevation-focused layout when climbing data is available",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const hasElevation = a.elevation != null && a.elevation > 0;
      const fields = analyseFields(a);
      const otherFields = fields.filter((f) => f.key !== "elevation");

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {hasElevation ? (
            <>
              <Text style={{ fontSize: 22, marginBottom: 4 }}>⛰️</Text>
              <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                ELEVATION GAIN
              </Text>
              <Text style={[{ color: c.accentElev, fontSize: 28, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>
                {a.elevation} m
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                {otherFields.slice(0, 3).map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                    <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{typeEmoji(a.type)}</Text>
              {fields.slice(0, 1).map((f) => (
                <React.Fragment key={f.key}>
                  <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.label}
                  </Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.value}
                  </Text>
                </React.Fragment>
              ))}
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                {otherFields.slice(1, 4).map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                    <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      );
    },
  },

  // ─── 9. DATA EXPLORER ───,

  {
    id: "data-explorer",
    name: "Data Explorer",
    tab: "activity",
    fullWidth: true,
    badge: "Auto",
    description: "Systematic display of ALL activity data fields",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const allFields: { label: string; value: string }[] = [
        { label: "TYPE", value: a.type.toUpperCase() },
        { label: "DATE", value: fmtDateFull(a.startDate) },
        { label: "TIME", value: fmtTime12(a.startDate) },
        { label: "DAY", value: fmtWeekday(a.startDate) },
        { label: "DISTANCE", value: `${a.distance.toFixed(2)} km` },
        { label: "DURATION", value: formatDuration(a.duration) },
      ];

      if (a.pace != null) allFields.push({ label: "PACE", value: paceStr(a) });
      if (a.speed != null) allFields.push({ label: "AVG SPEED", value: `${a.speed.toFixed(1)} km/h` });
      if (a.elevation != null && a.elevation > 0) allFields.push({ label: "ELEVATION", value: `${a.elevation} m` });
      if (a.hasHeartrate && a.heartRate != null) {
        allFields.push({ label: "AVG HR", value: `${a.heartRate} bpm` });
        if (a.maxHeartRate != null) allFields.push({ label: "MAX HR", value: `${a.maxHeartRate} bpm` });
      }
      if (a.calories != null && a.calories > 0) allFields.push({ label: "CALORIES", value: `${a.calories} cal` });
      if (a.averageTemp != null) allFields.push({ label: "TEMP", value: `${a.averageTemp}°C` });
      if (a.sufferScore != null) allFields.push({ label: "SUFFER SCORE", value: `${a.sufferScore}` });

      return (
        <View style={{ flex: 1, padding: 8, justifyContent: "center" }}>
          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1, marginBottom: 6, fontFamily: c.fontFamily ?? "Courier" }, ts(c.shadowColor, c.fontFamily)]}>
            ── ACTIVITY DATA DUMP ──
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {allFields.map((f, i) => (
              <View key={i} style={{ width: "50%", paddingVertical: 3, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.chipBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", fontFamily: c.fontFamily ?? "Courier", width: 36 }, ts(c.shadowColor, c.fontFamily)]}>
                    [{f.label.slice(0, 4)}]
                  </Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 8, fontWeight: "700", fontFamily: c.fontFamily ?? "Courier", flex: 1 }, ts(c.shadowColor, c.fontFamily)]} numberOfLines={1}>
                    {f.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  // ─── 10. MINIMAL INSIGHT ───,

  {
    id: "minimal-insight",
    name: "Minimal Insight",
    tab: "activity",
    badge: "Auto",
    description: "Just the most meaningful stat — clean and minimal",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const top = fields.slice(0, 2);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          <Text style={{ fontSize: 10, marginBottom: 6, opacity: 0.6 }}>{typeEmoji(a.type)}</Text>

          {top.map((f, i) => (
            <View key={f.key} style={{ alignItems: "center", marginBottom: i === 0 ? 4 : 0 }}>
              {i === 0 ? (
                <>
                  <Text style={[{ color: c.textPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 36 }, ts(c.shadowColor, c.fontFamily)]}
                    adjustsFontSizeToFit numberOfLines={1}>
                    {f.value}
                  </Text>
                  <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                    {f.label}
                  </Text>
                </>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── TOTALS: Dynamic Week Summary ───,
];

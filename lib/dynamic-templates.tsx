/**
 * Dynamic Templates — templates that adapt their layout, content, and styling
 * based on the actual activity data they receive.
 *
 * Every render function accepts an optional 3rd `colors` argument so the
 * caller can override the colour scheme (e.g. for photo‑overlay use).
 */

import React from "react";
import { Text, View } from "react-native";
import { Activity, formatDuration } from "./app-data";
import { alpha, BRIGHT_WHITE, type TemplateColors } from "./color-presets";

// ── Types ──

interface WeekTotals {
  runKm: number;
  walkKm: number;
  totalKm: number;
  totalMinutes: number;
  items: { day: string; km: number; type: string }[];
}

interface AvailableField {
  key: string;
  label: string;
  value: string;
  salience: number; // 0..1
}

// ── Shared styling tokens ──

const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

// ── Helpers ──

function paceStr(a: Activity): string {
  if (a.pace == null) return "--";
  const min = Math.floor(a.pace);
  const sec = Math.round((a.pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

function timeStr(a: Activity): string {
  return formatDuration(a.duration).toUpperCase();
}

const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTHS_LONG = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

function fmtDateShort(iso?: string): string {
  if (!iso) return "JUL 22";
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function fmtDateFull(iso?: string): string {
  if (!iso) return "JULY 22, 2026";
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtTime12(iso?: string): string {
  if (!iso) return "6:41 PM";
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtWeekday(iso?: string): string {
  if (!iso) return "WEDNESDAY";
  return DAYS[new Date(iso).getDay()];
}

// ── Activity data analysis ──

function analyseFields(a: Activity): AvailableField[] {
  const fields: AvailableField[] = [];

  fields.push({ key: "distance", label: "DISTANCE", value: `${a.distance.toFixed(2)} km`, salience: 0.8 });
  fields.push({ key: "duration", label: "DURATION", value: formatDuration(a.duration), salience: 0.6 });

  if (a.pace != null) {
    const paceMin = Math.floor(a.pace);
    const paceSec = Math.round((a.pace - paceMin) * 60);
    const paceSalience = Math.min(1, Math.max(0.3, 1 - (a.pace / 12)));
    fields.push({ key: "pace", label: "PACE", value: `${paceMin}:${String(paceSec).padStart(2, "0")}/km`, salience: paceSalience });
  }

  if (a.speed != null) {
    fields.push({ key: "speed", label: "SPEED", value: `${a.speed.toFixed(1)} km/h`, salience: Math.min(1, Math.max(0.3, a.speed / 30)) });
  }

  if (a.elevation != null && a.elevation > 0) {
    fields.push({ key: "elevation", label: "ELEVATION", value: `${a.elevation} m`, salience: Math.min(1, Math.max(0.2, a.elevation / 500)) });
  }

  if (a.hasHeartrate && a.heartRate != null && a.heartRate > 0) {
    fields.push({ key: "heartRate", label: "AVG HR", value: `${a.heartRate} bpm`, salience: Math.min(1, Math.max(0.3, (a.heartRate - 80) / 100)) });
  }

  if (a.calories != null && a.calories > 0) {
    fields.push({ key: "calories", label: "CALORIES", value: `${a.calories} cal`, salience: Math.min(1, Math.max(0.2, a.calories / 1000)) });
  }

  fields.sort((x, y) => y.salience - x.salience);
  return fields;
}

function heroField(fields: AvailableField[]): AvailableField | null {
  return fields.length > 0 ? fields[0] : null;
}

function typeEmoji(type: string): string {
  switch (type) { case "run": return "🏃"; case "ride": return "🚴"; case "swim": return "🏊"; default: return "💪"; }
}

function typeLabel(type: string): string {
  switch (type) { case "run": return "RUN"; case "ride": return "RIDE"; case "swim": return "SWIM"; default: return "WORKOUT"; }
}

// ── Text shadow helper (for photo legibility) ──

function ts(shadowColor: string) {
  return { textShadowColor: shadowColor, textShadowOffset: { width: 0, height: 1 } as const, textShadowRadius: 2 as const };
}

// ── Dynamic template definitions ──

export interface DynamicTemplateDef {
  id: string;
  name: string;
  tab: "activity" | "totals";
  fullWidth?: boolean;
  badge?: "New" | "Dynamic" | "Auto";
  lightCard?: boolean;
  description: string;
  render: (a: Activity, totals: WeekTotals, colors?: TemplateColors) => React.ReactNode;
}

export const DYNAMIC_TEMPLATES: DynamicTemplateDef[] = [
  // ─── 1. AUTO ADAPT ───
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
            <Text style={[{ color: c.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor)]}>
              {typeLabel(a.type)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[{ color: c.textMuted, fontSize: 8, fontFamily: "Courier" }, ts(c.shadowColor)]}>
              {fmtDateShort(a.startDate)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {first.map((f, i) => (
              <View key={f.key} style={{ width: i === 0 ? "100%" : "33.333%", paddingVertical: i === 0 ? 6 : 4, paddingHorizontal: 4 }}>
                <Text style={[{ color: i === 0 ? c.textPrimary : c.textSecondary, fontSize: i === 0 ? 9 : 7, fontWeight: "700", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 22 : 13, fontWeight: i === 0 ? "900" : "700", letterSpacing: i === 0 ? -0.5 : 0 }, ts(c.shadowColor)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
          {second.length > 0 && (
            <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: c.border, marginTop: 6, paddingTop: 6, gap: 12 }}>
              {second.map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600" }, ts(c.shadowColor)]}>{f.label}</Text>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 2. SMART HERO ───
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
              <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor)]}>
                {hero.label}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 28, fontWeight: "900", letterSpacing: -1, textAlign: "center" }, ts(c.shadowColor)]}>
                {hero.value}
              </Text>
            </View>
          )}
          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor)]}>
                    {f.label}
                  </Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8 }}>{typeEmoji(a.type)}</Text>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor)]}>
              {a.type.toUpperCase()} · {fmtDateShort(a.startDate)}
            </Text>
          </View>
        </View>
      );
    },
  },

  // ─── 3. ACTIVITY SHAPE ───
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
              <Text style={[{ color: accentColor, fontSize: 8, fontWeight: "800", letterSpacing: 1 }, ts(c.shadowColor)]}>
                {typeLabel(a.type)}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {a.title && (
              <Text style={[{ color: c.textMuted, fontSize: 7, fontFamily: "Courier", maxWidth: 100 }, ts(c.shadowColor)]} numberOfLines={1}>
                {a.title}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 36, marginBottom: 8, textAlign: "center" }}>{emoji}</Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
            {fields.slice(0, 3).map((f, i) => (
              <View key={f.key} style={{ alignItems: "center", backgroundColor: i === 0 ? alpha(accentColor, "15") : "transparent", borderRadius: 8, padding: i === 0 ? 8 : 4, minWidth: i === 0 ? 90 : 60 }}>
                <Text style={[{ color: i === 0 ? accentColor : c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: i === 0 ? 18 : 11, fontWeight: i === 0 ? "900" : "700" }, ts(c.shadowColor)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, textAlign: "center", marginTop: 8 }, ts(c.shadowColor)]}>
            {fmtDateFull(a.startDate)} · {fmtTime12(a.startDate)}
          </Text>
        </View>
      );
    },
  },

  // ─── 4. ADAPTIVE GRID ───
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
                <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: 14, fontWeight: "800", letterSpacing: -0.3 }, ts(c.shadowColor)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
  },

  // ─── 5. STORY CARD ───
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
            <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", opacity: 0.6 }, ts(c.shadowColor)]}>
              {typeLabel(a.type)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[{ color: c.textMuted, fontSize: 7, fontFamily: "Courier" }, ts(c.shadowColor)]}>
              {fmtDateShort(a.startDate)}
            </Text>
          </View>

          {a.title && (
            <Text style={[{ color: c.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 }, ts(c.shadowColor)]} numberOfLines={1}>
              {a.title}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
            {fields.slice(0, 3).map((f, i) => (
              <View key={f.key} style={{ flex: 1 }}>
                <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor)]}>
                  {f.label}
                </Text>
                <Text style={[{ color: i === 0 ? c.accent : c.textPrimary, fontSize: i === 0 ? 20 : 12, fontWeight: i === 0 ? "900" : "700", letterSpacing: i === 0 ? -0.5 : 0 }, ts(c.shadowColor)]}>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>

          {fields.length > 3 && (
            <View style={{ flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 5 }}>
              {fields.slice(3, 6).map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor)]}>{f.label}</Text>
                  <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 6. FIELD STACK ───
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
              <Text style={[{ color: c.textMuted, fontSize: 8, fontWeight: "600", letterSpacing: 1 }, ts(c.shadowColor)]}>
                {f.label}
              </Text>
              <Text style={[{ color: c.textPrimary, fontSize: 12, fontWeight: "700", fontFamily: "Courier" }, ts(c.shadowColor)]}>
                {f.value}
              </Text>
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── 7. SPEED DEMON ───
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

          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor)]}>
            {heroLabel}
          </Text>
          <Text style={[{ color: c.accentRide, fontSize: 30, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor)]}>
            {heroValue}
          </Text>

          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
              {rest.slice(0, 3).map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor)]}>{f.label}</Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 8. PEAK ELEVATION ───
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
              <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }, ts(c.shadowColor)]}>
                ELEVATION GAIN
              </Text>
              <Text style={[{ color: c.accentElev, fontSize: 28, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor)]}>
                {a.elevation} m
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                {otherFields.slice(0, 3).map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor)]}>{f.label}</Text>
                    <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{typeEmoji(a.type)}</Text>
              {fields.slice(0, 1).map((f) => (
                <React.Fragment key={f.key}>
                  <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor)]}>
                    {f.label}
                  </Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor)]}>
                    {f.value}
                  </Text>
                </React.Fragment>
              ))}
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                {otherFields.slice(1, 4).map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor)]}>{f.label}</Text>
                    <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      );
    },
  },

  // ─── 9. DATA EXPLORER ───
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
          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1, marginBottom: 6, fontFamily: "Courier" }, ts(c.shadowColor)]}>
            ── ACTIVITY DATA DUMP ──
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {allFields.map((f, i) => (
              <View key={i} style={{ width: "50%", paddingVertical: 3, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.chipBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", fontFamily: "Courier", width: 36 }, ts(c.shadowColor)]}>
                    [{f.label.slice(0, 4)}]
                  </Text>
                  <Text style={[{ color: c.textPrimary, fontSize: 8, fontWeight: "700", fontFamily: "Courier", flex: 1 }, ts(c.shadowColor)]} numberOfLines={1}>
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

  // ─── 10. MINIMAL INSIGHT ───
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
                  <Text style={[{ color: c.textPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 36 }, ts(c.shadowColor)]}
                    adjustsFontSizeToFit numberOfLines={1}>
                    {f.value}
                  </Text>
                  <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor)]}>
                    {f.label}
                  </Text>
                </>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor)]}>{f.label}</Text>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor)]}>{f.value}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── TOTALS: Dynamic Week Summary ───
  {
    id: "dynamic-week",
    name: "Dynamic Week",
    tab: "totals",
    badge: "Auto",
    description: "Week totals that adapt to show what matters this week",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const showRun = t.runKm > 0;
      const showWalk = t.walkKm > 0;
      const ratio = showRun && showWalk ? (t.runKm / (t.runKm + t.walkKm) * 100) : showRun ? 100 : 0;

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={[{ color: c.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 }, ts(c.shadowColor)]}>
            {t.totalKm.toFixed(1)} km
          </Text>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 6 }, ts(c.shadowColor)]}>
            THIS WEEK · {formatDuration(t.totalMinutes).toUpperCase()}
          </Text>

          {showRun && showWalk && (
            <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
              <View style={{ width: `${ratio}%`, backgroundColor: c.accentRun, height: "100%" }} />
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            {showRun && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accentRun }} />
                <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "600" }, ts(c.shadowColor)]}>
                  RUN {t.runKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {showWalk && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accentRide }} />
                <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "600" }, ts(c.shadowColor)]}>
                  RIDE {t.walkKm.toFixed(1)} km
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

  // ─── TOTALS: Activity Type Breakdown ───
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
          <Text style={[{ color: c.textPrimary, fontSize: 8, fontWeight: "700", letterSpacing: 1, marginBottom: 6 }, ts(c.shadowColor)]}>
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
              <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", fontFamily: "Courier", minWidth: 50, textAlign: "right" }, ts(c.shadowColor)]}>
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
                  <View style={{ width: `${(t.walkKm / t.totalKm) * 100}%`, backgroundColor: c.accentRide, height: "100%" }} />
                </View>
              </View>
              <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", fontFamily: "Courier", minWidth: 50, textAlign: "right" }, ts(c.shadowColor)]}>
                {t.walkKm.toFixed(1)} km
              </Text>
              <Text style={[{ color: c.textMuted, fontSize: 7 }]}>{rideCount}x</Text>
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: c.border, marginTop: 4, paddingTop: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[{ color: c.textPrimary, fontSize: 10, fontWeight: "800" }, ts(c.shadowColor)]}>TOTAL</Text>
              <Text style={[{ color: c.textPrimary, fontSize: 10, fontWeight: "800" }, ts(c.shadowColor)]}>{t.totalKm.toFixed(1)} km</Text>
            </View>
          </View>
        </View>
      );
    },
  },
];

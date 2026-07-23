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

function ts(shadowColor: string, fontFamily?: string) {
  const out: Record<string, any> = { textShadowColor: shadowColor, textShadowOffset: { width: 0, height: 1 } as const, textShadowRadius: 2 as const };
  if (fontFamily) out.fontFamily = fontFamily;
  return out;
}

function ff(fontFamily?: string): Record<string, string> | {} {
  return fontFamily ? { fontFamily } : {};
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
          <Text style={[{ color: c.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
            {t.totalKm.toFixed(1)} km
          </Text>
          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 6 }, ts(c.shadowColor, c.fontFamily)]}>
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
                <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>
                  RUN {t.runKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {showWalk && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accentRide }} />
                <Text style={[{ color: c.textSecondary, fontSize: 8, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>
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
                  <View style={{ width: `${(t.walkKm / t.totalKm) * 100}%`, backgroundColor: c.accentRide, height: "100%" }} />
                </View>
              </View>
              <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700", fontFamily: c.fontFamily ?? "Courier", minWidth: 50, textAlign: "right" }, ts(c.shadowColor, c.fontFamily)]}>
                {t.walkKm.toFixed(1)} km
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

  // ─── FANCY: Gradient Glow ───
  {
    id: "gradient-glow",
    name: "Gradient Glow",
    tab: "activity",
    badge: "New",
    description: "Faux gradient glow with layered semi-transparent text",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const top3 = fields.slice(0, 3);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }}>
          {/* Large background number (decorative) */}
          {top3[0] && (
            <View style={{ position: "absolute", right: -10, top: -10, opacity: 0.08 }}>
              <Text style={[{ color: c.accent, fontSize: 72, fontWeight: "900" }, ff(c.fontFamily)]}>
                {top3[0].value.split(" ")[0]}
              </Text>
            </View>
          )}

          {/* Emoji badge */}
          <View style={{ backgroundColor: alpha(c.accent, "20"), borderRadius: 20, padding: 6, marginBottom: 6 }}>
            <Text style={{ fontSize: 20 }}>{typeEmoji(a.type)}</Text>
          </View>

          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 2, marginBottom: 4 }, ts(c.shadowColor, c.fontFamily)]}>
            {typeLabel(a.type)} · {fmtDateShort(a.startDate)}
          </Text>

          {/* Hero stat with glow layers */}
          {top3[0] && (
            <View style={{ alignItems: "center", marginVertical: 6 }}>
              <Text style={[{ color: c.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                {top3[0].label}
              </Text>
              {/* Layered text for glow effect */}
              <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1, opacity: 0.3, position: "absolute", top: 26 }, ff(c.fontFamily)]}>
                {top3[0].value}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1, opacity: 0.6, position: "absolute", top: 24 }, ff(c.fontFamily)]}>
                {top3[0].value}
              </Text>
              <Text style={[{ color: c.textPrimary, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>
                {top3[0].value}
              </Text>
            </View>
          )}

          {/* Supporting stats */}
          {top3.length > 1 && (
            <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
              {top3.slice(1).map((f) => (
                <View key={f.key} style={{ alignItems: "center", paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: alpha(c.accent, "30") }}>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── FANCY: Badge Medal ───
  {
    id: "badge-medal",
    name: "Badge Medal",
    tab: "activity",
    badge: "New",
    description: "Circular badge layout with decorative rings",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          {/* Decorative outer ring */}
          <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: alpha(c.accent, "30"), alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
            {/* Inner ring */}
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: alpha(c.accent, "50"), alignItems: "center", justifyContent: "center" }}>
              {/* Solid center */}
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: alpha(c.accent, "15"), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18 }}>{typeEmoji(a.type)}</Text>
              </View>
            </View>
          </View>

          {hero && (
            <>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                {hero.label}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 18, fontWeight: "900", letterSpacing: -0.5 }, ts(c.shadowColor, c.fontFamily)]}>
                {hero.value}
              </Text>
            </>
          )}

          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center", paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: c.border }}>
                  <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[{ color: c.textMuted, fontSize: 5, fontWeight: "600", letterSpacing: 1, marginTop: 4 }, ts(c.shadowColor, c.fontFamily)]}>
            {fmtDateFull(a.startDate)}
          </Text>
        </View>
      );
    },
  },

  // ─── FANCY: Cinematic Letterbox ───
  {
    id: "cinematic",
    name: "Cinematic",
    tab: "activity",
    fullWidth: true,
    badge: "New",
    description: "Widescreen letterbox layout with bold centred stat",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);

      return (
        <View style={{ flex: 1, justifyContent: "center" }}>
          {/* Top letterbox */}
          <View style={{ height: 28, backgroundColor: alpha(c.border, "80"), justifyContent: "center", paddingHorizontal: 12 }}>
            <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 2 }, ff(c.fontFamily)]}>
              {typeLabel(a.type)} · {fmtDateShort(a.startDate)} · {fmtTime12(a.startDate)}
            </Text>
          </View>

          {/* Centre content */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
            {hero && (
              <>
                <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                  {hero.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: 34, fontWeight: "900", letterSpacing: -1, textAlign: "center" }, ts(c.shadowColor, c.fontFamily)]}>
                  {hero.value}
                </Text>
              </>
            )}

            {rest.length > 0 && (
              <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
                {rest.map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={[{ color: c.textSecondary, fontSize: 10, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                    <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Bottom letterbox */}
          <View style={{ height: 28, backgroundColor: alpha(c.border, "80"), justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 12 }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ff(c.fontFamily)]}>
              {a.title?.toUpperCase() ?? "STRIDESTUDIO"}
            </Text>
          </View>
        </View>
      );
    },
  },

  // ─── FANCY: Neon Sign ───
  {
    id: "neon-sign",
    name: "Neon Sign",
    tab: "activity",
    badge: "New",
    description: "Glowing neon text effect on dark background",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 3);

      const glow = (size: number) => ({
        textShadowColor: c.accent,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: size,
      });

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {/* Type indicator with glow */}
          <Text style={[{ fontSize: 22, marginBottom: 6 }, glow(12)]}>{typeEmoji(a.type)}</Text>

          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 2, marginBottom: 6 }, glow(4)]}>
            {a.type.toUpperCase()}
          </Text>

          {hero && (
            <View style={{ alignItems: "center" }}>
              <Text style={[{ color: c.accent, fontSize: 8, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, glow(6)]}>
                {hero.label}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 28, fontWeight: "900", letterSpacing: 2 }, { ...glow(18), opacity: 0.4, position: "absolute", top: 24 }]}>
                {hero.value}
              </Text>
              <Text style={[{ color: c.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: 2 }, glow(12)]}>
                {hero.value}
              </Text>
            </View>
          )}

          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={[{ color: c.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1 }, glow(8)]}>{f.value}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, glow(4)]}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── .IDEA: Blue Bar Quote ───
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

  // ─── .IDEA: Stats Strip (horizontal stat bars) ───
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

  // ─── .IDEA: Minimal Dot Concentric ───
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

  // ─── .IDEA: Data Dash (dense stats) ───
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

  // ─── .IDEA: Mini Activity Card ───
  {
    id: "mini-activity",
    name: "Mini Activity",
    tab: "totals",
    badge: "New",
    description: "Compact weekly summary with activity pills",
    render: (_a, t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const runKm = t.runKm;
      const walkKm = t.walkKm;

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
            {walkKm > 0 && (
              <View style={{ backgroundColor: alpha(c.accentRide, "20"), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontSize: 8 }}>🚴</Text>
                <Text style={[{ color: c.accentRide, fontSize: 8, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>
                  {walkKm.toFixed(1)} km
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

  // ─── BIG STAT: Distance Focus ───
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

  // ─── COMBO: Paired stats ───
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

  // ─── LAYOUT: Left / Right / Grid ───
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

  // ─── STYLE: Aesthetic variants ───
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

  // ─── TOTALS: More week/month ───
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

  // ─── MORE ACTIVITY TEMPLATES ───
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

/**
 * Dynamic Templates — templates that adapt their layout, content, and styling
 * based on the actual activity data they receive.
 *
 * Instead of hardcoding which stats to show, these templates:
 *  - Scan the activity for available data fields
 *  - Analyse which values are noteworthy
 *  - Adapt their layout to the activity type (run / ride / workout)
 *  - Show only fields that have meaningful values
 */

import React from "react";
import { Text, View } from "react-native";
import { Activity, formatDuration } from "./app-data";

// WeekTotals type — mirrors the one in templates.tsx without circular deps
interface WeekTotals {
  runKm: number;
  walkKm: number;
  totalKm: number;
  totalMinutes: number;
  items: { day: string; km: number; type: string }[];
}

// ── shared styling tokens ──
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

/** Format pace from min/km number */
function paceStr(a: Activity): string {
  if (a.pace == null) return "--";
  const min = Math.floor(a.pace);
  const sec = Math.round((a.pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

/** Short duration string */
function timeStr(a: Activity): string {
  return formatDuration(a.duration).toUpperCase();
}

/** Date helpers */
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

interface AvailableField {
  key: string;
  label: string;
  value: string;
  /** 0..1 — how notable this value is; 1 = most noteworthy */
  salience: number;
}

/**
 * Analyse an activity and return all fields that have meaningful data,
 * sorted by how "noteworthy" they are (salience).
 */
function analyseFields(a: Activity): AvailableField[] {
  const fields: AvailableField[] = [];

  // Distance — always available
  fields.push({
    key: "distance",
    label: "DISTANCE",
    value: `${a.distance.toFixed(2)} km`,
    salience: 0.8,
  });

  // Duration
  fields.push({
    key: "duration",
    label: "DURATION",
    value: formatDuration(a.duration),
    salience: 0.6,
  });

  // Pace (run-specific)
  if (a.pace != null) {
    const paceMin = Math.floor(a.pace);
    const paceSec = Math.round((a.pace - paceMin) * 60);
    // Faster pace = more salient
    const paceSalience = Math.min(1, Math.max(0.3, 1 - (a.pace / 12)));
    fields.push({
      key: "pace",
      label: "PACE",
      value: `${paceMin}:${String(paceSec).padStart(2, "0")}/km`,
      salience: paceSalience,
    });
  }

  // Speed (ride-specific)
  if (a.speed != null) {
    const speedSalience = Math.min(1, Math.max(0.3, a.speed / 30));
    fields.push({
      key: "speed",
      label: "SPEED",
      value: `${a.speed.toFixed(1)} km/h`,
      salience: speedSalience,
    });
  }

  // Elevation
  if (a.elevation != null && a.elevation > 0) {
    const elevSalience = Math.min(1, Math.max(0.2, a.elevation / 500));
    fields.push({
      key: "elevation",
      label: "ELEVATION",
      value: `${a.elevation} m`,
      salience: elevSalience,
    });
  }

  // Heart rate
  if (a.hasHeartrate && a.heartRate != null && a.heartRate > 0) {
    const hrSalience = Math.min(1, Math.max(0.3, (a.heartRate - 80) / 100));
    fields.push({
      key: "heartRate",
      label: "AVG HR",
      value: `${a.heartRate} bpm`,
      salience: hrSalience,
    });
  }

  // Calories
  if (a.calories != null && a.calories > 0) {
    const calSalience = Math.min(1, Math.max(0.2, a.calories / 1000));
    fields.push({
      key: "calories",
      label: "CALORIES",
      value: `${a.calories} cal`,
      salience: calSalience,
    });
  }

  // Sort by salience descending
  fields.sort((x, y) => y.salience - x.salience);
  return fields;
}

/** Get the single most impressive stat */
function heroField(fields: AvailableField[]): AvailableField | null {
  return fields.length > 0 ? fields[0] : null;
}

/** Emoji + label for activity type */
function typeEmoji(type: string): string {
  switch (type) {
    case "run":   return "🏃";
    case "ride":  return "🚴";
    case "swim":  return "🏊";
    default:      return "💪";
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "run":   return "RUN";
    case "ride":  return "RIDE";
    case "swim":  return "SWIM";
    default:      return "WORKOUT";
  }
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
  render: (a: Activity, totals: WeekTotals) => React.ReactNode;
}

export const DYNAMIC_TEMPLATES: DynamicTemplateDef[] = [
  // ─── 1. AUTO ADAPT — shows all available fields in a dynamic grid ───
  {
    id: "auto-adapt",
    name: "Auto Adapt",
    tab: "activity",
    fullWidth: true,
    badge: "Dynamic",
    description: "Automatically arranges all available stats from your activity",
    render: (a) => {
      const fields = analyseFields(a);
      const first = fields.slice(0, 4);
      const second = fields.slice(4);

      return (
        <View style={{ flex: 1, padding: 10, justifyContent: "center" }}>
          {/* Activity header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <Text style={{ fontSize: 14 }}>{typeEmoji(a.type)}</Text>
            <Text style={{ color: "#888888", fontSize: 9, fontWeight: "700", letterSpacing: 1 }}>
              {typeLabel(a.type)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: "#666666", fontSize: 8, fontFamily: "Courier" }}>
              {fmtDateShort(a.startDate)}
            </Text>
          </View>

          {/* Dynamic stat grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {first.map((f, i) => (
              <View
                key={f.key}
                style={{
                  width: i === 0 ? "100%" : "33.333%",
                  paddingVertical: i === 0 ? 6 : 4,
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: i === 0 ? "#FFFFFF" : "#AAAAAA",
                    fontSize: i === 0 ? 9 : 7,
                    fontWeight: "700",
                    letterSpacing: 1,
                    marginBottom: 1,
                  }}
                >
                  {f.label}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: i === 0 ? 22 : 13,
                    fontWeight: i === 0 ? "900" : "700",
                    letterSpacing: i === 0 ? -0.5 : 0,
                  }}
                >
                  {f.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Secondary stats row */}
          {second.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderTopColor: "#1C1C1E",
                marginTop: 6,
                paddingTop: 6,
                gap: 12,
              }}
            >
              {second.map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: "#666666", fontSize: 7, fontWeight: "600" }}>{f.label}</Text>
                  <Text style={{ color: "#AAAAAA", fontSize: 9, fontWeight: "700" }}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 2. SMART HERO — picks the most noteworthy stat and features it ───
  {
    id: "smart-hero",
    name: "Smart Hero",
    tab: "activity",
    badge: "Dynamic",
    description: "Highlights the most impressive stat from your activity",
    render: (a) => {
      const fields = analyseFields(a);
      const hero = heroField(fields);
      const rest = fields.slice(1, 4);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {/* Hero stat */}
          {hero && (
            <View style={{ alignItems: "center", marginBottom: rest.length > 0 ? 6 : 0 }}>
              <Text style={{ color: "#666666", fontSize: 8, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }}>
                {hero.label}
              </Text>
              <Text
                style={{
                  color: "#FF6B35",
                  fontSize: 28,
                  fontWeight: "900",
                  letterSpacing: -1,
                  textAlign: "center",
                }}
              >
                {hero.value}
              </Text>
            </View>
          )}

          {/* Supporting stats */}
          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={{ color: "#666666", fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }}>
                    {f.label}
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Activity type context */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 8 }}>{typeEmoji(a.type)}</Text>
            <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600", letterSpacing: 1 }}>
              {a.type.toUpperCase()} · {fmtDateShort(a.startDate)}
            </Text>
          </View>
        </View>
      );
    },
  },

  // ─── 3. ACTIVITY SHAPE — changes layout by activity type ───
  {
    id: "activity-shape",
    name: "Activity Shape",
    tab: "activity",
    fullWidth: true,
    badge: "Dynamic",
    description: "Layout and colours adapt to whether you ran, rode, or worked out",
    render: (a) => {
      const isRun = a.type === "run";
      const isRide = a.type === "ride";
      const accentColor = isRun ? "#0A84FF" : isRide ? "#34C759" : "#FF9F0A";
      const emoji = typeEmoji(a.type);
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
          {/* Type badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
            <View
              style={{
                backgroundColor: accentColor + "22",
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: accentColor, fontSize: 8, fontWeight: "800", letterSpacing: 1 }}>
                {typeLabel(a.type)}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {a.title && (
              <Text style={{ color: "#666666", fontSize: 7, fontFamily: "Courier", maxWidth: 100 }} numberOfLines={1}>
                {a.title}
              </Text>
            )}
          </View>

          {/* Big type emoji for visual identity */}
          <Text style={{ fontSize: 36, marginBottom: 8, textAlign: "center" }}>{emoji}</Text>

          {/* Stats arranged by type */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
            {fields.slice(0, 3).map((f, i) => (
              <View
                key={f.key}
                style={{
                  alignItems: "center",
                  backgroundColor: i === 0 ? accentColor + "15" : "transparent",
                  borderRadius: 8,
                  padding: i === 0 ? 8 : 4,
                  minWidth: i === 0 ? 90 : 60,
                }}
              >
                <Text style={{ color: i === 0 ? accentColor : "#666666", fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }}>
                  {f.label}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: i === 0 ? 18 : 11,
                    fontWeight: i === 0 ? "900" : "700",
                  }}
                >
                  {f.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Date footer */}
          <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600", letterSpacing: 1, textAlign: "center", marginTop: 8 }}>
            {fmtDateFull(a.startDate)} · {fmtTime12(a.startDate)}
          </Text>
        </View>
      );
    },
  },

  // ─── 4. ADAPTIVE GRID — auto 3-column grid of all available data ───
  {
    id: "adaptive-grid",
    name: "Adaptive Grid",
    tab: "activity",
    badge: "Auto",
    description: "Clean 3-column grid showing every available metric",
    render: (a) => {
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {fields.map((f) => (
              <View
                key={f.key}
                style={{
                  width: "50%",
                  paddingVertical: 5,
                  paddingHorizontal: 6,
                  borderRightWidth: 1,
                  borderRightColor: "#1C1C1E",
                  borderBottomWidth: 1,
                  borderBottomColor: "#1C1C1E",
                }}
              >
                <Text style={{ color: "#666666", fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 2 }}>
                  {f.label}
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: "800",
                    letterSpacing: -0.3,
                  }}
                >
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
    render: (a) => {
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
          {/* Top line: type + date */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }}>
            <Text style={{ fontSize: 12 }}>{typeEmoji(a.type)}</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700", opacity: 0.6 }}>
              {typeLabel(a.type)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: "#555555", fontSize: 7, fontFamily: "Courier" }}>
              {fmtDateShort(a.startDate)}
            </Text>
          </View>

          {/* Activity title */}
          {a.title && (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "800",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {a.title}
            </Text>
          )}

          {/* Hero stat row */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
            {fields.slice(0, 3).map((f, i) => (
              <View key={f.key} style={{ flex: 1 }}>
                <Text style={{ color: "#666666", fontSize: 6, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }}>
                  {f.label}
                </Text>
                <Text
                  style={{
                    color: i === 0 ? "#FF6B35" : "#FFFFFF",
                    fontSize: i === 0 ? 20 : 12,
                    fontWeight: i === 0 ? "900" : "700",
                    letterSpacing: i === 0 ? -0.5 : 0,
                  }}
                >
                  {f.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Extra fields line */}
          {fields.length > 3 && (
            <View style={{ flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: "#1C1C1E", paddingTop: 5 }}>
              {fields.slice(3, 6).map((f) => (
                <View key={f.key} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600" }}>{f.label}</Text>
                  <Text style={{ color: "#AAAAAA", fontSize: 8, fontWeight: "700" }}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── 6. FIELD STACK — vertical list of available fields ───
  {
    id: "field-stack",
    name: "Field Stack",
    tab: "activity",
    badge: "Auto",
    description: "Clean vertical list showing only the fields with data",
    render: (a) => {
      const fields = analyseFields(a);

      return (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12 }}>
          {fields.map((f, i) => (
            <View
              key={f.key}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 4,
                borderBottomWidth: i < fields.length - 1 ? 1 : 0,
                borderBottomColor: "#1C1C1E",
              }}
            >
              <Text style={{ color: "#666666", fontSize: 8, fontWeight: "600", letterSpacing: 1 }}>
                {f.label}
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700", fontFamily: "Courier" }}>
                {f.value}
              </Text>
            </View>
          ))}
        </View>
      );
    },
  },

  // ─── 7. SPEED DEMON — pace for runs, speed for rides ───
  {
    id: "speed-demon",
    name: "Speed Demon",
    tab: "activity",
    badge: "Dynamic",
    description: "Heroes the most relevant speed/pace metric for your activity",
    render: (a) => {
      const isRide = a.type === "ride";
      const heroLabel = isRide ? "AVG SPEED" : "PACE";
      const heroValue = isRide
        ? `${a.speed?.toFixed(1) ?? "--"} km/h`
        : paceStr(a);
      const rest = analyseFields(a).filter(
        (f) => (isRide ? f.key !== "speed" : f.key !== "pace")
      );

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {/* Type indicator */}
          <Text style={{ fontSize: 10, marginBottom: 4 }}>{typeEmoji(a.type)}</Text>

          {/* Hero — speed/pace */}
          <Text style={{ color: "#666666", fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }}>
            {heroLabel}
          </Text>
          <Text
            style={{
              color: "#34C759",
              fontSize: 30,
              fontWeight: "900",
              letterSpacing: -1,
            }}
          >
            {heroValue}
          </Text>

          {/* Distance + time on the sides */}
          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
              {rest.slice(0, 3).map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600" }}>{f.label}</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{f.value}</Text>
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
    render: (a) => {
      const hasElevation = a.elevation != null && a.elevation > 0;
      const fields = analyseFields(a);
      const otherFields = fields.filter((f) => f.key !== "elevation");

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {hasElevation ? (
            <>
              <Text style={{ fontSize: 22, marginBottom: 4 }}>⛰️</Text>
              <Text style={{ color: "#666666", fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 1 }}>
                ELEVATION GAIN
              </Text>
              <Text
                style={{
                  color: "#8B5CF6",
                  fontSize: 28,
                  fontWeight: "900",
                  letterSpacing: -1,
                }}
              >
                {a.elevation} m
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                {otherFields.slice(0, 3).map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600" }}>{f.label}</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            // Fallback when no elevation data: show standard stats
            <>
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{typeEmoji(a.type)}</Text>
              {fields.slice(0, 1).map((f) => (
                <React.Fragment key={f.key}>
                  <Text style={{ color: "#666666", fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }}>
                    {f.label}
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "900", letterSpacing: -1 }}>
                    {f.value}
                  </Text>
                </React.Fragment>
              ))}
              <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
                {otherFields.slice(1, 4).map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600" }}>{f.label}</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{f.value}</Text>
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
    render: (a) => {
      // Build comprehensive field list including optional ones
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
          <Text style={{ color: "#555555", fontSize: 6, fontWeight: "700", letterSpacing: 1, marginBottom: 6, fontFamily: "Courier" }}>
            ── ACTIVITY DATA DUMP ──
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {allFields.map((f, i) => (
              <View
                key={i}
                style={{
                  width: "50%",
                  paddingVertical: 3,
                  paddingHorizontal: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#111111",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600", fontFamily: "Courier", width: 36 }}>
                    [{f.label.slice(0, 4)}]
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700", fontFamily: "Courier", flex: 1 }} numberOfLines={1}>
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
    render: (a) => {
      const fields = analyseFields(a);
      const top = fields.slice(0, 2);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {/* Activity type as a subtle marker */}
          <Text style={{ fontSize: 10, marginBottom: 6, opacity: 0.6 }}>{typeEmoji(a.type)}</Text>

          {top.map((f, i) => (
            <View key={f.key} style={{ alignItems: "center", marginBottom: i === 0 ? 4 : 0 }}>
              {i === 0 ? (
                <>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 32,
                      fontWeight: "900",
                      letterSpacing: -1,
                      lineHeight: 36,
                    }}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {f.value}
                  </Text>
                  <Text style={{ color: "#555555", fontSize: 7, fontWeight: "600", letterSpacing: 1, marginTop: 1 }}>
                    {f.label}
                  </Text>
                </>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Text style={{ color: "#555555", fontSize: 6, fontWeight: "600" }}>{f.label}</Text>
                  <Text style={{ color: "#AAAAAA", fontSize: 9, fontWeight: "700" }}>{f.value}</Text>
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
    render: (_a, t) => {
      const showRun = t.runKm > 0;
      const showWalk = t.walkKm > 0;
      const ratio = showRun && showWalk ? (t.runKm / (t.runKm + t.walkKm) * 100) : showRun ? 100 : 0;

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 }}>
            {t.totalKm.toFixed(1)} km
          </Text>
          <Text style={{ color: "#666666", fontSize: 7, fontWeight: "600", letterSpacing: 1, marginBottom: 6 }}>
            THIS WEEK · {formatDuration(t.totalMinutes).toUpperCase()}
          </Text>

          {/* Dynamic breakdown bar */}
          {showRun && showWalk && (
            <View style={{ height: 4, backgroundColor: "#1C1C1E", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
              <View style={{ width: `${ratio}%`, backgroundColor: "#0A84FF", height: "100%" }} />
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            {showRun && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#0A84FF" }} />
                <Text style={{ color: "#AAAAAA", fontSize: 8, fontWeight: "600" }}>
                  RUN {t.runKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {showWalk && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34C759" }} />
                <Text style={{ color: "#AAAAAA", fontSize: 8, fontWeight: "600" }}>
                  RIDE {t.walkKm.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>

          {/* Recent activity dots */}
          {t.items.length > 0 && (
            <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
              {t.items.slice(0, 7).map((item: { day: string; km: number; type: string }, i: number) => (
                <View
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: item.type === "run" ? "#0A84FF" : "#34C759",
                    opacity: 0.3 + (i / Math.min(t.items.length, 7)) * 0.7,
                  }}
                />
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
    render: (_a, t) => {
      // Count by type
      const runCount = t.items.filter((i) => i.type === "run").length;
      const rideCount = t.items.filter((i) => i.type !== "run").length;

      return (
        <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700", letterSpacing: 1, marginBottom: 6 }}>
            THIS WEEK
          </Text>

          {runCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 }}>
              <Text style={{ fontSize: 10 }}>🏃</Text>
              <View style={{ flex: 1 }}>
                <View style={{ height: 6, backgroundColor: "#1C1C1E", borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${(t.runKm / t.totalKm) * 100}%`,
                      backgroundColor: "#0A84FF",
                      height: "100%",
                    }}
                  />
                </View>
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700", fontFamily: "Courier", minWidth: 50, textAlign: "right" }}>
                {t.runKm.toFixed(1)} km
              </Text>
              <Text style={{ color: "#666666", fontSize: 7 }}>
                {runCount}x
              </Text>
            </View>
          )}

          {rideCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 }}>
              <Text style={{ fontSize: 10 }}>🚴</Text>
              <View style={{ flex: 1 }}>
                <View style={{ height: 6, backgroundColor: "#1C1C1E", borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${(t.walkKm / t.totalKm) * 100}%`,
                      backgroundColor: "#34C759",
                      height: "100%",
                    }}
                  />
                </View>
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700", fontFamily: "Courier", minWidth: 50, textAlign: "right" }}>
                {t.walkKm.toFixed(1)} km
              </Text>
              <Text style={{ color: "#666666", fontSize: 7 }}>
                {rideCount}x
              </Text>
            </View>
          )}

          {/* Total */}
          <View style={{ borderTopWidth: 1, borderTopColor: "#1C1C1E", marginTop: 4, paddingTop: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>
                TOTAL
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>
                {t.totalKm.toFixed(1)} km
              </Text>
            </View>
          </View>
        </View>
      );
    },
  },
];

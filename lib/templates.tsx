import React from "react";
import { Text, View } from "react-native";
import { Activity, formatDuration } from "./app-data";

/**
 * Template renderers matching the original Share Aura app designs.
 * Each template is a pure function of the activity data, rendered inside a
 * dark card. Templates are grouped into "activity" and "totals" tabs like
 * the original share screen.
 */

export interface TemplateDef {
  id: string;
  name: string;
  tab: "activity" | "totals";
  fullWidth?: boolean;
  badge?: "New" | "Customize";
  lightCard?: boolean;
  render: (a: Activity, totals: WeekTotals) => React.ReactNode;
}

export interface WeekTotals {
  runKm: number;
  walkKm: number;
  totalKm: number;
  totalMinutes: number;
  items: { day: string; km: number; type: string }[];
}

// ---------- shared bits ----------
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

function paceStr(a: Activity): string {
  if (a.pace == null) return "--";
  const min = Math.floor(a.pace);
  const sec = Math.round((a.pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

function timeStr(a: Activity): string {
  const h = Math.floor(a.duration / 60);
  const m = a.duration % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Date/time helpers derived from activity.startDate ──

function fmtDateShort(iso?: string): string {
  if (!iso) return "JUL 22";
  const d = new Date(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function fmtDateFull(iso?: string): string {
  if (!iso) return "JUL 22, 2026";
  const d = new Date(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtDateDots(iso?: string): string {
  if (!iso) return "07.22.26";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

function fmtDateDotsEU(iso?: string): string {
  if (!iso) return "22.07.26";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

function fmtDateLED(iso?: string): string {
  if (!iso) return "07 22 2026";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")} ${d.getFullYear()}`;
}

function fmtDateOrdinal(iso?: string): string {
  if (!iso) return "JULY 22ND";
  const d = new Date(iso);
  const months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "ST" : day % 10 === 2 && day !== 12 ? "ND" : day % 10 === 3 && day !== 13 ? "RD" : "TH";
  return `${months[d.getMonth()]} ${day}${suffix}`;
}

function fmtTime12(iso?: string): string {
  if (!iso) return "6:41 PM";
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtTime24(iso?: string): string {
  if (!iso) return "18:41:14";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function fmtWeekday(iso?: string): string {
  if (!iso) return "WEDNESDAY";
  const days = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  return days[new Date(iso).getDay()];
}

function fmtSeconds(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SerifStat({ label, value, size = 15 }: { label: string; value: string; size?: number }) {
  return (
    <View style={{ alignItems: "center", marginHorizontal: 8, marginVertical: 4 }}>
      <Text style={[serif, { color: "#FFFFFF", fontSize: 11, marginBottom: 2 }]}>{label}</Text>
      <Text style={[serif, { color: "#FFFFFF", fontSize: size, fontStyle: "italic", fontWeight: "600" }]}>{value}</Text>
    </View>
  );
}

function Bubble({ children }: { children: string }) {
  return (
    <View
      style={{
        backgroundColor: "#0A84FF",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 7,
        alignSelf: "center",
        marginVertical: 3,
      }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "500" }}>{children}</Text>
    </View>
  );
}

function Barcode() {
  // deterministic pseudo-random bar widths
  const widths = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 4, 1, 2, 1];
  return (
    <View style={{ flexDirection: "row", alignItems: "stretch", height: 44, justifyContent: "center" }}>
      {widths.map((w, i) => (
        <View key={i} style={{ width: w, backgroundColor: "#FFFFFF", marginRight: 2 }} />
      ))}
    </View>
  );
}

// ---------- ACTIVITY templates ----------
export const TEMPLATE_DEFS: TemplateDef[] = [
  {
    id: "serif-distance",
    name: "Serif Distance",
    tab: "activity",
    render: (a) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <SerifStat label="Distance" value={`${a.distance.toFixed(1)} km`} size={20} />
      </View>
    ),
  },
  {
    id: "serif-distance-pace",
    name: "Serif Distance + Pace",
    tab: "activity",
    render: (a) => (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <SerifStat label="Distance" value={`${a.distance.toFixed(1)} km`} />
        <SerifStat label="Pace" value={paceStr(a)} />
      </View>
    ),
  },
  {
    id: "serif-three",
    name: "Serif Triple",
    tab: "activity",
    fullWidth: true,
    render: (a) => (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <SerifStat label="Distance" value={`${a.distance.toFixed(1)} km`} />
        <SerifStat label="Pace" value={paceStr(a)} />
        <SerifStat label="Time" value={timeStr(a)} />
      </View>
    ),
  },
  {
    id: "serif-six",
    name: "Serif Full Stats",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <SerifStat label="Distance" value={`${a.distance.toFixed(1)} km`} size={12} />
          <SerifStat label="Pace" value={paceStr(a)} size={12} />
          <SerifStat label="Time" value={timeStr(a)} size={12} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <SerifStat label="Elevation" value={`${a.elevation ?? 0} m`} size={12} />
          <SerifStat label="Heart Rate" value={`${a.heartRate ?? 0} bpm`} size={12} />
          <SerifStat label="Calories" value={`${a.calories ?? 0} cal`} size={12} />
        </View>
      </View>
    ),
  },
  {
    id: "serif-stacked",
    name: "Serif Stacked",
    tab: "activity",
    render: (a) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <SerifStat label="Distance" value={`${a.distance.toFixed(1)} km`} />
        <SerifStat label="Pace" value={paceStr(a)} />
        <SerifStat label="Time" value={timeStr(a)} />
      </View>
    ),
  },
  {
    id: "serif-title",
    name: "Serif Title",
    tab: "activity",
    render: (a) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingHorizontal: 8 }}>
        <Text style={{ color: "#BBBBBB", fontSize: 9, marginBottom: 4 }}>{a.date} at {fmtTime12(a.startDate)}</Text>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 16, marginBottom: 8 }]}>{a.title}</Text>
        <View style={{ flexDirection: "row" }}>
          <SerifStat label="Distance" value={`${a.distance.toFixed(1)} km`} size={11} />
          <SerifStat label="Pace" value={paceStr(a)} size={11} />
          <SerifStat label="Time" value={timeStr(a)} size={11} />
        </View>
      </View>
    ),
  },
  {
    id: "imessage",
    name: "iMessage",
    tab: "activity",
    badge: "Customize",
    render: (a) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Bubble>{`${a.type === "ride" ? "Rode" : "Ran"} ${a.distance.toFixed(1)} km, ${paceStr(a)}`}</Bubble>
        <Text style={{ color: "#8E8E93", fontSize: 9, marginTop: 4 }}>
          {a.type === "ride" ? "Rode" : "Ran"} {fmtTime12(a.startDate)}
        </Text>
      </View>
    ),
  },
  {
    id: "bold-km",
    name: "Bold KM",
    tab: "activity",
    render: (a) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: -1 }}>
          {a.distance.toFixed(2)} KM
        </Text>
        <View style={{ flexDirection: "row", gap: 14, marginTop: 2 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700" }}>{paceStr(a).replace("/km", '"')}</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700" }}>{timeStr(a).toUpperCase()}</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700" }}>{a.elevation ?? 0} M</Text>
        </View>
      </View>
    ),
  },
  {
    id: "runner-bold",
    name: "Runner Bold",
    tab: "activity",
    fullWidth: true,
    render: (a) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 16 }}>
        <Text style={{ fontSize: 30, marginBottom: 6 }}>🏃</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 38, fontWeight: "900", letterSpacing: -1 }}>
          {a.distance.toFixed(2)} KM
        </Text>
        <View style={{ flexDirection: "row", gap: 18, marginTop: 4 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{paceStr(a).replace("/km", '"')}</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{timeStr(a).toUpperCase()}</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{a.elevation ?? 0} M</Text>
        </View>
      </View>
    ),
  },
  {
    id: "terminal",
    name: "Terminal",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, justifyContent: "space-between", padding: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 10 }]}>{a.type.toUpperCase()}</Text>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 10 }]}>{a.distance.toFixed(1)} KILOMETERS</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={[mono, { color: "#FFFFFF", fontSize: 9 }]}>{fmtTime12(a.startDate)}</Text>
            <Text style={[mono, { color: "#FFFFFF", fontSize: 9 }]}>{fmtDateShort(a.startDate).replace(" ", ". ")} {new Date(a.startDate).getFullYear()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[mono, { color: "#FFFFFF", fontSize: 9 }]}>{paceStr(a).replace("/km", " / KM")}</Text>
            <Text style={[mono, { color: "#FFFFFF", fontSize: 9 }]}>{timeStr(a).toUpperCase()}</Text>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: "barcode",
    name: "Barcode",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, justifyContent: "center", padding: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>{fmtDateDots(a.startDate)}</Text>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>{a.distance.toFixed(1)} KILOMETERS</Text>
        </View>
        <Barcode />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>{timeStr(a).toUpperCase()}</Text>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>{paceStr(a).replace("/km", " MIN/KM")}</Text>
        </View>
        <Text style={[mono, { color: "#666666", fontSize: 5, marginTop: 4 }]}>
          SHARED BY AURA MOVEMENT TECHNOLOGY, INC.
        </Text>
      </View>
    ),
  },
  {
    id: "terminal-table",
    name: "System Log",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ borderWidth: 1, borderColor: "#555555", padding: 8 }}>
          {[
            ["ACTV:", a.type.toUpperCase()],
            ["DATE:", fmtDateDotsEU(a.startDate)],
            ["TIME:", fmtTime24(a.startDate)],
            ["DIST:", `${a.distance.toFixed(1)} km`],
            ["PACE:", paceStr(a)],
            ["TIME:", timeStr(a)],
            ["ELEV:", `${a.elevation ?? 0} M`],
          ].map(([k, v], i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", width: 120 }}>
              <Text style={[mono, { color: "#DDDDDD", fontSize: 8 }]}>{k}</Text>
              <Text style={[mono, { color: "#DDDDDD", fontSize: 8 }]}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    ),
  },
  {
    id: "handwritten",
    name: "Handwritten",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 15,
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: 24,
            letterSpacing: 2,
            fontFamily: "Courier",
          }}
        >
          IF YOU'RE{"\n"}READING{"\n"}THIS I {a.type === "ride" ? "RODE" : "RAN"}{"\n"}
          {Math.round(a.distance)} KILOMETERS
        </Text>
      </View>
    ),
  },
  {
    id: "led-orange",
    name: "LED Matrix",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={[mono, { color: "#FFA500", fontSize: 17, fontWeight: "700", letterSpacing: 3 }]}>{fmtDateLED(a.startDate)}</Text>
        <Text style={[mono, { color: "#FFA500", fontSize: 17, fontWeight: "700", letterSpacing: 3, marginTop: 4 }]}>
          {a.distance.toFixed(2).padStart(5, "0")} KM
        </Text>
      </View>
    ),
  },
  {
    id: "led-red",
    name: "Red Digits",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Text style={[mono, { color: "#FF3B30", fontSize: 13, fontWeight: "700" }]}>{a.distance.toFixed(2)}</Text>
        <Text style={[mono, { color: "#FF3B30", fontSize: 13, fontWeight: "700" }]}>
          {formatDuration(a.duration).replace(" ", ":").replace("h", "").replace("m", "")}
        </Text>
        <Text style={[mono, { color: "#FF3B30", fontSize: 13, fontWeight: "700" }]}>
          {paceStr(a).replace("/km", '"')}
        </Text>
      </View>
    ),
  },
  {
    id: "caption-pill",
    name: "Caption Pill",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "#48484A",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
            {a.distance.toFixed(1)} kilometers
          </Text>
        </View>
      </View>
    ),
  },
  {
    id: "wasted",
    name: "Wasted",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            color: "#B91C1C",
            fontSize: 30,
            fontWeight: "900",
            fontStyle: "italic",
            textShadowColor: "#450A0A",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 1,
          }}
        >
          wasted
        </Text>
        <Text style={[mono, { color: "#FFFFFF", fontSize: 8, fontWeight: "700", marginTop: 2 }]}>
          {a.distance.toFixed(1)} KILOMETERS, {paceStr(a).toUpperCase()}
        </Text>
      </View>
    ),
  },
  {
    id: "weekday-red",
    name: "Weekday Red",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", letterSpacing: 3 }}>{fmtWeekday(a.startDate)}</Text>
        <Text style={{ fontSize: 14, marginVertical: 3 }}>🏃</Text>
        <Text style={{ color: "#E11D48", fontSize: 22, fontWeight: "900", letterSpacing: 1 }}>
          {a.distance.toFixed(2)} KM
        </Text>
      </View>
    ),
  },
  {
    id: "weekday-knockout",
    name: "Weekday Knockout",
    tab: "activity",
    badge: "New",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: -1 }}>{fmtWeekday(a.startDate)}</Text>
      </View>
    ),
  },
  {
    id: "timer",
    name: "Big Timer",
    tab: "activity",
    badge: "New",
    render: (a) => {
      const totalSec = Math.round(a.duration * 60);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 36, fontWeight: "900", letterSpacing: -2 }}>
            {h}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </Text>
        </View>
      );
    },
  },
  {
    id: "location-pill",
    name: "Location Pill",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 10, marginRight: 4 }}>📍</Text>
          <Text style={[mono, { color: "#000000", fontSize: 11, fontWeight: "600" }]}>
            Location, {a.distance.toFixed(1)} km
          </Text>
        </View>
      </View>
    ),
  },
  {
    id: "light-serif",
    name: "Light Card",
    tab: "activity",
    lightCard: true,
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={[serif, { color: "#111111", fontSize: 16, fontStyle: "italic" }]}>
          {a.distance.toFixed(1)} km, {paceStr(a)}
        </Text>
      </View>
    ),
  },
  {
    id: "mono-stack",
    name: "Mono Stack",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, justifyContent: "center", paddingLeft: 10 }}>
        {[fmtDateFull(a.startDate), fmtTime12(a.startDate), `${a.distance.toFixed(1)} KM`, paceStr(a).toUpperCase(), timeStr(a).toUpperCase(), `${a.elevation ?? 0} M`, `${a.calories ?? 0} CAL`].map(
          (line, i) => (
            <Text key={i} style={[mono, { color: "#FFFFFF", fontSize: 10, fontWeight: "700", lineHeight: 15 }]}>
              {line}
            </Text>
          )
        )}
      </View>
    ),
  },
  {
    id: "quote",
    name: "Quote",
    tab: "activity",
    render: () => (
      <View style={{ flex: 1, justifyContent: "center", padding: 10 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "900" }}>“</Text>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 12, lineHeight: 18 }]}>
          The only opponent you have to beat is yourself.
        </Text>
      </View>
    ),
  },
  {
    id: "notes",
    name: "Workout Notes",
    tab: "activity",
    lightCard: true,
    render: (a) => (
      <View style={{ flex: 1, backgroundColor: "#FEF9C3", borderRadius: 8, padding: 8, justifyContent: "flex-start" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: "#CA8A04", fontSize: 9, fontWeight: "600" }}>‹ workout notes</Text>
          <Text style={{ color: "#CA8A04", fontSize: 9, fontWeight: "600" }}>{a.distance.toFixed(1)} km</Text>
        </View>
        <Text style={{ color: "#111111", fontSize: 12, fontWeight: "700" }}>{a.title}</Text>
        <Text style={{ color: "#999999", fontSize: 10, marginTop: 2 }}>add notes here...</Text>
      </View>
    ),
  },
  {
    id: "polaroid",
    name: "Polaroid",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ backgroundColor: "#FFFFFF", padding: 6, paddingBottom: 10, width: 110 }}>
          <View style={{ backgroundColor: "#4A90D9", height: 80, width: "100%" }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <View>
              <Text style={[mono, { color: "#111111", fontSize: 7 }]}>{fmtDateShort(a.startDate)}</Text>
              <Text style={[mono, { color: "#111111", fontSize: 7 }]}>{fmtTime12(a.startDate)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[mono, { color: "#111111", fontSize: 7 }]}>{a.distance.toFixed(1)} KM</Text>
              <Text style={[mono, { color: "#111111", fontSize: 7 }]}>{paceStr(a).replace("/km", " /KM")}</Text>
            </View>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: "editorial",
    name: "Editorial",
    tab: "activity",
    fullWidth: true,
    badge: "New",
    render: (a) => (
      <View style={{ flex: 1, justifyContent: "space-between", padding: 10, minHeight: 150 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 7, fontWeight: "800", letterSpacing: 1 }}>
            {a.title.toUpperCase()}
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 7, fontWeight: "800", letterSpacing: 1 }}>{fmtDateOrdinal(a.startDate)}</Text>
            <Text style={{ color: "#888888", fontSize: 6 }}>{fmtTime12(a.startDate)}</Text>
          </View>
        </View>
        <View>
          {[
            ["DISTANCE", `${a.distance.toFixed(2)}KM`],
            ["PACE", paceStr(a).toUpperCase()],
            ["TIME", timeStr(a).toUpperCase()],
            ["ELEVATION GAIN", `${a.elevation ?? 0}M`],
            ["AVERAGE HR", `${a.heartRate ?? 0}BPM`],
          ].map(([k, v], i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", width: 130 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 6, fontWeight: "700" }}>{k}</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 6, fontWeight: "700" }}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    ),
  },
  {
    id: "day-summary",
    name: "Day Summary",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, justifyContent: "center", paddingLeft: 8 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginBottom: 8 }}>{fmtDateFull(a.startDate)}</Text>
        <Text style={{ color: "#BBBBBB", fontSize: 8, fontWeight: "700" }}>{a.type === "run" ? "RUN" : a.type === "ride" ? "RIDE" : "WORKOUT"}</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginBottom: 6 }}>{a.distance.toFixed(2)} KM</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 9, marginRight: 3 }}>🏃</Text>
          <Text style={{ color: "#BBBBBB", fontSize: 7, fontWeight: "700" }}>{a.title.toUpperCase()}</Text>
        </View>
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>{a.distance.toFixed(2)} KM</Text>
      </View>
    ),
  },
  {
    id: "blue-runners",
    name: "Blue Runners",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 16, color: "#0A84FF" }}>🏃</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{a.distance.toFixed(2)} KM</Text>
        <Text style={{ color: "#888888", fontSize: 7, fontWeight: "700", marginBottom: 8 }}>
          {paceStr(a).replace("/km", '"')}  {formatDuration(a.duration)}
        </Text>
        <Text style={{ fontSize: 16 }}>🏃</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{a.distance.toFixed(2)} KM</Text>
        <Text style={{ color: "#888888", fontSize: 7, fontWeight: "700" }}>{paceStr(a).replace("/km", '"')}  {formatDuration(a.duration)}</Text>
      </View>
    ),
  },
  {
    id: "temperature",
    name: "Temperature",
    tab: "activity",
    render: (a) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 12, fontStyle: "italic", marginBottom: 4 }]}>
          Temperature
        </Text>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 22 }]}>
          {a.averageTemp != null ? `${a.averageTemp}°C` : "—°C"}
        </Text>
      </View>
    ),
  },
  {
    id: "bold-triple",
    name: "Bold Triple",
    tab: "activity",
    fullWidth: true,
    render: (a) => (
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 16 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900", textAlign: "center" }}>
          {timeStr(a).toUpperCase().replace(" ", "\n")}
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900", textAlign: "center" }}>
          {a.distance.toFixed(1)}{"\n"}KM
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900", textAlign: "center" }}>
          {paceStr(a).replace("/km", "")}{"\n"}/KM
        </Text>
      </View>
    ),
  },
  // ---------- TOTALS templates ----------
  {
    id: "week-list",
    name: "This Week List",
    tab: "totals",
    badge: "New",
    render: (_a, t) => (
      <View style={{ flex: 1, padding: 6 }}>
        <Text style={{ color: "#FF9F0A", fontSize: 7, marginBottom: 2 }}>‹ share aura</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 6 }}>This Week</Text>
        {t.items.slice(0, 6).map((item, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF9F0A", marginRight: 5 }} />
            <Text style={{ color: "#FDE68A", fontSize: 8 }}>
              {item.km.toFixed(1)} kilometer {item.type}
            </Text>
          </View>
        ))}
      </View>
    ),
  },
  {
    id: "totals-table",
    name: "Totals Table",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, justifyContent: "center", padding: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8, fontWeight: "700" }]}>THIS WEEK</Text>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8, fontWeight: "700" }]}>TOTALS</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>RUNNING</Text>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>{t.runKm.toFixed(1)} KM</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>RIDE/WALK</Text>
          <Text style={[mono, { color: "#FFFFFF", fontSize: 8 }]}>{t.walkKm.toFixed(1)} KM</Text>
        </View>
      </View>
    ),
  },
  {
    id: "big-stack",
    name: "Big Stack",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "900", textAlign: "center", lineHeight: 22 }}>
          {t.walkKm.toFixed(1)} KM RIDE{"\n"}{t.runKm.toFixed(1)} KM RUN
        </Text>
      </View>
    ),
  },
  {
    id: "serif-week-row",
    name: "Serif Week Row",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, justifyContent: "center", padding: 8 }}>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 8, marginBottom: 4 }]}>This Week</Text>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 16, fontStyle: "italic" }]}>
          {t.totalKm.toFixed(1)} km  {Math.floor(t.totalMinutes / 60)}h {t.totalMinutes % 60}m  0 m
        </Text>
      </View>
    ),
  },
  {
    id: "week-days",
    name: "Week Days",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 8 }}>
        <Text style={[serif, { color: "#FFFFFF", fontSize: 11, marginBottom: 8 }]}>
          This Week: <Text style={{ fontStyle: "italic" }}>{t.totalKm.toFixed(1)} km</Text>
        </Text>
        <View style={{ flexDirection: "row", gap: 20 }}>
          {t.items.slice(0, 2).map((item, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={{ color: "#999999", fontSize: 7, fontWeight: "700", marginBottom: 2 }}>
                {["TUE", "WED"][i]}
              </Text>
              <Text style={[serif, { color: "#FFFFFF", fontSize: 15, fontStyle: "italic" }]}>{item.km.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      </View>
    ),
  },
  {
    id: "this-week-big",
    name: "This Week Big",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700", letterSpacing: 2, marginBottom: 3 }}>
          THIS WEEK
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "900", letterSpacing: -1 }}>
          {t.totalKm.toFixed(2)} KM
        </Text>
      </View>
    ),
  },
  {
    id: "this-week-runner",
    name: "Runner Week",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 8, fontWeight: "700", letterSpacing: 2, marginBottom: 3 }}>
          THIS WEEK
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 13, marginRight: 4 }}>🏃</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>{t.totalKm.toFixed(1)} KM</Text>
        </View>
      </View>
    ),
  },
  {
    id: "week-running-bold",
    name: "Week Running Bold",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "800", letterSpacing: 1 }}>
          THIS WEEK   RUNNING
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: -1 }}>
          {t.runKm.toFixed(2)} KM
        </Text>
      </View>
    ),
  },
  {
    id: "blue-runner-week",
    name: "Blue Runner",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 20, color: "#0A84FF" }}>🏃</Text>
        <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 4 }}>
          {t.runKm.toFixed(2)} KM
        </Text>
      </View>
    ),
  },
  {
    id: "imessage-week",
    name: "iMessage Week",
    tab: "totals",
    render: (_a, t) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {t.items.slice(0, 2).map((item, i) => (
          <Bubble key={i}>{`${item.type === "run" ? "Ran" : "Walked"} ${item.km.toFixed(2)} km`}</Bubble>
        ))}
        <Text style={{ color: "#8E8E93", fontSize: 8, marginTop: 3 }}>Completed</Text>
      </View>
    ),
  },
];

export function computeWeekTotals(activities: Activity[]): WeekTotals {
  const runKm = activities.filter((a) => a.type === "run").reduce((s, a) => s + a.distance, 0);
  const walkKm = activities.filter((a) => a.type !== "run").reduce((s, a) => s + a.distance, 0);
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);
  return {
    runKm,
    walkKm,
    totalKm: runKm + walkKm,
    totalMinutes,
    items: activities.map((a) => ({ day: a.date, km: a.distance, type: a.type === "ride" ? "ride" : a.type })),
  };
}

/**
 * Sticker registry — all 54 data-driven stickers across 8 visual themes.
 *
 * Ported from the design-handoff stickers.js. Each sticker is a pure function
 * of (activity, totals, palette, units) and renders as a React Native View tree.
 *
 * Theme index:
 *   LED (6)      — dot-matrix glow, IBM Plex Mono
 *   Mono (7)     — minimal white-on-photo, clean layout
 *   Terminal (6) — monospace readout with borders
 *   Glass (6)    — blurred glass panels
 *   Chart (6)    — sparklines, bars, route lines
 *   Poster (6)   — bold oversized typography
 *   Tape (5)     — rotated cutout / paper texture
 *   Serif (8)    — editorial Instrument Serif
 *   + 4 adaptive/smart helpers
 */
import React from "react";
import { Text, View } from "react-native";
import type { StickerDef, StickerContext } from "./types";
import {
  dist,
  distUnit,
  distUnitShort,
  dur,
  durWords,
  pace,
  paceUnit,
  speed,
  speedUnit,
  elev,
  elevUnit,
  dateShort,
  dateFull,
  weekday,
  time12,
  typeLabel,
  NS,
  fields,
} from "./formatters";
import { FONT_UI, FONT_MONO, FONT_SERIF } from "../_core/theme";

// ── Shared text primitives ───────────────────────────────────

function Label({
  c,
  size = 9,
  children,
  style,
}: {
  c: { sub: string; accent?: string };
  size?: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text
      style={{
        fontFamily: FONT_UI,
        fontWeight: "700",
        fontSize: size,
        lineHeight: size * 1.1,
        letterSpacing: 0.16 * size,
        color: c.sub ?? c.accent,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

function Huge({
  c,
  size = 64,
  children,
  style,
}: {
  c: { ink: string; accent?: string };
  size?: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text
      style={{
        fontFamily: FONT_UI,
        fontWeight: "900",
        fontSize: size,
        lineHeight: size * 0.86,
        letterSpacing: -0.03 * size,
        color: (style as any)?.color ?? c.ink,
        textShadowColor: "rgba(0,0,0,0.45)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 14,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

function MonoTxt({
  c,
  size = 12,
  children,
  style,
}: {
  c: { ink: string; accent?: string };
  size?: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text
      style={{
        fontFamily: FONT_MONO,
        fontWeight: "500",
        fontSize: size,
        lineHeight: size * 1.35,
        letterSpacing: 0.04 * size,
        color: c.ink,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

function LedTxt({
  c,
  size,
  children,
  style,
}: {
  c: { accent: string };
  size: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text
      style={{
        fontFamily: FONT_MONO,
        fontWeight: "700",
        fontSize: size,
        lineHeight: size,
        letterSpacing: 0.06 * size,
        color: c.accent,
        textShadowColor: c.accent,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

function SerifTxt({
  c,
  size,
  children,
  style,
}: {
  c: { ink: string };
  size: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text
      style={{
        fontFamily: FONT_SERIF,
        fontWeight: "400",
        fontSize: size,
        lineHeight: size * 1.1,
        color: c.ink,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

// ── Glass / Terminal box style presets ────────────────────────

function glassBox(c: { hair: string }) {
  return {
    backgroundColor: "rgba(16,16,18,0.42)",
    borderWidth: 1,
    borderColor: c.hair,
    borderRadius: 20,
    padding: 16,
  };
}

function termBox(c: { accent: string; hair: string }) {
  return {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: c.hair,
    borderRadius: 4,
    padding: 10,
    paddingHorizontal: 12,
  };
}

function hairBorder(c: { hair: string }) {
  return { borderBottomWidth: 1, borderColor: c.hair };
}

// ── Helper: N top fields by salience ──────────────────────────

function topFields(ctx: StickerContext, n: number) {
  return fields(ctx.a, ctx.u).slice(0, n);
}

// ──────────────────────────────────────────────────────────────
// STICKER DEFINITIONS
// ──────────────────────────────────────────────────────────────

export const STICKERS: StickerDef[] = [];

function mk(
  id: string,
  name: string,
  cat: string,
  theme: StickerDef["theme"],
  w: number,
  render: (ctx: StickerContext) => React.ReactNode,
) {
  STICKERS.push({ id, name, cat, theme, w, render });
}

// ═══════════════ LED / DOT MATRIX (6) ═══════════════════════

mk("led-distance", "LED Distance", "distance", "led", 210, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Label c={c} size={8} style={{ color: c.accent, opacity: 0.8 }}>
        DISTANCE
      </Label>
      <LedTxt c={c} size={54}>
        {dist(a, u)}
      </LedTxt>
      <Label c={c} size={9} style={{ color: c.accent, opacity: 0.7 }}>
        {distUnit(u)}
      </Label>
    </View>
  );
});

mk("led-pace", "LED Pace", "pace", "led", 180, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      <LedTxt c={c} size={44}>
        {pace(a, u)}
      </LedTxt>
      <Label c={c} size={8} style={{ color: c.accent, opacity: 0.75 }}>
        {paceUnit(u)}
      </Label>
    </View>
  );
});

mk("led-time", "LED Clock", "time", "led", 220, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      <LedTxt c={c} size={46}>
        {dur(a.duration)}
      </LedTxt>
      <Label c={c} size={8} style={{ color: c.accent, opacity: 0.75 }}>
        MOVING TIME
      </Label>
    </View>
  );
});

mk("led-week", "LED Week Total", "totals", "led", 210, (ctx) => {
  const { t, u, c } = ctx;
  const km =
    u === "imperial" ? (t.totalKm * 0.621371).toFixed(1) : t.totalKm.toFixed(1);
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Label c={c} size={8} style={{ color: c.accent, opacity: 0.8 }}>
        THIS WEEK
      </Label>
      <LedTxt c={c} size={50}>
        {km}
      </LedTxt>
      <Label c={c} size={8} style={{ color: c.accent, opacity: 0.7 }}>
        {distUnit(u)} · {t.count} ACTIVITIES
      </Label>
    </View>
  );
});

mk("led-splits", "LED Split Board", "splits", "led", 230, (ctx) => {
  const { a, c } = ctx;
  // Splits are not in the existing Activity type — show placeholder
  return (
    <View
      style={{
        gap: 5,
        padding: 12,
        borderWidth: 1,
        borderColor: c.accent + "55",
        borderRadius: 6,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <Label c={c} size={8} style={{ color: c.accent }}>
        SPLITS
      </Label>
      <LedTxt c={c} size={11} style={{ opacity: 0.65 }}>
        {NS}
      </LedTxt>
    </View>
  );
});

mk("led-elev", "LED Elevation", "elev", "led", 200, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Label c={c} size={8} style={{ color: c.accent, opacity: 0.8 }}>
        ELEVATION
      </Label>
      <LedTxt c={c} size={48}>
        {String(elev(a, u))}
      </LedTxt>
      <Label c={c} size={9} style={{ color: c.accent, opacity: 0.7 }}>
        {elevUnit(u)}
      </Label>
    </View>
  );
});

// ═══════════════ MINIMAL MONO (7) ═══════════════════════════

mk("mono-stack", "Mono Stack", "multi", "mono", 200, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 3);
  return (
    <View style={{ gap: 10 }}>
      {f.map((x, i) => (
        <View key={x.k} style={{ gap: 1 }}>
          <Label c={c} size={8}>
            {x.label}
          </Label>
          <Huge c={c} size={i === 0 ? 42 : 26}>
            {x.v}
            {x.unit ? " " + x.unit : ""}
          </Huge>
        </View>
      ))}
    </View>
  );
});

mk("mono-single", "Mono Distance", "distance", "mono", 190, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ gap: 2 }}>
      <Huge c={c} size={62}>
        {dist(a, u)}
      </Huge>
      <Label c={c} size={10}>
        {distUnit(u)}
      </Label>
    </View>
  );
});

mk("mono-corner", "Mono Corner Set", "multi", "mono", 240, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 4);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width: 240 }}>
      {f.map((x) => (
        <View key={x.k} style={{ width: "50%", gap: 1, marginBottom: 14 }}>
          <Label c={c} size={7.5}>
            {x.label}
          </Label>
          <Huge c={c} size={22} style={{ letterSpacing: -0.02 * 22 }}>
            {x.v}
          </Huge>
        </View>
      ))}
    </View>
  );
});

mk("mono-line", "Mono Rule Line", "multi", "mono", 250, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 3);
  return (
    <View
      style={{
        borderTopWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: c.ink,
        paddingVertical: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 14 }}>
        {f.map((x) => (
          <View key={x.k} style={{ gap: 1 }}>
            <Label c={c} size={7}>
              {x.label}
            </Label>
            <MonoTxt c={c} size={15} style={{ fontWeight: "700" }}>
              {x.v}
            </MonoTxt>
          </View>
        ))}
      </View>
    </View>
  );
});

mk("mono-date", "Mono Date Caps", "date", "mono", 230, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ gap: 3 }}>
      <Huge c={c} size={30}>
        {weekday(a)}
      </Huge>
      <Label c={c} size={9} style={{ letterSpacing: 0.3 * 9 }}>
        {dateShort(a)} · {time12(a)}
      </Label>
    </View>
  );
});

mk("mono-pace-time", "Mono Pace / Time", "pace", "mono", 220, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 18 }}>
      <View style={{ gap: 1 }}>
        <Label c={c} size={8}>
          PACE
        </Label>
        <Huge c={c} size={36}>
          {pace(a, u)}
        </Huge>
      </View>
      <View style={{ width: 1, height: 40, backgroundColor: c.hair }} />
      <View style={{ gap: 1 }}>
        <Label c={c} size={8}>
          TIME
        </Label>
        <Huge c={c} size={36}>
          {dur(a.duration)}
        </Huge>
      </View>
    </View>
  );
});

mk("mono-elev", "Mono Elevation", "elev", "mono", 190, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ gap: 2 }}>
      <Huge c={c} size={56}>
        {String(elev(a, u))}
      </Huge>
      <Label c={c} size={10}>
        {elevUnit(u)}
      </Label>
    </View>
  );
});

// ═══════════════ TERMINAL (6) ═══════════════════════════════

mk("term-readout", "Terminal Readout", "multi", "terminal", 250, (ctx) => {
  const { a, u, c } = ctx;
  const f = topFields(ctx, 5);
  return (
    <View style={termBox(c)}>
      <MonoTxt c={c} size={9} style={{ color: c.accent }}>
        {`> ${typeLabel(a)} ${dateShort(a)}`}
      </MonoTxt>
      {f.map((x) => (
        <View key={x.k} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
          <MonoTxt c={c} size={10} style={{ opacity: 0.6 }}>
            {x.label}
          </MonoTxt>
          <MonoTxt c={c} size={12} style={{ fontWeight: "700" }}>
            {x.v}
            {x.unit ? " " + x.unit : ""}
          </MonoTxt>
        </View>
      ))}
      <MonoTxt c={c} size={8} style={{ color: c.accent, opacity: 0.7, marginTop: 4 }}>
        SYS:ONLINE ▍
      </MonoTxt>
    </View>
  );
});

mk("term-log", "System Log", "multi", "terminal", 260, (ctx) => {
  const { a, u, c } = ctx;
  const logLines = [
    `[00:00] START ${a.title || NS}`,
    `[--:--] DIST ${dist(a, u)} ${distUnitShort(u)}`,
    `[--:--] PACE ${pace(a, u)}`,
    `[--:--] HR ${a.hasHeartrate && a.heartRate ? a.heartRate + " AVG / " + (a.maxHeartRate ?? "--") + " MAX" : NS}`,
    `[${dur(a.duration)}] END`,
  ];
  return (
    <View style={{ ...termBox(c), gap: 2 }}>
      {logLines.map((l, i) => (
        <MonoTxt key={i} c={c} size={9.5} style={{ opacity: 0.85 }}>
          {l}
        </MonoTxt>
      ))}
    </View>
  );
});

mk("term-splits", "Split Table", "splits", "terminal", 240, (ctx) => {
  const { u, c } = ctx;
  return (
    <View style={termBox(c)}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          ...hairBorder(c),
          paddingBottom: 4,
        }}
      >
        <MonoTxt c={c} size={8} style={{ color: c.accent }}>
          {u === "imperial" ? "MI" : "KM"}
        </MonoTxt>
        <MonoTxt c={c} size={8} style={{ color: c.accent }}>
          TIME
        </MonoTxt>
        <MonoTxt c={c} size={8} style={{ color: c.accent }}>
          HR
        </MonoTxt>
      </View>
      <MonoTxt c={c} size={10} style={{ opacity: 0.5, marginTop: 8 }}>
        {NS}
      </MonoTxt>
    </View>
  );
});

mk("term-gear", "Gear Tag", "gear", "terminal", 200, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ ...termBox(c), gap: 2 }}>
      <MonoTxt c={c} size={8} style={{ color: c.accent }}>
        GEAR
      </MonoTxt>
      <MonoTxt c={c} size={12} style={{ fontWeight: "700" }}>
        {a.deviceName || NS}
      </MonoTxt>
      <MonoTxt c={c} size={8} style={{ opacity: 0.6 }}>
        Connected
      </MonoTxt>
    </View>
  );
});

mk("term-weather", "Weather Strip", "weather", "terminal", 230, (ctx) => {
  const { a, c } = ctx;
  const temp = a.averageTemp != null ? `${a.averageTemp}°` : "--";
  return (
    <View style={{ ...termBox(c), flexDirection: "row", alignItems: "center", gap: 10 }}>
      <MonoTxt c={c} size={22} style={{ fontWeight: "700" }}>
        {temp}
      </MonoTxt>
      <View style={{ gap: 1 }}>
        <MonoTxt c={c} size={9} style={{ opacity: 0.7 }}>
          {a.averageTemp != null ? "RECORDED" : NS}
        </MonoTxt>
        <MonoTxt c={c} size={9} style={{ opacity: 0.7 }}>
          {NS}
        </MonoTxt>
      </View>
    </View>
  );
});

mk("term-stats", "Terminal Stats", "multi", "terminal", 250, (ctx) => {
  const { a, u, c } = ctx;
  const f = topFields(ctx, 6);
  return (
    <View style={{ ...termBox(c), gap: 3 }}>
      <MonoTxt c={c} size={9} style={{ color: c.accent, marginBottom: 2 }}>
        {typeLabel(a)} STATS
      </MonoTxt>
      {f.map((x) => (
        <View key={x.k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <MonoTxt c={c} size={9.5} style={{ opacity: 0.55 }}>
            {x.label}
          </MonoTxt>
          <MonoTxt c={c} size={10} style={{ fontWeight: "700" }}>
            {x.v} {x.unit}
          </MonoTxt>
        </View>
      ))}
    </View>
  );
});

// ═══════════════ GLASSMORPHIC (6) ═══════════════════════════

mk("glass-summary", "Glass Summary", "multi", "glass", 260, (ctx) => {
  const { a, u, c } = ctx;
  const f = fields(ctx.a, ctx.u)
    .filter((x) => x.k !== "distance")
    .slice(0, 3);
  return (
    <View style={{ ...glassBox(c), gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} />
        <Label c={c} size={8}>
          {typeLabel(a)} · {dateShort(a)}
        </Label>
      </View>
      <Huge c={c} size={44}>
        {dist(a, u)}
      </Huge>
      <View style={{ flexDirection: "row", gap: 16 }}>
        {f.map((x) => (
          <View key={x.k} style={{ gap: 1 }}>
            <Label c={c} size={7}>
              {x.label}
            </Label>
            <MonoTxt c={c} size={13} style={{ fontWeight: "700" }}>
              {x.v}
            </MonoTxt>
          </View>
        ))}
      </View>
    </View>
  );
});

mk("glass-pills", "Glass Pill Row", "multi", "glass", 270, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 4);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {f.map((x) => (
        <View
          key={x.k}
          style={{
            ...glassBox(c),
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            paddingVertical: 7,
            paddingHorizontal: 12,
          }}
        >
          <Label c={c} size={7}>
            {x.label}
          </Label>
          <MonoTxt c={c} size={12} style={{ fontWeight: "700" }}>
            {x.v}
          </MonoTxt>
        </View>
      ))}
    </View>
  );
});

mk("glass-hr", "Glass Heart Rate", "hr", "glass", 250, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ ...glassBox(c), gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label c={c} size={8}>
          HEART RATE
        </Label>
        <MonoTxt c={c} size={10} style={{ color: c.accent }}>
          {a.maxHeartRate != null ? `MAX ${a.maxHeartRate}` : NS}
        </MonoTxt>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Huge c={c} size={30}>
          {a.hasHeartrate && a.heartRate != null ? String(a.heartRate) : "--"}
        </Huge>
        <Label c={c} size={8}>
          BPM AVG
        </Label>
      </View>
    </View>
  );
});

mk("glass-route", "Glass Route Card", "route", "glass", 230, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ ...glassBox(c), gap: 8 }}>
      <MonoTxt c={c} size={11}>
        {a.title || a.startDate ? dateShort(a) : NS}
      </MonoTxt>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <View style={{ gap: 1 }}>
          <Label c={c} size={7}>
            DISTANCE
          </Label>
          <MonoTxt c={c} size={13} style={{ fontWeight: "700" }}>
            {dist(a, u)}
          </MonoTxt>
        </View>
        <View style={{ gap: 1 }}>
          <Label c={c} size={7}>
            ELEV
          </Label>
          <MonoTxt c={c} size={13} style={{ fontWeight: "700" }}>
            {String(elev(a, u))}
          </MonoTxt>
        </View>
      </View>
    </View>
  );
});

mk("glass-pr", "Glass Personal Best", "achievement", "glass", 240, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ ...glassBox(c), gap: 6, borderColor: c.accent + "88" }}>
      <Label c={c} size={8} style={{ color: c.accent }}>
        PERSONAL RECORD
      </Label>
      <Huge c={c} size={26}>
        {a.sufferScore != null && a.sufferScore > 0 ? "SUFFER " + a.sufferScore : NS}
      </Huge>
      <MonoTxt c={c} size={12} style={{ fontWeight: "700" }}>
        {NS}
      </MonoTxt>
    </View>
  );
});

mk("glass-elev", "Glass Elevation", "elev", "glass", 250, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ ...glassBox(c), gap: 8 }}>
      <Label c={c} size={8}>
        ELEVATION PROFILE
      </Label>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Huge c={c} size={28}>
          {String(elev(a, u))}
        </Huge>
        <Label c={c} size={8}>
          {elevUnit(u)}
        </Label>
      </View>
    </View>
  );
});

// ═══════════════ CHART-DRIVEN (6) ═══════════════════════════

mk("chart-hr", "HR Graph", "hr", "chart", 250, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ gap: 6 }}>
      <Label c={c} size={8}>
        HEART RATE
      </Label>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MonoTxt c={c} size={11} style={{ fontWeight: "700" }}>
          {a.hasHeartrate && a.heartRate != null ? `AVG ${a.heartRate}` : "--"}
        </MonoTxt>
        <MonoTxt c={c} size={11} style={{ opacity: 0.6 }}>
          {a.maxHeartRate != null ? `MAX ${a.maxHeartRate}` : "--"}
        </MonoTxt>
      </View>
    </View>
  );
});

mk("chart-elev", "Elevation Profile", "elev", "chart", 250, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label c={c} size={8}>
          ELEVATION
        </Label>
        <MonoTxt c={c} size={10} style={{ color: c.accent }}>
          +{elev(a, u)} {u === "imperial" ? "ft" : "m"}
        </MonoTxt>
      </View>
    </View>
  );
});

mk("chart-route", "Route Line", "route", "chart", 210, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ gap: 6 }}>
      <MonoTxt c={c} size={11} style={{ fontWeight: "700" }}>
        {dist(a, u)} {distUnitShort(u)}
      </MonoTxt>
      <MonoTxt c={c} size={10} style={{ opacity: 0.6 }}>
        {a.title || NS}
      </MonoTxt>
    </View>
  );
});

mk("chart-splits", "Split Bars", "splits", "chart", 250, (ctx) => {
  const { c } = ctx;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label c={c} size={8}>
          SPLITS
        </Label>
        <MonoTxt c={c} size={9} style={{ color: c.accent }}>
          {NS}
        </MonoTxt>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <MonoTxt c={c} size={8} style={{ opacity: 0.55 }}>
          {NS}
        </MonoTxt>
      </View>
    </View>
  );
});

mk("chart-week", "Week Bars", "totals", "chart", 250, (ctx) => {
  const { t, c } = ctx;
  return (
    <View style={{ gap: 8 }}>
      <Label c={c} size={8}>
        LAST 7 DAYS
      </Label>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {t.days.map((d, i) => (
          <View key={i} style={{ alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 28,
                height: Math.max(4, d.km * 2),
                borderRadius: 3,
                backgroundColor: d.km > 0 ? c.accent : c.hair,
                opacity: d.km > 0 ? 0.9 : 0.3,
              }}
            />
            <MonoTxt c={c} size={7.5} style={{ opacity: 0.5 }}>
              {d.day}
            </MonoTxt>
          </View>
        ))}
      </View>
    </View>
  );
});

mk("chart-zones", "HR Zones", "hr", "chart", 240, (ctx) => {
  const { c } = ctx;
  // HR zones are not in the existing Activity type
  return (
    <View style={{ gap: 6 }}>
      <Label c={c} size={8}>
        TIME IN ZONE
      </Label>
      <MonoTxt c={c} size={12} style={{ fontWeight: "700" }}>
        {NS}
      </MonoTxt>
    </View>
  );
});

// ═══════════════ BOLD POSTER (6) ═══════════════════════════

mk("poster-distance", "Poster Distance", "distance", "poster", 260, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ gap: -4 }}>
      <Huge c={c} size={96} style={{ letterSpacing: -0.05 * 96 }}>
        {dist(a, u)}
      </Huge>
      <Label c={c} size={13} style={{ letterSpacing: 0.42 * 13, color: c.ink }}>
        {distUnitShort(u).toUpperCase()}
      </Label>
    </View>
  );
});

mk("poster-verb", "Poster Verb", "multi", "poster", 240, (ctx) => {
  const { a, u, c } = ctx;
  const verb =
    a.type === "ride" ? "RODE" : a.type === "run" ? "RAN" : "TRAINED";
  return (
    <View style={{ gap: -6 }}>
      <Huge c={c} size={52}>
        {verb}
      </Huge>
      <Huge c={c} size={52} style={{ color: c.accent }}>
        {dist(a, u)}
        {distUnitShort(u)}
      </Huge>
      <Label c={c} size={9} style={{ marginTop: 8 }}>
        {weekday(a)} · {dur(a.duration)}
      </Label>
    </View>
  );
});

mk("poster-numbers", "Poster Numbers", "multi", "poster", 270, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 3);
  return (
    <View style={{ gap: 6 }}>
      {f.map((x, i) => (
        <View
          key={x.k}
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 8,
            ...(i < 2 ? hairBorder(c) : {}),
            paddingBottom: 6,
          }}
        >
          <Huge
            c={c}
            size={i === 0 ? 46 : 30}
            style={i === 0 ? { color: c.accent } : undefined}
          >
            {x.v}
          </Huge>
          <Label c={c} size={8}>
            {x.unit} {x.label}
          </Label>
        </View>
      ))}
    </View>
  );
});

mk("poster-vertical", "Poster Vertical", "distance", "poster", 120, (ctx) => {
  const { a, u, c } = ctx;
  const parts = dist(a, u).split(".");
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Huge c={c} size={58}>
        {parts[0]}
      </Huge>
      <Huge c={c} size={26} style={{ color: c.accent }}>
        .{parts[1] || "00"}
      </Huge>
      <Label c={c} size={9} style={{ letterSpacing: 0.3 * 9 }}>
        {distUnit(u)}
      </Label>
    </View>
  );
});

mk("poster-block", "Poster Block", "multi", "poster", 250, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 3);
  return (
    <View style={{ flexDirection: "row" }}>
      {f.map((x, i) => (
        <View
          key={x.k}
          style={{
            flex: 1,
            gap: 2,
            padding: 12,
            paddingHorizontal: 10,
            backgroundColor:
              i === 0 ? c.accent : "rgba(0,0,0,0.55)",
          }}
        >
          <Label
            c={c}
            size={7}
            style={{ color: i === 0 ? "#0B0B0C" : c.sub }}
          >
            {x.label}
          </Label>
          <Huge
            c={c}
            size={22}
            style={{
              color: i === 0 ? "#0B0B0C" : c.ink,
              textShadowColor: i === 0 ? "transparent" : undefined,
            }}
          >
            {x.v}
          </Huge>
        </View>
      ))}
    </View>
  );
});

mk("poster-outline", "Poster Outline", "distance", "poster", 250, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "900",
          fontSize: 78,
          lineHeight: 78 * 0.86,
          letterSpacing: -0.04 * 78,
          color: "transparent",
          // Outline effect via shadow trick (no native text stroke)
          textShadowColor: c.ink,
          textShadowOffset: { width: 2, height: 0 },
          textShadowRadius: 0,
        }}
      >
        {dist(a, u)}
      </Text>
      <Label c={c} size={10} style={{ letterSpacing: 0.34 * 10 }}>
        {distUnit(u)} · {dateShort(a)}
      </Label>
    </View>
  );
});

// ═══════════════ TAPE / CUTOUT (5) ══════════════════════════

mk("tape-note", "Taped Note", "multi", "tape", 220, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View
      style={{
        transform: [{ rotate: "-2.5deg" }],
        backgroundColor: "#F4F1E8",
        borderRadius: 2,
        padding: 14,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 26,
        elevation: 8,
      }}
    >
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "700",
          fontSize: 9,
          lineHeight: 9,
          letterSpacing: 0.2 * 9,
          color: "#8A8578",
        }}
      >
        {dateShort(a)}
      </Text>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "900",
          fontSize: 34,
          lineHeight: 34 * 0.9,
          letterSpacing: -0.02 * 34,
          color: "#141414",
        }}
      >
        {dist(a, u)} {distUnitShort(u)}
      </Text>
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "500",
          fontSize: 11,
          lineHeight: 11 * 1.4,
          color: "#3A362E",
        }}
      >
        {dur(a.duration)} · {pace(a, u)}
        {u === "imperial" ? "/mi" : "/km"}
      </Text>
    </View>
  );
});

mk("tape-polaroid", "Polaroid Stat", "multi", "tape", 200, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View
      style={{
        transform: [{ rotate: "2deg" }],
        backgroundColor: "#FBFAF6",
        padding: 10,
        paddingBottom: 26,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.45,
        shadowRadius: 34,
        elevation: 10,
      }}
    >
      <View
        style={{
          height: 120,
          justifyContent: "flex-end",
          padding: 10,
        }}
      >
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "900",
            fontSize: 30,
            lineHeight: 30,
            color: c.ink,
          }}
        >
          {dist(a, u)}
          {distUnitShort(u)}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "500",
          fontSize: 10,
          lineHeight: 10,
          color: "#2A2724",
          marginTop: 10,
        }}
      >
        {dateFull(a)} · {dur(a.duration)}
      </Text>
    </View>
  );
});

mk("tape-badge", "Cutout Badge", "achievement", "tape", 170, (ctx) => {
  const { a, c } = ctx;
  return (
    <View
      style={{
        transform: [{ rotate: "-4deg" }],
        backgroundColor: c.accent,
        padding: 12,
        paddingHorizontal: 16,
        borderRadius: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 26,
        elevation: 6,
      }}
    >
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "700",
          fontSize: 8,
          lineHeight: 8,
          letterSpacing: 0.24 * 8,
          color: "#0B0B0C",
        }}
      >
        ACHIEVEMENT
      </Text>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "900",
          fontSize: 24,
          lineHeight: 24,
          color: "#0B0B0C",
          marginTop: 4,
        }}
      >
        {a.sufferScore != null ? `${a.sufferScore}× SUFFER` : NS}
      </Text>
    </View>
  );
});

mk("tape-ticket", "Ticket Stub", "date", "tape", 250, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F4F1E8",
        transform: [{ rotate: "1.5deg" }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 26,
        elevation: 6,
      }}
    >
      <View style={{ flex: 1, padding: 10, paddingHorizontal: 12, gap: 2 }}>
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontWeight: "700",
            fontSize: 8,
            letterSpacing: 0.2 * 8,
            color: "#8A8578",
          }}
        >
          STRIDESTUDIO
        </Text>
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "900",
            fontSize: 20,
            lineHeight: 20,
            color: "#141414",
          }}
        >
          {a.title || NS}
        </Text>
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontWeight: "500",
            fontSize: 10,
            color: "#3A362E",
          }}
        >
          {dateShort(a)} · {time12(a)}
        </Text>
      </View>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 10,
          paddingHorizontal: 12,
          borderLeftWidth: 1.5,
          borderStyle: "dashed",
          borderColor: "#C9C4B4",
          gap: 2,
        }}
      >
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "900",
            fontSize: 22,
            lineHeight: 22,
            color: "#141414",
          }}
        >
          {dist(a, u)}
        </Text>
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontWeight: "700",
            fontSize: 7,
            letterSpacing: 0.16 * 7,
            color: "#141414",
          }}
        >
          {distUnitShort(u).toUpperCase()}
        </Text>
      </View>
    </View>
  );
});

mk("tape-receipt", "Receipt", "multi", "tape", 230, (ctx) => {
  const { a, u } = ctx;
  const f = topFields(ctx, 5);
  return (
    <View
      style={{
        transform: [{ rotate: "-1deg" }],
        backgroundColor: "#FBFAF6",
        padding: 14,
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 26,
        elevation: 6,
      }}
    >
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "700",
          fontSize: 8,
          letterSpacing: 0.24 * 8,
          color: "#8A8578",
          textAlign: "center",
        }}
      >
        {dateFull(a)}
      </Text>
      <View style={{ height: 1, backgroundColor: "#C9C4B4", marginVertical: 4 }} />
      {f.map((x) => (
        <View key={x.k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={{
              fontFamily: FONT_MONO,
              fontWeight: "500",
              fontSize: 10,
              color: "#8A8578",
            }}
          >
            {x.label}
          </Text>
          <Text
            style={{
              fontFamily: FONT_MONO,
              fontWeight: "700",
              fontSize: 10,
              color: "#2A2724",
            }}
          >
            {x.v} {x.unit}
          </Text>
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: "#C9C4B4", marginVertical: 4 }} />
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontWeight: "500",
          fontSize: 8,
          color: "#8A8578",
          textAlign: "center",
        }}
      >
        THANK YOU
      </Text>
    </View>
  );
});

// ═══════════════ EDITORIAL SERIF (8) ═════════════════════════

mk("serif-editorial", "Editorial Hero", "multi", "serif", 260, (ctx) => {
  const { a, u, c } = ctx;
  const f = topFields(ctx, 4).slice(1);
  return (
    <View style={{ gap: 6 }}>
      <Label c={c} size={8} style={{ letterSpacing: 0.3 * 8 }}>
        {dateFull(a)}
      </Label>
      <SerifTxt c={c} size={46}>
        {dist(a, u)} {distUnitShort(u)}
      </SerifTxt>
      <View style={{ height: 1, backgroundColor: c.hair }} />
      <View style={{ flexDirection: "row", gap: 14 }}>
        {f.map((x) => (
          <View key={x.k} style={{ gap: 1 }}>
            <Label c={c} size={7}>
              {x.label}
            </Label>
            <SerifTxt c={c} size={15}>
              {x.v}
            </SerifTxt>
          </View>
        ))}
      </View>
    </View>
  );
});

mk("serif-quote", "Serif Quote", "multi", "serif", 250, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ gap: 8 }}>
      <SerifTxt c={c} size={26} style={{ fontStyle: "italic" }}>
        "{a.title || NS}"
      </SerifTxt>
      <Label c={c} size={8}>
        {weekday(a)} · {dur(a.duration)}
      </Label>
    </View>
  );
});

mk("serif-masthead", "Masthead", "date", "serif", 270, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View
      style={{
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: c.ink,
        paddingVertical: 8,
        gap: 2,
      }}
    >
      <SerifTxt c={c} size={30} style={{ textAlign: "center" }}>
        THE DAILY MILE
      </SerifTxt>
      <Label c={c} size={7} style={{ textAlign: "center", letterSpacing: 0.28 * 7 }}>
        {dateFull(a)} · {dist(a, u)} {distUnitShort(u)}
      </Label>
    </View>
  );
});

mk("serif-pair", "Serif Stat Pair", "multi", "serif", 230, (ctx) => {
  const { a, u, c } = ctx;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 20 }}>
      <View>
        <SerifTxt c={c} size={40}>
          {dist(a, u)}
        </SerifTxt>
        <Label c={c} size={7}>
          {distUnit(u)}
        </Label>
      </View>
      <View>
        <Text style={{ fontFamily: FONT_SERIF, fontWeight: "400", fontSize: 40, color: c.accent }}>
          {pace(a, u)}
        </Text>
        <Label c={c} size={7}>
          {paceUnit(u)}
        </Label>
      </View>
    </View>
  );
});

mk("serif-pr", "Serif Record", "achievement", "serif", 240, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ gap: 4 }}>
      <Label c={c} size={8} style={{ color: c.accent, letterSpacing: 0.28 * 8 }}>
        NEW RECORD
      </Label>
      <SerifTxt c={c} size={28}>
        {a.sufferScore != null && a.sufferScore > 0 ? "SUFFER SCORE" : NS}
      </SerifTxt>
      <SerifTxt c={c} size={18} style={{ fontStyle: "italic", color: c.sub }}>
        {a.sufferScore != null ? String(a.sufferScore) : ""}
      </SerifTxt>
    </View>
  );
});

mk("serif-caption", "Serif Caption", "date", "serif", 220, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ gap: 2 }}>
      <SerifTxt c={c} size={20} style={{ fontStyle: "italic" }}>
        {a.title || NS}
      </SerifTxt>
      <Label c={c} size={7.5} style={{ letterSpacing: 0.24 * 7.5 }}>
        {weekday(a)} {time12(a)}
      </Label>
    </View>
  );
});

mk("serif-index", "Serif Index", "multi", "serif", 250, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 5);
  return (
    <View>
      {f.map((x, i) => (
        <View
          key={x.k}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            borderBottomWidth: 1,
            borderColor: c.hair,
            paddingVertical: 5,
          }}
        >
          <Label c={c} size={7.5}>
            {x.label}
          </Label>
          <SerifTxt c={c} size={16} style={{ color: i === 0 ? c.accent : c.ink }}>
            {x.v} {x.unit}
          </SerifTxt>
        </View>
      ))}
    </View>
  );
});

mk("serif-title", "Serif Title", "text", "serif", 240, (ctx) => {
  const { a, c } = ctx;
  return (
    <SerifTxt c={c} size={34} style={{ textAlign: "center" }}>
      {a.title || "UNTITLED"}
    </SerifTxt>
  );
});

// ═══════════════ ADAPTIVE / AUTO (4) ═══════════════════════

mk("auto-adapt", "Auto Adapt", "multi", "mono", 260, (ctx) => {
  const { a, c } = ctx;
  const f = topFields(ctx, 7);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Label c={c} size={8} style={{ color: c.accent }}>
          {typeLabel(a)}
        </Label>
        <Label c={c} size={8}>
          {dateShort(a)}
        </Label>
      </View>
      <Huge c={c} size={40}>
        {f[0].v} {f[0].unit}
      </Huge>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {f.slice(1, 7).map((x) => (
          <View key={x.k} style={{ width: "30%", gap: 1 }}>
            <Label c={c} size={6.5}>
              {x.label}
            </Label>
            <MonoTxt c={c} size={12} style={{ fontWeight: "700" }}>
              {x.v}
            </MonoTxt>
          </View>
        ))}
      </View>
    </View>
  );
});

mk("smart-hero", "Smart Hero", "multi", "mono", 220, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 3);
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Label c={c} size={8}>
        {f[0].label}
      </Label>
      <Huge c={c} size={46} style={{ color: c.accent }}>
        {f[0].v}
      </Huge>
      <View style={{ flexDirection: "row", gap: 14 }}>
        {f.slice(1, 3).map((x) => (
          <View key={x.k} style={{ alignItems: "center", gap: 0 }}>
            <Label c={c} size={6.5}>
              {x.label}
            </Label>
            <MonoTxt c={c} size={11} style={{ fontWeight: "700" }}>
              {x.v}
            </MonoTxt>
          </View>
        ))}
      </View>
    </View>
  );
});

mk("grid-2x2", "2x2 Grid", "multi", "glass", 230, (ctx) => {
  const { c } = ctx;
  const f = topFields(ctx, 4);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: c.hair }}>
      {f.map((x, i) => (
        <View
          key={x.k}
          style={{
            width: "50%",
            padding: 12,
            gap: 1,
            borderRightWidth: i % 2 === 0 ? 1 : 0,
            borderBottomWidth: i < 2 ? 1 : 0,
            borderColor: c.hair,
          }}
        >
          <Label c={c} size={7}>
            {x.label}
          </Label>
          <Huge c={c} size={20} style={{ color: i === 0 ? c.accent : c.ink }}>
            {x.v}
          </Huge>
        </View>
      ))}
    </View>
  );
});

mk("weather-pill", "Weather Pill", "weather", "glass", 230, (ctx) => {
  const { a, c } = ctx;
  const temp = a.averageTemp != null ? `${a.averageTemp}°` : "--";
  return (
    <View
      style={{
        ...glassBox(c),
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.accent }} />
      <MonoTxt c={c} size={11} style={{ fontWeight: "600" }}>
        {temp}
      </MonoTxt>
    </View>
  );
});

// ── Caption / text layer sticker ─────────────────────────────

mk("caption-text", "Caption Text", "text", "mono", 240, (ctx) => {
  const { layer, c } = ctx;
  return (
    <Huge c={c} size={30} style={{ textAlign: "center" }}>
      {(layer && layer.text) || "DOUBLE TAP TO EDIT"}
    </Huge>
  );
});

mk("cadence-power", "Cadence + Power", "multi", "chart", 240, (ctx) => {
  const { a, c } = ctx;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <View style={{ gap: 1 }}>
        <Label c={c} size={7}>
          CADENCE
        </Label>
        <Huge c={c} size={26}>
          {NS}
        </Huge>
        <Label c={c} size={7}>
          SPM
        </Label>
      </View>
      <View style={{ width: 1, backgroundColor: c.hair, height: "100%" }} />
      <View style={{ gap: 1 }}>
        <Label c={c} size={7}>
          POWER
        </Label>
        <Huge c={c} size={26} style={{ color: c.accent }}>
          {NS}
        </Huge>
        <Label c={c} size={7}>
          WATTS
        </Label>
      </View>
    </View>
  );
});

mk("streak-badge", "Streak", "achievement", "poster", 190, (ctx) => {
  const { t, c } = ctx;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "rgba(0,0,0,0.55)",
        borderWidth: 1,
        borderColor: c.accent,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
      }}
    >
      <Huge c={c} size={24} style={{ color: c.accent }}>
        {String(t.streak)}
      </Huge>
      <View style={{ gap: 0 }}>
        <Label c={c} size={7}>
          WEEK STREAK
        </Label>
        <MonoTxt c={c} size={9} style={{ opacity: 0.6 }}>
          {t.count} ACTIVITIES
        </MonoTxt>
      </View>
    </View>
  );
});

mk("week-table", "Week Table", "totals", "terminal", 250, (ctx) => {
  const { t, u, c } = ctx;
  return (
    <View style={{ ...termBox(c), gap: 0 }}>
      <MonoTxt c={c} size={8} style={{ color: c.accent, marginBottom: 4 }}>
        WEEKLY TOTALS
      </MonoTxt>
      {t.days.map((x, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
          <MonoTxt c={c} size={9.5} style={{ opacity: 0.6 }}>
            {x.day}
          </MonoTxt>
          <MonoTxt c={c} size={10} style={{ fontWeight: "700" }}>
            {x.km > 0
              ? `${(u === "imperial" ? x.km * 0.621371 : x.km).toFixed(1)} ${distUnitShort(u)}`
              : "REST"}
          </MonoTxt>
        </View>
      ))}
    </View>
  );
});

mk("month-recap", "Month Recap", "totals", "poster", 250, (ctx) => {
  const { t, u, c } = ctx;
  return (
    <View style={{ gap: 2 }}>
      <Label c={c} size={8} style={{ letterSpacing: 0.3 * 8 }}>
        MONTH RECAP
      </Label>
      <Huge c={c} size={54}>
        {u === "imperial"
          ? (t.monthKm * 0.621371).toFixed(0)
          : t.monthKm.toFixed(0)}
      </Huge>
      <Label c={c} size={9} style={{ color: c.accent }}>
        {distUnit(u)} · {t.monthCount} SESSIONS
      </Label>
    </View>
  );
});

mk("location-pill", "Location Pill", "date", "glass", 230, (ctx) => {
  const { a, c } = ctx;
  return (
    <View
      style={{
        ...glassBox(c),
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.accent }} />
      <MonoTxt c={c} size={11} style={{ fontWeight: "600" }}>
        {a.title || a.startDate ? dateShort(a) : NS}
      </MonoTxt>
    </View>
  );
});

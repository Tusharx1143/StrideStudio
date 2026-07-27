/**
 * Chart primitives — data-driven visual elements for chart-themed stickers.
 *
 * Ported from the handoff prototype's vanillajs SVG helpers.
 * All primitives are pure functions of data + colour palette.
 */
import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Polygon } from "react-native-svg";
import type { PaletteColors } from "./types";

// ── Bar chart ────────────────────────────────────────────────

interface BarsOptions {
  w?: number;
  h?: number;
  gap?: number;
  accentIdx?: number;
}

export function Bars({
  values,
  c,
  opts = {},
}: {
  values: number[];
  c: PaletteColors;
  opts?: BarsOptions;
}) {
  const { w = 200, h = 54, gap = 3, accentIdx = -1 } = opts;
  const max = Math.max(...values, 1);
  const bw = (w - gap * (values.length - 1)) / values.length;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        height: h,
        width: w,
        gap,
      }}
    >
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            width: bw,
            height: Math.max(3, (v / max) * h),
            borderRadius: 2,
            backgroundColor: i === accentIdx ? c.accent : c.ink,
            opacity: i === accentIdx ? 1 : 0.55,
          }}
        />
      ))}
    </View>
  );
}

// ── Sparkline ────────────────────────────────────────────────

interface SparkOptions {
  w?: number;
  h?: number;
  stroke?: number;
  fill?: boolean;
}

export function Sparkline({
  values,
  c,
  opts = {},
}: {
  values: number[];
  c: PaletteColors;
  opts?: SparkOptions;
}) {
  const { w = 210, h = 52, stroke = 2, fill = false } = opts;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rng = max - min || 1;

  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / rng) * (h - stroke * 2) - stroke;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ overflow: "visible" }}
    >
      {fill && (
        <Polygon
          points={`0,${h} ${pts} ${w},${h}`}
          fill={c.accent}
          opacity={0.18}
        />
      )}
      <Polyline
        points={pts}
        fill="none"
        stroke={c.accent}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Route line ───────────────────────────────────────────────

interface RouteOptions {
  w?: number;
  h?: number;
  stroke?: number;
}

export function RouteLine({
  coords,
  c,
  opts = {},
}: {
  coords: [number, number][];
  c: PaletteColors;
  opts?: RouteOptions;
}) {
  const { w = 190, h = 130, stroke: strokeW = 2.5 } = opts;
  const xs = coords.map((p) => p[0]);
  const ys = coords.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = (maxX - minX) || 1;
  const sy = (maxY - minY) || 1;
  const s = Math.min((w - 8) / sx, (h - 8) / sy);

  const pts = coords
    .map(
      (p) =>
        `${(4 + (p[0] - minX) * s).toFixed(1)},${(h - 4 - (p[1] - minY) * s).toFixed(1)}`,
    )
    .join(" ");

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polyline
        points={pts}
        fill="none"
        stroke={c.ink}
        opacity={0.28}
        strokeWidth={strokeW + 3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Polyline
        points={pts}
        fill="none"
        stroke={c.accent}
        strokeWidth={strokeW}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

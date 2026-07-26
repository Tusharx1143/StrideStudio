import { Text, View, StyleSheet } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";
import { decodePolyline, normalizeRoute } from "@/lib/polyline";
import { AppFonts } from "@/constants/fonts";

type RouteMapProps = {
  polyline?: string;
  accent: string;
  height?: number;
};

const PADDING = 16;

export function RouteMap({ polyline, accent, height = 150 }: RouteMapProps) {
  if (!polyline) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>NO GPS ROUTE</Text>
      </View>
    );
  }

  const points = normalizeRoute(decodePolyline(polyline));
  if (points.length < 2) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>NO GPS ROUTE</Text>
      </View>
    );
  }

  // Fit the [0..1] normalized route into the box, preserving aspect ratio
  // (the route itself may be wider than tall or vice versa).
  const innerW = 320 - PADDING * 2;
  const innerH = height - PADDING * 2;
  const scaled = points.map((p) => ({
    x: PADDING + p.x * innerW,
    y: PADDING + p.y * innerH,
  }));
  const path = scaled.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const start = scaled[0];
  const end = scaled[scaled.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 320 ${height}`} preserveAspectRatio="xMidYMid meet">
        <Polyline
          points={path}
          fill="none"
          stroke={accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={start.x} cy={start.y} r={4} fill="#FFFFFF" />
        <Circle cx={end.x} cy={end.y} r={4} fill={accent} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  placeholder: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: AppFonts.mono.medium,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.3)",
  },
});

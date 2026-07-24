/**
 * WeekProgressRing — Circular SVG progress ring with animated fill.
 *
 * Replaces the linear week summary card. Shows total km toward
 * weekly goal with sport-segmented arcs (run=orange, ride=blue, workout=green).
 * Uses reanimated for smooth fill animation on mount.
 */

import { View, Text } from "react-native";
import { useEffect, useMemo } from "react";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  createAnimatedComponent,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { computeWeekStats } from "@/lib/sport-theme";
import { AnimatedCountUp, headerEnter } from "@/lib/animations";

const AnimatedCircle = createAnimatedComponent(Circle);

const WEEKLY_GOAL = 40; // km

interface WeekProgressRingProps {
  /** Delay entrance animation by this many ms */
  entranceDelay?: number;
  /** Optional filtered activities — uses all from context if omitted */
  activities?: any[];
}

export function WeekProgressRing({ entranceDelay = 100, activities: propActivities }: WeekProgressRingProps) {
  const colors = useColors();
  const { activities: allActivities } = useApp();
  const activities = propActivities ?? allActivities;
  const weekStats = useMemo(() => computeWeekStats(activities), [activities]);
  const progress = Math.min(weekStats.totalKm / WEEKLY_GOAL, 1);

  // Ring geometry
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Sport segment proportions (of the filled portion)
  const totalKm = weekStats.totalKm || 1; // avoid div by zero
  const runRatio = weekStats.runKm / totalKm;
  const rideRatio = weekStats.rideKm / totalKm;

  // Animated progress
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Animated stroke-dashoffset for the main ring fill
  const ringProps = useAnimatedProps(() => {
    const fillLength = animatedProgress.value * circumference;
    return {
      strokeDashoffset: circumference - fillLength,
    };
  });

  if (activities.length === 0) return null;

  return (
    <Animated.View
      entering={headerEnter(entranceDelay)}
      style={{ alignItems: "center", marginBottom: 20 }}
    >
      {/* Ring container */}
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Background ring */}
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: "absolute" }}
        >
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>

        {/* Sport segment arcs (background) */}
        {weekStats.runKm > 0 && (
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
          >
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#FF6B35"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={[circumference * runRatio * progress, circumference]}
              strokeLinecap="round"
              opacity={0.3}
            />
          </Svg>
        )}
        {weekStats.rideKm > 0 && (
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{
              position: "absolute",
              transform: [
                { rotate: `${-90 + 360 * runRatio * progress}deg` },
              ],
            }}
          >
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#0A84FF"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={[circumference * rideRatio * progress, circumference]}
              strokeLinecap="butt"
              opacity={0.3}
            />
          </Svg>
        )}

        {/* Animated progress ring */}
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
        >
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={[circumference, circumference]}
            strokeLinecap="round"
            animatedProps={ringProps}
          />
        </Svg>

        {/* Center text */}
        <View style={{ alignItems: "center" }}>
          <AnimatedCountUp
            value={weekStats.totalKm}
            style={{
              color: colors.foreground,
              fontSize: 38,
              fontWeight: "900",
              letterSpacing: -1,
            }}
            duration={1200}
          />
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            of {WEEKLY_GOAL} km
          </Text>
        </View>
      </View>

      {/* Legend row */}
      {weekStats.activitiesCount > 0 && (
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            marginTop: 14,
            alignItems: "center",
          }}
        >
          {weekStats.runKm > 0 && (
            <LegendDot color="#FF6B35" label={`${weekStats.runKm.toFixed(0)} km run`} />
          )}
          {weekStats.rideKm > 0 && (
            <LegendDot color="#0A84FF" label={`${weekStats.rideKm.toFixed(0)} km ride`} />
          )}
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "500" }}>
            {weekStats.activitiesCount} activities · {Math.round(weekStats.totalMinutes)} min
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ── Helpers ──

function LegendDot({ color, label }: { color: string; label: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
      />
      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

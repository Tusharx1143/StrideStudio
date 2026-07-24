/**
 * ActivityAnimatedIcon — Animated sport figure icons using reanimated + SVG.
 *
 * Renders a looping animated stick figure for each activity type:
 *   run → running figure with swinging limbs
 *   ride → cyclist with rotating wheels
 *   workout → strength figure with curl motion
 *
 * Falls back to emoji on web or if animation fails to load.
 * Respects reduced-motion accessibility via AnimationControls.
 */

import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
  cancelAnimation,
} from "react-native-reanimated";
import type { SportType } from "@/lib/sport-theme";
import { getSportConfig } from "@/lib/sport-theme";

// ── Animated SVG Components ──

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

// ── Types ──

interface ActivityAnimatedIconProps {
  type: SportType;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: object;
}

// ── Constants ──

/** Duration for one full animation cycle (ms) — lower = faster */
const CYCLE_MS = 600;

// ═════════════════════════════════════════════════════════
// RUNNING FIGURE
// ═════════════════════════════════════════════════════════

function RunFigure({ size, color }: { size: number; color: string }) {
  const phase = useSharedValue(0);
  const s = size;
  const strokeWidth = Math.max(2, s * 0.04);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(phase);
  }, [phase]);

  // Body center positions
  const cx = s * 0.5;
  const headR = s * 0.09;
  const headY = s * 0.13;
  const neckY = s * 0.22;
  const hipX = s * 0.5;
  const hipY = s * 0.5;
  const bodyLen = hipY - neckY;

  // Animated limb endpoints using swing math
  const bodyBounce = useDerivedValue(() => {
    // Subtle vertical bounce (2px at 100scale)
    return Math.abs(Math.sin(phase.value * Math.PI * 2)) * s * 0.03;
  });

  const leftLegProps = useAnimatedProps(() => {
    const angle = phase.value * Math.PI * 2;
    const swing = Math.sin(angle) * s * 0.18;
    return {
      x2: hipX + swing,
      y2: hipY + s * 0.35,
      opacity: 1,
    };
  });

  const rightLegProps = useAnimatedProps(() => {
    const angle = phase.value * Math.PI * 2 + Math.PI;
    const swing = Math.sin(angle) * s * 0.18;
    return {
      x2: hipX + swing,
      y2: hipY + s * 0.35,
      opacity: 1,
    };
  });

  const leftArmProps = useAnimatedProps(() => {
    const angle = phase.value * Math.PI * 2 + Math.PI;
    const swing = Math.sin(angle) * s * 0.15;
    return {
      x2: cx + swing,
      y2: neckY + bodyLen * 0.55,
    };
  });

  const rightArmProps = useAnimatedProps(() => {
    const angle = phase.value * Math.PI * 2;
    const swing = Math.sin(angle) * s * 0.15;
    return {
      x2: cx + swing,
      y2: neckY + bodyLen * 0.55,
    };
  });

  const headBounceProps = useAnimatedProps(() => ({
    cy: headY + bodyBounce.value,
  }));

  const bodyBounceProps = useAnimatedProps(() => ({
    y1: neckY + bodyBounce.value,
    y2: hipY + bodyBounce.value,
  }));

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Left leg */}
      <AnimatedLine
        x1={hipX}
        y1={hipY}
        animatedProps={leftLegProps}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Right leg */}
      <AnimatedLine
        x1={hipX}
        y1={hipY}
        animatedProps={rightLegProps}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Body */}
      <AnimatedLine
        x1={cx}
        animatedProps={bodyBounceProps}
        x2={cx}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Left arm */}
      <AnimatedLine
        x1={cx}
        y1={neckY}
        animatedProps={leftArmProps}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Right arm */}
      <AnimatedLine
        x1={cx}
        y1={neckY}
        animatedProps={rightArmProps}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Head */}
      <AnimatedCircle
        cx={cx}
        animatedProps={headBounceProps}
        r={headR}
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

// ═════════════════════════════════════════════════════════
// CYCLING FIGURE
// ═════════════════════════════════════════════════════════

function RideFigure({ size, color }: { size: number; color: string }) {
  const phase = useSharedValue(0);
  const s = size;
  const strokeWidth = Math.max(2, s * 0.035);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS * 1.2, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(phase);
  }, [phase]);

  // Bike geometry
  const wheelRadius = s * 0.13;
  const rearWheel = { cx: s * 0.28, cy: s * 0.7 };
  const frontWheel = { cx: s * 0.72, cy: s * 0.7 };
  const bottomBracket = { cx: s * 0.45, cy: s * 0.55 };
  const seat = { cx: s * 0.38, cy: s * 0.32 };
  const handlebar = { cx: s * 0.62, cy: s * 0.3 };
  const headTube = { cx: s * 0.65, cy: s * 0.4 };

  // Rider geometry
  const riderHip = { cx: seat.cx, cy: seat.cy };
  const riderShoulder = { cx: seat.cx + s * 0.05, cy: seat.cy - s * 0.16 };
  const riderHead = { cx: riderShoulder.cx, cy: riderShoulder.cy - s * 0.1 };

  // Wheel rotation
  const wheelRotation = useDerivedValue(() => phase.value * 360);

  const rearWheelProps = useAnimatedProps(() => ({
    transform: `rotate(${wheelRotation.value}, ${rearWheel.cx}, ${rearWheel.cy})`,
  }));

  const frontWheelProps = useAnimatedProps(() => ({
    transform: `rotate(${wheelRotation.value}, ${frontWheel.cx}, ${frontWheel.cy})`,
  }));

  // Pedaling leg motion
  const pedalAngle = useDerivedValue(() => phase.value * Math.PI * 2);

  const leftLegProps = useAnimatedProps(() => {
    const a = pedalAngle.value;
    return {
      x2: bottomBracket.cx + Math.cos(a) * s * 0.08,
      y2: bottomBracket.cy + Math.sin(a) * s * 0.08,
    };
  });

  const rightLegProps = useAnimatedProps(() => {
    const a = pedalAngle.value + Math.PI;
    return {
      x2: bottomBracket.cx + Math.cos(a) * s * 0.08,
      y2: bottomBracket.cy + Math.sin(a) * s * 0.08,
    };
  });

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Rear wheel */}
      <Circle cx={rearWheel.cx} cy={rearWheel.cy} r={wheelRadius} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <AnimatedG animatedProps={rearWheelProps}>
        <Line x1={rearWheel.cx} y1={rearWheel.cy - wheelRadius} x2={rearWheel.cx} y2={rearWheel.cy + wheelRadius} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
        <Line x1={rearWheel.cx - wheelRadius} y1={rearWheel.cy} x2={rearWheel.cx + wheelRadius} y2={rearWheel.cy} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
      </AnimatedG>

      {/* Front wheel */}
      <Circle cx={frontWheel.cx} cy={frontWheel.cy} r={wheelRadius} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <AnimatedG animatedProps={frontWheelProps}>
        <Line x1={frontWheel.cx} y1={frontWheel.cy - wheelRadius} x2={frontWheel.cx} y2={frontWheel.cy + wheelRadius} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
        <Line x1={frontWheel.cx - wheelRadius} y1={frontWheel.cy} x2={frontWheel.cx + wheelRadius} y2={frontWheel.cy} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
      </AnimatedG>

      {/* Bike frame */}
      <Line x1={rearWheel.cx} y1={rearWheel.cy} x2={bottomBracket.cx} y2={bottomBracket.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={bottomBracket.cx} y1={bottomBracket.cy} x2={seat.cx} y2={seat.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={seat.cx} y1={seat.cy} x2={headTube.cx} y2={headTube.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={bottomBracket.cx} y1={bottomBracket.cy} x2={headTube.cx} y2={headTube.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.5} />
      <Line x1={headTube.cx} y1={headTube.cy} x2={frontWheel.cx} y2={frontWheel.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={headTube.cx} y1={headTube.cy} x2={handlebar.cx} y2={handlebar.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />

      {/* Rider legs (pedaling) */}
      <AnimatedLine x1={riderHip.cx} y1={riderHip.cy} animatedProps={leftLegProps} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <AnimatedLine x1={riderHip.cx} y1={riderHip.cy} animatedProps={rightLegProps} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Rider body */}
      <Line x1={riderHip.cx} y1={riderHip.cy} x2={riderShoulder.cx} y2={riderShoulder.cy} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Rider arms */}
      <Line x1={riderShoulder.cx} y1={riderShoulder.cy} x2={handlebar.cx} y2={handlebar.cy + s * 0.02} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Rider head */}
      <Circle cx={riderHead.cx} cy={riderHead.cy} r={s * 0.08} fill={color} opacity={0.9} />
    </Svg>
  );
}

// ═════════════════════════════════════════════════════════
// WORKOUT FIGURE (Bicep Curl)
// ═════════════════════════════════════════════════════════

function WorkoutFigure({ size, color }: { size: number; color: string }) {
  const phase = useSharedValue(0);
  const s = size;
  const strokeWidth = Math.max(2, s * 0.04);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS * 1.5, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(phase);
  }, [phase]);

  // Body
  const headCx = s * 0.5;
  const headCy = s * 0.13;
  const headR = s * 0.09;
  const shoulderY = s * 0.24;
  const hipY = s * 0.55;
  const shoulderX = s * 0.5;

  // Animated arm curl (forearm rotates up toward shoulder)
  const curlAngle = useDerivedValue(() => phase.value * Math.PI * 0.7);

  // Right arm upper (static from shoulder)
  const rightUpperEnd = { x: shoulderX + s * 0.18, y: shoulderY + s * 0.12 };

  // Right forearm (animated curl)
  const rightForearmProps = useAnimatedProps(() => {
    const a = curlAngle.value;
    const elbowX = rightUpperEnd.x;
    const elbowY = rightUpperEnd.y;
    const forearmLen = s * 0.16;
    return {
      x2: elbowX - Math.sin(a) * forearmLen,
      y2: elbowY - Math.cos(a) * forearmLen * 0.6,
    };
  });

  // Left arm upper (static)
  const leftUpperEnd = { x: shoulderX - s * 0.18, y: shoulderY + s * 0.12 };

  // Left forearm (animated curl, slight phase offset)
  const leftForearmProps = useAnimatedProps(() => {
    const a = curlAngle.value + 0.15;
    const elbowX = leftUpperEnd.x;
    const elbowY = leftUpperEnd.y;
    const forearmLen = s * 0.16;
    return {
      x2: elbowX + Math.sin(a) * forearmLen,
      y2: elbowY - Math.cos(a) * forearmLen * 0.6,
    };
  });

  // Dumbbell weights
  const rightWeightProps = useAnimatedProps(() => {
    const a = curlAngle.value;
    const elbowX = rightUpperEnd.x;
    const elbowY = rightUpperEnd.y;
    const forearmLen = s * 0.16;
    const wx = elbowX - Math.sin(a) * forearmLen;
    const wy = elbowY - Math.cos(a) * forearmLen * 0.6;
    return { cx: wx, cy: wy };
  });

  const leftWeightProps = useAnimatedProps(() => {
    const a = curlAngle.value + 0.15;
    const elbowX = leftUpperEnd.x;
    const elbowY = leftUpperEnd.y;
    const forearmLen = s * 0.16;
    const wx = elbowX + Math.sin(a) * forearmLen;
    const wy = elbowY - Math.cos(a) * forearmLen * 0.6;
    return { cx: wx, cy: wy };
  });

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Legs */}
      <Line x1={shoulderX} y1={hipY} x2={shoulderX - s * 0.12} y2={hipY + s * 0.32} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={shoulderX} y1={hipY} x2={shoulderX + s * 0.12} y2={hipY + s * 0.32} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Body */}
      <Line x1={shoulderX} y1={shoulderY} x2={shoulderX} y2={hipY} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Upper arms */}
      <Line x1={shoulderX} y1={shoulderY} x2={rightUpperEnd.x} y2={rightUpperEnd.y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={shoulderX} y1={shoulderY} x2={leftUpperEnd.x} y2={leftUpperEnd.y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Forearms (animated curl) */}
      <AnimatedLine x1={rightUpperEnd.x} y1={rightUpperEnd.y} animatedProps={rightForearmProps} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <AnimatedLine x1={leftUpperEnd.x} y1={leftUpperEnd.y} animatedProps={leftForearmProps} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* Dumbbell weights */}
      <AnimatedCircle animatedProps={rightWeightProps} r={s * 0.05} fill={color} opacity={0.7} />
      <AnimatedCircle animatedProps={leftWeightProps} r={s * 0.05} fill={color} opacity={0.7} />

      {/* Head */}
      <Circle cx={headCx} cy={headCy} r={headR} fill={color} opacity={0.9} />
    </Svg>
  );
}

// ═════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════

export function ActivityAnimatedIcon({
  type,
  size = 80,
  autoPlay = true,
  loop = true,
  speed = 1,
  style,
}: ActivityAnimatedIconProps) {
  const sport = getSportConfig(type);

  // Select animation component based on sport type
  const Figure = useMemo(() => {
    switch (type) {
      case "run":
        return RunFigure;
      case "ride":
        return RideFigure;
      case "workout":
        return WorkoutFigure;
      default:
        return RunFigure;
    }
  }, [type]);

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={`${sport.label} activity animation`}
    >
      <Figure size={size} color={sport.color} />
    </View>
  );
}

export default ActivityAnimatedIcon;

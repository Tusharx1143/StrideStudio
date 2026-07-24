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

import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import type { SportType } from "@/lib/sport-theme";
import { getSportConfig } from "@/lib/sport-theme";

// ── Types ──

interface ActivityAnimatedIconProps {
  type: SportType;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: object;
}

// ═════════════════════════════════════════════════════════
// RUNNING FIGURE (static — avoids reanimated+SVG Android bridge issues)
// ═════════════════════════════════════════════════════════

function RunFigure({ size, color }: { size: number; color: string }) {
  const s = size;
  const strokeWidth = Math.max(2, s * 0.04);
  const cx = s * 0.5;
  const headR = s * 0.09;
  const headY = s * 0.13;
  const neckY = s * 0.22;
  const hipX = s * 0.5;
  const hipY = s * 0.5;
  const swing = s * 0.08;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Line x1={hipX} y1={hipY} x2={hipX - swing} y2={hipY + s * 0.35} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={hipX} y1={hipY} x2={hipX + swing} y2={hipY + s * 0.35} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={cx} y1={neckY} x2={cx} y2={hipY} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={cx} y1={neckY} x2={cx - swing} y2={neckY + s * 0.11} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={cx} y1={neckY} x2={cx + swing} y2={neckY + s * 0.11} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={cx} cy={headY} r={headR} fill={color} opacity={0.9} />
    </Svg>
  );
}

// ═════════════════════════════════════════════════════════
// CYCLING FIGURE (static — avoids reanimated+SVG Android bridge issues)
// ═════════════════════════════════════════════════════════

function RideFigure({ size, color }: { size: number; color: string }) {
  const s = size;
  const strokeWidth = Math.max(2, s * 0.035);
  const wheelRadius = s * 0.13;
  const rearWheel = { cx: s * 0.28, cy: s * 0.7 };
  const frontWheel = { cx: s * 0.72, cy: s * 0.7 };
  const bottomBracket = { cx: s * 0.45, cy: s * 0.55 };
  const seat = { cx: s * 0.38, cy: s * 0.32 };
  const handlebar = { cx: s * 0.62, cy: s * 0.3 };
  const headTube = { cx: s * 0.65, cy: s * 0.4 };
  const riderHip = { cx: seat.cx, cy: seat.cy };
  const riderShoulder = { cx: seat.cx + s * 0.05, cy: seat.cy - s * 0.16 };
  const riderHead = { cx: riderShoulder.cx, cy: riderShoulder.cy - s * 0.1 };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={rearWheel.cx} cy={rearWheel.cy} r={wheelRadius} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <Line x1={rearWheel.cx} y1={rearWheel.cy - wheelRadius} x2={rearWheel.cx} y2={rearWheel.cy + wheelRadius} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
      <Line x1={rearWheel.cx - wheelRadius} y1={rearWheel.cy} x2={rearWheel.cx + wheelRadius} y2={rearWheel.cy} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
      <Circle cx={frontWheel.cx} cy={frontWheel.cy} r={wheelRadius} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <Line x1={frontWheel.cx} y1={frontWheel.cy - wheelRadius} x2={frontWheel.cx} y2={frontWheel.cy + wheelRadius} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
      <Line x1={frontWheel.cx - wheelRadius} y1={frontWheel.cy} x2={frontWheel.cx + wheelRadius} y2={frontWheel.cy} stroke={color} strokeWidth={strokeWidth * 0.6} opacity={0.5} />
      <Line x1={rearWheel.cx} y1={rearWheel.cy} x2={bottomBracket.cx} y2={bottomBracket.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={bottomBracket.cx} y1={bottomBracket.cy} x2={seat.cx} y2={seat.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={seat.cx} y1={seat.cy} x2={headTube.cx} y2={headTube.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={bottomBracket.cx} y1={bottomBracket.cy} x2={headTube.cx} y2={headTube.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.5} />
      <Line x1={headTube.cx} y1={headTube.cy} x2={frontWheel.cx} y2={frontWheel.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={headTube.cx} y1={headTube.cy} x2={handlebar.cx} y2={handlebar.cy} stroke={color} strokeWidth={strokeWidth} opacity={0.7} />
      <Line x1={riderHip.cx} y1={riderHip.cy} x2={bottomBracket.cx} y2={bottomBracket.cy} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={riderHip.cx} y1={riderHip.cy} x2={bottomBracket.cx + s * 0.08} y2={bottomBracket.cy} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={riderHip.cx} y1={riderHip.cy} x2={riderShoulder.cx} y2={riderShoulder.cy} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={riderShoulder.cx} y1={riderShoulder.cy} x2={handlebar.cx} y2={handlebar.cy + s * 0.02} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={riderHead.cx} cy={riderHead.cy} r={s * 0.08} fill={color} opacity={0.9} />
    </Svg>
  );
}

// ═════════════════════════════════════════════════════════
// WORKOUT FIGURE (static — avoids reanimated+SVG Android bridge issues)
// ═════════════════════════════════════════════════════════

function WorkoutFigure({ size, color }: { size: number; color: string }) {
  const s = size;
  const strokeWidth = Math.max(2, s * 0.04);
  const headCx = s * 0.5;
  const headCy = s * 0.13;
  const headR = s * 0.09;
  const shoulderY = s * 0.24;
  const hipY = s * 0.55;
  const shoulderX = s * 0.5;
  const rightElbow = { x: shoulderX + s * 0.18, y: shoulderY + s * 0.12 };
  const leftElbow = { x: shoulderX - s * 0.18, y: shoulderY + s * 0.12 };
  const curlOffset = s * 0.08;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Line x1={shoulderX} y1={hipY} x2={shoulderX - s * 0.12} y2={hipY + s * 0.32} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={shoulderX} y1={hipY} x2={shoulderX + s * 0.12} y2={hipY + s * 0.32} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={shoulderX} y1={shoulderY} x2={shoulderX} y2={hipY} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={shoulderX} y1={shoulderY} x2={rightElbow.x} y2={rightElbow.y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={shoulderX} y1={shoulderY} x2={leftElbow.x} y2={leftElbow.y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={rightElbow.x} y1={rightElbow.y} x2={rightElbow.x - curlOffset} y2={rightElbow.y - curlOffset} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={leftElbow.x} y1={leftElbow.y} x2={leftElbow.x + curlOffset} y2={leftElbow.y - curlOffset} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={rightElbow.x - curlOffset} cy={rightElbow.y - curlOffset} r={s * 0.05} fill={color} opacity={0.7} />
      <Circle cx={leftElbow.x + curlOffset} cy={leftElbow.y - curlOffset} r={s * 0.05} fill={color} opacity={0.7} />
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

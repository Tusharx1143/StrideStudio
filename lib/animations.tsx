/**
 * Shared animation presets for StrideStudio.
 * Reuses the project's established spring configs and motion durations.
 *
 * Spring configs sourced from:
 *   - stride-button.tsx:  { damping: 12, stiffness: 200, mass: 0.8 }
 *   - kudos-button.tsx:   { damping: 8,  stiffness: 300 }
 *   - editor-theme.ts:    { damping: 20, stiffness: 200, mass: 0.5 }
 *   - skeleton.tsx:       shimmer 1200ms loop
 *
 * Motion durations from editor-theme.ts: fast=150, normal=250, slow=350
 */

import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  withSpring,
  withTiming,
  type SharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";

// ── Spring Configs ──

/** Button press/release (from stride-button.tsx) */
export const BUTTON_SPRING: WithSpringConfig = {
  damping: 12,
  stiffness: 200,
  mass: 0.8,
};

/** Bouncy pop (from kudos-button.tsx) */
export const BOUNCE_SPRING: WithSpringConfig = {
  damping: 8,
  stiffness: 300,
};

/** Smooth panel transitions (from editor-theme.ts) */
export const SMOOTH_SPRING: WithSpringConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

// ── Motion Durations (ms) ──

export const MOTION = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// ── Entrance Animations ──

/**
 * Staggered fade-in-up for list items.
 * Matches the landing page's pattern in app/index.tsx:
 *   FadeInDown.delay(N).springify().damping(15)
 */
export function staggeredEnter(index: number, baseDelay = 80) {
  return FadeInUp.delay(index * baseDelay)
    .springify()
    .damping(15)
    .duration(400);
}

/** Fade-in-down for header elements */
export function headerEnter(delay = 0) {
  return FadeInDown.delay(delay).springify().damping(15).duration(400);
}

// ── Card Press Feedback ──

/** Scale down on press (matches stride-button pattern) */
export function cardPressIn(scale: SharedValue<number>) {
  "worklet";
  scale.value = withSpring(0.97, BUTTON_SPRING);
}

/** Spring back on release */
export function cardPressOut(scale: SharedValue<number>) {
  "worklet";
  scale.value = withSpring(1, BUTTON_SPRING);
}

// ── Animated Number Hook ──

/**
 * Animate a number from 0 to target on the UI thread.
 * Returns a SharedValue — use with AnimatedCountUp for text display
 * or with useAnimatedProps for SVG/animated components.
 */
export function useAnimatedCountUp(
  target: number,
  duration = 800,
): SharedValue<number> {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(target, { duration });
  }, [target, duration]);

  return animatedValue;
}

/**
 * Animated text component that counts up from 0 to `value`.
 * Uses reanimated SharedValue on the UI thread — no JS thread setInterval.
 */
export function AnimatedCountUp({
  value,
  style,
  duration = 800,
  decimals = 1,
}: {
  value: number;
  style: object;
  duration?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const sv = useAnimatedCountUp(value, duration);

  useAnimatedReaction(
    () => sv.value,
    (current) => runOnJS(setDisplay)(current),
  );

  return (
    <Animated.Text style={style}>
      {display.toFixed(decimals)}
    </Animated.Text>
  );
}

/** Touch target minimum size (44×44pt accessibility guideline). */
export const TOUCH_MIN = { minHeight: 44, minWidth: 44 } as const;

// ── Reduced Motion ──

/**
 * Hook that reads the OS-level "Reduce Motion" accessibility setting.
 * When true, all non-essential animations should be disabled or
 * replaced with instant (duration: 0) transitions.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      // On web, check the prefers-reduced-motion media query
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    // On native, use AccessibilityInfo
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => sub.remove();
  }, []);

  return reduced;
}

/**
 * Returns a spring config that respects the user's reduced-motion preference.
 * When reduced motion is active, returns { duration: 0 } for instant transitions.
 */
export function getSpringConfig(
  spring: WithSpringConfig,
  reducedMotion: boolean,
): WithSpringConfig | { duration: number } {
  if (reducedMotion) return { duration: 0 };
  return spring;
}


/**
 * Micro-interactions and animation helpers for consistent UI polish.
 * Inspired by UI/UX Pro Max principles: smooth transitions,
 * 44×44pt touch targets, body text ≥16px, skeleton loading states.
 */

import React, { useEffect, useRef } from "react";
import { Animated, Pressable, type ViewStyle } from "react-native";

// ── Fade-in on mount ──

export function FadeIn({ children, delay = 0, duration = 300, style }: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [opacity, delay, duration]);

  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}

// ── Scale press feedback ──

export function ScalePress({ children, style, onPress, onLongPress }: {
  children: React.ReactNode; style?: ViewStyle; onPress?: () => void; onLongPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => { Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start(); };
  const onPressOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start(); };
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} onLongPress={onLongPress}>
      <Animated.View style={[{ transform: [{ scale }], minHeight: 44, minWidth: 44 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Skeleton loading placeholder ──

export function Skeleton({ width, height, rounded = true, style }: {
  width?: number;
  height?: number;
  rounded?: boolean;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{
        width: width ?? 300,
        height: height ?? 20,
        borderRadius: rounded ? 8 : 0,
        backgroundColor: "#1C1C1E",
        opacity,
      }, style]}
    />
  );
}

// ─── Touch target minimum size ──

export const TOUCH_MIN: ViewStyle = { minHeight: 44, minWidth: 44 };

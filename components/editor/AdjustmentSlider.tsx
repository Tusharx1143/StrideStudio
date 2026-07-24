/**
 * AdjustmentSlider — styled slider for photo editing adjustments.
 *
 * Used for: brightness, contrast, saturation, warmth, exposure, etc.
 *
 * Features:
 * - Icon + label + current value display
 * - Filled track (active portion in primary color)
 * - Touch-friendly 44px height thumb area
 * - Reset to default on double-tap
 * - Haptic feedback on value change
 */
import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { EditorColors, EditorRadius, EditorType, EditorTouch } from "@/constants/editor-theme";

// ── Types ──

export interface AdjustmentDef {
  id: string;
  label: string;
  icon: string; // emoji or symbol character (SVG preferred per design system)
  min: number;
  max: number;
  defaultValue: number;
  /** Format the display value, e.g. (v) => `${Math.round(v)}%` */
  formatValue?: (value: number) => string;
}

interface AdjustmentSliderProps {
  adjustment: AdjustmentDef;
  value: number;
  onChange: (id: string, value: number) => void;
  /** Width of the slider track. Auto-measured if not provided. */
  width?: number;
}

// ── Default formatter ──

function defaultFormat(value: number): string {
  return `${Math.round(value)}`;
}

// ── Component ──

export function AdjustmentSlider({
  adjustment,
  value,
  onChange,
  width: propWidth,
}: AdjustmentSliderProps) {
  const [trackWidth, setTrackWidth] = React.useState(propWidth ?? 0);
  const trackRef = useRef<View>(null);
  const lastHapticRef = useRef(Math.round(value / 5));

  const { min, max, defaultValue, label, icon, formatValue = defaultFormat } = adjustment;

  // Normalize value to 0–1 range
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Measure track width on layout
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    if (!propWidth) {
      setTrackWidth(e.nativeEvent.layout.width);
    }
  }, [propWidth]);

  // Thumb position
  const thumbX = trackWidth > 0 ? fraction * trackWidth : 0;

  // Handle track tap
  const handleTrackPress = useCallback(
    (pageX: number) => {
      if (trackWidth === 0) return;
      // We need the track's screen position. Use a simpler approach:
      // The PanResponder gives us dx relative to the track.
    },
    [trackWidth, min, max, onChange, adjustment.id],
  );

  // Pan responder for the thumb
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (trackWidth === 0) return;
        const dx = gestureState.dx;
        const newFraction = Math.max(0, Math.min(1, fraction + dx / trackWidth));
        const newValue = min + newFraction * (max - min);
        const rounded = Math.round(newValue);

        // Haptic tick every 5 units
        const tick = Math.round(rounded / 5);
        if (tick !== lastHapticRef.current && Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          lastHapticRef.current = tick;
        }

        onChange(adjustment.id, rounded);
      },
      onPanResponderRelease: () => {
        lastHapticRef.current = Math.round(value / 5);
      },
    }),
  ).current;

  // Double-tap to reset
  const handleDoubleTap = useCallback(() => {
    onChange(adjustment.id, defaultValue);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [adjustment.id, defaultValue, onChange]);

  // Track press — simplified using TouchableOpacity on the track
  const handleTrackTap = useCallback(
    (e: any) => {
      if (trackWidth === 0) return;
      const { locationX } = e.nativeEvent;
      const newFraction = Math.max(0, Math.min(1, locationX / trackWidth));
      const newValue = min + newFraction * (max - min);
      onChange(adjustment.id, Math.round(newValue));
    },
    [trackWidth, min, max, adjustment.id, onChange],
  );

  const isAtDefault = value === defaultValue;

  return (
    <View style={styles.container}>
      {/* Header row: icon + label + value */}
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text
          style={[styles.value, !isAtDefault && styles.valueActive]}
          onPress={handleDoubleTap}
        >
          {formatValue(value)}
        </Text>
      </View>

      {/* Track */}
      <View
        ref={trackRef}
        onLayout={handleLayout}
        style={styles.trackContainer}
      >
        {/* The whole track is tappable */}
        <View style={styles.track} onTouchEnd={handleTrackTap}>
          {/* Filled portion */}
          <View
            style={[
              styles.trackFill,
              { width: trackWidth > 0 ? thumbX : 0 },
            ]}
          />
          {/* Thumb */}
          <View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: thumbX - 14 }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.thumbInner} />
          </View>
        </View>
      </View>

      {/* Min/Max labels */}
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{formatValue(min)}</Text>
        <Text style={styles.rangeLabel}>{formatValue(max)}</Text>
      </View>
    </View>
  );
}

// ── Styles ──

const THUMB_SIZE = 28;
const THUMB_HIT_AREA = 44;
const TRACK_HEIGHT = 4;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    fontSize: 16,
    width: 24,
    textAlign: "center",
  },
  label: {
    color: EditorColors.foreground,
    fontSize: EditorType.body.size,
    fontWeight: EditorType.body.weight,
  },
  value: {
    color: EditorColors.mutedText,
    fontSize: EditorType.caption.size,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: EditorRadius.pill,
    overflow: "hidden",
  },
  valueActive: {
    color: EditorColors.accent,
    backgroundColor: EditorColors.accent + "18",
  },
  trackContainer: {
    height: THUMB_HIT_AREA,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: EditorColors.borderSolid,
    position: "relative",
    overflow: "visible",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: EditorColors.primary,
  },
  thumb: {
    position: "absolute",
    top: -(THUMB_HIT_AREA - TRACK_HEIGHT) / 2,
    left: 0,
    width: THUMB_HIT_AREA,
    height: THUMB_HIT_AREA,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: EditorColors.foreground,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: EditorColors.primary + "30",
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  rangeLabel: {
    color: EditorColors.mutedText,
    fontSize: 9,
    fontWeight: "500",
  },
});

/**
 * QuickStyles — one-tap visual style presets.
 *
 * Applies a complete style override to the current Lens:
 * - Color palette
 * - Font family
 * - Font weight
 * - Text transform
 * - Effect toggles (shadow, blur, border)
 *
 * Instantly transforms the Lens without changing the layout.
 */
import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useCanvas } from "@/lib/canvas-state";
import { useColors } from "@/hooks/use-colors";
import { QUICK_STYLES } from "@/lib/lenses/registry";
import { Fonts } from "@/lib/_core/theme";
const FONT_UI = Fonts.sans;
const FONT_MONO = Fonts.mono;

// ── Props ──

interface QuickStylesProps {
  activePresetId?: string;
  onApplyPreset?: (presetId: string) => void;
}

// ── Component ──

export function QuickStyles({ activePresetId, onApplyPreset }: QuickStylesProps) {
  const colors = useColors();

  const handleApply = useCallback(
    (presetId: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      if (onApplyPreset) onApplyPreset(presetId);
    },
    [onApplyPreset],
  );

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionLabel}>ONE-TAP STYLES</Text>
      <Text style={styles.sectionDesc}>
        Transform your Lens instantly without changing the layout
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {QUICK_STYLES.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => handleApply(preset.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Style: ${preset.name}`}
              style={[
                styles.card,
                isActive && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                  backgroundColor: "rgba(249,115,22,0.08)",
                },
              ]}
            >
              {/* Preset icon */}
              <Text style={styles.icon}>{preset.icon}</Text>

              {/* Name */}
              <Text
                style={[
                  styles.name,
                  isActive && { color: colors.primary },
                ]}
              >
                {preset.name}
              </Text>

              {/* Description */}
              <Text style={styles.desc} numberOfLines={2}>
                {preset.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 9,
    letterSpacing: 0.18 * 9,
    color: "rgba(255,255,255,0.4)",
  },
  sectionDesc: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },
  card: {
    width: 100,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#0E0E10",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 6,
  },
  icon: {
    fontSize: 22,
    textAlign: "center",
  },
  name: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 10,
    color: "#FFFFFF",
    textAlign: "center",
  },
  desc: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 11,
  },
});

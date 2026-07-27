/**
 * EffectsPanel — shadow, blur, border, corner radius, opacity controls.
 *
 * Sliders and toggles for visual effects on the selected layer.
 * All changes apply instantly (WYSIWYG).
 */
import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useCanvas } from "@/lib/canvas-state";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// ── Props ──

interface EffectsPanelProps {
  onAction?: (action: string) => void;
}

// ── Component ──

export function EffectsPanel({ onAction }: EffectsPanelProps) {
  const colors = useColors();
  const {
    selectedLayerId,
    layers,
    updateLayer,
    commitHistory,
  } = useCanvas();

  const layer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId),
    [layers, selectedLayerId],
  );

  const handleToggle = useCallback(
    (key: "shadow" | "blur" | "border") => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { [key]: !layer?.[key] });
      commitHistory();
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    },
    [selectedLayerId, layer, updateLayer, commitHistory],
  );

  const handleOpacity = useCallback(
    (value: number) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { opacity: Math.round(value) / 100 });
    },
    [selectedLayerId, updateLayer],
  );

  const handleBorderRadius = useCallback(
    (value: number) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { borderRadius: Math.round(value) });
    },
    [selectedLayerId, updateLayer],
  );

  if (!layer) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>✦</Text>
        <Text style={styles.emptyTitle}>Select a layer</Text>
        <Text style={styles.emptyDesc}>
          Tap a layer on the canvas to edit its effects
        </Text>
      </View>
    );
  }

  const effectToggles = [
    { key: "shadow" as const, label: "Shadow", active: !!layer.shadow, icon: "◯" },
    { key: "blur" as const, label: "Blur", active: !!layer.blur, icon: "◎" },
    { key: "border" as const, label: "Border", active: !!layer.border, icon: "▢" },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Effect toggles */}
      <View style={{ gap: 7 }}>
        <Text style={styles.sectionLabel}>EFFECTS</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {effectToggles.map((e) => (
            <TouchableOpacity
              key={e.key}
              onPress={() => handleToggle(e.key)}
              accessibilityRole="button"
              accessibilityLabel={`Toggle ${e.label}`}
              style={[
                styles.effectBtn,
                e.active && {
                  backgroundColor: "rgba(249,115,22,0.15)",
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.effectIcon,
                  e.active && { color: colors.primary },
                ]}
              >
                {e.icon}
              </Text>
              <Text
                style={[
                  styles.effectLabel,
                  e.active && { color: colors.primary },
                ]}
              >
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Opacity slider */}
      <View style={{ gap: 7 }}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionLabel}>OPACITY</Text>
          <Text style={styles.sliderValue}>
            {Math.round(layer.opacity * 100)}%
          </Text>
        </View>
        <Slider
          style={{ width: "100%", height: 32 }}
          minimumValue={5}
          maximumValue={100}
          value={Math.round(layer.opacity * 100)}
          onValueChange={handleOpacity}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor="#FFFFFF"
        />
      </View>

      {/* Corner radius slider */}
      <View style={{ gap: 7 }}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionLabel}>CORNER RADIUS</Text>
          <Text style={styles.sliderValue}>
            {layer.borderRadius ?? 0}px
          </Text>
        </View>
        <Slider
          style={{ width: "100%", height: 32 }}
          minimumValue={0}
          maximumValue={40}
          value={layer.borderRadius ?? 0}
          onValueChange={handleBorderRadius}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor="#FFFFFF"
        />
      </View>
    </ScrollView>
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
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderValue: {
    fontFamily: FONT_MONO,
    fontWeight: "600",
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
  },
  effectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    gap: 4,
  },
  effectIcon: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
  effectLabel: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyIcon: {
    fontFamily: FONT_UI,
    fontWeight: "800",
    fontSize: 28,
    color: "rgba(255,255,255,0.2)",
  },
  emptyTitle: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyDesc: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});

/**
 * FontPicker — font family, weight, style, size, and alignment picker.
 *
 * Features:
 * - Font family selector (system fonts + custom)
 * - Font weight slider (100–900)
 * - Font style toggle (normal/italic)
 * - Font size slider
 * - Text alignment (left/center/right)
 * - All changes apply instantly to the selected layer
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

// ── Font options ──

const FONT_FAMILIES = [
  { id: "default", label: "Default" },
  { id: FONT_UI, label: "Barlow" },
  { id: FONT_MONO, label: "Mono" },
  { id: "serif", label: "Serif" },
  { id: "sans-serif", label: "Sans" },
];

const FONT_WEIGHTS = [
  { id: "300", label: "Light" },
  { id: "400", label: "Regular" },
  { id: "500", label: "Medium" },
  { id: "600", label: "Semi Bold" },
  { id: "700", label: "Bold" },
  { id: "800", label: "Extra Bold" },
  { id: "900", label: "Black" },
];

const ALIGNMENTS = [
  { id: "left" as const, icon: "⬅" },
  { id: "center" as const, icon: "⬡" },
  { id: "right" as const, icon: "➡" },
];

const TRANSFORMS = [
  { id: "none" as const, label: "Aa" },
  { id: "uppercase" as const, label: "AA" },
  { id: "capitalize" as const, label: "Aa" },
];

// ── Props ──

interface FontPickerProps {
  onSelect?: () => void;
}

// ── Component ──

export function FontPicker({ onSelect }: FontPickerProps) {
  const colors = useColors();
  const { selectedLayerId, layers, updateLayer } = useCanvas();

  const layer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId),
    [layers, selectedLayerId],
  );

  const handleFontFamily = useCallback(
    (family: string) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, {
        fontFamily: family === "default" ? undefined : family,
      });
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    },
    [selectedLayerId, updateLayer],
  );

  const handleFontWeight = useCallback(
    (weight: string) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { fontWeight: weight });
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    },
    [selectedLayerId, updateLayer],
  );

  const handleAlignment = useCallback(
    (align: "left" | "center" | "right") => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { textAlign: align });
    },
    [selectedLayerId, updateLayer],
  );

  const handleTransform = useCallback(
    (transform: "none" | "uppercase" | "lowercase" | "capitalize") => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { textTransform: transform });
    },
    [selectedLayerId, updateLayer],
  );

  const handleFontSize = useCallback(
    (size: number) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { fontSize: Math.round(size) });
    },
    [selectedLayerId, updateLayer],
  );

  if (!layer) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>Aa</Text>
        <Text style={styles.emptyTitle}>Select a text layer</Text>
        <Text style={styles.emptyDesc}>
          Tap a stat or text element on the canvas to edit its font
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Font family */}
      <View style={{ gap: 7 }}>
        <Text style={styles.sectionLabel}>FONT FAMILY</Text>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {FONT_FAMILIES.map((f) => {
            const active =
              (f.id === "default" && !layer.fontFamily) ||
              layer.fontFamily === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => handleFontFamily(f.id)}
                accessibilityRole="button"
                accessibilityLabel={`Font: ${f.label}`}
                style={[
                  styles.pill,
                  active && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    active && { color: "#0B0B0C" },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Font weight */}
      <View style={{ gap: 7 }}>
        <Text style={styles.sectionLabel}>WEIGHT</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {FONT_WEIGHTS.map((w) => {
            const active = (layer.fontWeight ?? "700") === w.id;
            return (
              <TouchableOpacity
                key={w.id}
                onPress={() => handleFontWeight(w.id)}
                accessibilityRole="button"
                accessibilityLabel={`Weight: ${w.label}`}
                style={[
                  styles.weightPill,
                  active && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.weightText,
                    { fontWeight: parseInt(w.id) as 300 | 400 | 500 | 600 | 700 | 800 | 900 },
                    active && { color: "#0B0B0C" },
                  ]}
                >
                  A
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Font size slider */}
      <View style={{ gap: 7 }}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionLabel}>SIZE</Text>
          <Text style={styles.sliderValue}>
            {layer.fontSize ?? 28}px
          </Text>
        </View>
        <Slider
          style={{ width: "100%", height: 32 }}
          minimumValue={8}
          maximumValue={120}
          value={layer.fontSize ?? 28}
          onValueChange={handleFontSize}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor="#FFFFFF"
        />
      </View>

      {/* Alignment */}
      <View style={{ gap: 7 }}>
        <Text style={styles.sectionLabel}>ALIGNMENT</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {ALIGNMENTS.map((a) => {
            const active = (layer.textAlign ?? "center") === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => handleAlignment(a.id)}
                accessibilityRole="button"
                accessibilityLabel={`Align: ${a.id}`}
                style={[
                  styles.alignPill,
                  active && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.alignText,
                    active && { color: "#0B0B0C" },
                  ]}
                >
                  {a.icon}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Text transform */}
      <View style={{ gap: 7 }}>
        <Text style={styles.sectionLabel}>CASE</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {TRANSFORMS.map((t) => {
            const active = (layer.textTransform ?? "none") === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleTransform(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`Transform: ${t.id}`}
                style={[
                  styles.pill,
                  active && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    active && { color: "#0B0B0C" },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pillText: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  weightPill: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  weightText: {
    fontFamily: FONT_UI,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  alignPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  alignText: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyIcon: {
    fontFamily: FONT_UI,
    fontWeight: "800",
    fontSize: 32,
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

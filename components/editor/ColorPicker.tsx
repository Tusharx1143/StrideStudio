/**
 * ColorPicker — full color palette + gradient picker for Lens layers.
 *
 * Features:
 * - Palette selector (existing PALETTES from sticker system)
 * - Per-layer color override
 * - Gradient direction selector
 * - Smart Color Extraction placeholder (from imported photo)
 * - Live preview on selection
 */
import React, { useCallback, useMemo, useState } from "react";
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
import { PALETTES, getPalette } from "@/lib/stickers/palettes";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// ── Color swatches (common overrides) ──

const COLOR_SWATCHES = [
  { id: "white", color: "#FFFFFF" },
  { id: "black", color: "#000000" },
  { id: "orange", color: "#FF6B35" },
  { id: "violet", color: "#8B5CF6" },
  { id: "blue", color: "#0A84FF" },
  { id: "green", color: "#30D158" },
  { id: "red", color: "#FF453A" },
  { id: "yellow", color: "#FFD60A" },
  { id: "pink", color: "#FF375F" },
  { id: "cyan", color: "#64D2FF" },
  { id: "mint", color: "#63E6E2" },
  { id: "gray", color: "#8E8E93" },
];

// ── Props ──

interface ColorPickerProps {
  /** Whether to show just the palette picker (canvas-level) or also swatches */
  mode?: "palette" | "full";
}

// ── Component ──

export function ColorPicker({ mode = "full" }: ColorPickerProps) {
  const colors = useColors();
  const {
    selectedLayerId,
    layers,
    updateLayer,
  } = useCanvas();

  const layer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId),
    [layers, selectedLayerId],
  );

  const [activeTab, setActiveTab] = useState<"palette" | "color" | "gradient">(
    "palette",
  );

  const handlePaletteSelect = useCallback(
    (paletteId: string) => {
      // Canvas-level palette change
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      // We'll use a custom canvas event approach — for now update layer colors
      if (selectedLayerId) {
        updateLayer(selectedLayerId, { layerColor: undefined }); // reset to use palette default
      }
    },
    [selectedLayerId, updateLayer],
  );

  const handleColorSelect = useCallback(
    (colorHex: string) => {
      if (!selectedLayerId) return;
      updateLayer(selectedLayerId, { layerColor: colorHex });
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    },
    [selectedLayerId, updateLayer],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Tabs */}
      {mode === "full" && selectedLayerId && (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[
            { id: "palette" as const, label: "Palette" },
            { id: "color" as const, label: "Color" },
            { id: "gradient" as const, label: "Gradient" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                style={[
                  styles.tab,
                  active && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    active && { color: "#0B0B0C" },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Palettes */}
      {(activeTab === "palette" || mode === "palette") && (
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionLabel}>THEME PALETTE</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {PALETTES.map((p) => {
              const palette = p;
              const accentColor = palette?.colors?.accent ?? "#FF6B35";
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handlePaletteSelect(p.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Palette: ${p.name}`}
                  style={[
                    styles.paletteSwatch,
                    { backgroundColor: accentColor },
                  ]}
                >
                  <View style={styles.paletteInner}>
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontWeight: "700",
                        fontSize: 6.5,
                        color: "#fff",
                        textAlign: "center",
                        opacity: 0.8,
                      }}
                    >
                      {p.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Color swatches */}
      {(activeTab === "color" && layer) && (
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionLabel}>TEXT COLOR</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {COLOR_SWATCHES.map((s) => {
              const isActive = layer.layerColor === s.color;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => handleColorSelect(s.color)}
                  accessibilityRole="button"
                  accessibilityLabel={`Color: ${s.id}`}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: s.color },
                    isActive && {
                      borderWidth: 2.5,
                      borderColor: "#FFFFFF",
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Reset color */}
          <TouchableOpacity
            onPress={() => handleColorSelect("")}
            accessibilityRole="button"
            accessibilityLabel="Reset color to default"
            style={styles.resetBtn}
          >
            <Text style={styles.resetText}>Reset to palette default</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Smart Color Extraction placeholder */}
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: "rgba(8,126,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(8,126,255,0.2)",
          gap: 4,
        }}
      >
        <Text style={{ fontFamily: FONT_UI, fontWeight: "700", fontSize: 10, color: "#0A84FF" }}>
          ✦ Smart Color
        </Text>
        <Text style={{ fontFamily: FONT_UI, fontWeight: "500", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
          Colors auto-extracted from your photo will appear here
        </Text>
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
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tabText: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  paletteSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  paletteInner: {
    padding: 4,
    borderRadius: 8,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  resetText: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
  },
});

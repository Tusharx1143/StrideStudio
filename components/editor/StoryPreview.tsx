/**
 * StoryPreview — multi-platform export preview sheet.
 *
 * Shows how the current design will appear on different social platforms.
 * Renders at each platform's native aspect ratio with safe-zone guides.
 */
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { useCanvas } from "@/lib/canvas-state";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// ── Platform definitions ──

interface PlatformDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  aspectRatio: string;
}

const PLATFORMS: PlatformDef[] = [
  { id: "ig-story", label: "IG Story", icon: "📸", color: "#EE2A7B", aspectRatio: "9:16" },
  { id: "ig-feed", label: "IG Post", icon: "📱", color: "#6228D7", aspectRatio: "4:5" },
  { id: "fb-story", label: "FB Story", icon: "👤", color: "#1877F2", aspectRatio: "9:16" },
  { id: "wa-status", label: "WA Status", icon: "💬", color: "#25D366", aspectRatio: "9:16" },
  { id: "threads", label: "Threads", icon: "🧵", color: "#101010", aspectRatio: "1:1" },
  { id: "x-post", label: "X/Twitter", icon: "🐦", color: "#0B0B0C", aspectRatio: "16:9" },
];

// ── Props ──

interface StoryPreviewProps {
  onShare?: (platformId: string) => void;
  onSave?: () => void;
}

// ── Component ──

export function StoryPreview({ onShare, onSave }: StoryPreviewProps) {
  const colors = useColors();
  const { ratio } = useCanvas();
  const [selected, setSelected] = useState<string>("ig-story");

  const handlePlatformSelect = useCallback(
    (id: string) => {
      setSelected(id);
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    },
    [],
  );

  const selectedPlatform = PLATFORMS.find((p) => p.id === selected);

  const handleShare = useCallback(() => {
    if (onShare && selected) onShare(selected);
  }, [selected, onShare]);

  const handleSave = useCallback(() => {
    if (onSave) onSave();
  }, [onSave]);

  return (
    <View style={{ gap: 14 }}>
      {/* Section header */}
      <Text style={styles.sectionLabel}>
        LIVE STORY PREVIEW
      </Text>
      <Text style={styles.sectionDesc}>
        Preview how your design appears on each platform before exporting
      </Text>

      {/* Platform selector pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {PLATFORMS.map((p) => {
          const active = selected === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => handlePlatformSelect(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Preview: ${p.label}`}
              style={[
                styles.platformPill,
                active && {
                  backgroundColor: p.color + "22",
                  borderColor: p.color,
                },
              ]}
            >
              <Text style={styles.platformIcon}>{p.icon}</Text>
              <Text
                style={[
                  styles.platformLabel,
                  active && { color: p.color },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Preview mockup */}
      <View
        style={[
          styles.previewFrame,
          selectedPlatform && {
            aspectRatio: selectedPlatform.aspectRatio === "9:16"
              ? 9 / 16
              : selectedPlatform.aspectRatio === "4:5"
                ? 4 / 5
                : selectedPlatform.aspectRatio === "1:1"
                  ? 1
                  : 16 / 9,
          },
        ]}
      >
        {/* Canvas representation */}
        <View style={styles.canvasMock}>
          {/* Rendered design placeholder */}
          <View style={styles.designPlaceholder}>
            <Text style={styles.designLabel}>
              {selectedPlatform?.label ?? "Preview"}
            </Text>
            <Text style={styles.aspectLabel}>
              {selectedPlatform?.aspectRatio ?? ratio}
            </Text>
          </View>
        </View>

        {/* Safe zone guide */}
        <View style={styles.safeZone} pointerEvents="none">
          <Text style={styles.safeLabel}>Safe zone</Text>
        </View>
      </View>

      {/* Aspect ratio info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          {selectedPlatform?.aspectRatio} format · Text kept within safe zone
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save to camera roll"
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveBtnText, { color: "#0B0B0C" }]}>
            Share to {selectedPlatform?.label ?? "..."}
          </Text>
        </TouchableOpacity>
      </View>
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
  platformPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  platformIcon: {
    fontSize: 14,
  },
  platformLabel: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  previewFrame: {
    width: "100%",
    maxHeight: 320,
    borderRadius: 14,
    backgroundColor: "#0E0E10",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    position: "relative",
  },
  canvasMock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  designPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1A1A1E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  designLabel: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
  aspectLabel: {
    fontFamily: FONT_MONO,
    fontWeight: "600",
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
  },
  safeZone: {
    position: "absolute",
    top: "8%",
    left: "6%",
    right: "6%",
    bottom: "8%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    borderRadius: 4,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 4,
  },
  safeLabel: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 7,
    color: "rgba(255,255,255,0.2)",
  },
  infoRow: {
    alignItems: "center",
  },
  infoText: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  shareBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: FONT_UI,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.08 * 11,
    color: "#FFFFFF",
  },
});

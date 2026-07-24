/**
 * LayerStylePanel — memoized style controls for the selected template layer.
 *
 * Extracted from the inline toolSections memo to prevent React reconciliation
 * freezes when updating layer styles. This component only re-renders when
 * the selected layer or its style props actually change.
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  ALL_PRESETS,
  CUSTOM_COLORS, FONT_FAMILIES,
} from "@/lib/color-presets";
import { ALL_TEMPLATES } from "@/lib/templates";
import type { CanvasLayer, LayerBackground } from "@/lib/canvas-state";
import {
  EditorColors,
  EditorRadius,
  EditorType,
  EditorSpace,
  EditorTouch,
} from "@/constants/editor-theme";

interface LayerStylePanelProps {
  layer: CanvasLayer;
  onUpdateLayer: (id: string, patch: Partial<CanvasLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onClose: () => void;
}

const BACKGROUND_OPTIONS: { id: LayerBackground; label: string; icon: string; desc: string }[] = [
  { id: 'none',     label: 'None',    icon: '∅', desc: 'Transparent' },
  { id: 'glass',    label: 'Glass',   icon: '▣', desc: 'Frosted' },
  { id: 'solid',    label: 'Solid',   icon: '■', desc: 'Opaque' },
  { id: 'outlined', label: 'Outline', icon: '□', desc: 'Border only' },
];

function LayerStylePanelInner({
  layer,
  onUpdateLayer,
  onRemoveLayer,
  onBringForward,
  onSendBackward,
  onClose,
}: LayerStylePanelProps) {
  return (
    <View style={{ gap: EditorSpace["2xl"] }}>
      {/* Template info */}
      <Text style={{
        color: EditorColors.mutedText,
        fontSize: EditorType.caption.size,
        fontWeight: "600",
      }}>
        Template: {ALL_TEMPLATES.find((t) => t.id === layer.templateId)?.name ?? layer.templateId}
      </Text>

      {/* Font selection */}
      <View>
        <Text style={{ color: EditorColors.mutedText, fontSize: 9, fontWeight: "700", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          FONT
        </Text>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {FONT_FAMILIES.map((ff) => (
            <TouchableOpacity
              key={ff.id}
              onPress={() => onUpdateLayer(layer.id, { fontFamily: ff.id })}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: EditorRadius.pill,
                backgroundColor: layer.fontFamily === ff.id
                  ? EditorColors.primary
                  : EditorColors.card,
                minHeight: EditorTouch.buttonSm,
                justifyContent: "center",
              }}
            >
              <Text style={{
                color: layer.fontFamily === ff.id ? "#fff" : EditorColors.foreground,
                fontSize: EditorType.caption.size,
                fontWeight: ff.id === "bebas-neue" || ff.id === "din-condensed" || ff.id === "league-spartan" ? "900" : ff.id === "oswald" ? "600" : "500",
              }}>
                {ff.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color presets */}
      <View>
        <Text style={{ color: EditorColors.mutedText, fontSize: 9, fontWeight: "700", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          COLOR PRESETS
        </Text>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {ALL_PRESETS.map((preset) => {
            const isActive = layer.paletteId === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                onPress={() => onUpdateLayer(layer.id, { paletteId: preset.id })}
                style={{ alignItems: "center", gap: 4 }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: preset.colors.accent,
                  borderWidth: isActive ? 2.5 : 0,
                  borderColor: isActive ? EditorColors.foreground : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {isActive && (
                    <Text style={{ color: EditorColors.foreground, fontSize: 12, fontWeight: "800" }}>✓</Text>
                  )}
                </View>
                <Text style={{ color: EditorColors.mutedText, fontSize: 8, fontWeight: "600" }} numberOfLines={1}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Custom colors */}
      <View>
        <Text style={{ color: EditorColors.mutedText, fontSize: 9, fontWeight: "700", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          CUSTOM
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CUSTOM_COLORS.map((hex) => (
            <TouchableOpacity
              key={hex}
              onPress={() => { onUpdateLayer(layer.id, { paletteId: "custom" }); onClose(); }}
              style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: hex,
                borderWidth: 1,
                borderColor: EditorColors.borderSolid,
              }}
            />
          ))}
        </View>
      </View>

      {/* Layer background style */}
      <View>
        <Text style={{ color: EditorColors.mutedText, fontSize: 9, fontWeight: "700", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          BACKGROUND
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {BACKGROUND_OPTIONS.map((opt) => {
            const isActive = (layer.backgroundStyle ?? 'none') === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => onUpdateLayer(layer.id, { backgroundStyle: opt.id })}
                style={{
                  flex: 1, alignItems: "center", gap: 4,
                  paddingVertical: 10, paddingHorizontal: 4,
                  borderRadius: EditorRadius.card,
                  backgroundColor: isActive ? EditorColors.primary + '20' : EditorColors.card,
                  borderWidth: isActive ? 1 : 1,
                  borderColor: isActive ? EditorColors.primary : EditorColors.border,
                  minHeight: 56, justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
                <Text style={{ color: isActive ? EditorColors.primary : EditorColors.foreground, fontSize: 9, fontWeight: isActive ? "800" : "600" }}>
                  {opt.label}
                </Text>
                <Text style={{ color: EditorColors.mutedText, fontSize: 7, fontWeight: "500" }}>
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Layer actions */}
      <View>
        <Text style={{ color: EditorColors.mutedText, fontSize: 9, fontWeight: "700", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          LAYER
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: "◀ Back", action: () => onSendBackward(layer.id), color: EditorColors.foreground, bg: EditorColors.card },
            { label: "Forward ▶", action: () => onBringForward(layer.id), color: EditorColors.foreground, bg: EditorColors.card },
            { label: "✕ Remove", action: () => { onRemoveLayer(layer.id); onClose(); }, color: EditorColors.destructive, bg: EditorColors.destructive + "20" },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.label}
              onPress={btn.action}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: EditorRadius.card,
                backgroundColor: btn.bg, alignItems: "center",
                minHeight: EditorTouch.buttonSm, justifyContent: "center",
              }}
            >
              <Text style={{ color: btn.color, fontSize: EditorType.caption.size, fontWeight: "700" }}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export const LayerStylePanel = React.memo(LayerStylePanelInner);

/**
 * EditorCanvas — gesture-driven Lens canvas with layer rendering.
 *
 * Renders the Lens background (photo or gradient preset) and all layers
 * with gesture controls (drag, pinch, rotate). Supports tap-to-select
 * and drop-to-delete.
 *
 * Bridges the existing template system with the new Lens architecture.
 */
import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { useCanvas, type CanvasLayer } from "@/lib/canvas-state";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/lib/_core/theme";
const FONT_UI = Fonts.sans;
const FONT_MONO = Fonts.mono;
import { getLens } from "@/lib/lenses/registry";
import { useApp } from "@/lib/app-context";
import { getPresetById } from "@/lib/color-presets";
import type { WeekTotals } from "@/lib/templates/shared/types";

// ── Canvas Dimensions ──

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_W = Math.min(SCREEN_W - 4, 396);

function canvasH(ratio: string): number {
  if (ratio === "9:16") return Math.round(CANVAS_W * (16 / 9));
  if (ratio === "4:5") return Math.round(CANVAS_W * (5 / 4));
  return CANVAS_W; // 1:1
}

const SNAP_THRESHOLD = 6;

// ── Background Gradients ──

const GRADIENTS: Record<string, string> = {
  bg1: "#7A2E12", bg2: "#1E3A5F", bg3: "#4A3A24",
  bg4: "#191B33", bg5: "#22392C", bg6: "#2A2A2E",
  bg7: "#8C1E12", bg8: "#14403F", bg9: "#3A1B54",
  bg10: "#333339", bg11: "#5E4A22", bg12: "#0F2A4A",
};

interface EditorCanvasProps {
  onLayerTap?: (id: string | null) => void;
}

export function EditorCanvas({ onLayerTap }: EditorCanvasProps) {
  const colors = useColors();
  const { getSelectedActivity } = useApp();
  const {
    layers,
    selectedLayerId,
    lensId,
    ratio,
    backgroundId,
    updateLayer,
    selectLayer,
    commitHistory,
    removeLayer,
  } = useCanvas();

  const H = canvasH(ratio);
  const activity = getSelectedActivity();
  const currentLens = getLens(lensId);
  const preset = getPresetById("bright-white");

  // Build week totals for lens rendering
  const totals: WeekTotals = useMemo(() => ({
    runKm: 0,
    otherKm: 0,
    totalKm: activity.distance || 0,
    totalMinutes: activity.duration || 0,
    items: [],
  }), [activity]);

  // Shared values for animated snap guides
  const guideX = useSharedValue(0);
  const guideY = useSharedValue(0);
  const showTrash = useSharedValue(0);

  // Tap handler
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(selectLayer)(null);
    if (onLayerTap) runOnJS(onLayerTap)(null);
  });

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  );

  return (
    <GestureDetector gesture={tapGesture}>
      <View
        style={{
          width: CANVAS_W,
          height: H,
          backgroundColor: "#0B0B0C",
          overflow: "hidden",
          borderRadius: 4,
          position: "relative",
        }}
      >
        {/* Background */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: GRADIENTS[backgroundId] ?? GRADIENTS.bg1,
            opacity: 0.8,
          }}
        />

        {/* Lens render (if active) */}
        {currentLens && (
          <View style={{ ...StyleSheet.absoluteFillObject }}>
            {currentLens.render({
              a: activity,
              t: totals,
              u: "metric",
              c: preset.colors,
              fontFamily: FONT_UI,
              fontWeight: "700",
              textTransform: "none",
              activePresetId: undefined,
            })}
          </View>
        )}

        {/* Empty canvas hint */}
        {layers.length === 0 && !currentLens && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
            pointerEvents="none"
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                textAlign: "center",
                lineHeight: 16.8,
              }}
            >
              Choose a Lens below to get started
            </Text>
          </View>
        )}

        {/* Layers */}
        {[...layers]
          .sort((a, b) => a.z - b.z)
          .map((layer) => (
            <LayerView
              key={layer.id}
              layer={layer}
              canvasW={CANVAS_W}
              canvasH={H}
              isSelected={layer.id === selectedLayerId}
              onSelect={() => {
                selectLayer(layer.id);
                if (onLayerTap) onLayerTap(layer.id);
              }}
            />
          ))}

        {/* Trash zone */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 14,
              left: CANVAS_W / 2 - 27,
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: "rgba(255,69,58,0.24)",
              borderWidth: 1.5,
              borderColor: "#FF453A",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              zIndex: 950,
            },
            useAnimatedStyle(() => ({ opacity: showTrash.value })),
          ]}
          pointerEvents="none"
        >
          <Text style={{ fontFamily: FONT_UI, fontWeight: "700", fontSize: 15, color: "#fff" }}>
            ⌫
          </Text>
          <Text style={{ fontFamily: FONT_UI, fontWeight: "700", fontSize: 7.5, letterSpacing: 1.2, color: "#fff" }}>
            DROP
          </Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// ── Layer View ──

interface LayerViewProps {
  layer: CanvasLayer;
  canvasW: number;
  canvasH: number;
  isSelected: boolean;
  onSelect: () => void;
}

function LayerView({ layer, canvasW, canvasH, isSelected, onSelect }: LayerViewProps) {
  const colors = useColors();
  const tx = useSharedValue(layer.x);
  const ty = useSharedValue(layer.y);
  const s = useSharedValue(layer.scale);
  const r = useSharedValue(layer.rotation);

  tx.value = layer.x;
  ty.value = layer.y;
  s.value = layer.scale;
  r.value = layer.rotation;

  const pan = Gesture.Pan()
    .enabled(!layer.locked && isSelected)
    .onStart(() => { runOnJS(onSelect)(); })
    .onUpdate((e) => {
      let nx = layer.x + e.translationX;
      let ny = layer.y + e.translationY;
      if (Math.abs(nx - canvasW / 2) < SNAP_THRESHOLD) nx = canvasW / 2;
      if (Math.abs(ny - canvasH / 2) < SNAP_THRESHOLD) ny = canvasH / 2;
      nx = Math.max(10, Math.min(canvasW - 10, nx));
      ny = Math.max(10, Math.min(canvasH - 10, ny));
      tx.value = nx;
      ty.value = ny;
    });

  const pinch = Gesture.Pinch()
    .enabled(!layer.locked && isSelected)
    .onUpdate((e) => { s.value = Math.max(0.3, Math.min(3.2, layer.scale * e.scale)); });

  const rotate = Gesture.Rotation()
    .enabled(!layer.locked && isSelected)
    .onUpdate((e) => { r.value = layer.rotation + (e.rotation * 180) / Math.PI; });

  const composed = Gesture.Simultaneous(pan, Gesture.Simultaneous(pinch, rotate));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${r.value}deg` },
      { scale: s.value },
    ],
    opacity: layer.opacity,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: layer.w,
            transformOrigin: "center",
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            backgroundColor: "rgba(16,16,18,0.42)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.14)",
            borderRadius: 12,
            padding: 12,
            minHeight: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: FONT_UI, fontWeight: "700", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
            {layer.name}
          </Text>
        </View>

        {isSelected && (
          <View
            style={{
              position: "absolute",
              inset: -6,
              borderWidth: 1.5,
              borderColor: colors.primary,
              borderRadius: 12,
              borderStyle: "dashed",
              pointerEvents: "none",
            }}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

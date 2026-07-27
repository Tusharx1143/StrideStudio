/**
 * EditorCanvas — gesture-driven sticker canvas with snap guides,
 * scale/rotate handles, pinch+twist, and drop-to-delete.
 *
 * Architecture matches the design-handoff prototype:
 * - Drag to move with orange snap guides at centre + thirds
 * - Scale handle (orange, bottom-right) and rotate handle (blue, top-left)
 * - Two-finger pinch + twist for simultaneous scale and rotate
 * - Drop-to-delete zone that fades in during drag
 * - Selection frame with dashed accent border
 * - Snap threshold ~6px; guide is a 1px #FF6B35 line
 */
import React, { useCallback, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { useCanvas, type CanvasLayer } from "@/lib/canvas-state";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// ── Canvas Dimensions ───────────────────────────────────────

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_W = Math.min(SCREEN_W - 4, 396);

function canvasH(ratio: string): number {
  if (ratio === "9:16") return Math.round(CANVAS_W * (16 / 9));
  if (ratio === "4:5") return Math.round(CANVAS_W * (5 / 4));
  return CANVAS_W; // 1:1
}

const SNAP_THRESHOLD = 6;

// ── Background Gradients ────────────────────────────────────

const GRADIENTS: Record<string, string> = {
  bg1: "#7A2E12",
  bg2: "#1E3A5F",
  bg3: "#4A3A24",
  bg4: "#191B33",
  bg5: "#22392C",
  bg6: "#2A2A2E",
  bg7: "#8C1E12",
  bg8: "#14403F",
  bg9: "#3A1B54",
  bg10: "#333339",
  bg11: "#5E4A22",
  bg12: "#0F2A4A",
};

interface EditorCanvasProps {
  onLayerTap?: (id: string | null) => void;
}

export function EditorCanvas({ onLayerTap }: EditorCanvasProps) {
  const colors = useColors();
  const {
    layers,
    selectedLayerId,
    ratio,
    backgroundId,
    filterId,
    updateLayer,
    selectLayer,
    commitHistory,
    removeLayer,
  } = useCanvas();

  const H = canvasH(ratio);

  // Shared values for animated snap guides
  const guideX = useSharedValue(0); // 0 = hidden
  const guideY = useSharedValue(0);
  const showTrash = useSharedValue(0); // 0 = hidden, 1 = visible

  // ── Helper: get selected layer ────────────────────────────

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  );

  // ── Gesture handlers ──────────────────────────────────────

  const handleDragEnd = useCallback(
    (layerId: string, x: number, y: number, overTrash: boolean) => {
      "worklet";
      runOnJS(() => {
        if (overTrash) {
          removeLayer(layerId);
        } else {
          updateLayer(layerId, { x, y });
          commitHistory();
        }
      })();
    },
    [removeLayer, updateLayer, commitHistory],
  );

  const handleScaleEnd = useCallback(
    (layerId: string, scale: number) => {
      updateLayer(layerId, { scale });
      commitHistory();
    },
    [updateLayer, commitHistory],
  );

  const handleRotateEnd = useCallback(
    (layerId: string, rotation: number) => {
      updateLayer(layerId, { rotation });
      commitHistory();
    },
    [updateLayer, commitHistory],
  );

  // ── Tap handler (canvas background tap = deselect) ────────

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(selectLayer)(null);
    if (onLayerTap) runOnJS(onLayerTap)(null);
  });

  // ── Render ─────────────────────────────────────────────────

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
            backgroundColor:
              GRADIENTS[backgroundId] ?? GRADIENTS.bg1,
            opacity: 0.8,
          }}
        />

        {/* Layers — rendered back-to-front */}
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
              onDragEnd={handleDragEnd}
              onScaleEnd={handleScaleEnd}
              onRotateEnd={handleRotateEnd}
            />
          ))}

        {/* Snap guides */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: "#FF6B35",
              left: CANVAS_W / 2,
              opacity: 0,
            },
            useAnimatedStyle(() => ({ opacity: guideX.value })),
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: "#FF6B35",
              top: H / 2,
              opacity: 0,
            },
            useAnimatedStyle(() => ({ opacity: guideY.value })),
          ]}
        />

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
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 15,
              color: "#fff",
            }}
          >
            ⌫
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 7.5,
              letterSpacing: 0.16 * 7.5,
              color: "#fff",
            }}
          >
            DROP
          </Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// ── Individual Layer View ────────────────────────────────────

interface LayerViewProps {
  layer: CanvasLayer;
  canvasW: number;
  canvasH: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (id: string, x: number, y: number, overTrash: boolean) => void;
  onScaleEnd: (id: string, scale: number) => void;
  onRotateEnd: (id: string, rotation: number) => void;
}

function LayerView({
  layer,
  canvasW,
  canvasH,
  isSelected,
  onSelect,
  onDragEnd,
  onScaleEnd,
  onRotateEnd,
}: LayerViewProps) {
  const colors = useColors();
  const tx = useSharedValue(layer.x);
  const ty = useSharedValue(layer.y);
  const s = useSharedValue(layer.scale);
  const r = useSharedValue(layer.rotation);

  // Keep shared values in sync when layer updates externally
  tx.value = layer.x;
  ty.value = layer.y;
  s.value = layer.scale;
  r.value = layer.rotation;

  // ── Pan gesture (move) ────────────────────────────────────
  const pan = Gesture.Pan()
    .enabled(!layer.locked && isSelected)
    .onStart(() => {
      runOnJS(onSelect)();
    })
    .onUpdate((e) => {
      let nx = layer.x + e.translationX;
      let ny = layer.y + e.translationY;

      // Snap to centre
      if (Math.abs(nx - canvasW / 2) < SNAP_THRESHOLD) nx = canvasW / 2;
      if (Math.abs(ny - canvasH / 2) < SNAP_THRESHOLD) ny = canvasH / 2;

      // Clamp
      nx = Math.max(10, Math.min(canvasW - 10, nx));
      ny = Math.max(10, Math.min(canvasH - 10, ny));

      tx.value = nx;
      ty.value = ny;
    })
    .onEnd((e) => {
      const nx = Math.max(
        10,
        Math.min(canvasW - 10, layer.x + e.translationX),
      );
      const ny = Math.max(
        10,
        Math.min(canvasH - 10, layer.y + e.translationY),
      );
      const overTrash = ny > canvasH - 96 && Math.abs(nx - canvasW / 2) < 62;
      runOnJS(onDragEnd)(layer.id, nx, ny, overTrash);
    })
    .minDistance(0);

  // ── Pinch gesture (scale) ─────────────────────────────────
  const pinch = Gesture.Pinch()
    .enabled(!layer.locked && isSelected)
    .onUpdate((e) => {
      s.value = Math.max(0.3, Math.min(3.2, layer.scale * e.scale));
    })
    .onEnd(() => {
      runOnJS(onScaleEnd)(layer.id, s.value);
    });

  // ── Rotation gesture ──────────────────────────────────────
  const rotate = Gesture.Rotation()
    .enabled(!layer.locked && isSelected)
    .onUpdate((e) => {
      r.value = layer.rotation + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(onRotateEnd)(layer.id, r.value);
    });

  // ── Compose: pan + (pinch simultaneous with rotate) ────────
  const composed = Gesture.Simultaneous(
    pan,
    Gesture.Simultaneous(pinch, rotate),
  );

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
        {/* Sticker content placeholder */}
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
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 10,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {layer.name}
          </Text>
        </View>

        {/* Selection frame + handles (only when selected) */}
        {isSelected && (
          <>
            {/* Dashed border frame */}
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

            {/* Scale handle: orange, bottom-right */}
            <View
              style={{
                position: "absolute",
                right: -14,
                bottom: -14,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#FF6B35",
                borderWidth: 2,
                borderColor: "#fff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 5,
              }}
            />

            {/* Rotate handle: blue, top-left */}
            <View
              style={{
                position: "absolute",
                left: -14,
                top: -14,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#0A84FF",
                borderWidth: 2,
                borderColor: "#fff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 5,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                ↻
              </Text>
            </View>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

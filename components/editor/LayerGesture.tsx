/**
 * LayerGesture — draggable, tappable layer overlay.
 *
 * Each layer is a positioned template render. Pan to reposition or
 * drag to the bottom delete zone to remove. Tap to select.
 */
import React, { useMemo } from "react";
import { Text, View, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas } from "@/lib/canvas-state";
import { resolveColors, getFontFamily } from "@/lib/color-presets";
import { useColors } from "@/hooks/use-colors";
import { EditorColors, EditorRadius } from "@/constants/editor-theme";

const SCREEN_W = Dimensions.get("window").width;

interface LayerGestureProps {
  layer: ReturnType<typeof useCanvas>["layers"][0];
  canvasH: number;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string | null) => void;
  onDragOverDelete?: (over: boolean) => void;
}

export const LayerGesture = React.memo(function LayerGesture({ layer, canvasH, onDragStart, onDragEnd, onDragOverDelete }: LayerGestureProps) {
  const colors = useColors();
  const { selectedLayerId, selectLayer, updateLayer, removeLayer } = useCanvas();
  const app = useApp();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const activity = app.getSelectedActivity();
  const totals = useMemo(() => computeWeekTotals(app.activities), [app.activities]);

  const pan = Gesture.Pan()
    .minDistance(10)
    .onBegin(() => { onDragStart?.(layer.id); })
    .onUpdate((e) => {
      tx.value = e.translationX; ty.value = e.translationY;
      const cy = layer.y * canvasH + e.translationY;
      const cx = layer.x * SCREEN_W + e.translationX;
      const over = cy > canvasH - 90 && cx > SCREEN_W / 2 - 70 && cx < SCREEN_W / 2 + 70;
      onDragOverDelete?.(over);
    })
    .onEnd((e) => {
      const cy = layer.y * canvasH + e.translationY;
      const cx = layer.x * SCREEN_W + e.translationX;
      const over = cy > canvasH - 90 && cx > SCREEN_W / 2 - 70 && cx < SCREEN_W / 2 + 70;
      setTimeout(() => {
        if (over) removeLayer(layer.id);
        else updateLayer(layer.id, {
          x: Math.max(0, Math.min(1, layer.x + e.translationX / SCREEN_W)),
          y: Math.max(0, Math.min(1, layer.y + e.translationY / canvasH)),
        });
        onDragEnd?.(null);
        onDragOverDelete?.(false);
      }, 50);
      tx.value = 0; ty.value = 0;
    });

  const tap = Gesture.Tap().onEnd(() => selectLayer(layer.id));
  const composed = Gesture.Exclusive(tap, pan);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const template = ALL_TEMPLATES.find((t) => t.id === layer.templateId);
  const palette = resolveColors(layer.paletteId);
  const layerFont = getFontFamily(layer.fontFamily);
  const finalColors = { ...palette, fontFamily: layerFont.family };
  const isSelected = layer.id === selectedLayerId;

  // Background style map
  const bgStyle = layer.backgroundStyle ?? 'glass';
  const bgColors: Record<string, { bg: string; border: string }> = {
    none:      { bg: 'transparent',                 border: 'transparent' },
    glass:     { bg: 'rgba(15, 23, 42, 0.55)',      border: 'rgba(255,255,255,0.08)' },
    solid:     { bg: '#0F172A',                      border: 'rgba(255,255,255,0.12)' },
    outlined:  { bg: 'rgba(15, 23, 42, 0.15)',      border: 'rgba(255,255,255,0.25)' },
  };
  const bg = bgColors[bgStyle] ?? bgColors.glass;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{
        position: "absolute",
        left: layer.x * SCREEN_W - (SCREEN_W * 0.4) / 2,
        top: layer.y * canvasH - 65,
        width: SCREEN_W * 0.4,
        minHeight: 130,
        borderRadius: EditorRadius.card,
        overflow: "hidden",
        borderWidth: isSelected ? 2 : bgStyle === 'outlined' ? 1 : 0,
        borderColor: isSelected ? EditorColors.primary : bg.border,
        backgroundColor: bg.bg,
        // Glow effect when selected
        shadowColor: isSelected ? EditorColors.primary : "#000",
        shadowOffset: { width: 0, height: isSelected ? 0 : 2 },
        shadowOpacity: isSelected ? 0.5 : 0.15,
        shadowRadius: isSelected ? 16 : 6,
        elevation: isSelected ? 12 : 4,
      }, animatedStyle]}>
        {template && activity && (
          <View style={{ flex: 1, padding: 4 }}>
            {template.render(activity, totals, finalColors)}
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

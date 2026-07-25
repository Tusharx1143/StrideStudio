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
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

  // Background style map — lightened for contrast against dark canvas
  const bgStyle = layer.backgroundStyle ?? 'glass';
  const bgColors: Record<string, { bg: string; border: string }> = {
    none:      { bg: 'transparent',                 border: 'transparent' },
    glass:     { bg: 'rgba(30, 41, 59, 0.65)',      border: 'rgba(255,255,255,0.12)' },
    solid:     { bg: '#1E293B',                      border: 'rgba(255,255,255,0.15)' },
    outlined:  { bg: 'rgba(30, 41, 59, 0.30)',      border: 'rgba(255,255,255,0.30)' },
  };
  const bg = bgColors[bgStyle] ?? bgColors.glass;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{
        position: "absolute",
        left: layer.x * SCREEN_W - (SCREEN_W * 0.75) / 2,
        top: layer.y * canvasH - canvasH * 0.15,
        width: SCREEN_W * 0.75,
        minHeight: Math.min(180, canvasH * 0.45),
        borderRadius: EditorRadius.card,
        overflow: "visible",
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? EditorColors.primary : bg.border,
        backgroundColor: bg.bg,
        // Glow effect — subtle border-glow on dark canvas even when unselected
        shadowColor: isSelected ? EditorColors.primary : "rgba(255,255,255,0.06)",
        shadowOffset: { width: 0, height: isSelected ? 0 : 2 },
        shadowOpacity: isSelected ? 0.5 : 0.08,
        shadowRadius: isSelected ? 16 : 8,
        elevation: isSelected ? 12 : 4,
      }, animatedStyle]}>
        {template && activity && (
          <View style={{ flex: 1, padding: 4 }}>
            <ErrorBoundary>
              {template.render(activity, totals, finalColors)}
            </ErrorBoundary>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

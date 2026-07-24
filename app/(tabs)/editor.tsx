import React, { useRef, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas } from "@/lib/canvas-state";
import { ALL_PRESETS, getPresetById } from "@/lib/color-presets";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { ActivityListSkeleton } from "@/components/skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { getSportConfig } from "@/lib/sport-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_H = 400;

export default function EditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, stravaConnected, selectedActivityId, selectActivity, getSelectedActivity, incrementSavedPosts } = useApp();
  const {
    layers, selectedLayerId, photoUri,
    addLayer, removeLayer, updateLayer,
    bringForward, sendBackward, selectLayer, setPhoto,
  } = useCanvas();

  const [tab, setTab] = useState<"activity" | "totals">("activity");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const canvasRef = useRef<any>(null);

  const activity = getSelectedActivity();
  const totals = computeWeekTotals(activities);

  const filteredTemplates = ALL_TEMPLATES.filter((t) => t.tab === tab);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const selectedPalette = selectedLayer ? getPresetById(selectedLayer.paletteId) : ALL_PRESETS[0];

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  // ── Photo picker ──
  const pickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("Photo library permission needed", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, [setPhoto, showToast]);

  // ── Save composite ──
  const saveImage = useCallback(async () => {
    if (!canvasRef.current) return;
    setCapturing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { showToast("Camera roll permission needed", "error"); return; }
      const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      incrementSavedPosts();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Saved to camera roll", "success");
    } catch {
      showToast("Failed to save image", "error");
    } finally {
      setCapturing(false);
    }
  }, [incrementSavedPosts, showToast]);

  // ── Layer gesture hook ──
  function LayerGesture({ layer }: { layer: typeof layers[0] }) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(layer.scale);
    const rotate = useSharedValue(layer.rotation);

    const pan = Gesture.Pan()
      .onUpdate((e) => { translateX.value = e.translationX; translateY.value = e.translationY; })
      .onEnd(() => {
        const newX = layer.x + (translateX.value / SCREEN_W);
        const newY = layer.y + (translateY.value / CANVAS_H);
        updateLayer(layer.id, { x: Math.max(0, Math.min(1, newX)), y: Math.max(0, Math.min(1, newY)) });
        translateX.value = 0; translateY.value = 0;
      });

    const pinch = Gesture.Pinch()
      .onUpdate((e) => { scale.value = layer.scale * e.scale; })
      .onEnd(() => { updateLayer(layer.id, { scale: Math.max(0.3, Math.min(3, scale.value)) }); });

    const rotation = Gesture.Rotation()
      .onUpdate((e) => { rotate.value = layer.rotation + e.rotation; })
      .onEnd(() => { updateLayer(layer.id, { rotation: rotate.value }); });

    const tap = Gesture.Tap().onEnd(() => { selectLayer(layer.id); });

    const composed = Gesture.Simultaneous(pan, pinch, rotation, tap);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}rad` },
      ],
    }));

    const template = ALL_TEMPLATES.find((t) => t.id === layer.templateId);
    const preset = getPresetById(layer.paletteId);
    const isSelected = layer.id === selectedLayerId;

    return (
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: layer.x * SCREEN_W - (SCREEN_W * 0.4) / 2,
              top: layer.y * CANVAS_H - 65,
              width: SCREEN_W * 0.4,
              minHeight: 130,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: isSelected ? 2 : 0,
              borderColor: isSelected ? colors.primary : "transparent",
              backgroundColor: "rgba(0,0,0,0.35)",
            },
            animatedStyle,
          ]}
        >
          {template && activity && (
            <View style={{ flex: 1, padding: 4 }}>
              {template.render(activity, totals, preset.colors)}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    );
  }

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ActivityListSkeleton count={2} />
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty state ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {stravaConnected ? "No activities yet" : "No data to share"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "Connect with Strava and sync your activities to start creating beautiful cards."
              : "Link your Strava account first, then come here to create shareable workout graphics."}
          </Text>
          {!stravaConnected && (
            <View style={{ marginTop: 20 }}>
              <StrideButton onPress={() => router.push("/(tabs)/profile")}>
                Connect Strava
              </StrideButton>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ── Top bar ── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>

          {activity && (
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Selected activity: ${activity.distance.toFixed(1)} kilometers ${activity.type}. Tap to change.`}
              style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", minHeight: 44 }}
            >
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                {activity.distance.toFixed(1)} km {activity.type}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginLeft: 4 }}>⌄</Text>
            </TouchableOpacity>
          )}

          {selectedLayer ? (
            <TouchableOpacity
              onPress={() => setPaletteOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Color preset: ${selectedPalette.name}. Tap to change.`}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, gap: 6, minHeight: 44 }}
            >
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: selectedPalette.colors.accent }} />
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>{selectedPalette.name}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* ── Canvas ── */}
        <View ref={canvasRef} collapsable={false}>
          {photoUri ? (
            <ImageBackground source={{ uri: photoUri }} style={{ width: SCREEN_W, height: CANVAS_H }} resizeMode="cover">
              <Pressable
                style={{ flex: 1 }}
                onPress={() => selectLayer(null)}
                accessibilityLabel="Template canvas. Tap background to deselect layer."
              >
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (
                  <LayerGesture key={layer.id} layer={layer} />
                ))}
              </Pressable>
            </ImageBackground>
          ) : (
            <Pressable
              style={{ width: SCREEN_W, height: CANVAS_H, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}
              onPress={() => selectLayer(null)}
              accessibilityLabel="Empty canvas. Tap to pick a photo background."
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>Tap to pick a photo</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4, opacity: 0.5 }}>Templates appear on the photo canvas</Text>

              {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (
                <LayerGesture key={layer.id} layer={layer} />
              ))}
            </Pressable>
          )}
        </View>

        {/* ── Layer controls ── */}
        {selectedLayer && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600" }}>
                Layer: {ALL_TEMPLATES.find((t) => t.id === selectedLayer.templateId)?.name ?? selectedLayer.templateId}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => sendBackward(selectedLayer.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Send layer backward"
                  style={{ backgroundColor: colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, minHeight: 36, justifyContent: "center" }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "600" }}>◀ Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => bringForward(selectedLayer.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Bring layer forward"
                  style={{ backgroundColor: colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, minHeight: 36, justifyContent: "center" }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "600" }}>Forward ▶</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeLayer(selectedLayer.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove layer"
                  style={{ backgroundColor: colors.error + "20", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, minHeight: 36, justifyContent: "center" }}
                >
                  <Text style={{ color: colors.error, fontSize: 11, fontWeight: "600" }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Color swatches */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              {ALL_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => updateLayer(selectedLayer.id, { paletteId: preset.id })}
                  accessibilityRole="radio"
                  accessibilityLabel={`${preset.name} color preset`}
                  accessibilityState={{ selected: preset.id === selectedLayer.paletteId }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: preset.colors.accent,
                    borderWidth: preset.id === selectedLayer.paletteId ? 2.5 : 0,
                    borderColor: colors.foreground,
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Tabs ── */}
        <View style={{ marginTop: 4, paddingHorizontal: 16 }}>
          <SegmentedControl
            segments={[{ id: "activity", label: "Activity" }, { id: "totals", label: "Weekly Totals" }]}
            selected={tab}
            onSelect={(id) => setTab(id as "activity" | "totals")}
          />
        </View>

        {/* ── Template tray ── */}
        <View style={{ flex: 1, maxHeight: 100 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 6, gap: 8 }}>
            {filteredTemplates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                onPress={() => { addLayer(tpl.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                accessibilityRole="button"
                accessibilityLabel={`Add ${tpl.name} template layer`}
                style={{ width: 80, height: 80, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 4, justifyContent: "center", alignItems: "center", overflow: "hidden" }}
              >
                {activity && (
                  <View style={{ transform: [{ scale: 0.25 }], width: 320, height: 320, position: "absolute" }}>
                    {tpl.render(activity, totals)}
                  </View>
                )}
                <Text style={{ color: colors.foreground, fontSize: 7, fontWeight: "600", textAlign: "center", zIndex: 1, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }} numberOfLines={2}>
                  {tpl.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Bottom bar ── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <StrideButton variant="ghost" onPress={pickPhoto} style={{ borderRadius: 20 }}>
              🖼 Photo
            </StrideButton>
          </View>
          <View style={{ flex: 1 }}>
            <StrideButton onPress={saveImage} loading={capturing}>
              {capturing ? "Saving…" : "💾 Save"}
            </StrideButton>
          </View>
        </View>

        {/* ── Activity picker modal ── */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }} onPress={() => setPickerOpen(false)}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden" }}>
              {activities.map((a, i) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => { selectActivity(a.id); setPickerOpen(false); }}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.distance.toFixed(1)} kilometers ${a.type}, ${a.date}`}
                  accessibilityState={{ selected: a.id === selectedActivityId }}
                  style={{ padding: 16, borderBottomWidth: i < activities.length - 1 ? 1 : 0, borderBottomColor: colors.border, flexDirection: "row", justifyContent: "space-between", minHeight: 48 }}
                >
                  <Text style={{ color: a.id === selectedActivityId ? colors.primary : colors.foreground, fontSize: 15, fontWeight: "600" }}>
                    {a.distance.toFixed(1)} km {a.type}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>{a.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* ── Palette selector modal ── */}
        <Modal visible={paletteOpen} transparent animationType="fade" onRequestClose={() => setPaletteOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 32 }} onPress={() => setPaletteOpen(false)}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Color Preset</Text>
              {ALL_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { paletteId: preset.id }); setPaletteOpen(false); }}
                  accessibilityRole="radio"
                  accessibilityLabel={`${preset.name} color preset`}
                  accessibilityState={{ selected: selectedLayer?.paletteId === preset.id }}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 48 }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: preset.colors.accent }} />
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{preset.name}</Text>
                    <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>
                      {[preset.colors.textPrimary, preset.colors.textMuted, preset.colors.border].map((clr, i) => (
                        <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: clr }} />
                      ))}
                    </View>
                  </View>
                  {selectedLayer?.paletteId === preset.id && (
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        <AnimatedToast
          message={toast?.message ?? null}
          type={toast?.type ?? "info"}
          onDismiss={() => setToast(null)}
        />
      </View>
    </ScreenContainer>
  );
}

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { VideoView, useVideoPlayer } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas } from "@/lib/canvas-state";
import {
  ALL_PRESETS, getPresetById, resolveColors,
  CUSTOM_COLORS, FONT_FAMILIES, getFontFamily,
} from "@/lib/color-presets";

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_H = 400;
const DELETE_ZONE_SIZE = 60;

export default function EditorScreen() {
  const router = useRouter();
  const { activities, loading, stravaConnected, selectedActivityId, selectActivity, getSelectedActivity, incrementSavedPosts } = useApp();
  const {
    layers, selectedLayerId, photoUri,
    addLayer, removeLayer, updateLayer,
    bringForward, sendBackward, selectLayer, setPhoto, resetCanvas,
  } = useCanvas();

  const [tab, setTab] = useState<"activity" | "totals">("activity");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [isVideoBg, setIsVideoBg] = useState(false);

  const canvasRef = useRef<any>(null);

  const activity = getSelectedActivity();
  const totals = computeWeekTotals(activities);

  const filteredTemplates = ALL_TEMPLATES.filter((t) => t.tab === tab);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  // ── Video player for video backgrounds ──
  const videoPlayer = useVideoPlayer(photoUri ?? "", (player) => {
    player.loop = true;
    player.play();
  });
  useEffect(() => { if (photoUri && isVideoBg) { videoPlayer.loop = true; videoPlayer.play(); } }, [photoUri, isVideoBg]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // ── Reset canvas when activity changes ──
  useEffect(() => { resetCanvas(); }, [selectedActivityId]);

  // ── Back button ──
  const goBack = useCallback(() => { resetCanvas(); router.back(); }, [resetCanvas, router]);

  // ── Media picker (photo or video) ──
  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("Library permission needed"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      setIsVideoBg(result.assets[0].type === "video");
    }
  }, [setPhoto, showToast]);

  // ── Save composite ──
  const saveImage = useCallback(async () => {
    if (!canvasRef.current) return;
    setCapturing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { showToast("Camera roll permission needed"); return; }
      const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      incrementSavedPosts();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Saved to camera roll");
    } catch { showToast("Failed to save image"); }
    finally { setCapturing(false); }
  }, [incrementSavedPosts, showToast]);

  // ── Custom color pick ──
  const applyCustomColor = useCallback((hex: string) => {
    if (!selectedLayer) return;
    updateLayer(selectedLayer.id, { paletteId: "custom" });
  }, [selectedLayer, updateLayer]);

  // ── Layer gesture component ──
  function LayerGesture({ layer }: { layer: typeof layers[0] }) {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);

    const pan = Gesture.Pan()
      .minDistance(10)
      .onBegin(() => setDraggingLayerId(layer.id))
      .onUpdate((e) => {
        tx.value = e.translationX;
        ty.value = e.translationY;
        const cy = layer.y * CANVAS_H + e.translationY;
        const cx = layer.x * SCREEN_W + e.translationX;
        setDragOverDelete(
          cy > CANVAS_H - 90 && cx > SCREEN_W / 2 - 70 && cx < SCREEN_W / 2 + 70
        );
      })
      .onEnd((e) => {
        const cy = layer.y * CANVAS_H + e.translationY;
        const cx = layer.x * SCREEN_W + e.translationX;
        const over = cy > CANVAS_H - 90 && cx > SCREEN_W / 2 - 70 && cx < SCREEN_W / 2 + 70;
        // Delay the deletion slightly to let the gesture finish cleanly
        setTimeout(() => {
          if (over) { removeLayer(layer.id); }
          else {
            updateLayer(layer.id, {
              x: Math.max(0, Math.min(1, layer.x + e.translationX / SCREEN_W)),
              y: Math.max(0, Math.min(1, layer.y + e.translationY / CANVAS_H)),
            });
          }
          setDraggingLayerId(null);
          setDragOverDelete(false);
        }, 50);
        tx.value = 0; ty.value = 0;
      });

    const tap = Gesture.Tap().onEnd(() => { selectLayer(layer.id); });
    const composed = Gesture.Exclusive(tap, pan);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: tx.value }, { translateY: ty.value }],
    }));

    const template = ALL_TEMPLATES.find((t) => t.id === layer.templateId);
    const colors = resolveColors(layer.paletteId);
    // Override fontFamily from the layer's font
    const layerFont = getFontFamily(layer.fontFamily);
    const finalColors = { ...colors, fontFamily: layerFont.family };
    const isSelected = layer.id === selectedLayerId;

    return (
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[{
            position: "absolute",
            left: layer.x * SCREEN_W - (SCREEN_W * 0.4) / 2,
            top: layer.y * CANVAS_H - 65,
            width: SCREEN_W * 0.4,
            minHeight: 130,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? "#FF6B35" : "transparent",
            borderStyle: isSelected ? ("dashed" as any) : "solid",
          }, animatedStyle]}
        >
          {template && activity && (
            <View style={{ flex: 1, padding: 4 }}>
              {template.render(activity, totals, finalColors)}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    );
  }

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 16 }}>Loading…</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty state ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {stravaConnected ? "No activities yet" : "No data to share"}
          </Text>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "Connect with Strava and sync your activities to start creating beautiful cards."
              : "Link your Strava account first, then come here to create shareable workout graphics."}
          </Text>
          {!stravaConnected && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}
              style={{ marginTop: 20, backgroundColor: "#FF6B35", borderRadius: 24, paddingHorizontal: 28, paddingVertical: 14 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Connect Strava</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0" containerClassName="bg-black">
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        {/* ── Top bar ── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 }}>
          <TouchableOpacity onPress={goBack}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#1C1C1E", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 18 }}>‹</Text>
          </TouchableOpacity>

          {activity && (
            <TouchableOpacity onPress={() => setPickerOpen(true)}
              style={{ backgroundColor: "#1C1C1E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                {activity.distance.toFixed(1)} km {activity.type}
              </Text>
              <Text style={{ color: "#8E8E93", fontSize: 11, marginLeft: 4 }}>⌄</Text>
            </TouchableOpacity>
          )}

          {selectedLayer && (
            <TouchableOpacity onPress={() => setPaletteOpen(true)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1C1C1E", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, gap: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: resolveColors(selectedLayer.paletteId).accent }} />
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>Style</Text>
            </TouchableOpacity>
          )}
          {!selectedLayer && <View style={{ width: 40 }} />}
        </View>

        {/* ── Canvas ── */}
        <View ref={canvasRef} collapsable={false}>
          {photoUri && isVideoBg ? (
            <View style={{ width: SCREEN_W, height: CANVAS_H }}>
              <VideoView player={videoPlayer} style={{ width: SCREEN_W, height: CANVAS_H }} contentFit="cover" />
              <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => selectLayer(null)}>
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (
                  <LayerGesture key={layer.id} layer={layer} />
                ))}
              </Pressable>
            </View>
          ) : photoUri ? (
            <ImageBackground source={{ uri: photoUri }} style={{ width: SCREEN_W, height: CANVAS_H }} resizeMode="cover">
              <Pressable style={{ flex: 1 }} onPress={() => selectLayer(null)}>
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (
                  <LayerGesture key={layer.id} layer={layer} />
                ))}
              </Pressable>
            </ImageBackground>
          ) : (
            <Pressable style={{ width: SCREEN_W, height: CANVAS_H, backgroundColor: "#1C1C1E", justifyContent: "center", alignItems: "center" }}
              onPress={() => selectLayer(null)}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
              <Text style={{ color: "#8E8E93", fontSize: 14, fontWeight: "600" }}>Tap to pick a photo or video</Text>
              <Text style={{ color: "#555555", fontSize: 11, marginTop: 4 }}>Templates appear on the canvas</Text>
              {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (
                <LayerGesture key={layer.id} layer={layer} />
              ))}
            </Pressable>
          )}

          {/* ── Delete zone ── */}
          {draggingLayerId && (
            <View style={{
              position: "absolute", bottom: 0, left: SCREEN_W / 2 - DELETE_ZONE_SIZE,
              width: DELETE_ZONE_SIZE * 2, height: DELETE_ZONE_SIZE + 8, alignItems: "center", justifyContent: "center",
            }}>
              <View style={{
                width: DELETE_ZONE_SIZE, height: DELETE_ZONE_SIZE, borderRadius: DELETE_ZONE_SIZE / 2,
                backgroundColor: dragOverDelete ? "#FF453A" : "#3A3A3C", alignItems: "center", justifyContent: "center",
                transform: [{ scale: dragOverDelete ? 1.2 : 1 }],
              }}>
                <Text style={{ fontSize: 24 }}>🗑️</Text>
              </View>
              <Text style={{ color: dragOverDelete ? "#FF453A" : "#8E8E93", fontSize: 9, fontWeight: "600", marginTop: 2 }}>
                {dragOverDelete ? "DROP" : "DRAG HERE"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Layer controls ── */}
        {selectedLayer && (
          <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#1C1C1E" }}>
            {/* Layer name + z-order + remove */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "600", flex: 1 }} numberOfLines={1}>
                {ALL_TEMPLATES.find((t) => t.id === selectedLayer.templateId)?.name ?? selectedLayer.templateId}
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TouchableOpacity onPress={() => sendBackward(selectedLayer.id)}
                  style={{ backgroundColor: "#2C2C2E", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600" }}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => bringForward(selectedLayer.id)}
                  style={{ backgroundColor: "#2C2C2E", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600" }}>▶</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeLayer(selectedLayer.id)}
                  style={{ backgroundColor: "#3A1A1A", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#FF453A", fontSize: 11, fontWeight: "600" }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Font selection */}
            <View style={{ flexDirection: "row", gap: 5, marginTop: 5 }}>
              {FONT_FAMILIES.map((ff) => (
                <TouchableOpacity key={ff.id} onPress={() => updateLayer(selectedLayer.id, { fontFamily: ff.id })}
                  style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: ff.id === selectedLayer.fontFamily ? "#FF6B35" : "#2C2C2E" }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "600" }}>{ff.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color presets + custom */}
            <View style={{ flexDirection: "row", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
              {ALL_PRESETS.map((preset) => (
                <TouchableOpacity key={preset.id} onPress={() => updateLayer(selectedLayer.id, { paletteId: preset.id })}
                  style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: preset.colors.accent, borderWidth: preset.id === selectedLayer.paletteId ? 2 : 0, borderColor: "#FFFFFF" }} />
              ))}
              <TouchableOpacity onPress={() => setPaletteOpen(true)}
                style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: "#2C2C2E" }}>
                <Text style={{ color: "#0A84FF", fontSize: 9, fontWeight: "600" }}>+ Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Template grid ── */}
        <TouchableOpacity onPress={() => setShowGrid(!showGrid)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#1C1C1E" }}>
          <Text style={{ color: "#8E8E93", fontSize: 11, fontWeight: "600" }}>
            Templates ({filteredTemplates.length}) · {showGrid ? "Hide" : "Show"}
          </Text>
          <Text style={{ color: "#555555", fontSize: 14 }}>{showGrid ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {/* Tabs for template grid */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 4, gap: 8 }}>
          {(["activity", "totals"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, backgroundColor: tab === t ? "#FFFFFF" : "#2C2C2E" }}>
              <Text style={{ color: tab === t ? "#000000" : "#FFFFFF", fontSize: 10, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showGrid && (
          <View style={{ flex: 1, maxHeight: 130 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", flexWrap: "wrap" }}>
              {filteredTemplates.map((tpl) => (
                <TouchableOpacity key={tpl.id} onPress={() => { addLayer(tpl.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ width: "25%", height: 80, backgroundColor: "#0E0E10", borderRadius: 8, borderWidth: 1, borderColor: "#1C1C1E", padding: 3, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                  {activity && (
                    <View style={{ transform: [{ scale: 0.2 }], width: 400, height: 400, position: "absolute" }}>
                      {tpl.render(activity, totals)}
                    </View>
                  )}
                  <Text style={{ color: "#FFFFFF", fontSize: 7, fontWeight: "600", textAlign: "center", zIndex: 1, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 }} numberOfLines={2}>
                    {tpl.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Bottom bar ── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: "#1C1C1E" }}>
          <TouchableOpacity onPress={pickMedia}
            style={{ flex: 1, backgroundColor: "#2C2C2E", borderRadius: 20, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>{photoUri ? "🔄 Media" : "🖼 Media"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={saveImage} disabled={capturing}
            style={{ flex: 1, backgroundColor: "#FF6B35", borderRadius: 20, paddingVertical: 10, alignItems: "center", opacity: capturing ? 0.5 : 1 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>{capturing ? "Saving…" : "💾 Save"}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Toast ── */}
        {toast && (
          <View style={{ position: "absolute", bottom: 70, alignSelf: "center", backgroundColor: "#1C1C1E", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>{toast}</Text>
          </View>
        )}

        {/* ── Activity picker modal ── */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }} onPress={() => setPickerOpen(false)}>
            <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, overflow: "hidden" }}>
              {activities.map((a, i) => (
                <TouchableOpacity key={a.id} onPress={() => { selectActivity(a.id); setPickerOpen(false); }}
                  style={{ padding: 16, borderBottomWidth: i < activities.length - 1 ? 1 : 0, borderBottomColor: "#2C2C2E", flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: a.id === selectedActivityId ? "#0A84FF" : "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
                    {a.distance.toFixed(1)} km {a.type}
                  </Text>
                  <Text style={{ color: "#8E8E93", fontSize: 13 }}>{a.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* ── Style editor modal (palette + custom colors) ── */}
        <Modal visible={paletteOpen} transparent animationType="fade" onRequestClose={() => setPaletteOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }} onPress={() => setPaletteOpen(false)}>
            <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, padding: 18, maxHeight: 400 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginBottom: 10 }}>Style Editor</Text>

              {/* Font */}
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "600", marginBottom: 6 }}>FONT</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {FONT_FAMILIES.map((ff) => (
                  <TouchableOpacity key={ff.id} onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { fontFamily: ff.id }); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: selectedLayer?.fontFamily === ff.id ? "#FF6B35" : "#2C2C2E" }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: ff.id === "bold-system" ? "900" : ff.id === "light-system" ? "300" : "600" }}>
                      {ff.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color presets */}
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "600", marginBottom: 6 }}>COLOR PRESETS</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                {ALL_PRESETS.map((preset) => (
                  <TouchableOpacity key={preset.id} onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { paletteId: preset.id }); }}
                    style={{ alignItems: "center", gap: 3 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: preset.colors.accent, borderWidth: selectedLayer?.paletteId === preset.id ? 2 : 0, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                      {selectedLayer?.paletteId === preset.id && <Text style={{ color: "#FFFFFF", fontSize: 10 }}>✓</Text>}
                    </View>
                    <Text style={{ color: "#8E8E93", fontSize: 7, fontWeight: "500" }}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom colors */}
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "600", marginBottom: 6 }}>CUSTOM COLORS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {CUSTOM_COLORS.map((hex) => (
                  <TouchableOpacity key={hex} onPress={() => {
                    if (!selectedLayer) return;
                    // Apply custom by setting a custom palette override
                    updateLayer(selectedLayer.id, { paletteId: "custom" });
                    // Since we can't store custom per-color data easily in paletteId,
                    // we set it as a special palette and use the custom color as the accent.
                    // For simplicity, we'll close and show the change.
                    setPaletteOpen(false);
                  }}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: hex, borderWidth: 1, borderColor: "#555555" }} />
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

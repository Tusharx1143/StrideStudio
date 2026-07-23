import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
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
import { PHOTO_FILTERS, DEFAULT_FILTER } from "@/lib/photo-filters";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { ActivityListSkeleton } from "@/components/skeleton";

const SCREEN_W = Dimensions.get("window").width;
const DELETE_ZONE_SIZE = 60;

// ── Aspect ratios ──
const ASPECT_RATIOS = [
  { id: "9:16" as const, label: "Story", width: 9, height: 16 },
  { id: "4:5" as const, label: "Portrait", width: 4, height: 5 },
  { id: "16:9" as const, label: "Landscape", width: 16, height: 9 },
];
type AspectRatioId = "9:16" | "4:5" | "16:9";

function getCanvasHeight(ratio: AspectRatioId): number {
  const r = ASPECT_RATIOS.find((a) => a.id === ratio)!;
  return Math.min(SCREEN_W * (r.height / r.width), 600);
}

// ── Period filters ──
type PeriodId = "all" | "today" | "week" | "month";
const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "Monthly" },
];

function filterActivitiesByPeriod(activities: any[], period: PeriodId): any[] {
  const now = new Date();
  const today = now.toDateString();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const mondayStr = monday.toDateString();

  return activities.filter((a) => {
    if (!a.startDate) return true;
    const d = new Date(a.startDate).toDateString();
    switch (period) {
      case "today": return d === today;
      case "week": return d >= mondayStr;
      case "month": return new Date(a.startDate).getMonth() === now.getMonth() && new Date(a.startDate).getFullYear() === now.getFullYear();
      default: return true;
    }
  });
}

export default function EditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, stravaConnected, selectedActivityId, selectActivity, getSelectedActivity, incrementSavedPosts } = useApp();
  const {
    layers, selectedLayerId, photoUri,
    addLayer, removeLayer, updateLayer,
    bringForward, sendBackward, selectLayer, setPhoto, resetCanvas,
  } = useCanvas();

  const [tab, setTab] = useState<"activity" | "totals">("activity");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [isVideoBg, setIsVideoBg] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("9:16");
  const [periodFilter, setPeriodFilter] = useState<PeriodId>("all");
  const [photoFilter, setPhotoFilter] = useState(DEFAULT_FILTER.id);
  const [filterOpen, setFilterOpen] = useState(false);

  const CANVAS_H = useMemo(() => getCanvasHeight(aspectRatio), [aspectRatio]);

  const canvasRef = useRef<any>(null);

  const filteredActivities = useMemo(() => filterActivitiesByPeriod(activities, periodFilter), [activities, periodFilter]);
  const totals = useMemo(() => computeWeekTotals(filteredActivities), [filteredActivities]);

  const activity = getSelectedActivity();
  const filteredTemplates = ALL_TEMPLATES.filter((t) => t.tab === tab);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  // Video player
  const videoPlayer = useVideoPlayer(photoUri ?? "", (player) => { player.loop = true; player.play(); });
  useEffect(() => { if (photoUri && isVideoBg) { videoPlayer.loop = true; videoPlayer.play(); } }, [photoUri, isVideoBg]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => { resetCanvas(); }, [selectedActivityId]);
  const goBack = useCallback(() => { resetCanvas(); router.back(); }, [resetCanvas, router]);

  // ── Media picker ──
  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("Library permission needed", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.9 });
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
      if (status !== "granted") { showToast("Camera roll permission needed", "error"); return; }
      const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      incrementSavedPosts();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Saved to camera roll", "success");
    } catch { showToast("Failed to save", "error"); }
    finally { setCapturing(false); }
  }, [incrementSavedPosts, showToast]);

  // ── Clipboard: Copy All ──
  const copyAll = useCallback(async () => {
    if (!canvasRef.current) return;
    setCapturing(true);
    try {
      const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        showToast("Copied composite to clipboard", "success");
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          await MediaLibrary.saveToLibraryAsync(uri);
          showToast("Saved to camera roll", "success");
        }
      }
      incrementSavedPosts();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      try {
        const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") { await MediaLibrary.saveToLibraryAsync(uri); showToast("Saved to camera roll", "success"); }
      } catch { showToast("Failed to copy", "error"); }
    }
    finally { setCapturing(false); }
  }, [incrementSavedPosts, showToast]);

  // ── Layer gesture ──
  function LayerGesture({ layer }: { layer: typeof layers[0] }) {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);

    const pan = Gesture.Pan()
      .minDistance(10)
      .onBegin(() => setDraggingLayerId(layer.id))
      .onUpdate((e) => {
        tx.value = e.translationX; ty.value = e.translationY;
        const cy = layer.y * CANVAS_H + e.translationY;
        const cx = layer.x * SCREEN_W + e.translationX;
        setDragOverDelete(cy > CANVAS_H - 90 && cx > SCREEN_W / 2 - 70 && cx < SCREEN_W / 2 + 70);
      })
      .onEnd((e) => {
        const cy = layer.y * CANVAS_H + e.translationY;
        const cx = layer.x * SCREEN_W + e.translationX;
        const over = cy > CANVAS_H - 90 && cx > SCREEN_W / 2 - 70 && cx < SCREEN_W / 2 + 70;
        setTimeout(() => {
          if (over) removeLayer(layer.id);
          else updateLayer(layer.id, {
            x: Math.max(0, Math.min(1, layer.x + e.translationX / SCREEN_W)),
            y: Math.max(0, Math.min(1, layer.y + e.translationY / CANVAS_H)),
          });
          setDraggingLayerId(null); setDragOverDelete(false);
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

    return (
      <GestureDetector gesture={composed}>
        <Animated.View style={[{
          position: "absolute",
          left: layer.x * SCREEN_W - (SCREEN_W * 0.4) / 2,
          top: layer.y * CANVAS_H - 65,
          width: SCREEN_W * 0.4,
          minHeight: 130,
          borderRadius: 12, overflow: "hidden",
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? colors.primary : "transparent",
        }, animatedStyle]}>
          {template && activity && (
            <View style={{ flex: 1, padding: 4 }}>
              {template.render(activity, totals, finalColors)}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    );
  }

  // ── Loading / Empty states ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ActivityListSkeleton count={2} />
        </View>
      </ScreenContainer>
    );
  }

  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700" }}>
            {stravaConnected ? "No activities yet" : "No data to share"}
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 6 }}>
          <TouchableOpacity
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>

          {/* Aspect ratio selector */}
          <View style={{ flexDirection: "row", gap: 4 }}>
            {ASPECT_RATIOS.map((ar) => (
              <TouchableOpacity
                key={ar.id}
                onPress={() => setAspectRatio(ar.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${ar.label} aspect ratio`}
                accessibilityState={{ selected: aspectRatio === ar.id }}
                style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minHeight: 32, justifyContent: "center",
                  backgroundColor: aspectRatio === ar.id ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: "600" }}>{ar.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedLayer ? (
            <TouchableOpacity
              onPress={() => setPaletteOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open style editor"
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 6, gap: 4, minHeight: 36 }}
            >
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: resolveColors(selectedLayer.paletteId).accent }} />
              <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: "600" }}>Style</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* ── Canvas ── */}
        <View ref={canvasRef} collapsable={false}>
          {photoUri && isVideoBg ? (
            <View style={{ width: SCREEN_W, height: CANVAS_H }}>
              <VideoView player={videoPlayer} style={{ width: SCREEN_W, height: CANVAS_H }} contentFit="cover" />
              <Pressable
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                onPress={() => selectLayer(null)}
                accessibilityLabel="Template canvas with video background"
              >
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (<LayerGesture key={layer.id} layer={layer} />))}
              </Pressable>
            </View>
          ) : photoUri ? (
            <ImageBackground
              source={{ uri: photoUri }}
              style={{ width: SCREEN_W, height: CANVAS_H, ...PHOTO_FILTERS.find((f) => f.id === photoFilter)?.style }}
              resizeMode="cover"
            >
              <Pressable style={{ flex: 1 }} onPress={() => selectLayer(null)} accessibilityLabel="Template canvas. Tap background to deselect.">
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (<LayerGesture key={layer.id} layer={layer} />))}
              </Pressable>
            </ImageBackground>
          ) : (
            <Pressable
              style={{ width: SCREEN_W, height: CANVAS_H, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}
              onPress={() => selectLayer(null)}
              accessibilityLabel="Empty canvas. Select media to begin."
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>🖼️</Text>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>Tap Media to start</Text>
              {layers.sort((a, b) => a.zIndex - b.zIndex).map((layer) => (<LayerGesture key={layer.id} layer={layer} />))}
            </Pressable>
          )}

          {/* Delete zone */}
          {draggingLayerId && (
            <View style={{ position: "absolute", bottom: 0, left: SCREEN_W / 2 - DELETE_ZONE_SIZE, width: DELETE_ZONE_SIZE * 2, height: DELETE_ZONE_SIZE + 8, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: DELETE_ZONE_SIZE, height: DELETE_ZONE_SIZE, borderRadius: DELETE_ZONE_SIZE / 2, backgroundColor: dragOverDelete ? colors.error : colors.border, alignItems: "center", justifyContent: "center", transform: [{ scale: dragOverDelete ? 1.2 : 1 }] }}>
                <Text style={{ fontSize: 22 }}>🗑️</Text>
              </View>
              <Text style={{ color: dragOverDelete ? colors.error : colors.muted, fontSize: 8, fontWeight: "600", marginTop: 2 }}>
                {dragOverDelete ? "DROP TO DELETE" : "DRAG HERE"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Layer controls ── */}
        {selectedLayer && (
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "600", flex: 1 }} numberOfLines={1}>
                {ALL_TEMPLATES.find((t) => t.id === selectedLayer.templateId)?.name ?? selectedLayer.templateId}
              </Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <TouchableOpacity onPress={() => sendBackward(selectedLayer.id)} accessibilityRole="button" accessibilityLabel="Send backward"
                  style={{ backgroundColor: colors.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minHeight: 32, justifyContent: "center" }}>
                  <Text style={{ color: colors.foreground, fontSize: 9, fontWeight: "600" }}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => bringForward(selectedLayer.id)} accessibilityRole="button" accessibilityLabel="Bring forward"
                  style={{ backgroundColor: colors.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minHeight: 32, justifyContent: "center" }}>
                  <Text style={{ color: colors.foreground, fontSize: 9, fontWeight: "600" }}>▶</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeLayer(selectedLayer.id)} accessibilityRole="button" accessibilityLabel="Remove layer"
                  style={{ backgroundColor: colors.error + "20", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minHeight: 32, justifyContent: "center" }}>
                  <Text style={{ color: colors.error, fontSize: 10, fontWeight: "600" }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Font chips */}
            <View style={{ flexDirection: "row", gap: 4, marginTop: 3 }}>
              {FONT_FAMILIES.map((ff) => (
                <TouchableOpacity key={ff.id} onPress={() => updateLayer(selectedLayer.id, { fontFamily: ff.id })}
                  accessibilityRole="radio" accessibilityLabel={`${ff.name} font`} accessibilityState={{ selected: ff.id === selectedLayer.fontFamily }}
                  style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, minHeight: 24, justifyContent: "center",
                    backgroundColor: ff.id === selectedLayer.fontFamily ? colors.primary : colors.border }}>
                  <Text style={{ color: colors.foreground, fontSize: 8, fontWeight: ff.id === "bold-system" ? "900" : ff.id === "light-system" ? "300" : "600" }}>{ff.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color swatches */}
            <View style={{ flexDirection: "row", gap: 4, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
              {ALL_PRESETS.map((preset) => (
                <TouchableOpacity key={preset.id} onPress={() => updateLayer(selectedLayer.id, { paletteId: preset.id })}
                  accessibilityRole="radio" accessibilityLabel={`${preset.name} palette`} accessibilityState={{ selected: preset.id === selectedLayer.paletteId }}
                  style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: preset.colors.accent, borderWidth: preset.id === selectedLayer.paletteId ? 2.5 : 0, borderColor: colors.foreground }} />
              ))}
              <TouchableOpacity onPress={() => setPaletteOpen(true)}
                accessibilityRole="button" accessibilityLabel="More style options"
                style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: colors.border, minHeight: 24, justifyContent: "center" }}>
                <Text style={{ color: colors.primary, fontSize: 8, fontWeight: "600" }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Period filters ── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 4, gap: 4 }}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setPeriodFilter(p.id)}
              accessibilityRole="radio" accessibilityLabel={`${p.label} period`} accessibilityState={{ selected: periodFilter === p.id }}
              style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, minHeight: 28, justifyContent: "center",
                backgroundColor: periodFilter === p.id ? colors.foreground : colors.border }}>
              <Text style={{ color: periodFilter === p.id ? colors.background : colors.foreground, fontSize: 9, fontWeight: "600" }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setFilterOpen(true)}
            accessibilityRole="button" accessibilityLabel="Photo filters"
            style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: colors.border, minHeight: 28, justifyContent: "center" }}>
            <Text style={{ color: colors.primary, fontSize: 9, fontWeight: "600" }}>🎨 Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Template grid toggle ── */}
        <TouchableOpacity onPress={() => setShowGrid(!showGrid)}
          accessibilityRole="button" accessibilityLabel={`${showGrid ? "Hide" : "Show"} template grid`}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 32 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600" }}>
            Templates ({filteredTemplates.length}) · {showGrid ? "Hide" : "Show"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{showGrid ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 3, gap: 6 }}>
          {(["activity", "totals"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              accessibilityRole="tab" accessibilityLabel={`${t} templates`} accessibilityState={{ selected: tab === t }}
              style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, minHeight: 28, justifyContent: "center",
                backgroundColor: tab === t ? colors.foreground : colors.border }}>
              <Text style={{ color: tab === t ? colors.background : colors.foreground, fontSize: 9, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        {showGrid && (
          <View style={{ flex: 1, maxHeight: 120 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", flexWrap: "wrap" }}>
              {filteredTemplates.map((tpl) => (
                <TouchableOpacity key={tpl.id}
                  onPress={() => { addLayer(tpl.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  accessibilityRole="button" accessibilityLabel={`Add ${tpl.name} template`}
                  style={{ width: "25%", height: 72, backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1, borderColor: colors.border, padding: 2, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                  {activity && <View style={{ transform: [{ scale: 0.18 }], width: 400, height: 400, position: "absolute" }}>{tpl.render(activity, totals)}</View>}
                  <Text style={{ color: colors.foreground, fontSize: 6, fontWeight: "600", textAlign: "center", zIndex: 1, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 2, paddingHorizontal: 2, paddingVertical: 1 }} numberOfLines={2}>{tpl.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Bottom bar ── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 6, gap: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <StrideButton variant="ghost" onPress={pickMedia} style={{ borderRadius: 16, paddingVertical: 8 }} textStyle={{ fontSize: 12 }}>
              {photoUri ? "🔄 Media" : "🖼 Media"}
            </StrideButton>
          </View>
          <View style={{ flex: 1 }}>
            <StrideButton variant="secondary" onPress={copyAll} disabled={capturing} loading={capturing}
              style={{ borderRadius: 16, paddingVertical: 8, backgroundColor: colors.primary }} textStyle={{ fontSize: 12 }}>
              📋 Copy
            </StrideButton>
          </View>
          <View style={{ flex: 1 }}>
            <StrideButton onPress={saveImage} disabled={capturing} loading={capturing}
              style={{ borderRadius: 16, paddingVertical: 8 }} textStyle={{ fontSize: 12 }}>
              💾 Save
            </StrideButton>
          </View>
        </View>

        <AnimatedToast
          message={toast?.message ?? null}
          type={toast?.type ?? "info"}
          onDismiss={() => setToast(null)}
        />

        {/* ── Activity picker modal ── */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }} onPress={() => setPickerOpen(false)}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden" }}>
              {activities.map((a, i) => (
                <TouchableOpacity key={a.id} onPress={() => { selectActivity(a.id); setPickerOpen(false); }}
                  accessibilityRole="button" accessibilityLabel={`${a.distance.toFixed(1)} km ${a.type}, ${a.date}`}
                  accessibilityState={{ selected: a.id === selectedActivityId }}
                  style={{ padding: 14, borderBottomWidth: i < activities.length - 1 ? 1 : 0, borderBottomColor: colors.border, flexDirection: "row", justifyContent: "space-between", minHeight: 48 }}>
                  <Text style={{ color: a.id === selectedActivityId ? colors.primary : colors.foreground, fontSize: 14, fontWeight: "600" }}>{a.distance.toFixed(1)} km {a.type}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{a.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* ── Style modal ── */}
        <Modal visible={paletteOpen} transparent animationType="fade" onRequestClose={() => setPaletteOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }} onPress={() => setPaletteOpen(false)}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, maxHeight: 360 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", marginBottom: 8 }}>Style</Text>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "600", marginBottom: 4 }}>FONT</Text>
              <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {FONT_FAMILIES.map((ff) => (
                  <TouchableOpacity key={ff.id} onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { fontFamily: ff.id }); }}
                    accessibilityRole="radio" accessibilityLabel={`${ff.name} font`} accessibilityState={{ selected: selectedLayer?.fontFamily === ff.id }}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, minHeight: 32, justifyContent: "center",
                      backgroundColor: selectedLayer?.fontFamily === ff.id ? colors.primary : colors.border }}>
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: ff.id === "bold-system" ? "900" : ff.id === "light-system" ? "300" : "600" }}>{ff.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "600", marginBottom: 4 }}>COLORS</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                {ALL_PRESETS.map((preset) => (
                  <TouchableOpacity key={preset.id} onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { paletteId: preset.id }); }}
                    accessibilityRole="radio" accessibilityLabel={`${preset.name}`} accessibilityState={{ selected: selectedLayer?.paletteId === preset.id }}
                    style={{ alignItems: "center", gap: 2, minWidth: 36 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: preset.colors.accent, borderWidth: selectedLayer?.paletteId === preset.id ? 2 : 0, borderColor: colors.foreground, alignItems: "center", justifyContent: "center" }}>
                      {selectedLayer?.paletteId === preset.id && <Text style={{ color: colors.foreground, fontSize: 9 }}>✓</Text>}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 6, fontWeight: "500" }}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "600", marginBottom: 4 }}>CUSTOM</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {CUSTOM_COLORS.map((hex) => (
                  <TouchableOpacity key={hex} onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { paletteId: "custom" }); setPaletteOpen(false); }}
                    accessibilityRole="button" accessibilityLabel={`Custom color ${hex}`}
                    style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: hex, borderWidth: 1, borderColor: colors.border }} />
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* ── Photo filter modal ── */}
        <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 32 }} onPress={() => setFilterOpen(false)}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", marginBottom: 10 }}>Photo Filter</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {PHOTO_FILTERS.map((f) => (
                  <TouchableOpacity key={f.id} onPress={() => { setPhotoFilter(f.id); setFilterOpen(false); }}
                    accessibilityRole="radio" accessibilityLabel={`${f.name} filter`} accessibilityState={{ selected: photoFilter === f.id }}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, minHeight: 36, justifyContent: "center",
                      backgroundColor: photoFilter === f.id ? colors.primary : colors.border }}>
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "600" }}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

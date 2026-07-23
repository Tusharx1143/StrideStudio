/**
 * Create Post — redesigned editor with bold aesthetic, clear hierarchy,
 * and intentional state-based UX.
 *
 * Principles applied (frontend-design-complete):
 * - Clear visual zones: canvas | controls | actions
 * - Hero primary action (Save) with secondary actions receded
 * - Generous 8pt spacing, touch-friendly 44px+ targets
 * - Smooth animated transitions between states
 * - Empty state as invitation, not afterthought
 */
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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { VideoView, useVideoPlayer } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas } from "@/lib/canvas-state";
import {
  ALL_PRESETS, resolveColors,
  CUSTOM_COLORS, FONT_FAMILIES, getFontFamily,
} from "@/lib/color-presets";
import { PHOTO_FILTERS, DEFAULT_FILTER } from "@/lib/photo-filters";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { ActivityListSkeleton } from "@/components/skeleton";

// ── Constants ──

const SCREEN_W = Dimensions.get("window").width;
const DELETE_ZONE_SIZE = 64;

const ASPECT_RATIOS = [
  { id: "9:16" as const, label: "Story", width: 9, height: 16 },
  { id: "4:5" as const, label: "Portrait", width: 4, height: 5 },
  { id: "16:9" as const, label: "Landscape", width: 16, height: 9 },
];
type AspectRatioId = "9:16" | "4:5" | "16:9";

type PeriodId = "all" | "today" | "week" | "month";
const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "Monthly" },
];

// ── Helpers ──

function getCanvasHeight(ratio: AspectRatioId): number {
  const r = ASPECT_RATIOS.find((a) => a.id === ratio)!;
  return Math.min(SCREEN_W * (r.height / r.width), 500);
}

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

function activityEmoji(type: string): string {
  switch (type) {
    case "run": return "🏃";
    case "ride": return "🚴";
    case "workout": return "💪";
    default: return "🏃";
  }
}

// ── Layer Gesture Component ──

interface LayerGestureProps {
  layer: ReturnType<typeof useCanvas>["layers"][0];
  canvasH: number;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string | null) => void;
  onDragOverDelete?: (over: boolean) => void;
}

function LayerGesture({ layer, canvasH, onDragStart, onDragEnd, onDragOverDelete }: LayerGestureProps) {
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

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{
        position: "absolute",
        left: layer.x * SCREEN_W - (SCREEN_W * 0.4) / 2,
        top: layer.y * canvasH - 65,
        width: SCREEN_W * 0.4,
        minHeight: 130,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: isSelected ? 2 : 0,
        borderColor: isSelected ? colors.primary : "transparent",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
        shadowOpacity: isSelected ? 0.3 : 0.15,
        shadowRadius: isSelected ? 12 : 6,
        elevation: isSelected ? 8 : 4,
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

// ── Delete Zone Overlay ──

function DeleteZone({ visible, dragOver }: { visible: boolean; dragOver: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{
      position: "absolute", bottom: 0, left: SCREEN_W / 2 - DELETE_ZONE_SIZE,
      width: DELETE_ZONE_SIZE * 2, height: DELETE_ZONE_SIZE + 16,
      alignItems: "center", justifyContent: "center",
    }}>
      <View style={{
        width: DELETE_ZONE_SIZE, height: DELETE_ZONE_SIZE,
        borderRadius: DELETE_ZONE_SIZE / 2,
        backgroundColor: dragOver ? "#EF4444" : "rgba(255,255,255,0.1)",
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: dragOver ? "#EF4444" : "rgba(255,255,255,0.2)",
        transform: [{ scale: dragOver ? 1.15 : 1 }],
      }}>
        <Text style={{ fontSize: 22 }}>🗑️</Text>
      </View>
      <Text style={{
        color: dragOver ? "#EF4444" : "rgba(255,255,255,0.5)",
        fontSize: 9, fontWeight: "700", marginTop: 6,
        letterSpacing: 1.5,
      }}>
        {dragOver ? "RELEASE TO DELETE" : "DRAG HERE"}
      </Text>
    </Animated.View>
  );
}

// ── Main Screen ──

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
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverDelete, setDragOverDelete] = useState(false);
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

  // Video player — only init when a video is selected
  const videoPlayer = useVideoPlayer(photoUri && isVideoBg ? photoUri : "", (player) => { player.loop = true; player.play(); });
  useEffect(() => { if (photoUri && isVideoBg) { videoPlayer.loop = true; videoPlayer.play(); } }, [photoUri, isVideoBg]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => { resetCanvas(); }, [selectedActivityId]);
  const goBack = useCallback(() => { resetCanvas(); router.back(); }, [resetCanvas, router]);

  // Layer drag callbacks
  const handleDragStart = useCallback((id: string) => setDraggingLayerId(id), []);
  const handleDragEnd = useCallback(() => { setDraggingLayerId(null); setDragOverDelete(false); }, []);
  const handleDragOverDelete = useCallback((over: boolean) => setDragOverDelete(over), []);

  // Media picker
  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast("Library permission needed", "error"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      setIsVideoBg(result.assets[0].type === "video");
    }
  }, [setPhoto, showToast]);

  // Save composite
  const saveImage = useCallback(async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { showToast("Camera roll permission needed", "error"); return; }
      const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      incrementSavedPosts();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Saved to camera roll", "success");
    } catch { showToast("Failed to save", "error"); }
    finally { setSaving(false); }
  }, [incrementSavedPosts, showToast]);

  // Copy composite
  const copyAll = useCallback(async () => {
    if (!canvasRef.current) return;
    setCopying(true);
    try {
      const uri = await captureRef(canvasRef, { format: "png", quality: 1 });
      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Copied to clipboard", "success");
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") { await MediaLibrary.saveToLibraryAsync(uri); showToast("Saved to camera roll", "success"); }
      }
      incrementSavedPosts();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { showToast("Failed to copy", "error"); }
    finally { setCopying(false); }
  }, [incrementSavedPosts, showToast]);

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
        <View style={{
          flex: 1, backgroundColor: colors.background,
          justifyContent: "center", alignItems: "center", padding: 40,
        }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: colors.surface,
            alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <Text style={{ fontSize: 40 }}>{stravaConnected ? "🏃" : "🔗"}</Text>
          </View>
          <Text style={{
            color: colors.foreground, fontSize: 22, fontWeight: "800",
            letterSpacing: -0.5, marginBottom: 8,
          }}>
            {stravaConnected ? "No activities yet" : "Connect Strava"}
          </Text>
          <Text style={{
            color: colors.muted, fontSize: 14, fontWeight: "500",
            textAlign: "center", lineHeight: 20, marginBottom: 28,
          }}>
            {stravaConnected
              ? "Complete a workout to create your first post"
              : "Link your Strava account to share your workouts"}
          </Text>
          {!stravaConnected && (
            <StrideButton onPress={() => router.push("/(tabs)/profile")}>
              Connect Strava
            </StrideButton>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // ── Main editor ──
  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* ══ Top bar ══ */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 8, paddingVertical: 6,
          borderBottomWidth: 0.5, borderBottomColor: colors.border,
        }}>
          <TouchableOpacity
            onPress={goBack}
            accessibilityRole="button" accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "600" }}>‹</Text>
          </TouchableOpacity>

          <Text style={{ flex: 1, color: colors.foreground, fontSize: 16, fontWeight: "700", textAlign: "center" }}>
            Create Post
          </Text>

          {selectedLayer ? (
            <TouchableOpacity
              onPress={() => setStyleOpen(true)}
              accessibilityRole="button" accessibilityLabel="Style settings"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                backgroundColor: colors.surface, borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 6,
              }}
            >
              <View style={{
                width: 12, height: 12, borderRadius: 6,
                backgroundColor: resolveColors(selectedLayer.paletteId).accent,
              }} />
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>Style</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 70 }} />
          )}
        </View>

        {/* ══ Scrollable content ══ */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Canvas area ── */}
          <View ref={canvasRef} collapsable={false}>
            {(photoUri && isVideoBg) ? (
              <View style={{ width: SCREEN_W, height: CANVAS_H, position: "relative" }}>
                <VideoView player={videoPlayer} style={{ width: SCREEN_W, height: CANVAS_H }} contentFit="cover" />
                <Pressable style={{ flex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => selectLayer(null)}>
                  {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <LayerGesture key={l.id} layer={l} canvasH={CANVAS_H}
                      onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOverDelete={handleDragOverDelete} />
                  ))}
                </Pressable>
              </View>
            ) : photoUri ? (
              <ImageBackground source={{ uri: photoUri }} style={{ width: SCREEN_W, height: CANVAS_H, ...PHOTO_FILTERS.find((f) => f.id === photoFilter)?.style }} resizeMode="cover">
                <Pressable style={{ flex: 1 }} onPress={() => selectLayer(null)}>
                  {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <LayerGesture key={l.id} layer={l} canvasH={CANVAS_H}
                      onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOverDelete={handleDragOverDelete} />
                  ))}
                </Pressable>
              </ImageBackground>
            ) : (
              <Pressable
                onPress={() => selectLayer(null)}
                style={{
                  width: SCREEN_W, height: CANVAS_H,
                  backgroundColor: colors.surface,
                  justifyContent: "center", alignItems: "center",
                  borderBottomWidth: 0.5, borderBottomColor: colors.border,
                }}
              >
                <View style={{ alignItems: "center", gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }} />
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border + "60" }} />
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }} />
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
                    No media selected
                  </Text>
                  <Text style={{ color: colors.muted + "80", fontSize: 11, fontWeight: "500", marginTop: 2 }}>
                    Add a photo or video background to begin
                  </Text>
                  <TouchableOpacity
                    onPress={pickMedia}
                    accessibilityRole="button" accessibilityLabel="Add media"
                    style={{
                      marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
                      backgroundColor: colors.primary, borderRadius: 20,
                      minHeight: 40, justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                      + Add Media
                    </Text>
                  </TouchableOpacity>
                </View>
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                  <LayerGesture key={l.id} layer={l} canvasH={CANVAS_H}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOverDelete={handleDragOverDelete} />
                ))}
              </Pressable>
            )}

            {/* Delete zone */}
            <DeleteZone visible={!!draggingLayerId} dragOver={dragOverDelete} />

            {/* Aspect ratio pills */}
            <View style={{
              position: "absolute", top: 8, left: 12,
              flexDirection: "row", gap: 4,
            }}>
              {ASPECT_RATIOS.map((ar) => (
                <TouchableOpacity key={ar.id}
                  onPress={() => setAspectRatio(ar.id)}
                  style={{
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                    backgroundColor: aspectRatio === ar.id ? colors.foreground : "rgba(0,0,0,0.3)",
                    minHeight: 24, justifyContent: "center",
                  }}
                >
                  <Text style={{
                    color: aspectRatio === ar.id ? colors.background : "#fff",
                    fontSize: 8, fontWeight: "700",
                  }}>{ar.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Activity selector row ── */}
          <Animated.View entering={FadeIn.duration(300)} style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 12, paddingVertical: 6,
            borderBottomWidth: 0.5, borderBottomColor: colors.border,
          }}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button" accessibilityLabel="Select activity"
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: colors.surface, borderRadius: 16,
                paddingHorizontal: 10, paddingVertical: 5,
                flex: 1, minHeight: 32,
              }}
            >
              <Text style={{ fontSize: 14 }}>{activityEmoji(activity?.type ?? "")}</Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                {activity?.distance.toFixed(1)} km · {activity?.type}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 10, marginLeft: "auto" }}>{activity?.date}</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 6 }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {PERIODS.map((p) => (
                  <TouchableOpacity key={p.id} onPress={() => setPeriodFilter(p.id)}
                    style={{
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                      backgroundColor: periodFilter === p.id ? colors.foreground : colors.surface,
                      minHeight: 26, justifyContent: "center",
                    }}>
                    <Text style={{
                      color: periodFilter === p.id ? colors.background : colors.muted,
                      fontSize: 9, fontWeight: "700",
                    }}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setFilterOpen(true)}
                  style={{
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                    backgroundColor: colors.surface, minHeight: 26, justifyContent: "center",
                  }}>
                  <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "700" }}>🎨</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>

          {/* ── Template panel ── */}
          <View style={{ minHeight: 100, paddingBottom: 8 }}>
            <View style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: 12, paddingVertical: 3,
            }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {(["activity", "totals"] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => setTab(t)}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
                      backgroundColor: tab === t ? colors.primary : colors.surface,
                      minHeight: 28, justifyContent: "center",
                    }}>
                    <Text style={{
                      color: tab === t ? "#fff" : colors.muted,
                      fontSize: 10, fontWeight: "700", textTransform: "capitalize",
                    }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setGridOpen(!gridOpen)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                  backgroundColor: colors.surface, minHeight: 28,
                }}>
                <Text style={{ color: colors.muted, fontSize: 9, fontWeight: "700" }}>
                  {gridOpen ? "Hide" : `${filteredTemplates.length} templates`}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 10 }}>{gridOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>
            </View>

            {gridOpen && filteredTemplates.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: colors.muted + "80", fontSize: 10, fontWeight: "600" }}>
                  No templates for this tab
                </Text>
              </View>
            )}

            {gridOpen && filteredTemplates.length > 0 && (
              <Animated.View entering={FadeIn.duration(250)}>
                <View style={{
                  flexDirection: "row", flexWrap: "wrap",
                  paddingHorizontal: 8, paddingVertical: 4, gap: 6,
                }}>
                  {filteredTemplates.map((tpl) => (
                    <TouchableOpacity key={tpl.id}
                      onPress={() => {
                        addLayer(tpl.id);
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      accessibilityRole="button" accessibilityLabel={`Add ${tpl.name} template`}
                      style={{
                        width: "30%", height: 100,
                        backgroundColor: colors.surface, borderRadius: 12,
                        borderWidth: 1, borderColor: colors.border + "60",
                        padding: 4, justifyContent: "center", alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {activity && (
                        <View style={{ transform: [{ scale: 0.22 }], width: 360, height: 360, position: "absolute" }}>
                          {tpl.render(activity, totals)}
                        </View>
                      )}
                      <View style={{
                        position: "absolute", bottom: 4, left: 4, right: 4,
                        backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 6,
                        paddingHorizontal: 4, paddingVertical: 3,
                      }}>
                        <Text style={{
                          color: "#fff", fontSize: 8, fontWeight: "700", textAlign: "center",
                        }} numberOfLines={1}>{tpl.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {!gridOpen && layers.length === 0 && (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: colors.muted + "80", fontSize: 10, fontWeight: "600" }}>
                  Tap "{filteredTemplates.length} templates" to add overlays
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* ══ Bottom action bar ══ */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 12, paddingVertical: 6, gap: 8,
          borderTopWidth: 0.5, borderTopColor: colors.border,
          backgroundColor: colors.background, paddingBottom: 12,
        }}>
          <TouchableOpacity
            onPress={pickMedia}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 18 }}>{photoUri ? "🔄" : "🖼️"}</Text>
          </TouchableOpacity>

          {photoUri && (
            <TouchableOpacity
              onPress={() => setFilterOpen(true)}
              style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: colors.surface,
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 16 }}>🎨</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={copyAll}
            disabled={copying}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              height: 46, borderRadius: 23,
              backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 20, flex: 1, flexDirection: "row", gap: 6,
            }}
          >
            {copying && <ActivityIndicator size="small" color={colors.foreground} />}
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>
              {copying ? "Copying…" : "📋 Copy"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={saveImage}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              height: 46, borderRadius: 23,
              backgroundColor: colors.primary,
              alignItems: "center", justifyContent: "center",
              paddingHorizontal: 24, flex: 1.3, flexDirection: "row", gap: 6,
              shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving && <ActivityIndicator size="small" color="#fff" />}
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
              {saving ? "Saving…" : "Save Post"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toast */}
        <AnimatedToast message={toast?.message ?? null} type={toast?.type ?? "info"} onDismiss={() => setToast(null)} />

        {/* ══ Activity Picker Modal ══ */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setPickerOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              paddingTop: 8, paddingBottom: 32, maxHeight: "60%",
            }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 }} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", paddingHorizontal: 16, marginBottom: 8 }}>
                Select Activity
              </Text>
              <ScrollView>
                {activities.map((a, i) => (
                  <TouchableOpacity key={a.id} onPress={() => { selectActivity(a.id); setPickerOpen(false); }}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 12,
                      borderBottomWidth: i < activities.length - 1 ? 0.5 : 0,
                      borderBottomColor: colors.border + "60",
                      flexDirection: "row", alignItems: "center", gap: 10,
                    }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: a.id === selectedActivityId ? colors.primary : colors.surface,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ fontSize: 16 }}>{activityEmoji(a.type)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                        {a.distance.toFixed(1)} km · {a.type}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 1 }}>{a.date}</Text>
                    </View>
                    {a.id === selectedActivityId && (
                      <Text style={{ color: colors.primary, fontSize: 14 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ══ Style Modal ══ */}
        <Modal visible={styleOpen} transparent animationType="fade" onRequestClose={() => setStyleOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setStyleOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              paddingTop: 8, paddingBottom: 32, maxHeight: "70%",
            }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 }} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", paddingHorizontal: 16, marginBottom: 4 }}>
                Layer Style
              </Text>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 16 }}>
                {selectedLayer && (
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600" }}>
                    Template: {ALL_TEMPLATES.find((t) => t.id === selectedLayer.templateId)?.name ?? selectedLayer.templateId}
                  </Text>
                )}
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 }}>LAYER ORDER</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {["◀ Send Back", "▶ Bring Forward", "✕ Remove"].map((label, idx) => {
                      const actions = [
                        () => selectedLayer && sendBackward(selectedLayer.id),
                        () => selectedLayer && bringForward(selectedLayer.id),
                        () => { if (selectedLayer) { removeLayer(selectedLayer.id); setStyleOpen(false); } },
                      ];
                      const bgColors = [colors.surface, colors.surface, "#EF444420"];
                      const textColors = [colors.foreground, colors.foreground, "#EF4444"];
                      return (
                        <TouchableOpacity key={label} onPress={actions[idx]}
                          style={{ flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: bgColors[idx], alignItems: "center", minHeight: 36, justifyContent: "center" }}>
                          <Text style={{ color: textColors[idx], fontSize: 10, fontWeight: "700" }}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 }}>FONT</Text>
                  <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
                    {FONT_FAMILIES.map((ff) => (
                      <TouchableOpacity key={ff.id}
                        onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { fontFamily: ff.id }); }}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                          backgroundColor: selectedLayer?.fontFamily === ff.id ? colors.primary : colors.surface,
                          minHeight: 32, justifyContent: "center",
                        }}>
                        <Text style={{
                          color: selectedLayer?.fontFamily === ff.id ? "#fff" : colors.foreground,
                          fontSize: 11, fontWeight: ff.id === "bold-system" ? "900" : ff.id === "light-system" ? "300" : "600",
                        }}>{ff.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 }}>COLOR PRESETS</Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {ALL_PRESETS.map((preset) => (
                      <TouchableOpacity key={preset.id}
                        onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { paletteId: preset.id }); }}
                        style={{ alignItems: "center", gap: 3 }}>
                        <View style={{
                          width: 32, height: 32, borderRadius: 16,
                          backgroundColor: preset.colors.accent,
                          borderWidth: selectedLayer?.paletteId === preset.id ? 2.5 : 0,
                          borderColor: selectedLayer?.paletteId === preset.id ? colors.foreground : "transparent",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          {selectedLayer?.paletteId === preset.id &&
                            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "800" }}>✓</Text>}
                        </View>
                        <Text style={{ color: colors.muted, fontSize: 7, fontWeight: "600" }} numberOfLines={1}>{preset.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 }}>CUSTOM</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {CUSTOM_COLORS.map((hex) => (
                      <TouchableOpacity key={hex}
                        onPress={() => { if (selectedLayer) updateLayer(selectedLayer.id, { paletteId: "custom" }); setStyleOpen(false); }}
                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: hex, borderWidth: 1, borderColor: colors.border + "60" }} />
                    ))}
                  </View>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ══ Photo Filter Modal ══ */}
        <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setFilterOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              paddingTop: 8, paddingBottom: 32,
            }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 12 }} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", paddingHorizontal: 16, marginBottom: 12 }}>
                Photo Filter
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16 }}>
                {PHOTO_FILTERS.map((f) => (
                  <TouchableOpacity key={f.id} onPress={() => { setPhotoFilter(f.id); setFilterOpen(false); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: photoFilter === f.id ? colors.primary : colors.surface,
                      minHeight: 36, justifyContent: "center",
                    }}>
                    <Text style={{
                      color: photoFilter === f.id ? "#fff" : colors.foreground,
                      fontSize: 12, fontWeight: "600",
                    }}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </ScreenContainer>
  );
}

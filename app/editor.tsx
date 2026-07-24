/**
 * Create Post — Photo Editor
 *
 * Redesigned with photo-editor-inspired UI:
 * - Dark OLED canvas with violet/cyan accent palette
 * - Instagram-style filter carousel (bottom strip)
 * - Floating aspect-ratio pills
 * - Animated bottom ToolPanel for layer styling
 * - Glass-morphism action panels
 * - Proper touch targets (44px+) and haptic feedback
 *
 * Principles:
 * - Clear visual zones: canvas | filters | actions
 * - Dark canvas makes photos pop
 * - Bottom tools within thumb reach
 * - Smooth animated transitions (150-350ms)
 * - Empty state as invitation, not afterthought
 */
import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { VideoView, useVideoPlayer } from "expo-video";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas, CanvasProvider } from "@/lib/canvas-state";
import {
  resolveColors,
} from "@/lib/color-presets";
import { PHOTO_FILTERS, DEFAULT_FILTER, type PhotoFilter } from "@/lib/photo-filters";
import { typeEmoji } from "@/lib/templates/shared/helpers";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { ActivityListSkeleton } from "@/components/skeleton";
import { FilterCarousel } from "@/components/editor/FilterCarousel";
import { LayerGesture } from "@/components/editor/LayerGesture";
import { DeleteZone } from "@/components/editor/DeleteZone";
import { ActivityPickerModal } from "@/components/editor/ActivityPickerModal";
import { AdjustmentSlider, type AdjustmentDef } from "@/components/editor/AdjustmentSlider";
import { ToolPanel, type ToolSection } from "@/components/editor/ToolPanel";
import { LayerStylePanel } from "@/components/editor/LayerStylePanel";
import {
  EditorColors,
  EditorSemantic,
  EditorSpace,
  EditorTouch,
  EditorRadius,
  EditorType,
  EditorMotion,
} from "@/constants/editor-theme";

// ════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════

const SCREEN_W = Dimensions.get("window").width;
const DELETE_ZONE_SIZE = 64;

const ASPECT_RATIOS = [
  { id: "9:16" as const, label: "9:16", icon: "📱" },
  { id: "4:5" as const, label: "4:5", icon: "📐" },
  { id: "16:9" as const, label: "16:9", icon: "🖥" },
];
type AspectRatioId = "9:16" | "4:5" | "16:9";

type PeriodId = "all" | "today" | "week" | "month";
const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

// Photo adjustment presets for sliders
const PHOTO_ADJUSTMENTS: AdjustmentDef[] = [
  { id: "brightness", label: "Brightness", icon: "☀️", min: -100, max: 100, defaultValue: 0, formatValue: (v) => `${v > 0 ? "+" : ""}${v}` },
  { id: "contrast", label: "Contrast", icon: "◐", min: -100, max: 100, defaultValue: 0, formatValue: (v) => `${v > 0 ? "+" : ""}${v}` },
  { id: "saturation", label: "Saturation", icon: "🌈", min: -100, max: 100, defaultValue: 0, formatValue: (v) => `${v > 0 ? "+" : ""}${v}` },
  { id: "warmth", label: "Warmth", icon: "🌡", min: -100, max: 100, defaultValue: 0, formatValue: (v) => `${v > 0 ? "+" : ""}${v}` },
];

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

function getCanvasHeight(ratio: AspectRatioId): number {
  const r = ASPECT_RATIOS.find((a) => a.id === ratio)!;
  if (ratio === "9:16") return Math.min(SCREEN_W * (16 / 9), 520);
  if (ratio === "4:5") return Math.min(SCREEN_W * (5 / 4), 450);
  return Math.min(SCREEN_W * (9 / 16), 360);
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
      case "month":
        return (
          new Date(a.startDate).getMonth() === now.getMonth() &&
          new Date(a.startDate).getFullYear() === now.getFullYear()
        );
      default: return true;
    }
  });
}

// ════════════════════════════════════════════════════════════════
// Main Screen — CanvasProvider scoped to editor to prevent state leaks
// ════════════════════════════════════════════════════════════════

export default function EditorScreen() {
  return (
    <CanvasProvider>
      <EditorContent />
    </CanvasProvider>
  );
}

function EditorContent() {
  const router = useRouter();
  const colors = useColors();
  const {
    activities, loading, error, stravaConnected,
    selectedActivityId, selectActivity, getSelectedActivity, incrementSavedPosts,
    refresh,
  } = useApp();
  const {
    layers, selectedLayerId, photoUri,
    addLayer, removeLayer, updateLayer,
    bringForward, sendBackward, selectLayer, setPhoto, resetCanvas,
    canUndo, canRedo, undo, redo,
  } = useCanvas();

  // ── Local state ──
  const [tab, setTab] = useState<"activity" | "totals">("activity");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const [isVideoBg, setIsVideoBg] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("9:16");
  const [periodFilter, setPeriodFilter] = useState<PeriodId>("all");
  const [photoFilter, setPhotoFilter] = useState(DEFAULT_FILTER.id);

  // ToolPanel state
  const [toolPanelVisible, setToolPanelVisible] = useState(false);
  const [activeToolSection, setActiveToolSection] = useState<string | null>(null);
  const closePanel = useCallback(() => setToolPanelVisible(false), []);
  const noop = useCallback(() => {}, []);

  // Photo adjustments state
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  // Suggested gallery photos from activity date
  const [suggestedPhotos, setSuggestedPhotos] = useState<string[]>([]);

  // ── Derived state ──
  const CANVAS_H = useMemo(() => getCanvasHeight(aspectRatio), [aspectRatio]);
  const canvasRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const filteredActivities = useMemo(
    () => filterActivitiesByPeriod(activities, periodFilter),
    [activities, periodFilter],
  );
  const totals = useMemo(() => computeWeekTotals(filteredActivities), [filteredActivities]);
  const activity = getSelectedActivity();
  const filteredTemplates = ALL_TEMPLATES.filter((t) => t.tab === tab);

  // Load suggested photos based on activity date
  useEffect(() => {
    if (!activity?.startDate) { setSuggestedPhotos([]); return; }
    const activityDate = new Date(activity.startDate);
    const dayStart = new Date(activityDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(activityDate);
    dayEnd.setHours(23, 59, 59, 999);
    const rangeStart = new Date(dayStart);
    rangeStart.setDate(rangeStart.getDate() - 1);
    const rangeEnd = new Date(dayEnd);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    MediaLibrary.getAssetsAsync({
      first: 8,
      mediaType: ["photo"],
      createdAfter: rangeStart.getTime(),
      createdBefore: rangeEnd.getTime(),
      sortBy: ["creationTime"],
    })
      .then((result) => { setSuggestedPhotos(result.assets.map((a) => a.uri)); })
      .catch(() => { setSuggestedPhotos([]); });
  }, [activity?.startDate]);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  // Video player
  const videoPlayer = useVideoPlayer(
    photoUri && isVideoBg ? photoUri : "",
    (player) => { player.loop = true; player.play(); },
  );
  useEffect(() => {
    if (photoUri && isVideoBg) { videoPlayer.loop = true; videoPlayer.play(); }
  }, [photoUri, isVideoBg]);

  // Helpers
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.9,
    });
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
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showToast("Saved to camera roll ✨", "success");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, [incrementSavedPosts, showToast]);

  // Share / Copy composite
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
        await Share.share({ url: uri });
      }
      incrementSavedPosts();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      showToast("Failed to share", "error");
    } finally {
      setCopying(false);
    }
  }, [incrementSavedPosts, showToast]);

  // Open ToolPanel for layer styling
  const openLayerStyle = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Handle adjustment change
  const handleAdjustment = useCallback((id: string, value: number) => {
    setAdjustments((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Filter options for the carousel
  const filterOptions = useMemo(() => PHOTO_FILTERS.map((f) => ({
    id: f.id,
    name: f.name,
    cssFilter: typeof f.style.filter === "string" ? f.style.filter : undefined,
  })), []);

  // Build CSS filter string from photo adjustments (brightness, contrast, saturation, warmth)
  const adjustmentFilter = useMemo(() => {
    const parts: string[] = [];
    const b = adjustments.brightness;
    if (b != null && b !== 0) parts.push(`brightness(${(1 + b / 100).toFixed(2)})`);
    const c = adjustments.contrast;
    if (c != null && c !== 0) parts.push(`contrast(${(1 + c / 100).toFixed(2)})`);
    const s = adjustments.saturation;
    if (s != null && s !== 0) parts.push(`saturate(${(1 + s / 100).toFixed(2)})`);
    const w = adjustments.warmth;
    if (w != null && w !== 0) {
      // warmth: positive = warmer (sepia), negative = cooler (blue tint via hue-rotate)
      if (w > 0) {
        parts.push(`sepia(${(w / 200).toFixed(2)})`);
      } else {
        parts.push(`hue-rotate(${(w / 5).toFixed(0)}deg)`);
      }
    }
    return parts.length > 0 ? parts.join(" ") : undefined;
  }, [adjustments]);

  // ── Build ToolPanel sections (photo adjustments only — style is inline) ──
  const toolSections: ToolSection[] = useMemo(() => {
    if (!photoUri) return [];
    return [{
      id: "adjust",
      title: "Adjust",
      icon: "A",
      content: (
        <View style={{ gap: EditorSpace.lg }}>
          <Text style={{
            color: EditorColors.mutedText,
            fontSize: EditorType.caption.size,
            fontWeight: "600",
            marginBottom: 4,
          }}>
            Photo adjustments
          </Text>
          {PHOTO_ADJUSTMENTS.map((adj) => (
            <AdjustmentSlider
              key={adj.id}
              adjustment={adj}
              value={adjustments[adj.id] ?? adj.defaultValue}
              onChange={handleAdjustment}
            />
          ))}
        </View>
      ),
    }];
  }, [photoUri, adjustments, handleAdjustment]);

  // ════════════════════════════════════════════════════════
  // Loading state
  // ════════════════════════════════════════════════════════
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: EditorColors.background }}>
          <ActivityListSkeleton count={2} />
        </View>
      </ScreenContainer>
    );
  }

  // ════════════════════════════════════════════════════════
  // Error state — network / server failure with retry
  // ════════════════════════════════════════════════════════
  if (error && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{
          flex: 1, backgroundColor: EditorColors.background,
          justifyContent: "center", alignItems: "center", padding: 40,
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: EditorColors.destructive + "20",
            alignItems: "center", justifyContent: "center",
            marginBottom: EditorSpace["2xl"],
          }}>
            <Text style={{ fontSize: 32 }}>⚠️</Text>
          </View>
          <Text style={{
            color: EditorColors.foreground,
            fontSize: EditorType.title.size,
            fontWeight: EditorType.title.weight,
            letterSpacing: -0.5, marginBottom: 8,
          }}>
            Failed to load
          </Text>
          <Text style={{
            color: EditorColors.mutedText,
            fontSize: EditorType.body.size,
            fontWeight: "500",
            textAlign: "center",
            lineHeight: EditorType.body.lineHeight,
            marginBottom: EditorSpace["2xl"],
            maxWidth: 280,
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel="Retry loading"
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: EditorColors.primary,
              borderRadius: EditorRadius.pill,
              minHeight: EditorTouch.buttonMd,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: EditorType.body.size, fontWeight: "700" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ════════════════════════════════════════════════════════
  // Empty state
  // ════════════════════════════════════════════════════════
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{
          flex: 1, backgroundColor: EditorColors.background,
          justifyContent: "center", alignItems: "center", padding: 40,
        }}>
          {/* Decorative ring */}
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            borderWidth: 2, borderColor: EditorColors.border,
            alignItems: "center", justifyContent: "center",
            marginBottom: EditorSpace["2xl"],
          }}>
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: EditorColors.surface,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: EditorColors.borderSolid,
            }}>
              <Text style={{ fontSize: 36 }}>
                {stravaConnected ? "🏃" : "🔗"}
              </Text>
            </View>
          </View>

          <Text style={{
            color: EditorColors.foreground,
            fontSize: EditorType.title.size,
            fontWeight: EditorType.title.weight,
            letterSpacing: -0.5, marginBottom: 8,
          }}>
            {stravaConnected ? "No activities yet" : "Connect Strava"}
          </Text>
          <Text style={{
            color: EditorColors.mutedText,
            fontSize: EditorType.body.size,
            fontWeight: "500",
            textAlign: "center",
            lineHeight: EditorType.body.lineHeight,
            marginBottom: EditorSpace["2xl"],
            maxWidth: 280,
          }}>
            {stravaConnected
              ? "Complete a workout to create your first shareable post"
              : "Link your Strava account to turn workouts into beautiful posts"}
          </Text>
          {!stravaConnected && (
            <StrideButton onPress={() => router.push("/profile-screen")}>
              Connect Strava
            </StrideButton>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // ════════════════════════════════════════════════════════
  // Main Editor
  // ════════════════════════════════════════════════════════
  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: EditorColors.background }}>

        {/* ── Top navigation bar ── */}
        <View style={localStyles.topBar}>
          <TouchableOpacity
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={localStyles.iconButton}
          >
            <Text style={localStyles.backArrow}>‹</Text>
          </TouchableOpacity>

          {/* Undo / Redo */}
          <View style={{ flexDirection: "row", gap: 2 }}>
            <TouchableOpacity
              onPress={undo}
              disabled={!canUndo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[localStyles.undoRedoBtn, !canUndo && { opacity: 0.3 }]}
            >
              <Text style={localStyles.undoRedoText}>↩</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={redo}
              disabled={!canRedo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[localStyles.undoRedoBtn, !canRedo && { opacity: 0.3 }]}
            >
              <Text style={localStyles.undoRedoText}>↪</Text>
            </TouchableOpacity>
          </View>

          <Text style={localStyles.topTitle}>Create Post</Text>

          {selectedLayer ? (
            <TouchableOpacity
              onPress={openLayerStyle}
              accessibilityRole="button"
              accessibilityLabel="Style settings"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={localStyles.styleButton}
            >
              <View style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: resolveColors(selectedLayer.paletteId).accent,
              }} />
              <Text style={localStyles.styleButtonText}>Style</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: EditorTouch.iconButton }} />
          )}
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ══ Canvas area ══ */}
          <View ref={canvasRef} collapsable={false}>
            {photoUri && isVideoBg ? (
              <View style={{ width: SCREEN_W, height: CANVAS_H, position: "relative" }}>
                <VideoView
                  player={videoPlayer}
                  style={{ width: SCREEN_W, height: CANVAS_H }}
                  contentFit="cover"
                />
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => selectLayer(null)}
                >
                  {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <LayerGesture
                      key={l.id} layer={l} canvasH={CANVAS_H}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOverDelete={handleDragOverDelete}
                    />
                  ))}
                </Pressable>
              </View>
            ) : photoUri ? (
              <View style={{ width: SCREEN_W, height: CANVAS_H, position: "relative" }}>
                {/* Background photo with filter — isolated from overlay layers */}
                <Animated.Image
                  source={{ uri: photoUri }}
                  style={[
                    StyleSheet.absoluteFill,
                    PHOTO_FILTERS.find((f) => f.id === photoFilter)?.style,
                    // Apply live adjustment sliders (brightness/contrast/saturation/warmth)
                    adjustmentFilter ? { filter: adjustmentFilter } as Record<string, unknown> : undefined,
                  ]}
                  resizeMode="cover"
                />
                {/* Layer overlay — filter does NOT affect these */}
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => selectLayer(null)}
                >
                  {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <LayerGesture
                      key={l.id} layer={l} canvasH={CANVAS_H}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOverDelete={handleDragOverDelete}
                    />
                  ))}
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => selectLayer(null)}
                style={[localStyles.canvasEmpty, { height: CANVAS_H }]}
              >
                {/* Decorative grid pattern hint */}
                <View style={{ alignItems: "center", gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 20, marginBottom: 16 }}>
                    <View style={localStyles.emptyDot} />
                    <View style={[localStyles.emptyDot, { opacity: 0.3 }]} />
                    <View style={localStyles.emptyDot} />
                  </View>
                  <Text style={localStyles.emptyTitle}>
                    No media selected
                  </Text>
                  <Text style={localStyles.emptySubtitle}>
                    Add a photo or video background to begin
                  </Text>
                  <TouchableOpacity
                    onPress={pickMedia}
                    accessibilityRole="button"
                    accessibilityLabel="Add media"
                    style={localStyles.addMediaButton}
                    activeOpacity={0.8}
                  >
                    <Text style={localStyles.addMediaText}>+ Add Media</Text>
                  </TouchableOpacity>
                </View>

                {/* Still render layers over empty canvas */}
                {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                  <LayerGesture
                    key={l.id} layer={l} canvasH={CANVAS_H}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOverDelete={handleDragOverDelete}
                  />
                ))}
              </Pressable>
            )}

            {/* Delete zone */}
            <DeleteZone visible={!!draggingLayerId} dragOver={dragOverDelete} />

            {/* Aspect ratio pills — floating */}
            {photoUri && (
              <Animated.View
                entering={FadeInDown.duration(EditorMotion.normal)}
                style={localStyles.aspectRatioRow}
              >
                {ASPECT_RATIOS.map((ar) => {
                  const isActive = aspectRatio === ar.id;
                  return (
                    <TouchableOpacity
                      key={ar.id}
                      onPress={() => setAspectRatio(ar.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Aspect ratio ${ar.label}`}
                      style={[
                        localStyles.aspectPill,
                        isActive && localStyles.aspectPillActive,
                      ]}
                    >
                      <Text style={{ fontSize: 11 }}>{ar.icon}</Text>
                      <Text style={[
                        localStyles.aspectPillLabel,
                        isActive && localStyles.aspectPillLabelActive,
                      ]}>
                        {ar.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}
          </View>

          {/* ══ Floating style toolbar (visible when a layer is selected) ══ */}
          {selectedLayer && (
            <Animated.View
              entering={FadeIn.duration(EditorMotion.fast)}
              style={localStyles.floatingToolbar}
            >
              {[
                { icon: "S", label: "Style", onPress: openLayerStyle, color: EditorColors.primary },
                { icon: "◀", label: "Back", onPress: () => sendBackward(selectedLayer.id), color: EditorColors.mutedText },
                { icon: "▶", label: "Fwd", onPress: () => bringForward(selectedLayer.id), color: EditorColors.mutedText },
                { icon: "×", label: "Delete", onPress: () => { removeLayer(selectedLayer.id); }, color: EditorColors.destructive },
              ].map((btn) => (
                <TouchableOpacity
                  key={btn.label}
                  onPress={btn.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                  style={localStyles.floatingToolBtn}
                >
                  <Text style={{ fontSize: 14 }}>{btn.icon}</Text>
                  <Text style={{
                    color: btn.color,
                    fontSize: 7,
                    fontWeight: "700",
                    textAlign: "center",
                  }}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* ══ Context bar: activity + period ══ */}
          <Animated.View entering={FadeIn.duration(EditorMotion.slow)} style={localStyles.contextBar}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Select activity"
              style={localStyles.activityChip}
            >
              <Text style={{ fontSize: 14 }}>{typeEmoji(activity?.type ?? "")}</Text>
              <Text style={localStyles.activityChipText} numberOfLines={1}>
                {activity?.distance.toFixed(1)} km · {activity?.type}
              </Text>
              <Text style={localStyles.activityChipDate}>{activity?.date}</Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginLeft: EditorSpace.sm }}
            >
              <View style={{ flexDirection: "row", gap: 4 }}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPeriodFilter(p.id)}
                    style={[
                      localStyles.periodPill,
                      periodFilter === p.id && localStyles.periodPillActive,
                    ]}
                  >
                    <Text style={[
                      localStyles.periodPillLabel,
                      periodFilter === p.id && localStyles.periodPillLabelActive,
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {/* ══ Filter carousel (photo only) ══ */}
          {photoUri && (
            <Animated.View entering={FadeInDown.duration(EditorMotion.normal).delay(100)}>
              <View style={localStyles.filterStrip}>
                <FilterCarousel
                  filters={filterOptions}
                  selectedId={photoFilter}
                  onSelect={setPhotoFilter}
                  photoUri={photoUri}
                  height={100}
                />
              </View>
            </Animated.View>
          )}

          {/* ══ Suggested gallery photos from activity date ══ */}
          {suggestedPhotos.length > 0 && !photoUri && (
            <Animated.View entering={FadeInDown.duration(EditorMotion.normal).delay(50)}>
              <View style={{
                paddingVertical: EditorSpace.sm,
                borderBottomWidth: 1,
                borderBottomColor: EditorColors.border,
              }}>
                <Text style={{
                  color: EditorColors.mutedText,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  paddingHorizontal: EditorSpace.md,
                  marginBottom: EditorSpace.sm,
                }}>
                  Suggested from your gallery
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: EditorSpace.md,
                    gap: EditorSpace.sm,
                  }}
                >
                  {suggestedPhotos.map((uri, i) => (
                    <TouchableOpacity
                      key={`suggested-${i}`}
                      onPress={() => { setPhoto(uri); setIsVideoBg(false); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Use suggested photo ${i + 1}`}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: EditorRadius.card,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: EditorColors.border,
                      }}
                      activeOpacity={0.7}
                    >
                      <Animated.Image
                        source={{ uri }}
                        style={{ width: 72, height: 72 }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Animated.View>
          )}

          {/* ══ Template strip — always visible horizontal scroll ══ */}
          <View style={{ paddingVertical: EditorSpace.sm }}>
            {/* Tab pills */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: EditorSpace.md,
              paddingBottom: EditorSpace.sm,
            }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {(["activity", "totals"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTab(t)}
                    style={[
                      localStyles.tabPill,
                      tab === t && localStyles.tabPillActive,
                    ]}
                  >
                    <Text style={[
                      localStyles.tabPillLabel,
                      tab === t && localStyles.tabPillLabelActive,
                    ]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{
                color: EditorColors.mutedText,
                fontSize: EditorType.micro.size,
                fontWeight: "600",
                marginLeft: "auto",
                opacity: 0.5,
              }}>
                {filteredTemplates.length} templates
              </Text>
            </View>

            {/* Horizontal scrollable template cards */}
            {filteredTemplates.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: EditorSpace.md,
                  gap: EditorSpace.sm,
                }}
                decelerationRate="fast"
                snapToInterval={168 + EditorSpace.sm}
                snapToAlignment="start"
              >
                {filteredTemplates.map((tpl) => (
                  <TouchableOpacity
                    key={tpl.id}
                    onPress={() => {
                      addLayer(tpl.id);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${tpl.name} template`}
                    style={{
                      width: 168,
                      height: 200,
                      backgroundColor: EditorColors.card,
                      borderRadius: EditorRadius.card,
                      borderWidth: 1,
                      borderColor: EditorColors.border,
                      overflow: "hidden",
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Live template preview — scaled to fit the card */}
                    <View style={{
                      flex: 1,
                      margin: 6,
                      borderRadius: EditorRadius.card - 4,
                      overflow: "hidden",
                      backgroundColor: EditorColors.surface,
                    }}>
                      {activity && (
                        <View style={{
                          transform: [{ scale: 0.42 }],
                          width: 360,
                          height: 400,
                          position: "absolute",
                          top: -30,
                          left: -104,
                        }}>
                          {tpl.render(activity, totals)}
                        </View>
                      )}
                    </View>

                    {/* Template name badge */}
                    <View style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: EditorColors.surface,
                      borderTopWidth: 1,
                      borderTopColor: EditorColors.border,
                    }}>
                      <Text style={{
                        color: EditorColors.foreground,
                        fontSize: EditorType.caption.size,
                        fontWeight: "700",
                      }} numberOfLines={1}>
                        {tpl.badge ? `${tpl.badge} · ` : ""}{tpl.name}
                      </Text>
                      <Text style={{
                        color: EditorColors.mutedText,
                        fontSize: 9,
                        fontWeight: "500",
                        marginTop: 2,
                      }}>
                        {tpl.description ?? (tpl.tab === "activity" ? "Activity stat sticker" : "Weekly totals")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: EditorSpace["2xl"], alignItems: "center" }}>
                <Text style={{
                  color: EditorColors.mutedText,
                  fontSize: EditorType.caption.size,
                  fontWeight: "600",
                  opacity: 0.5,
                }}>
                  No templates for this tab
                </Text>
              </View>
            )}
          </View>

          {/* ══ Inline style panel (visible when a layer is selected) ══ */}
          {selectedLayer && (
            <Animated.View entering={FadeInDown.duration(EditorMotion.normal)} style={{
              padding: EditorSpace.md,
              borderBottomWidth: 1,
              borderBottomColor: EditorColors.border,
              backgroundColor: EditorColors.surface,
            }}>
              <LayerStylePanel
                layer={selectedLayer}
                onUpdateLayer={updateLayer}
                onRemoveLayer={(id) => { removeLayer(id); }}
                onBringForward={bringForward}
                onSendBackward={sendBackward}
                onClose={noop}
              />
            </Animated.View>
          )}
        </ScrollView>

        {/* ══ Bottom action bar ══ */}
        <View style={localStyles.bottomBar}>
          {/* Media picker */}
          <TouchableOpacity
            onPress={pickMedia}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? "Change media" : "Add media"}
            style={localStyles.actionIconBtn}
          >
            <Text style={{ fontSize: 18 }}>{photoUri ? "🔄" : "🖼️"}</Text>
          </TouchableOpacity>

          {/* Adjust button (only when photo selected) */}
          {photoUri && (
            <TouchableOpacity
              onPress={() => {
                setActiveToolSection("adjust");
                setToolPanelVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Adjust photo"
              style={localStyles.actionIconBtn}
            >
              <Text style={{ fontSize: 16 }}>A</Text>
            </TouchableOpacity>
          )}

          {/* Copy */}
          <TouchableOpacity
            onPress={copyAll}
            disabled={copying}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Share post"
            style={localStyles.copyButton}
          >
            {copying && (
              <ActivityIndicator size="small" color={EditorColors.foreground} />
            )}
            <Text style={localStyles.copyButtonText}>
              {copying ? "Sharing…" : "📤 Share"}
            </Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            onPress={saveImage}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save post"
            style={[localStyles.saveButton, saving && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            {saving && (
              <ActivityIndicator size="small" color="#fff" />
            )}
            <Text style={localStyles.saveButtonText}>
              {saving ? "Saving…" : "Save Post"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══ Toast ══ */}
        <AnimatedToast
          message={toast?.message ?? null}
          type={toast?.type ?? "info"}
          onDismiss={() => setToast(null)}
        />

        {/* ══ Activity Picker Modal ══ */}
        <ActivityPickerModal
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          activities={activities}
          selectedActivityId={selectedActivityId}
          onSelect={(id) => { selectActivity(id); setPickerOpen(false); }}
        />

        {/* ══ Tool Panel ══ */}
        <ToolPanel
          sections={toolSections}
          activeSectionId={activeToolSection}
          onSectionChange={setActiveToolSection}
          visible={toolPanelVisible}
          onDismiss={closePanel}
        />
      </View>
    </ScreenContainer>
  );
}

// ════════════════════════════════════════════════════════════════
// Local Styles
// ════════════════════════════════════════════════════════════════

const localStyles = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: EditorSpace.sm,
    paddingVertical: EditorSpace.xs,
    borderBottomWidth: 1,
    borderBottomColor: EditorColors.border,
    backgroundColor: EditorColors.background,
  },
  iconButton: {
    width: EditorTouch.iconButton,
    height: EditorTouch.iconButton,
    borderRadius: EditorTouch.iconButton / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: EditorColors.foreground,
    fontSize: 26,
    fontWeight: "500",
  },
  topTitle: {
    flex: 1,
    color: EditorColors.foreground,
    fontSize: EditorType.heading.size,
    fontWeight: EditorType.heading.weight,
    textAlign: "center",
  },
  undoRedoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: EditorColors.surface,
  },
  undoRedoText: {
    color: EditorColors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  styleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: EditorColors.card,
    borderRadius: EditorRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: EditorColors.borderSolid,
  },
  styleButtonText: {
    color: EditorColors.foreground,
    fontSize: EditorType.caption.size,
    fontWeight: "600",
  },

  // Canvas
  canvasEmpty: {
    width: SCREEN_W,
    backgroundColor: EditorSemantic.canvasEmpty,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: EditorColors.border,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EditorColors.borderSolid,
  },
  emptyTitle: {
    color: EditorColors.mutedText,
    fontSize: EditorType.body.size,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: EditorColors.mutedText,
    fontSize: EditorType.caption.size,
    fontWeight: "500",
    marginTop: 4,
    opacity: 0.7,
  },
  addMediaButton: {
    marginTop: EditorSpace.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: EditorColors.primary,
    borderRadius: EditorRadius.pill,
    minHeight: EditorTouch.buttonMd,
    justifyContent: "center",
  },
  addMediaText: {
    color: "#fff",
    fontSize: EditorType.body.size,
    fontWeight: "700",
  },

  // Aspect ratio pills
  aspectRatioRow: {
    position: "absolute",
    top: EditorSpace.sm,
    left: EditorSpace.md,
    flexDirection: "row",
    gap: 4,
  },
  aspectPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: EditorRadius.pill,
    backgroundColor: EditorSemantic.glass,
    borderWidth: 1,
    borderColor: EditorSemantic.glassBorder,
    minHeight: 28,
  },
  aspectPillActive: {
    backgroundColor: EditorColors.foreground,
    borderColor: EditorColors.foreground,
  },
  aspectPillLabel: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  aspectPillLabelActive: {
    color: EditorColors.background,
  },

  // Context bar
  contextBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: EditorSpace.md,
    paddingVertical: EditorSpace.sm,
    borderBottomWidth: 1,
    borderBottomColor: EditorColors.border,
  },
  activityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: EditorColors.surface,
    borderRadius: EditorRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderColor: EditorColors.borderSolid,
  },
  activityChipText: {
    color: EditorColors.foreground,
    fontSize: EditorType.caption.size,
    fontWeight: "600",
  },
  activityChipDate: {
    color: EditorColors.mutedText,
    fontSize: 10,
    marginLeft: "auto",
  },
  periodPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: EditorRadius.pill,
    backgroundColor: EditorColors.surface,
    minHeight: 28,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: EditorColors.borderSolid,
  },
  periodPillActive: {
    backgroundColor: EditorColors.foreground,
    borderColor: EditorColors.foreground,
  },
  periodPillLabel: {
    color: EditorColors.mutedText,
    fontSize: 9,
    fontWeight: "700",
  },
  periodPillLabelActive: {
    color: EditorColors.background,
  },

  // Template tab pills
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: EditorRadius.pill,
    backgroundColor: EditorColors.surface,
    minHeight: 32,
    justifyContent: "center",
  },
  tabPillActive: {
    backgroundColor: EditorColors.primary,
  },
  tabPillLabel: {
    color: EditorColors.mutedText,
    fontSize: EditorType.caption.size,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  tabPillLabelActive: {
    color: "#fff",
  },

  // Filter strip
  filterStrip: {
    borderBottomWidth: 1,
    borderBottomColor: EditorColors.border,
    backgroundColor: EditorSemantic.filterStripBg,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: EditorSpace.md,
    paddingVertical: EditorSpace.sm,
    paddingBottom: EditorSpace.lg,
    gap: EditorSpace.sm,
    borderTopWidth: 1,
    borderTopColor: EditorColors.border,
    backgroundColor: EditorColors.background,
  },
  actionIconBtn: {
    width: EditorTouch.iconButton,
    height: EditorTouch.iconButton,
    borderRadius: EditorTouch.iconButton / 2,
    backgroundColor: EditorColors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: EditorColors.borderSolid,
  },
  copyButton: {
    flex: 1,
    height: EditorTouch.buttonMd,
    borderRadius: EditorTouch.buttonMd / 2,
    backgroundColor: EditorColors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: EditorColors.borderSolid,
    paddingHorizontal: EditorSpace.lg,
  },
  copyButtonText: {
    color: EditorColors.foreground,
    fontSize: EditorType.body.size,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1.3,
    height: EditorTouch.buttonMd,
    borderRadius: EditorTouch.buttonMd / 2,
    backgroundColor: EditorColors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: EditorSpace["2xl"],
    shadowColor: EditorColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: EditorType.body.size,
    fontWeight: "800",
  },

  // Section label (used in ToolPanel content)
  sectionLabel: {
    color: EditorColors.mutedText,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Floating style toolbar
  floatingToolbar: {
    position: "absolute",
    right: EditorSpace.xs,
    top: 120,
    gap: 4,
    zIndex: 50,
  },
  floatingToolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EditorSemantic.glass,
    borderWidth: 1,
    borderColor: EditorSemantic.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
});

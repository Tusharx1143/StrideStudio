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
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas, CanvasProvider } from "@/lib/canvas-state";
import { PHOTO_FILTERS, DEFAULT_FILTER } from "@/lib/photo-filters";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { ActivityListSkeleton } from "@/components/skeleton";
import { FilterCarousel } from "@/components/editor/FilterCarousel";
import { LayerGesture } from "@/components/editor/LayerGesture";
import { DeleteZone } from "@/components/editor/DeleteZone";
import { ActivityPickerModal } from "@/components/editor/ActivityPickerModal";
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
  { id: "9:16" as const, label: "9:16", icon: "phone-portrait-outline" as const },
  { id: "4:5" as const, label: "4:5", icon: "resize-outline" as const },
  { id: "16:9" as const, label: "16:9", icon: "tv-outline" as const },
];
type AspectRatioId = "9:16" | "4:5" | "16:9";

import type { PeriodId } from "@/lib/app-data";

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

function getCanvasHeight(ratio: AspectRatioId): number {
  const r = ASPECT_RATIOS.find((a) => a.id === ratio)!;
  if (ratio === "9:16") return Math.min(SCREEN_W * (16 / 9), 520);
  if (ratio === "4:5") return Math.min(SCREEN_W * (5 / 4), 450);
  return Math.min(SCREEN_W * (9 / 16), 360);
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
    refresh, periodFilter, setPeriodFilter,
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
  const [photoFilter, setPhotoFilter] = useState(DEFAULT_FILTER.id);

  const noop = useCallback(() => {}, []);

  // Suggested gallery photos from activity date
  const [suggestedPhotos, setSuggestedPhotos] = useState<string[]>([]);

  // ── Derived state ──
  const CANVAS_H = useMemo(() => getCanvasHeight(aspectRatio), [aspectRatio]);
  const canvasRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const filteredActivities = useMemo(
    () => activities.filter((a) => {
      if (periodFilter === "all") return true;
      if (!a.startDate) return false;
      const d = new Date(a.startDate);
      const now = new Date();
      const today = now.toDateString();
      const monday = new Date(now);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const mondayStr = monday.toDateString();
      switch (periodFilter) {
        case "today": return d.toDateString() === today;
        case "week": return d.toDateString() >= mondayStr;
        case "month":
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        default: return true;
      }
    }),
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

  // Filter options for the carousel
  const filterOptions = useMemo(() => PHOTO_FILTERS.map((f) => ({
    id: f.id,
    name: f.name,
    cssFilter: typeof f.style.filter === "string" ? f.style.filter : undefined,
  })), []);

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
            <Ionicons name="alert-circle-outline" size={36} color={EditorColors.destructive} />
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
              <Ionicons
                name={stravaConnected ? "walk-outline" : "link-outline"}
                size={36}
                color={stravaConnected ? EditorColors.primary : EditorColors.mutedText}
              />
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
            <Ionicons name="chevron-back" size={24} color={EditorColors.foreground} />
          </TouchableOpacity>

          {/* Undo / Redo */}
          <View style={{ flexDirection: "row", gap: 2 }}>
            <TouchableOpacity
              onPress={undo}
              disabled={!canUndo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[localStyles.undoRedoBtn, !canUndo && { opacity: 0.3 }]}
            >
              <Ionicons name="arrow-undo" size={18} color={EditorColors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={redo}
              disabled={!canRedo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[localStyles.undoRedoBtn, !canRedo && { opacity: 0.3 }]}
            >
              <Ionicons name="arrow-redo" size={18} color={EditorColors.foreground} />
            </TouchableOpacity>
          </View>

          <Text style={localStyles.topTitle}>Create Post</Text>

          {selectedLayer ? (
            <View style={{ width: EditorTouch.iconButton }} />
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
          <ErrorBoundary>
          <View ref={canvasRef} collapsable={false}>
            {photoUri && isVideoBg ? (
              <View style={{ width: SCREEN_W, height: CANVAS_H, position: "relative" }}>
                <VideoView
                  player={videoPlayer}
                  style={{ width: SCREEN_W, height: CANVAS_H }}
                  contentFit="cover"
                />
                <View style={StyleSheet.absoluteFill}>
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => selectLayer(null)}
                  />
                  {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <LayerGesture
                      key={l.id} layer={l} canvasH={CANVAS_H}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOverDelete={handleDragOverDelete}
                    />
                  ))}
                </View>
              </View>
            ) : photoUri ? (
              <View style={{ width: SCREEN_W, height: CANVAS_H, position: "relative" }}>
                {/* Background photo with filter — isolated from overlay layers */}
                <Animated.Image
                  source={{ uri: photoUri }}
                  style={[
                    StyleSheet.absoluteFill,
                    PHOTO_FILTERS.find((f) => f.id === photoFilter)?.style,
                  ]}
                  resizeMode="cover"
                />
                {/* Layer overlay — filter does NOT affect these */}
                <View style={StyleSheet.absoluteFill}>
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => selectLayer(null)}
                  />
                  {layers.sort((a, b) => a.zIndex - b.zIndex).map((l) => (
                    <LayerGesture
                      key={l.id} layer={l} canvasH={CANVAS_H}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOverDelete={handleDragOverDelete}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={[localStyles.canvasEmpty, { height: CANVAS_H }]}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => selectLayer(null)}
                />
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
              </View>
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
                      <Ionicons name={ar.icon} size={12} color={isActive ? EditorColors.background : "#fff"} />
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
          </ErrorBoundary>

          {/* ══ Floating style toolbar (visible when a layer is selected) ══ */}
          {selectedLayer && (
            <Animated.View
              entering={FadeIn.duration(EditorMotion.fast)}
              style={[localStyles.floatingToolbar, {
                top: EditorSpace.sm + CANVAS_H * 0.08,
                right: Math.max(EditorSpace.xs, SCREEN_W * 0.015),
                gap: Math.max(4, SCREEN_W * 0.01),
              }]}
            >
              {[
                { icon: "color-palette-outline" as const, label: "Style", onPress: openLayerStyle, color: EditorColors.primary },
                { icon: "chevron-back-outline" as const, label: "Back", onPress: () => sendBackward(selectedLayer.id), color: EditorColors.mutedText },
                { icon: "chevron-forward-outline" as const, label: "Fwd", onPress: () => bringForward(selectedLayer.id), color: EditorColors.mutedText },
                { icon: "trash-outline" as const, label: "Delete", onPress: () => { removeLayer(selectedLayer.id); }, color: EditorColors.destructive },
              ].map((btn) => (
                <TouchableOpacity
                  key={btn.label}
                  onPress={btn.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                  style={[localStyles.floatingToolBtn, {
                    width: Math.max(36, SCREEN_W * 0.095),
                    height: Math.max(36, SCREEN_W * 0.095),
                    borderRadius: Math.round(Math.max(36, SCREEN_W * 0.095) / 2),
                  }]}
                >
                  <Ionicons name={btn.icon} size={Math.round(SCREEN_W * 0.038)} color={btn.color} />
                  <Text style={{
                    color: btn.color,
                    fontSize: Math.round(SCREEN_W * 0.017),
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
              <Ionicons name="fitness-outline" size={16} color={EditorColors.foreground} />
              <Text style={localStyles.activityChipText} numberOfLines={1}>
                {activity?.distance != null ? `${activity.distance.toFixed(1)} km` : "0.0 km"} · {activity?.type ?? "Activity"}
              </Text>
              <Text style={localStyles.activityChipDate}>{activity?.date}</Text>
            </TouchableOpacity>
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

            {/* Horizontal scrollable template cards — responsive sizing */}
            {filteredTemplates.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: EditorSpace.md,
                  gap: EditorSpace.sm,
                }}
                decelerationRate="fast"
                snapToInterval={Math.round(SCREEN_W * 0.44)}
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
                      width: Math.round(SCREEN_W * 0.42),
                      height: Math.round(SCREEN_W * 0.56),
                      backgroundColor: EditorColors.card,
                      borderRadius: EditorRadius.card,
                      borderWidth: 1,
                      borderColor: EditorColors.border,
                      overflow: "hidden",
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Live template preview — centered, scaled to fit */}
                    <View style={{
                      flex: 1,
                      borderRadius: EditorRadius.card - 2,
                      overflow: "hidden",
                      backgroundColor: EditorColors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {activity && (
                        <View style={{
                          transform: [{ scale: 0.42 }],
                          width: 360,
                          height: 400,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <ErrorBoundary>
                            {tpl.render(activity, totals)}
                          </ErrorBoundary>
                        </View>
                      )}
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
            <ErrorBoundary>
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
            </ErrorBoundary>
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
            <Ionicons
              name={photoUri ? "images-outline" : "image-outline"}
              size={20}
              color={EditorColors.foreground}
            />
          </TouchableOpacity>

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
            <Ionicons name="share-outline" size={16} color={EditorColors.foreground} />
            <Text style={localStyles.copyButtonText}>
              {copying ? "Sharing…" : "Share"}
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
    zIndex: 50,
  },
  floatingToolBtn: {
    backgroundColor: EditorSemantic.glass,
    borderWidth: 1,
    borderColor: EditorSemantic.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
});

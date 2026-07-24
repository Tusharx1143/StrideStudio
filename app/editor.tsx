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
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { VideoView, useVideoPlayer } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { useCanvas } from "@/lib/canvas-state";
import {
  ALL_PRESETS, resolveColors,
  CUSTOM_COLORS, FONT_FAMILIES, getFontFamily,
} from "@/lib/color-presets";
import { PHOTO_FILTERS, DEFAULT_FILTER, type PhotoFilter } from "@/lib/photo-filters";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { ActivityListSkeleton } from "@/components/skeleton";
import { FilterCarousel } from "@/components/editor/FilterCarousel";
import { AdjustmentSlider, type AdjustmentDef } from "@/components/editor/AdjustmentSlider";
import { ToolPanel, type ToolSection } from "@/components/editor/ToolPanel";
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

function activityEmoji(type: string): string {
  switch (type) {
    case "run": return "🏃";
    case "ride": return "🚴";
    case "workout": return "💪";
    default: return "🏃";
  }
}

// ════════════════════════════════════════════════════════════════
// Layer Gesture Component
// ════════════════════════════════════════════════════════════════

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
}

// ════════════════════════════════════════════════════════════════
// Delete Zone Overlay
// ════════════════════════════════════════════════════════════════

function DeleteZone({ visible, dragOver }: { visible: boolean; dragOver: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(EditorMotion.fast)} style={{
      position: "absolute", bottom: 0,
      left: SCREEN_W / 2 - DELETE_ZONE_SIZE,
      width: DELETE_ZONE_SIZE * 2, height: DELETE_ZONE_SIZE + 20,
      alignItems: "center", justifyContent: "center",
    }}>
      <View style={{
        width: DELETE_ZONE_SIZE, height: DELETE_ZONE_SIZE,
        borderRadius: DELETE_ZONE_SIZE / 2,
        backgroundColor: dragOver ? EditorColors.destructive + "30" : EditorSemantic.glass,
        alignItems: "center", justifyContent: "center",
        borderWidth: 2,
        borderColor: dragOver ? EditorColors.destructive : EditorSemantic.glassBorder,
        transform: [{ scale: dragOver ? 1.15 : 1 }],
      }}>
        <Text style={{ fontSize: 22 }}>🗑️</Text>
      </View>
      <Text style={{
        color: dragOver ? EditorColors.destructive : EditorColors.mutedText,
        fontSize: 9, fontWeight: "700", marginTop: 6,
        letterSpacing: 1.5,
      }}>
        {dragOver ? "RELEASE TO DELETE" : "DRAG TO DELETE"}
      </Text>
    </Animated.View>
  );
}

// ════════════════════════════════════════════════════════════════
// Main Screen
// ════════════════════════════════════════════════════════════════

export default function EditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    activities, loading, stravaConnected,
    selectedActivityId, selectActivity, getSelectedActivity, incrementSavedPosts,
  } = useApp();
  const {
    layers, selectedLayerId, photoUri,
    addLayer, removeLayer, updateLayer,
    bringForward, sendBackward, selectLayer, setPhoto, resetCanvas,
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

  // Photo adjustments state
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  // ── Derived state ──
  const CANVAS_H = useMemo(() => getCanvasHeight(aspectRatio), [aspectRatio]);
  const canvasRef = useRef<any>(null);
  const filteredActivities = useMemo(
    () => filterActivitiesByPeriod(activities, periodFilter),
    [activities, periodFilter],
  );
  const totals = useMemo(() => computeWeekTotals(filteredActivities), [filteredActivities]);
  const activity = getSelectedActivity();
  const filteredTemplates = ALL_TEMPLATES.filter((t) => t.tab === tab);
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
        if (status === "granted") {
          await MediaLibrary.saveToLibraryAsync(uri);
          showToast("Saved to camera roll", "success");
        }
      }
      incrementSavedPosts();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      showToast("Failed to copy", "error");
    } finally {
      setCopying(false);
    }
  }, [incrementSavedPosts, showToast]);

  // Open ToolPanel for layer styling
  const openLayerStyle = useCallback(() => {
    setActiveToolSection("style");
    setToolPanelVisible(true);
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

  // ── Build ToolPanel sections ──
  const toolSections: ToolSection[] = useMemo(() => {
    const sections: ToolSection[] = [];

    if (selectedLayer) {
      sections.push({
        id: "style",
        title: "Style",
        icon: "🎨",
        content: (
          <View style={{ gap: EditorSpace["2xl"] }}>
            {/* Template info */}
            <Text style={{
              color: EditorColors.mutedText,
              fontSize: EditorType.caption.size,
              fontWeight: "600",
            }}>
              Template: {ALL_TEMPLATES.find((t) => t.id === selectedLayer.templateId)?.name ?? selectedLayer.templateId}
            </Text>

            {/* Font selection */}
            <View>
              <Text style={localStyles.sectionLabel}>FONT</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {FONT_FAMILIES.map((ff) => (
                  <TouchableOpacity
                    key={ff.id}
                    onPress={() => updateLayer(selectedLayer.id, { fontFamily: ff.id })}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: EditorRadius.pill,
                      backgroundColor: selectedLayer.fontFamily === ff.id
                        ? EditorColors.primary
                        : EditorColors.card,
                      minHeight: EditorTouch.buttonSm,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{
                      color: selectedLayer.fontFamily === ff.id ? "#fff" : EditorColors.foreground,
                      fontSize: EditorType.caption.size,
                      fontWeight: ff.id === "bold-system" ? "900" : ff.id === "light-system" ? "300" : "600",
                    }}>
                      {ff.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color presets */}
            <View>
              <Text style={localStyles.sectionLabel}>COLOR PRESETS</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {ALL_PRESETS.map((preset) => {
                  const isActive = selectedLayer.paletteId === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => updateLayer(selectedLayer.id, { paletteId: preset.id })}
                      style={{ alignItems: "center", gap: 4 }}
                    >
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: preset.colors.accent,
                        borderWidth: isActive ? 2.5 : 0,
                        borderColor: isActive ? EditorColors.foreground : "transparent",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {isActive && (
                          <Text style={{ color: EditorColors.foreground, fontSize: 12, fontWeight: "800" }}>✓</Text>
                        )}
                      </View>
                      <Text style={{
                        color: EditorColors.mutedText,
                        fontSize: 8,
                        fontWeight: "600",
                      }} numberOfLines={1}>
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom colors */}
            <View>
              <Text style={localStyles.sectionLabel}>CUSTOM</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CUSTOM_COLORS.map((hex) => (
                  <TouchableOpacity
                    key={hex}
                    onPress={() => { updateLayer(selectedLayer.id, { paletteId: "custom" }); setToolPanelVisible(false); }}
                    style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: hex,
                      borderWidth: 1,
                      borderColor: EditorColors.borderSolid,
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Layer background style */}
            <View>
              <Text style={localStyles.sectionLabel}>BACKGROUND</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {([
                  { id: 'none' as const,     label: 'None',     icon: '🚫', desc: 'Transparent' },
                  { id: 'glass' as const,    label: 'Glass',    icon: '🪟', desc: 'Frosted' },
                  { id: 'solid' as const,    label: 'Solid',    icon: '⬛', desc: 'Opaque' },
                  { id: 'outlined' as const, label: 'Outline',  icon: '▫️', desc: 'Border only' },
                ]).map((opt) => {
                  const isActive = (selectedLayer.backgroundStyle ?? 'glass') === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => updateLayer(selectedLayer.id, { backgroundStyle: opt.id })}
                      style={{
                        flex: 1, alignItems: "center", gap: 4,
                        paddingVertical: 10, paddingHorizontal: 4,
                        borderRadius: EditorRadius.card,
                        backgroundColor: isActive ? EditorColors.primary + '20' : EditorColors.card,
                        borderWidth: isActive ? 1 : 1,
                        borderColor: isActive ? EditorColors.primary : EditorColors.border,
                        minHeight: 56, justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{opt.icon}</Text>
                      <Text style={{
                        color: isActive ? EditorColors.primary : EditorColors.foreground,
                        fontSize: 9, fontWeight: isActive ? "800" : "600",
                      }}>{opt.label}</Text>
                      <Text style={{
                        color: EditorColors.mutedText,
                        fontSize: 7, fontWeight: "500",
                      }}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Layer actions */}
            <View>
              <Text style={localStyles.sectionLabel}>LAYER</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { label: "◀ Back", action: () => sendBackward(selectedLayer.id), color: EditorColors.foreground, bg: EditorColors.card },
                  { label: "Forward ▶", action: () => bringForward(selectedLayer.id), color: EditorColors.foreground, bg: EditorColors.card },
                  { label: "✕ Remove", action: () => { removeLayer(selectedLayer.id); setToolPanelVisible(false); }, color: EditorColors.destructive, bg: EditorColors.destructive + "20" },
                ].map((btn) => (
                  <TouchableOpacity
                    key={btn.label}
                    onPress={btn.action}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: EditorRadius.card,
                      backgroundColor: btn.bg, alignItems: "center",
                      minHeight: EditorTouch.buttonSm, justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: btn.color, fontSize: EditorType.caption.size, fontWeight: "700" }}>
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ),
      });
    }

    // Photo adjustments (when photo is selected)
    if (photoUri) {
      sections.push({
        id: "adjust",
        title: "Adjust",
        icon: "⚙️",
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
      });
    }

    return sections;
  }, [selectedLayer, photoUri, adjustments, handleAdjustment, updateLayer, bringForward, sendBackward, removeLayer]);

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
            <StrideButton onPress={() => router.push("/(tabs)/profile")}>
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
                    PHOTO_FILTERS.find((f) => f.id === photoFilter)?.style as any,
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

          {/* ══ Context bar: activity + period ══ */}
          <Animated.View entering={FadeIn.duration(EditorMotion.slow)} style={localStyles.contextBar}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Select activity"
              style={localStyles.activityChip}
            >
              <Text style={{ fontSize: 14 }}>{activityEmoji(activity?.type ?? "")}</Text>
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
                snapToInterval={152 + EditorSpace.sm}
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
                      width: 152,
                      height: 180,
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
                          transform: [{ scale: 0.35 }],
                          width: 360,
                          height: 400,
                          position: "absolute",
                          top: -40,
                          left: -104,
                        }}>
                          {tpl.render(activity, totals)}
                        </View>
                      )}
                    </View>

                    {/* Template name badge */}
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: EditorColors.surface,
                      borderTopWidth: 1,
                      borderTopColor: EditorColors.border,
                    }}>
                      <Text style={{
                        color: EditorColors.foreground,
                        fontSize: EditorType.caption.size,
                        fontWeight: "700",
                      }} numberOfLines={1}>
                        {tpl.name}
                      </Text>
                      <Text style={{
                        color: EditorColors.mutedText,
                        fontSize: 9,
                        fontWeight: "500",
                        marginTop: 1,
                      }}>
                        {tpl.tab === "activity" ? "Activity" : "Weekly totals"}
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
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>
          )}

          {/* Copy */}
          <TouchableOpacity
            onPress={copyAll}
            disabled={copying}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Copy post"
            style={localStyles.copyButton}
          >
            {copying && (
              <ActivityIndicator size="small" color={EditorColors.foreground} />
            )}
            <Text style={localStyles.copyButtonText}>
              {copying ? "Copying…" : "📋 Copy"}
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
        <Modal
          visible={pickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable
            style={localStyles.modalOverlay}
            onPress={() => setPickerOpen(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={localStyles.modalSheet}
            >
              <View style={localStyles.modalHandle} />
              <Text style={localStyles.modalTitle}>Select Activity</Text>
              <ScrollView bounces={false}>
                {activities.map((a, i) => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => { selectActivity(a.id); setPickerOpen(false); }}
                    style={[
                      localStyles.modalItem,
                      i < activities.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: EditorColors.border },
                    ]}
                  >
                    <View style={[
                      localStyles.modalItemIcon,
                      a.id === selectedActivityId && {
                        backgroundColor: EditorColors.primary,
                      },
                    ]}>
                      <Text style={{ fontSize: 16 }}>{activityEmoji(a.type)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={localStyles.modalItemTitle}>
                        {a.distance.toFixed(1)} km · {a.type}
                      </Text>
                      <Text style={localStyles.modalItemSubtitle}>{a.date}</Text>
                    </View>
                    {a.id === selectedActivityId && (
                      <Text style={{ color: EditorColors.primary, fontSize: 16 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ══ Tool Panel ══ */}
        <ToolPanel
          sections={toolSections}
          activeSectionId={activeToolSection}
          onSectionChange={setActiveToolSection}
          visible={toolPanelVisible}
          onDismiss={() => setToolPanelVisible(false)}
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: EditorSemantic.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: EditorColors.background,
    borderTopLeftRadius: EditorRadius.modal,
    borderTopRightRadius: EditorRadius.modal,
    paddingTop: EditorSpace.sm,
    paddingBottom: EditorSpace["3xl"],
    maxHeight: "60%",
    borderWidth: 1,
    borderColor: EditorColors.border,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: EditorColors.panelHandle,
    alignSelf: "center",
    marginBottom: EditorSpace.md,
  },
  modalTitle: {
    color: EditorColors.foreground,
    fontSize: EditorType.heading.size,
    fontWeight: EditorType.heading.weight,
    paddingHorizontal: EditorSpace.lg,
    marginBottom: EditorSpace.sm,
  },
  modalItem: {
    paddingHorizontal: EditorSpace.lg,
    paddingVertical: EditorSpace.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EditorColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalItemTitle: {
    color: EditorColors.foreground,
    fontSize: EditorType.body.size,
    fontWeight: "600",
  },
  modalItemSubtitle: {
    color: EditorColors.mutedText,
    fontSize: EditorType.caption.size,
    marginTop: 1,
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
});

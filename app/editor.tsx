/**
 * Editor — camera-first, Lens-based editor with floating toolbar,
 * lens carousel, contextual sheets, and live WYSIWYG editing.
 *
 * Architecture (top → bottom):
 *   46px top bar (close, undo/redo, ratio pills, save/export)
 *   → flexible canvas (EditorCanvas with gesture handles)
 *   → Floating Toolbar (right side, vertical rail)
 *   → Lens Carousel (bottom, horizontal scroll with live preview)
 *   → Contextual Sheet (opens when a tool is selected)
 *
 * Design philosophy (Snapchat-inspired):
 *   - Camera-first: capture or import first, edit second
 *   - Instant: everything updates in real time, no Apply buttons
 *   - Minimal chrome: translucent UI, maximum canvas visibility
 *   - One-handed: all controls within thumb reach
 */
import React, { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/lib/app-context";
import {
  useCanvas,
  CanvasProvider,
  type CanvasRatio,
} from "@/lib/canvas-state";
import { useColors } from "@/hooks/use-colors";
import {
  getPalette,
  dist,
  distUnitShort,
} from "@/lib/stickers";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import type { WeekTotals } from "@/lib/stickers/types";
import type { ToolId } from "@/components/editor/FloatingToolbar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { LensCarousel } from "@/components/editor/LensCarousel";
import { FloatingToolbar } from "@/components/editor/FloatingToolbar";
import { ContextualSheet } from "@/components/editor/ContextualSheet";
import { StatsPicker } from "@/components/editor/StatsPicker";
import { FontPicker } from "@/components/editor/FontPicker";
import { ColorPicker } from "@/components/editor/ColorPicker";
import { QuickStyles } from "@/components/editor/QuickStyles";
import { EffectsPanel } from "@/components/editor/EffectsPanel";
import { getLens } from "@/lib/lenses/registry";

// ── Constants ──

const CANVAS_RATIOS: CanvasRatio[] = ["9:16", "4:5", "1:1"];

// ── Main ──

export default function EditorScreen() {
  return (
    <CanvasProvider>
      <EditorContent />
    </CanvasProvider>
  );
}

function EditorContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    activities,
    getSelectedActivity,
    selectActivity,
  } = useApp();
  const {
    layers,
    selectedLayerId,
    lensId,
    ratio,
    backgroundId,
    filterId,
    addLayer,
    removeLayer,
    updateLayer,
    bringForward,
    sendBackward,
    selectLayer,
    commitHistory,
    setRatio,
    setLens,
    setBackground,
    setFilter,
    bindMetric,
    canUndo,
    canRedo,
    undo,
    redo,
    resetCanvas,
  } = useCanvas();

  // ── Panel state ──
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [paletteId, setPaletteId] = useState("stride");
  const [flash, setFlash] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | undefined>();
  const [showSheet, setShowSheet] = useState(false);

  const activity = getSelectedActivity();
  const palette = getPalette(paletteId);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const currentLens = getLens(lensId);

  // Week totals
  const totals: WeekTotals = useMemo(() => {
    const totalKm = activities.reduce((s, a) => s + a.distance, 0);
    return {
      totalKm,
      count: activities.length,
      streak: 6,
      monthKm: totalKm,
      monthCount: activities.length,
      days: activities.map((a) => ({
        day: a.date?.slice(0, 3) ?? "---",
        km: a.distance,
        type: a.type,
      })),
    };
  }, [activities]);

  const activityLabel = activity.distance
    ? `${dist(activity, "metric")} ${distUnitShort("metric")} ${activity.type}`
    : activity.title || "No activity";

  // ── Toast ──
  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1700);
  }, []);

  // ── Tool handlers ──
  const handleToolSelect = useCallback(
    (toolId: ToolId) => {
      // Toggle: if same tool, close; otherwise open
      if (activeTool === toolId) {
        setActiveTool(null);
        setShowSheet(false);
        return;
      }

      // Handle direct-action tools
      switch (toolId) {
        case "lens":
          setActiveTool("lens");
          setShowSheet(true);
          return;
        case "layers":
          setActiveTool("layers");
          setShowSheet(true);
          return;
        case "undo":
          undo();
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          return;
        case "redo":
          redo();
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          return;
        case "duplicate": {
          if (!selectedLayer) return;
          addLayer(selectedLayer.stickerId, selectedLayer.name, selectedLayer.w);
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
          return;
        }
        case "lock": {
          if (!selectedLayerId) return;
          updateLayer(selectedLayerId, { locked: !selectedLayer?.locked });
          commitHistory();
          return;
        }
        case "delete": {
          if (!selectedLayerId) return;
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
          removeLayer(selectedLayerId);
          setActiveTool(null);
          setShowSheet(false);
          return;
        }
        case "stats":
          setActiveTool("stats");
          setShowSheet(true);
          return;
        case "font":
          setActiveTool("font");
          setShowSheet(true);
          return;
        case "colors":
          setActiveTool("colors");
          setShowSheet(true);
          return;
        case "theme":
          setActiveTool("theme");
          setShowSheet(true);
          return;
        case "effects":
          setActiveTool("effects");
          setShowSheet(true);
          return;
        case "background": {
          // Cycle through preset backgrounds
          const bgIds = ["bg1", "bg2", "bg3", "bg4", "bg5", "bg6", "bg7", "bg8", "bg9", "bg10", "bg11", "bg12"];
          const idx = bgIds.indexOf(backgroundId);
          const next = bgIds[(idx + 1) % bgIds.length];
          setBackground(next);
          showFlash(`Background changed`);
          return;
        }
        case "align": {
          if (!selectedLayerId) return;
          const current = selectedLayer?.textAlign ?? "center";
          const next = current === "left" ? "center" : current === "center" ? "right" : "left";
          updateLayer(selectedLayerId, { textAlign: next });
          return;
        }
        default:
          setActiveTool(toolId);
          setShowSheet(true);
          return;
      }
    },
    [
      activeTool,
      selectedLayer,
      selectedLayerId,
      backgroundId,
      addLayer,
      updateLayer,
      commitHistory,
      removeLayer,
      undo,
      redo,
      setBackground,
      showFlash,
    ],
  );

  // ── Lens selection ──
  const handleLensSelect = useCallback(
    (newLensId: string) => {
      setLens(newLensId);
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      showFlash("Lens applied");
      setActiveTool(null);
      setShowSheet(false);
    },
    [setLens, showFlash],
  );

  // ── Style preset ──
  const handlePresetApply = useCallback(
    (presetId: string) => {
      setActivePresetId(presetId);
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      showFlash(`Style: ${presetId}`);
      setActiveTool(null);
      setShowSheet(false);
    },
    [showFlash],
  );

  // ── Layer actions ──
  const handleLayerAction = useCallback(
    (action: string) => {
      if (!selectedLayerId) return;
      switch (action) {
        case "dup": {
          const l = selectedLayer!;
          addLayer(l.stickerId, l.name, l.w);
          break;
        }
        case "lock":
          updateLayer(selectedLayerId, { locked: !selectedLayer!.locked });
          break;
        case "up":
          bringForward(selectedLayerId);
          break;
        case "down":
          sendBackward(selectedLayerId);
          break;
        case "delete":
          removeLayer(selectedLayerId);
          break;
        case "shadow":
          updateLayer(selectedLayerId, { shadow: !selectedLayer!.shadow });
          break;
        case "blur":
          updateLayer(selectedLayerId, { blur: !selectedLayer!.blur });
          break;
        case "border":
          updateLayer(selectedLayerId, { border: !selectedLayer!.border });
          break;
      }
      commitHistory();
    },
    [selectedLayerId, selectedLayer, addLayer, updateLayer, bringForward, sendBackward, removeLayer, commitHistory],
  );

  // ── Sheet title & content ──
  const sheetTitle = useMemo(() => {
    switch (activeTool) {
      case "lens": return "Choose Lens";
      case "stats": return "Smart Stats";
      case "font": return "Font";
      case "colors": return "Colors";
      case "theme": return "Quick Styles";
      case "effects": return "Effects";
      case "layers": return "Layers";
      default: return "";
    }
  }, [activeTool]);

  const sheetSubtitle = useMemo(() => {
    if (activeTool === "stats") return "Select a metric to display";
    if (activeTool === "theme") return "One-tap style presets";
    if (activeTool === "effects" && selectedLayer) return selectedLayer.name;
    return undefined;
  }, [activeTool, selectedLayer]);

  const goBack = useCallback(() => {
    resetCanvas();
    router.back();
  }, [resetCanvas, router]);

  const goExport = useCallback(() => {
    router.push("/export");
  }, [router]);

  // ── Render sheet content ──
  const renderSheetContent = useCallback(() => {
    switch (activeTool) {
      case "lens":
        return (
          <LensCarousel
            onSelectLens={handleLensSelect}
          />
        );
      case "stats":
        return (
          <StatsPicker
            onSelect={() => {
              showFlash("Metric updated");
            }}
          />
        );
      case "font":
        return <FontPicker />;
      case "colors":
        return <ColorPicker mode="full" />;
      case "theme":
        return (
          <QuickStyles
            activePresetId={activePresetId}
            onApplyPreset={handlePresetApply}
          />
        );
      case "effects":
        return <EffectsPanel onAction={handleLayerAction} />;
      case "layers":
        return <LayersPanel />;
      default:
        return null;
    }
  }, [activeTool, handleLensSelect, handlePresetApply, handleLayerAction, activePresetId, showFlash]);

  // ── Render ──

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* ═══ Top bar ═══ */}
      <View
        style={{
          height: 46 + insets.top,
          paddingTop: insets.top,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          backgroundColor: "#000",
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Close */}
        <TouchableOpacity
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Close editor"
          style={styles.iconBtn}
        >
          <Text style={styles.iconBtnText}>‹</Text>
        </TouchableOpacity>

        {/* Undo / Redo + Ratios */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo"
            style={[styles.iconBtnSm, { opacity: canUndo ? 1 : 0.25 }]}
          >
            <Text style={styles.iconSm}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redo}
            disabled={!canRedo}
            accessibilityRole="button"
            accessibilityLabel="Redo"
            style={[styles.iconBtnSm, { opacity: canRedo ? 1 : 0.25 }]}
          >
            <Text style={styles.iconSm}>↻</Text>
          </TouchableOpacity>

          {/* Ratio pills */}
          {CANVAS_RATIOS.map((r) => {
            const on = ratio === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRatio(r)}
                accessibilityRole="button"
                accessibilityLabel={`Aspect ratio ${r}`}
                style={[
                  styles.ratioPill,
                  { backgroundColor: on ? colors.primary : "#1C1C1E" },
                ]}
              >
                <Text
                  style={[
                    styles.ratioText,
                    { color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)" },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Export button */}
        <TouchableOpacity
          onPress={goExport}
          accessibilityRole="button"
          accessibilityLabel="Export"
          style={[styles.exportBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.exportText}>NEXT</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ Canvas + Toolbar ═══ */}
      <View style={{ flex: 1, position: "relative" }}>
        {/* Canvas */}
        <View style={styles.canvasContainer}>
          <EditorCanvas onLayerTap={(id) => selectLayer(id)} />
        </View>

        {/* Floating Toolbar */}
        <FloatingToolbar
          activeToolId={activeTool}
          onToolSelect={handleToolSelect}
        />

        {/* Selection action bar — shown when a layer is selected and no sheet is open */}
        {selectedLayer && !showSheet && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.selectionBar}
          >
            {[
              { id: "dup", label: "Duplicate" },
              { id: "lock", label: selectedLayer.locked ? "Unlock" : "Lock" },
              { id: "up", label: "↑ Front" },
              { id: "down", label: "↓ Back" },
              { id: "delete", label: "Delete" },
            ].map((a) => {
              const isDel = a.id === "delete";
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => handleLayerAction(a.id)}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDel
                        ? "rgba(255,69,58,0.18)"
                        : "rgba(255,255,255,0.1)",
                      borderColor: isDel
                        ? "rgba(255,69,58,0.5)"
                        : "rgba(255,255,255,0.14)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      { color: isDel ? "#FF453A" : "#fff" },
                    ]}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* Flash toast */}
        {flash && (
          <Animated.View
            entering={FadeInDown.duration(150)}
            style={styles.toast}
          >
            <View style={styles.toastInner}>
              <Text style={styles.toastText}>{flash}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* ═══ Lens Carousel (always visible at bottom) ═══ */}
      <View
        style={[
          styles.lensCarouselContainer,
          { paddingBottom: insets.bottom + 8 },
        ]}
      >
        <LensCarousel onSelectLens={handleLensSelect} />
      </View>

      {/* ═══ Contextual Sheet ═══ */}
      <ContextualSheet
        visible={showSheet && activeTool !== null && activeTool !== "lens" && activeTool !== "layers"}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        onDismiss={() => {
          setActiveTool(null);
          setShowSheet(false);
        }}
      >
        {renderSheetContent()}
      </ContextualSheet>

      {/* Lens full sheet (larger for Lens browsing) */}
      {activeTool === "lens" && (
        <ContextualSheet
          visible={showSheet}
          title="Choose Lens"
          subtitle="Swipe to browse, tap to apply"
          onDismiss={() => {
            setActiveTool(null);
            setShowSheet(false);
          }}
          maxHeight={560}
        >
          <LensCarousel onSelectLens={handleLensSelect} />
        </ContextualSheet>
      )}

      {/* Layers sheet */}
      {activeTool === "layers" && (
        <ContextualSheet
          visible={showSheet}
          title="Layers"
          subtitle={`${layers.length} layer${layers.length !== 1 ? "s" : ""}`}
          onDismiss={() => {
            setActiveTool(null);
            setShowSheet(false);
          }}
        >
          <LayersPanel />
        </ContextualSheet>
      )}
    </View>
  );
}

// ── Layers Panel (inline) ──

function LayersPanel() {
  const colors = useColors();
  const {
    layers,
    selectedLayerId,
    selectLayer,
    bringForward,
    sendBackward,
    removeLayer,
  } = useCanvas();

  if (layers.length === 0) {
    return (
      <View style={styles.emptyLayers}>
        <Text style={styles.emptyLayersTitle}>No layers yet</Text>
        <Text style={styles.emptyLayersDesc}>
          Apply a Lens or add elements to get started
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 6 }}
      showsVerticalScrollIndicator={false}
    >
      {[...layers]
        .sort((a, b) => b.z - a.z)
        .map((l) => {
          const isSel = l.id === selectedLayerId;
          return (
            <TouchableOpacity
              key={l.id}
              onPress={() => selectLayer(l.id)}
              accessibilityRole="button"
              accessibilityLabel={`Layer: ${l.name}`}
              style={[
                styles.layerRow,
                {
                  backgroundColor: isSel
                    ? "rgba(255,107,53,0.12)"
                    : "#0E0E10",
                  borderColor: isSel
                    ? "rgba(255,107,53,0.4)"
                    : colors.border,
                },
              ]}
            >
              {/* Name + meta */}
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={styles.layerName} numberOfLines={1}>
                  {l.name}
                </Text>
                <Text style={styles.layerMeta}>
                  z{l.z} · {Math.round(l.scale * 100)}% · {Math.round(l.rotation)}°
                  {l.locked ? " · locked" : ""}
                </Text>
              </View>

              {/* Controls */}
              <TouchableOpacity
                onPress={() => bringForward(l.id)}
                accessibilityRole="button"
                accessibilityLabel="Bring forward"
                style={styles.layerBtn}
              >
                <Text style={styles.layerBtnText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendBackward(l.id)}
                accessibilityRole="button"
                accessibilityLabel="Send backward"
                style={styles.layerBtn}
              >
                <Text style={styles.layerBtnText}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeLayer(l.id)}
                accessibilityRole="button"
                accessibilityLabel="Delete layer"
                style={[styles.layerBtn, { backgroundColor: "#2A1416" }]}
              >
                <Text style={{ fontFamily: FONT_UI, fontWeight: "600", fontSize: 11, color: "#FF453A" }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
    </ScrollView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#16161A",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
  iconBtnSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#16161A",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSm: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 14,
    color: "#fff",
  },
  ratioPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  ratioText: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 9.5,
    letterSpacing: 0.06 * 9.5,
  },
  exportBtn: {
    height: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  exportText: {
    fontFamily: FONT_UI,
    fontWeight: "800",
    fontSize: 12,
    color: "#fff",
  },
  canvasContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  selectionBar: {
    position: "absolute",
    left: 8,
    right: 58,
    bottom: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 90,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 10,
  },
  lensCarouselContainer: {
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 8,
  },
  toast: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  toastInner: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toastText: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 11,
    color: "#fff",
  },
  // Layers panel
  emptyLayers: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyLayersTitle: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  emptyLayersDesc: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  layerName: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 11.5,
    color: "#fff",
  },
  layerMeta: {
    fontFamily: FONT_MONO,
    fontWeight: "500",
    fontSize: 8.5,
    color: "rgba(255,255,255,0.42)",
  },
  layerBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  layerBtnText: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 11,
    color: "#fff",
  },
});

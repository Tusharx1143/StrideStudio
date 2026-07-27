/**
 * Editor — design-handoff layout with gesture canvas, sticker tray,
 * style panel, layers panel, and tool rail.
 *
 * Layout (top → bottom):
 *   46px top bar (close, undo/redo, ratio pills, NEXT)
 *   → flexible canvas (EditorCanvas with snap guides + handles)
 *   → tool rail (right side, vertical column of 6 tools)
 *   → contextual bottom sheet (sticker tray / style panel / layers panel)
 *   → selection action bar (when a layer is selected)
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useApp } from "@/lib/app-context";
import { useCanvas, CanvasProvider, type CanvasRatio } from "@/lib/canvas-state";
import { useColors } from "@/hooks/use-colors";
import {
  STICKERS,
  STICKER_CATEGORIES,
  STICKER_THEMES,
  PALETTES,
  getPalette,
  dist,
  distUnitShort,
} from "@/lib/stickers";
import { PHOTO_FILTERS } from "@/lib/photo-filters";
import type { WeekTotals } from "@/lib/stickers/types";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// ── Constants ────────────────────────────────────────────────

const CANVAS_RATIOS: CanvasRatio[] = ["9:16", "4:5", "1:1"];

const TOOLS = [
  { id: "stickers", label: "▦" },
  { id: "text", label: "Aa" },
  { id: "style", label: "◑" },
  { id: "layers", label: "≡" },
  { id: "crop", label: "⌗" },
  { id: "activity", label: "↻" },
];

// ── Main ─────────────────────────────────────────────────────

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
    activities,
    getSelectedActivity,
    selectActivity,
  } = useApp();
  const {
    layers,
    selectedLayerId,
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
    setBackground,
    setFilter,
    canUndo,
    canRedo,
    undo,
    redo,
    resetCanvas,
  } = useCanvas();

  // ── Local panel state ──────────────────────────────────────
  const [tool, setTool] = useState<string | null>(null);
  const [cat, setCat] = useState("all");
  const [theme, setTheme] = useState("all");
  const [paletteId, setPaletteId] = useState("stride");
  const [hint, setHint] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const activity = getSelectedActivity();
  const palette = getPalette(paletteId);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  // Week totals for sticker rendering
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

  // ── Filtered stickers ──────────────────────────────────────
  const filteredStickers = useMemo(() => {
    return STICKERS.filter(
      (s) =>
        (cat === "all" || s.cat === cat) &&
        (theme === "all" || s.theme === theme),
    );
  }, [cat, theme]);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1700);
  }, []);

  const showHint = useCallback((msg: string) => {
    setHint(msg);
    setTimeout(() => setHint(null), 2200);
  }, []);

  // ── Tool handlers ──────────────────────────────────────────
  const handleTool = useCallback(
    (t: string) => {
      if (t === "text") {
        addLayer("caption-text", "Caption", 240);
        setTool(null);
        return;
      }
      if (t === "activity") {
        // Cycle to next activity
        const idx = activities.findIndex((a) => a.id === activity.id);
        const next = activities[(idx + 1) % activities.length];
        if (next) {
          selectActivity(next.id);
          showFlash(`Switched to ${next.title || "activity"}`);
        }
        return;
      }
      if (t === "crop") {
        const currentIdx = CANVAS_RATIOS.indexOf(ratio);
        const next = CANVAS_RATIOS[(currentIdx + 1) % CANVAS_RATIOS.length];
        setRatio(next);
        showFlash(`Canvas ${next}`);
        return;
      }
      setTool((prev) => (prev === t ? null : t));
    },
    [addLayer, activities, activity, ratio, selectActivity, setRatio, showFlash],
  );

  // ── Sticker add ────────────────────────────────────────────
  const handleAddSticker = useCallback(
    (stickerId: string) => {
      const def = STICKERS.find((s) => s.id === stickerId);
      addLayer(stickerId, def?.name ?? stickerId, def?.w ?? 250);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      showFlash("Sticker added");
    },
    [addLayer, showFlash],
  );

  // ── Layer actions ──────────────────────────────────────────
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
          updateLayer(selectedLayerId, {
            locked: !selectedLayer!.locked,
          });
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
          updateLayer(selectedLayerId, {
            shadow: !selectedLayer!.shadow,
          });
          break;
        case "blur":
          updateLayer(selectedLayerId, {
            blur: !selectedLayer!.blur,
          });
          break;
        case "border":
          updateLayer(selectedLayerId, {
            border: !selectedLayer!.border,
          });
          break;
      }
      commitHistory();
    },
    [
      selectedLayerId,
      selectedLayer,
      addLayer,
      updateLayer,
      bringForward,
      sendBackward,
      removeLayer,
      commitHistory,
    ],
  );

  const handleOpacity = useCallback(
    (v: number) => {
      if (selectedLayerId) updateLayer(selectedLayerId, { opacity: v / 100 });
    },
    [selectedLayerId, updateLayer],
  );

  const goBack = useCallback(() => {
    resetCanvas();
    router.back();
  }, [resetCanvas, router]);

  const goExport = useCallback(() => {
    router.push("/export");
  }, [router]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* ═══ Top bar: 46px ═══ */}
      <View
        style={{
          height: 46,
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
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "#16161A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "600",
              fontSize: 16,
              color: "#fff",
            }}
          >
            ‹
          </Text>
        </TouchableOpacity>

        {/* Undo / Redo + Ratios */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#16161A",
              alignItems: "center",
              justifyContent: "center",
              opacity: canUndo ? 1 : 0.25,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 14,
                color: "#fff",
              }}
            >
              ↺
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redo}
            disabled={!canRedo}
            accessibilityRole="button"
            accessibilityLabel="Redo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#16161A",
              alignItems: "center",
              justifyContent: "center",
              opacity: canRedo ? 1 : 0.25,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 14,
                color: "#fff",
              }}
            >
              ↻
            </Text>
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
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: on ? colors.primary : "#1C1C1E",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 9.5,
                    letterSpacing: 0.06 * 9.5,
                    color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NEXT button */}
        <TouchableOpacity
          onPress={goExport}
          accessibilityRole="button"
          accessibilityLabel="Next: export"
          style={{
            height: 34,
            paddingHorizontal: 15,
            borderRadius: 17,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "800",
              fontSize: 12,
              color: "#fff",
            }}
          >
            NEXT
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══ Canvas + Tool rail ═══ */}
      <View style={{ flex: 1, position: "relative" }}>
        {/* Canvas */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 2,
          }}
        >
          <EditorCanvas onLayerTap={(id) => selectLayer(id)} />
        </View>

        {/* Tool rail — right side */}
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            gap: 6,
            zIndex: 100,
          }}
        >
          {TOOLS.map((t) => {
            const active = tool === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleTool(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`Tool: ${t.id}`}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: active
                    ? colors.primary
                    : "rgba(0,0,0,0.44)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 15,
                    color: active ? "#0B0B0C" : "#fff",
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selection action bar */}
        {selectedLayer && !tool && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              position: "absolute",
              left: 8,
              right: 58,
              bottom: 10,
              flexDirection: "row",
              gap: 6,
              zIndex: 90,
              overflow: "scroll",
            }}
          >
            {[
              { id: "dup", label: "Duplicate" },
              {
                id: "lock",
                label: selectedLayer.locked ? "Unlock" : "Lock",
              },
              { id: "up", label: "Bring front" },
              { id: "down", label: "Send back" },
              { id: "delete", label: "Delete" },
            ].map((a) => {
              const isDel = a.id === "delete";
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => handleLayerAction(a.id)}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: isDel
                      ? "rgba(255,69,58,0.18)"
                      : "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    borderColor: isDel
                      ? "rgba(255,69,58,0.5)"
                      : "rgba(255,255,255,0.14)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "700",
                      fontSize: 10,
                      color: isDel ? "#FF453A" : "#fff",
                    }}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* Hint */}
        {hint && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 92,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.16)",
              zIndex: 99,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 11,
                lineHeight: 14.85,
                color: "#fff",
                textAlign: "center",
              }}
            >
              {hint}
            </Text>
          </Animated.View>
        )}

        {/* Flash toast */}
        {flash && (
          <Animated.View
            entering={FadeInDown.duration(150)}
            style={{
              position: "absolute",
              bottom: 60,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 999,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 11,
                  color: "#fff",
                }}
              >
                {flash}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* ═══ Bottom sheets ═══ */}

      {/* Sticker tray */}
      {tool === "stickers" && (
        <Animated.View
          entering={FadeInDown.duration(220).springify().damping(20)}
          style={{
            maxHeight: "54%",
            backgroundColor: "#0A0A0B",
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -18 },
            shadowOpacity: 0.6,
            shadowRadius: 44,
            elevation: 30,
          }}
        >
          {/* Tray header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <View style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "800",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                {cat === "all" ? "Stat stickers" : `${STICKER_CATEGORIES.find((c) => c.id === cat)?.label} stickers`}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontWeight: "600",
                  fontSize: 9,
                  letterSpacing: 0.1 * 9,
                  color: colors.primary,
                }}
              >
                {filteredStickers.length} LIVE FROM THIS ACTIVITY
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTool(null)}
              accessibilityRole="button"
              accessibilityLabel="Close sticker tray"
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#1C1C1E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 16, paddingBottom: 8 }}
            contentContainerStyle={{ gap: 6 }}
          >
            {STICKER_CATEGORIES.map((x) => {
              const on = cat === x.id;
              return (
                <TouchableOpacity
                  key={x.id}
                  onPress={() => setCat(x.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Category: ${x.label}`}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: on ? colors.primary : "rgba(255,255,255,0.12)",
                    backgroundColor: on
                      ? "rgba(255,107,53,0.16)"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "700",
                      fontSize: 10,
                      letterSpacing: 0.06 * 10,
                      color: on ? colors.primary : "rgba(255,255,255,0.62)",
                    }}
                  >
                    {x.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Theme chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 16, paddingBottom: 10 }}
            contentContainerStyle={{ gap: 6 }}
          >
            {STICKER_THEMES.map((x) => {
              const on = theme === x.id;
              return (
                <TouchableOpacity
                  key={x.id}
                  onPress={() => setTheme(x.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Theme: ${x.label}`}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: on ? colors.primary : "#1C1C1E",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "700",
                      fontSize: 9.5,
                      letterSpacing: 0.06 * 9.5,
                      color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)",
                    }}
                  >
                    {x.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sticker grid */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: 18,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {filteredStickers.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => handleAddSticker(s.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Add sticker: ${s.name}`}
                style={{
                  width: "47%",
                  height: 118,
                  borderRadius: 14,
                  backgroundColor: "#0E0E10",
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Live preview */}
                <View
                  style={{
                    transform: [
                      { scale: Math.min(0.62, 140 / s.w) },
                    ],
                    pointerEvents: "none",
                  }}
                >
                  {s.render({
                    a: activity,
                    t: totals,
                    u: "metric",
                    c: palette.colors,
                  })}
                </View>

                {/* Name */}
                <Text
                  style={{
                    position: "absolute",
                    left: 6,
                    bottom: 5,
                    fontFamily: FONT_MONO,
                    fontWeight: "600",
                    fontSize: 8,
                    letterSpacing: 0.08 * 8,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {s.name}
                </Text>

                {/* Theme badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    paddingVertical: 3,
                    paddingHorizontal: 6,
                    borderRadius: 6,
                    backgroundColor: "rgba(255,107,53,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(255,107,53,0.4)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "700",
                      fontSize: 7,
                      letterSpacing: 0.1 * 7,
                      color: colors.primary,
                      textTransform: "uppercase",
                    }}
                  >
                    {s.theme}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Style panel */}
      {tool === "style" && (
        <Animated.View
          entering={FadeInDown.duration(200).springify().damping(20)}
          style={{
            backgroundColor: "#0A0A0B",
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -18 },
            shadowOpacity: 0.6,
            shadowRadius: 44,
            elevation: 30,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 14,
                color: "#fff",
              }}
            >
              {selectedLayer ? `Style · ${selectedLayer.name}` : "Style"}
            </Text>
            <TouchableOpacity
              onPress={() => setTool(null)}
              accessibilityRole="button"
              accessibilityLabel="Close style panel"
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#1C1C1E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* No selection notice */}
          {!selectedLayer && (
            <View
              style={{
                padding: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: "rgba(255,107,53,0.1)",
                borderWidth: 1,
                borderColor: "rgba(255,107,53,0.3)",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 10.5,
                  lineHeight: 14.7,
                  color: colors.primary,
                }}
              >
                Tap a sticker on the canvas to change its opacity, shadow, blur
                or border. Palette and filter apply to the whole post.
              </Text>
            </View>
          )}

          {/* Palettes */}
          <View style={{ gap: 7 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                letterSpacing: 0.18 * 9,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              THEME PALETTE
            </Text>
            <View style={{ flexDirection: "row", gap: 9 }}>
              {PALETTES.map((p) => {
                const on = paletteId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPaletteId(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Palette: ${p.name}`}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: p.colors.accent,
                      borderWidth: on ? 2.5 : 1,
                      borderColor: on
                        ? "#fff"
                        : "rgba(255,255,255,0.2)",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 14,
                      elevation: 4,
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* Filters */}
          <View style={{ gap: 7 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                letterSpacing: 0.18 * 9,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              PHOTO FILTER
            </Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {PHOTO_FILTERS.map((f) => {
                const on = filterId === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setFilter(f.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter: ${f.name}`}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: on ? colors.primary : "#1C1C1E",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: "700",
                        fontSize: 9.5,
                        letterSpacing: 0.06 * 9.5,
                        color: on
                          ? "#0B0B0C"
                          : "rgba(255,255,255,0.65)",
                      }}
                    >
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Opacity slider — only if layer selected */}
          {selectedLayer && (
            <View style={{ gap: 7 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 9,
                    letterSpacing: 0.18 * 9,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  STICKER OPACITY
                </Text>
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "600",
                    fontSize: 9,
                    color: colors.primary,
                  }}
                >
                  {Math.round(selectedLayer.opacity * 100)}%
                </Text>
              </View>

              {/* Simplified opacity control — preset buttons */}
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[25, 50, 75, 100].map((v) => {
                  const on =
                    Math.round(selectedLayer.opacity * 100) === v;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => handleOpacity(v)}
                      accessibilityRole="button"
                      accessibilityLabel={`Opacity ${v}%`}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 11,
                        backgroundColor: on
                          ? colors.primary
                          : "#16161A",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_MONO,
                          fontWeight: "700",
                          fontSize: 10,
                          color: on ? "#0B0B0C" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {v}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Effect toggles */}
          {selectedLayer && (
            <View style={{ flexDirection: "row", gap: 6 }}>
              {[
                { id: "shadow", label: "Shadow", on: selectedLayer.shadow },
                { id: "blur", label: "Blur", on: selectedLayer.blur },
                { id: "border", label: "Border", on: selectedLayer.border },
              ].map((x) => (
                <TouchableOpacity
                  key={x.id}
                  onPress={() => handleLayerAction(x.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${x.label}`}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 13,
                    backgroundColor: x.on
                      ? "rgba(255,107,53,0.18)"
                      : "#16161A",
                    borderWidth: 1,
                    borderColor: x.on
                      ? colors.primary
                      : "rgba(255,255,255,0.1)",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "700",
                      fontSize: 11,
                      color: x.on
                        ? colors.primary
                        : "rgba(255,255,255,0.65)",
                    }}
                  >
                    {x.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* Layers panel */}
      {tool === "layers" && (
        <Animated.View
          entering={FadeInDown.duration(200).springify().damping(20)}
          style={{
            maxHeight: "56%",
            backgroundColor: "#0A0A0B",
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -18 },
            shadowOpacity: 0.6,
            shadowRadius: 44,
            elevation: 30,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 14,
                color: "#fff",
              }}
            >
              Layers
            </Text>
            <TouchableOpacity
              onPress={() => setTool(null)}
              accessibilityRole="button"
              accessibilityLabel="Close layers panel"
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#1C1C1E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Layer list */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 6 }}
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
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                      padding: 8,
                      borderRadius: 12,
                      backgroundColor: isSel
                        ? "rgba(255,107,53,0.12)"
                        : "#0E0E10",
                      borderWidth: 1,
                      borderColor: isSel
                        ? "rgba(255,107,53,0.4)"
                        : colors.border,
                    }}
                  >
                    {/* Thumbnail placeholder */}
                    <View
                      style={{
                        width: 38,
                        height: 30,
                        borderRadius: 6,
                        backgroundColor: "#000",
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "700",
                          fontSize: 7,
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {l.name.slice(0, 6)}
                      </Text>
                    </View>

                    {/* Name + meta */}
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "700",
                          fontSize: 11.5,
                          color: "#fff",
                        }}
                        numberOfLines={1}
                      >
                        {l.name}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONT_MONO,
                          fontWeight: "500",
                          fontSize: 8.5,
                          color: "rgba(255,255,255,0.42)",
                        }}
                      >
                        z{l.z} · {Math.round(l.scale * 100)}% ·{" "}
                        {Math.round(l.rotation)}°
                        {l.locked ? " · locked" : ""}
                      </Text>
                    </View>

                    {/* Up/Down/Delete controls */}
                    <TouchableOpacity
                      onPress={() => handleLayerAction("up")}
                      accessibilityRole="button"
                      accessibilityLabel="Bring forward"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: "#1C1C1E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "600",
                          fontSize: 11,
                          color: "#fff",
                        }}
                      >
                        ▲
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleLayerAction("down")}
                      accessibilityRole="button"
                      accessibilityLabel="Send backward"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: "#1C1C1E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "600",
                          fontSize: 11,
                          color: "#fff",
                        }}
                      >
                        ▼
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleLayerAction("delete")}
                      accessibilityRole="button"
                      accessibilityLabel="Delete layer"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: "#2A1416",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "600",
                          fontSize: 11,
                          color: "#FF453A",
                        }}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

            {layers.length === 0 && (
              <View
                style={{
                  paddingVertical: 26,
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 12.5,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  No stickers yet
                </Text>
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "500",
                    fontSize: 11,
                    lineHeight: 15.4,
                    color: "rgba(255,255,255,0.35)",
                    textAlign: "center",
                  }}
                >
                  Open the sticker tray and tap any card to drop it on your
                  photo.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

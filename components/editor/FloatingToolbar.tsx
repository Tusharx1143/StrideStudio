/**
 * FloatingToolbar — Snapchat-inspired vertical floating toolbar.
 *
 * Positioned on the right side of the screen. Expands intelligently
 * when elements are selected. Opens contextual bottom sheets on tap.
 * Animates in/out with spring transitions.
 */
import React, { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { useCanvas } from "@/lib/canvas-state";
import { FONT_UI } from "@/lib/_core/theme";

// ── Tool Definition ──

export type ToolId =
  | "lens"
  | "stats"
  | "font"
  | "colors"
  | "theme"
  | "layers"
  | "effects"
  | "duplicate"
  | "lock"
  | "opacity"
  | "shadow"
  | "blur"
  | "border"
  | "align"
  | "undo"
  | "redo"
  | "delete"
  | "background";

interface ToolDef {
  id: ToolId;
  label: string;
  icon: string;
  /** Whether this tool is always visible */
  always: boolean;
  /** Whether this tool requires a selected layer */
  needsSelection: boolean;
}

const PRIMARY_TOOLS: ToolDef[] = [
  { id: "lens", label: "Lens", icon: "◑", always: true, needsSelection: false },
  { id: "stats", label: "Stats", icon: "≡", always: true, needsSelection: false },
  { id: "font", label: "Font", icon: "Aa", always: true, needsSelection: false },
  { id: "colors", label: "Colors", icon: "◉", always: true, needsSelection: false },
  { id: "theme", label: "Theme", icon: "✦", always: true, needsSelection: false },
  { id: "background", label: "Bg", icon: "▤", always: true, needsSelection: false },
  { id: "layers", label: "Layers", icon: "☰", always: true, needsSelection: false },
  { id: "effects", label: "Effects", icon: "✦", always: false, needsSelection: true },
];

const SECONDARY_TOOLS: ToolDef[] = [
  { id: "duplicate", label: "Dup", icon: "⊞", always: false, needsSelection: true },
  { id: "lock", label: "Lock", icon: "🔒", always: false, needsSelection: true },
  { id: "opacity", label: "Opacity", icon: "◐", always: false, needsSelection: true },
  { id: "shadow", label: "Shadow", icon: "◯", always: false, needsSelection: true },
  { id: "blur", label: "Blur", icon: "◎", always: false, needsSelection: true },
  { id: "border", label: "Border", icon: "▢", always: false, needsSelection: true },
  { id: "align", label: "Align", icon: "☰", always: false, needsSelection: true },
  { id: "undo", label: "Undo", icon: "↺", always: true, needsSelection: false },
  { id: "redo", label: "Redo", icon: "↻", always: true, needsSelection: false },
  { id: "delete", label: "Delete", icon: "✕", always: false, needsSelection: true },
];

// ── Props ──

interface FloatingToolbarProps {
  activeToolId: ToolId | null;
  onToolSelect: (toolId: ToolId) => void;
}

// ── Component ──

export function FloatingToolbar({
  activeToolId,
  onToolSelect,
}: FloatingToolbarProps) {
  const colors = useColors();
  const { selectedLayerId } = useCanvas();

  const hasSelection = selectedLayerId != null;

  const handlePress = useCallback(
    (tool: ToolDef) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      onToolSelect(tool.id);
    },
    [onToolSelect],
  );

  const visiblePrimary = useMemo(
    () =>
      PRIMARY_TOOLS.filter(
        (t) => t.always || (hasSelection && t.needsSelection) || !t.needsSelection,
      ),
    [hasSelection],
  );

  const visibleSecondary = useMemo(
    () =>
      SECONDARY_TOOLS.filter(
        (t) => t.always || (hasSelection && t.needsSelection) || !t.needsSelection,
      ),
    [hasSelection],
  );

  return (
    <View style={styles.container}>
      {/* Primary tools */}
      <View style={styles.rail}>
        {visiblePrimary.map((tool) => {
          const isActive = activeToolId === tool.id;
          return (
            <TouchableOpacity
              key={tool.id}
              onPress={() => handlePress(tool)}
              accessibilityRole="button"
              accessibilityLabel={tool.label}
              style={[
                styles.button,
                isActive && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
                tool.id === "delete" && hasSelection && {
                  backgroundColor: "rgba(255,69,58,0.15)",
                  borderColor: "rgba(255,69,58,0.5)",
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonIcon,
                  isActive && { color: "#0B0B0C" },
                  tool.id === "delete" && hasSelection && { color: "#FF453A" },
                ]}
              >
                {tool.icon}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Secondary tools (shown when expanded) */}
      {hasSelection && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.secondaryRail}
        >
          {visibleSecondary.map((tool) => {
            const isActive = activeToolId === tool.id;
            return (
              <TouchableOpacity
                key={tool.id}
                onPress={() => handlePress(tool)}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
                style={[
                  styles.buttonSmall,
                  isActive && {
                    backgroundColor: colors.primary,
                  },
                  tool.id === "delete" && {
                    backgroundColor: "rgba(255,69,58,0.15)",
                    borderColor: "rgba(255,69,58,0.5)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.buttonIconSmall,
                    isActive && { color: "#0B0B0C" },
                    tool.id === "delete" && { color: "#FF453A" },
                  ]}
                >
                  {tool.icon}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 6,
    top: 8,
    alignItems: "center",
    gap: 4,
    zIndex: 100,
  },
  rail: {
    gap: 5,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  buttonIcon: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  secondaryRail: {
    gap: 4,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: 96,
  },
  buttonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  buttonIconSmall: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 13,
    color: "#FFFFFF",
  },
});

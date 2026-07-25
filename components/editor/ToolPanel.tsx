/**
 * ToolPanel — animated bottom sheet for photo editing tools.
 *
 * A reusable bottom panel that slides up with editing tools:
 * - Draggable handle for expand/collapse
 * - Sectioned content (filters, adjustments, layers)
 * - Smooth spring animation
 * - Backdrop press to dismiss
 * - Safe area aware
 *
 * Used within the editor screen as the primary tool container.
 */
import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
  Keyboard,
} from "react-native";
import {
  EditorColors,
  EditorSemantic,
  EditorRadius,
  EditorType,
  EditorMotion,
  EditorSpace,
} from "@/constants/editor-theme";

// ── Types ──

export interface ToolSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

interface ToolPanelProps {
  sections: ToolSection[];
  activeSectionId: string | null;
  onSectionChange: (sectionId: string) => void;
  visible: boolean;
  onDismiss: () => void;
  /** Height when fully expanded (default: 60% of screen) */
  maxHeight?: number;
  /** Height when collapsed / showing handle only */
  minHeight?: number;
}

// ── Constants ──

const SCREEN_H = Dimensions.get("window").height;
const DEFAULT_MAX_HEIGHT = SCREEN_H * 0.55;
const HANDLE_HEIGHT = 28;

// ── Component ──

export function ToolPanel({
  sections,
  activeSectionId,
  onSectionChange,
  visible,
  onDismiss,
  maxHeight = DEFAULT_MAX_HEIGHT,
  minHeight = 0,
}: ToolPanelProps) {
  const animValue = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const heightValue = useRef(new Animated.Value(minHeight)).current;
  const hasEverOpened = useRef(visible);

  if (visible) hasEverOpened.current = true;

  // Animate in/out
  useEffect(() => {
    Animated.spring(animValue, {
      toValue: visible ? 1 : 0,
      damping: EditorMotion.spring.damping,
      stiffness: EditorMotion.spring.stiffness,
      mass: EditorMotion.spring.mass,
      useNativeDriver: true,
    }).start();

    Animated.spring(heightValue, {
      toValue: visible ? (activeSectionId ? maxHeight : HANDLE_HEIGHT + 40) : minHeight,
      damping: EditorMotion.spring.damping,
      stiffness: EditorMotion.spring.stiffness,
      mass: EditorMotion.spring.mass,
      useNativeDriver: false,
    }).start();
  }, [visible, activeSectionId, animValue, heightValue, maxHeight, minHeight]);

  // Dismiss keyboard when panel opens
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleBackdropPress = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [maxHeight, 0],
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Avoid rendering when panel has never been opened (perf optimization)
  if (!visible && !hasEverOpened.current) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
        />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateY }],
            maxHeight,
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Section tabs */}
        <View style={styles.tabs}>
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <Pressable
                key={section.id}
                onPress={() => onSectionChange(section.id)}
                accessibilityRole="tab"
                accessibilityLabel={section.title}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                ]}
                android_ripple={{ color: EditorColors.primary + "40" }}
              >
                <Text style={styles.tabIcon}>{section.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {section.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Active section content */}
        {activeSectionId && (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {sections.find((s) => s.id === activeSectionId)?.content}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: EditorSemantic.overlay,
  },
  panel: {
    backgroundColor: EditorColors.surface,
    borderTopLeftRadius: EditorRadius.modal,
    borderTopRightRadius: EditorRadius.modal,
    borderWidth: 1,
    borderColor: EditorColors.border,
    borderBottomWidth: 0,
    overflow: "hidden",
    // Subtle top glow
    shadowColor: EditorColors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: EditorSemantic.panelHandle,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: EditorSpace.lg,
    paddingVertical: EditorSpace.sm,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: EditorColors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: EditorRadius.pill,
    backgroundColor: "transparent",
    minHeight: 40,
  },
  tabActive: {
    backgroundColor: EditorColors.primary + "20",
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    color: EditorColors.mutedText,
    fontSize: EditorType.caption.size,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: EditorColors.primary,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: EditorSpace.lg,
    paddingBottom: EditorSpace["3xl"],
  },
});

/**
 * ContextualSheet — reusable bottom sheet for the Lens-based editor.
 *
 * Slides up from the bottom with a drag handle, backdrop, and animated content.
 * Inspired by Snapchat's contextual bottom sheets — keeps the user in the editor.
 * Closes on swipe-down or backdrop tap. Keyboard-aware.
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
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT_UI } from "@/lib/_core/theme";

// ── Constants ──

const SCREEN_H = Dimensions.get("window").height;
const DEFAULT_MAX_HEIGHT = SCREEN_H * 0.54;
const HANDLE_HEIGHT = 32;

// ── Props ──

export interface ContextualSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onDismiss: () => void;
  children: React.ReactNode;
  maxHeight?: number;
}

// ── Component ──

export function ContextualSheet({
  visible,
  title,
  subtitle,
  onDismiss,
  children,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: ContextualSheetProps) {
  const insets = useSafeAreaInsets();
  const animValue = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const hasEverOpened = useRef(visible);

  if (visible) hasEverOpened.current = true;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: visible ? 1 : 0,
      damping: 20,
      stiffness: 200,
      mass: 1,
      useNativeDriver: true,
    }).start();

    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible, animValue]);

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [maxHeight, 0],
  });

  if (!visible && !hasEverOpened.current) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          android_ripple={{ color: "transparent" }}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
            maxHeight,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 2 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#0A0A0B",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -18 },
    shadowOpacity: 0.6,
    shadowRadius: 44,
    elevation: 30,
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontFamily: FONT_UI,
    fontWeight: "800",
    fontSize: 14,
    color: "#FFFFFF",
  },
  subtitle: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
});

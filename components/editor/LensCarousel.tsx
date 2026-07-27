/**
 * LensCarousel — Snapchat-inspired horizontal scrolling lens carousel.
 *
 * Features:
 * - Horizontal scroll with live preview thumbnails
 * - Snap-to behavior with spring animation
 * - Category filter chips above the carousel
 * - Currently selected lens has highlighted border
 * - Instantly applies lens on selection
 */
import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { useCanvas } from "@/lib/canvas-state";
import { useApp } from "@/lib/app-context";
import { LENSES, getLensesByCategory } from "@/lib/lenses/registry";
import { METRICS, formatMetricValue } from "@/lib/lenses/metrics";
import {
  LENS_CATEGORIES,
  getOrderedCategories,
} from "@/lib/lenses/lens-categories";
import { getPalette } from "@/lib/stickers/palettes";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const SCREEN_W = Dimensions.get("window").width;
const CARD_W = 84;
const CARD_H = 72;
const CARD_GAP = 6;

// ── Props ──

interface LensCarouselProps {
  onSelectLens?: (lensId: string) => void;
  /** Available height for the carousel section */
  height?: number;
}

// ── Component ──

export function LensCarousel({
  onSelectLens,
  height,
}: LensCarouselProps) {
  const colors = useColors();
  const { lensId, setLens } = useCanvas();
  const { getSelectedActivity } = useApp();
  const [category, setCategory] = useState("all");
  const scrollX = useSharedValue(0);

  const activity = getSelectedActivity();
  const orderedCats = useMemo(() => getOrderedCategories(), []);

  // Filter lenses
  const filteredLenses = useMemo(() => {
    if (category === "all") return LENSES;
    return getLensesByCategory(category);
  }, [category]);

  // Auto-select first available if current is filtered out
  const currentInFilter = useMemo(
    () => filteredLenses.some((l) => l.id === lensId),
    [filteredLenses, lensId],
  );

  const handleSelect = useCallback(
    (id: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      setLens(id);
      if (onSelectLens) onSelectLens(id);
    },
    [setLens, onSelectLens],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={{ gap: 8 }}>
      {/* Category chips — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}
      >
        {/* "All" chip */}
        <TouchableOpacity
          onPress={() => setCategory("all")}
          accessibilityRole="button"
          accessibilityLabel="All lenses"
          style={[
            styles.chip,
            category === "all" && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              category === "all" && { color: "#0B0B0C" },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {orderedCats.map((cat) => {
          const active = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${cat.label}`}
              style={[
                styles.chip,
                active && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  active && { color: "#0B0B0C" },
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lens cards — horizontal carousel */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{
          gap: CARD_GAP,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        {filteredLenses.map((lens) => {
          const isSelected = lens.id === lensId;
          return (
            <TouchableOpacity
              key={lens.id}
              onPress={() => handleSelect(lens.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Lens: ${lens.name}`}
              style={[
                styles.card,
                isSelected && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              {/* Live thumbnail area */}
              <View style={styles.thumbnail}>
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "700",
                    fontSize: 9,
                    color: isSelected ? colors.primary : "rgba(255,255,255,0.6)",
                    textAlign: "center",
                  }}
                  numberOfLines={3}
                >
                  {lens.features.slice(0, 2).map((f) => {
                    const m = METRICS.find((m) => m.id === f);
                    return m
                      ? `${m.icon} ${formatMetricValue(f, activity)}\n`
                      : "";
                  }).join("")}
                </Text>
              </View>

              {/* Lens name */}
              <Text
                style={[
                  styles.cardLabel,
                  isSelected && { color: colors.primary },
                ]}
                numberOfLines={1}
              >
                {lens.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipText: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 9.5,
    letterSpacing: 0.06 * 9.5,
    color: "rgba(255,255,255,0.65)",
  },
  chipIcon: {
    fontSize: 11,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 12,
    backgroundColor: "#0E0E10",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    padding: 6,
  },
  thumbnail: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 8,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.05 * 8,
  },
});

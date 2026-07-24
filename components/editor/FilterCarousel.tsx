/**
 * FilterCarousel — Instagram-style horizontal scrolling photo filter strip.
 *
 * Features:
 * - Horizontal scroll with snap
 * - Live preview thumbnails (filter applied to a miniature of the photo)
 * - Selected state with violet ring + label highlight
 * - Haptic feedback on selection
 * - Touch-friendly 68px tap targets
 * - Smooth animated transitions
 */
import React, { useRef, useCallback, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { EditorColors, EditorRadius, EditorType, EditorMotion } from "@/constants/editor-theme";

// ── Types ──

export interface FilterOption {
  id: string;
  name: string;
  /** Optional preview thumbnail URI (pre-filtered image) */
  previewUri?: string;
  /** CSS filter string for web */
  cssFilter?: string;
  /** Intensity value for native filter application */
  intensity?: number;
}

interface FilterCarouselProps {
  filters: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** URI of the photo to use for live preview thumbnails */
  photoUri?: string;
  /** Height of the carousel strip */
  height?: number;
}

// ── Constants ──

const ITEM_WIDTH = 68;
const ITEM_HEIGHT = 86;
const ITEM_GAP = 10;
const SIDE_PADDING = 16;

// ── Component ──

export function FilterCarousel({
  filters,
  selectedId,
  onSelect,
  photoUri,
  height = 110,
}: FilterCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll selected filter into view
  useEffect(() => {
    const idx = filters.findIndex((f) => f.id === selectedId);
    if (idx >= 0 && scrollRef.current) {
      const offset = idx * (ITEM_WIDTH + ITEM_GAP) - 40;
      scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }
  }, [selectedId, filters]);

  const handleSelect = useCallback(
    (id: string) => {
      if (id === selectedId) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSelect(id);
    },
    [selectedId, onSelect],
  );

  return (
    <View style={{ height, backgroundColor: "transparent" }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          alignItems: "center",
          gap: ITEM_GAP,
          minHeight: height,
        }}
        style={{ flex: 1 }}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH + ITEM_GAP}
        snapToAlignment="start"
      >
        {filters.map((filter) => {
          const isSelected = filter.id === selectedId;

          return (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleSelect(filter.id)}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${filter.name}${isSelected ? " (selected)" : ""}`}
              accessibilityState={{ selected: isSelected }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              activeOpacity={0.7}
              style={styles.itemContainer}
            >
              {/* Preview thumbnail */}
              <View
                style={[
                  styles.previewBox,
                  isSelected && styles.previewBoxSelected,
                ]}
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={[
                      styles.previewImage,
                      // Apply CSS filter on web for live preview
                      // CSS filter property only applies on web; RN ImageStyle doesn't type it
                      filter.cssFilter ? ({ filter: filter.cssFilter } as Record<string, unknown>) : undefined,
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: EditorColors.border,
                      }}
                    />
                  </View>
                )}

                {/* Selected check overlay */}
                {isSelected && (
                  <View style={styles.selectedOverlay}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
                numberOfLines={1}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: "center",
    width: ITEM_WIDTH,
    gap: 6,
  },
  previewBox: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: EditorRadius.card,
    overflow: "hidden",
    backgroundColor: EditorColors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  previewBoxSelected: {
    borderColor: EditorColors.primary,
    shadowColor: EditorColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: EditorColors.surface,
  },
  selectedOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: EditorColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  label: {
    color: EditorColors.mutedText,
    fontSize: EditorType.caption.size,
    fontWeight: EditorType.caption.weight,
    textAlign: "center",
    maxWidth: ITEM_WIDTH + 8,
  },
  labelSelected: {
    color: EditorColors.primary,
    fontWeight: "700",
  },
});

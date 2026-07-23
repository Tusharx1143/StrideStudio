import { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

export interface Segment<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  selected: T;
  onSelect: (id: T) => void;
}

const SPRING_CONFIG = { damping: 16, stiffness: 200 };

/**
 * iOS-style segmented control with animated sliding indicator.
 * Uses spring animation for smooth segment transitions.
 */
export function SegmentedControl<T extends string>({
  segments,
  selected,
  onSelect,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  const selectedIndex = segments.findIndex((s) => s.id === selected);
  const translateX = useSharedValue(selectedIndex >= 0 ? selectedIndex : 0);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 100 }],
    width: `${100 / segments.length}%`,
  }));

  const handleSelect = useCallback(
    (id: T, index: number) => {
      translateX.value = withSpring(index, SPRING_CONFIG);
      onSelect(id);
    },
    [onSelect, translateX],
  );

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 2,
        flexDirection: "row",
        position: "relative",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Animated background indicator */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 2,
            left: `0%`,
            height: "calc(100% - 4px)",
            borderRadius: 8,
            backgroundColor: colors.foreground,
          },
          indicatorStyle,
        ]}
      />

      {segments.map((seg, i) => (
        <TouchableOpacity
          key={seg.id}
          onPress={() => handleSelect(seg.id, i)}
          accessibilityRole="radio"
          accessibilityLabel={seg.label}
          accessibilityState={{ selected: seg.id === selected }}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            paddingHorizontal: 4,
            minHeight: 36,
            zIndex: 1,
          }}
        >
          <Text
            style={{
              color: seg.id === selected ? colors.background : colors.muted,
              fontSize: 13,
              fontWeight: seg.id === selected ? "700" : "500",
              textTransform: "capitalize",
            }}
          >
            {seg.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

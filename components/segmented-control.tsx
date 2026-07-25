import { useCallback, useState } from "react";
import { Text, Pressable, View, LayoutChangeEvent } from "react-native";
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
  const [containerWidth, setContainerWidth] = useState(0);
  const segWidth = containerWidth / segments.length;

  const selectedIndex = segments.findIndex((s) => s.id === selected);
  const left = useSharedValue(selectedIndex >= 0 ? selectedIndex * segWidth : 0);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: left.value,
    width: segWidth,
  }));

  const handleSelect = useCallback(
    (id: T, index: number) => {
      left.value = withSpring(index * segWidth, SPRING_CONFIG);
      onSelect(id);
    },
    [onSelect, left, segWidth],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    left.value = selectedIndex * (w / segments.length);
  }, [selectedIndex, segments.length, left]);

  return (
    <View
      onLayout={onLayout}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 2,
        flexDirection: "row",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Animated indicator */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 3,
              bottom: 3,
              borderRadius: 8,
              backgroundColor: colors.foreground,
            },
            indicatorStyle,
          ]}
        />
      )}

      {segments.map((seg, i) => (
        <Pressable
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
        </Pressable>
      ))}
    </View>
  );
}

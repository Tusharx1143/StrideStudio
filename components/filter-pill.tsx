import { useCallback } from "react";
import { Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/lib/_core/theme";
import { BUTTON_SPRING } from "@/lib/animations";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Optional accent color (defaults to theme primary) */
  color?: string;
}

/**
 * Reusable filter pill with spring-animated active/inactive transition.
 * Used across home period filters, editor tabs, and templates sort options.
 */
export function FilterPill({
  label,
  active,
  onPress,
  color,
}: FilterPillProps) {
  const colors = useColors();
  const accentColor = color ?? colors.primary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, BUTTON_SPRING);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, BUTTON_SPRING);
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        {
          backgroundColor: active ? accentColor : colors.surface,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 36,
          borderWidth: 1,
          borderColor: active ? accentColor : colors.border,
          justifyContent: "center",
          alignItems: "center",
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          Typography.caption,
          {
            color: active ? "#FFFFFF" : colors.muted,
            fontWeight: active ? "700" : "500",
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

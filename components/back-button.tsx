import { useCallback } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { BUTTON_SPRING } from "@/lib/animations";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface BackButtonProps {
  /** Override navigation target (defaults to router.back) */
  onPress?: () => void;
  /** Custom color (defaults to theme foreground) */
  color?: string;
}

/**
 * Unified back button used consistently across all screens.
 * Uses Ionicons chevron-back with spring press animation and 44px touch target.
 */
export function BackButton({ onPress, color }: BackButtonProps) {
  const colors = useColors();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, BUTTON_SPRING);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, BUTTON_SPRING);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }, [onPress, router]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={22}
        color={color ?? colors.foreground}
      />
    </AnimatedPressable>
  );
}

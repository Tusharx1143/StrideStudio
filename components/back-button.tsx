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
 * Unified back button — matches the design handoff's 38–40px circle style.
 * Dark surface (#16161A), no border, with spring press animation.
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
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#16161A",
          alignItems: "center",
          justifyContent: "center",
        },
        animatedStyle,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={20}
        color={color ?? colors.foreground}
      />
    </AnimatedPressable>
  );
}

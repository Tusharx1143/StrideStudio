import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

type ToastType = "success" | "error" | "info";

interface AnimatedToastProps {
  message: string | null;
  type?: ToastType;
  durationMs?: number;
  onDismiss: () => void;
}

const SPRING_IN = { damping: 14, stiffness: 180 };
const ICON_MAP: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function AnimatedToast({
  message,
  type = "info",
  durationMs = 2000,
  onDismiss,
}: AnimatedToastProps) {
  const colors = useColors();
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (message) {
      // Slide in
      translateY.value = withSpring(0, SPRING_IN);
      opacity.value = withSpring(1, SPRING_IN);
      scale.value = withSpring(1, SPRING_IN);

      const timer = setTimeout(() => {
        // Slide out
        translateY.value = withSpring(80, SPRING_IN);
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.9, { duration: 200 });
        setTimeout(() => {
          runOnJS(onDismiss)();
        }, 250);
      }, durationMs);

      return () => clearTimeout(timer);
    }
  }, [message, durationMs, onDismiss, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!message) return null;

  const bgColor =
    type === "success"
      ? colors.success
      : type === "error"
        ? colors.error
        : colors.surface;

  return (
    <Animated.View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[
        {
          position: "absolute",
          bottom: 80,
          alignSelf: "center",
          backgroundColor: bgColor,
          borderRadius: 20,
          paddingHorizontal: 18,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
          opacity: message ? 1 : 0,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
        {ICON_MAP[type]}
      </Text>
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

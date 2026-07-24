import { useCallback, useState } from "react";
import { Platform, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface KudosButtonProps {
  /** Whether the heart is currently liked/filled */
  liked?: boolean;
  /** Called when toggled */
  onToggle?: (liked: boolean) => void;
  /** Size of the icon */
  size?: number;
  /** Accessibility label */
  label?: string;
}

const SPRING_BOUNCE = { damping: 8, stiffness: 300 };

/**
 * Animated heart/like button with scale pop and particle burst.
 * Inspired by Strava's kudos interaction.
 */
export function KudosButton({
  liked: initialLiked = false,
  onToggle,
  size = 24,
  label = "Give kudos",
}: KudosButtonProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(initialLiked);
  const scale = useSharedValue(1);
  const particleOpacity = useSharedValue(0);
  const particleScale = useSharedValue(0.3);

  const handlePress = useCallback(() => {
    const newState = !liked;
    setLiked(newState);

    // Bounce animation
    scale.value = withSequence(
      withSpring(1.3, SPRING_BOUNCE),
      withSpring(1, { damping: 12, stiffness: 250 }),
    );

    // Particle burst on like
    if (newState) {
      particleOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 400 }),
      );
      particleScale.value = withSequence(
        withTiming(0.3, { duration: 0 }),
        withTiming(1.8, { duration: 550 }),
      );
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        newState ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      );
    }

    onToggle?.(newState);
  }, [liked, scale, particleOpacity, particleScale, onToggle]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [{ scale: particleScale.value }],
  }));

  const heartColor = liked ? "#FF375F" : colors.muted;

  return (
    <Animated.View style={{ width: size + 16, height: size + 16, alignItems: "center", justifyContent: "center" }}>
      {/* Particle burst rings */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: "#FF375F",
          },
          particleStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            backgroundColor: "#FF375F33",
          },
          particleStyle,
        ]}
      />

      <Animated.View style={iconStyle}>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: liked }}
          hitSlop={8}
        >
          <IconSymbol
            name={liked ? "heart.fill" : "heart.fill"}
            size={size}
            color={heartColor}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

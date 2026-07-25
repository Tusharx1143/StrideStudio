import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/lib/_core/theme";
import { BUTTON_SPRING, useReducedMotion, getSpringConfig } from "@/lib/animations";
import { cn } from "@/lib/utils";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export interface StrideButtonProps extends Omit<PressableProps, "style"> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button label */
  children: string;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Override container style */
  style?: StyleProp<ViewStyle>;
  /** Override text style */
  textStyle?: StyleProp<TextStyle>;
  /** Accessibility label (defaults to children text) */
  accessibilityLabel?: string;
  /** Minimum height (defaults to 48px for touch target) */
  minHeight?: number;
}

export function StrideButton({
  variant = "primary",
  children,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  minHeight = 48,
  onPressIn,
  onPressOut,
  ...props
}: StrideButtonProps) {
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const isDisabled = disabled || loading;

  const springConfig = getSpringConfig(BUTTON_SPRING, reducedMotion);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgMap: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: "transparent",
    ghost: "transparent",
    destructive: colors.error + "20",
  };

  const borderMap: Record<ButtonVariant, string> = {
    primary: "transparent",
    secondary: colors.primary,
    ghost: "transparent",
    destructive: colors.error,
  };

  const textColorMap: Record<ButtonVariant, string> = {
    primary: "#FFFFFF",
    secondary: colors.primary,
    ghost: colors.foreground,
    destructive: colors.error,
  };

  const handlePressIn = useCallback(
    (e: any) => {
      if (isDisabled) return;
      if (reducedMotion) return;
      scale.value = withSpring(0.96, springConfig as WithSpringConfig);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPressIn?.(e);
    },
    [isDisabled, reducedMotion, scale, springConfig, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      if (isDisabled) return;
      if (reducedMotion) return;
      scale.value = withSpring(1, springConfig as WithSpringConfig);
      onPressOut?.(e);
    },
    [isDisabled, reducedMotion, scale, springConfig, onPressOut],
  );

  return (
    <AnimatedPressable
      {...props}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          minHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgMap[variant],
          borderRadius: 24,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderWidth: variant === "secondary" || variant === "destructive" ? 1.5 : 0,
          borderColor: borderMap[variant],
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColorMap[variant]}
          style={{ marginRight: children ? 8 : 0 }}
        />
      ) : null}
      <Text
        style={[
          Typography.body,
          {
            color: textColorMap[variant],
            fontWeight: "700",
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {loading ? (children || "Loading…") : children}
      </Text>
    </AnimatedPressable>
  );
}

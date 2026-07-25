import { View, Text, Pressable, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/lib/_core/theme";
import { BUTTON_SPRING } from "@/lib/animations";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SettingsRowVariant = "navigation" | "toggle" | "action" | "destructive";

export interface SettingsRowProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Row label */
  label: string;
  /** Optional value / subtitle shown on the right */
  value?: string;
  /** Row variant determines the right-side element */
  variant?: SettingsRowVariant;
  /** Toggle state (only for variant="toggle") */
  toggled?: boolean;
  /** Called on press (navigation), toggle change (toggle), or action */
  onPress: () => void;
  /** Override icon background color */
  iconColor?: string;
}

const ICON_BG_MAP: Record<SettingsRowVariant, string> = {
  navigation: "primary",
  toggle: "primary",
  action: "muted",
  destructive: "error",
};

/**
 * Reusable settings row with icon, label, and configurable trailing element.
 * Supports navigation (chevron), toggle (Switch), action, and destructive variants.
 */
export function SettingsRow({
  icon,
  label,
  value,
  variant = "navigation",
  toggled = false,
  onPress,
  iconColor,
}: SettingsRowProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, BUTTON_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, BUTTON_SPRING);
  };

  const bgKey = ICON_BG_MAP[variant];
  const bgColor =
    bgKey === "primary"
      ? iconColor ?? colors.primary
      : bgKey === "error"
        ? colors.error
        : colors.muted;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={variant === "toggle" ? "switch" : "button"}
      accessibilityLabel={label}
      accessibilityState={
        variant === "toggle" ? { checked: toggled } : undefined
      }
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 14,
        },
        animatedStyle,
      ]}
    >
      {/* Icon */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: bgColor + "18",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={bgColor} />
      </View>

      {/* Label + optional value */}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            Typography.body,
            {
              color:
                variant === "destructive" ? colors.error : colors.foreground,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      {/* Value or trailing element */}
      {variant === "toggle" ? (
        <Switch
          value={toggled}
          onValueChange={onPress}
          trackColor={{ false: colors.border, true: colors.primary + "60" }}
          thumbColor={toggled ? colors.primary : colors.muted}
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {value ? (
            <Text style={[Typography.bodySmall, { color: colors.muted }]}>
              {value}
            </Text>
          ) : null}
          {variant === "navigation" && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.muted}
            />
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

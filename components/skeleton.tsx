import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

interface SkeletonCardProps {
  /** Width of the skeleton block */
  width?: number | string;
  /** Height of the skeleton block */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Extra style */
  style?: ViewStyle;
}

/** Single animated skeleton block with shimmer */
export function SkeletonBlock({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonCardProps) {
  const colors = useColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.ease }),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Activity card skeleton matching the StoryCard layout */
export function ActivityCardSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 18,
        height: 300,
        marginBottom: 14,
        padding: 16,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <SkeletonBlock width={80} height={28} borderRadius={6} />
        <SkeletonBlock width={64} height={32} borderRadius={16} />
      </View>

      {/* Stats area */}
      <View style={{ gap: 8 }}>
        <SkeletonBlock width="40%" height={12} borderRadius={4} />
        <SkeletonBlock width="60%" height={18} borderRadius={4} />
        <SkeletonBlock width="35%" height={12} borderRadius={4} />
        <SkeletonBlock width="30%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

/** Template card skeleton for grid */
export function TemplateCardSkeleton({ fullWidth = false }: { fullWidth?: boolean }) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        minHeight: fullWidth ? 120 : 130,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <SkeletonBlock width="70%" height={16} borderRadius={4} />
      <SkeletonBlock
        width="40%"
        height={10}
        borderRadius={3}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}

/** List of skeleton cards for initial load */
export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 60 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ActivityCardSkeleton key={`skeleton-${i}`} />
      ))}
    </View>
  );
}

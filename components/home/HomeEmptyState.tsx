/**
 * HomeEmptyState — Animated empty state for the home screen.
 *
 * Shows an animated sport figure, contextual messaging, and an
 * animated CTA button. Extracted from the inline empty state
 * in app/(tabs)/index.tsx.
 */

import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { StrideButton } from "@/components/stride-button";
import { ActivityAnimatedIcon } from "@/components/activity-animated-icon";
import { headerEnter, staggeredEnter } from "@/lib/animations";

interface HomeEmptyStateProps {
  onSync: () => void;
}

export function HomeEmptyState({ onSync }: HomeEmptyStateProps) {
  const router = useRouter();
  const colors = useColors();
  const { stravaConnected } = useApp();

  return (
    <LinearGradient
      colors={["#0F172A", "#1E293B"]}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
      }}
    >
      {/* Animated sport figure */}
      <Animated.View
        entering={headerEnter(100)}
        style={{ marginBottom: 20 }}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: colors.primary + "30",
          }}
        >
          <ActivityAnimatedIcon type="run" size={80} />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={headerEnter(200)}
        style={{
          color: colors.foreground,
          fontSize: 24,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        {stravaConnected ? "Ready to roll?" : "Connect your Strava"}
      </Animated.Text>

      {/* Description */}
      <Animated.Text
        entering={staggeredEnter(3)}
        style={{
          color: colors.muted,
          fontSize: 15,
          marginTop: 10,
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 280,
        }}
      >
        {stravaConnected
          ? "Pull to refresh and sync your latest activities from Strava."
          : "Link your Strava account to see your rides, runs, and workouts — then turn them into beautiful shareable posts."}
      </Animated.Text>

      {/* CTA */}
      <Animated.View
        entering={staggeredEnter(5)}
        style={{ marginTop: 24 }}
      >
        {!stravaConnected ? (
          <StrideButton onPress={() => router.push("/profile-screen")}>
            Connect Strava
          </StrideButton>
        ) : (
          <StrideButton variant="secondary" onPress={onSync}>
            Sync Activities
          </StrideButton>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

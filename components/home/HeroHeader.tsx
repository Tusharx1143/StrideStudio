/**
 * HeroHeader — Greeting + athlete avatar + animated activity figure.
 *
 * Replaces the simple greeting row in the home screen.
 * Shows contextual greeting based on time of day, athlete name,
 * profile photo with streak ring, and a large animated sport figure
 * for the user's most recent activity type.
 */

import { View, Text, Image, TouchableOpacity } from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ActivityAnimatedIcon } from "@/components/activity-animated-icon";
import type { SportType } from "@/lib/sport-theme";
import { headerEnter } from "@/lib/animations";

interface HeroHeaderProps {
  scrollY?: SharedValue<number>;
}

/** Get time-of-day greeting */
function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
}

export function HeroHeader({ scrollY }: HeroHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const { athlete, activities } = useApp();
  const greeting = useMemo(() => getGreeting(), []);

  // Determine the most recent activity type for the hero figure
  const recentSport: SportType = useMemo(() => {
    if (activities.length === 0) return "run";
    return activities[0].type;
  }, [activities]);

  const displayName = athlete
    ? athlete.firstname
    : "Athlete";
  const avatarUri = athlete?.profile;

  return (
    <Animated.View
      entering={headerEnter(0)}
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      {/* Background accent */}
      <View
        style={{
          position: "absolute",
          top: -40,
          right: -20,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.primary + "10",
          opacity: 0.5,
        }}
      />

      {/* Main row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {/* Greeting + name */}
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              color: colors.muted,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            {greeting.text} {greeting.emoji}
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 28,
              fontWeight: "900",
              letterSpacing: -0.5,
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </View>

        {/* Athlete avatar + animated figure */}
        <View style={{ position: "relative" }}>
          {/* Animated sport figure in background */}
          <View
            style={{
              position: "absolute",
              top: -30,
              right: -10,
              opacity: 0.25,
              transform: [{ scale: 0.9 }],
            }}
            pointerEvents="none"
          >
            <ActivityAnimatedIcon type={recentSport} size={100} />
          </View>

          {/* Avatar button */}
          <TouchableOpacity
            onPress={() => router.push("/profile-screen")}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            {avatarUri ? (
              <View>
                {/* Streak ring */}
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    left: -3,
                    right: -3,
                    bottom: -3,
                    borderRadius: 27,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    opacity: 0.6,
                  }}
                />
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: colors.surface,
                  }}
                />
              </View>
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.primary + "40",
                }}
              >
                <ActivityAnimatedIcon type="run" size={32} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

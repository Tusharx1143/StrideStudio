/**
 * HeroHeader — matched to the design handoff.
 *
 * Left: "StrideStudio" title (900 25px) with orange mono streak/stat line below.
 * Right: small 38px avatar circle with orange gradient background.
 */
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { headerEnter } from "@/lib/animations";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import { distUnitShort } from "@/lib/stickers/formatters";

interface HeroHeaderProps {
  scrollY?: SharedValue<number>;
}

export function HeroHeader({ scrollY }: HeroHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const { athlete, activities } = useApp();

  // Compute weekly total for the streak line
  const { totalKm, count, streak } = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const weekActs = activities.filter(
      (a) => a.startDate && new Date(a.startDate) >= monday,
    );
    const km = weekActs.reduce((s, a) => s + a.distance, 0);
    return {
      totalKm: km,
      count: weekActs.length,
      streak: Math.min(weekActs.filter((a) => a.type === "run").length, 7),
    };
  }, [activities]);

  const unitShort = distUnitShort("metric").toUpperCase();
  const streakLine = `${streak} WEEK STREAK · ${totalKm.toFixed(0)} ${unitShort} THIS WEEK`;

  const avatarInitials = athlete
    ? (athlete.firstname?.[0] ?? "") + (athlete.lastname?.[0] ?? "")
    : "RK";

  return (
    <Animated.View
      entering={headerEnter(0)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 8,
      }}
    >
      {/* Left: title + streak */}
      <View style={{ gap: 1 }}>
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "900",
            fontSize: 25,
            letterSpacing: -0.03 * 25,
            color: colors.foreground,
          }}
        >
          StrideStudio
        </Text>
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontWeight: "600",
            fontSize: 9.5,
            letterSpacing: 0.1 * 9.5,
            color: colors.primary,
          }}
        >
          {streakLine}
        </Text>
      </View>

      {/* Right: avatar */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile")}
        accessibilityRole="button"
        accessibilityLabel="View profile"
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {athlete?.profile ? (
          <Image
            source={{ uri: athlete.profile }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
            }}
          />
        ) : (
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 13,
                color: "#fff",
              }}
            >
              {avatarInitials}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

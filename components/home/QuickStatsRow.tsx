/**
 * QuickStatsRow — Horizontal scrollable stat pills between hero and feed.
 *
 * Shows this week's key stats and achievements in glass-morphism cards.
 * Data sourced from existing computeWeekStats() and computeAchievements()
 * in lib/sport-theme.ts.
 */

import { View, Text, ScrollView } from "react-native";
import { useMemo } from "react";
import Animated from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { computeWeekStats, computeAchievements } from "@/lib/sport-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { staggeredEnter } from "@/lib/animations";

interface QuickStatsRowProps {
  entranceDelay?: number;
}

export function QuickStatsRow({ entranceDelay = 180 }: QuickStatsRowProps) {
  const colors = useColors();
  const { activities } = useApp();
  const weekStats = useMemo(() => computeWeekStats(activities), [activities]);
  const achievements = useMemo(() => computeAchievements(activities), [activities]);

  // Build stat pills
  const pills = useMemo(() => {
    const items: StatPillData[] = [];

    items.push({
      id: "activities",
      icon: "figure.run",
      label: "Activities",
      value: `${weekStats.activitiesCount}`,
      color: colors.primary,
    });

    items.push({
      id: "minutes",
      icon: "clock.fill",
      label: "Minutes",
      value: `${Math.round(weekStats.totalMinutes)}`,
      color: "#0A84FF",
    });

    // Add top 3 achievements
    achievements.slice(0, 3).forEach((a) => {
      items.push({
        id: a.id,
        icon: "trophy.fill",
        label: a.label,
        value: a.value,
        color: "#F59E0B",
      });
    });

    return items;
  }, [weekStats, achievements, colors.primary]);

  if (activities.length === 0) return null;

  return (
    <Animated.View
      entering={staggeredEnter(2)}
      style={{ marginBottom: 16 }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 10,
        }}
        snapToInterval={150}
        decelerationRate="fast"
      >
        {pills.map((pill) => (
          <StatPill key={pill.id} data={pill} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ── Types ──

interface StatPillData {
  id: string;
  icon: string;
  label: string;
  value: string;
  color: string;
}

// ── Stat Pill ──

function StatPill({ data }: { data: StatPillData }) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 120,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: data.color + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* SF Symbol name sourced from known keys — safe cast */}
        <IconSymbol name={data.icon as any} size={18} color={data.color} />
      </View>

      {/* Label + value */}
      <View>
        <Text
          style={{
            color: colors.muted,
            fontSize: 10,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
          numberOfLines={1}
        >
          {data.label}
        </Text>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 16,
            fontWeight: "800",
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {data.value}
        </Text>
      </View>
    </View>
  );
}

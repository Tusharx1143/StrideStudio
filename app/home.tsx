/**
 * Home Screen — Activity feed with animated sport figures and redesigned UI.
 *
 * Architecture:
 *   HeroHeader (greeting + avatar + animated figure)
 *   → WeekProgressRing (circular SVG progress)
 *   → QuickStatsRow (horizontal stat pills)
 *   → ActivityFeedCard list (enhanced story cards with animated SVG figures)
 *
 * Loading, error, and empty states are handled with dedicated components.
 */

import { Text, View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import type { PeriodId } from "@/lib/app-data";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityListSkeleton } from "@/components/skeleton";
import { HeroHeader } from "@/components/home/HeroHeader";
import { WeekProgressRing } from "@/components/home/WeekProgressRing";
import { QuickStatsRow } from "@/components/home/QuickStatsRow";
import { ActivityFeedCard } from "@/components/home/ActivityFeedCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, error, refresh, selectActivity, periodFilter, setPeriodFilter } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const goToEditor = useCallback(
    (activityId: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      selectActivity(activityId);
      router.push("/editor");
    },
    [router, selectActivity],
  );

  const openDetails = useCallback(
    (activityId: string) => {
      selectActivity(activityId);
      router.push({ pathname: "/activity/[id]", params: { id: activityId } });
    },
    [router, selectActivity],
  );

  // ── Loading State ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <HeroHeader />
          <ActivityListSkeleton count={3} />
        </View>
      </ScreenContainer>
    );
  }

  // ── Error State ──
  if (error && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} style={{ marginBottom: 12 }} />
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <View style={{ marginTop: 20 }}>
            <StrideButton variant="secondary" onPress={onRefresh}>
              Try Again
            </StrideButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty State ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <HomeEmptyState onSync={onRefresh} />
      </ScreenContainer>
    );
  }

  // Filter activities by the selected period
  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (periodFilter === "all") return true;
      if (!a.startDate) return false;
      const d = new Date(a.startDate);
      const now = new Date();
      const today = now.toDateString();
      const monday = new Date(now);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const mondayStr = monday.toDateString();
      switch (periodFilter) {
        case "today": return d.toDateString() === today;
        case "week": return d.toDateString() >= mondayStr;
        case "month":
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        default: return true;
      }
    });
  }, [activities, periodFilter]);

  // ── Activity Feed ──
  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View>
              <HeroHeader />
              <WeekProgressRing entranceDelay={100} activities={filtered} />
              <QuickStatsRow entranceDelay={180} activities={filtered} />

              {/* Period filter pills */}
              <View style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                paddingBottom: 12,
                gap: 6,
              }}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPeriodFilter(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter: ${p.label}`}
                    accessibilityState={{ selected: periodFilter === p.id }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: periodFilter === p.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: periodFilter === p.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{
                      color: periodFilter === p.id ? "#FFFFFF" : colors.foreground,
                      fontSize: 12,
                      fontWeight: "700",
                    }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          renderItem={({ item, index }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <ActivityFeedCard
                activity={item}
                index={index}
                onShare={() => goToEditor(item.id)}
                onOpen={() => openDetails(item.id)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.foreground}
            />
          }
        />
      </View>
    </ScreenContainer>
  );
}

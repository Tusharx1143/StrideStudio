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

import { Text, View, FlatList, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityListSkeleton } from "@/components/skeleton";
import { HeroHeader } from "@/components/home/HeroHeader";
import { WeekProgressRing } from "@/components/home/WeekProgressRing";
import { QuickStatsRow } from "@/components/home/QuickStatsRow";
import { ActivityFeedCard } from "@/components/home/ActivityFeedCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, error, refresh, selectActivity } = useApp();
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
          <Text style={{ color: colors.error, fontSize: 40, marginBottom: 12 }}>
            ⚠️
          </Text>
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

  // ── Activity Feed ──
  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View>
              <HeroHeader />
              <WeekProgressRing entranceDelay={100} />
              <QuickStatsRow entranceDelay={180} />
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

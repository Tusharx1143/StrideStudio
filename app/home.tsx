/**
 * Home Screen — Activity feed with animated sport figures and redesigned UI.
 *
 * Architecture:
 *   HeroHeader (greeting + avatar + animated figure)
 *   → WeekProgressRing (circular SVG progress)
 *   → QuickStatsRow (horizontal stat pills)
 *   → Period filter pills
 *   → ActivityFeedCard list
 *
 * This is the standalone home screen, used as the OAuth redirect target.
 * Restyled to match the design handoff tokens.
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
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    activities,
    loading,
    error,
    refresh,
    selectActivity,
    periodFilter,
    setPeriodFilter,
  } = useApp();
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
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(255,69,58,0.14)",
              borderWidth: 1,
              borderColor: "rgba(255,69,58,0.35)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
          </View>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 15,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <View style={{ marginTop: 22 }}>
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
    const now = new Date();
    const today = now.toDateString();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return activities.filter((a) => {
      if (periodFilter === "all") return true;
      if (!a.startDate) return false;
      const d = new Date(a.startDate);
      switch (periodFilter) {
        case "today":
          return d.toDateString() === today;
        case "week": {
          const dStart = new Date(d);
          dStart.setHours(0, 0, 0, 0);
          return dStart.getTime() >= monday.getTime();
        }
        case "month":
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        default:
          return true;
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
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                  gap: 7,
                }}
              >
                {PERIODS.map((p) => {
                  const on = periodFilter === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setPeriodFilter(p.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter: ${p.label}`}
                      accessibilityState={{ selected: on }}
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 14,
                        borderRadius: 16,
                        backgroundColor: on ? colors.primary : "#16161A",
                        borderWidth: 1,
                        borderColor: on ? "rgba(255,107,53,0.2)" : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "700",
                          fontSize: 10,
                          letterSpacing: 0.24 * 10,
                          textTransform: "uppercase",
                          color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)",
                        }}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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

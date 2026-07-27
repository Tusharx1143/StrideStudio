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
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityListSkeleton } from "@/components/skeleton";
import { HeroHeader } from "@/components/home/HeroHeader";
import { ActivityFeedCard } from "@/components/home/ActivityFeedCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

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

  // Week strip — compute daily km totals for the last 7 days
  const weekStrip = useMemo(() => {
    const now = new Date();
    const days: { day: string; km: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = DAYS[(d.getDay() + 6) % 7];
      const km = activities
        .filter((a) => {
          if (!a.startDate) return false;
          const ad = new Date(a.startDate);
          return (
            ad.getDate() === d.getDate() &&
            ad.getMonth() === d.getMonth() &&
            ad.getFullYear() === d.getFullYear()
          );
        })
        .reduce((s, a) => s + a.distance, 0);
      days.push({ day: dayStr, km });
    }
    return days;
  }, [activities]);

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

              {/* Week strip — 7 day pills */}
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  paddingBottom: 10,
                  gap: 7,
                }}
              >
                {weekStrip.map((d, i) => {
                  const hasActivity = d.km > 0;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        gap: 4,
                        paddingVertical: 8,
                        borderRadius: 11,
                        backgroundColor: hasActivity
                          ? "rgba(255,107,53,0.14)"
                          : "#0E0E10",
                        borderWidth: 1,
                        borderColor: hasActivity
                          ? "rgba(255,107,53,0.32)"
                          : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "700",
                          fontSize: 8,
                          letterSpacing: 0.1 * 8,
                          color: hasActivity
                            ? "rgba(255,255,255,0.6)"
                            : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {d.day}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONT_MONO,
                          fontWeight: "800",
                          fontSize: 12,
                          color: hasActivity
                            ? colors.primary
                            : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {d.km > 0 ? d.km.toFixed(0) : "–"}
                      </Text>
                    </View>
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
          contentContainerStyle={{ paddingBottom: 92 }}
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

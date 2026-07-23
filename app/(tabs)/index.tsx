import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration } from "@/lib/app-data";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityListSkeleton } from "@/components/skeleton";

function StoryCard({ activity, onShare, onOpen }: { activity: Activity; onShare: () => void; onOpen: () => void }) {
  const colors = useColors();

  const paceOrSpeed =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60)
          .toString()
          .padStart(2, "0")}/km`
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : "--";

  const typeEmoji =
    activity.type === "run" ? "🏃" : activity.type === "ride" ? "🚴" : "💪";

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${activity.distance.toFixed(1)} kilometers, ${activity.date}`}
      accessibilityHint="Tap to view activity details"
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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "700" }}>{activity.date}</Text>
        <TouchableOpacity
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={`Share ${activity.title}`}
          style={{
            backgroundColor: colors.border,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 7,
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>Share</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
          {typeEmoji} {activity.title}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Courier", fontWeight: "700", lineHeight: 20 }}>
          {activity.distance > 0 ? `${activity.distance.toFixed(2)} km` : "—"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, fontFamily: "Courier", lineHeight: 18 }}>{paceOrSpeed}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, fontFamily: "Courier", lineHeight: 18 }}>
          {formatDuration(activity.duration)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, error, stravaConnected, refresh, selectActivity } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const goToEditor = (activityId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activityId);
    router.push("/editor");
  };

  const openDetails = (activityId: string) => {
    selectActivity(activityId);
    router.push({ pathname: "/activity/[id]", params: { id: activityId } });
  };

  const goToProfile = () => {
    router.push("/(tabs)/profile");
  };

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>StrideStudio</Text>
          </View>
          <ActivityListSkeleton count={3} />
        </View>
      </ScreenContainer>
    );
  }

  // ── Error state ──
  if (error && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ color: colors.error, fontSize: 16, fontWeight: "600", textAlign: "center" }}>⚠️</Text>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginTop: 12, textAlign: "center" }}>
            {error}
          </Text>
          <View style={{ marginTop: 16 }}>
            <StrideButton variant="secondary" onPress={onRefresh}>
              Try Again
            </StrideButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty state ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏃</Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {stravaConnected ? "No activities yet" : "Connect your Strava"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "We couldn't find any activities. Sync your Strava and pull to refresh."
              : "Link your Strava account to see your rides, runs, and workouts here."}
          </Text>
          {!stravaConnected && (
            <View style={{ marginTop: 20 }}>
              <StrideButton onPress={goToProfile}>
                Connect Strava
              </StrideButton>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>StrideStudio</Text>
        </View>

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoryCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
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

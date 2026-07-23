import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration } from "@/lib/app-data";

function StoryCard({ activity, onShare, onOpen }: { activity: Activity; onShare: () => void; onOpen: () => void }) {
  const paceOrSpeed =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60)
          .toString()
          .padStart(2, "0")}/km`
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : "--";

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#0E0E10",
        borderRadius: 18,
        height: 300,
        marginBottom: 14,
        padding: 16,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#1C1C1E",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "700" }}>{activity.date}</Text>
        <TouchableOpacity
          onPress={onShare}
          style={{
            backgroundColor: "#1C1C1E",
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 7,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>Share</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={{ color: "#8E8E93", fontSize: 12, marginBottom: 6 }}>
          {activity.type === "run" ? "🏃 " : activity.type === "ride" ? "🚴 " : "💪 "}
          {activity.title}
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Courier", fontWeight: "700", lineHeight: 20 }}>
          {activity.distance > 0 ? `${activity.distance.toFixed(2)} km` : "—"}
        </Text>
        <Text style={{ color: "#AEAEB2", fontSize: 12, fontFamily: "Courier", lineHeight: 18 }}>{paceOrSpeed}</Text>
        <Text style={{ color: "#AEAEB2", fontSize: 12, fontFamily: "Courier", lineHeight: 18 }}>
          {formatDuration(activity.duration)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
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

  // ── Render states ──

  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 16 }}>Loading your activities…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "600", textAlign: "center" }}>⚠️</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginTop: 12, textAlign: "center" }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{
              marginTop: 16,
              backgroundColor: "#1C1C1E",
              borderRadius: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏃</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {stravaConnected ? "No activities yet" : "Connect your Strava"}
          </Text>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "We couldn't find any activities. Sync your Strava and pull to refresh."
              : "Link your Strava account to see your rides, runs, and workouts here."}
          </Text>
          {!stravaConnected && (
            <TouchableOpacity
              onPress={goToProfile}
              style={{
                marginTop: 20,
                backgroundColor: "#FF6B35",
                borderRadius: 24,
                paddingHorizontal: 28,
                paddingVertical: 14,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Connect Strava</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0" containerClassName="bg-black">
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800" }}>StrideStudio</Text>
        </View>

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoryCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        />
      </View>
    </ScreenContainer>
  );
}

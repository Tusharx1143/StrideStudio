import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration } from "@/lib/app-data";

/**
 * Home feed — story-style tall dark cards like the original app:
 * day heading top-left, small mono stats block pinned bottom-left.
 */
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
  const { activities, selectActivity } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const goToEditor = (activityId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activityId);
    router.push("/(tabs)/editor");
  };

  const openDetails = (activityId: string) => {
    selectActivity(activityId);
    router.push({ pathname: "/activity/[id]", params: { id: activityId } });
  };

  return (
    <ScreenContainer className="p-0" containerClassName="bg-black">
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800" }}>share aura</Text>
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

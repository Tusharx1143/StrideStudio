import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration } from "@/lib/app-data";
import { FadeIn, ScalePress, TOUCH_MIN } from "@/lib/animations";

function StoryCard({ activity, onShare, onOpen, index }: { activity: Activity; onShare: () => void; onOpen: () => void; index: number }) {
  const paceOrSpeed =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60).toString().padStart(2, "0")}/km`
      : activity.speed != null ? `${activity.speed.toFixed(1)} km/h` : "--";

  return (
    <FadeIn delay={index * 80}>
      <TouchableOpacity
        onPress={onOpen}
        activeOpacity={0.85}
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
          <TouchableOpacity onPress={onShare} style={[{
            backgroundColor: "#1C1C1E",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 10,
            justifyContent: "center",
            alignItems: "center",
          }, TOUCH_MIN]}>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Share</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginBottom: 6 }}>
            {activity.type === "run" ? "🏃 " : activity.type === "ride" ? "🚴 " : "💪 "}
            {activity.title}
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "Courier", fontWeight: "700", lineHeight: 22 }}>
            {activity.distance > 0 ? `${activity.distance.toFixed(2)} km` : "—"}
          </Text>
          <Text style={{ color: "#AEAEB2", fontSize: 14, fontFamily: "Courier", lineHeight: 20 }}>{paceOrSpeed}</Text>
          <Text style={{ color: "#AEAEB2", fontSize: 14, fontFamily: "Courier", lineHeight: 20 }}>
            {formatDuration(activity.duration)}
          </Text>
        </View>
      </TouchableOpacity>
    </FadeIn>
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

  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏃</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            No activities yet
          </Text>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            Sync your Strava to see your workouts here.
          </Text>
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
          renderItem={({ item, index }) => (
            <StoryCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} index={index} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        />
      </View>
    </ScreenContainer>
  );
}

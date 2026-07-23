import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { formatDuration } from "@/lib/app-data";

/**
 * Activity details — dark monochrome layout matching the reference app:
 * large day heading, mono stat rows, share button opening the template picker.
 */
export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activities, selectActivity } = useApp();

  const activity = activities.find((a) => a.id === id) ?? activities[0];

  const paceStr =
    activity.pace != null
      ? `${Math.floor(activity.pace)}:${Math.round((activity.pace - Math.floor(activity.pace)) * 60)
          .toString()
          .padStart(2, "0")} /km`
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : "--";

  const onShare = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activity.id);
    router.push("/(tabs)/editor");
  };

  const rows: [string, string][] = [
    ["Distance", `${activity.distance.toFixed(2)} km`],
    ["Duration", formatDuration(activity.duration)],
    ["Avg Pace", paceStr],
    ["Elevation Gain", `${activity.elevation ?? 0} m`],
    ["Avg Heart Rate", `${activity.heartRate ?? 0} bpm`],
    ["Calories", `${activity.calories ?? 0} cal`],
  ];

  return (
    <ScreenContainer className="p-0" containerClassName="bg-black" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#1C1C1E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onShare}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 9,
            }}
          >
            <Text style={{ color: "#000000", fontSize: 13, fontWeight: "700" }}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 34, fontWeight: "800" }}>{activity.date}</Text>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 4, marginBottom: 24 }}>
            {activity.type === "run" ? "🏃" : activity.type === "ride" ? "🚴" : "💪"} {activity.title}
          </Text>

          <View
            style={{
              backgroundColor: "#0E0E10",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#1C1C1E",
              overflow: "hidden",
            }}
          >
            {rows.map(([label, value], i) => (
              <View
                key={label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                  borderBottomColor: "#1C1C1E",
                }}
              >
                <Text style={{ color: "#8E8E93", fontSize: 14 }}>{label}</Text>
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Courier", fontWeight: "700" }}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={onShare}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 26,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 24,
            }}
          >
            <Text style={{ color: "#000000", fontSize: 15, fontWeight: "700" }}>Create Post from Activity</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

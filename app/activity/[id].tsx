import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { formatDuration, formatPace } from "@/lib/app-data";

export default function ActivityDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, selectActivity } = useApp();

  const activity = activities.find((a) => a.id === id) ?? activities[0];
  const typeEmoji = activity.type === "run" ? "🏃" : activity.type === "ride" ? "🚴" : "💪";

  const statRows: { label: string; value: string }[] = [];
  if (activity.distance > 0) statRows.push({ label: "Distance", value: `${activity.distance.toFixed(1)} km` });
  statRows.push({ label: "Duration", value: formatDuration(activity.duration) });
  if (activity.pace != null) statRows.push({ label: "Avg Pace", value: formatPace(activity.pace) });
  if (activity.speed != null) statRows.push({ label: "Avg Speed", value: `${activity.speed.toFixed(1)} km/h` });
  if (activity.elevation != null) statRows.push({ label: "Elevation Gain", value: `${activity.elevation} m` });
  if (activity.heartRate != null) statRows.push({ label: "Avg Heart Rate", value: `${activity.heartRate} bpm` });
  if (activity.calories != null) statRows.push({ label: "Calories", value: `${activity.calories} kcal` });

  const createPost = () => {
    selectActivity(activity.id);
    router.push("/(tabs)/editor");
  };

  return (
    <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>Activity Details</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Activity Hero */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 8 }}>{typeEmoji}</Text>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "bold" }}>{activity.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>{activity.date}</Text>
          </View>

          {/* Route placeholder */}
          {activity.type !== "workout" && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                height: 160,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🗺️</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>GPS route preview</Text>
            </View>
          )}

          {/* Stats table */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            {statRows.map((row, index) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: index < statRows.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 14 }}>{row.label}</Text>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={createPost}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000000", fontSize: 16, fontWeight: "700" }}>Create Post from Activity</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

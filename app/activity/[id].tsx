import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { formatDuration } from "@/lib/app-data";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { ActivityCardSkeleton } from "@/components/skeleton";

export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, selectActivity } = useApp();

  const activity = activities.find((a) => a.id === id);

  // ── Loading ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
          <ActivityCardSkeleton />
        </View>
      </ScreenContainer>
    );
  }

  // ── Not found ──
  if (!activity) {
    return (
      <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>Activity not found</Text>
          <View style={{ marginTop: 16 }}>
            <StrideButton variant="secondary" onPress={() => router.back()}>
              Go Back
            </StrideButton>
          </View>
        </View>
      </ScreenContainer>
    );
  }

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
    router.push("/editor");
  };

  const typeEmoji =
    activity.type === "run" ? "🏃" : activity.type === "ride" ? "🚴" : "💪";

  const rows: [string, string][] = [
    ["Distance", `${activity.distance.toFixed(2)} km`],
    ["Duration", formatDuration(activity.duration)],
    ["Avg Pace", paceStr],
    ["Elevation Gain", `${activity.elevation ?? 0} m`],
    ["Avg Heart Rate", activity.hasHeartrate ? `${activity.heartRate ?? 0} bpm` : "--"],
    ["Calories", `${activity.calories ?? 0} cal`],
  ];

  return (
    <ScreenContainer className="p-0" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header bar */}
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
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Create post from this activity"
            style={{
              backgroundColor: colors.foreground,
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 9,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.background, fontSize: 13, fontWeight: "700" }}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={{ color: colors.foreground, fontSize: 34, fontWeight: "800" }}>{activity.date}</Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 24 }}>
            {typeEmoji} {activity.title}
          </Text>

          {/* Stats card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
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
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
                <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Courier", fontWeight: "700" }}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={{ marginTop: 24 }}>
            <StrideButton variant="secondary" onPress={onShare}>
              Create Post from Activity
            </StrideButton>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

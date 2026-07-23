import { Text, View, TouchableOpacity, FlatList, RefreshControl, Platform } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration, formatPace } from "@/lib/app-data";

function ActivityCard({ activity, onShare, onOpen }: { activity: Activity; onShare: () => void; onOpen: () => void }) {
  const colors = useColors();
  const typeEmoji = activity.type === "run" ? "🏃" : activity.type === "ride" ? "🚴" : "💪";

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>{typeEmoji}</Text>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>{activity.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginLeft: 8 }}>{activity.date}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20 }}>
            {activity.distance > 0 && (
              <View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>Distance</Text>
                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: "bold" }}>
                  {activity.distance.toFixed(1)} km
                </Text>
              </View>
            )}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>Duration</Text>
              <Text style={{ color: colors.primary, fontSize: 17, fontWeight: "bold" }}>
                {formatDuration(activity.duration)}
              </Text>
            </View>
            {activity.pace != null && (
              <View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>Pace</Text>
                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: "bold" }}>
                  {formatPace(activity.pace)}
                </Text>
              </View>
            )}
            {activity.speed != null && (
              <View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>Speed</Text>
                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: "bold" }}>
                  {activity.speed.toFixed(1)} km/h
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={onShare}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            marginLeft: 12,
          }}
        >
          <Text style={{ color: "#000000", fontSize: 12, fontWeight: "700" }}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { activities, selectActivity } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const weekTotals = useMemo(() => {
    const distance = activities.reduce((sum, a) => sum + a.distance, 0);
    return { distance: distance.toFixed(1), count: activities.length };
  }, [activities]);

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
    <ScreenContainer className="p-0">
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold", marginBottom: 2 }}>
            Share Aura
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14 }}>Your workouts, beautifully shared</Text>
        </View>

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} />
          )}
          ListHeaderComponent={
            <View style={{ flexDirection: "row", paddingVertical: 12, gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Total Distance</Text>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "bold" }}>
                  {weekTotals.distance} km
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Activities</Text>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "bold" }}>{weekTotals.count}</Text>
              </View>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => goToEditor(activities[0]?.id ?? "1")}
        style={{
          position: "absolute",
          bottom: 24,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 28, color: "#000000", lineHeight: 32 }}>+</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

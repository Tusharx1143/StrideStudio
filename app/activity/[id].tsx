import { useMemo } from "react";
import { ScrollView, Text, View, Pressable, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { RouteMap } from "@/components/route-map";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration, formatPace } from "@/lib/app-data";
import { ACTIVITY_META } from "@/lib/feed-stats";
import { formatDayHeading, formatFullDateTime } from "@/lib/format";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;

function buildRows(activity: Activity): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Activity type", value: ACTIVITY_META[activity.type].label },
    { label: "Distance", value: activity.distance > 0 ? `${activity.distance.toFixed(2)} km` : "—" },
    { label: "Duration", value: formatDuration(activity.duration) },
  ];

  if (activity.pace != null) {
    rows.push({ label: "Avg pace", value: formatPace(activity.pace) });
  } else if (activity.speed != null) {
    rows.push({ label: "Avg speed", value: `${activity.speed.toFixed(1)} km/h` });
  }

  if (activity.elevation != null) {
    rows.push({ label: "Elevation gain", value: `${Math.round(activity.elevation)} m` });
  }

  if (activity.hasHeartrate && activity.heartRate != null) {
    rows.push({
      label: "Avg / max HR",
      value: activity.maxHeartRate != null ? `${activity.heartRate} / ${activity.maxHeartRate} bpm` : `${activity.heartRate} bpm`,
    });
  }

  if (activity.calories != null) {
    rows.push({ label: "Calories", value: `${Math.round(activity.calories)} cal` });
  }

  if (activity.averageTemp != null) {
    rows.push({ label: "Avg temp", value: `${Math.round(activity.averageTemp)}°C` });
  }

  rows.push({ label: "Started", value: formatFullDateTime(activity.startDate) });

  return rows;
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activities, loading, selectActivity } = useApp();

  const activity = activities.find((a) => a.id === id);
  const rows = useMemo(() => (activity ? buildRows(activity) : []), [activity]);

  const onShare = () => {
    if (!activity) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activity.id);
    router.push("/capture");
  };

  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-canvas" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.foreground} />
        </View>
      </ScreenContainer>
    );
  }

  if (!activity) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-canvas" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerState}>
          <Text style={styles.notFoundTitle}>Activity not found</Text>
          <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
            <Text style={styles.notFoundButtonText}>Go back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const meta = ACTIVITY_META[activity.type];

  return (
    <ScreenContainer className="p-0" containerClassName="bg-canvas" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Pressable onPress={onShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dayLabel}>{formatDayHeading(activity.startDate)}</Text>
        <Text style={styles.typeLine}>
          {meta.label} · {activity.title}
        </Text>

        <View style={styles.routeCard}>
          <RouteMap polyline={activity.summaryPolyline} accent={meta.accent} />
        </View>

        <View style={styles.statTable}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.statRow, i < rows.length - 1 && styles.statRowDivider]}
            >
              <Text style={styles.statLabel}>{row.label}</Text>
              <Text style={styles.statValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onShare} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={styles.ctaText}>CREATE POST FROM ACTIVITY</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundTitle: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 18,
    color: C.foreground,
  },
  notFoundButton: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  notFoundButtonText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 14,
    color: C.foreground,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 18,
    color: C.foreground,
  },
  shareButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  shareButtonText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 13,
    color: "#0B0B0C",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dayLabel: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 32,
    letterSpacing: -0.9,
    color: C.foreground,
  },
  typeLine: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 13,
    color: C.muted,
    marginTop: 6,
    marginBottom: 20,
  },
  routeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    overflow: "hidden",
    marginBottom: 16,
  },
  statTable: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  statRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statLabel: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 13.5,
    color: C.muted,
  },
  statValue: {
    fontFamily: AppFonts.mono.bold,
    fontSize: 13.5,
    color: C.foreground,
  },
  cta: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaText: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 14,
    color: "#0B0B0C",
  },
});

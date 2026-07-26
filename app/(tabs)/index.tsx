import { useMemo, useState } from "react";
import {
  Text,
  View,
  Pressable,
  FlatList,
  RefreshControl,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { GradientAvatar } from "@/components/gradient-avatar";
import { useApp } from "@/lib/app-context";
import { Activity, formatDuration, formatPace } from "@/lib/app-data";
import { ACTIVITY_META, computeWeekStrip, computeStreakWeeks, computeWeekTotalKm } from "@/lib/feed-stats";
import { formatDayHeading } from "@/lib/format";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;


function CardTint({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="tint" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </LinearGradient>
        <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#000000" stopOpacity={0.42} />
          <Stop offset="38%" stopColor="#000000" stopOpacity={0.1} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.86} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#tint)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
    </Svg>
  );
}

function StoryCard({
  activity,
  onShare,
  onOpen,
}: {
  activity: Activity;
  onShare: () => void;
  onOpen: () => void;
}) {
  const meta = ACTIVITY_META[activity.type];
  const distLine = activity.distance > 0 ? `${activity.distance.toFixed(2)} km` : "—";
  const paceLine =
    activity.pace != null
      ? formatPace(activity.pace)
      : activity.speed != null
        ? `${activity.speed.toFixed(1)} km/h`
        : "—";

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <CardTint color={meta.accent} />
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardDay}>{formatDayHeading(activity.startDate)}</Text>
          <Pressable onPress={onShare} style={styles.sharePill} hitSlop={6}>
            <Text style={styles.sharePillText}>SHARE</Text>
          </Pressable>
        </View>

        <View style={styles.cardStats}>
          <Text style={styles.cardType}>
            {meta.label} · {activity.title}
          </Text>
          <Text style={styles.cardDistance}>{distLine}</Text>
          <Text style={styles.cardSub}>{paceLine}</Text>
          <Text style={styles.cardSub}>{formatDuration(activity.duration)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function WeekStrip({ activities }: { activities: Activity[] }) {
  const days = useMemo(() => computeWeekStrip(activities), [activities]);

  return (
    <View style={styles.weekStrip}>
      {days.map((d, i) => (
        <View
          key={i}
          style={[
            styles.weekCell,
            d.km != null ? styles.weekCellActive : styles.weekCellInactive,
          ]}
        >
          <Text style={[styles.weekDayLabel, d.km != null && styles.weekDayLabelActive]}>{d.day}</Text>
          <Text style={[styles.weekKm, d.km == null && styles.weekKmInactive]}>
            {d.km != null ? Math.round(d.km) : "–"}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { activities, loading, error, stravaConnected, athlete, refresh, selectActivity } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const goToEditor = (activityId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectActivity(activityId);
    router.push("/capture");
  };

  const openDetails = (activityId: string) => {
    selectActivity(activityId);
    router.push({ pathname: "/activity/[id]", params: { id: activityId } });
  };

  const goToProfile = () => router.push("/(tabs)/profile");

  const streakWeeks = useMemo(() => computeStreakWeeks(activities), [activities]);
  const weekTotalKm = useMemo(() => computeWeekTotalKm(activities), [activities]);
  const streakLine = `${streakWeeks} WEEK STREAK · ${Math.round(weekTotalKm)} KM THIS WEEK`;

  const initials =
    athlete?.firstname || athlete?.lastname
      ? `${athlete.firstname?.[0] ?? ""}${athlete.lastname?.[0] ?? ""}`.toUpperCase()
      : "SS";

  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-canvas">
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.foreground} />
          <Text style={styles.centerStateText}>Loading your activities…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-canvas">
        <View style={[styles.centerState, { paddingHorizontal: 32 }]}>
          <Text style={styles.centerStateTitle}>{error}</Text>
          <Pressable onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-canvas">
        <View style={[styles.centerState, { paddingHorizontal: 32 }]}>
          <Text style={styles.centerStateTitle}>
            {stravaConnected ? "No activities yet" : "Connect your Strava"}
          </Text>
          <Text style={styles.centerStateBody}>
            {stravaConnected
              ? "We couldn't find any activities. Sync your Strava and pull to refresh."
              : "Link your Strava account to see your rides, runs, and workouts here."}
          </Text>
          {!stravaConnected && (
            <Pressable onPress={goToProfile} style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect Strava</Text>
            </Pressable>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0" containerClassName="bg-canvas">
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>StrideStudio</Text>
          <Text style={styles.streakLine}>{streakLine}</Text>
        </View>
        <GradientAvatar initials={initials} onPress={goToProfile} />
      </View>

      <WeekStrip activities={activities} />

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoryCard activity={item} onShare={() => goToEditor(item.id)} onOpen={() => openDetails(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.foreground} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  centerStateText: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 14,
    color: C.muted,
  },
  centerStateTitle: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 18,
    color: C.foreground,
    textAlign: "center",
  },
  centerStateBody: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 14,
    lineHeight: 20,
    color: C.muted,
    textAlign: "center",
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: C.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 14,
    color: C.foreground,
  },
  connectButton: {
    marginTop: 20,
    backgroundColor: C.primary,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  connectButtonText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  appTitle: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 25,
    letterSpacing: -0.75,
    color: C.foreground,
  },
  streakLine: {
    fontFamily: AppFonts.mono.semiBold,
    fontSize: 9.5,
    letterSpacing: 1,
    color: C.primary,
    marginTop: 1,
  },
  weekStrip: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 10,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
  },
  weekCellActive: {
    backgroundColor: "rgba(255,107,53,0.14)",
    borderColor: "rgba(255,107,53,0.32)",
  },
  weekCellInactive: {
    backgroundColor: C.surface,
    borderColor: C.border,
  },
  weekDayLabel: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 8,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.35)",
  },
  weekDayLabelActive: {
    color: C.primary,
    opacity: 0.85,
  },
  weekKm: {
    fontFamily: AppFonts.mono.bold,
    fontSize: 12,
    color: C.primary,
  },
  weekKmInactive: {
    color: "rgba(255,255,255,0.35)",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    height: 296,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardDay: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 24,
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  sharePill: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sharePillText: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#FFFFFF",
  },
  cardStats: {
    gap: 4,
  },
  cardType: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
  },
  cardDistance: {
    fontFamily: AppFonts.mono.bold,
    fontSize: 15,
    lineHeight: 20,
    color: "#FFFFFF",
  },
  cardSub: {
    fontFamily: AppFonts.mono.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.66)",
  },
});

import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";
import { useApp } from "@/lib/app-context";

const C = Colors.dark;

function SpinnerRing() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <Animated.View style={[styles.spinner, style]} />;
}

export default function SyncScreen() {
  const router = useRouter();
  const { activities, stravaConnected, refresh } = useApp();
  const [readyToContinue, setReadyToContinue] = useState(false);

  useEffect(() => {
    refresh();
    // Give the button a moment to appear even if there's nothing to sync yet
    // (e.g. Strava wasn't actually connected) — this screen shouldn't strand anyone.
    const timer = setTimeout(() => setReadyToContinue(true), 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncedActivities = useMemo(() => activities.slice(0, 5), [activities]);
  const hasRealData = stravaConnected && syncedActivities.length > 0;

  const startCreating = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-canvas">
      <View style={styles.page}>
        <SpinnerRing />

        <View style={styles.textBlock}>
          <Text style={styles.title}>PULLING YOUR ACTIVITIES</Text>
          <Text style={styles.count}>
            {hasRealData
              ? `${syncedActivities.length} of ${activities.length} imported`
              : stravaConnected
                ? "Waiting for activities…"
                : "Waiting for Strava…"}
          </Text>
        </View>

        {hasRealData && (
          <View style={styles.list}>
            {syncedActivities.map((activity, i) => (
              <Animated.View
                key={activity.id}
                entering={FadeInDown.delay(i * 90).duration(280)}
                style={styles.row}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {activity.title}
                </Text>
                <Text style={styles.rowCheck}>✓</Text>
              </Animated.View>
            ))}
          </View>
        )}

        {readyToContinue && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.ctaWrap}>
            <Pressable
              onPress={startCreating}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>START CREATING</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    padding: 26,
  },
  spinner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.1)",
    borderTopColor: C.primary,
  },
  textBlock: {
    alignItems: "center",
    gap: 7,
  },
  title: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 19,
    color: "#FFFFFF",
  },
  count: {
    fontFamily: AppFonts.mono.semiBold,
    fontSize: 12,
    color: C.primary,
  },
  list: {
    width: "100%",
    maxWidth: 260,
    gap: 7,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontFamily: AppFonts.mono.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  rowCheck: {
    fontFamily: AppFonts.mono.bold,
    fontSize: 11,
    color: C.success,
  },
  ctaWrap: {
    position: "absolute",
    bottom: 34,
  },
  cta: {
    height: 48,
    paddingHorizontal: 34,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 13,
    color: "#0B0B0C",
  },
});

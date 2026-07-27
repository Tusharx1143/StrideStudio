/**
 * Activity sync screen — pull activities from Strava with per-item progress.
 *
 * Shows a spinning indicator, sync count, and animated row items.
 * Transitions to home when complete.
 */
import { Text, View, TouchableOpacity } from "react-native";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useApp } from "@/lib/app-context";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const MOCK_COUNT = 5;

export default function SyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activities, refresh } = useApp();
  const [syncCount, setSyncCount] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Trigger a Strava activity refresh
    refresh();

    // Simulate incremental sync progress
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setSyncCount(i);
      if (i >= MOCK_COUNT) {
        clearInterval(intervalRef.current);
        setDone(true);
      }
    }, 600);

    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  const handleStart = () => {
    router.replace("/(tabs)");
  };

  const syncRows = activities.slice(0, MOCK_COUNT).map((a) => ({
    title: a.title || "Activity",
    mark: "✓",
  }));

  // Pad with placeholders if fewer activities than mock count
  while (syncRows.length < MOCK_COUNT) {
    syncRows.push({
      title: `Activity ${syncRows.length + 1}`,
      mark: "✓",
    });
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 26,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Spinner */}
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          borderWidth: 3,
          borderColor: "rgba(255,255,255,0.1)",
          borderTopColor: "#FF6B35",
          // Rotation animation is handled by the native driver
          transform: [{ rotate: `${syncCount * 72}deg` }],
        }}
      />

      <View style={{ alignItems: "center", gap: 7, marginTop: 22 }}>
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "800",
            fontSize: 19,
            color: "#fff",
          }}
        >
          {done ? "ALL CAUGHT UP" : "PULLING YOUR ACTIVITIES"}
        </Text>
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontWeight: "600",
            fontSize: 12,
            color: "#FF6B35",
          }}
        >
          {syncCount} of {MOCK_COUNT} imported
        </Text>
      </View>

      {/* Sync rows */}
      <View
        style={{
          width: "100%",
          maxWidth: 260,
          marginTop: 22,
          gap: 7,
        }}
      >
        {syncRows.map((r, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 80)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 9,
              paddingHorizontal: 12,
              borderRadius: 11,
              backgroundColor: "#0E0E10",
              borderWidth: 1,
              borderColor: "#1C1C1E",
              opacity: i < syncCount ? 1 : 0.35,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "600",
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {r.title}
            </Text>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "700",
                fontSize: 11,
                color: "#32D74B",
              }}
            >
              {i < syncCount ? r.mark : ""}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Start button — shown after sync completes */}
      {done && (
        <Animated.View entering={FadeIn.delay(200)}>
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start creating"
            style={{
              position: "absolute",
              bottom: insets.bottom + 34,
              left: "50%",
              transform: [{ translateX: -75 }],
              height: 48,
              paddingHorizontal: 34,
              borderRadius: 24,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 13,
                color: "#0B0B0C",
              }}
            >
              START CREATING
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

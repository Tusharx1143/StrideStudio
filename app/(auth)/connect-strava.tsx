/**
 * Strava Connect screen — OAuth consent and scope list.
 *
 * Pulled from the original connection screen with updated design
 * matching the handoff's "03 Connect Strava" layout.
 */
import { Text, View, TouchableOpacity, Platform, Linking } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { API_BASE } from "@/lib/config";
import { FONT_UI } from "@/lib/_core/theme";

const STRAVA_SCOPES = [
  {
    title: "Read your activities",
    body: "Distance, pace, splits, heart rate, power, route, gear — everything a sticker can use.",
  },
  {
    title: "Photos stay on device",
    body: "Backgrounds you pick never leave your phone until you export.",
  },
  {
    title: "Achievements & records",
    body: "PRs and course records become one-tap badges.",
  },
  {
    title: "Auto-import new sessions",
    body: "New activities appear in your feed within a minute of upload.",
  },
];

export default function ConnectStravaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      if (Platform.OS === "web") {
        window.location.href = `${API_BASE}/api/strava/auth`;
      } else {
        const supported = await Linking.canOpenURL(
          `${API_BASE}/api/strava/auth`,
        );
        if (supported) await Linking.openURL(`${API_BASE}/api/strava/auth`);
      }
    } catch (error) {
      console.error("[Strava] Failed to connect:", error);
    } finally {
      setConnecting(false);
      // Navigate to sync screen after initiating OAuth
      router.push("/(auth)/sync");
    }
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingHorizontal: 22,
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 22,
      }}
    >
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: "#16161A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "600",
            fontSize: 18,
            color: "#fff",
          }}
        >
          ‹
        </Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: "center", gap: 20 }}>
        {/* Brand chain */}
        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(15)}
          style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "#FC4C02",
            }}
          />
          <View
            style={{
              width: 22,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          />
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "#FF6B35",
            }}
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(200).springify().damping(15)}
          style={{
            fontFamily: FONT_UI,
            fontWeight: "900",
            fontSize: 27,
            lineHeight: 28.62,
            letterSpacing: -0.03 * 27,
            color: "#fff",
          }}
        >
          CONNECT{"\n"}YOUR STRAVA
        </Animated.Text>

        {/* Scope list */}
        <Animated.View
          entering={FadeIn.delay(300)}
          style={{ gap: 12 }}
        >
          {STRAVA_SCOPES.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "rgba(255,107,53,0.16)",
                  borderWidth: 1,
                  borderColor: "#FF6B35",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 10,
                    color: "#FF6B35",
                  }}
                >
                  ✓
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 13,
                    lineHeight: 15.6,
                    color: "#fff",
                  }}
                >
                  {s.title}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "500",
                    fontSize: 11.5,
                    lineHeight: 16.1,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {s.body}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Privacy note */}
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 16.5,
            color: "rgba(255,255,255,0.32)",
          }}
        >
          We never post to Strava. Read-only access, revocable any time in
          Settings.
        </Text>
      </View>

      {/* CTA buttons */}
      <View style={{ gap: 9 }}>
        <TouchableOpacity
          onPress={handleConnect}
          disabled={connecting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Connect with Strava"
          style={{
            height: 54,
            borderRadius: 27,
            backgroundColor: "#FC4C02",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FC4C02",
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.28,
            shadowRadius: 34,
            elevation: 16,
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "800",
              fontSize: 14,
              letterSpacing: 0.02 * 14,
              color: "#fff",
            }}
          >
            {connecting ? "Connecting..." : "CONNECT WITH STRAVA"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
          style={{
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "600",
              fontSize: 12.5,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

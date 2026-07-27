/**
 * Splash screen — brand beat + auth-state check.
 *
 * Shows the StrideStudio logo and tagline with a progress bar.
 * Auto-advances to home (if already connected) or auth (if not).
 * Tap to skip the animation.
 */
import { Text, View, TouchableOpacity } from "react-native";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/lib/app-context";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stravaConnected, loading, activities } = useApp();
  const hasNavigated = useRef(false);

  const navigate = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    // If user has activities (Strava connected), go to tabs.
    // Otherwise go through the auth flow.
    if (stravaConnected && activities.length > 0) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/sign-in");
    }
  }, [stravaConnected, activities, router]);

  // Auto-advance after auth check completes (or after 2.5s timeout)
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(navigate, loading ? 2500 : 1800);
    return () => clearTimeout(timer);
  }, [loading, navigate]);

  return (
    <TouchableOpacity
      onPress={navigate}
      activeOpacity={1}
      style={{
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Radial gradient approximation with a large soft shadow */}
      <View
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          width: 420,
          height: 420,
          borderRadius: 210,
          backgroundColor: "#2A150C",
          opacity: 0.55,
          transform: [
            { translateX: -210 },
            { translateY: -210 },
          ],
        }}
      />

      <Animated.View
        entering={FadeInDown.delay(100).springify().damping(15)}
        style={{ alignItems: "center", gap: 26 }}
      >
        {/* App icon */}
        <View
          style={{
            width: 74,
            height: 74,
            borderRadius: 22,
            backgroundColor: "#FF6B35",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.34,
            shadowRadius: 50,
            elevation: 20,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: 5,
              borderColor: "#0B0B0C",
              borderRightColor: "transparent",
              transform: [{ rotate: "-38deg" }],
            }}
          />
        </View>

        {/* Brand name */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 34,
              letterSpacing: -0.035 * 34,
              color: "#fff",
            }}
          >
            STRIDESTUDIO
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 9.5,
              letterSpacing: 0.3 * 9.5,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
            }}
          >
            TRAINING IS ART · THIS IS THE TOOL
          </Text>
        </View>

        {/* Progress bar */}
        <View
          style={{
            width: 132,
            height: 2,
            backgroundColor: "rgba(255,255,255,0.14)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              width: "45%",
              height: "100%",
              backgroundColor: "#FF6B35",
            }}
          />
        </View>
      </Animated.View>

      {/* Tap to continue */}
      <Animated.Text
        entering={FadeIn.delay(600)}
        style={{
          position: "absolute",
          bottom: insets.bottom + 30,
          fontFamily: FONT_UI,
          fontWeight: "700",
          fontSize: 10,
          letterSpacing: 0.24 * 10,
          color: "rgba(255,255,255,0.42)",
        }}
      >
        TAP TO CONTINUE
      </Animated.Text>
    </TouchableOpacity>
  );
}

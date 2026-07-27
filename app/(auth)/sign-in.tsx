/**
 * Sign-in screen — Google / Apple / email authentication.
 *
 * Matches the handoff's "02 Authorization" screen layout with
 * gradient backdrop, brand icon, hero copy, and pill buttons.
 */
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { FONT_UI } from "@/lib/_core/theme";

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoogleSignIn = () => {
    router.push("/(auth)/connect-strava");
  };

  const handleAppleSignIn = () => {
    router.push("/(auth)/connect-strava");
  };

  const handleEmailSignIn = () => {
    router.push("/(auth)/connect-strava");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingHorizontal: 22,
        paddingTop: insets.top + 26,
        paddingBottom: insets.bottom + 22,
      }}
    >
      {/* Gradient backdrop */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60%",
          backgroundColor: "#150D09",
          opacity: 0.7,
        }}
      />

      {/* Content: hero at top, buttons at bottom */}
      <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 26 }}>
        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(15)}
          style={{ gap: 10 }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#FF6B35",
              marginBottom: 10,
            }}
          />
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 32,
              lineHeight: 32.64,
              letterSpacing: -0.035 * 32,
              color: "#fff",
            }}
          >
            MAKE YOUR{"\n"}MILES LOOK{"\n"}UNREASONABLE.
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 13,
              lineHeight: 19.5,
              color: "rgba(255,255,255,0.52)",
              maxWidth: 280,
            }}
          >
            Sign in, connect Strava, and every run turns into story-ready
            art in about nine seconds.
          </Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View
        entering={FadeInDown.delay(300).springify().damping(15)}
        style={{ gap: 9 }}
      >
        {/* Google */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: "#fff",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#0B0B0C",
            }}
          />
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 14,
              color: "#0B0B0C",
            }}
          >
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: "#16161A",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Ionicons name="logo-apple" size={18} color="#fff" />
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 14,
              color: "#fff",
            }}
          >
            Continue with Apple
          </Text>
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity
          onPress={handleEmailSignIn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Sign up with email"
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 14,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Sign up with email
          </Text>
        </TouchableOpacity>

        {/* Sign in prompt */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            paddingTop: 8,
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 11.5,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Already training with us?
          </Text>
          <Text
            onPress={handleEmailSignIn}
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 11.5,
              color: "#FF6B35",
            }}
          >
            Sign in
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

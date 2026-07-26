import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;

/** Warm-to-black gradient backdrop, matching the Splash screen's family but flatter. */
function AuthBackdrop() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="auth-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#150D09" stopOpacity={1} />
          <Stop offset="46%" stopColor={C.canvas} stopOpacity={1} />
          <Stop offset="100%" stopColor={C.canvas} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#auth-bg)" />
    </Svg>
  );
}

export default function AuthScreen() {
  const router = useRouter();

  // All three options funnel into the same next step for now — this screen's
  // job is the sign-in choice UI. Wiring distinct native Google/Apple auth
  // is a backend decision to revisit once every screen in this flow exists.
  const continueOnward = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/connect-strava");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-canvas">
      <AuthBackdrop />
      <View style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.logoMark} />
          <Text style={styles.headline}>
            MAKE YOUR{"\n"}MILES LOOK{"\n"}UNREASONABLE.
          </Text>
          <Text style={styles.subtext}>
            Sign in, connect Strava, and every run turns into story-ready art in about nine
            seconds.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={continueOnward}
            style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}
          >
            <Ionicons name="logo-google" size={17} color="#0B0B0C" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={continueOnward}
            style={({ pressed }) => [styles.button, styles.appleButton, pressed && styles.pressed]}
          >
            <Ionicons name="logo-apple" size={19} color={C.foreground} />
            <Text style={styles.appleText}>Continue with Apple</Text>
          </Pressable>

          <Pressable
            onPress={continueOnward}
            style={({ pressed }) => [styles.button, styles.emailButton, pressed && styles.pressed]}
          >
            <Text style={styles.emailText}>Sign up with email</Text>
          </Pressable>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already training with us?</Text>
            <Pressable onPress={continueOnward} hitSlop={8}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  hero: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 10,
    paddingBottom: 26,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primary,
    marginBottom: 10,
  },
  headline: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 32,
    lineHeight: 33,
    letterSpacing: -1.1,
    color: C.foreground,
  },
  subtext: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 13,
    lineHeight: 19.5,
    color: "rgba(255,255,255,0.52)",
    maxWidth: 280,
  },
  actions: {
    gap: 9,
  },
  button: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
  },
  googleText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 14,
    color: "#0B0B0C",
  },
  appleButton: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  appleText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 14,
    color: C.foreground,
  },
  emailButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  emailText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
  },
  signInPrompt: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.4)",
  },
  signInLink: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 11.5,
    color: C.primary,
  },
});

import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;

const SCOPES = [
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
] as const;

export default function ConnectStravaScreen() {
  const router = useRouter();

  const goBack = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const connect = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/onboarding/sync");
  };

  const skip = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-canvas">
      <View style={styles.page}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.iconRow}>
            <View style={[styles.iconSquare, { backgroundColor: C.strava }]} />
            <View style={styles.connector} />
            <View style={[styles.iconSquare, { backgroundColor: C.primary }]} />
          </View>

          <Text style={styles.headline}>CONNECT{"\n"}YOUR STRAVA</Text>

          <View style={styles.scopeList}>
            {SCOPES.map((scope) => (
              <View key={scope.title} style={styles.scopeRow}>
                <View style={styles.scopeCheck}>
                  <Text style={styles.scopeCheckMark}>✓</Text>
                </View>
                <View style={styles.scopeText}>
                  <Text style={styles.scopeTitle}>{scope.title}</Text>
                  <Text style={styles.scopeBody}>{scope.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.disclaimer}>
            We never post to Strava. Read-only access, revocable any time in Settings.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={connect}
            style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}
          >
            <Text style={styles.connectText}>CONNECT WITH STRAVA</Text>
          </Pressable>
          <Pressable onPress={skip} style={styles.skipButton} hitSlop={8}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 22,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#16161A",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 18,
    color: "#FFFFFF",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconSquare: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  connector: {
    width: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headline: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 27,
    lineHeight: 28.6,
    letterSpacing: -0.8,
    color: "#FFFFFF",
  },
  scopeList: {
    gap: 12,
  },
  scopeRow: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
  },
  scopeCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,107,53,0.16)",
    borderWidth: 1,
    borderColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  scopeCheckMark: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 10,
    color: C.primary,
  },
  scopeText: {
    flex: 1,
    gap: 2,
  },
  scopeTitle: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 13,
    lineHeight: 15.6,
    color: "#FFFFFF",
  },
  scopeBody: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 11.5,
    lineHeight: 16.1,
    color: "rgba(255,255,255,0.45)",
  },
  disclaimer: {
    fontFamily: AppFonts.mono.regular,
    fontSize: 11,
    lineHeight: 16.5,
    color: "rgba(255,255,255,0.32)",
  },
  actions: {
    gap: 9,
  },
  connectButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: C.strava,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.strava,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.88,
  },
  connectText: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 14,
    letterSpacing: 0.4,
    color: "#FFFFFF",
  },
  skipButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.45)",
  },
});

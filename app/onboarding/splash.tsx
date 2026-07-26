import { useEffect } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;

/** Soft orange glow behind the logomark, radiating from just above center. */
function SplashBackdrop() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="38%" r="55%">
          <Stop offset="0%" stopColor="#2A150C" stopOpacity={1} />
          <Stop offset="72%" stopColor={C.canvas} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

/** Brand logomark: an orange rounded square with a carved-out arc, like a stopwatch tick. */
function Logomark() {
  return (
    <View style={styles.logoOuter}>
      <View style={styles.logoArc} />
    </View>
  );
}

/** Looping sweep indicator standing in for "loading" while the app spins up. */
function ProgressSweep() {
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(2.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [x]);

  const trackWidth = 132;
  const sweepWidth = trackWidth * 0.45;

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * trackWidth }],
  }));

  return (
    <View style={[styles.progressTrack, { width: trackWidth }]}>
      <Animated.View style={[styles.progressSweep, { width: sweepWidth }, sweepStyle]} />
    </View>
  );
}

export default function SplashScreen() {
  const router = useRouter();

  const content = useSharedValue(0);
  useEffect(() => {
    content.value = withDelay(120, withTiming(1, { duration: 420, easing: Easing.out(Easing.ease) }));
  }, [content]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: content.value,
    transform: [{ translateY: (1 - content.value) * 14 }],
  }));

  const handleContinue = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/onboarding/auth");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-canvas">
      <SplashBackdrop />
      <View style={styles.center}>
        <Animated.View style={[styles.contentBlock, contentStyle]}>
          <Logomark />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>STRIDESTUDIO</Text>
            <Text style={styles.tagline}>TRAINING IS ART · THIS IS THE TOOL</Text>
          </View>
          <ProgressSweep />
        </Animated.View>
      </View>

      <Pressable onPress={handleContinue} style={styles.cta} hitSlop={12}>
        <Text style={styles.ctaText}>TAP TO CONTINUE</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentBlock: {
    alignItems: "center",
    gap: 26,
  },
  logoOuter: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.34,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 9 },
    elevation: 12,
  },
  logoArc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 5,
    borderColor: "#0B0B0C",
    borderRightColor: "transparent",
    transform: [{ rotate: "-38deg" }],
  },
  titleBlock: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 34,
    lineHeight: 34,
    letterSpacing: -1.2,
    color: C.foreground,
  },
  tagline: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 2.9,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  progressTrack: {
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  progressSweep: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: C.primary,
  },
  cta: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  ctaText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 10,
    letterSpacing: 2.4,
    color: "rgba(255,255,255,0.42)",
  },
});

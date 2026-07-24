import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { AppProvider } from "@/lib/app-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Preload icon fonts on web to prevent the silent font-loading failure
  // in @expo/vector-icons' createIconSet componentDidMount.
  // On web, expo-font's loadSingleFontAsync can silently swallow errors
  // when the TTF asset has a downloadAsync method (Expo Asset object),
  // leaving icons permanently in the empty <Text /> fallback state.
  useEffect(() => {
    const loadIconFonts = async () => {
      try {
        await Promise.all([
          MaterialIcons.loadFont(),
          Ionicons.loadFont(),
        ]);
      } catch (err) {
        console.warn("[StrideStudio] Icon font preload failed:", err);
      }
    };
    loadIconFonts();
  }, []);

  // Create query client once and reuse it
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
            // Keep data in cache for 5 minutes after last observer unmounts
            gcTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
        {/* Default to hiding native headers so raw route segments don't appear. */}
        {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
        {/* Landing page uses fullScreenModal presentation so it doesn't interfere with tab switching on iOS. */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="home" />
          <Stack.Screen name="profile-screen" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="templates-gallery" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="oauth/callback" />
          <Stack.Screen name="settings" options={{ animation: "slide_from_right", title: "Settings" }} />
        </Stack>
        <StatusBar style="light" />
        </AppProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

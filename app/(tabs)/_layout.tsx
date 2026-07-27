/**
 * Bottom tab navigator — StrideStudio's 5-tab layout.
 *
 * Tabs: Home (feed), Stickers (library), Create (capture shortcut),
 * Saved (drafts), Profile (settings).
 *
 * The Create tab opens the capture screen as a modal rather than
 * switching to a dedicated tab view.
 */
import { Tabs, useRouter, usePathname } from "expo-router";
import { Platform, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO, Controls } from "@/lib/_core/theme";

export default function TabLayout() {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();

  const tabBarStyle = {
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Controls.tabBarHeight + 10,
    paddingBottom: 10,
    paddingTop: 6,
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "rgba(255,255,255,0.42)",
        tabBarLabelStyle: {
          fontFamily: FONT_UI,
          fontWeight: "700",
          fontSize: 9,
          letterSpacing: 0.08 * 9,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: "Stickers",
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture-tab"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginTop: -14,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.42,
                shadowRadius: 22,
                elevation: 8,
              }}
            >
              <Ionicons name="camera" size={22} color="#0B0B0C" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push("/capture");
          },
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

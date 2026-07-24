/**
 * Settings Screen — app preferences, account, and about.
 *
 * Design spec: design.md §7 (lines 109-122)
 * - Theme toggle (light/dark)
 * - Notification preferences
 * - Connected services management
 * - Privacy and data sharing
 * - About and support
 * - Logout
 */
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { stravaApi } from "@/lib/strava-api";
import { StrideButton } from "@/components/stride-button";
import { useThemeContext } from "@/lib/theme-provider";

interface SettingRowProps {
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}

function SettingRow({ label, subtitle, right, onPress, last, danger }: SettingRowProps) {
  const colors = useColors();
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 48,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? colors.error : colors.foreground, fontSize: 14, fontWeight: "500" }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { stravaConnected, refresh } = useApp();

  const [notifications, setNotifications] = useState(true);
  const [autoShare, setAutoShare] = useState(false);
  const isDark = colorScheme === "dark";

  const handleLogout = useCallback(() => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to log out?")) {
        // Web: clear cookies and redirect
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/";
      }
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              const Auth = await import("@/lib/_core/auth");
              await Auth.removeSessionToken();
              await Auth.clearUserInfo();
            } catch {
              // Client-side logout is best-effort
            }
            router.replace("/");
          },
        },
      ]);
    }
  }, [router]);

  const handleDisconnectStrava = useCallback(async () => {
    try {
      await stravaApi.disconnect();
      refresh();
    } catch (e) {
      console.error("[Settings] Strava disconnect failed:", e);
    }
  }, [refresh]);

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 24 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", flex: 1 }}>
            Settings
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Appearance */}
          <SettingGroup title="Appearance">
            <SettingRow
              label="Dark Mode"
              subtitle={isDark ? "OLED-friendly dark theme" : "Light theme"}
              right={
                <Switch
                  value={isDark}
                  onValueChange={(v) => setColorScheme(v ? "dark" : "light")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityRole="switch"
                  accessibilityLabel="Dark mode toggle"
                  accessibilityState={{ checked: isDark }}
                />
              }
              last
            />
          </SettingGroup>

          {/* Notifications */}
          <SettingGroup title="Notifications">
            <SettingRow
              label="Push Notifications"
              subtitle="Alerts for new achievements and weekly summaries"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              }
            />
            <SettingRow
              label="Auto-Share"
              subtitle="Automatically save posts to camera roll"
              right={
                <Switch
                  value={autoShare}
                  onValueChange={setAutoShare}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              }
              last
            />
          </SettingGroup>

          {/* Connected Services */}
          <SettingGroup title="Connected Services">
            <SettingRow
              label="Strava"
              subtitle={stravaConnected ? "Connected" : "Not connected"}
              onPress={stravaConnected ? handleDisconnectStrava : undefined}
              last
            />
          </SettingGroup>

          {/* Privacy & Data */}
          <SettingGroup title="Privacy & Data">
            <SettingRow
              label="Privacy Policy"
              onPress={() => {
                // Placeholder — would open a webview or in-app doc
                Alert.alert("Privacy Policy", "StrideStudio privacy policy will be available soon.");
              }}
            />
            <SettingRow
              label="Clear Cached Data"
              subtitle="Remove locally stored activity cache"
              onPress={() => {
                Alert.alert("Clear Cache", "Cached activity data will be removed. Fresh data will load on next refresh.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const AsyncStorage = await import("@react-native-async-storage/async-storage");
                        await AsyncStorage.default.removeItem("stride-cached-activities");
                        await AsyncStorage.default.removeItem("stride-cached-athlete");
                        Alert.alert("Done", "Cache cleared. Pull to refresh.");
                      } catch {
                        Alert.alert("Error", "Could not clear cache.");
                      }
                    },
                  },
                ]);
              }}
              last
            />
          </SettingGroup>

          {/* About */}
          <SettingGroup title="About">
            <SettingRow label="Version" subtitle="1.0.0 (beta)" />
            <SettingRow
              label="Support"
              onPress={() => {
                Alert.alert("Support", "For help, email support@stridestudio.app");
              }}
            />
            <SettingRow
              label="StrideStudio"
              subtitle="Training is an art. Artists need tools."
              last
            />
          </SettingGroup>

          {/* Account */}
          <SettingGroup title="Account">
            <SettingRow
              label="Log Out"
              danger
              onPress={handleLogout}
              last
            />
          </SettingGroup>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

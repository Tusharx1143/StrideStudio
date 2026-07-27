/**
 * Settings Screen — app preferences, account, and about.
 *
 * Restyled to match the design handoff tokens.
 * Sections: Appearance, Notifications, Connected Services, Privacy, About, Account.
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
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import { useApp } from "@/lib/app-context";
import { API_BASE } from "@/lib/config";
import { StrideButton } from "@/components/stride-button";
import { BackButton } from "@/components/back-button";
import { useThemeContext } from "@/lib/theme-provider";

// ── Row ────────────────────────────────────────────────────────

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
        paddingHorizontal: 14,
        paddingVertical: 14,
        minHeight: 48,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "500",
            fontSize: 13,
            color: danger ? colors.error : colors.foreground,
          }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: FONT_MONO,
              fontWeight: "500",
              fontSize: 10.5,
              color: "#8E8E93",
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
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

// ── Group ──────────────────────────────────────────────────────

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "700",
          fontSize: 9,
          letterSpacing: 0.18 * 9,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          marginBottom: 9,
          paddingHorizontal: 2,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: "#0E0E10",
          borderRadius: 14,
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

// ── Main Screen ─────────────────────────────────────────────────

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
      const resp = await fetch(`${API_BASE}/api/strava/disconnect`, { method: "POST" });
      if (resp.ok) refresh();
    } catch (e) {
      console.error("[Settings] Strava disconnect failed:", e);
    }
  }, [refresh]);

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ── Header ────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 10,
          }}
        >
          <BackButton />
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "800",
              fontSize: 15,
              color: colors.foreground,
            }}
          >
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
                Alert.alert("Privacy Policy", "StrideStudio privacy policy will be available soon.");
              }}
            />
            <SettingRow
              label="Clear Cached Data"
              subtitle="Remove locally stored activity cache"
              onPress={() => {
                Alert.alert(
                  "Clear Cache",
                  "Cached activity data will be removed. Fresh data will load on next refresh.",
                  [
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
                  ],
                );
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
            <SettingRow label="Log Out" danger onPress={handleLogout} last />
          </SettingGroup>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

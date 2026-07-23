import { ScrollView, Text, View, TouchableOpacity, Switch, Platform, Linking } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { StrideButton } from "@/components/stride-button";
import { ActivityIndicator } from "react-native";

const API_BASE = "http://localhost:3000";

export default function ProfileScreen() {
  const colors = useColors();
  const { activities, savedPostsCount, stravaConnected, athlete, loading, refresh } = useApp();
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const [notifications, setNotifications] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Check if we just returned from Strava OAuth (via URL params on web)
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("strava") === "connected") {
        refresh();
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [refresh]);

  const connectStrava = async () => {
    setConnecting(true);
    try {
      if (Platform.OS === "web") {
        window.location.href = `${API_BASE}/api/strava/auth`;
      } else {
        const supported = await Linking.canOpenURL(`${API_BASE}/api/strava/auth`);
        if (supported) {
          await Linking.openURL(`${API_BASE}/api/strava/auth`);
        }
      }
    } catch (error) {
      console.error("[Strava] Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectStrava = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/strava/disconnect`, { method: "POST" });
      if (resp.ok) {
        refresh();
      }
    } catch (error) {
      console.error("[Strava] Disconnect failed:", error);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            {athlete?.profile ? (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 12,
                  overflow: "hidden",
                  backgroundColor: colors.surface,
                }}
              >
                <img
                  src={athlete.profile}
                  alt=""
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
              </View>
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 36 }}>🏃</Text>
              </View>
            )}
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "bold" }}>
              {athlete
                ? `${athlete.firstname} ${athlete.lastname}`
                : stravaConnected
                  ? "Athlete"
                  : "StrideStudio"}
            </Text>
            {athlete?.city && (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
                {athlete.city}{athlete.country ? `, ${athlete.country}` : ""}
              </Text>
            )}
            {!athlete && (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
                {stravaConnected ? "Training is an art" : "Connect Strava to get started"}
              </Text>
            )}
          </View>

          {/* Stats Summary */}
          {activities.length > 0 && (
            <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                accessibilityRole="summary"
                accessibilityLabel={`${activities.length} activities`}
              >
                <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>{activities.length}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Activities</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                accessibilityRole="summary"
                accessibilityLabel={`${totalDistance.toFixed(0)} kilometers total`}
              >
                <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>
                  {totalDistance.toFixed(0)} km
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Total Distance</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                accessibilityRole="summary"
                accessibilityLabel={`${savedPostsCount} posts created`}
              >
                <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>{savedPostsCount}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Posts Created</Text>
              </View>
            </View>
          )}

          {/* Strava Connection */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Data Source
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>🏃</Text>
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>Strava</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {loading
                        ? "Checking..."
                        : stravaConnected
                          ? athlete
                            ? `Connected as ${athlete.firstname}`
                            : "Connected"
                          : "Not connected"}
                    </Text>
                  </View>
                </View>
                {stravaConnected ? (
                  <TouchableOpacity
                    onPress={disconnectStrava}
                    accessibilityRole="button"
                    accessibilityLabel="Disconnect Strava"
                    style={{
                      backgroundColor: colors.error + "20",
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>Disconnect</Text>
                  </TouchableOpacity>
                ) : (
                  <StrideButton
                    onPress={connectStrava}
                    loading={connecting}
                    style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, minHeight: 36 }}
                    textStyle={{ fontSize: 12 }}
                  >
                    Connect
                  </StrideButton>
                )}
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Settings
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityRole="switch"
                  accessibilityLabel="Notifications"
                  accessibilityState={{ checked: notifications }}
                />
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  minHeight: 48,
                }}
                accessibilityRole="button"
                accessibilityLabel="Privacy Policy"
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Privacy Policy</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  minHeight: 48,
                }}
                accessibilityRole="button"
                accessibilityLabel="Support"
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Support</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Refresh Data */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <StrideButton
              variant="secondary"
              onPress={refresh}
              loading={loading}
            >
              Refresh from Strava
            </StrideButton>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

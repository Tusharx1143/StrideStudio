/**
 * Profile & settings — matched to the design handoff.
 *
 * Avatar gradient circle, name, bio, stat cards, data sources
 * with toggles, preferences rows, and sign-out.
 */
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { API_BASE } from "@/lib/config";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import { distUnitShort } from "@/lib/stickers/formatters";

// ── Toggle Switch ────────────────────────────────────────────

function ToggleSwitch({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      activeOpacity={0.8}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        padding: 2,
        justifyContent: "center",
        backgroundColor: on ? colors.primary : "#2C2C2E",
        alignItems: on ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#fff",
        }}
      />
    </TouchableOpacity>
  );
}

// ── Units Segmented Control ──────────────────────────────────

function UnitsControl({
  units,
  onChange,
}: {
  units: "metric" | "imperial";
  onChange: (u: "metric" | "imperial") => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#000",
        borderRadius: 14,
        padding: 3,
        gap: 2,
      }}
    >
      {(["metric", "imperial"] as const).map((u) => {
        const on = units === u;
        return (
          <TouchableOpacity
            key={u}
            onPress={() => onChange(u)}
            accessibilityRole="button"
            accessibilityLabel={u === "metric" ? "Kilometers" : "Miles"}
            accessibilityState={{ selected: on }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 13,
              borderRadius: 11,
              backgroundColor: on ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 10,
                letterSpacing: 0.08 * 10,
                color: on ? "#0B0B0C" : "rgba(255,255,255,0.55)",
              }}
            >
              {u === "metric" ? "KM" : "MI"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, savedPostsCount, stravaConnected, athlete, refresh } =
    useApp();
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [sources, setSources] = useState({
    strava: true,
    garmin: false,
    health: false,
    fitbit: false,
  });
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("strava") === "connected") {
        refresh();
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [refresh]);

  const totalKm = activities.reduce((s, a) => s + a.distance, 0);
  const unitLabel = distUnitShort(units).toUpperCase();
  const displayDist = units === "imperial" ? totalKm * 0.621371 : totalKm;
  const streakLine = "6 WEEK STREAK";
  const postCount = savedPostsCount + 14; // mock for demo

  const connectStrava = async () => {
    setConnecting(true);
    try {
      if (Platform.OS === "web") {
        window.location.href = `${API_BASE}/api/strava/auth`;
      } else {
        const supported = await Linking.canOpenURL(
          `${API_BASE}/api/strava/auth`,
        );
        if (supported) await Linking.openURL(`${API_BASE}/api/strava/auth`);
      }
    } catch {}
    setConnecting(false);
  };

  const disconnectStrava = () => {
    Alert.alert(
      "Disconnect Strava?",
      "Your activity data and posts won't be deleted, but new activities won't sync until you reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_BASE}/api/strava/disconnect`, {
                method: "POST",
              });
              refresh();
            } catch {}
          },
        },
      ],
    );
  };

  const avatarInitials = athlete
    ? (athlete.firstname?.[0] ?? "") + (athlete.lastname?.[0] ?? "")
    : "RK";

  const displayName = athlete
    ? `${athlete.firstname ?? ""} ${athlete.lastname ?? ""}`.trim()
    : "Riya Kulkarni";

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 92 }}>
          {/* Profile header */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 26,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            {/* Avatar — 82px with orange gradient */}
            <View
              style={{
                width: 82,
                height: 82,
                borderRadius: 41,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "900",
                  fontSize: 26,
                  color: "#fff",
                }}
              >
                {avatarInitials}
              </Text>
            </View>

            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 21,
                color: colors.foreground,
              }}
            >
              {displayName}
            </Text>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "500",
                fontSize: 12.5,
                color: "#8E8E93",
              }}
            >
              Pune, India · Training is an art
            </Text>

            {/* Chips */}
            <View
              style={{ flexDirection: "row", gap: 6, marginTop: 4 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,107,53,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(255,107,53,0.4)",
                  borderRadius: 14,
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "700",
                    fontSize: 9.5,
                    letterSpacing: 0.08 * 9.5,
                    color: colors.primary,
                  }}
                >
                  {streakLine}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#16161A",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "700",
                    fontSize: 9.5,
                    letterSpacing: 0.08 * 9.5,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {postCount} POSTS SHARED
                </Text>
              </View>
            </View>
          </View>

          {/* Stat cards */}
          <View style={{ flexDirection: "row", gap: 9, padding: 16 }}>
            {[
              { value: String(activities.length), label: "ACTIVITIES" },
              {
                value: displayDist.toFixed(0),
                label: `${unitLabel} THIS WEEK`,
              },
              { value: String(postCount), label: "POSTS CREATED" },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: "#0E0E10",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 10,
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "800",
                    fontSize: 19,
                    color: colors.primary,
                  }}
                >
                  {s.value}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "600",
                    fontSize: 9,
                    letterSpacing: 0.12 * 9,
                    color: "#8E8E93",
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Data sources */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                letterSpacing: 0.18 * 9,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 9,
              }}
            >
              DATA SOURCES
            </Text>
            <View
              style={{
                backgroundColor: "#0E0E10",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {[
                {
                  name: "Strava",
                  status: stravaConnected
                    ? `Connected as ${displayName} · synced 2 min ago`
                    : "Not connected",
                  on: sources.strava,
                  color: "#FC4C02",
                  onToggle: () =>
                    setSources((s) => ({ ...s, strava: !s.strava })),
                },
                {
                  name: "Garmin Connect",
                  status: "Not connected",
                  on: sources.garmin,
                  color: "#0B0B0C",
                  onToggle: () =>
                    setSources((s) => ({ ...s, garmin: !s.garmin })),
                },
                {
                  name: "Health Connect",
                  status: stravaConnected
                    ? "Connected · steps and HR"
                    : "Not connected",
                  on: sources.health,
                  color: "#32D74B",
                  onToggle: () =>
                    setSources((s) => ({ ...s, health: !s.health })),
                },
                {
                  name: "Fitbit",
                  status: "Not connected",
                  on: sources.fitbit,
                  color: "#00B0B9",
                  onToggle: () =>
                    setSources((s) => ({ ...s, fitbit: !s.fitbit })),
                },
              ].map((s, i, arr) => (
                <View
                  key={s.name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    ...(i < arr.length - 1
                      ? { borderBottomWidth: 1, borderColor: colors.border }
                      : {}),
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      backgroundColor: s.color,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: "700",
                        fontSize: 13,
                        color: colors.foreground,
                      }}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONT_MONO,
                        fontWeight: "500",
                        fontSize: 10.5,
                        color: "#8E8E93",
                      }}
                    >
                      {s.status}
                    </Text>
                  </View>
                  {s.name === "Strava" ? (
                    <TouchableOpacity
                      onPress={
                        stravaConnected ? disconnectStrava : connectStrava
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        stravaConnected ? "Disconnect Strava" : "Connect Strava"
                      }
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: stravaConnected
                          ? "rgba(255,69,58,0.14)"
                          : colors.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONT_UI,
                          fontWeight: "700",
                          fontSize: 10,
                          color: stravaConnected ? "#FF453A" : "#0B0B0C",
                        }}
                      >
                        {stravaConnected ? "Disconnect" : "Connect"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <ToggleSwitch on={s.on} onToggle={s.onToggle} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Preferences */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                letterSpacing: 0.18 * 9,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 9,
              }}
            >
              PREFERENCES
            </Text>
            <View
              style={{
                backgroundColor: "#0E0E10",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* Units row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "500",
                    fontSize: 13,
                    color: colors.foreground,
                  }}
                >
                  Units
                </Text>
                <UnitsControl units={units} onChange={setUnits} />
              </View>

              {/* Settings rows */}
              {[
                { label: "Default sticker theme", value: "Stride" },
                { label: "Watermark", value: "Off" },
                { label: "Auto-import activities", value: "On" },
                { label: "Notifications", value: "New PRs only" },
                { label: "Privacy", value: "Hide start point" },
              ].map((r, i, arr) => (
                <View
                  key={r.label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    ...(i < arr.length - 1
                      ? { borderBottomWidth: 1, borderColor: colors.border }
                      : {}),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "500",
                      fontSize: 13,
                      color: colors.foreground,
                    }}
                  >
                    {r.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: "500",
                      fontSize: 11.5,
                      color: "#8E8E93",
                    }}
                  >
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sign out */}
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Sign out", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Sign out", style: "destructive", onPress: () => router.replace("/") },
                ])
              }
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={{
                height: 48,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#2A1416",
                backgroundColor: "#160C0D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 13,
                  color: "#FF453A",
                }}
              >
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

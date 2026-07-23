import { ScrollView, Text, View, TouchableOpacity, Platform, Modal, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { TEMPLATE_DEFS, computeWeekTotals, TemplateDef } from "@/lib/templates";

export default function EditorScreen() {
  const router = useRouter();
  const { activities, loading, stravaConnected, selectedActivityId, selectActivity, getSelectedActivity, incrementSavedPosts } = useApp();
  const [tab, setTab] = useState<"activity" | "totals">("activity");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activity = getSelectedActivity();
  const totals = computeWeekTotals(activities);
  const templates = TEMPLATE_DEFS.filter((t) => t.tab === tab);

  const onCopy = (t: TemplateDef) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementSavedPosts();
    setToast(`Copied "${t.name}" to clipboard`);
    setTimeout(() => setToast(null), 1800);
  };

  const onSave = (t: TemplateDef) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    incrementSavedPosts();
    setToast(`Saved "${t.name}" to camera roll`);
    setTimeout(() => setToast(null), 1800);
  };

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 16 }}>Loading…</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty state ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {stravaConnected ? "No activities yet" : "No data to share"}
          </Text>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "Connect with Strava and sync your activities to start creating beautiful cards."
              : "Link your Strava account first, then come here to create shareable workout graphics."}
          </Text>
          {!stravaConnected && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              style={{
                marginTop: 20,
                backgroundColor: "#FF6B35",
                borderRadius: 24,
                paddingHorizontal: 28,
                paddingVertical: 14,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Connect Strava</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0" containerClassName="bg-black">
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#1C1C1E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 18 }}>‹</Text>
          </TouchableOpacity>

          {activity && (
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={{
                backgroundColor: "#1C1C1E",
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
                {activity.distance.toFixed(1)} km {activity.type}
              </Text>
              <Text style={{ color: "#8E8E93", fontSize: 11, marginLeft: 4 }}>⌄</Text>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                marginRight: 8,
                backgroundColor: "#FF3B30",
                borderWidth: 2,
                borderColor: "#34C759",
              }}
            />
            <Text style={{ color: "#000000", fontSize: 15, fontWeight: "600" }}>Aa</Text>
          </View>
        </View>

        {/* Copy / Save hints */}
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>⧉ TAP TO COPY</Text>
          <Text style={{ color: "#8E8E93", fontSize: 13, fontWeight: "600", marginTop: 4 }}>
            ⬇ PRESS + HOLD TO SAVE
          </Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          {(["activity", "totals"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingBottom: 10,
                borderBottomWidth: 2,
                borderBottomColor: tab === t ? "#FFFFFF" : "#2C2C2E",
              }}
            >
              <Text
                style={{
                  color: tab === t ? "#FFFFFF" : "#8E8E93",
                  fontSize: 15,
                  fontWeight: tab === t ? "700" : "500",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Template grid */}
        <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {templates.map((t) => (
              <View key={t.id} style={{ width: t.fullWidth ? "100%" : "50%", padding: 5 }}>
                <TouchableOpacity
                  onPress={() => onCopy(t)}
                  onLongPress={() => onSave(t)}
                  delayLongPress={400}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: t.lightCard ? "#FFFFFF" : "#0E0E10",
                    borderRadius: 14,
                    minHeight: t.fullWidth ? 120 : 130,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "#1C1C1E",
                    padding: 8,
                  }}
                >
                  {activity && t.render(activity, totals)}
                  {t.badge && (
                    <View
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        backgroundColor: "#0A84FF",
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>{t.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Toast */}
        {toast && (
          <View
            style={{
              position: "absolute",
              bottom: 30,
              alignSelf: "center",
              backgroundColor: "#1C1C1E",
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>{toast}</Text>
          </View>
        )}

        {/* Activity picker modal */}
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }}
            onPress={() => setPickerOpen(false)}
          >
            <View style={{ backgroundColor: "#1C1C1E", borderRadius: 16, overflow: "hidden" }}>
              {activities.map((a, i) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => {
                    selectActivity(a.id);
                    setPickerOpen(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: i < activities.length - 1 ? 1 : 0,
                    borderBottomColor: "#2C2C2E",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: a.id === selectedActivityId ? "#0A84FF" : "#FFFFFF",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {a.distance.toFixed(1)} km {a.type}
                  </Text>
                  <Text style={{ color: "#8E8E93", fontSize: 13 }}>{a.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

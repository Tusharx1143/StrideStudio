import { ScrollView, Text, View, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { BRIGHT_WHITE } from "@/lib/color-presets";

export default function TemplatesScreen() {
  const router = useRouter();
  const { activities, loading, stravaConnected, getSelectedActivity } = useApp();
  const [filter, setFilter] = useState<"all" | "activity" | "totals">("all");
  const [toast, setToast] = useState<string | null>(null);
  const capturingId = useRef<string | null>(null);

  const activity = getSelectedActivity();
  const totals = computeWeekTotals(activities);
  const templates = ALL_TEMPLATES.filter((t) => filter === "all" || t.tab === filter);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const useTemplate = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/editor");
  };

  const copyAsPNG = useCallback(async (templateId: string) => {
    if (capturingId.current) return;
    capturingId.current = templateId;
    // Wait a tick for the ref to be available, then capture
    await new Promise((r) => setTimeout(r, 100));
    try {
      const ref = (globalThis as any).__templateRefs?.get(templateId);
      if (!ref) { showToast("Template not ready"); return; }
      const uri = await captureRef(ref, { format: "png", quality: 1 });
      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `template-${templateId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Downloaded template PNG");
      } else {
        const { Share } = require("react-native");
        await Share.share({ url: uri });
        showToast("Shared template");
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      showToast("Failed to capture");
    } finally {
      capturingId.current = null;
    }
  }, [showToast]);

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 16 }}>Loading templates…</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty state ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0" containerClassName="bg-black">
        <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🖼️</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            Templates
          </Text>
          <Text style={{ color: "#8E8E93", fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "No activities to preview. Sync your Strava to see how templates look with your data."
              : "Connect Strava to see live template previews with your activities."}
          </Text>
          {!stravaConnected && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}
              style={{ marginTop: 20, backgroundColor: "#FF6B35", borderRadius: 24, paddingHorizontal: 28, paddingVertical: 14 }}>
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
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800" }}>Templates</Text>
          <Text style={{ color: "#8E8E93", fontSize: 13, marginTop: 2, marginBottom: 12 }}>
            {ALL_TEMPLATES.length} adaptive designs · tap to edit · long-press to download PNG
          </Text>
        </View>

        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 10, gap: 8 }}>
          {(["all", "activity", "totals"] as const).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={{ backgroundColor: filter === f ? "#FFFFFF" : "#1C1C1E", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ color: filter === f ? "#000000" : "#FFFFFF", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {templates.map((t) => (
              <View key={t.id} style={{ width: t.fullWidth ? "100%" : "50%", padding: 5 }}>
                <TouchableOpacity
                  onPress={useTemplate}
                  onLongPress={() => copyAsPNG(t.id)}
                  delayLongPress={500}
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
                  ref={(el) => {
                    if (el) {
                      if (!(globalThis as any).__templateRefs) (globalThis as any).__templateRefs = new Map();
                      (globalThis as any).__templateRefs.set(t.id, el);
                    }
                  }}
                >
                  {activity && t.render(activity, totals, BRIGHT_WHITE.colors)}
                </TouchableOpacity>
                <Text style={{ color: "#8E8E93", fontSize: 10, textAlign: "center", marginTop: 4 }}>{t.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Toast */}
        {toast && (
          <View style={{ position: "absolute", bottom: 30, alignSelf: "center", backgroundColor: "#1C1C1E", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>{toast}</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

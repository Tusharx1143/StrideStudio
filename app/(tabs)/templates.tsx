import { ScrollView, Text, View, TouchableOpacity, Platform, TextInput } from "react-native";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { BRIGHT_WHITE } from "@/lib/color-presets";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { TemplateCardSkeleton } from "@/components/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function TemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities, loading, stravaConnected, getSelectedActivity } = useApp();
  const [filter, setFilter] = useState<"all" | "activity" | "totals">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "name-asc" | "name-desc">("default");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const capturingId = useRef<string | null>(null);

  // Debounce search input to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const activity = getSelectedActivity();
  const totals = computeWeekTotals(activities);
  const templates = useMemo(() => {
    let filtered = ALL_TEMPLATES.filter((t) => filter === "all" || t.tab === filter);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    if (sortBy === "name-asc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    }
    return filtered;
  }, [filter, debouncedSearch, sortBy]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  const useTemplate = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/editor");
  };

  const copyAsPNG = useCallback(async (templateId: string) => {
    if (capturingId.current) return;
    capturingId.current = templateId;
    await new Promise((r) => setTimeout(r, 100));
    try {
      const ref = (globalThis as any).__templateRefs?.get(templateId);
      if (!ref) { showToast("Template not ready", "error"); return; }
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
        showToast("Downloaded template PNG", "success");
      } else {
        const { Share } = require("react-native");
        await Share.share({ url: uri });
        showToast("Shared template", "success");
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showToast("Failed to capture", "error");
    } finally {
      capturingId.current = null;
    }
  }, [showToast]);

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>Templates</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={`skel-${i}`} style={{ width: "50%", padding: 5 }}>
                <TemplateCardSkeleton />
              </View>
            ))}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ── Empty state ──
  if (activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🖼️</Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            Templates
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            {stravaConnected
              ? "No activities to preview. Sync your Strava to see how templates look with your data."
              : "Connect Strava to see live template previews with your activities."}
          </Text>
          {!stravaConnected && (
            <View style={{ marginTop: 20 }}>
              <StrideButton onPress={() => router.push("/(tabs)/profile")}>
                Connect Strava
              </StrideButton>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: "800" }}>Templates</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: 12 }}>
            {ALL_TEMPLATES.length} adaptive designs · tap to edit · long-press to download PNG
          </Text>
        </View>

        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 10, gap: 8 }}>
          {(["all", "activity", "totals"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${f} templates`}
              accessibilityState={{ selected: filter === f }}
              style={{
                backgroundColor: filter === f ? colors.foreground : colors.surface,
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 8,
                minHeight: 40,
                justifyContent: "center",
              }}
            >
              <Text style={{
                color: filter === f ? colors.background : colors.foreground,
                fontSize: 13,
                fontWeight: "600",
                textTransform: "capitalize",
              }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search + sort bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ color: colors.muted, fontSize: 14, marginRight: 8 }}>🔍</Text>
            <TextInput
              placeholder="Search templates..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                color: colors.foreground,
                fontSize: 14,
                paddingVertical: 10,
                minHeight: 44,
              }}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              onPress={() => setSortBy((s) => s === "name-asc" ? "name-desc" : s === "name-desc" ? "default" : "name-asc")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: sortBy !== "default" ? colors.foreground + "15" : "transparent",
              }}
            >
              <Text style={{ fontSize: 12 }}>
                {sortBy === "name-asc" ? "↓" : sortBy === "name-desc" ? "↑" : "↕"}
              </Text>
              <Text style={{
                color: sortBy !== "default" ? colors.foreground : colors.muted,
                fontSize: 11,
                fontWeight: "600",
              }}>
                {sortBy === "name-asc" ? "A–Z" : sortBy === "name-desc" ? "Z–A" : "Sort"}
              </Text>
            </TouchableOpacity>
          </View>
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
                  accessibilityRole="button"
                  accessibilityLabel={`${t.name} template`}
                  accessibilityHint="Long press to download as PNG"
                  style={{
                    backgroundColor: t.lightCard ? colors.foreground : colors.surface,
                    borderRadius: 14,
                    minHeight: t.fullWidth ? 120 : 130,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 8,
                  }}
                  ref={(el) => {
                    if (el) {
                      if (!(globalThis as any).__templateRefs) (globalThis as any).__templateRefs = new Map();
                      (globalThis as any).__templateRefs.set(t.id, el);
                    }
                  }}
                >
                  {activity && (
                    <ErrorBoundary>
                      {t.render(activity, totals, t.lightCard ? BRIGHT_WHITE.colors : undefined)}
                    </ErrorBoundary>
                  )}
                </TouchableOpacity>
                <Text style={{ color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 4 }}>{t.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <AnimatedToast
          message={toast?.message ?? null}
          type={toast?.type ?? "info"}
          onDismiss={() => setToast(null)}
        />
      </View>
    </ScreenContainer>
  );
}

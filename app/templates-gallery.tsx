/**
 * Template gallery — design-handoff style grid.
 *
 * Browse all dynamic templates with search, category filter, and sort.
 * Live previews render with the user's selected activity data.
 * Long-press to download as PNG (view-shot).
 *
 * Token alignment:
 *   bg.base: #0A0A0B, bg.card: #0E0E10, bg.surface: #16161A
 *   border.hairline: #1C1C1E, brand.orange: #FF6B35
 *   text.primary: #FFFFFF, text.secondary: rgba(255,255,255,.55)
 *   text.muted: #8E8E93
 */
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { ALL_TEMPLATES, computeWeekTotals } from "@/lib/templates";
import { BRIGHT_WHITE } from "@/lib/color-presets";
import { useColors } from "@/hooks/use-colors";
import { StrideButton } from "@/components/stride-button";
import { AnimatedToast } from "@/components/animated-toast";
import { TemplateCardSkeleton } from "@/components/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FONT_UI, FONT_MONO, Radii, Spacing } from "@/lib/_core/theme";

/** Module-level cache for template view refs (captureRef targets). */
type CaptureTarget = Parameters<typeof captureRef>[0];
const templateRefs = new Map<string, CaptureTarget>();

const FILTERS = [
  { id: "all", label: "All" },
  { id: "activity", label: "Activity" },
  { id: "totals", label: "Totals" },
] as const;

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
  const { width: screenWidth } = useWindowDimensions();

  // Debounce search
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

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
    },
    [],
  );

  const useTemplate = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/editor");
  };

  const copyAsPNG = useCallback(
    async (templateId: string) => {
      if (capturingId.current) return;
      capturingId.current = templateId;
      await new Promise((r) => setTimeout(r, 100));
      try {
        const ref = templateRefs.get(templateId);
        if (!ref) {
          showToast("Template not ready", "error");
          return;
        }
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
        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        showToast("Failed to capture", "error");
      } finally {
        capturingId.current = null;
      }
    },
    [showToast],
  );

  // Grid math — 2 columns with 10px gap, 16px screen padding
  const GAP = 10;
  const H_PAD = Spacing.lg; // 16
  const cardWidth = (screenWidth - H_PAD * 2 - GAP) / 2;

  // ── Loading state ──
  if (loading && activities.length === 0) {
    return (
      <ScreenContainer className="p-0">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{ paddingHorizontal: H_PAD, paddingTop: 10, paddingBottom: 6 }}>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "900",
                fontSize: 27,
                letterSpacing: -0.03 * 27,
                lineHeight: 28.6,
                color: colors.foreground,
              }}
              accessibilityRole="header"
            >
              Templates
            </Text>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "500",
                fontSize: 11.5,
                lineHeight: 15,
                color: "#8E8E93",
                marginTop: 4,
              }}
            >
              {ALL_TEMPLATES.length} adaptive designs · tap to edit · long-press to download
            </Text>
          </View>

          {/* Skeleton grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: H_PAD,
              gap: GAP,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={`skel-${i}`} style={{ width: cardWidth }}>
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
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#16161A",
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="grid-outline" size={28} color="rgba(255,255,255,0.25)" />
          </View>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "800",
              fontSize: 19,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Templates
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 13,
              lineHeight: 19.5,
              color: "rgba(255,255,255,0.55)",
              marginTop: 8,
              textAlign: "center",
              maxWidth: 280,
            }}
          >
            {stravaConnected
              ? "No activities to preview. Sync your Strava to see how templates look with your data."
              : "Connect Strava to see live template previews with your activities."}
          </Text>
          {!stravaConnected && (
            <View style={{ marginTop: 22 }}>
              <StrideButton onPress={() => router.push("/profile-screen")}>
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
        {/* ── Header ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, paddingTop: 10, paddingBottom: 6 }}>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 27,
              letterSpacing: -0.03 * 27,
              lineHeight: 28.6,
              color: colors.foreground,
            }}
            accessibilityRole="header"
          >
            Templates
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "500",
              fontSize: 11.5,
              lineHeight: 15,
              color: "#8E8E93",
              marginTop: 4,
            }}
          >
            {ALL_TEMPLATES.length} adaptive designs · tap to edit · long-press to download
          </Text>
        </View>

        {/* ── Category filter pills ─────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: H_PAD,
            paddingBottom: 12,
            gap: 7,
          }}
        >
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${f.label}`}
                accessibilityState={{ selected: on }}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: on ? colors.primary : "#16161A",
                  borderWidth: 1,
                  borderColor: on ? "rgba(255,107,53,0.2)" : colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "700",
                    fontSize: 10,
                    letterSpacing: 0.24 * 10,
                    textTransform: "uppercase",
                    color: on ? "#0B0B0C" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Search + sort bar ─────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: 10, gap: 8 }}>
          {/* Search */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#16161A",
              borderRadius: 12,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons
              name="search"
              size={15}
              color="rgba(255,255,255,0.35)"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search templates..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                fontFamily: FONT_UI,
                fontWeight: "500",
                fontSize: 13,
                color: colors.foreground,
                paddingVertical: 10,
                minHeight: 44,
              }}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Count + sort */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontWeight: "600",
                fontSize: 9.5,
                letterSpacing: 0.08 * 9.5,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {templates.length} TEMPLATE{templates.length !== 1 ? "S" : ""}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setSortBy((s) =>
                  s === "name-asc"
                    ? "name-desc"
                    : s === "name-desc"
                      ? "default"
                      : "name-asc",
                )
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
                backgroundColor:
                  sortBy !== "default"
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                borderWidth: 1,
                borderColor:
                  sortBy !== "default"
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
              }}
            >
              <Ionicons
                name={
                  sortBy === "name-asc"
                    ? "arrow-down"
                    : sortBy === "name-desc"
                      ? "arrow-up"
                      : "swap-vertical"
                }
                size={12}
                color={
                  sortBy !== "default"
                    ? "rgba(255,255,255,0.65)"
                    : "rgba(255,255,255,0.35)"
                }
              />
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 10,
                  letterSpacing: 0.06 * 10,
                  color:
                    sortBy !== "default"
                      ? "rgba(255,255,255,0.65)"
                      : "rgba(255,255,255,0.4)",
                }}
              >
                {sortBy === "name-asc" ? "A–Z" : sortBy === "name-desc" ? "Z–A" : "Sort"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Template grid ─────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: H_PAD,
            paddingBottom: 92,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: GAP,
          }}
          showsVerticalScrollIndicator={false}
        >
          {templates.map((t) => (
            <View
              key={t.id}
              style={{ width: t.fullWidth ? "100%" : cardWidth }}
            >
              <TouchableOpacity
                onPress={useTemplate}
                onLongPress={() => copyAsPNG(t.id)}
                delayLongPress={500}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${t.name} template`}
                accessibilityHint="Long press to download as PNG"
                style={{
                  backgroundColor: t.lightCard ? colors.foreground : "#0E0E10",
                  borderRadius: Radii.md, // 16
                  minHeight: t.fullWidth ? 140 : 132,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
                ref={(el) => {
                  if (el) templateRefs.set(t.id, el);
                }}
              >
                {activity && (
                  <ErrorBoundary>
                    {t.render(
                      activity,
                      totals,
                      t.lightCard ? BRIGHT_WHITE.colors : undefined,
                    )}
                  </ErrorBoundary>
                )}
              </TouchableOpacity>

              {/* Card label */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  marginTop: 5,
                  marginBottom: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "600",
                    fontSize: 9,
                    letterSpacing: 0.06 * 9,
                    color: "rgba(255,255,255,0.5)",
                  }}
                  numberOfLines={1}
                >
                  {t.name}
                </Text>
                {t.badge && (
                  <View
                    style={{
                      paddingVertical: 1.5,
                      paddingHorizontal: 5,
                      borderRadius: 5,
                      backgroundColor:
                        t.badge === "New"
                          ? "rgba(50,215,75,0.14)"
                          : "rgba(255,107,53,0.14)",
                      borderWidth: 1,
                      borderColor:
                        t.badge === "New"
                          ? "rgba(50,215,75,0.35)"
                          : "rgba(255,107,53,0.3)",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONT_UI,
                        fontWeight: "700",
                        fontSize: 7,
                        letterSpacing: 0.08 * 7,
                        color:
                          t.badge === "New" ? "#32D74B" : colors.primary,
                        textTransform: "uppercase",
                      }}
                    >
                      {t.badge}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* ── No results ──────────────────────────────── */}
          {templates.length === 0 && (
            <View
              style={{
                width: "100%",
                alignItems: "center",
                paddingVertical: 50,
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontWeight: "600",
                  fontSize: 28,
                  color: "rgba(255,255,255,0.07)",
                }}
              >
                —
              </Text>
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "600",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {debouncedSearch.trim()
                  ? "No templates match your search"
                  : "No templates in this category"}
              </Text>
              {(debouncedSearch.trim() || filter !== "all") && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Reset filters"
                  style={{
                    marginTop: 4,
                    paddingVertical: 7,
                    paddingHorizontal: 16,
                    borderRadius: Radii.md,
                    backgroundColor: "#16161A",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT_UI,
                      fontWeight: "700",
                      fontSize: 11,
                      letterSpacing: 0.08 * 11,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    Reset filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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

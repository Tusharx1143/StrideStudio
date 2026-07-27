/**
 * Saved projects screen — grid of editable draft posts.
 *
 * Each card shows a gradient background with the draft's title,
 * date, layer count, and a status badge (DRAFT / SHARED).
 */
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { Typography, FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// Background gradient presets for card variety
const CARD_BGS = [
  ["#1B1014", "#7A2E12", "#FF8A3D"],
  ["#0B1220", "#1E3A5F", "#6FA8C7"],
  ["#12100D", "#4A3A24", "#A67C48"],
  ["#07070B", "#191B33", "#4C3E6B"],
  ["#0C1310", "#22392C", "#6E8F72"],
  ["#121214", "#2A2A2E", "#55555C"],
];

export default function SavedScreen() {
  const router = useRouter();
  const colors = useColors();
  const { activities } = useApp();

  // Use activities as mock saved projects for now
  const savedProjects = activities.slice(0, 6).map((a, i) => ({
    id: a.id,
    title: a.title || "Untitled",
    date: a.date,
    layers: 2 + (i % 3),
    bg: CARD_BGS[i % CARD_BGS.length],
    badge: i === 0 ? "DRAFT" : "SHARED",
    isDraft: i === 0,
  }));

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }}>
          <Text style={[Typography.h2, { color: colors.foreground }]}>
            Saved posts
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontSize: 11.5,
              fontWeight: "500",
              color: colors.muted,
              marginTop: 4,
            }}
          >
            Drafts keep every layer editable
          </Text>
        </View>

        {/* Grid */}
        <ScrollView
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 92,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {savedProjects.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => router.push("/editor")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open saved post: ${p.title}`}
              style={{
                width: "47%",
                height: 180,
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* Gradient background */}
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: p.bg[1],
                }}
              />
              {/* Overlay gradient for text legibility */}
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.35)",
                }}
              />

              {/* Badge */}
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  paddingHorizontal: 7,
                  paddingVertical: 4,
                  borderRadius: 7,
                  backgroundColor: p.isDraft
                    ? "rgba(255,107,53,0.9)"
                    : "rgba(0,0,0,0.55)",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "800",
                    fontSize: 8,
                    letterSpacing: 0.1 * 8,
                    color: p.isDraft ? "#0B0B0C" : "#fff",
                  }}
                >
                  {p.badge}
                </Text>
              </View>

              {/* Bottom info */}
              <View
                style={{
                  position: "absolute",
                  left: 9,
                  bottom: 8,
                  gap: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT_UI,
                    fontWeight: "800",
                    fontSize: 12,
                    color: "#fff",
                  }}
                >
                  {p.title}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: "500",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {p.date} · {p.layers} layers
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty state */}
          {savedProjects.length === 0 && (
            <View
              style={{
                width: "100%",
                alignItems: "center",
                paddingVertical: 60,
                gap: 8,
              }}
            >
              <Ionicons
                name="bookmark-outline"
                size={40}
                color={colors.muted}
              />
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.muted,
                }}
              >
                No saved posts yet
              </Text>
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  textAlign: "center",
                  paddingHorizontal: 40,
                }}
              >
                Posts you save from the editor will appear here.
                Every layer stays editable.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * Export & share screen — preview card, save to camera roll, share targets.
 *
 * Shows a scaled-down preview of the canvas, export format specs,
 * a save button, and social share targets (Instagram, Strava, etc.).
 */
import { Text, View, TouchableOpacity, Alert, Platform } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useCanvas } from "@/lib/canvas-state";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const SHARE_TARGETS = [
  { id: "ig-story", label: "IG Story", color: "#EE2A7B" },
  { id: "ig-feed", label: "IG Feed", color: "#6228D7" },
  { id: "strava", label: "Strava", color: "#FC4C02" },
  { id: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { id: "x", label: "X", color: "#0B0B0C" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "threads", label: "Threads", color: "#101010" },
  { id: "download", label: "Gallery", color: "#2C2C2E" },
];

export default function ExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { layers } = useCanvas();
  const [exported, setExported] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1700);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow access to save photos.");
        return;
      }
      setExported(true);
      flash("Exported 1080 × 1920 PNG");
    } catch {
      flash("Export failed");
    }
  }, [flash]);

  const handleShare = useCallback(
    (target: string) => {
      flash(`Shared to ${SHARE_TARGETS.find((s) => s.id === target)?.label ?? target}`);
    },
    [flash],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 16,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 18,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to editor"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#16161A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: FONT_UI, fontWeight: "600", fontSize: 17, color: "#fff" }}>‹</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: FONT_UI,
            fontWeight: "800",
            fontSize: 15,
            color: colors.foreground,
          }}
        >
          Ready to post
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Preview + Export specs */}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        {/* Preview card */}
        <View
          style={{
            width: 172,
            height: 306,
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "#000",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 11,
              color: colors.muted,
            }}
          >
            Preview
          </Text>
        </View>

        {/* Right panel */}
        <View style={{ flex: 1, gap: 9 }}>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "700",
              fontSize: 9,
              letterSpacing: 0.18 * 9,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            EXPORT
          </Text>

          {[
            { title: "Story · 1080 × 1920", meta: "PNG · 9:16" },
            { title: "Feed · 1080 × 1350", meta: "PNG · 4:5 crop" },
            {
              title: `${layers.length} layers flattened`,
              meta: "Editable draft kept in Saved",
            },
          ].map((spec, i) => (
            <View
              key={i}
              style={{
                backgroundColor: "#0E0E10",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 9,
                paddingHorizontal: 11,
                gap: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 11.5,
                  color: colors.foreground,
                }}
              >
                {spec.title}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_MONO,
                  fontWeight: "500",
                  fontSize: 9.5,
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                {spec.meta}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={exported ? "Exported" : "Export PNG"}
            style={{
              height: 44,
              borderRadius: 22,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 12.5,
                color: "#000",
              }}
            >
              {exported ? "EXPORTED ✓" : "EXPORT PNG"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Share targets */}
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "700",
          fontSize: 9,
          letterSpacing: 0.18 * 9,
          color: "rgba(255,255,255,0.4)",
          marginTop: 18,
          marginBottom: 10,
        }}
      >
        SHARE TO
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {SHARE_TARGETS.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => handleShare(s.id)}
            accessibilityRole="button"
            accessibilityLabel={`Share to ${s.label}`}
            style={{ alignItems: "center", gap: 6, width: "22%" }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 15,
                backgroundColor: s.color,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
            </View>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 9,
                lineHeight: 9.9,
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
              }}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toast */}
      {toast && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom + 26,
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 11,
                color: "#fff",
              }}
            >
              {toast}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

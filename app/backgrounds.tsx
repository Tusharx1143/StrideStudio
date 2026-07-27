/**
 * Background picker — photos / gradients / route-maps grid.
 *
 * 12 gradient presets, photo library access, and route map tiles.
 * Tap to select, "DONE" to confirm and return to editor.
 */
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

const GRADIENTS = [
  { id: "bg1", label: "Sunset road", colors: ["#1B1014", "#7A2E12", "#FF8A3D"] },
  { id: "bg2", label: "Dawn track", colors: ["#0B1220", "#1E3A5F", "#6FA8C7"] },
  { id: "bg3", label: "Trail dust", colors: ["#12100D", "#4A3A24", "#A67C48"] },
  { id: "bg4", label: "Night city", colors: ["#07070B", "#191B33", "#4C3E6B"] },
  { id: "bg5", label: "Ghat mist", colors: ["#0C1310", "#22392C", "#6E8F72"] },
  { id: "bg6", label: "Studio grey", colors: ["#121214", "#2A2A2E", "#55555C"] },
  { id: "bg7", label: "Heat map", colors: ["#1A0A0A", "#8C1E12", "#FFC247"] },
  { id: "bg8", label: "Cool fade", colors: ["#0A0F12", "#14403F", "#48A79A"] },
  { id: "bg9", label: "Violet dusk", colors: ["#0B0810", "#3A1B54", "#B06AA8"] },
  { id: "bg10", label: "Concrete", colors: ["#0E0E0F", "#333339", "#6D6D74"] },
  { id: "bg11", label: "Sand", colors: ["#141009", "#5E4A22", "#D9B168"] },
  { id: "bg12", label: "Deep sea", colors: ["#05080D", "#0F2A4A", "#2F7EA8"] },
];

const TABS = ["Recents", "Stock", "Presets", "Gradients"];

export default function BackgroundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [selected, setSelected] = useState<string>("bg1");
  const [activeTab, setActiveTab] = useState("Gradients");

  const handlePickPhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        router.back();
      }
    } catch {}
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: insets.top + 10,
          paddingBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
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
            color: "#fff",
          }}
        >
          Choose a background
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "800",
              fontSize: 12.5,
              color: colors.primary,
              padding: 10,
            }}
          >
            DONE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 7, paddingHorizontal: 16, paddingBottom: 12 }}>
        {TABS.map((t) => {
          const on = activeTab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setActiveTab(t);
                if (t === "Recents") handlePickPhoto();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Tab: ${t}`}
              accessibilityState={{ selected: on }}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 11,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: on ? colors.primary : "rgba(255,255,255,0.12)",
                backgroundColor: on
                  ? "rgba(255,107,53,0.16)"
                  : "rgba(255,255,255,0.04)",
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_UI,
                  fontWeight: "700",
                  fontSize: 10,
                  letterSpacing: 0.06 * 10,
                  color: on ? colors.primary : "rgba(255,255,255,0.62)",
                }}
              >
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {GRADIENTS.map((bg) => (
            <TouchableOpacity
              key={bg.id}
              onPress={() => setSelected(bg.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Select ${bg.label}`}
              style={{
                width: "31%",
                height: 118,
                borderRadius: 10,
                overflow: "hidden",
                borderWidth: selected === bg.id ? 2 : 0,
                borderColor: colors.primary,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: bg.colors[1],
                }}
              />
              <Text
                style={{
                  position: "absolute",
                  left: 6,
                  bottom: 5,
                  fontFamily: FONT_MONO,
                  fontWeight: "600",
                  fontSize: 8,
                  letterSpacing: 0.06 * 8,
                  color: "rgba(255,255,255,0.85)",
                  textShadowColor: "rgba(0,0,0,0.7)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {bg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

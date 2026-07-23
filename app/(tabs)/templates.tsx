import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { TEMPLATE_DEFS, computeWeekTotals } from "@/lib/templates";

/**
 * Templates gallery — live-rendered previews of every template using the
 * currently selected activity, filterable by Activity/Totals group.
 */
export default function TemplatesScreen() {
  const router = useRouter();
  const { activities, getSelectedActivity } = useApp();
  const [filter, setFilter] = useState<"all" | "activity" | "totals">("all");

  const activity = getSelectedActivity();
  const totals = computeWeekTotals(activities);
  const templates = TEMPLATE_DEFS.filter((t) => filter === "all" || t.tab === filter);

  const useTemplate = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/editor");
  };

  return (
    <ScreenContainer className="p-0" containerClassName="bg-black">
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800" }}>Templates</Text>
          <Text style={{ color: "#8E8E93", fontSize: 13, marginTop: 2, marginBottom: 12 }}>
            {TEMPLATE_DEFS.length} designs · tap one to open it in the share screen
          </Text>
        </View>

        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 10, gap: 8 }}>
          {(["all", "activity", "totals"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                backgroundColor: filter === f ? "#FFFFFF" : "#1C1C1E",
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: filter === f ? "#000000" : "#FFFFFF",
                  fontSize: 13,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
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
                  {t.render(activity, totals)}
                </TouchableOpacity>
                <Text style={{ color: "#8E8E93", fontSize: 10, textAlign: "center", marginTop: 4 }}>{t.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

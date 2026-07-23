import { ScrollView, Text, View, TouchableOpacity, FlatList, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { TEMPLATES, Template } from "@/lib/app-data";

type Category = "all" | "running" | "cycling" | "general";

function TemplateGridItem({ template, onSelect }: { template: Template; onSelect: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.border,
        margin: 6,
        minHeight: 140,
      }}
    >
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{template.preview}</Text>
      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", textAlign: "center" }}>
        {template.name}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4, textTransform: "capitalize" }}>
        {template.category}
      </Text>
    </TouchableOpacity>
  );
}

export default function TemplatesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectTemplate } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredTemplates =
    selectedCategory === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === selectedCategory);

  const useTemplate = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectTemplate(id);
    router.push("/(tabs)/editor");
  };

  return (
    <ScreenContainer className="p-0">
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold" }}>Templates</Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>
            Tap a template to use it in the editor
          </Text>
        </View>

        {/* Category Filter */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            {(["all", "running", "cycling", "general"] as Category[]).map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                  borderWidth: selectedCategory === category ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: selectedCategory === category ? "#000000" : colors.foreground,
                    fontSize: 12,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Template Grid */}
        <FlatList
          data={filteredTemplates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TemplateGridItem template={item} onSelect={() => useTemplate(item.id)} />}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 12, paddingBottom: 32 }}
        />
      </View>
    </ScreenContainer>
  );
}

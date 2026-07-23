import { ScrollView, Text, View, TouchableOpacity, FlatList, Switch, Platform, Alert } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { TEMPLATES, Template, StatToggles } from "@/lib/app-data";
import { PostPreview } from "@/components/post-preview";

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        backgroundColor: selected ? colors.primary : colors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
        marginRight: 12,
        width: 92,
        height: 92,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{template.preview}</Text>
      <Text
        style={{
          color: selected ? "#000000" : colors.foreground,
          fontSize: 10,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {template.name}
      </Text>
    </TouchableOpacity>
  );
}

const STAT_LABELS: { key: keyof StatToggles; label: string }[] = [
  { key: "distance", label: "Distance" },
  { key: "duration", label: "Duration" },
  { key: "pace", label: "Pace / Speed" },
  { key: "elevation", label: "Elevation" },
  { key: "heartRate", label: "Heart Rate" },
  { key: "calories", label: "Calories" },
];

export default function EditorScreen() {
  const colors = useColors();
  const {
    activities,
    selectedActivityId,
    selectActivity,
    selectedTemplateId,
    selectTemplate,
    statToggles,
    setStatToggle,
    incrementSavedPosts,
    getSelectedActivity,
    getSelectedTemplate,
  } = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);

  const activity = getSelectedActivity();
  const template = getSelectedTemplate();

  const doAction = (label: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    incrementSavedPosts();
    setFeedback(label);
    setTimeout(() => setFeedback(null), 2000);
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
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold" }}>Create Post</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Activity selector */}
          <View style={{ paddingTop: 16 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 15,
                fontWeight: "600",
                paddingHorizontal: 16,
                marginBottom: 10,
              }}
            >
              Activity
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {activities.map((a) => {
                const selected = a.id === selectedActivityId;
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => selectActivity(a.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      marginRight: 8,
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderWidth: selected ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#000000" : colors.foreground,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {a.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Live Preview */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <PostPreview activity={activity} template={template} toggles={statToggles} />
          </View>

          {/* Template Selection */}
          <View>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 15,
                fontWeight: "600",
                paddingHorizontal: 16,
                marginBottom: 10,
              }}
            >
              Choose Template
            </Text>
            <FlatList
              horizontal
              data={TEMPLATES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TemplateCard
                  template={item}
                  selected={selectedTemplateId === item.id}
                  onSelect={() => selectTemplate(item.id)}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Customization Section */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600", marginBottom: 10 }}>
              Customize Stats
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {STAT_LABELS.map(({ key, label }, index) => (
                <View
                  key={key}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: index < STAT_LABELS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>{label}</Text>
                  <Switch
                    value={statToggles[key]}
                    onValueChange={(v) => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setStatToggle(key, v);
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Feedback banner */}
          {feedback && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 12,
                backgroundColor: "#14532d",
                borderRadius: 10,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#4ADE80", fontSize: 13, fontWeight: "600" }}>{feedback}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <TouchableOpacity
              onPress={() => doAction("Shared to Instagram Stories ✓")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#000000", fontSize: 15, fontWeight: "700" }}>Share to Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => doAction("Saved to Camera Roll ✓")}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>Save to Camera Roll</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => doAction("Copied to Clipboard ✓")}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>Copy to Clipboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;

type Row = { label: string; path: string; note?: string };
type Section = { title: string; rows: Row[] };

export default function DevScreensIndex() {
  const router = useRouter();
  const { activities } = useApp();
  const firstActivityId = activities[0]?.id;

  const sections: Section[] = [
    {
      title: "Onboarding",
      rows: [
        { label: "Splash", path: "/onboarding/splash" },
        { label: "Auth", path: "/onboarding/auth" },
        { label: "Connect Strava", path: "/onboarding/connect-strava" },
        { label: "Sync", path: "/onboarding/sync" },
      ],
    },
    {
      title: "Main app",
      rows: [
        { label: "Home", path: "/(tabs)" },
        { label: "Templates", path: "/(tabs)/templates" },
        { label: "Profile", path: "/(tabs)/profile" },
        {
          label: "Activity detail",
          path: firstActivityId ? `/activity/${firstActivityId}` : "/activity/preview",
          note: firstActivityId ? undefined : "No real activity yet — shows the not-found state",
        },
      ],
    },
    {
      title: "Creation flow",
      rows: [
        { label: "Capture", path: "/capture" },
        { label: "Background picker", path: "/background-picker" },
        { label: "Editor (not yet redesigned)", path: "/editor" },
      ],
    },
    {
      title: "Dev",
      rows: [{ label: "Theme lab", path: "/dev/theme-lab" }],
    },
  ];

  return (
    <ScreenContainer containerClassName="bg-canvas">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Screen index</Text>
        <Text style={styles.subtitle}>Direct links to every route — for review, not the real nav.</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <Pressable
                  key={row.path}
                  onPress={() => router.push(row.path as never)}
                  style={[styles.row, i < section.rows.length - 1 && styles.rowDivider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    {row.note && <Text style={styles.rowNote}>{row.note}</Text>}
                  </View>
                  <Text style={styles.rowChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 22,
  },
  title: {
    fontFamily: AppFonts.archivo.black,
    fontSize: 26,
    color: C.foreground,
  },
  subtitle: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: C.muted,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLabel: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 14.5,
    color: C.foreground,
  },
  rowNote: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 11.5,
    color: C.muted,
    marginTop: 2,
  },
  rowChevron: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 18,
    color: C.muted,
  },
});

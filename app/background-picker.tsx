import { useEffect, useState } from "react";
import { Text, View, Pressable, FlatList, Image, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";

import { useCanvas } from "@/lib/canvas-state";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;
const SCREEN_W = Dimensions.get("window").width;
const TILE_SIZE = (SCREEN_W - 16 * 2 - 4 * 2) / 3;

const TABS = [
  { id: "recent", label: "Recents" },
  { id: "stock", label: "Stock" },
  { id: "preset", label: "Presets" },
  { id: "solid", label: "Gradients" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function BackgroundPickerScreen() {
  const router = useRouter();
  const { setPhoto } = useCanvas();

  const [tab, setTab] = useState<TabId>("recent");
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== "recent" || permission !== "unknown") return;
    (async () => {
      setLoading(true);
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        setPermission("denied");
        setLoading(false);
        return;
      }
      setPermission("granted");
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 30,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      setPhotos(result.assets);
      setLoading(false);
    })();
  }, [tab, permission]);

  const goBack = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const choosePhoto = (uri: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(uri);
    router.push("/editor");
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Choose a background</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tabChip, tab === t.id && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, tab === t.id && styles.tabChipTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "recent" ? (
        loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={C.foreground} />
          </View>
        ) : permission === "denied" ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Photo access needed</Text>
            <Text style={styles.emptyBody}>Enable photo library access in Settings to browse recents.</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={{ gap: 4 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => choosePhoto(item.uri)} style={styles.tile}>
                <Image source={{ uri: item.uri }} style={styles.tileImage} />
              </Pressable>
            )}
          />
        )
      ) : (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Coming soon</Text>
          <Text style={styles.emptyBody}>
            {tab === "solid"
              ? "Solid and gradient backgrounds are on the way."
              : "Curated background packs are on the way."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
  },
  title: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  tabRow: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: C.surfaceAlt,
  },
  tabChipActive: {
    backgroundColor: C.primary,
  },
  tabChipText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.6)",
  },
  tabChipTextActive: {
    color: "#FFFFFF",
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 26,
    gap: 4,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 4,
    backgroundColor: C.surface,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  emptyBody: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 13,
    lineHeight: 19,
    color: C.muted,
    textAlign: "center",
  },
});

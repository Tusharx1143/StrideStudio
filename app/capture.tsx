import { useRef, useState } from "react";
import {
  Text,
  View,
  Pressable,
  Modal,
  FlatList,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from "expo-camera";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

import { useApp } from "@/lib/app-context";
import { useCanvas } from "@/lib/canvas-state";
import { ACTIVITY_META } from "@/lib/feed-stats";
import { Colors } from "@/constants/theme";
import { AppFonts } from "@/constants/fonts";

const C = Colors.dark;

function ScrimOverlay() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="capture-scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#000000" stopOpacity={0.5} />
          <Stop offset="26%" stopColor="#000000" stopOpacity={0} />
          <Stop offset="62%" stopColor="#000000" stopOpacity={0} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0.72} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#capture-scrim)" />
    </Svg>
  );
}

const FLASH_CYCLE: FlashMode[] = ["off", "auto", "on"];
const FLASH_ICON: Record<FlashMode, string> = { off: "⚡", auto: "⚡A", on: "⚡" };

export default function CaptureScreen() {
  const router = useRouter();
  const { activities, selectedActivityId, selectActivity, getSelectedActivity } = useApp();
  const { setPhoto } = useCanvas();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const activity = activities.length > 0 ? getSelectedActivity() : null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goHome = () => {
    haptic();
    router.replace("/(tabs)");
  };

  const cycleFlash = () => {
    haptic();
    setFlash((f) => FLASH_CYCLE[(FLASH_CYCLE.indexOf(f) + 1) % FLASH_CYCLE.length]);
  };

  const flipCamera = () => {
    haptic();
    setFacing((f) => (f === "back" ? "front" : "back"));
  };

  const selectMode = (next: "photo" | "video") => {
    haptic();
    setMode(next);
    if (next === "video") showToast("Video capture coming soon");
  };

  const openGalleryPicker = async () => {
    haptic();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Library permission needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      router.push("/editor");
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        setPhoto(photo.uri);
        router.push("/editor");
      }
    } catch {
      showToast("Couldn't capture photo");
    } finally {
      setCapturing(false);
    }
  };

  // ── Permission gate ──
  if (!permission) {
    return <View style={styles.page} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.page, styles.permissionPage]}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          StrideStudio uses your camera to capture the photo behind your stat stickers.
        </Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Enable camera</Text>
        </Pressable>
        <Pressable onPress={goHome} style={styles.permissionSkip} hitSlop={8}>
          <Text style={styles.permissionSkipText}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />
      <ScrimOverlay />

      <View style={styles.topRow}>
        <Pressable onPress={goHome} style={styles.glassButton} hitSlop={6}>
          <Text style={styles.glassButtonText}>✕</Text>
        </Pressable>

        <Pressable onPress={() => setActivityPickerOpen(true)} style={styles.activityChip} hitSlop={6}>
          <View style={styles.activityDot} />
          <Text style={styles.activityChipText} numberOfLines={1}>
            {activity ? `${activity.distance.toFixed(1)} KM ${ACTIVITY_META[activity.type].label.toUpperCase()}` : "NO ACTIVITY"}
          </Text>
          <Text style={styles.activityChipChevron}>▾</Text>
        </Pressable>

        <Pressable onPress={cycleFlash} style={styles.glassButton} hitSlop={6}>
          <Text style={[styles.glassButtonText, flash !== "off" && styles.glassButtonTextActive]}>
            {FLASH_ICON[flash]}
          </Text>
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {(["photo", "video"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => selectMode(m)}
            style={[styles.modeChip, mode === m ? styles.modeChipActive : styles.modeChipInactive]}
          >
            <Text style={[styles.modeChipText, mode === m ? styles.modeChipTextActive : styles.modeChipTextInactive]}>
              {m.toUpperCase()}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            haptic();
            router.push("/background-picker");
          }}
          style={[styles.modeChip, styles.modeChipInactive]}
        >
          <Text style={[styles.modeChipText, styles.modeChipTextInactive]}>PRESET</Text>
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <Pressable onPress={openGalleryPicker} style={styles.galleryThumb} hitSlop={4} />
        <Pressable onPress={takePhoto} style={styles.shutterOuter} hitSlop={4}>
          <View style={[styles.shutterInner, capturing && styles.shutterInnerBusy]} />
        </Pressable>
        <Pressable onPress={flipCamera} style={styles.glassButton} hitSlop={6}>
          <Text style={styles.glassButtonText}>⟲</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>HOLD FOR VIDEO · SWIPE FOR GALLERY</Text>

      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}

      <Modal
        visible={activityPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setActivityPickerOpen(false)}
      >
        <Pressable style={styles.modalScrim} onPress={() => setActivityPickerOpen(false)}>
          <View style={styles.modalSheet}>
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => {
                    selectActivity(item.id);
                    setActivityPickerOpen(false);
                  }}
                  style={[
                    styles.modalRow,
                    index < activities.length - 1 && styles.modalRowDivider,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalRowLabel,
                      item.id === selectedActivityId && styles.modalRowLabelActive,
                    ]}
                  >
                    {item.distance.toFixed(1)} km {ACTIVITY_META[item.type].label}
                  </Text>
                  <Text style={styles.modalRowMeta}>{item.date}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000000",
  },
  permissionPage: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  permissionTitle: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 19,
    color: C.foreground,
    textAlign: "center",
  },
  permissionBody: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 14,
    lineHeight: 20,
    color: C.muted,
    textAlign: "center",
  },
  permissionButton: {
    marginTop: 10,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 25,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonText: {
    fontFamily: AppFonts.archivo.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  permissionSkip: {
    padding: 10,
  },
  permissionSkipText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 13,
    color: C.muted,
  },
  topRow: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  glassButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  glassButtonText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  glassButtonTextActive: {
    color: C.primary,
  },
  activityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 200,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  activityChipText: {
    fontFamily: AppFonts.mono.bold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  activityChipChevron: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
  },
  modeRow: {
    position: "absolute",
    bottom: 118,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 15,
  },
  modeChipActive: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  modeChipInactive: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modeChipText: {
    fontFamily: AppFonts.archivo.extraBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  modeChipTextActive: {
    color: "#0B0B0C",
  },
  modeChipTextInactive: {
    color: "rgba(255,255,255,0.7)",
  },
  bottomRow: {
    position: "absolute",
    bottom: 26,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  galleryThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#5A3A26",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  shutterInnerBusy: {
    opacity: 0.6,
  },
  hint: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.4)",
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 145,
    alignItems: "center",
  },
  toast: {
    backgroundColor: "rgba(28,28,30,0.92)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 12,
    color: "#FFFFFF",
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  modalSheet: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 16,
    maxHeight: 420,
    overflow: "hidden",
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  modalRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalRowLabel: {
    fontFamily: AppFonts.archivo.semiBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  modalRowLabelActive: {
    color: C.primary,
  },
  modalRowMeta: {
    fontFamily: AppFonts.archivo.medium,
    fontSize: 12,
    color: C.muted,
  },
});

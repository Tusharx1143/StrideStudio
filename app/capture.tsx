/**
 * Capture screen — camera preview with activity chip, shutter, and gallery.
 *
 * Full-bleed camera preview with gradient scrim for legibility.
 * Uses expo-camera's CameraView for real camera preview.
 * Top: back button + activity chip (orange dot + activity label)
 * Bottom: gallery thumb, shutter ring, flip button
 */
import { Text, View, TouchableOpacity, Alert } from "react-native";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO, Controls, Radii } from "@/lib/_core/theme";
import { dist, distUnitShort, typeLabel } from "@/lib/stickers/formatters";

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { getSelectedActivity } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const cameraRef = useRef<CameraView>(null);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  const activity = getSelectedActivity();
  const activityLabel = activity.distance
    ? `${dist(activity, "metric")} ${distUnitShort("metric")} ${activity.type}`
    : activity.title || "Select activity";

  const handleShutter = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    if (cameraRef.current) {
      try {
        const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          router.push("/editor");
          return;
        }
      } catch {
        // Camera capture failed — proceed to editor anyway
      }
    }
    router.push("/editor");
  }, [router]);

  const handleGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        setGalleryImage(result.assets[0].uri);
        router.push("/editor");
      }
    } catch {
      Alert.alert("Error", "Could not open gallery.");
    }
  }, [router]);

  const handleFlip = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  const handleActivityChip = useCallback(() => {
    // Open activity picker — for now go to activity detail
    router.push("/editor");
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera preview */}
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          mode="picture"
        />
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: "#0E0E10",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 14 }}>
            Camera access needed
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            accessibilityRole="button"
            accessibilityLabel="Grant camera permission"
            style={{
              backgroundColor: colors.primary,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#0B0B0C", fontWeight: "700", fontSize: 13 }}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gradient scrim */}
      <View
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        {/* Top gradient */}
        <View
          style={{
            height: "26%",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
        {/* Middle transparent */}
        <View style={{ flex: 1 }} />
        {/* Bottom gradient */}
        <View
          style={{
            height: "38%",
            backgroundColor: "rgba(0,0,0,0.72)",
          }}
        />
      </View>

      {/* Top bar */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 14,
          right: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Close / back */}
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(0,0,0,0.42)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "600",
              fontSize: 17,
              color: "#fff",
            }}
          >
            ✕
          </Text>
        </TouchableOpacity>

        {/* Activity chip */}
        <TouchableOpacity
          onPress={handleActivityChip}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Activity: ${activityLabel}`}
          style={{
            backgroundColor: "rgba(0,0,0,0.42)",
            borderRadius: 18,
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#FF6B35",
            }}
          />
          <Text
            style={{
              fontFamily: FONT_MONO,
              fontWeight: "700",
              fontSize: 10.5,
              letterSpacing: 0.08 * 10.5,
              color: "#fff",
              maxWidth: 180,
            }}
            numberOfLines={1}
          >
            {activityLabel}
          </Text>
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "600",
              fontSize: 9,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            ▾
          </Text>
        </TouchableOpacity>

        {/* Flash indicator */}
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(0,0,0,0.42)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="flash" size={16} color="#fff" />
        </View>
      </View>

      {/* Capture mode pills */}
      <View
        style={{
          position: "absolute",
          bottom: 118,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {["PHOTO", "VIDEO", "PRESET"].map((mode, i) => (
          <View
            key={mode}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 15,
              backgroundColor:
                i === 0 ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.4)",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "800",
                fontSize: 9.5,
                letterSpacing: 0.14 * 9.5,
                color: i === 0 ? "#0B0B0C" : "rgba(255,255,255,0.7)",
              }}
            >
              {mode}
            </Text>
          </View>
        ))}
      </View>

      {/* Bottom controls */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 26,
          left: 0,
          right: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 30,
        }}
      >
        {/* Gallery thumb */}
        <TouchableOpacity
          onPress={handleGallery}
          accessibilityRole="button"
          accessibilityLabel="Open gallery"
          style={{
            width: Controls.captureSide,
            height: Controls.captureSide,
            borderRadius: Radii.sm,
            backgroundColor: "#3A2A22",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.35)",
            overflow: "hidden",
          }}
        >
          {galleryImage && (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#8C4E2E",
              }}
            />
          )}
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          onPress={handleShutter}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={{
            width: Controls.shutterOuter,
            height: Controls.shutterOuter,
            borderRadius: Controls.shutterOuter / 2,
            borderWidth: 4,
            borderColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: Controls.shutterInner,
              height: Controls.shutterInner,
              borderRadius: Controls.shutterInner / 2,
              backgroundColor: "#FF6B35",
              shadowColor: "#FF6B35",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
              elevation: 12,
            }}
          />
        </TouchableOpacity>

        {/* Flip button */}
        <TouchableOpacity
          onPress={handleFlip}
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
          style={{
            width: Controls.captureSide,
            height: Controls.captureSide,
            borderRadius: Controls.captureSide / 2,
            backgroundColor: "rgba(0,0,0,0.42)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="camera-reverse" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <Text
        style={{
          position: "absolute",
          bottom: insets.bottom + 6,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT_UI,
          fontWeight: "600",
          fontSize: 9,
          letterSpacing: 0.2 * 9,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        HOLD FOR VIDEO · SWIPE FOR GALLERY
      </Text>
    </View>
  );
}

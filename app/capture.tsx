/**
 * Capture screen — full-screen camera with flash, timer, stock images, and preset backgrounds.
 *
 * Camera-first entry point. Opens immediately on app launch.
 * After capture/import, seamlessly transitions to the Lens-based editor.
 * No visible chrome until tapped — minimal UI.
 */
import { Text, View, TouchableOpacity, Alert } from "react-native";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/lib/_core/theme";

const FONT_UI = Fonts.sans;
const FONT_MONO = Fonts.mono;
const Controls = { captureSide: 44, shutterOuter: 76, shutterInner: 58 };
const Radii = { sm: 8 };

// ── Types ──

type FlashMode = "off" | "on" | "auto";
type TimerMode = "off" | "3" | "10";

// ── Preset backgrounds (matching the existing 12 gradient presets) ──

const PRESET_BG = [
  { id: "bg1", label: "Ember", color: "#7A2E12" },
  { id: "bg2", label: "Ocean", color: "#1E3A5F" },
  { id: "bg3", label: "Earth", color: "#4A3A24" },
  { id: "bg4", label: "Night", color: "#191B33" },
  { id: "bg5", label: "Forest", color: "#22392C" },
  { id: "bg6", label: "Steel", color: "#2A2A2E" },
  { id: "bg7", label: "Ruby", color: "#8C1E12" },
  { id: "bg8", label: "Teal", color: "#14403F" },
  { id: "bg9", label: "Plum", color: "#3A1B54" },
  { id: "bg10", label: "Stone", color: "#333339" },
  { id: "bg11", label: "Sand", color: "#5E4A22" },
  { id: "bg12", label: "Cobalt", color: "#0F2A4A" },
];

// ── Stock images (placeholder) ──

const STOCK_IMAGES = [
  { id: "stock1", label: "Trail", emoji: "🌲" },
  { id: "stock2", label: "Road", emoji: "🛣️" },
  { id: "stock3", label: "Track", emoji: "🏟️" },
  { id: "stock4", label: "Mountain", emoji: "⛰️" },
  { id: "stock5", label: "City", emoji: "🌆" },
  { id: "stock6", label: "Beach", emoji: "🏖️" },
  { id: "stock7", label: "Gym", emoji: "🏋️" },
  { id: "stock8", label: "Sunset", emoji: "🌅" },
];

// ── Component ──

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { getSelectedActivity } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [timer, setTimer] = useState<TimerMode>("off");
  const [showStock, setShowStock] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shutterScale = useSharedValue(1);

  const activity = getSelectedActivity();
  const activityLabel = activity.distance
    ? `${activity.distance.toFixed(2)} km ${activity.type}`
    : activity.title || "Select activity";

  // ── Camera flash mapping ──
  const flashModeMap = useCallback((mode: FlashMode): "off" | "on" | "auto" => {
    return mode;
  }, []);

  // ── Cycle flash ──
  const cycleFlash = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setFlash((f) => f === "off" ? "on" : f === "on" ? "auto" : "off");
  }, []);

  // ── Cycle timer ──
  const cycleTimer = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setTimer((t) => t === "off" ? "3" : t === "3" ? "10" : "off");
  }, []);

  // ── Shutter animation ──
  const animateShutter = useCallback(() => {
    shutterScale.value = withSpring(0.85, { damping: 12, stiffness: 300 }, () => {
      shutterScale.value = withSpring(1, { damping: 15, stiffness: 350 });
    });
  }, [shutterScale]);

  // ── Handle photo capture ──
  const handleCapture = useCallback(async () => {
    animateShutter();
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}

    // Handle timer
    if (timer !== "off") {
      const seconds = parseInt(timer);
      setCountdown(seconds);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current!);
            setCountdown(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return; // Capture happens after countdown
    }

    // No timer — capture immediately
    if (cameraRef.current) {
      try {
        const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          // Photo captured — navigate to editor
        }
      } catch {}
    }
    router.push("/editor");
  }, [animateShutter, timer, router]);

  // ── Gallery import ──
  const handleGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        router.push("/editor");
      }
    } catch {
      Alert.alert("Error", "Could not open gallery.");
    }
  }, [router]);

  // ── Stock image select ──
  const handleStockSelect = useCallback(
    (id: string) => {
      setShowStock(false);
      router.push("/editor");
    },
    [router],
  );

  // ── Preset background select ──
  const handlePresetSelect = useCallback(
    (id: string) => {
      setShowPresets(false);
      router.push("/editor");
    },
    [router],
  );

  // ── Flip camera ──
  const handleFlip = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  // ── Activity chip press ──
  const handleActivityChip = useCallback(() => {
    router.push("/editor");
  }, [router]);

  // ── Flash label ──
  const flashLabel = flash === "off" ? "⚪" : flash === "on" ? "⚡" : "🔄";
  const timerLabel = timer === "off" ? "⏱️" : `${timer}s`;

  const shutterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera preview */}
      {permission?.granted && !showStock && !showPresets ? (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          mode="picture"
          flash={flashModeMap(flash)}
        />
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: "#0E0E10",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showStock ? (
            <StockSelector onSelect={handleStockSelect} />
          ) : showPresets ? (
            <PresetSelector onSelect={handlePresetSelect} />
          ) : (
            <View style={{ gap: 12, alignItems: "center" }}>
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
        </View>
      )}

      {/* Gradient scrim (bottom only, for legibility) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        pointerEvents="none"
      />

      {/* Countdown overlay */}
      {countdown !== null && (
        <Animated.View
          entering={FadeIn.duration(100)}
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <Text
            style={{
              fontFamily: FONT_UI,
              fontWeight: "900",
              fontSize: 96,
              color: "#FFFFFF",
            }}
          >
            {countdown}
          </Text>
        </Animated.View>
      )}

      {/* Top bar */}
      {!showStock && !showPresets && (
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
          {/* Close */}
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
            <Text style={{ fontFamily: FONT_UI, fontWeight: "600", fontSize: 17, color: "#fff" }}>
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
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF6B35" }} />
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
            <Text style={{ fontFamily: FONT_UI, fontWeight: "600", fontSize: 9, color: "rgba(255,255,255,0.55)" }}>
              ▾
            </Text>
          </TouchableOpacity>

          {/* Flash button */}
          <TouchableOpacity
            onPress={cycleFlash}
            accessibilityRole="button"
            accessibilityLabel={`Flash: ${flash}`}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(0,0,0,0.42)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>{flashLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom controls */}
      {!showStock && !showPresets && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 14,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            gap: 12,
          }}
        >
          {/* Image Source Row: Stock, Presets, Gallery */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowStock(true)}
              accessibilityRole="button"
              accessibilityLabel="Browse stock images"
              style={sourceBtn}
            >
              <Ionicons name="images" size={16} color="#fff" />
              <Text style={sourceBtnText}>Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPresets(true)}
              accessibilityRole="button"
              accessibilityLabel="Browse preset backgrounds"
              style={sourceBtn}
            >
              <Ionicons name="color-fill" size={16} color="#fff" />
              <Text style={sourceBtnText}>Presets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGallery}
              accessibilityRole="button"
              accessibilityLabel="Open gallery"
              style={sourceBtn}
            >
              <Ionicons name="images-outline" size={16} color="#fff" />
              <Text style={sourceBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Camera controls row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
            }}
          >
            {/* Timer */}
            <TouchableOpacity
              onPress={cycleTimer}
              accessibilityRole="button"
              accessibilityLabel={`Timer: ${timer}`}
              style={{
                width: Controls.captureSide,
                height: Controls.captureSide,
                borderRadius: Radii.sm,
                backgroundColor: "rgba(0,0,0,0.42)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>{timerLabel}</Text>
            </TouchableOpacity>

            {/* Shutter */}
            <TouchableOpacity
              onPress={handleCapture}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <Animated.View
                style={[
                  {
                    width: Controls.shutterOuter,
                    height: Controls.shutterOuter,
                    borderRadius: Controls.shutterOuter / 2,
                    borderWidth: 4,
                    borderColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  shutterAnimStyle,
                ]}
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
              </Animated.View>
            </TouchableOpacity>

            {/* Flip camera */}
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
        </View>
      )}

      {/* Hint */}
      {!showStock && !showPresets && (
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
            color: "rgba(255,255,255,0.3)",
          }}
        >
          TAP SHUTTER · SWIPE FOR MORE OPTIONS
        </Text>
      )}
    </View>
  );
}

// ── Stock selector sub-component ──

function StockSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const colors = useColors();
  return (
    <View style={{ padding: 20, gap: 16, width: "100%" }}>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "800",
          fontSize: 18,
          color: "#fff",
          textAlign: "center",
        }}
      >
        Stock Images
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {STOCK_IMAGES.map((img) => (
          <TouchableOpacity
            key={img.id}
            onPress={() => onSelect(img.id)}
            accessibilityRole="button"
            accessibilityLabel={img.label}
            style={{
              width: 80,
              height: 100,
              borderRadius: 14,
              backgroundColor: "#1C1C1E",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 32 }}>{img.emoji}</Text>
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "600",
                fontSize: 9,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {img.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => onSelect("")}
        accessibilityRole="button"
        accessibilityLabel="Back to camera"
        style={{
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.06)",
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: FONT_UI, fontWeight: "700", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          ← Back to Camera
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Preset selector sub-component ──

function PresetSelector({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <View style={{ padding: 20, gap: 16, width: "100%" }}>
      <Text
        style={{
          fontFamily: FONT_UI,
          fontWeight: "800",
          fontSize: 18,
          color: "#fff",
          textAlign: "center",
        }}
      >
        Preset Backgrounds
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {PRESET_BG.map((bg) => (
          <TouchableOpacity
            key={bg.id}
            onPress={() => onSelect(bg.id)}
            accessibilityRole="button"
            accessibilityLabel={bg.label}
            style={{
              width: 80,
              height: 80,
              borderRadius: 14,
              backgroundColor: bg.color,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONT_UI,
                fontWeight: "700",
                fontSize: 9,
                color: "#fff",
              }}
            >
              {bg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => onSelect("")}
        accessibilityRole="button"
        accessibilityLabel="Back to camera"
        style={{
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.06)",
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: FONT_UI, fontWeight: "700", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          ← Back to Camera
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Shared styles ──

const sourceBtn: any = {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 18,
  backgroundColor: "rgba(0,0,0,0.5)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.12)",
};

const sourceBtnText: any = {
  fontFamily: FONT_UI,
  fontWeight: "700",
  fontSize: 10,
  color: "#FFFFFF",
};

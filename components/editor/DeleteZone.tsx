/**
 * DeleteZone — trash drop target overlay shown during layer drag.
 * Expands and changes color when a layer is dragged over it.
 */
import React from "react";
import { Text, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  EditorColors,
  EditorSemantic,
  EditorMotion,
} from "@/constants/editor-theme";

const SCREEN_W = Dimensions.get("window").width;
const DELETE_ZONE_SIZE = Math.min(64, SCREEN_W * 0.17);

interface DeleteZoneProps {
  visible: boolean;
  dragOver: boolean;
}

export function DeleteZone({ visible, dragOver }: DeleteZoneProps) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(EditorMotion.fast)} style={{
      position: "absolute", bottom: 0,
      left: SCREEN_W / 2 - DELETE_ZONE_SIZE,
      width: DELETE_ZONE_SIZE * 2, height: DELETE_ZONE_SIZE + 20,
      alignItems: "center", justifyContent: "center",
    }}>
      <View style={{
        width: DELETE_ZONE_SIZE, height: DELETE_ZONE_SIZE,
        borderRadius: DELETE_ZONE_SIZE / 2,
        backgroundColor: dragOver ? EditorColors.destructive + "30" : EditorSemantic.glass,
        alignItems: "center", justifyContent: "center",
        borderWidth: 2,
        borderColor: dragOver ? EditorColors.destructive : EditorSemantic.glassBorder,
        transform: [{ scale: dragOver ? 1.15 : 1 }],
      }}>
        <Ionicons name="trash-outline" size={Math.min(24, SCREEN_W * 0.06)} color={dragOver ? EditorColors.destructive : EditorColors.mutedText} />
      </View>
      <Text style={{
        color: dragOver ? EditorColors.destructive : EditorColors.mutedText,
        fontSize: Math.min(9, SCREEN_W * 0.024), fontWeight: "700", marginTop: 6,
        letterSpacing: 1.5,
      }}>
        {dragOver ? "RELEASE TO DELETE" : "DRAG TO DELETE"}
      </Text>
    </Animated.View>
  );
}

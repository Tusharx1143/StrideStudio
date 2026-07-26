import { Text, View, Pressable, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { AppFonts } from "@/constants/fonts";

type GradientAvatarProps = {
  initials: string;
  size?: number;
  onPress?: () => void;
};

export function GradientAvatar({ initials, size = 38, onPress }: GradientAvatarProps) {
  const fontSize = size * 0.34;

  const content = (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="avatar-grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FF6B35" />
            <Stop offset="100%" stopColor="#6E2A10" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#avatar-grad)" />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.centered}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: AppFonts.archivo.black,
    color: "#FFFFFF",
  },
});

// Fallback for using MaterialIcons on Android and web.

import { MaterialIcons } from "@expo/vector-icons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;
export type { IconSymbolName };

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "pencil.circle.fill": "edit",
  "square.grid.2x2.fill": "grid-on",
  "person.fill": "person",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "gear": "settings",
  "heart.fill": "favorite",
  "arrow.clockwise": "refresh",
  // Sport/activity icons
  "figure.run": "directions-run",
  "bicycle": "directions-bike",
  "figure.strengthtraining.traditional": "fitness-center",
  // Map/route icons
  "map.fill": "map",
  "location.fill": "my-location",
  // Stats icons
  "flame.fill": "local-fire-department",
  "clock.fill": "access-time",
  "mountain.2.fill": "terrain",
  "speedometer": "speed",
  // Trophy / achievement
  "trophy.fill": "emoji-events",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/lib/_core/theme";

export interface StatCardProps {
  /** Icon element to display (use Ionicons or IconSymbol) */
  icon: React.ReactNode;
  /** Stat label (e.g., "Distance", "Elevation", "Activities") */
  label: string;
  /** Primary stat value */
  value: string;
  /** Optional trend indicator: "up", "down", or null */
  trend?: "up" | "down" | null;
  /** Optional accent color override */
  color?: string;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable stat card for displaying a metric with icon, label, and value.
 * Used across activity detail, profile, and home screens.
 */
export function StatCard({
  icon,
  label,
  value,
  trend,
  color,
  style,
}: StatCardProps) {
  const colors = useColors();
  const accentColor = color ?? colors.primary;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          minWidth: 100,
          flex: 1,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
      </View>
      <Text
        style={[Typography.stat, { color: colors.foreground, marginBottom: 2 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
        {trend && (
          <Text style={{ color: trend === "up" ? colors.success : colors.error, fontSize: 16 }}>
            {" "}{trend === "up" ? "▲" : "▼"}
          </Text>
        )}
      </Text>
      <Text style={[Typography.caption, { color: colors.muted, textTransform: "uppercase" }]}>
        {label}
      </Text>
    </View>
  );
}

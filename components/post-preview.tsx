import { Text, View } from "react-native";
import { Activity, Template, StatToggles, formatDuration, formatPace } from "@/lib/app-data";

/**
 * Renders a live preview of the shareable post: the selected template style
 * applied to the selected activity's stats. This is a pure component used by
 * both the Editor preview and the saved-post flow.
 */
export function PostPreview({
  activity,
  template,
  toggles,
}: {
  activity: Activity;
  template: Template;
  toggles: StatToggles;
}) {
  const accent = template.accentColor;
  const isBold = template.style === "bold";
  const isGradient = template.style === "gradient";
  const isOutline = template.style === "outline";

  const stats: { label: string; value: string }[] = [];
  if (toggles.distance && activity.distance > 0)
    stats.push({ label: "DISTANCE", value: `${activity.distance.toFixed(1)} km` });
  if (toggles.duration) stats.push({ label: "TIME", value: formatDuration(activity.duration) });
  if (toggles.pace && activity.pace != null) stats.push({ label: "PACE", value: formatPace(activity.pace) });
  if (toggles.pace && activity.speed != null)
    stats.push({ label: "SPEED", value: `${activity.speed.toFixed(1)} km/h` });
  if (toggles.elevation && activity.elevation != null)
    stats.push({ label: "ELEV", value: `${activity.elevation} m` });
  if (toggles.heartRate && activity.heartRate != null)
    stats.push({ label: "AVG HR", value: `${activity.heartRate} bpm` });
  if (toggles.calories && activity.calories != null)
    stats.push({ label: "KCAL", value: `${activity.calories}` });

  return (
    <View
      style={{
        aspectRatio: 9 / 16,
        width: "100%",
        maxWidth: 240,
        alignSelf: "center",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: isGradient ? "#1e1b4b" : "#0A0A0A",
        borderWidth: isOutline ? 2 : 1,
        borderColor: isOutline ? accent : "#2A2A2A",
        padding: 16,
        justifyContent: "space-between",
      }}
    >
      {/* Header */}
      <View>
        <Text
          style={{
            color: accent,
            fontSize: isBold ? 22 : 16,
            fontWeight: isBold ? "900" : "600",
            fontStyle: template.style === "minimal" ? "italic" : "normal",
          }}
        >
          {activity.title}
        </Text>
        <Text style={{ color: "#888888", fontSize: 10, marginTop: 2 }}>{activity.date} · AURA</Text>
      </View>

      {/* Simulated route line */}
      {activity.type !== "workout" && (
        <View style={{ alignItems: "center", opacity: 0.9 }}>
          <Text style={{ fontSize: 44 }}>{activity.type === "run" ? "〰️" : "➰"}</Text>
        </View>
      )}

      {/* Stats grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {stats.length === 0 ? (
          <Text style={{ color: "#666666", fontSize: 11 }}>Enable stats to display</Text>
        ) : (
          stats.map((s) => (
            <View key={s.label} style={{ minWidth: "45%" }}>
              <Text style={{ color: "#777777", fontSize: 9, letterSpacing: 1.5 }}>{s.label}</Text>
              <Text
                style={{
                  color: accent,
                  fontSize: isBold ? 20 : 16,
                  fontWeight: isBold ? "900" : "700",
                  marginTop: 1,
                }}
              >
                {s.value}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

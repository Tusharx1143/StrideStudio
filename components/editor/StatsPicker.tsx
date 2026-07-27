/**
 * StatsPicker — grouped, searchable Strava metric picker.
 *
 * Features:
 * - Metrics grouped by category (Running, Performance, Elevation, etc.)
 * - Search bar at top for quick filtering
 * - Live preview showing current value for the active activity
 * - Dimmed entries for metrics not available on the current activity
 * - Instant apply on tap
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useCanvas } from "@/lib/canvas-state";
import { useApp } from "@/lib/app-context";
import {
  METRICS,
  METRIC_GROUPS,
  getMetricsByGroup,
  formatMetricValue,
  getMetric,
} from "@/lib/lenses/metrics";
import { useColors } from "@/hooks/use-colors";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";
import type { MetricGroupId } from "@/lib/lenses/types";

// ── Props ──

interface StatsPickerProps {
  /** Optional: bind to a specific layer (defaults to selected) */
  layerId?: string;
  onSelect?: (metricId: string) => void;
}

// ── Component ──

export function StatsPicker({ layerId, onSelect }: StatsPickerProps) {
  const colors = useColors();
  const { bindMetric, selectedLayerId, layers } = useCanvas();
  const { getSelectedActivity } = useApp();
  const [search, setSearch] = useState("");

  const activity = getSelectedActivity();
  const targetLayerId = layerId ?? selectedLayerId;
  const currentBinding = useMemo(() => {
    if (!targetLayerId) return undefined;
    const layer = layers.find((l) => l.id === targetLayerId);
    return layer?.boundMetricId;
  }, [targetLayerId, layers]);

  // Build sections
  const sections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return METRIC_GROUPS.map((group) => {
      let metrics = getMetricsByGroup(group.id as MetricGroupId);
      if (q) {
        metrics = metrics.filter(
          (m) =>
            m.label.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.unit.toLowerCase().includes(q),
        );
      }
      return {
        title: group.label,
        icon: group.icon,
        data: metrics,
      };
    }).filter((s) => s.data.length > 0);
  }, [search]);

  const handleSelect = useCallback(
    (metricId: string) => {
      if (targetLayerId) {
        bindMetric(targetLayerId, metricId);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
        if (onSelect) onSelect(metricId);
      }
    },
    [targetLayerId, bindMetric, onSelect],
  );

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: (typeof METRICS)[number];
    }) => {
      const isActive = currentBinding === item.id;
      const value = formatMetricValue(item.id, activity);
      const isPlaceholder = value === "—" || value === "Not specified";

      return (
        <TouchableOpacity
          onPress={() => handleSelect(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Select metric: ${item.label}`}
          style={[
            styles.metricRow,
            isActive && {
              backgroundColor: "rgba(249,115,22,0.12)",
              borderColor: colors.primary,
            },
            isPlaceholder && { opacity: 0.45 },
          ]}
        >
          {/* Icon */}
          <Text style={styles.metricIcon}>{item.icon}</Text>

          {/* Label + unit */}
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricUnit}>
              {item.unit ? `in ${item.unit}` : " "}
            </Text>
          </View>

          {/* Live preview value */}
          <View style={styles.valueContainer}>
            <Text
              style={[
                styles.metricValue,
                isActive && { color: colors.primary },
              ]}
            >
              {value}
            </Text>
            {/* Preview indicator */}
            {!isPlaceholder && (
              <Text style={styles.previewHint}>◁ preview</Text>
            )}
          </View>

          {/* Active indicator */}
          {isActive && (
            <View
              style={[
                styles.activeDot,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    },
    [currentBinding, activity, colors.primary, handleSelect],
  );

  // Empty state
  if (sections.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No metrics found</Text>
        <Text style={styles.emptyDesc}>
          Try a different search term
        </Text>
      </View>
    );
  }

  if (!targetLayerId) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>👆</Text>
        <Text style={styles.emptyTitle}>Select a layer first</Text>
        <Text style={styles.emptyDesc}>
          Tap a stat on the canvas to bind it to a metric
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, gap: 10 }}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search metrics..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Metrics list */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title, icon } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{icon}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 13,
    color: "#FFFFFF",
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: FONT_UI,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 3,
  },
  metricIcon: {
    fontSize: 16,
    width: 24,
    textAlign: "center",
  },
  metricLabel: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 12.5,
    color: "#FFFFFF",
  },
  metricUnit: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
  },
  valueContainer: {
    alignItems: "flex-end",
    gap: 1,
  },
  metricValue: {
    fontFamily: FONT_MONO,
    fontWeight: "700",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  previewHint: {
    fontFamily: FONT_UI,
    fontWeight: "600",
    fontSize: 7.5,
    letterSpacing: 0.1 * 7.5,
    color: "rgba(255,255,255,0.25)",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FONT_UI,
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyDesc: {
    fontFamily: FONT_UI,
    fontWeight: "500",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});

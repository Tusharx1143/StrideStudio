/**
 * Lens system — barrel export.
 *
 * The v2 Lens system replaces the sticker-only system with dynamic
 * design presets that include layouts, palettes, typography, and
 * Strava metric bindings — inspired by Snapchat Lenses.
 */
export type {
  LensDef,
  LensContext,
  LensLayerDef,
  LensLayerType,
  LensCategory,
  LensUsage,
  StravaMetric,
  MetricGroup,
  MetricGroupId,
  MetricBinding,
  TextStyle,
  QuickStylePreset,
} from "./types";
export {
  METRICS,
  METRIC_GROUPS,
  getMetric,
  getMetricsByGroup,
  getAvailableMetrics,
  getMetricsForActivityType,
  formatMetricValue,
} from "./metrics";
export {
  LENS_CATEGORIES,
  getCategory,
  getOrderedCategories,
} from "./lens-categories";
export {
  LENSES,
  QUICK_STYLES,
  getLens,
  getLensesByCategory,
  getLensesBySport,
  searchLenses,
  getQuickStyle,
} from "./registry";

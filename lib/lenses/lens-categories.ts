/**
 * Lens categories — organizes lenses into browsable groups.
 *
 * Static categories group lenses by sport/metric focus.
 * Dynamic categories (Recently Used, Favorites, Trending) are filtered at runtime.
 */
import type { LensCategory } from "./types";

export const LENS_CATEGORIES: LensCategory[] = [
  // ── Dynamic categories ──
  { id: "recent", label: "Recent", icon: "🕐", dynamic: true },
  { id: "favorites", label: "Favorites", icon: "⭐", dynamic: true },
  { id: "trending", label: "Trending", icon: "🔥", dynamic: true },

  // ── Metric-focused categories ──
  { id: "distance", label: "Distance", icon: "📏", dynamic: false },
  { id: "pace", label: "Pace", icon: "⏱️", dynamic: false },
  { id: "time", label: "Time", icon: "⏰", dynamic: false },
  { id: "elevation", label: "Elevation", icon: "⛰️", dynamic: false },
  { id: "heart_rate", label: "Heart Rate", icon: "❤️", dynamic: false },
  { id: "multi", label: "Multi-Stat", icon: "📊", dynamic: false },
  { id: "date", label: "Date & Place", icon: "📅", dynamic: false },

  // ── Sport-specific categories ──
  { id: "cycling", label: "Cycling", icon: "🚴", dynamic: false },
  { id: "running", label: "Running", icon: "🏃", dynamic: false },
  { id: "swimming", label: "Swimming", icon: "🏊", dynamic: false },
  { id: "hiking", label: "Hiking", icon: "🥾", dynamic: false },
  { id: "gym", label: "Gym", icon: "💪", dynamic: false },
  { id: "totals", label: "Totals", icon: "📈", dynamic: false },

  // ── Style categories ──
  { id: "minimal", label: "Minimal", icon: "◻️", dynamic: false },
  { id: "bold", label: "Bold", icon: "🔲", dynamic: false },
  { id: "glass", label: "Glass", icon: "🪟", dynamic: false },
  { id: "neon", label: "Neon", icon: "💡", dynamic: false },
];

/** Category display order in the carousel filter bar */
export const CATEGORY_ORDER = [
  "recent",
  "favorites",
  "trending",
  "distance",
  "pace",
  "time",
  "elevation",
  "heart_rate",
  "multi",
  "cycling",
  "running",
  "swimming",
  "hiking",
  "gym",
  "totals",
  "minimal",
  "bold",
  "glass",
  "neon",
];

export function getCategory(id: string): LensCategory | undefined {
  return LENS_CATEGORIES.find((c) => c.id === id);
}

export function getOrderedCategories(): LensCategory[] {
  return CATEGORY_ORDER
    .map((id) => getCategory(id))
    .filter((c): c is LensCategory => c !== undefined);
}

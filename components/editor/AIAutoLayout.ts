/**
 * AI Auto Layout — smart stat placement based on image analysis.
 *
 * Analyzes the selected photo to identify faces, text, and key subjects,
 * then positions Lens stat elements in visually optimal areas.
 *
 * Currently provides heuristic placement as a foundation.
 * Future: on-device ML (MLKit / Vision framework) for face/subject detection.
 *
 * Architecture:
 * - `analyzeImage(uri)` → returns zones of interest (faces, text, focus areas)
 * - `computeLayout(analysis, stats)` → returns optimal positions for each stat
 * - Falls back gracefully if analysis fails or returns nothing useful
 */
import type { CanvasLayer } from "@/lib/canvas-state";
import type { Activity } from "@/shared/types";

// ── Types ──

export interface ImageZone {
  type: "face" | "text" | "subject" | "sky" | "ground" | "open";
  x: number; // fraction 0-1
  y: number;
  w: number;
  h: number;
  confidence: number; // 0-1
}

export interface ImageAnalysis {
  width: number;
  height: number;
  zones: ImageZone[];
  dominantColors: string[];
  /** Whether the image has a clear focal point */
  hasFocalPoint: boolean;
  focalPoint?: { x: number; y: number };
}

export interface LayouSuggestion {
  layerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// ── Rule-of-thirds zones (fallback when no analysis available) ──

const THIRDS_ZONES = [
  // Top-left intersection (good for secondary stats)
  { x: 0.25, y: 0.25, priority: 3 },
  // Top-right intersection
  { x: 0.75, y: 0.25, priority: 2 },
  // Bottom-left intersection
  { x: 0.25, y: 0.75, priority: 4 },
  // Bottom-right intersection (good for primary stat)
  { x: 0.75, y: 0.75, priority: 1 },
  // Top-centre (good for labels)
  { x: 0.5, y: 0.12, priority: 5 },
  // Bottom-centre (good for branding)
  { x: 0.5, y: 0.88, priority: 6 },
];

// ── Analysis (heuristic — replaces ML until on-device is added) ──

/**
 * Analyze an image URI and return structured zone data.
 * Currently returns a heuristic result. Future: MLKit face detection.
 */
export async function analyzeImage(
  uri: string,
): Promise<ImageAnalysis> {
  // TODO: Integrate MLKit / Vision for face + text detection
  // For now, return a generic analysis with no detected subjects
  return {
    width: 1080,
    height: 1920,
    zones: [
      // Simulate open areas where stats won't be obstructed
      { type: "open", x: 0.05, y: 0.05, w: 0.4, h: 0.3, confidence: 0.8 },
      { type: "open", x: 0.55, y: 0.6, w: 0.4, h: 0.35, confidence: 0.7 },
      { type: "open", x: 0.05, y: 0.7, w: 0.45, h: 0.25, confidence: 0.6 },
    ],
    dominantColors: ["#FFFFFF", "#333333", "#FF6B35"],
    hasFocalPoint: false,
  };
}

// ── Layout Computation ──

/**
 * Compute optimal stat layout based on image analysis and Lens layers.
 * Avoids faces/subjects, uses rule-of-thirds, and places primary stats
 * in high-visibility zones.
 *
 * @param analysis - Image analysis result (or null for fallback)
 * @param layerCount - Number of stat layers to position
 * @param primaryStatIndex - Index of the most important stat (0 = first)
 * @returns Array of { x, y, scale, rotation } in pixel-space
 */
export function computeLayout(
  analysis: ImageAnalysis | null,
  layerCount: number,
  primaryStatIndex: number = 0,
): Array<{ x: number; y: number; scale: number; rotation: number }> {
  // Get available zones (avoid faces, subjects, text)
  const availableZones = analysis
    ? analysis.zones
        .filter((z) => z.type === "open" || z.type === "sky" || z.type === "ground")
        .sort((a, b) => b.confidence - a.confidence)
    : [];

  // Fall back to rule-of-thirds if no analysis or no usable zones
  if (!analysis || availableZones.length === 0) {
    return computeFallbackLayout(layerCount, primaryStatIndex);
  }

  // Place primary stat in the highest-confidence open zone
  const positions: Array<{ x: number; y: number; scale: number; rotation: number }> = [];
  const usedZones: Set<number> = new Set();

  for (let i = 0; i < layerCount; i++) {
    const zoneIndex = i < availableZones.length ? i : (i % availableZones.length);
    const zone = availableZones[zoneIndex];

    if (i === primaryStatIndex) {
      // Primary stat: centre in the zone, slightly larger
      positions.push({
        x: Math.round((zone.x + zone.w / 2) * 1080),
        y: Math.round((zone.y + zone.h / 2) * 1920),
        scale: 1.15,
        rotation: 0,
      });
    } else {
      // Secondary stats: spread within the zone
      const offsetX = (i * 0.1) % 0.3;
      const offsetY = (i * 0.08) % 0.2;
      positions.push({
        x: Math.round((zone.x + offsetX) * 1080),
        y: Math.round((zone.y + offsetY) * 1920),
        scale: 0.9,
        rotation: 0,
      });
    }
  }

  return positions;
}

/**
 * Fallback layout using rule-of-thirds zones.
 * Ensures stats are always placed reasonably even without image analysis.
 */
function computeFallbackLayout(
  layerCount: number,
  primaryStatIndex: number,
): Array<{ x: number; y: number; scale: number; rotation: number }> {
  const positions: Array<{ x: number; y: number; scale: number; rotation: number }> = [];

  // Sort zones by priority (lower number = higher priority)
  const sortedZones = [...THIRDS_ZONES].sort((a, b) => a.priority - b.priority);

  for (let i = 0; i < layerCount; i++) {
    const zone = sortedZones[i % sortedZones.length];
    const isPrimary = i === primaryStatIndex;

    positions.push({
      x: Math.round(zone.x * 1080),
      y: Math.round(zone.y * 1920),
      scale: isPrimary ? 1.2 : 0.9,
      rotation: 0,
    });
  }

  return positions;
}

// ── Smart Color Extraction (placeholder) ──

export interface ExtractedPalette {
  colors: string[];
  mood: "warm" | "cool" | "neutral" | "vibrant" | "muted";
  primary: string;
  accent: string;
}

/**
 * Extract a harmonious color palette from an image.
 * Currently returns defaults. Future: on-device color quantization.
 */
export async function extractColors(uri: string): Promise<ExtractedPalette> {
  // TODO: Implement color quantization from image bitmap
  // For now, return a generic vibrant palette
  return {
    colors: ["#FFFFFF", "#FF6B35", "#333333", "#F5F5F5", "#0A0A0A"],
    mood: "vibrant",
    primary: "#FFFFFF",
    accent: "#FF6B35",
  };
}

// ── Suggest which metrics to show based on activity type ──

export function suggestMetricsForActivity(
  activity: Activity,
): string[] {
  switch (activity.type) {
    case "run":
      return ["distance", "pace", "moving_time", "elevation_gain", "avg_heart_rate"];
    case "ride":
      return ["distance", "speed", "moving_time", "elevation_gain", "power"];
    case "workout":
      return ["calories", "avg_heart_rate", "moving_time", "suffer_score"];
    default:
      return ["distance", "moving_time", "avg_heart_rate"];
  }
}

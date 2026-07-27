/**
 * Lens registry — converts existing sticker templates into Lens definitions.
 *
 * Each Lens wraps an existing sticker render function with metadata about
 * which metrics it displays, its category, and default styling.
 * This bridges the old "sticker" system with the new "Lens" architecture.
 */
import type { LensDef, LensContext, QuickStylePreset } from "./types";
import { STICKERS } from "@/lib/stickers/registry";
import { getPalette } from "@/lib/stickers/palettes";
import { FONT_UI, FONT_MONO } from "@/lib/_core/theme";

// ── Quick Style Presets ───────────────────────────────────────

export const QUICK_STYLES: QuickStylePreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    icon: "◻️",
    description: "Clean, white, maximum whitespace, thin fonts",
    paletteId: "mono",
    fontFamily: FONT_UI,
    fontWeight: "400",
    textTransform: "uppercase",
  },
  {
    id: "neon",
    name: "Neon",
    icon: "💡",
    description: "Vibrant neon colors, glow effects, bold type",
    paletteId: "neon",
    fontFamily: FONT_UI,
    fontWeight: "800",
    textTransform: "uppercase",
    shadow: true,
  },
  {
    id: "marathon",
    name: "Marathon",
    icon: "🏅",
    description: "High-contrast race-day theme",
    paletteId: "stride",
    fontFamily: FONT_MONO,
    fontWeight: "700",
    textTransform: "uppercase",
    border: true,
  },
  {
    id: "trail",
    name: "Trail",
    icon: "🌲",
    description: "Earth tones, rugged textures, organic shapes",
    paletteId: "gold",
    fontFamily: FONT_UI,
    fontWeight: "600",
    textTransform: "none",
  },
  {
    id: "premium",
    name: "Premium",
    icon: "✨",
    description: "Metallic accents, refined spacing",
    paletteId: "gold",
    fontFamily: "serif",
    fontWeight: "400",
    textTransform: "none",
  },
  {
    id: "dark",
    name: "Dark",
    icon: "🌙",
    description: "Pure black background, white text, high contrast",
    paletteId: "mono",
    fontFamily: FONT_UI,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  {
    id: "white",
    name: "White",
    icon: "☀️",
    description: "Clean white background, dark text",
    paletteId: "stride",
    fontFamily: FONT_UI,
    fontWeight: "600",
    textTransform: "none",
  },
  {
    id: "gradient",
    name: "Gradient",
    icon: "🌈",
    description: "Full-bleed gradient backgrounds, white text",
    paletteId: "mint",
    fontFamily: FONT_UI,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  {
    id: "glass",
    name: "Glass",
    icon: "🪟",
    description: "Frosted glass effect, blurred backdrop",
    paletteId: "mono",
    fontFamily: FONT_UI,
    fontWeight: "500",
    textTransform: "none",
    blur: true,
  },
  {
    id: "bold",
    name: "Bold",
    icon: "🔲",
    description: "Heavy typography, solid color blocks, big numbers",
    paletteId: "stride",
    fontFamily: FONT_UI,
    fontWeight: "900",
    textTransform: "uppercase",
    border: true,
  },
];

// ── Convert existing stickers to Lenses ───────────────────────

const STICKER_CATEGORY_LENS_MAP: Record<string, string> = {
  distance: "distance",
  pace: "pace",
  time: "time",
  hr: "heart_rate",
  elev: "elevation",
  splits: "pace",
  route: "multi",
  achievement: "multi",
  totals: "totals",
  date: "date",
  gear: "multi",
  weather: "multi",
  multi: "multi",
};

/** Infer lens category from sticker category */
function stickerCatToLensCat(stickerCat: string): string {
  return STICKER_CATEGORY_LENS_MAP[stickerCat] ?? "multi";
}

/** Build a LensDef from a StickerDef */
function stickerToLens(s: (typeof STICKERS)[number]): LensDef {
  const lensCat = stickerCatToLensCat(s.cat);

  // Extract metric features from the sticker's category
  const featureMap: Record<string, string[]> = {
    distance: ["distance"],
    pace: ["pace"],
    time: ["moving_time", "elapsed_time"],
    hr: ["avg_heart_rate", "max_heart_rate"],
    elev: ["elevation_gain", "max_elevation"],
    splits: ["pace", "splits"],
    route: ["distance", "elevation_gain"],
    achievement: ["achievement_count", "pr_count"],
    totals: ["distance"],
    date: ["date", "activity_type"],
    multi: ["distance", "pace", "moving_time", "avg_heart_rate"],
  };

  const features = featureMap[s.cat] ?? ["distance"];

  // Map sticker theme → sport sub-category
  const themeSportMap: Record<string, string> = {
    led: "multi",
    mono: "running",
    terminal: "cycling",
    glass: "multi",
    chart: "multi",
    poster: "running",
    tape: "hiking",
    serif: "multi",
  };

  return {
    id: s.id,
    name: s.name,
    category: lensCat,
    sport: themeSportMap[s.theme] ?? "multi",
    description: `${s.name} — ${s.theme} style`,
    thumbnail: (ctx: LensContext) => s.render({
      a: ctx.a,
      t: ctx.t,
      u: ctx.u,
      c: ctx.c,
      layer: undefined,
    }),
    render: (ctx: LensContext) => s.render({
      a: ctx.a,
      t: ctx.t,
      u: ctx.u,
      c: ctx.c,
      layer: { text: undefined },
    }),
    defaultPalette: "stride",
    defaultFont: FONT_UI,
    layers: [],
    features,
    tags: [s.cat, s.theme, ...features],
  };
}

// ── Build the full lens registry ──────────────────────────────

export const LENSES: LensDef[] = STICKERS.map(stickerToLens);

// ── Lookup helpers ────────────────────────────────────────────

export function getLens(id: string): LensDef | undefined {
  return LENSES.find((l) => l.id === id);
}

export function getLensesByCategory(category: string): LensDef[] {
  if (category === "all") return LENSES;
  return LENSES.filter(
    (l) => l.category === category || l.tags.includes(category),
  );
}

export function getLensesBySport(sport: string): LensDef[] {
  if (sport === "all") return LENSES;
  return LENSES.filter((l) => l.sport === sport || l.tags.includes(sport));
}

export function searchLenses(query: string): LensDef[] {
  const q = query.toLowerCase();
  return LENSES.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.tags.some((t) => t.includes(q)) ||
      l.description.toLowerCase().includes(q),
  );
}

export function getQuickStyle(id: string): QuickStylePreset | undefined {
  return QUICK_STYLES.find((s) => s.id === id);
}

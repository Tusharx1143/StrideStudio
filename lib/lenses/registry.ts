/**
 * Lens registry — converts existing dynamic templates into Lens definitions.
 *
 * Each Lens wraps an existing template render function with metadata about
 * which metrics it displays, its category, and default styling.
 * This bridges the template system with the Lens architecture.
 */
import type { LensDef, LensContext, QuickStylePreset } from "./types";
import { DYNAMIC_TEMPLATES, type TemplateDef } from "@/lib/templates";
import { Fonts } from "@/lib/_core/theme";
const FONT_UI = Fonts.sans;
const FONT_MONO = Fonts.mono;
import type { WeekTotals } from "@/lib/templates/shared/types";

// ── Quick Style Presets ───────────────────────────────────────

export const QUICK_STYLES: QuickStylePreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    icon: "◻️",
    description: "Clean, white, maximum whitespace, thin fonts",
    paletteId: "minimal-mono",
    fontFamily: FONT_UI,
    fontWeight: "400",
    textTransform: "uppercase",
  },
  {
    id: "neon",
    name: "Neon",
    icon: "💡",
    description: "Vibrant neon colors, glow effects, bold type",
    paletteId: "neon-pop",
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
    paletteId: "bright-white",
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
    paletteId: "warm-gold",
    fontFamily: FONT_UI,
    fontWeight: "600",
    textTransform: "none",
  },
  {
    id: "premium",
    name: "Premium",
    icon: "✨",
    description: "Metallic accents, refined spacing",
    paletteId: "warm-gold",
    fontFamily: "serif",
    fontWeight: "400",
    textTransform: "none",
  },
  {
    id: "dark",
    name: "Dark",
    icon: "🌙",
    description: "Pure black background, white text, high contrast",
    paletteId: "minimal-mono",
    fontFamily: FONT_UI,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  {
    id: "white",
    name: "White",
    icon: "☀️",
    description: "Clean white background, dark text",
    paletteId: "bright-white",
    fontFamily: FONT_UI,
    fontWeight: "600",
    textTransform: "none",
  },
  {
    id: "gradient",
    name: "Gradient",
    icon: "🌈",
    description: "Full-bleed gradient backgrounds, white text",
    paletteId: "cool-mint",
    fontFamily: FONT_UI,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  {
    id: "glass",
    name: "Glass",
    icon: "🪟",
    description: "Frosted glass effect, blurred backdrop",
    paletteId: "minimal-mono",
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
    paletteId: "bright-white",
    fontFamily: FONT_UI,
    fontWeight: "900",
    textTransform: "uppercase",
    border: true,
  },
];

// ── Category inference from template metadata ─────────────────

const TAB_LENS_MAP: Record<string, string> = {
  activity: "multi",
  totals: "totals",
};

const NAME_CATEGORY_MAP: Record<string, string> = {
  distance: "distance",
  pace: "pace",
  time: "time",
  heart: "heart_rate",
  hr: "heart_rate",
  elevation: "elevation",
  elev: "elevation",
  splits: "pace",
  route: "multi",
  achievement: "multi",
  date: "date",
};

/** Infer lens category from template name/id */
function inferCategory(tpl: TemplateDef): string {
  const nameLower = tpl.name.toLowerCase();
  const idLower = tpl.id.toLowerCase();

  // Check tab first (totals is a category)
  const tabCat = TAB_LENS_MAP[tpl.tab];
  if (tpl.tab === "totals") return tabCat;

  // Try matching name/id against known categories
  for (const [keyword, cat] of Object.entries(NAME_CATEGORY_MAP)) {
    if (nameLower.includes(keyword) || idLower.includes(keyword)) return cat;
  }

  return "multi";
}

// ── Feature inference ─────────────────────────────────────────

const CATEGORY_FEATURES: Record<string, string[]> = {
  distance: ["distance"],
  pace: ["pace", "splits"],
  time: ["moving_time", "elapsed_time"],
  heart_rate: ["avg_heart_rate", "max_heart_rate"],
  elevation: ["elevation_gain", "max_elevation", "avg_grade"],
  totals: ["distance", "moving_time", "calories"],
  multi: ["distance", "pace", "moving_time", "avg_heart_rate"],
};

function inferFeatures(tpl: TemplateDef): string[] {
  const cat = inferCategory(tpl);
  return CATEGORY_FEATURES[cat] ?? ["distance"];
}

function inferSport(tpl: TemplateDef): string {
  const nameLower = tpl.name.toLowerCase();
  if (nameLower.includes("run") || nameLower.includes("pace")) return "running";
  if (nameLower.includes("ride") || nameLower.includes("speed") || nameLower.includes("bike")) return "cycling";
  if (nameLower.includes("swim")) return "swimming";
  if (nameLower.includes("hike") || nameLower.includes("trail")) return "hiking";
  if (nameLower.includes("gym") || nameLower.includes("workout")) return "gym";
  return "multi";
}

// ── Convert templates to Lenses ───────────────────────

function templateToLens(tpl: TemplateDef): LensDef {
  const cat = inferCategory(tpl);
  const features = inferFeatures(tpl);
  const sport = inferSport(tpl);

  return {
    id: tpl.id,
    name: tpl.name.replace(/_/g, " "),
    category: cat,
    sport,
    description: tpl.description || `${tpl.name} — ${tpl.tab}`,
    thumbnail: (ctx: LensContext) => tpl.render(ctx.a, ctx.t, ctx.c),
    render: (ctx: LensContext) => tpl.render(ctx.a, ctx.t, ctx.c),
    defaultPalette: "bright-white",
    defaultFont: FONT_UI,
    layers: [],
    features,
    tags: [tpl.tab, cat, ...features],
  };
}

// ── Build the full lens registry ───────────────────────

export const LENSES: LensDef[] = DYNAMIC_TEMPLATES.map(templateToLens);

// ── Lookup helpers ────────────────────────────────────

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

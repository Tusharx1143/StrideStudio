/**
 * Photo filter presets for image backgrounds.
 *
 * Matches the design-handoff prototype's 6 filters:
 * None, Mono, Warm, Cold, Fade, Punch.
 */
export interface PhotoFilterStyle {
  /** CSS filter string (web-only) */
  filter?: string;
  /** Tint color override (native) */
  tint?: string;
  /** Opacity multiplier */
  opacity?: number;
}

export interface PhotoFilter {
  id: string;
  name: string;
  style: PhotoFilterStyle;
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: "none", name: "None", style: {} },
  {
    id: "mono",
    name: "Mono",
    style: { filter: "grayscale(1) contrast(1.08)", opacity: 1 },
  },
  {
    id: "warm",
    name: "Warm",
    style: { filter: "saturate(1.3) sepia(0.22) contrast(1.05)", opacity: 1 },
  },
  {
    id: "cold",
    name: "Cold",
    style: { filter: "saturate(0.85) hue-rotate(-18deg) brightness(1.04)", opacity: 1 },
  },
  {
    id: "fade",
    name: "Fade",
    style: { filter: "contrast(0.86) brightness(1.1) saturate(0.8)", opacity: 1 },
  },
  {
    id: "punch",
    name: "Punch",
    style: { filter: "contrast(1.25) saturate(1.45)", opacity: 1 },
  },
];

export const DEFAULT_FILTER = PHOTO_FILTERS[0];

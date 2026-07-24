/** Photo filter presets for image backgrounds */

/**
 * Photo filter style properties — applied as CSS filters on web,
 * or as tint/opacity adjustments on native.
 *
 * NOTE: `filter` is a web-only CSS property not present in RN's
 * ImageStyle. Consumers should cast when spreading into Image style
 * arrays on web targets.
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
  { id: "mono", name: "Mono", style: { filter: "grayscale(1)", tint: undefined } },
  { id: "blur", name: "Blur", style: { filter: "blur(3px)", opacity: 0.9 } },
  { id: "motion-blur", name: "Motion", style: { filter: "blur(6px)", opacity: 0.85 } },
  { id: "fisheye", name: "Fisheye", style: { filter: "contrast(1.2) brightness(1.1)", opacity: 0.9 } },
  { id: "portrait", name: "Portrait", style: { filter: "contrast(0.9) saturate(0.8)", opacity: 0.95 } },
];

export const DEFAULT_FILTER = PHOTO_FILTERS[0];

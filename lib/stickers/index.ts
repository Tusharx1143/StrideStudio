/**
 * Sticker system — barrel export.
 *
 * The 54-sticker registry, 6 palettes, formatters, and the salience-driven
 * `fields()` adaptive core. Every sticker is a pure function of
 * (activity, totals, palette, units).
 */
export { STICKERS } from "./registry";
export { PALETTES, getPalette, DEFAULT_PALETTE_ID } from "./palettes";
export {
  dur,
  durWords,
  dist,
  distUnit,
  distUnitShort,
  pace,
  paceUnit,
  speed,
  speedUnit,
  elev,
  elevUnit,
  dateShort,
  dateFull,
  weekday,
  time12,
  typeLabel,
  fields,
  NS,
} from "./formatters";
export type { AvailableField } from "./formatters";
export type {
  StickerDef,
  StickerTheme,
  StickerContext,
  PaletteColors,
  WeekTotals,
} from "./types";
export { STICKER_CATEGORIES, STICKER_THEMES } from "./types";
export { Bars, Sparkline, RouteLine } from "./chart-primitives";

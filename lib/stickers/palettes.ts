/**
 * Sticker colour palettes — 6 presets from the design handoff.
 *
 * Each palette defines ink (primary text), sub (secondary text),
 * accent (highlight), and hair (hairline border) colours.
 */
import type { PaletteColors } from "./types";

export interface PaletteDef {
  id: string;
  name: string;
  colors: PaletteColors;
}

export const PALETTES: PaletteDef[] = [
  {
    id: "stride",
    name: "Stride",
    colors: {
      ink: "#FFFFFF",
      sub: "rgba(255,255,255,0.62)",
      accent: "#FF6B35",
      hair: "rgba(255,255,255,0.20)",
    },
  },
  {
    id: "mono",
    name: "Mono",
    colors: {
      ink: "#FFFFFF",
      sub: "rgba(255,255,255,0.55)",
      accent: "#FFFFFF",
      hair: "rgba(255,255,255,0.24)",
    },
  },
  {
    id: "gold",
    name: "Gold",
    colors: {
      ink: "#FFE9B8",
      sub: "rgba(255,233,184,0.6)",
      accent: "#FFB300",
      hair: "rgba(255,179,0,0.35)",
    },
  },
  {
    id: "mint",
    name: "Mint",
    colors: {
      ink: "#E4FFF2",
      sub: "rgba(228,255,242,0.6)",
      accent: "#00E08A",
      hair: "rgba(0,224,138,0.32)",
    },
  },
  {
    id: "neon",
    name: "Neon",
    colors: {
      ink: "#FFFFFF",
      sub: "rgba(255,255,255,0.6)",
      accent: "#00E5FF",
      hair: "rgba(0,229,255,0.35)",
    },
  },
  {
    id: "ink",
    name: "Ink",
    colors: {
      ink: "#0B0B0C",
      sub: "rgba(11,11,12,0.6)",
      accent: "#FF3B30",
      hair: "rgba(11,11,12,0.22)",
    },
  },
];

export const DEFAULT_PALETTE_ID = "stride";

export function getPalette(id: string): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/**
 * Shared template styling utilities.
 */
import { typeEmoji, typeLabel } from "./helpers";

export { typeEmoji, typeLabel };

/** Text shadow helper — for photo legibility over bright backgrounds */
export function ts(shadowColor: string, fontFamily?: string) {
  const out: Record<string, any> = {
    textShadowColor: shadowColor,
    textShadowOffset: { width: 0, height: 1 } as const,
    textShadowRadius: 2 as const,
  };
  if (fontFamily) out.fontFamily = fontFamily;
  return out;
}

/** Font family conditional helper */
export function ff(fontFamily?: string): Record<string, string> | {} {
  return fontFamily ? { fontFamily } : {};
}

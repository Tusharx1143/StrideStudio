/**
 * StrideStudio design tokens — Snapchat-style workout story editor.
 *
 * Dark-only palette matched to the design handoff prototype.
 * Every token value is lifted directly from the prototype source.
 *
 * Fonts: Archivo (UI), IBM Plex Mono (stats/values), Instrument Serif (editorial)
 * Typography scale, spacing, radii, and control sizes are all authoritative.
 */
/** @type {const} */
const themeColors = {
  // ── Backgrounds ──
  background: { light: '#0A0A0B', dark: '#0A0A0B' },
  surface: { light: '#0E0E10', dark: '#0E0E10' },
  foreground: { light: '#FFFFFF', dark: '#FFFFFF' },

  // ── Brand ──
  primary: { light: '#FF6B35', dark: '#FF6B35' },

  // ── Semantic ──
  muted: { light: '#8E8E93', dark: '#8E8E93' },
  border: { light: '#1C1C1E', dark: '#1C1C1E' },
  success: { light: '#32D74B', dark: '#32D74B' },
  warning: { light: '#FF8A5F', dark: '#FF8A5F' },
  error: { light: '#FF453A', dark: '#FF453A' },
};

module.exports = { themeColors };

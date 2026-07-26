/** @type {const} */
const themeColors = {
  // Brand accent — used for CTAs, active states, stat highlights
  primary: { light: '#FF6B35', dark: '#FF6B35' },
  primarySoft: { light: 'rgba(255,107,53,.14)', dark: 'rgba(255,107,53,.14)' },
  // App shell background (radial-gradient base). Pure #000 is used ad hoc
  // for full-bleed photo/camera canvases (capture, editor, gallery).
  background: { light: '#0A0A0B', dark: '#0A0A0B' },
  canvas: { light: '#000000', dark: '#000000' },
  // Elevated card / row fill
  surface: { light: '#0E0E10', dark: '#0E0E10' },
  // Button / chip fill (one step lighter than surface)
  surfaceAlt: { light: '#16161A', dark: '#16161A' },
  foreground: { light: '#FFFFFF', dark: '#FFFFFF' },
  // Secondary text — iOS-style neutral gray used across list/data screens
  muted: { light: '#8E8E93', dark: '#8E8E93' },
  border: { light: '#1C1C1E', dark: '#1C1C1E' },
  success: { light: '#32D74B', dark: '#32D74B' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#FF453A', dark: '#FF453A' },
  // Strava's own brand orange — kept distinct from our primary accent so
  // "connect to Strava" affordances read as unmistakably Strava's.
  strava: { light: '#FC4C02', dark: '#FC4C02' },
};

module.exports = { themeColors };

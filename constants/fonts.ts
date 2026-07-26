/**
 * Custom type system for the redesign.
 *
 * Archivo carries all display/UI text (headlines, labels, buttons).
 * IBM Plex Mono is reserved for stats and data — distances, paces, times,
 * timestamps — so numbers read as "measured" against the humanist display face.
 * Instrument Serif is a rare accent for editorial/quote moments only.
 *
 * Each React Native <Text> needs the *exact* PostScript name of the loaded
 * weight (RN does not synthesize weights for custom fonts), so we expose one
 * constant per weight rather than a single family + fontWeight pair.
 */
export const AppFonts = {
  archivo: {
    regular: "Archivo_400Regular",
    medium: "Archivo_500Medium",
    semiBold: "Archivo_600SemiBold",
    bold: "Archivo_700Bold",
    extraBold: "Archivo_800ExtraBold",
    black: "Archivo_900Black",
  },
  mono: {
    regular: "IBMPlexMono_400Regular",
    medium: "IBMPlexMono_500Medium",
    semiBold: "IBMPlexMono_600SemiBold",
    bold: "IBMPlexMono_700Bold",
  },
  serif: {
    regular: "InstrumentSerif_400Regular",
    italic: "InstrumentSerif_400Regular_Italic",
  },
} as const;

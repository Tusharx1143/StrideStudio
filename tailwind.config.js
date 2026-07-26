const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

// Mirrors constants/fonts.ts — RN needs the exact PostScript name per weight,
// so each weight gets its own utility (e.g. font-archivo-black, font-mono-bold).
const fontFamily = {
  "archivo-regular": "Archivo_400Regular",
  "archivo-medium": "Archivo_500Medium",
  "archivo-semibold": "Archivo_600SemiBold",
  "archivo-bold": "Archivo_700Bold",
  "archivo-extrabold": "Archivo_800ExtraBold",
  "archivo-black": "Archivo_900Black",
  "mono-regular": "IBMPlexMono_400Regular",
  "mono-medium": "IBMPlexMono_500Medium",
  "mono-semibold": "IBMPlexMono_600SemiBold",
  "mono-bold": "IBMPlexMono_700Bold",
  serif: "InstrumentSerif_400Regular",
  "serif-italic": "InstrumentSerif_400Regular_Italic",
};

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // Scan all component and app files for Tailwind classes
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}", "./hooks/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: tailwindColors,
      fontFamily,
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
    }),
  ],
};

// constants/colors.ts
// Gamified teal/blue palette + dark neutrals (Runna-inspired)

export const colors = {
  // Neutrals
  bg0: "#070B10",          // app background
  surface1: "#0D131B",     // cards
  surface2: "#111A24",     // raised cards / inputs
  strokeSoft: "#1A2430",   // borders/dividers

  textHi: "#E6F1FF",
  textLo: "#8AA0B5",

  // Primary (neon mint/teal)
  primary600: "#17D67F",
  primary500: "#2BF996",
  primary400: "#49FABF",
  primary300: "#88FFD4",

  // Secondary (electric cyan/blue)
  secondary600: "#1C8EE6",
  secondary500: "#2BAEFF",
  secondary400: "#58C6FF",
  secondary300: "#8DE7FF",

  // Support
  warn: "#FF9F1C",
  danger: "#FF4D4F",
  purple: "#A970FF",

  // Glows (use sparingly)
  glowPrimary: "rgba(43, 249, 150, 0.22)",
  glowSecondary: "rgba(88, 198, 255, 0.20)",
} as const;

export type AppColorKey = keyof typeof colors;


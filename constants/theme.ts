// constants/theme.ts
export const colors = {
  /* Core surfaces & text */
  bg0:        "#070B10",
  surface1:   "#0D131B",
  surface2:   "#111A24",
  strokeSoft: "#1A2430",
  textHi:     "#E6F1FF",
  textLo:     "#8AA0B5",

  /* Brand / accent */
  primary600: "#17D67F",
  primary700: "#0DBA6D",
  secondary500: "#58C6FF",
  /* add a purple since some components referenced it */
  purple:     "#A78BFA",

  /* Fun accents used in UI */
  accentBlue:   "#5AA6FF",
  accentTeal:   "#33D1B2",
  accentMint:   "#2BF996",
  accentAmber:  "#F9C846",
  accentRose:   "#FF5A5A",

  /* App-level brand tokens (used by FAB, streak, etc.) */
  brand:     "#12B885",
  brandDim:  "rgba(18,184,133,0.7)",

  /* Glows */
  glowPrimary:   "rgba(47, 243, 150, 0.20)",
  glowSecondary: "rgba(88, 198, 255, 0.20)",
} as const;

const color = {
  bg:   colors.bg0,
  text: colors.textHi,
  dim:  colors.textLo,
  brand: colors.brand,
  brandDim: colors.brandDim,
  macro: {
    calories: colors.accentMint,
    protein:  colors.accentRose,
    carbs:    colors.accentBlue,
    fat:      colors.accentAmber,
  },
} as const;

const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

const shadow = {
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  hard: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

const typography = {
  weightBlack: "900" as const,
  weightBold: "800" as const,
  weightSemibold: "700" as const,
  sizeSm: 12,
  sizeMd: 14,
  sizeLg: 16,
  sizeXl: 18,
  size2Xl: 22,
  size3Xl: 26,
} as const;

/** simple translucent top highlight overlay (no gradient dependency) */
const topHighlight = {
  height: 12,
  backgroundColor: "rgba(255,255,255,0.06)",
} as const;

export const theme = {
  colors,
  color,        // alias for old `theme.color.*` usages
  radii,
  shadow,
  typography,
  topHighlight,
} as const;

export default theme;
export type AppTheme = typeof theme;






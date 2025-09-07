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
  primary500: "#1FEA8D",
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

  /* Status colors */
  warning:   "#F9C846",
  danger:    "#FF5A5A",
  success:   "#2BF996",

  /* Glows */
  glowPrimary:   "rgba(23, 214, 127, 0.20)",
  glowSecondary: "rgba(88, 198, 255, 0.20)",
} as const;

const color = {
  bg:   colors.bg0,
  text: colors.textHi,
  dim:  colors.textLo,
  brand: colors.primary600,
  brandDim: colors.primary500,
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
  lg: 16,
  xl: 24,
  pill: 999,
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
    shadowOpacity: 0.40,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

const layout = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
} as const;

const text = {
  h1: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900" as const,
  },
  h2: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900" as const,
  },
  title: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900" as const,
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
  muted: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700" as const,
  },
} as const;

const gradients = {
  brand: ["#17D67F", "#0CCF9E", "#00B5FF"],
  surface: ["rgba(13, 19, 27, 0.8)", "rgba(13, 19, 27, 0.4)"],
  vignetteTop: "rgba(0, 0, 0, 0.3)",
  vignetteCorners: "rgba(0, 0, 0, 0.2)",
} as const;

/** simple translucent top highlight overlay (no gradient dependency) */
const topHighlight = {
  gradientFrom: "rgba(255,255,255,0.06)",
  gradientTo: "rgba(255,255,255,0.00)",
} as const;

export const theme = {
  colors,
  color,        // alias for old `theme.color.*` usages
  radii,
  shadow,
  layout,
  text,
  gradients,
  topHighlight,
} as const;

export default theme;
export type AppTheme = typeof theme;






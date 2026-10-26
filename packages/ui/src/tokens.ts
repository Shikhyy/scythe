/** Design tokens — faction colour palette */
export const FACTION_COLORS = {
  NORDIC: "#4A90D9",
  RUSVIET: "#D94A4A",
  CRIMEA: "#D9A84A",
  SAXONY: "#2D2D2D",
  POLANIA: "#FFFFFF",
} as const;

export type FactionColorKey = keyof typeof FACTION_COLORS;

/** Spacing scale (rem) */
export const SPACING = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "2rem",
  xl: "4rem",
} as const;

/** Typography scale */
export const FONT_SIZE = {
  sm: "0.875rem",
  base: "1rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "3rem",
} as const;

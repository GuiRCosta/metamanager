/**
 * Design Tokens - Meta Campaign Manager
 *
 * Sistema centralizado de tokens de design para consistência visual.
 * Estes tokens são a fonte de verdade para cores, tipografia, espaçamento, etc.
 */

// =============================================================================
// CORES
// =============================================================================

export const colors = {
  // Brand Colors - Meta inspired
  brand: {
    primary: {
      50: "#E7F0FF",
      100: "#C2D9FF",
      200: "#99BFFF",
      300: "#70A5FF",
      400: "#4791FF",
      500: "#1877F2", // Meta Blue
      600: "#1468D9",
      700: "#0F5ABF",
      800: "#0A4DA6",
      900: "#063F8C",
    },
    secondary: {
      50: "#F0FDF4",
      100: "#DCFCE7",
      200: "#BBF7D0",
      300: "#86EFAC",
      400: "#4ADE80",
      500: "#42B72A", // Meta Green
      600: "#16A34A",
      700: "#15803D",
      800: "#166534",
      900: "#14532D",
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: "#D1FAE5",
      main: "#10B981",
      dark: "#059669",
    },
    warning: {
      light: "#FEF3C7",
      main: "#F59E0B",
      dark: "#D97706",
    },
    error: {
      light: "#FEE2E2",
      main: "#EF4444",
      dark: "#DC2626",
    },
    info: {
      light: "#DBEAFE",
      main: "#3B82F6",
      dark: "#2563EB",
    },
  },

  // Campaign Status Colors
  status: {
    active: "#22C55E",
    paused: "#EAB308",
    archived: "#6B7280",
    draft: "#A855F7",
  },

  // Metric Colors (for charts)
  metrics: {
    spend: "#EF4444",
    impressions: "#3B82F6",
    clicks: "#8B5CF6",
    conversions: "#10B981",
    ctr: "#F59E0B",
    cpc: "#EC4899",
    roas: "#06B6D4",
  },

  // Neutral Colors
  neutral: {
    0: "#FFFFFF",
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },
} as const

// =============================================================================
// TIPOGRAFIA
// =============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },

  // Font Sizes (rem)
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem",    // 48px
  },

  // Font Weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line Heights
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  // Letter Spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
  },
} as const

// =============================================================================
// ESPAÇAMENTO
// =============================================================================

export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",  // 2px
  1: "0.25rem",     // 4px
  1.5: "0.375rem",  // 6px
  2: "0.5rem",      // 8px
  2.5: "0.625rem",  // 10px
  3: "0.75rem",     // 12px
  3.5: "0.875rem",  // 14px
  4: "1rem",        // 16px
  5: "1.25rem",     // 20px
  6: "1.5rem",      // 24px
  7: "1.75rem",     // 28px
  8: "2rem",        // 32px
  9: "2.25rem",     // 36px
  10: "2.5rem",     // 40px
  11: "2.75rem",    // 44px
  12: "3rem",       // 48px
  14: "3.5rem",     // 56px
  16: "4rem",       // 64px
  20: "5rem",       // 80px
  24: "6rem",       // 96px
  28: "7rem",       // 112px
  32: "8rem",       // 128px
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: "0",
  sm: "0.125rem",   // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem",   // 6px
  lg: "0.5rem",     // 8px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
} as const

// =============================================================================
// SOMBRAS
// =============================================================================

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  // Colored shadows
  primary: "0 4px 14px 0 rgba(24, 119, 242, 0.39)",
  success: "0 4px 14px 0 rgba(16, 185, 129, 0.39)",
  error: "0 4px 14px 0 rgba(239, 68, 68, 0.39)",
} as const

// =============================================================================
// ANIMAÇÕES
// =============================================================================

export const animation = {
  // Durations
  duration: {
    fastest: "50ms",
    faster: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
    slowest: "500ms",
  },

  // Easing
  easing: {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const components = {
  // Card
  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
  },

  // Button
  button: {
    height: {
      sm: "2rem",      // 32px
      md: "2.5rem",    // 40px
      lg: "3rem",      // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,
      md: `${spacing[2.5]} ${spacing[4]}`,
      lg: `${spacing[3]} ${spacing[6]}`,
    },
    borderRadius: borderRadius.md,
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.sm,
      lg: typography.fontSize.base,
    },
  },

  // Input
  input: {
    height: "2.5rem",  // 40px
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
  },

  // Badge
  badge: {
    padding: `${spacing[0.5]} ${spacing[2.5]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
  },

  // Avatar
  avatar: {
    size: {
      sm: "2rem",      // 32px
      md: "2.5rem",    // 40px
      lg: "3rem",      // 48px
      xl: "4rem",      // 64px
    },
  },

  // Sidebar
  sidebar: {
    width: "16rem",    // 256px
    collapsedWidth: "4rem", // 64px
  },
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Converte um valor de spacing para pixels
 */
export function spacingToPx(value: keyof typeof spacing): number {
  const remValue = spacing[value]
  if (remValue === "0" || remValue === "1px") {
    return remValue === "1px" ? 1 : 0
  }
  return parseFloat(remValue) * 16
}

/**
 * Retorna a cor de status da campanha
 */
export function getCampaignStatusColor(status: string): string {
  const statusLower = status.toLowerCase()
  return colors.status[statusLower as keyof typeof colors.status] || colors.neutral[500]
}

/**
 * Retorna a cor da métrica
 */
export function getMetricColor(metric: string): string {
  return colors.metrics[metric as keyof typeof colors.metrics] || colors.brand.primary[500]
}

// =============================================================================
// EXPORTS
// =============================================================================

export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  zIndex,
  components,
} as const

export type DesignTokens = typeof tokens
export type ColorTokens = typeof colors
export type TypographyTokens = typeof typography
export type SpacingTokens = typeof spacing

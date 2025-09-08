/**
 * Preset Design System - Shadow Tokens
 * Elevation system for depth and hierarchy
 */

// Base shadow scale
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Dark mode shadows (more prominent)
export const darkShadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.15)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.4)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.15)',
} as const;

// Colored shadows for brand elements
export const coloredShadows = {
  // Preset brand green shadows
  preset: {
    sm: '0 1px 3px 0 rgb(0 135 111 / 0.2), 0 1px 2px -1px rgb(0 135 111 / 0.2)',
    md: '0 4px 6px -1px rgb(0 135 111 / 0.15), 0 2px 4px -2px rgb(0 135 111 / 0.15)',
    lg: '0 10px 15px -3px rgb(0 135 111 / 0.1), 0 4px 6px -4px rgb(0 135 111 / 0.1)',
  },
  
  // Creative accent shadows
  creative: {
    amber: {
      sm: '0 1px 3px 0 rgb(245 158 11 / 0.2), 0 1px 2px -1px rgb(245 158 11 / 0.2)',
      md: '0 4px 6px -1px rgb(245 158 11 / 0.15), 0 2px 4px -2px rgb(245 158 11 / 0.15)',
    },
    rose: {
      sm: '0 1px 3px 0 rgb(244 63 94 / 0.2), 0 1px 2px -1px rgb(244 63 94 / 0.2)',
      md: '0 4px 6px -1px rgb(244 63 94 / 0.15), 0 2px 4px -2px rgb(244 63 94 / 0.15)',
    },
  }
} as const;

// Semantic shadows for specific use cases
export const semanticShadows = {
  // Cards and containers
  card: {
    resting: shadows.sm,    // Default card shadow
    hover: shadows.md,      // Card hover state
    active: shadows.lg,     // Card active/selected state
  },
  
  // Interactive elements
  button: {
    primary: coloredShadows.preset.sm,  // Primary button shadow
    secondary: shadows.xs,               // Secondary button shadow
    hover: shadows.md,                   // Button hover state
  },
  
  // Modal and overlay
  modal: shadows.xl,        // Modal backdrop shadow
  dropdown: shadows.lg,     // Dropdown menu shadow
  tooltip: shadows.md,      // Tooltip shadow
  
  // Navigation
  navbar: shadows.sm,       // Navigation bar shadow
  sidebar: shadows.md,      // Sidebar shadow
  
  // Media elements
  image: shadows.sm,        // Image container shadow
  video: shadows.md,        // Video player shadow
  
  // Focus states
  focus: {
    ring: '0 0 0 3px rgb(0 135 111 / 0.1)', // Focus ring
    glow: '0 0 20px rgb(0 135 111 / 0.3)',   // Focus glow effect
  },
} as const;

// Creative platform specific shadows
export const creativeShadows = {
  // Gig and showcase cards
  gig: {
    card: shadows.sm,         // Gig card default
    hover: shadows.lg,        // Gig card hover
    featured: shadows.xl,     // Featured gig shadow
  },
  
  // Profile elements
  profile: {
    avatar: shadows.md,       // Profile picture shadow
    showcase: shadows.sm,     // Showcase thumbnail shadow
  },
  
  // Moodboard elements
  moodboard: {
    item: shadows.xs,         // Individual moodboard items
    container: shadows.md,    // Moodboard container
  },
  
  // Creative overlays
  overlay: {
    light: 'inset 0 0 0 1px rgb(255 255 255 / 0.1)', // Light overlay
    dark: 'inset 0 0 0 1px rgb(0 0 0 / 0.1)',         // Dark overlay
    gradient: 'inset 0 -40px 40px -10px rgb(0 0 0 / 0.3)', // Gradient overlay
  },
} as const;

// Combined shadow system
export const shadowSystem = {
  light: shadows,
  dark: darkShadows,
  colored: coloredShadows,
  semantic: semanticShadows,
  creative: creativeShadows,
} as const;

// Type definitions
export type Shadows = typeof shadows;
export type DarkShadows = typeof darkShadows;
export type ColoredShadows = typeof coloredShadows;
export type SemanticShadows = typeof semanticShadows;
export type CreativeShadows = typeof creativeShadows;
export type ShadowSystem = typeof shadowSystem;
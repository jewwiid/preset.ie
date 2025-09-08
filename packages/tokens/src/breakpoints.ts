/**
 * Preset Design System - Breakpoint Tokens
 * Mobile-first responsive design system
 */

// Base breakpoints (mobile-first)
export const breakpoints = {
  xs: '475px',    // Extra small devices (large phones)
  sm: '640px',    // Small devices (tablets)
  md: '768px',    // Medium devices (small laptops)
  lg: '1024px',   // Large devices (desktops)
  xl: '1280px',   // Extra large devices (large desktops)
  '2xl': '1536px', // 2X large devices (larger desktops)
} as const;

// Container max widths for each breakpoint
export const containerWidths = {
  xs: '100%',     // Full width on mobile
  sm: '640px',    // Max width on small screens
  md: '768px',    // Max width on medium screens
  lg: '1024px',   // Max width on large screens
  xl: '1280px',   // Max width on extra large screens
  '2xl': '1536px', // Max width on 2xl screens
} as const;

// Media query helpers
export const mediaQueries = {
  // Min-width queries (mobile-first)
  up: {
    xs: `@media (min-width: ${breakpoints.xs})`,
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
    '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  },
  
  // Max-width queries (desktop-first, use sparingly)
  down: {
    xs: `@media (max-width: ${parseInt(breakpoints.xs) - 1}px)`,
    sm: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
    md: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
    lg: `@media (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
    xl: `@media (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
    '2xl': `@media (max-width: ${parseInt(breakpoints['2xl']) - 1}px)`,
  },
  
  // Between breakpoints
  between: {
    'xs-sm': `@media (min-width: ${breakpoints.xs}) and (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
    'sm-md': `@media (min-width: ${breakpoints.sm}) and (max-width: ${parseInt(breakpoints.md) - 1}px)`,
    'md-lg': `@media (min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
    'lg-xl': `@media (min-width: ${breakpoints.lg}) and (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
    'xl-2xl': `@media (min-width: ${breakpoints.xl}) and (max-width: ${parseInt(breakpoints['2xl']) - 1}px)`,
  },
  
  // Special device queries
  mobile: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
  
  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  
  // High resolution displays
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // Reduced motion preference
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  
  // Dark mode preference
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
} as const;

// Grid system breakpoints for creative layouts
export const gridBreakpoints = {
  // Number of columns at each breakpoint
  columns: {
    xs: 1,     // Single column on mobile
    sm: 2,     // Two columns on small screens
    md: 3,     // Three columns on medium screens
    lg: 4,     // Four columns on large screens
    xl: 5,     // Five columns on extra large screens
    '2xl': 6,  // Six columns on 2xl screens
  },
  
  // Gallery/showcase specific layouts
  showcase: {
    xs: 1,     // Single showcase on mobile
    sm: 2,     // Two showcases on small screens
    md: 2,     // Two showcases on medium screens
    lg: 3,     // Three showcases on large screens
    xl: 4,     // Four showcases on extra large screens
    '2xl': 4,  // Four showcases on 2xl screens
  },
  
  // Gig card layouts
  gigs: {
    xs: 1,     // Single gig card on mobile
    sm: 1,     // Single gig card on small screens (detailed view)
    md: 2,     // Two gig cards on medium screens
    lg: 2,     // Two gig cards on large screens
    xl: 3,     // Three gig cards on extra large screens
    '2xl': 3,  // Three gig cards on 2xl screens
  },
} as const;

// Type definitions
export type Breakpoints = typeof breakpoints;
export type ContainerWidths = typeof containerWidths;
export type MediaQueries = typeof mediaQueries;
export type GridBreakpoints = typeof gridBreakpoints;
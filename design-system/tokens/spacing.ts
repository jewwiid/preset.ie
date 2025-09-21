/**
 * Preset Design System - Spacing Tokens
 * Consistent spacing scale for layout and component spacing
 */

// Base spacing scale (rem units for consistency)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Semantic spacing for specific use cases
export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing[1],     // 4px - tight spacing within components
    sm: spacing[2],     // 8px - small internal padding
    md: spacing[4],     // 16px - default internal padding
    lg: spacing[6],     // 24px - large internal padding
    xl: spacing[8],     // 32px - extra large internal padding
  },
  
  // Layout spacing
  layout: {
    xs: spacing[4],     // 16px - tight sections
    sm: spacing[8],     // 32px - small sections
    md: spacing[12],    // 48px - default sections
    lg: spacing[16],    // 64px - large sections
    xl: spacing[24],    // 96px - extra large sections
    '2xl': spacing[32], // 128px - hero sections
  },
  
  // Container padding
  container: {
    xs: spacing[4],     // 16px - mobile padding
    sm: spacing[6],     // 24px - small screen padding  
    md: spacing[8],     // 32px - medium screen padding
    lg: spacing[12],    // 48px - large screen padding
    xl: spacing[16],    // 64px - extra large screen padding
  },
  
  // Grid gaps
  grid: {
    xs: spacing[2],     // 8px - tight grid
    sm: spacing[4],     // 16px - small grid
    md: spacing[6],     // 24px - default grid
    lg: spacing[8],     // 32px - large grid
    xl: spacing[12],    // 48px - extra large grid
  },
  
  // Stack spacing (vertical rhythm)
  stack: {
    xs: spacing[2],     // 8px - tight vertical spacing
    sm: spacing[4],     // 16px - small vertical spacing
    md: spacing[6],     // 24px - default vertical spacing
    lg: spacing[8],     // 32px - large vertical spacing
    xl: spacing[12],    // 48px - extra large vertical spacing
  },
} as const;

// Responsive spacing helpers
export const responsiveSpacing = {
  // Mobile-first responsive spacing
  responsive: {
    xs: {
      mobile: spacing[2],   // 8px on mobile
      tablet: spacing[4],   // 16px on tablet
      desktop: spacing[6],  // 24px on desktop
    },
    sm: {
      mobile: spacing[4],   // 16px on mobile
      tablet: spacing[6],   // 24px on tablet
      desktop: spacing[8],  // 32px on desktop
    },
    md: {
      mobile: spacing[6],   // 24px on mobile
      tablet: spacing[8],   // 32px on tablet
      desktop: spacing[12], // 48px on desktop
    },
    lg: {
      mobile: spacing[8],   // 32px on mobile
      tablet: spacing[12],  // 48px on tablet
      desktop: spacing[16], // 64px on desktop
    },
    xl: {
      mobile: spacing[12],  // 48px on mobile
      tablet: spacing[16],  // 64px on tablet
      desktop: spacing[24], // 96px on desktop
    },
  },
} as const;

// Type definitions
export type Spacing = typeof spacing;
export type SemanticSpacing = typeof semanticSpacing;
export type ResponsiveSpacing = typeof responsiveSpacing;
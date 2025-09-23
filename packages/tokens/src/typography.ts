/**
 * Preset Design System - Typography Tokens
 * Based on Bloc font family from your brand kit
 */

// Font families
export const fontFamily = {
  // Primary brand font from your kit
  primary: ['Bloc W01 Regular', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
  
  // Heading font - Bloc for titles and headings
  heading: ['Bloc W01 Regular', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
  
  // Supporting fonts
  secondary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
} as const;

// Font weights
export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

// Font sizes with fluid scaling
export const fontSize = {
  xs: {
    size: '0.75rem',    // 12px
    lineHeight: '1rem', // 16px
  },
  sm: {
    size: '0.875rem',   // 14px
    lineHeight: '1.25rem', // 20px
  },
  base: {
    size: '1rem',       // 16px
    lineHeight: '1.5rem', // 24px
  },
  lg: {
    size: '1.125rem',   // 18px
    lineHeight: '1.75rem', // 28px
  },
  xl: {
    size: '1.25rem',    // 20px
    lineHeight: '1.75rem', // 28px
  },
  '2xl': {
    size: '1.5rem',     // 24px
    lineHeight: '2rem', // 32px
  },
  '3xl': {
    size: '1.875rem',   // 30px
    lineHeight: '2.25rem', // 36px
  },
  '4xl': {
    size: '2.25rem',    // 36px
    lineHeight: '2.5rem', // 40px
  },
  '5xl': {
    size: '3rem',       // 48px
    lineHeight: '1',
  },
  '6xl': {
    size: '3.75rem',    // 60px
    lineHeight: '1',
  },
  '7xl': {
    size: '4.5rem',     // 72px
    lineHeight: '1',
  },
  '8xl': {
    size: '6rem',       // 96px
    lineHeight: '1',
  },
  '9xl': {
    size: '8rem',       // 128px
    lineHeight: '1',
  },
} as const;

// Text styles for common use cases
export const textStyles = {
  // Display text (heroes, large headings)
  display: {
    '2xl': {
      fontSize: fontSize['6xl'].size,
      lineHeight: fontSize['6xl'].lineHeight,
      fontWeight: fontWeight.bold,
      fontFamily: fontFamily.primary,
      letterSpacing: '-0.025em',
    },
    xl: {
      fontSize: fontSize['5xl'].size,
      lineHeight: fontSize['5xl'].lineHeight,
      fontWeight: fontWeight.bold,
      fontFamily: fontFamily.primary,
      letterSpacing: '-0.025em',
    },
    lg: {
      fontSize: fontSize['4xl'].size,
      lineHeight: fontSize['4xl'].lineHeight,
      fontWeight: fontWeight.bold,
      fontFamily: fontFamily.primary,
      letterSpacing: '-0.025em',
    },
    md: {
      fontSize: fontSize['3xl'].size,
      lineHeight: fontSize['3xl'].lineHeight,
      fontWeight: fontWeight.bold,
      fontFamily: fontFamily.primary,
    },
    sm: {
      fontSize: fontSize['2xl'].size,
      lineHeight: fontSize['2xl'].lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
    },
  },
  
  // Headings
  heading: {
    '6xl': {
      fontSize: fontSize['5xl'].size,
      lineHeight: fontSize['5xl'].lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
      letterSpacing: '-0.025em',
    },
    '5xl': {
      fontSize: fontSize['4xl'].size,
      lineHeight: fontSize['4xl'].lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
      letterSpacing: '-0.025em',
    },
    '4xl': {
      fontSize: fontSize['3xl'].size,
      lineHeight: fontSize['3xl'].lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
    },
    '3xl': {
      fontSize: fontSize['2xl'].size,
      lineHeight: fontSize['2xl'].lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
    },
    '2xl': {
      fontSize: fontSize.xl.size,
      lineHeight: fontSize.xl.lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
    },
    xl: {
      fontSize: fontSize.lg.size,
      lineHeight: fontSize.lg.lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
    },
    lg: {
      fontSize: fontSize.base.size,
      lineHeight: fontSize.base.lineHeight,
      fontWeight: fontWeight.semibold,
      fontFamily: fontFamily.primary,
    },
  },
  
  // Body text
  body: {
    xl: {
      fontSize: fontSize.xl.size,
      lineHeight: fontSize.xl.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.secondary,
    },
    lg: {
      fontSize: fontSize.lg.size,
      lineHeight: fontSize.lg.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.secondary,
    },
    md: {
      fontSize: fontSize.base.size,
      lineHeight: fontSize.base.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.secondary,
    },
    sm: {
      fontSize: fontSize.sm.size,
      lineHeight: fontSize.sm.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.secondary,
    },
    xs: {
      fontSize: fontSize.xs.size,
      lineHeight: fontSize.xs.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.secondary,
    },
  },
  
  // Labels and UI text
  label: {
    lg: {
      fontSize: fontSize.sm.size,
      lineHeight: fontSize.sm.lineHeight,
      fontWeight: fontWeight.medium,
      fontFamily: fontFamily.secondary,
    },
    md: {
      fontSize: fontSize.xs.size,
      lineHeight: fontSize.xs.lineHeight,
      fontWeight: fontWeight.medium,
      fontFamily: fontFamily.secondary,
    },
    sm: {
      fontSize: fontSize.xs.size,
      lineHeight: fontSize.xs.lineHeight,
      fontWeight: fontWeight.medium,
      fontFamily: fontFamily.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
    },
  },
  
  // Code and monospace
  code: {
    lg: {
      fontSize: fontSize.base.size,
      lineHeight: fontSize.base.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.mono,
    },
    md: {
      fontSize: fontSize.sm.size,
      lineHeight: fontSize.sm.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.mono,
    },
    sm: {
      fontSize: fontSize.xs.size,
      lineHeight: fontSize.xs.lineHeight,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.mono,
    },
  },
} as const;

// Type definitions
export type FontFamily = typeof fontFamily;
export type FontWeight = typeof fontWeight;
export type FontSize = typeof fontSize;
export type TextStyles = typeof textStyles;
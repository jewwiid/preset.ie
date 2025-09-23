/**
 * Preset Design System - Design Tokens
 * Complete design token system with dark/light mode support
 * Based on Preset brand identity and creative platform needs
 */

// Export all token categories
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './breakpoints';

// Re-export for convenience
export {
  colors,
  brandColors,
  lightColors,
  darkColors,
} from './colors';

export {
  fontFamily,
  fontWeight,
  fontSize,
  textStyles,
} from './typography';

export {
  spacing,
  semanticSpacing,
  responsiveSpacing,
} from './spacing';

export {
  radius,
  semanticRadius,
  creativeRadius,
} from './radius';

export {
  shadowSystem,
  semanticShadows,
  creativeShadows,
} from './shadows';

export {
  breakpoints,
  mediaQueries,
  gridBreakpoints,
} from './breakpoints';

// Theme configuration
export const themes = {
  light: {
    colors: {
      // Import light colors - Light teal/green shades
      background: {
        primary: '#ffffff',
        secondary: '#fafdfc',  // Very light teal tint
        tertiary: '#f5fbf9',  // Slightly more teal tint
        inverse: '#0f172a',
      },
      foreground: {
        primary: '#0f172a',
        secondary: '#475569',
        tertiary: '#64748b',
        inverse: '#ffffff',
        muted: '#94a3b8',
      },
      brand: {
        primary: '#00876f',
        secondary: '#ccfbef',
        accent: '#f59e0b',
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
        focus: '#00876f',
      },
      interactive: {
        primary: {
          default: '#00876f',
          hover: '#0d7d72',
          active: '#15706b',
          disabled: '#99f6e0',
        },
        secondary: {
          default: '#e2e8f0',
          hover: '#cbd5e1',
          active: '#94a3b8',
          disabled: '#f1f5f9',
        },
      },
    },
    shadows: {
      card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      focus: '0 0 0 3px rgb(0 135 111 / 0.1)',
    },
  },
  
  dark: {
    colors: {
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
        inverse: '#ffffff',
      },
      foreground: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        tertiary: '#94a3b8',
        inverse: '#0f172a',
        muted: '#64748b',
      },
      brand: {
        primary: '#2dd4bf',
        secondary: '#134e48',
        accent: '#fbbf24',
      },
      border: {
        primary: '#475569',
        secondary: '#64748b',
        focus: '#2dd4bf',
      },
      interactive: {
        primary: {
          default: '#2dd4bf',
          hover: '#5eead4',
          active: '#99f6e0',
          disabled: '#15706b',
        },
        secondary: {
          default: '#475569',
          hover: '#64748b',
          active: '#94a3b8',
          disabled: '#334155',
        },
      },
    },
    shadows: {
      card: '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
      modal: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2)',
      focus: '0 0 0 3px rgb(45 212 191 / 0.2)',
    },
  },
} as const;

// Default theme
export const defaultTheme = themes.light;

// Type definitions for theme
export type Theme = typeof themes.light;
export type Themes = typeof themes;
/**
 * Preset Design System - Color Tokens
 * Based on brand identity with comprehensive dark/light mode support
 */

// Brand Colors - OKLCH format for better consistency
export const brandColors = {
  // Primary brand green from your logo - OKLCH format
  preset: {
    50: 'oklch(0.9842 0.0034 247.8575)',   // Lightest
    100: 'oklch(0.9683 0.0069 247.8956)',  // Light
    200: 'oklch(0.9288 0.0126 255.5078)',  // Medium-light
    300: 'oklch(0.8178 0.0437 168.0623)',  // Medium
    400: 'oklch(0.6889 0.0727 172.2422)',  // Secondary
    500: 'oklch(0.5563 0.1055 174.3329)',  // Primary brand color
    600: 'oklch(0.4683 0.0879 175.5767)',  // Dark
    700: 'oklch(0.3789 0.0705 176.5745)',  // Darker
    800: 'oklch(0.3181 0.0596 175.7326)',  // Dark
    900: 'oklch(0.2103 0.0059 285.8852)',  // Darkest
  },
  
  // Legacy hex colors for backward compatibility
  presetHex: {
    50: '#f0fdf9',
    100: '#ccfbef', 
    200: '#99f6e0',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#00876f', // Your main brand color
    600: '#0d7d72',
    700: '#15706b',
    800: '#155e56',
    900: '#134e48',
  },
  
  // Supporting colors for creative platform
  creative: {
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    }
  }
} as const;

// Semantic color tokens for light mode
export const lightColors = {
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    inverse: '#0f172a',
  },
  
  // Foreground/Text colors
  foreground: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
    muted: '#94a3b8',
  },
  
  // Brand colors
  brand: {
    primary: brandColors.preset[500],
    secondary: brandColors.preset[100],
    accent: brandColors.creative.amber[500],
  },
  
  // Status colors
  status: {
    success: {
      bg: brandColors.preset[50],
      text: brandColors.preset[700],
      border: brandColors.preset[200],
    },
    warning: {
      bg: brandColors.creative.amber[50],
      text: brandColors.creative.amber[700],
      border: brandColors.creative.amber[200],
    },
    error: {
      bg: brandColors.creative.rose[50],
      text: brandColors.creative.rose[700], 
      border: brandColors.creative.rose[200],
    },
    info: {
      bg: brandColors.creative.purple[50],
      text: brandColors.creative.purple[700],
      border: brandColors.creative.purple[200],
    },
  },
  
  // Interactive colors
  interactive: {
    primary: {
      default: brandColors.preset[500],
      hover: brandColors.preset[600],
      active: brandColors.preset[700],
      disabled: brandColors.preset[200],
    },
    secondary: {
      default: '#e2e8f0',
      hover: '#cbd5e1',
      active: '#94a3b8',
      disabled: '#f1f5f9',
    },
  },
  
  // Border colors
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: brandColors.preset[500],
    error: brandColors.creative.rose[300],
  },
} as const;

// Semantic color tokens for dark mode
export const darkColors = {
  // Background colors
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    inverse: '#ffffff',
  },
  
  // Foreground/Text colors
  foreground: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
    muted: '#64748b',
  },
  
  // Brand colors (adjusted for dark mode)
  brand: {
    primary: brandColors.preset[400],
    secondary: brandColors.preset[900],
    accent: brandColors.creative.amber[400],
  },
  
  // Status colors (dark mode variants)
  status: {
    success: {
      bg: brandColors.preset[900],
      text: brandColors.preset[300],
      border: brandColors.preset[700],
    },
    warning: {
      bg: brandColors.creative.amber[900],
      text: brandColors.creative.amber[300],
      border: brandColors.creative.amber[700],
    },
    error: {
      bg: brandColors.creative.rose[900],
      text: brandColors.creative.rose[300],
      border: brandColors.creative.rose[700],
    },
    info: {
      bg: brandColors.creative.purple[900],
      text: brandColors.creative.purple[300],
      border: brandColors.creative.purple[700],
    },
  },
  
  // Interactive colors
  interactive: {
    primary: {
      default: brandColors.preset[400],
      hover: brandColors.preset[300],
      active: brandColors.preset[200],
      disabled: brandColors.preset[800],
    },
    secondary: {
      default: '#475569',
      hover: '#64748b',
      active: '#94a3b8',
      disabled: '#334155',
    },
  },
  
  // Border colors
  border: {
    primary: '#475569',
    secondary: '#64748b',
    focus: brandColors.preset[400],
    error: brandColors.creative.rose[600],
  },
} as const;

// Combined theme colors
export const colors = {
  brand: brandColors,
  light: lightColors,
  dark: darkColors,
} as const;

// Type definitions
export type BrandColors = typeof brandColors;
export type LightColors = typeof lightColors;
export type DarkColors = typeof darkColors;
export type Colors = typeof colors;
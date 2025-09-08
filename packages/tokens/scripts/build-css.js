#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate CSS custom properties from design tokens
function generateCSS() {
  // Generate CSS custom properties for light theme
  const lightCSS = `
/**
 * Preset Design System - CSS Custom Properties
 * Auto-generated from design tokens
 */

:root {
  /* Colors - Light Theme */
  --preset-color-background-primary: #ffffff;
  --preset-color-background-secondary: #f8fafc;
  --preset-color-background-tertiary: #f1f5f9;
  --preset-color-background-inverse: #0f172a;
  
  --preset-color-foreground-primary: #0f172a;
  --preset-color-foreground-secondary: #475569;
  --preset-color-foreground-tertiary: #64748b;
  --preset-color-foreground-inverse: #ffffff;
  --preset-color-foreground-muted: #94a3b8;
  
  --preset-color-brand-primary: #00876f;
  --preset-color-brand-secondary: #ccfbef;
  --preset-color-brand-accent: #f59e0b;
  
  --preset-color-border-primary: #e2e8f0;
  --preset-color-border-secondary: #cbd5e1;
  --preset-color-border-focus: #00876f;
  
  --preset-color-interactive-primary-default: #00876f;
  --preset-color-interactive-primary-hover: #0d7d72;
  --preset-color-interactive-primary-active: #15706b;
  --preset-color-interactive-primary-disabled: #99f6e0;
  
  --preset-color-interactive-secondary-default: #e2e8f0;
  --preset-color-interactive-secondary-hover: #cbd5e1;
  --preset-color-interactive-secondary-active: #94a3b8;
  --preset-color-interactive-secondary-disabled: #f1f5f9;
  
  /* Typography */
  --preset-font-family-primary: 'Bloc', 'Inter', 'system-ui', '-apple-system', sans-serif;
  --preset-font-family-secondary: 'Inter', 'system-ui', '-apple-system', sans-serif;
  --preset-font-family-mono: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  
  --preset-font-weight-light: 300;
  --preset-font-weight-normal: 400;
  --preset-font-weight-medium: 500;
  --preset-font-weight-semibold: 600;
  --preset-font-weight-bold: 700;
  --preset-font-weight-extrabold: 800;
  
  /* Spacing */
  --preset-spacing-0: 0;
  --preset-spacing-px: 1px;
  --preset-spacing-1: 0.25rem;
  --preset-spacing-2: 0.5rem;
  --preset-spacing-3: 0.75rem;
  --preset-spacing-4: 1rem;
  --preset-spacing-5: 1.25rem;
  --preset-spacing-6: 1.5rem;
  --preset-spacing-8: 2rem;
  --preset-spacing-10: 2.5rem;
  --preset-spacing-12: 3rem;
  --preset-spacing-16: 4rem;
  --preset-spacing-20: 5rem;
  --preset-spacing-24: 6rem;
  --preset-spacing-32: 8rem;
  
  /* Radius */
  --preset-radius-none: 0;
  --preset-radius-xs: 0.125rem;
  --preset-radius-sm: 0.25rem;
  --preset-radius-md: 0.375rem;
  --preset-radius-lg: 0.5rem;
  --preset-radius-xl: 0.75rem;
  --preset-radius-2xl: 1rem;
  --preset-radius-3xl: 1.5rem;
  --preset-radius-full: 9999px;
  
  /* Shadows */
  --preset-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --preset-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --preset-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --preset-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --preset-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --preset-shadow-focus: 0 0 0 3px rgb(0 135 111 / 0.1);
}

/* Dark Theme */
@media (prefers-color-scheme: dark), [data-theme="dark"] {
  :root {
    /* Colors - Dark Theme */
    --preset-color-background-primary: #0f172a;
    --preset-color-background-secondary: #1e293b;
    --preset-color-background-tertiary: #334155;
    --preset-color-background-inverse: #ffffff;
    
    --preset-color-foreground-primary: #f8fafc;
    --preset-color-foreground-secondary: #cbd5e1;
    --preset-color-foreground-tertiary: #94a3b8;
    --preset-color-foreground-inverse: #0f172a;
    --preset-color-foreground-muted: #64748b;
    
    --preset-color-brand-primary: #2dd4bf;
    --preset-color-brand-secondary: #134e48;
    --preset-color-brand-accent: #fbbf24;
    
    --preset-color-border-primary: #475569;
    --preset-color-border-secondary: #64748b;
    --preset-color-border-focus: #2dd4bf;
    
    --preset-color-interactive-primary-default: #2dd4bf;
    --preset-color-interactive-primary-hover: #5eead4;
    --preset-color-interactive-primary-active: #99f6e0;
    --preset-color-interactive-primary-disabled: #15706b;
    
    --preset-color-interactive-secondary-default: #475569;
    --preset-color-interactive-secondary-hover: #64748b;
    --preset-color-interactive-secondary-active: #94a3b8;
    --preset-color-interactive-secondary-disabled: #334155;
    
    /* Dark Theme Shadows */
    --preset-shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.15);
    --preset-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.2);
    --preset-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2);
    --preset-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2);
    --preset-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2);
    --preset-shadow-focus: 0 0 0 3px rgb(45 212 191 / 0.2);
  }
}

/* Font Face Declarations */
@font-face {
  font-family: 'Bloc';
  src: url('./assets/fonts/Bloc W01 Regular.woff2') format('woff2'),
       url('./assets/fonts/Bloc W01 Regular.woff') format('woff'),
       url('./assets/fonts/Bloc W01 Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* Utility Classes */
.preset-font-primary {
  font-family: var(--preset-font-family-primary);
}

.preset-font-secondary {
  font-family: var(--preset-font-family-secondary);
}

.preset-font-mono {
  font-family: var(--preset-font-family-mono);
}

.preset-text-brand {
  color: var(--preset-color-brand-primary);
}

.preset-bg-brand {
  background-color: var(--preset-color-brand-primary);
}

.preset-border-brand {
  border-color: var(--preset-color-brand-primary);
}

.preset-shadow-card {
  box-shadow: var(--preset-shadow-sm);
}

.preset-shadow-modal {
  box-shadow: var(--preset-shadow-xl);
}

.preset-focus-ring {
  box-shadow: var(--preset-shadow-focus);
}
`;

  // Write CSS file
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  fs.writeFileSync('dist/tokens.css', lightCSS.trim());
  console.log('✅ Generated CSS custom properties');
}

// Generate native tokens for React Native
function generateNativeTokens() {
  const nativeTokens = `
/**
 * Preset Design System - Native Tokens
 * Auto-generated from design tokens for React Native
 */

export const nativeTokens = {
  colors: {
    light: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
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
    },
    dark: {
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
    },
  },
  
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },
  
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999,
  },
  
  fontFamily: {
    primary: 'Bloc',
    secondary: 'System',
    mono: 'Courier',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export default nativeTokens;
`;

  fs.writeFileSync('dist/native.js', nativeTokens.trim());
  console.log('✅ Generated native tokens');
}

// Run generation
generateCSS();
generateNativeTokens();
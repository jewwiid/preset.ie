/**
 * Brand Tester Module - Configuration Export
 *
 * Export design configurations to various formats (JSON, CSS, Tailwind, etc.)
 */

import type { DesignConfig, ColorState, FontState, ExportFormat } from '../types';

/**
 * Export configuration to JSON format
 */
export function exportToJSON(
  colors: ColorState,
  fonts: FontState,
  metadata: DesignConfig['metadata']
): string {
  const config: DesignConfig = {
    colors,
    fonts,
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString(),
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Export configuration to CSS custom properties
 */
export function exportToCSS(colors: ColorState, fonts: FontState): string {
  let css = ':root {\n';
  css += '  /* Colors - Light Mode */\n';

  // Export light mode colors
  Object.entries(colors).forEach(([variable, values]) => {
    css += `  ${variable}: ${values.light};\n`;
  });

  css += '\n  /* Fonts */\n';

  // Export fonts
  Object.entries(fonts).forEach(([variable, value]) => {
    css += `  ${variable}: ${value};\n`;
  });

  css += '}\n\n';

  // Export dark mode colors
  css += '[data-theme="dark"] {\n';
  css += '  /* Colors - Dark Mode */\n';

  Object.entries(colors).forEach(([variable, values]) => {
    css += `  ${variable}: ${values.dark};\n`;
  });

  css += '}\n';

  return css;
}

/**
 * Export configuration to Tailwind config format
 */
export function exportToTailwind(colors: ColorState, fonts: FontState): string {
  let config = '// Tailwind CSS Configuration\n';
  config += '// Add this to your tailwind.config.js\n\n';
  config += 'module.exports = {\n';
  config += '  theme: {\n';
  config += '    extend: {\n';
  config += '      colors: {\n';

  // Convert CSS variables to Tailwind format
  Object.entries(colors).forEach(([variable, values]) => {
    const colorName = variable.replace('--', '').replace(/-/g, '_');
    config += `        ${colorName}: {\n`;
    config += `          light: '${values.light}',\n`;
    config += `          dark: '${values.dark}',\n`;
    config += '        },\n';
  });

  config += '      },\n';
  config += '      fontFamily: {\n';

  // Export fonts
  Object.entries(fonts).forEach(([variable, value]) => {
    const fontName = variable.replace('--font-', '');
    config += `        ${fontName}: ['${value}', 'sans-serif'],\n`;
  });

  config += '      },\n';
  config += '    },\n';
  config += '  },\n';
  config += '};\n';

  return config;
}

/**
 * Export configuration to design tokens (JSON format)
 */
export function exportToDesignTokens(colors: ColorState, fonts: FontState): string {
  const tokens = {
    color: {} as Record<string, any>,
    typography: {} as Record<string, any>,
  };

  // Export colors as design tokens
  Object.entries(colors).forEach(([variable, values]) => {
    const tokenName = variable.replace('--', '').replace(/-/g, '.');
    tokens.color[tokenName] = {
      $type: 'color',
      $value: {
        light: values.light,
        dark: values.dark,
      },
    };
  });

  // Export fonts as design tokens
  Object.entries(fonts).forEach(([variable, value]) => {
    const tokenName = variable.replace('--font-', '').replace(/-/g, '.');
    tokens.typography[tokenName] = {
      $type: 'fontFamily',
      $value: value,
    };
  });

  return JSON.stringify(tokens, null, 2);
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export configuration based on format
 */
export function exportConfiguration(
  format: ExportFormat,
  colors: ColorState,
  fonts: FontState,
  metadata: DesignConfig['metadata']
): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'json':
      content = exportToJSON(colors, fonts, metadata);
      filename = 'design-config.json';
      mimeType = 'application/json';
      break;

    case 'css':
      content = exportToCSS(colors, fonts);
      filename = 'design-config.css';
      mimeType = 'text/css';
      break;

    case 'tailwind':
      content = exportToTailwind(colors, fonts);
      filename = 'tailwind.config.js';
      mimeType = 'text/javascript';
      break;

    case 'tokens':
      content = exportToDesignTokens(colors, fonts);
      filename = 'design-tokens.json';
      mimeType = 'application/json';
      break;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadFile(content, filename, mimeType);
}

/**
 * Import configuration from JSON
 */
export function importFromJSON(jsonString: string): DesignConfig | null {
  try {
    const config = JSON.parse(jsonString) as DesignConfig;

    // Validate the structure
    if (!config.colors || !config.fonts || !config.metadata) {
      throw new Error('Invalid configuration structure');
    }

    return config;
  } catch (error) {
    console.error('Failed to import configuration:', error);
    return null;
  }
}

/**
 * Generate a shareable config URL
 */
export function generateShareableURL(config: DesignConfig): string {
  const compressed = btoa(JSON.stringify(config));
  return `${window.location.origin}${window.location.pathname}?config=${compressed}`;
}

/**
 * Parse a shareable config URL
 */
export function parseShareableURL(url: string): DesignConfig | null {
  try {
    const params = new URLSearchParams(new URL(url).search);
    const compressed = params.get('config');

    if (!compressed) {
      return null;
    }

    const jsonString = atob(compressed);
    return importFromJSON(jsonString);
  } catch (error) {
    console.error('Failed to parse shareable URL:', error);
    return null;
  }
}

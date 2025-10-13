/**
 * Brand Tester Module - Color Utilities
 *
 * Color conversion and manipulation utilities.
 */

/**
 * Convert OKLCH color string to HEX
 */
export function oklchToHex(oklch: string): string {
  try {
    // Extract OKLCH values from string like "oklch(0.5 0.1 200)"
    const match = oklch.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
    if (!match) return '#000000';

    const [, l, c, h] = match;
    const lightness = parseFloat(l);
    const chroma = parseFloat(c);
    const hue = parseFloat(h);

    // Convert OKLCH to RGB (simplified conversion)
    // This is a basic approximation - for production use, consider a proper color library
    const lrgb = lightness;
    const crgb = chroma * Math.cos((hue * Math.PI) / 180);
    const brgb = chroma * Math.sin((hue * Math.PI) / 180);

    const r = Math.round(Math.max(0, Math.min(255, (lrgb + crgb) * 255)));
    const g = Math.round(Math.max(0, Math.min(255, (lrgb - crgb / 2 - brgb / 2) * 255)));
    const b = Math.round(Math.max(0, Math.min(255, (lrgb - crgb / 2 + brgb / 2) * 255)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
  } catch {
    return '#000000';
  }
}

/**
 * Convert HEX color to OKLCH string
 */
export function hexToOklch(hex: string): string {
  try {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Convert RGB to OKLCH (simplified conversion)
    // This is a basic approximation - for production use, consider a proper color library
    const lightness = (r + g + b) / 3;
    const chroma = Math.sqrt(
      (r - lightness) ** 2 + (g - lightness) ** 2 + (b - lightness) ** 2
    );
    const hue = (Math.atan2(b - g, r - lightness) * 180) / Math.PI;

    return `oklch(${lightness.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(1)})`;
  } catch {
    return 'oklch(0.5 0.1 200)';
  }
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const hex1 = color1.startsWith('oklch') ? oklchToHex(color1) : color1;
  const hex2 = color2.startsWith('oklch') ? oklchToHex(color2) : color2;

  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(hex: string): number {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Check if a color meets WCAG AA standards for contrast
 */
export function meetsWCAGAA(contrast: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrast >= 3 : contrast >= 4.5;
}

/**
 * Check if a color meets WCAG AAA standards for contrast
 */
export function meetsWCAGAAA(contrast: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrast >= 4.5 : contrast >= 7;
}

/**
 * Generate a color palette from a base color
 */
export function generateColorPalette(baseColor: string): string[] {
  // This is a simplified palette generator
  // For production, consider using a proper color theory library
  const palette: string[] = [];
  const hex = baseColor.startsWith('oklch') ? oklchToHex(baseColor) : baseColor;

  // Generate shades (darker) and tints (lighter)
  for (let i = -3; i <= 3; i++) {
    const factor = 1 + i * 0.15;
    const adjusted = adjustBrightness(hex, factor);
    palette.push(adjusted);
  }

  return palette;
}

/**
 * Adjust brightness of a hex color
 */
function adjustBrightness(hex: string, factor: number): string {
  hex = hex.replace('#', '');

  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  r = Math.round(Math.min(255, Math.max(0, r * factor)));
  g = Math.round(Math.min(255, Math.max(0, g * factor)));
  b = Math.round(Math.min(255, Math.max(0, b * factor)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Validate if a string is a valid OKLCH color
 */
export function isValidOklch(color: string): boolean {
  const oklchRegex = /^oklch\([0-9.]+\s+[0-9.]+\s+[0-9.]+\)$/;
  return oklchRegex.test(color);
}

/**
 * Validate if a string is a valid HEX color
 */
export function isValidHex(color: string): boolean {
  const hexRegex = /^#?[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
}

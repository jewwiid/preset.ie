/**
 * Brand Tester Module - Type Definitions
 *
 * Centralized type definitions for the brand design system tester.
 * Supports color configuration, font management, and design auditing.
 */

/**
 * Color configuration categories
 */
export type ColorCategory =
  | 'primary'
  | 'background'
  | 'text'
  | 'semantic'
  | 'border'
  | 'chart'
  | 'button'
  | 'form'
  | 'navigation'
  | 'feedback'
  | 'interactive';

/**
 * Font configuration categories
 */
export type FontCategory = 'brand' | 'system' | 'google';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'css' | 'tailwind' | 'tokens';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Color configuration for a single color variable
 */
export interface ColorConfig {
  name: string;
  variable: string;
  lightValue: string;
  darkValue: string;
  description: string;
  category: ColorCategory;
}

/**
 * Font configuration for a single font variable
 */
export interface FontConfig {
  name: string;
  variable: string;
  currentValue: string;
  options: string[];
  description: string;
  category: FontCategory;
  googleFontUrl?: string;
}

/**
 * Google Font definition
 */
export interface GoogleFont {
  name: string;
  url: string;
}

/**
 * Complete design configuration
 */
export interface DesignConfig {
  colors: Record<string, { light: string; dark: string }>;
  fonts: Record<string, string>;
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    version: string;
  };
}

/**
 * Color audit issue severity
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Color audit issue
 */
export interface ColorIssue {
  id: string;
  severity: IssueSeverity;
  category: string;
  message: string;
  color?: string;
  relatedColor?: string;
  suggestion?: string;
}

/**
 * Color audit result
 */
export interface AuditResult {
  issues: ColorIssue[];
  score: number;
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  timestamp: string;
}

/**
 * Color state for the application
 */
export interface ColorState {
  [key: string]: {
    light: string;
    dark: string;
  };
}

/**
 * Font state for the application
 */
export interface FontState {
  [key: string]: string;
}

/**
 * Preview mode configuration
 */
export interface PreviewConfig {
  mode: ThemeMode;
  showGrid: boolean;
  showLabels: boolean;
  zoom: number;
}

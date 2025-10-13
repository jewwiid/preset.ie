/**
 * Brand Tester Module - Configuration Constants
 *
 * Color definitions, font configurations, and Google Fonts catalog.
 */

import type { ColorConfig, FontConfig, GoogleFont } from '../types';

/**
 * Complete color definitions for the design system
 */
export const COLOR_DEFINITIONS: ColorConfig[] = [
  // Primary Colors
  {
    name: 'Primary',
    variable: '--primary',
    lightValue: 'oklch(0.5563 0.1055 174.3329)',
    darkValue: 'oklch(0.5563 0.1055 174.3329)',
    description: 'Main brand color - used for buttons, links, and accents',
    category: 'primary',
  },
  {
    name: 'Primary Foreground',
    variable: '--primary-foreground',
    lightValue: 'oklch(1.0000 0 0)',
    darkValue: 'oklch(1.0000 0 0)',
    description: 'Text color on primary backgrounds',
    category: 'primary',
  },

  // Background Colors
  {
    name: 'Background',
    variable: '--background',
    lightValue: 'oklch(1.0000 0 0)',
    darkValue: 'oklch(0.1448 0 0)',
    description: 'Main page background color',
    category: 'background',
  },
  {
    name: 'Card',
    variable: '--card',
    lightValue: 'oklch(0.9900 0.0030 174.3329)',
    darkValue: 'oklch(0.2103 0.0059 285.8852)',
    description: 'Card and component backgrounds',
    category: 'background',
  },
  {
    name: 'Card Foreground',
    variable: '--card-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on card backgrounds',
    category: 'background',
  },
  {
    name: 'Muted',
    variable: '--muted',
    lightValue: 'oklch(0.9800 0.0035 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Muted backgrounds for inputs and secondary areas',
    category: 'background',
  },
  {
    name: 'Accent',
    variable: '--accent',
    lightValue: 'oklch(0.9750 0.0050 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Accent backgrounds for hover states',
    category: 'background',
  },
  {
    name: 'Accent Foreground',
    variable: '--accent-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on accent backgrounds',
    category: 'background',
  },

  // Text Colors
  {
    name: 'Foreground',
    variable: '--foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Primary text color',
    category: 'text',
  },
  {
    name: 'Muted Foreground',
    variable: '--muted-foreground',
    lightValue: 'oklch(0.5544 0.0407 257.4166)',
    darkValue: 'oklch(0.7118 0.0129 286.0665)',
    description: 'Secondary text color',
    category: 'text',
  },

  // Button Colors
  {
    name: 'Secondary',
    variable: '--secondary',
    lightValue: 'oklch(0.9750 0.0050 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Secondary button background color',
    category: 'button',
  },
  {
    name: 'Secondary Foreground',
    variable: '--secondary-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on secondary buttons',
    category: 'button',
  },

  // Semantic Colors
  {
    name: 'Destructive',
    variable: '--destructive',
    lightValue: 'oklch(0.6368 0.2078 25.3313)',
    darkValue: 'oklch(0.3958 0.1331 25.7230)',
    description: 'Error and destructive action colors',
    category: 'semantic',
  },
  {
    name: 'Destructive Foreground',
    variable: '--destructive-foreground',
    lightValue: 'oklch(1.0000 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on destructive backgrounds',
    category: 'semantic',
  },

  // Form Colors
  {
    name: 'Input',
    variable: '--input',
    lightValue: 'oklch(0.9288 0.0126 255.5078)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Input field border color',
    category: 'form',
  },

  // Border Colors
  {
    name: 'Border',
    variable: '--border',
    lightValue: 'oklch(0.9288 0.0126 255.5078)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Border and divider colors',
    category: 'border',
  },
  {
    name: 'Ring',
    variable: '--ring',
    lightValue: 'oklch(0.6665 0.2081 16.4383)',
    darkValue: 'oklch(0.6665 0.2081 16.4383)',
    description: 'Focus ring color',
    category: 'border',
  },

  // Popover Colors
  {
    name: 'Popover',
    variable: '--popover',
    lightValue: 'oklch(0.9850 0.0040 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Popover and dropdown backgrounds',
    category: 'navigation',
  },
  {
    name: 'Popover Foreground',
    variable: '--popover-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color in popovers',
    category: 'navigation',
  },
];

/**
 * Font definitions with brand and system fonts
 */
export const FONT_DEFINITIONS: FontConfig[] = [
  {
    name: 'Bloc W01 Regular',
    variable: '--font-bloc',
    currentValue: 'Bloc W01 Regular',
    options: ['Bloc W01 Regular', 'serif'],
    description: 'Brand font - used for headings and brand elements',
    category: 'brand',
  },
  {
    name: 'Sans Serif',
    variable: '--font-sans',
    currentValue: 'Inter',
    options: [
      'Inter',
      'Poppins',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Source Sans Pro',
      'Nunito',
    ],
    description: 'Main sans-serif font family',
    category: 'google',
  },
  {
    name: 'Heading',
    variable: '--font-heading',
    currentValue: 'Inter',
    options: ['Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Merriweather'],
    description: 'Font for headings and titles',
    category: 'google',
  },
  {
    name: 'Monospace',
    variable: '--font-mono',
    currentValue: 'monospace',
    options: [
      'monospace',
      'Fira Code',
      'JetBrains Mono',
      'Source Code Pro',
      'Consolas',
      'Courier New',
    ],
    description: 'Monospace font for code',
    category: 'system',
  },
];

/**
 * Popular Google Fonts catalog
 */
export const GOOGLE_FONTS: GoogleFont[] = [
  {
    name: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Roboto',
    url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  },
  {
    name: 'Open Sans',
    url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Lato',
    url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  },
  {
    name: 'Montserrat',
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Poppins',
    url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Source Sans Pro',
    url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap',
  },
  {
    name: 'Nunito',
    url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Playfair Display',
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  },
  {
    name: 'Merriweather',
    url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
  },
];

/**
 * Color categories for organization
 */
export const COLOR_CATEGORIES = [
  'primary',
  'background',
  'text',
  'button',
  'semantic',
  'form',
  'border',
  'navigation',
] as const;

/**
 * Default metadata for new configurations
 */
export const DEFAULT_METADATA = {
  name: 'Custom Design System',
  description: 'Created with Brand Tester',
  version: '1.0.0',
};

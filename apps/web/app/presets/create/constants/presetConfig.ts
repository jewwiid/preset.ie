/**
 * Preset Create Module - Configuration Constants
 *
 * Categories, styles, moods, and default configurations.
 */

import type { PresetCategory, PresetData } from '../types';

/**
 * Preset categories with icons
 */
export const CATEGORIES: PresetCategory[] = [
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { value: 'artistic', label: 'Artistic', icon: '🎨' },
  { value: 'portrait', label: 'Portrait', icon: '👤' },
  { value: 'landscape', label: 'Landscape', icon: '🏞️' },
  { value: 'commercial', label: 'Commercial', icon: '💼' },
  { value: 'headshot', label: 'Headshot', icon: '📷' },
  { value: 'product_photography', label: 'Product Photography', icon: '📦' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'corporate_portrait', label: 'Corporate Portrait', icon: '👔' },
  { value: 'linkedin_photo', label: 'LinkedIn Photo', icon: '💼' },
  { value: 'professional_portrait', label: 'Professional Portrait', icon: '👤' },
  { value: 'business_headshot', label: 'Business Headshot', icon: '📸' },
  { value: 'product_catalog', label: 'Product Catalog', icon: '📋' },
  { value: 'product_lifestyle', label: 'Product Lifestyle', icon: '🏠' },
  { value: 'product_studio', label: 'Product Studio', icon: '🎬' },
  { value: 'abstract', label: 'Abstract', icon: '🌀' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

/**
 * Available mood options
 */
export const MOODS = [
  'Dramatic',
  'Ethereal',
  'Moody',
  'Bright',
  'Dark',
  'Vibrant',
  'Minimal',
  'Maximal',
  'Futuristic',
  'Vintage',
  'Natural',
  'Surreal',
];

/**
 * Available style options
 */
export const STYLES = [
  // Photographic Styles
  'Photorealistic',
  'Cinematic',
  'Portrait',
  'Fashion',
  'Editorial',
  'Commercial',
  'Lifestyle',
  'Street',
  'Architecture',
  'Nature',

  // Artistic Styles
  'Impressionist',
  'Renaissance',
  'Baroque',
  'Art Deco',
  'Pop Art',
  'Watercolor',
  'Oil Painting',
  'Sketch',
  'Abstract',
  'Surreal',
  'Minimalist',
  'Maximalist',

  // Digital/Modern Styles
  'Digital Art',
  'Concept Art',
  'Illustration',
  'Cartoon',
  'Fantasy',
  'Sci-Fi',
  'Cyberpunk',

  // Classic Styles
  'Vintage',
  'Artistic',
  'Painterly',
];

/**
 * Available aspect ratios
 */
export const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:2', label: 'Classic (3:2)' },
  { value: '21:9', label: 'Ultrawide (21:9)' },
];

/**
 * Available resolution options
 */
export const RESOLUTIONS = [
  { value: '512', label: '512x512' },
  { value: '768', label: '768x768' },
  { value: '1024', label: '1024x1024' },
  { value: '1536', label: '1536x1536' },
  { value: '2048', label: '2048x2048' },
];

/**
 * Consistency level options
 */
export const CONSISTENCY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very-high', label: 'Very High' },
];

/**
 * Model version options
 */
export const MODEL_VERSIONS = [
  { value: 'v3', label: 'V3 - Fast' },
  { value: 'v4', label: 'V4 - Balanced' },
  { value: 'v5', label: 'V5 - Premium' },
];

/**
 * Default preset data
 */
export const DEFAULT_PRESET_DATA: PresetData = {
  name: '',
  description: '',
  category: 'photography',
  prompt_template: '',
  prompt_template_video: '',
  negative_prompt: '',
  generation_mode: 'both',
  prompt_subject: '',
  prompt_image_url: '',
  enhanced_prompt: '',
  enhanced_prompt_video: '',
  style_settings: {
    style: '',
    resolution: '1024',
    aspect_ratio: '1:1',
    intensity: 1.0,
    consistency_level: 'high',
  },
  technical_settings: {
    num_images: 1,
    generation_mode: 'text-to-image',
  },
  ai_metadata: {
    tags: [],
    mood: 'Dramatic',
    style: 'Realistic',
    subject: '',
  },
  seedream_config: {
    model_version: 'v4',
    enhancement_settings: {},
  },
  is_public: false,
  is_featured: false,
  is_for_sale: false,
  sale_price: 0,
  marketplace_title: '',
  marketplace_description: '',
  marketplace_tags: [],
};

/**
 * Tab configuration
 */
export const TABS = [
  { value: 'basic', label: 'Basic Info', icon: 'Info' },
  { value: 'prompts', label: 'Prompts', icon: 'Wand2' },
  { value: 'settings', label: 'Settings', icon: 'Settings' },
  { value: 'marketplace', label: 'Marketplace', icon: 'Store' },
  { value: 'preview', label: 'Preview', icon: 'Eye' },
];

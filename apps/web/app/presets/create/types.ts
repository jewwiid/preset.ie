/**
 * Preset Create Module - Type Definitions
 *
 * Centralized type definitions for preset creation and marketplace listing.
 */

/**
 * Generation mode options
 */
export type GenerationMode = 'image' | 'video' | 'both';

/**
 * Model version options
 */
export type ModelVersion = 'v3' | 'v4' | 'v5';

/**
 * Consistency level options
 */
export type ConsistencyLevel = 'low' | 'medium' | 'high' | 'very-high';

/**
 * Style settings for preset generation
 */
export interface StyleSettings {
  style?: string;
  resolution: string;
  aspect_ratio: string;
  intensity: number;
  consistency_level: ConsistencyLevel;
}

/**
 * Technical generation settings
 */
export interface TechnicalSettings {
  num_images: number;
  generation_mode: string;
}

/**
 * AI metadata for categorization
 */
export interface AIMetadata {
  tags: string[];
  mood: string;
  style: string;
  subject?: string;
}

/**
 * Seedream configuration
 */
export interface SeedreamConfig {
  model_version: ModelVersion;
  enhancement_settings: Record<string, any>;
}

/**
 * Complete preset data structure
 */
export interface PresetData {
  // Basic Info
  name: string;
  description: string;
  category: string;

  // Prompt Configuration
  prompt_template: string;
  prompt_template_video?: string;
  negative_prompt?: string;

  // Dynamic Prompt Fields
  prompt_subject: string;
  prompt_image_url?: string;
  enhanced_prompt: string;
  enhanced_prompt_video?: string;

  // Generation Settings
  generation_mode: GenerationMode;
  style_settings: StyleSettings;
  technical_settings: TechnicalSettings;

  // AI Metadata
  ai_metadata: AIMetadata;

  // Technical Configuration
  seedream_config: SeedreamConfig;

  // Visibility Settings
  is_public: boolean;
  is_featured: boolean;

  // Marketplace Fields
  is_for_sale: boolean;
  sale_price: number;
  marketplace_title: string;
  marketplace_description: string;
  marketplace_tags: string[];
}

/**
 * Preset category definition
 */
export interface PresetCategory {
  value: string;
  label: string;
  icon: string;
}

/**
 * Form validation errors
 */
export interface ValidationErrors {
  name?: string;
  description?: string;
  prompt_template?: string;
  category?: string;
  marketplace_title?: string;
  sale_price?: string;
}

/**
 * Preset creation state
 */
export interface PresetCreationState {
  data: PresetData;
  loading: boolean;
  saving: boolean;
  errors: ValidationErrors;
  activeTab: string;
  generatedPreview: string | null;
}

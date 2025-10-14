import type { CinematicParameters } from '@preset/types';

export type ImageType = 'character' | 'location' | 'style' | 'object' | 'reference' | 'custom';

export interface StitchPreset {
  id: string;
  type: 'stitch'; // Discriminator for preset type
  name: string;
  description: string;
  category: 'character-scene' | 'product-marketing' | 'style-transfer' | 'creative-composite';
  
  // Template with placeholders
  prompt_template: string; // e.g., "Place {character} in {location} with {style} aesthetic"
  
  // Image type requirements
  required_image_types: ImageType[];
  optional_image_types: ImageType[];
  
  // Generation settings
  max_images_suggestion?: number;
  aspect_ratio_suggestion?: string;
  provider_preference?: 'seedream' | 'nanobanana';
  
  // Cinematic parameters
  cinematic_parameters?: Partial<CinematicParameters>;
  
  // Examples for users
  examples?: {
    input_images: { type: ImageType; description: string }[];
    output_description: string;
    sample_output_url?: string;
  }[];
  
  // Metadata
  usage_count: number;
  likes_count: number;
  is_public: boolean;
  created_at: string;
  creator?: {
    id: string;
    display_name: string;
    handle: string;
  };
}

// Built-in example presets
export const STITCH_PRESETS: StitchPreset[] = [
  {
    id: 'character-in-locations',
    type: 'stitch',
    name: 'Character in Different Locations',
    description: 'Place a character in multiple locations with consistent style',
    category: 'character-scene',
    prompt_template: 'Create {count} images placing {character} in {location}, maintaining {style} aesthetic with cinematic composition',
    required_image_types: ['character', 'location'],
    optional_image_types: ['style'],
    max_images_suggestion: 5,
    aspect_ratio_suggestion: '16:9',
    provider_preference: 'nanobanana',
    cinematic_parameters: {
      lightingStyle: 'natural-light',
      compositionTechnique: 'rule-of-thirds',
    },
    examples: [
      {
        input_images: [
          { type: 'character', description: 'Portrait of person' },
          { type: 'location', description: '3 different scenes' },
          { type: 'style', description: 'Reference aesthetic' }
        ],
        output_description: 'Character seamlessly placed in each location'
      }
    ],
    usage_count: 0,
    likes_count: 0,
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'product-in-context',
    type: 'stitch',
    name: 'Product in Lifestyle Context',
    description: 'Showcase products in realistic lifestyle settings',
    category: 'product-marketing',
    prompt_template: 'Generate {count} professional product shots of {object} in {location} settings with {style} photography style',
    required_image_types: ['object', 'location'],
    optional_image_types: ['style'],
    max_images_suggestion: 4,
    aspect_ratio_suggestion: '4:3',
    provider_preference: 'nanobanana',
    cinematic_parameters: {
      lightingStyle: 'soft-light',
      compositionTechnique: 'central-framing',
      shotSize: 'medium-shot',
    },
    examples: [
      {
        input_images: [
          { type: 'object', description: 'Product image' },
          { type: 'location', description: 'Lifestyle settings' },
        ],
        output_description: 'Product naturally integrated into scenes'
      }
    ],
    usage_count: 0,
    likes_count: 0,
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'style-transfer-blend',
    type: 'stitch',
    name: 'Artistic Style Transfer',
    description: 'Apply artistic styles to reference images',
    category: 'style-transfer',
    prompt_template: 'Apply {style} artistic style to {reference} while maintaining composition and subject integrity',
    required_image_types: ['reference', 'style'],
    optional_image_types: [],
    max_images_suggestion: 3,
    aspect_ratio_suggestion: '1:1',
    provider_preference: 'seedream',
    cinematic_parameters: {
      compositionTechnique: 'rule-of-thirds',
    },
    examples: [
      {
        input_images: [
          { type: 'reference', description: 'Base image' },
          { type: 'style', description: 'Artistic style reference' },
        ],
        output_description: 'Image with transferred artistic style'
      }
    ],
    usage_count: 0,
    likes_count: 0,
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'creative-mashup',
    type: 'stitch',
    name: 'Creative Element Mashup',
    description: 'Combine multiple elements into surreal compositions',
    category: 'creative-composite',
    prompt_template: 'Create {count} surreal compositions blending {object} with {location} in {style} style',
    required_image_types: ['object'],
    optional_image_types: ['location', 'style', 'character'],
    max_images_suggestion: 6,
    aspect_ratio_suggestion: '16:9',
    provider_preference: 'nanobanana',
    cinematic_parameters: {
      lightingStyle: 'hard-light',
      compositionTechnique: 'diagonal-composition',
      sceneMood: 'surreal',
    },
    examples: [
      {
        input_images: [
          { type: 'object', description: 'Main subjects' },
          { type: 'location', description: 'Background elements' },
        ],
        output_description: 'Creative surreal compositions'
      }
    ],
    usage_count: 0,
    likes_count: 0,
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'location-character-story',
    type: 'stitch',
    name: 'Character Story Sequence',
    description: 'Create narrative sequences with character and locations',
    category: 'character-scene',
    prompt_template: 'Generate a {count} image story sequence showing {character} progressing through {location} with {style} cinematic feel',
    required_image_types: ['character', 'location'],
    optional_image_types: ['style'],
    max_images_suggestion: 8,
    aspect_ratio_suggestion: '21:9',
    provider_preference: 'nanobanana',
    cinematic_parameters: {
      lightingStyle: 'natural-light',
      compositionTechnique: 'rule-of-thirds',
      cameraMovement: 'tracking-right',
      shotSize: 'medium-shot',
    },
    examples: [
      {
        input_images: [
          { type: 'character', description: 'Main character' },
          { type: 'location', description: 'Story locations' },
        ],
        output_description: 'Cinematic story sequence'
      }
    ],
    usage_count: 0,
    likes_count: 0,
    is_public: true,
    created_at: new Date().toISOString(),
  },
];


/**
 * Universal Mention System Types
 * 
 * Defines all mentionable entity types and their structure for the playground
 * mention system that recognizes cinematic parameters, subjects, locations,
 * colors, dimensions, presets, and source images.
 */

import type {
  CameraAngle,
  LensType,
  ShotSize,
  DepthOfField,
  CompositionTechnique,
  LightingStyle,
  ColorPalette as CinematicColorPalette,
  DirectorStyle,
  EraEmulation,
  SceneMood,
  CameraMovement,
  AspectRatio,
  TimeSetting,
  WeatherCondition,
  LocationType,
  CinematicParameters
} from '@preset/types';

// Core mention types covering all recognizable entities
export type MentionType = 
  | 'subject'              // portrait, landscape, character, product
  | 'cinematic-parameter'  // All CinematicParameters types
  | 'location'             // LocationType from cinematic params
  | 'color'                // ColorPalette from cinematic params
  | 'dimension'            // AspectRatio, resolution, size
  | 'preset'               // User's saved presets
  | 'source-image'         // Referenced images from gallery
  | 'style'                // DirectorStyle, EraEmulation
  | 'lighting'             // LightingStyle
  | 'camera'               // CameraAngle, CameraMovement, LensType
  | 'composition'          // CompositionTechnique
  | 'mood'                 // SceneMood
  | 'time'                 // TimeSetting
  | 'weather'              // WeatherCondition
  | 'shot-size'            // ShotSize
  | 'depth-of-field'       // DepthOfField
  | 'resolution'           // Image/video resolution
  | 'edit-type';           // Edit operations (upscale, enhance, etc.)

// Base interface for all mentionable entities
export interface MentionableEntity {
  id: string;
  label: string;
  type: MentionType;
  value: string;
  color?: string;  // Preset green (#0FA678) for recognized entities
  thumbnail?: string;  // For images
  metadata?: {
    category?: string;
    subcategory?: string;
    description?: string;
    relatedParams?: string[];
    synonyms?: string[];  // Alternative names for fuzzy matching
    confidence?: number;  // AI detection confidence
  };
}

// Parsed mention result from text analysis
export interface ParsedMention {
  entity: MentionableEntity;
  startIndex: number;
  endIndex: number;
  originalText: string;
  confidence: number;
  context?: string;  // Surrounding text for context
}

// Subject types for image generation
export const SUBJECT_TYPES = [
  'portrait',
  'landscape',
  'character',
  'product',
  'fashion',
  'architecture',
  'nature',
  'animal',
  'vehicle',
  'food',
  'abstract',
  'concept art',
  'illustration',
  'photography',
  'artwork',
  'logo',
  'icon',
  'text',
  'pattern',
  'texture'
] as const;

export type SubjectType = typeof SUBJECT_TYPES[number];

// Resolution presets
export const RESOLUTION_PRESETS = [
  '512x512',
  '768x768',
  '1024x1024',
  '1024x1536',
  '1536x1024',
  '1536x1536',
  '2048x2048',
  '1920x1080',
  '1080x1920',
  '2560x1440',
  '1440x2560',
  '3840x2160',
  '2160x3840'
] as const;

export type ResolutionPreset = typeof RESOLUTION_PRESETS[number];

// Edit operation types
export const EDIT_TYPES = [
  'upscale',
  'enhance',
  'remove-background',
  'add-background',
  'colorize',
  'denoise',
  'sharpen',
  'blur',
  'crop',
  'resize',
  'rotate',
  'flip',
  'adjust-brightness',
  'adjust-contrast',
  'adjust-saturation',
  'adjust-hue',
  'add-text',
  'remove-object',
  'replace-object',
  'style-transfer'
] as const;

export type EditType = typeof EDIT_TYPES[number];

// Video-specific mention types
export const VIDEO_MOTION_TYPES = [
  'static',
  'slow-motion',
  'fast-motion',
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'tilt-up',
  'tilt-down',
  'rotate',
  'fade-in',
  'fade-out',
  'crossfade',
  'wipe',
  'slide',
  'bounce',
  'elastic',
  'smooth',
  'jittery',
  'cinematic'
] as const;

export type VideoMotionType = typeof VIDEO_MOTION_TYPES[number];

// Utility function to create mentionable entity
export function createMentionableEntity(
  id: string,
  label: string,
  type: MentionType,
  value: string,
  options: {
    color?: string;
    thumbnail?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    relatedParams?: string[];
    synonyms?: string[];
    confidence?: number;
  } = {}
): MentionableEntity {
  return {
    id,
    label,
    type,
    value,
    color: options.color || (type === 'cinematic-parameter' ? '#0FA678' : undefined),
    thumbnail: options.thumbnail,
    metadata: {
      category: options.category,
      subcategory: options.subcategory,
      description: options.description,
      relatedParams: options.relatedParams,
      synonyms: options.synonyms,
      confidence: options.confidence
    }
  };
}

// Helper to get all cinematic parameter values as mentionable entities
export function getCinematicParameterEntities(): MentionableEntity[] {
  const entities: MentionableEntity[] = [];

  // Camera angles
  const cameraAngles: CameraAngle[] = [
    'high-angle', 'low-angle', 'eye-level', 'worms-eye-view', 'birds-eye-view',
    'dutch-angle', 'over-the-shoulder', 'point-of-view', 'canted-angle'
  ];
  
  cameraAngles.forEach(angle => {
    entities.push(createMentionableEntity(
      `camera-${angle}`,
      angle.replace(/-/g, ' '),
      'camera',
      angle,
      { category: 'Camera', subcategory: 'Angle', synonyms: [angle.replace(/-/g, ' ')] }
    ));
  });

  // Lighting styles
  const lightingStyles: LightingStyle[] = [
    'natural-light', 'high-key', 'low-key', 'chiaroscuro', 'backlit-silhouette',
    'rim-lighting', 'side-lighting', 'top-lighting', 'bottom-lighting',
    'colored-gels', 'practical-lighting', 'hard-light', 'soft-light',
    'mixed-lighting', 'volumetric-lighting'
  ];

  lightingStyles.forEach(lighting => {
    entities.push(createMentionableEntity(
      `lighting-${lighting}`,
      lighting.replace(/-/g, ' '),
      'lighting',
      lighting,
      { category: 'Lighting', subcategory: 'Style', synonyms: [lighting.replace(/-/g, ' ')] }
    ));
  });

  // Aspect ratios
  const aspectRatios: AspectRatio[] = [
    '1:1', '4:3', '16:9', '21:9', '2.39:1', '2.35:1', '1.85:1', '9:16',
    '3:2', '5:4', '6:7', 'golden-ratio', 'cinema-scope', 'vista-vision',
    'imax', 'full-frame', 'aps-c', 'micro-four-thirds', 'medium-format', 'large-format'
  ];

  aspectRatios.forEach(ratio => {
    entities.push(createMentionableEntity(
      `aspect-${ratio}`,
      ratio,
      'dimension',
      ratio,
      { category: 'Dimensions', subcategory: 'Aspect Ratio', synonyms: [ratio] }
    ));
  });

  // Time settings
  const timeSettings: TimeSetting[] = [
    'dawn', 'morning', 'midday', 'afternoon', 'golden-hour', 'sunset',
    'dusk', 'twilight', 'night', 'midnight', 'blue-hour', 'magic-hour',
    'high-noon', 'late-afternoon', 'early-evening', 'late-night',
    'pre-dawn', 'post-sunset', 'overcast-day', 'stormy-weather'
  ];

  timeSettings.forEach(time => {
    entities.push(createMentionableEntity(
      `time-${time}`,
      time.replace(/-/g, ' '),
      'time',
      time,
      { category: 'Time', subcategory: 'Setting', synonyms: [time.replace(/-/g, ' ')] }
    ));
  });

  // Location types
  const locationTypes: LocationType[] = [
    'urban-street', 'rural-field', 'forest', 'desert', 'mountain', 'beach',
    'lake', 'ocean', 'park', 'garden', 'rooftop', 'alleyway', 'highway',
    'bridge', 'tunnel', 'courtyard', 'plaza', 'marketplace', 'playground',
    'cemetery', 'ruins', 'construction-site', 'industrial-area',
    'residential-neighborhood', 'downtown', 'suburb', 'waterfront',
    'skyline', 'countryside'
  ];

  locationTypes.forEach(location => {
    entities.push(createMentionableEntity(
      `location-${location}`,
      location.replace(/-/g, ' '),
      'location',
      location,
      { category: 'Location', subcategory: 'Type', synonyms: [location.replace(/-/g, ' ')] }
    ));
  });

  // Director styles
  const directorStyles: DirectorStyle[] = [
    'wes-anderson', 'roger-deakins', 'christopher-doyle', 'david-fincher',
    'sofia-coppola', 'stanley-kubrick', 'terrence-malick', 'paul-thomas-anderson',
    'denis-villeneuve', 'emmanuel-lubezki', 'janusz-kaminski', 'robert-richardson',
    'darius-khondji', 'bruno-delbonnel', 'seamus-mcgarvey', 'christopher-nolan',
    'greta-gerwig', 'jordan-peele'
  ];

  directorStyles.forEach(style => {
    entities.push(createMentionableEntity(
      `style-${style}`,
      style.replace(/-/g, ' '),
      'style',
      style,
      { category: 'Style', subcategory: 'Director', synonyms: [style.replace(/-/g, ' ')] }
    ));
  });

  // Scene moods
  const sceneMoods: SceneMood[] = [
    'gritty', 'dreamlike', 'futuristic', 'romantic', 'action-packed', 'film-noir',
    'melancholic', 'mysterious', 'nostalgic', 'dramatic', 'peaceful', 'tense',
    'epic', 'intimate', 'surreal', 'minimalist', 'baroque', 'industrial',
    'natural', 'ethereal', 'cyberpunk-neon', 'cozy-autumn', 'melancholic-rain',
    'ethereal-dream', 'industrial-grit'
  ];

  sceneMoods.forEach(mood => {
    entities.push(createMentionableEntity(
      `mood-${mood}`,
      mood.replace(/-/g, ' '),
      'mood',
      mood,
      { category: 'Mood', subcategory: 'Scene', synonyms: [mood.replace(/-/g, ' ')] }
    ));
  });

  return entities;
}

// Helper to get subject type entities
export function getSubjectTypeEntities(): MentionableEntity[] {
  return SUBJECT_TYPES.map(subject => 
    createMentionableEntity(
      `subject-${subject}`,
      subject,
      'subject',
      subject,
      { category: 'Subject', subcategory: 'Type', synonyms: [subject] }
    )
  );
}

// Helper to get resolution entities
export function getResolutionEntities(): MentionableEntity[] {
  return RESOLUTION_PRESETS.map(resolution => 
    createMentionableEntity(
      `resolution-${resolution}`,
      resolution,
      'resolution',
      resolution,
      { category: 'Dimensions', subcategory: 'Resolution', synonyms: [resolution] }
    )
  );
}

// Helper to get edit type entities
export function getEditTypeEntities(): MentionableEntity[] {
  return EDIT_TYPES.map(editType => 
    createMentionableEntity(
      `edit-${editType}`,
      editType.replace(/-/g, ' '),
      'edit-type',
      editType,
      { category: 'Edit', subcategory: 'Operation', synonyms: [editType.replace(/-/g, ' ')] }
    )
  );
}

// Helper to get video motion entities
export function getVideoMotionEntities(): MentionableEntity[] {
  return VIDEO_MOTION_TYPES.map(motion => 
    createMentionableEntity(
      `motion-${motion}`,
      motion.replace(/-/g, ' '),
      'cinematic-parameter',
      motion,
      { category: 'Video', subcategory: 'Motion', synonyms: [motion.replace(/-/g, ' ')] }
    )
  );
}

// Get all default mentionable entities
export function getAllDefaultEntities(): MentionableEntity[] {
  return [
    ...getCinematicParameterEntities(),
    ...getSubjectTypeEntities(),
    ...getResolutionEntities(),
    ...getEditTypeEntities(),
    ...getVideoMotionEntities()
  ];
}

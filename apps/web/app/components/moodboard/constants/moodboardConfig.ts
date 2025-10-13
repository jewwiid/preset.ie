/**
 * Configuration constants for the Moodboard system
 */

import { SubscriptionLimits, SubscriptionTier } from '../lib/moodboardTypes'

/**
 * Maximum number of items allowed in a moodboard
 */
export const MAX_MOODBOARD_ITEMS = 50

/**
 * Maximum file size for uploads (in bytes) - 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Supported image formats
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]

/**
 * Supported video formats
 */
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
]

/**
 * All supported formats
 */
export const SUPPORTED_FORMATS = [
  ...SUPPORTED_IMAGE_FORMATS,
  ...SUPPORTED_VIDEO_FORMATS
]

/**
 * Pexels API configuration
 */
export const PEXELS_CONFIG = {
  RESULTS_PER_PAGE: 15,
  MAX_RESULTS: 1000,
  DEFAULT_ORIENTATION: '',
  DEFAULT_SIZE: '',
  DEFAULT_COLOR: ''
} as const

/**
 * Enhancement providers configuration
 */
export const ENHANCEMENT_PROVIDERS = {
  nanobanana: {
    name: 'Nanobanana',
    display: 'Nanobanana (Fast)',
    estimatedTime: '30-60s',
    creditCost: 1
  },
  seedream: {
    name: 'Seedream',
    display: 'Seedream (High Quality)',
    estimatedTime: '60-120s',
    creditCost: 2
  }
} as const

/**
 * Enhancement types and their prompts
 */
export const ENHANCEMENT_TYPES = {
  lighting: 'Improve lighting and exposure',
  style: 'Apply artistic style',
  background: 'Modify background',
  mood: 'Adjust mood and atmosphere',
  custom: 'Custom enhancement'
} as const

/**
 * Subscription tier limits
 */
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: { userUploads: 0, aiEnhancements: 0 },
  FREE: { userUploads: 0, aiEnhancements: 0 },
  plus: { userUploads: 3, aiEnhancements: 2 },
  PLUS: { userUploads: 3, aiEnhancements: 2 },
  pro: { userUploads: 10, aiEnhancements: 10 },
  PRO: { userUploads: 10, aiEnhancements: 10 }
}

/**
 * Default palette colors (fallback)
 */
export const DEFAULT_PALETTE = [
  '#1a1a1a',
  '#4a4a4a',
  '#8a8a8a',
  '#c0c0c0',
  '#f0f0f0'
]

/**
 * Enhancement status labels
 */
export const ENHANCEMENT_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed'
} as const

/**
 * Poll interval for enhancement status (milliseconds)
 */
export const ENHANCEMENT_POLL_INTERVAL = 2000

/**
 * Maximum poll attempts before giving up
 */
export const MAX_ENHANCEMENT_POLL_ATTEMPTS = 60

/**
 * Drag and drop configuration
 */
export const DND_CONFIG = {
  DRAG_DELAY: 100,
  DRAG_THRESHOLD: 5
} as const

/**
 * Debounce delays (milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 500,
  AUTO_SAVE: 1000,
  PALETTE_EXTRACT: 300
} as const

/**
 * Image optimization settings
 */
export const IMAGE_OPTIMIZATION = {
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  QUALITY: 0.85,
  THUMBNAIL_SIZE: 400
} as const

/**
 * Vibe & Style predefined tags
 */
export const PREDEFINED_TAGS = [
  'Minimalist',
  'Vintage',
  'Modern',
  'Retro',
  'Dark',
  'Bright',
  'Warm',
  'Cool',
  'Organic',
  'Geometric',
  'Abstract',
  'Realistic',
  'Playful',
  'Professional',
  'Elegant',
  'Bold',
  'Subtle'
] as const

/**
 * Maximum number of custom tags
 */
export const MAX_CUSTOM_TAGS = 10

/**
 * Maximum tag length
 */
export const MAX_TAG_LENGTH = 30

/**
 * Configuration constants for Playground
 */

// ============================================================================
// Generation Settings
// ============================================================================

export const RESOLUTION_OPTIONS = [
  { label: '512x512', value: '512x512', credits: 1 },
  { label: '1024x1024', value: '1024x1024', credits: 2 },
  { label: '2048x2048', value: '2048x2048', credits: 4 },
] as const

export const ASPECT_RATIO_OPTIONS = [
  { label: '1:1 Square', value: '1:1' },
  { label: '16:9 Landscape', value: '16:9' },
  { label: '9:16 Portrait', value: '9:16' },
  { label: '4:3 Classic', value: '4:3' },
  { label: '3:4 Portrait', value: '3:4' },
] as const

export const CONSISTENCY_LEVELS = [
  { label: 'Low', value: 'low', description: 'More variation, less control' },
  { label: 'Medium', value: 'medium', description: 'Balanced variation and control' },
  { label: 'High', value: 'high', description: 'More control, less variation' },
] as const

export const NUM_IMAGES_OPTIONS = [1, 2, 3, 4, 6, 8] as const

// ============================================================================
// Style Presets
// ============================================================================

export const STYLE_PRESETS = [
  { label: 'Realistic', value: 'realistic' },
  { label: 'Cinematic', value: 'cinematic' },
  { label: 'Anime', value: 'anime' },
  { label: 'Digital Art', value: 'digital-art' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'Photographic', value: 'photographic' },
  { label: 'Comic Book', value: 'comic-book' },
  { label: '3D Model', value: '3d-model' },
  { label: 'Pixel Art', value: 'pixel-art' },
  { label: 'Line Art', value: 'line-art' },
  { label: 'Watercolor', value: 'watercolor' },
  { label: 'Oil Painting', value: 'oil-painting' },
  { label: 'Sketch', value: 'sketch' },
  { label: 'Neon Punk', value: 'neon-punk' },
  { label: 'Origami', value: 'origami' },
] as const

// ============================================================================
// Edit Types
// ============================================================================

export const EDIT_TYPES = [
  { label: 'Inpaint', value: 'inpaint', description: 'Edit specific areas of the image' },
  { label: 'Outpaint', value: 'outpaint', description: 'Extend the image beyond its borders' },
  { label: 'Upscale', value: 'upscale', description: 'Increase image resolution' },
  { label: 'Remove Background', value: 'remove-bg', description: 'Remove image background' },
  { label: 'Color Correction', value: 'color-correct', description: 'Adjust colors and lighting' },
  { label: 'Style Transfer', value: 'style-transfer', description: 'Apply artistic styles' },
] as const

export const EDIT_STRENGTH_LEVELS = [
  { label: 'Subtle', value: 0.3 },
  { label: 'Moderate', value: 0.5 },
  { label: 'Strong', value: 0.7 },
  { label: 'Very Strong', value: 0.9 },
] as const

// ============================================================================
// Video Generation Settings
// ============================================================================

export const VIDEO_DURATIONS = [
  { label: '3 seconds', value: 3, credits: 6 },
  { label: '5 seconds', value: 5, credits: 8 },
  { label: '10 seconds', value: 10, credits: 15 },
] as const

export const VIDEO_RESOLUTIONS = [
  { label: '480p', value: '480p' },
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
] as const

export const CAMERA_MOVEMENTS = [
  { label: 'Smooth', value: 'smooth', description: 'Gentle, flowing motion' },
  { label: 'Dynamic', value: 'dynamic', description: 'Energetic, rapid motion' },
  { label: 'Static', value: 'static', description: 'Minimal to no motion' },
  { label: 'Pan Left', value: 'pan-left', description: 'Camera pans to the left' },
  { label: 'Pan Right', value: 'pan-right', description: 'Camera pans to the right' },
  { label: 'Zoom In', value: 'zoom-in', description: 'Camera zooms closer' },
  { label: 'Zoom Out', value: 'zoom-out', description: 'Camera zooms away' },
  { label: 'Orbit', value: 'orbit', description: 'Camera circles the subject' },
] as const

// ============================================================================
// Batch Processing Settings
// ============================================================================

export const MAX_BATCH_SIZE = 10
export const MIN_BATCH_SIZE = 2

export const BATCH_PROCESSING_MODES = [
  { label: 'Sequential', value: 'sequential', description: 'Process images one after another' },
  { label: 'Parallel', value: 'parallel', description: 'Process all images simultaneously' },
] as const

// ============================================================================
// Credit Costs
// ============================================================================

export const CREDIT_COSTS = {
  IMAGE_GENERATION: 2,
  IMAGE_EDIT: 3,
  VIDEO_GENERATION_BASE: 8,
  STYLE_VARIATION: 2,
  UPSCALE: 4,
  BACKGROUND_REMOVAL: 1,
} as const

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    monthlyCredits: 10,
    features: ['Basic image generation', 'Standard resolution'],
  },
  BASIC: {
    name: 'Basic',
    monthlyCredits: 100,
    features: ['All Free features', 'HD resolution', 'Advanced editing'],
  },
  PRO: {
    name: 'Pro',
    monthlyCredits: 500,
    features: ['All Basic features', 'Video generation', 'Batch processing', 'Priority support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthlyCredits: -1, // Unlimited
    features: ['All Pro features', 'Unlimited generations', 'API access', 'Dedicated support'],
  },
} as const

// ============================================================================
// API Configuration
// ============================================================================

export const API_ENDPOINTS = {
  GENERATE: '/api/playground/generate',
  ADVANCED_EDIT: '/api/playground/advanced-edit',
  SEQUENTIAL: '/api/playground/edit-sequential',
  STYLE_VARIATIONS: '/api/playground/style-variations',
  BATCH_EDIT: '/api/playground/batch-edit',
  VIDEO: '/api/playground/video',
  VIDEO_STATUS: '/api/playground/video',
  SAVE_TO_GALLERY: '/api/playground/save-to-gallery',
  SAVE_VIDEO_TO_GALLERY: '/api/playground/save-video-to-gallery',
  USER_CREDITS: '/api/user/credits',
} as const

export const VIDEO_POLLING_CONFIG = {
  MAX_ATTEMPTS: 60,
  POLL_INTERVAL_MS: 5000,
  TIMEOUT_MESSAGE: 'Video generation timed out',
} as const

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required. Please sign in again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  INSUFFICIENT_CREDITS: 'You don\'t have enough credits to complete this action.',
  SERVICE_UNAVAILABLE: 'The image generation service is temporarily unavailable. Please try again in a few minutes.',
  RATE_LIMITED: 'Too many requests. Please wait a moment before trying again.',
  GENERATION_FAILED: 'Failed to generate images',
  EDIT_FAILED: 'Failed to edit image',
  VIDEO_FAILED: 'Failed to generate video',
  SAVE_FAILED: 'Failed to save to gallery',
  UNKNOWN_ERROR: 'Unknown error occurred',
} as const

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_GENERATION_SETTINGS = {
  style: 'realistic',
  resolution: '1024x1024',
  aspectRatio: '1:1',
  consistencyLevel: 'medium',
  numImages: 1,
  intensity: 1.0,
  generationMode: 'text-to-image' as const,
}

export const DEFAULT_VIDEO_SETTINGS = {
  duration: 5,
  resolution: '720p',
  cameraMovement: 'smooth',
  aspectRatio: '16:9',
}

export const DEFAULT_EDIT_SETTINGS = {
  editType: 'inpaint',
  strength: 0.5,
}

// ============================================================================
// UI Configuration
// ============================================================================

export const PLAYGROUND_TABS = [
  { id: 'generate', label: 'Generate', icon: 'Sparkles' },
  { id: 'edit', label: 'Edit', icon: 'Wand2' },
  { id: 'video', label: 'Video', icon: 'Film' },
  { id: 'batch', label: 'Batch', icon: 'Grid' },
  { id: 'gallery', label: 'Gallery', icon: 'Image' },
  { id: 'history', label: 'History', icon: 'Clock' },
] as const

export const IMAGE_GALLERY_LAYOUT = {
  COLUMNS: {
    MOBILE: 1,
    TABLET: 2,
    DESKTOP: 3,
  },
  GAP: 16,
  MIN_HEIGHT: 200,
} as const

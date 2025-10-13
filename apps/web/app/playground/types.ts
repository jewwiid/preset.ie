/**
 * Type definitions for Playground
 */

// ============================================================================
// Core Types
// ============================================================================

export interface PlaygroundProject {
  id: string
  title: string
  prompt: string
  style?: string
  aspect_ratio?: string
  resolution?: string
  metadata?: ProjectMetadata
  generated_images: GeneratedImage[]
  selected_image_url?: string
  status: string
  credits_used: number
  created_at: string
  last_generated_at: string
  is_video?: boolean
}

export interface ProjectMetadata {
  enhanced_prompt?: string
  style_applied?: string
  style_prompt?: string
  consistency_level?: string
  custom_style_preset?: CustomStylePreset
  generation_mode?: GenerationMode
  base_image?: string
  api_endpoint?: string
  cinematic_parameters?: CinematicParameters
  include_technical_details?: boolean
  include_style_references?: boolean
  intensity?: number
  provider?: string
}

export interface GeneratedImage {
  url: string
  width: number
  height: number
  generated_at: string
  type?: ImageType
  duration?: number
  resolution?: string
  cameraMovement?: string
  presetId?: string | null
}

export type ImageType = 'base' | 'edit' | 'video'
export type GenerationMode = 'text-to-image' | 'image-to-image'

// ============================================================================
// Generation Parameters
// ============================================================================

export interface GenerateImagesParams {
  prompt: string
  style: string
  resolution: string
  consistencyLevel: string
  numImages: number
  customStylePreset?: CustomStylePreset
  baseImage?: string
  generationMode?: GenerationMode
  intensity?: number
  cinematicParameters?: CinematicParameters
  enhancedPrompt?: string
  includeTechnicalDetails?: boolean
  includeStyleReferences?: boolean
  replaceLatestImages?: boolean
  userSubject?: string
}

export interface AdvancedEditParams {
  imageUrl: string
  editType: string
  editPrompt: string
  strength: number
  referenceImage?: string
}

export interface SequentialImagesParams {
  prompt: string
  numImages: number
  style: string
  resolution: string
  consistencyLevel: string
}

export interface SequentialEditsParams {
  prompt: string
  images: string[]
  numImages: number
  resolution: string
}

export interface StyleVariationsParams {
  imageUrl: string
  styles: string[]
}

export interface BatchEditParams {
  prompt: string
  images: string[]
  editType: string
}

export interface VideoGenerationParams {
  imageUrl: string
  duration: number
  resolution: string
  cameraMovement: string
  aspectRatio: string
  prompt: string
  videoStyle?: string
  yPosition?: number
  cinematicParameters?: CinematicParameters
  includeTechnicalDetails?: boolean
  includeStyleReferences?: boolean
  presetId?: string
}

// ============================================================================
// Preset & Style Types
// ============================================================================

export interface CustomStylePreset {
  id?: string
  name: string
  description?: string
  prompt_template?: string
  style_settings?: StyleSettings
  ai_metadata?: AIMetadata
}

export interface StyleSettings {
  style?: string
  mood?: string
  lighting?: string
  color_palette?: string
  composition?: string
}

export interface AIMetadata {
  style?: string
  mood?: string
  lighting?: string
  color_palette?: string[]
  composition?: string
  camera_angle?: string
  focus?: string
  texture?: string
}

export interface CinematicParameters {
  camera_angle?: string
  lighting_setup?: string
  color_grading?: string
  depth_of_field?: string
  composition_style?: string
  mood?: string
  texture?: string
  focus?: string
  [key: string]: string | undefined
}

// ============================================================================
// Video Types
// ============================================================================

export type VideoGenerationStatus = 'idle' | 'generating' | 'completed'

export interface VideoMetadata {
  aspectRatio: string
  resolution: string
  duration: number
  prompt: string
  cameraMovement: string
  styledImageUrl?: string | null
  presetId?: string | null
}

export interface GeneratedVideoData {
  url: string
  title?: string
  index: number
  type?: MediaType
}

export type MediaType = 'image' | 'video'

// ============================================================================
// API Response Types
// ============================================================================

export interface GenerateImagesResponse {
  project: PlaygroundProject
  images: GeneratedImage[]
  creditsUsed: number
  warning?: string
}

export interface AdvancedEditResponse {
  editedImage: string
  creditsUsed: number
}

export interface VideoGenerationResponse {
  taskId: string
  creditsUsed: number
  styledImageUrl?: string
}

export interface VideoStatusResponse {
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}

export interface BatchJobResponse {
  batchJobId: string
  results: BatchResult[]
  creditsUsed: number
  errors?: BatchError[]
}

export interface BatchResult {
  editedImage?: string
  styledImage?: string
  index: number
  success: boolean
}

export interface BatchError {
  index: number
  error: string
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ActivePreset {
  id: string
  name: string
}

export interface FullScreenMedia {
  url: string
  title?: string
  index: number
  type?: MediaType
}

// ============================================================================
// Generation Metadata for Gallery
// ============================================================================

export interface ImageGenerationMetadata {
  prompt: string
  style: string
  aspect_ratio: string
  resolution: string
  consistency_level: string
  enhanced_prompt?: string
  style_applied?: string
  style_prompt?: string
  custom_style_preset?: CustomStylePreset | null
  generation_mode: GenerationMode
  base_image?: string | null
  api_endpoint: string
  credits_used: number
  generated_at: string
  cinematic_parameters?: CinematicParameters | null
  include_technical_details?: boolean
  include_style_references?: boolean
  intensity?: number
  provider?: string
  actual_width?: number
  actual_height?: number
}

export interface VideoGenerationMetadata {
  generated_at: string
  credits_used: number
  duration: number
  resolution: string
  aspect_ratio: string
  camera_movement: string
  image_url: string | null
  task_id: string | null
  prompt: string
  style: string
  consistency_level: string
  preset_id?: string | null
}

// ============================================================================
// Subscription Types
// ============================================================================

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'

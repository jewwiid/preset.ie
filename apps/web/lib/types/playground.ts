// Playground Types and Interfaces
// This file defines all the types needed for the image generation playground

import { CinematicParameters } from '../../../../packages/types/src/cinematic-parameters'

export interface Preset {
  id: string
  name: string
  description?: string
  category: string
  prompt_template: string
  negative_prompt?: string
  style_settings: {
    style: string
    intensity: number
    consistency_level: string
    generation_mode?: 'text-to-image' | 'image-to-image'
  }
  technical_settings: {
    resolution: string
    aspect_ratio: string
    num_images: number
    quality?: string
  }
  cinematic_settings?: {
    enableCinematicMode?: boolean
    cinematicParameters?: Record<string, unknown>
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    generationMode?: 'text-to-image' | 'image-to-image'
    selectedProvider?: 'nanobanana' | 'seedream'
  }
  likes_count: number
  ai_metadata: {
    model_version?: string
    generation_mode?: string
    migrated_from_style_preset?: boolean
    original_style_preset_id?: string
  }
  seedream_config: {
    model: string
    steps: number
    guidance_scale: number
    scheduler: string
  }
  usage_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

export interface SavedImage {
  id: string
  image_url: string
  title: string
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  liked: boolean
  alt: string
}

export interface PexelsFilters {
  orientation: string
  size: string
  color: string
}

export interface PexelsSearchState {
  query: string
  results: PexelsPhoto[]
  loading: boolean
  page: number
  totalResults: number
  filters: PexelsFilters
  customHexColor: string
  showHexInput: boolean
}

export interface GenerationParams {
  prompt: string
  style: string
  resolution: string
  consistencyLevel: string
  numImages: number
  customStylePreset?: Preset
  baseImage?: string
  generationMode?: 'text-to-image' | 'image-to-image'
  intensity?: number
  cinematicParameters?: Partial<CinematicParameters>
  enhancedPrompt?: string
  includeTechnicalDetails?: boolean
  includeStyleReferences?: boolean
  selectedProvider?: 'nanobanana' | 'seedream'
  replaceLatestImages?: boolean
  userSubject?: string
}

export interface SettingsChangeParams {
  resolution: string
  aspectRatio?: string
  baseImageAspectRatio?: string
  baseImageUrl?: string
  onRemoveBaseImage?: () => void
  generationMode?: 'text-to-image' | 'image-to-image'
  style?: string
  selectedProvider?: string
  consistencyLevel?: string
  prompt?: string
  enhancedPrompt?: string
}

export interface UnifiedImageGenerationPanelProps {
  onGenerate: (params: GenerationParams) => Promise<void>
  onSettingsChange?: (settings: SettingsChangeParams) => void
  loading: boolean
  userCredits: number
  userSubscriptionTier: string
  savedImages?: SavedImage[]
  onSelectSavedImage?: (imageUrl: string) => void
  selectedPreset?: Preset | null
  onPresetApplied?: () => void
  currentStyle?: string
  onStyleChange?: (style: string) => void
  generationMode?: 'text-to-image' | 'image-to-image'
  onGenerationModeChange?: (mode: 'text-to-image' | 'image-to-image') => void
  selectedProvider?: string
  onProviderChange?: (provider: string) => void
  consistencyLevel?: string
  onConsistencyChange?: (consistency: string) => void
  aspectRatio?: string
  onPromptChange?: (prompt: string) => void
  onEnhancedPromptChange?: (enhancedPrompt: string) => void
}

// Component Props Types
export interface BaseImageUploaderProps {
  baseImage: string | null
  baseImageSource: 'upload' | 'saved' | 'pexels' | null
  baseImageDimensions: ImageDimensions | null
  savedImages: SavedImage[]
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveBaseImage: () => void
  onSelectBaseImageSource: (source: 'upload' | 'saved' | 'pexels') => void
  onSelectSavedImage: (imageUrl: string) => void
  generationMode: 'text-to-image' | 'image-to-image'
}

export interface PexelsSearchPanelProps {
  pexelsState: PexelsSearchState
  onQueryChange: (query: string) => void
  onFiltersChange: (filters: Partial<PexelsFilters>) => void
  onCustomHexColorChange: (color: string) => void
  onToggleHexInput: (show: boolean) => void
  onSelectPhoto: (photoUrl: string) => void
  onPageChange: (page: number) => void
}

export interface PromptBuilderProps {
  userSubject: string
  prompt: string
  enhancedPrompt: string
  originalPrompt: string
  isPromptModified: boolean
  isEnhancing: boolean
  isPromptUpdating: boolean
  enableCinematicMode: boolean
  onUserSubjectChange: (subject: string) => void
  onPromptChange: (prompt: string) => void
  onEnhancedPromptChange: (enhancedPrompt: string) => void
  onAIEnhance: () => void
  onClearAll: () => void
  onSavePreset: () => void
  cinematicParameters?: Partial<CinematicParameters>
  style: string
}

export interface CinematicModePanelProps {
  enableCinematicMode: boolean
  cinematicParameters: Partial<CinematicParameters>
  includeTechnicalDetails: boolean
  includeStyleReferences: boolean
  showCinematicPreview: boolean
  onToggleCinematicMode: (enabled: boolean) => void
  onCinematicParametersChange: (params: Partial<CinematicParameters>) => void
  onToggleChange: (technicalDetails: boolean, styleReferences: boolean) => void
  onTogglePreview: () => void
}

export interface GenerationSettingsProps {
  resolution: string
  aspectRatio: string
  numImages: number
  intensity: number
  style: string
  consistencyLevel: string
  selectedProvider: string
  generationMode: 'text-to-image' | 'image-to-image'
  userSubscriptionTier: string
  baseImage: string | null
  onResolutionChange: (resolution: string) => void
  onAspectRatioChange: (aspectRatio: string) => void
  onNumImagesChange: (numImages: number) => void
  onIntensityChange: (intensity: number) => void
  onStyleChange: (style: string) => void
  onConsistencyChange: (consistency: string) => void
  onProviderChange: (provider: string) => void
}

export interface SavePresetDialogProps {
  isOpen: boolean
  prompt: string
  enhancedPrompt: string
  style: string
  resolution: string
  aspectRatio: string
  numImages: number
  intensity: number
  consistencyLevel: string
  enableCinematicMode: boolean
  cinematicParameters: Partial<CinematicParameters>
  includeTechnicalDetails: boolean
  includeStyleReferences: boolean
  selectedProvider: string
  generationMode: 'text-to-image' | 'image-to-image'
  onClose: () => void
  onSave: (presetData: Record<string, unknown>) => void
}

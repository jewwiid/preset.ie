/**
 * Type definitions for the Moodboard system
 */

export type ImageSource = 'upload' | 'pexels' | 'url' | 'ai-enhanced'
export type ItemType = 'image' | 'video' | 'pexels'
export type EnhancementStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type EnhancementType = 'lighting' | 'style' | 'background' | 'mood' | 'custom'
export type EnhancementProvider = 'nanobanana' | 'seedream'
export type SubscriptionTier = 'free' | 'FREE' | 'plus' | 'PLUS' | 'pro' | 'PRO'
export type TabType = 'upload' | 'pexels' | 'saved' | 'url' | 'enhance'

/**
 * Individual moodboard item (image or video)
 */
export interface MoodboardItem {
  id: string
  type: ItemType
  source: ImageSource
  url: string
  thumbnail_url?: string
  enhanced_url?: string
  caption?: string
  width?: number
  height?: number
  photographer?: string
  photographer_url?: string
  position: number
  enhancement_prompt?: string
  original_image_id?: string
  original_url?: string
  enhancement_task_id?: string
  enhancement_status?: EnhancementStatus
  cost?: number
  showing_original?: boolean
}

/**
 * Enhancement request for an image
 */
export interface EnhancementRequest {
  imageId: string
  enhancementType: EnhancementType
  prompt: string
  selectedProvider?: EnhancementProvider
}

/**
 * Enhancement task tracking
 */
export interface EnhancementTask {
  status: string
  progress: number
  taskId?: string
  url?: string
  type?: string
  prompt?: string
}

/**
 * Active enhancement state
 */
export interface ActiveEnhancement {
  itemId: string
  taskId: string
  url: string
  type: string
  prompt: string
}

/**
 * Pexels photo from API
 */
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

/**
 * Pexels search filters
 */
export interface PexelsFilters {
  orientation: '' | 'landscape' | 'portrait' | 'square'
  size: '' | 'large' | 'medium' | 'small'
  color: string
}

/**
 * User credits information
 */
export interface UserCredits {
  current: number
  monthly: number
}

/**
 * AI analysis result
 */
export interface AIAnalysis {
  description?: string
  mood?: string
}

/**
 * Saved image from user's library
 */
export interface SavedImage {
  id: string
  image_url: string
  title: string
  created_at: string
}

/**
 * Complete moodboard data structure
 */
export interface Moodboard {
  id?: string
  user_id?: string
  gig_id?: string
  title: string
  summary?: string
  description?: string
  items: MoodboardItem[]
  palette?: string[]
  tags?: string[]
  featured_image_id?: string
  is_public?: boolean
  template_name?: string
  save_as_template?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * MoodboardBuilder component props
 */
export interface MoodboardBuilderProps {
  gigId?: string
  moodboardId?: string
  onSave?: (moodboardId: string) => void
  onCancel?: () => void
  compactMode?: boolean
  onFeaturedImageChange?: (imageUrl: string | null) => void
}

/**
 * Subscription limits
 */
export interface SubscriptionLimits {
  userUploads: number
  aiEnhancements: number
}

/**
 * Enhancement modal state
 */
export interface EnhancementModalState {
  isOpen: boolean
  itemId: string | null
}

/**
 * Template data
 */
export interface MoodboardTemplate {
  id: string
  name: string
  user_id: string
  items: MoodboardItem[]
  palette?: string[]
  tags?: string[]
  is_public: boolean
  created_at: string
}

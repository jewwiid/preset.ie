/**
 * Utility helper functions for the Moodboard system
 */

import { MoodboardItem, SubscriptionTier, SubscriptionLimits, MoodboardTemplate } from './moodboardTypes'
import { SUBSCRIPTION_LIMITS, ENHANCEMENT_STATUS_LABELS, SUPPORTED_FORMATS } from '../constants/moodboardConfig'

/**
 * Get image dimensions from a URL
 */
export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Get subscription limits for a given tier
 */
export const getSubscriptionLimits = (tier: SubscriptionTier): SubscriptionLimits => {
  return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free
}

/**
 * Validate if a file format is supported
 */
export const isValidFileFormat = (mimeType: string): boolean => {
  return SUPPORTED_FORMATS.includes(mimeType)
}

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get enhancement status label
 */
export const getEnhancementStatusLabel = (status: string): string => {
  return ENHANCEMENT_STATUS_LABELS[status as keyof typeof ENHANCEMENT_STATUS_LABELS] || status
}

/**
 * Calculate estimated cost for enhancement
 */
export const calculateEstimatedCost = (provider: 'nanobanana' | 'seedream'): number => {
  const costs = {
    nanobanana: 1,
    seedream: 2
  }
  return costs[provider] || 1
}

/**
 * Validate image URL
 */
export const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Generate unique ID for moodboard items
 */
export const generateItemId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Sort items by position
 */
export const sortItemsByPosition = (items: MoodboardItem[]): MoodboardItem[] => {
  return [...items].sort((a, b) => (a.position || 0) - (b.position || 0))
}

/**
 * Reindex item positions after reordering
 */
export const reindexItemPositions = (items: MoodboardItem[]): MoodboardItem[] => {
  return items.map((item, index) => ({ ...item, position: index }))
}

/**
 * Calculate similarity score between two templates
 * Returns a score between 0-100
 */
export const calculateTemplateSimilarity = (
  template: MoodboardTemplate,
  comparison: {
    name: string
    description?: string
    tags?: string[]
    palette?: string[]
  }
): { score: number; factors: string[] } => {
  let score = 0
  const factors: string[] = []

  // Name similarity (30 points)
  if (template.name && comparison.name) {
    const nameSimilarity =
      template.name.toLowerCase().includes(comparison.name.toLowerCase()) ||
      comparison.name.toLowerCase().includes(template.name.toLowerCase())
    if (nameSimilarity) {
      score += 30
      factors.push('Similar name')
    }
  }

  // Description similarity (20 points) - Note: templates don't have descriptions in the type
  // This is future-proofing if we add descriptions later

  // Tag similarity (25 points)
  if (template.tags && comparison.tags && template.tags.length > 0 && comparison.tags.length > 0) {
    const commonTags = template.tags.filter((tag: string) => comparison.tags!.includes(tag))
    if (commonTags.length > 0) {
      const tagScore = (commonTags.length / Math.max(template.tags.length, comparison.tags.length)) * 25
      score += tagScore
      factors.push(`${commonTags.length} common tags`)
    }
  }

  // Palette similarity (10 points)
  if (template.palette && comparison.palette && template.palette.length > 0 && comparison.palette.length > 0) {
    const commonColors = template.palette.filter((color: string) => comparison.palette!.includes(color))
    if (commonColors.length > 0) {
      const paletteScore = (commonColors.length / Math.max(template.palette.length, comparison.palette.length)) * 10
      score += paletteScore
      factors.push(`${commonColors.length} common colors`)
    }
  }

  // Item count similarity (15 points)
  // Note: This would need to be passed in the comparison object if needed

  return { score: Math.round(score), factors }
}

/**
 * Check if template name is similar to existing templates
 */
export const isTemplateNameSimilar = (name1: string, name2: string): boolean => {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  return n1.includes(n2) || n2.includes(n1) || n1 === n2
}

/**
 * Extract image URLs from moodboard items for palette extraction
 */
export const extractImageUrlsForPalette = (items: MoodboardItem[]): string[] => {
  return items
    .filter(item => item.type === 'image')
    .map(item => item.thumbnail_url || item.url)
    .filter(Boolean)
}

/**
 * Count items by source
 */
export const countItemsBySource = (items: MoodboardItem[]): Record<string, number> => {
  return items.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Count enhanced items
 */
export const countEnhancedItems = (items: MoodboardItem[]): number => {
  return items.filter(item => item.enhanced_url).length
}

/**
 * Get featured image from items
 */
export const getFeaturedImage = (items: MoodboardItem[], featuredId: string | null): MoodboardItem | null => {
  if (!featuredId) return null
  return items.find(item => item.id === featuredId) || null
}

/**
 * Validate moodboard title
 */
export const validateMoodboardTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' }
  }
  if (title.length > 100) {
    return { valid: false, error: 'Title must be less than 100 characters' }
  }
  return { valid: true }
}

/**
 * Validate moodboard before saving
 */
export const validateMoodboard = (data: {
  title: string
  items: MoodboardItem[]
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  const titleValidation = validateMoodboardTitle(data.title)
  if (!titleValidation.valid && titleValidation.error) {
    errors.push(titleValidation.error)
  }

  if (data.items.length === 0) {
    errors.push('Add at least one image to your moodboard')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Format enhancement provider name for display
 */
export const formatProviderName = (provider: 'nanobanana' | 'seedream'): string => {
  return provider === 'nanobanana' ? 'Nanobanana (Fast)' : 'Seedream (High Quality)'
}

/**
 * Estimate processing time for enhancement
 */
export const estimateEnhancementTime = (provider: 'nanobanana' | 'seedream'): string => {
  return provider === 'nanobanana' ? '30-60 seconds' : '60-120 seconds'
}

/**
 * Check if user can upload more images based on tier
 */
export const canUserUpload = (currentUploads: number, tier: SubscriptionTier): boolean => {
  const limits = getSubscriptionLimits(tier)
  return currentUploads < limits.userUploads
}

/**
 * Check if user can enhance more images based on tier
 */
export const canUserEnhance = (currentEnhancements: number, tier: SubscriptionTier): boolean => {
  const limits = getSubscriptionLimits(tier)
  return currentEnhancements < limits.aiEnhancements
}

/**
 * Get remaining upload count
 */
export const getRemainingUploads = (currentUploads: number, tier: SubscriptionTier): number => {
  const limits = getSubscriptionLimits(tier)
  return Math.max(0, limits.userUploads - currentUploads)
}

/**
 * Get remaining enhancement count
 */
export const getRemainingEnhancements = (currentEnhancements: number, tier: SubscriptionTier): number => {
  const limits = getSubscriptionLimits(tier)
  return Math.max(0, limits.aiEnhancements - currentEnhancements)
}

/**
 * Generate file name for upload
 */
export const generateUploadFileName = (userId: string, originalName: string): string => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(7)
  const fileExt = originalName.split('.').pop() || 'jpg'
  return `${userId}-${timestamp}-${randomStr}.${fileExt}`
}

/**
 * Parse Pexels photo data to MoodboardItem
 */
export const parsePexelsPhoto = (photo: any): MoodboardItem => {
  return {
    id: crypto.randomUUID(),
    type: 'pexels',
    source: 'pexels',
    url: photo.src.large,
    thumbnail_url: photo.src.medium,
    width: photo.width,
    height: photo.height,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    position: 0
  }
}

/**
 * Check if an item is currently being enhanced
 */
export const isItemEnhancing = (itemId: string, enhancingItems: Set<string>): boolean => {
  return enhancingItems.has(itemId)
}

/**
 * Get enhancement progress percentage
 */
export const getEnhancementProgress = (taskId: string, tasks: Map<string, { status: string; progress: number }>): number => {
  const task = tasks.get(taskId)
  return task?.progress || 0
}

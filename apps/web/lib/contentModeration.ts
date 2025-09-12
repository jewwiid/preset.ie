/**
 * Content Moderation Utilities
 * Handles bad word filtering and duplicate detection for user-generated content
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Basic profanity/inappropriate word list
// In production, consider using a more comprehensive service like Google's Perspective API
const INAPPROPRIATE_WORDS = [
  // Common profanity
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
  // Inappropriate content
  'nude', 'naked', 'sex', 'porn', 'xxx', 'nsfw', 'adult',
  // Discriminatory language
  'hate', 'nazi', 'racist', 'sexist', 'homophobic', 'transphobic',
  // Spam-like content
  'buy now', 'click here', 'free money', 'get rich', 'promotion',
  // Platform gaming
  'follow me', 'like for like', 'sub4sub', 'follow4follow',
  // Inappropriate for creative context
  'illegal', 'drugs', 'violence', 'weapon', 'blood', 'gore'
]

// Creative style and vibe terms that should be allowed
const CREATIVE_ALLOWLIST = [
  'artistic', 'creative', 'aesthetic', 'vintage', 'modern', 'classic',
  'minimalist', 'bold', 'elegant', 'edgy', 'soft', 'dramatic',
  'natural', 'urban', 'rustic', 'glamorous', 'casual', 'formal',
  'colorful', 'monochrome', 'bright', 'dark', 'moody', 'cheerful'
]

export interface ValidationResult {
  isValid: boolean
  reason?: string
  suggestion?: string
}

/**
 * Validates a custom style or vibe tag for appropriateness
 */
export function validateCustomTag(tag: string): ValidationResult {
  const normalizedTag = tag.toLowerCase().trim()
  
  // Check length
  if (normalizedTag.length < 2) {
    return {
      isValid: false,
      reason: 'Tag must be at least 2 characters long'
    }
  }
  
  if (normalizedTag.length > 20) {
    return {
      isValid: false,
      reason: 'Tag must be 20 characters or less'
    }
  }
  
  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    if (normalizedTag.includes(word)) {
      return {
        isValid: false,
        reason: 'Tag contains inappropriate content',
        suggestion: 'Please use creative, professional terms'
      }
    }
  }
  
  // Check for only letters, spaces, and hyphens
  if (!/^[a-z\s-]+$/.test(normalizedTag)) {
    return {
      isValid: false,
      reason: 'Tag can only contain letters, spaces, and hyphens'
    }
  }
  
  // Check for excessive repetition
  if (/(.)\1{3,}/.test(normalizedTag)) {
    return {
      isValid: false,
      reason: 'Tag contains excessive repetition'
    }
  }
  
  return { isValid: true }
}

/**
 * Checks if a tag already exists in the database
 */
export async function checkTagDuplicate(
  tag: string, 
  tagType: 'style' | 'vibe'
): Promise<ValidationResult> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const normalizedTag = tag.toLowerCase().trim()
    
    // Check against existing tags in the database
    const column = tagType === 'style' ? 'style_tags' : 'vibe_tags'
    
    const { data, error } = await supabase
      .from('users_profile')
      .select(column)
      .not(column, 'is', null)
    
    if (error) {
      console.error('Error checking duplicates:', error)
      return {
        isValid: true // Allow on error to not block users
      }
    }
    
    // Flatten all tags and check for duplicates
    const allTags = data
      .map(row => (row as any)[column] || [])
      .flat()
      .map((t: string) => t.toLowerCase().trim())
    
    // Check for exact match
    if (allTags.includes(normalizedTag)) {
      return {
        isValid: false,
        reason: `This ${tagType} already exists`,
        suggestion: 'Try a more specific variation'
      }
    }
    
    // Check for very similar tags (Levenshtein distance)
    for (const existingTag of allTags) {
      if (calculateSimilarity(normalizedTag, existingTag) > 0.85) {
        return {
          isValid: false,
          reason: `Very similar ${tagType} already exists: "${existingTag}"`,
          suggestion: 'Try a more unique variation'
        }
      }
    }
    
    return { isValid: true }
    
  } catch (error) {
    console.error('Error in duplicate check:', error)
    return {
      isValid: true // Allow on error to not block users
    }
  }
}

/**
 * Comprehensive validation for custom tags
 */
export async function validateAndCheckTag(
  tag: string,
  tagType: 'style' | 'vibe'
): Promise<ValidationResult> {
  // First check content validation
  const contentValidation = validateCustomTag(tag)
  if (!contentValidation.isValid) {
    return contentValidation
  }
  
  // Then check for duplicates
  const duplicateCheck = await checkTagDuplicate(tag, tagType)
  if (!duplicateCheck.isValid) {
    return duplicateCheck
  }
  
  return { isValid: true }
}

/**
 * Calculate similarity between two strings using a simple algorithm
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Get predefined style and vibe options
 */
export function getPredefinedOptions() {
  const styleOptions = [
    'minimalist', 'urban', 'vintage', 'modern', 'classic', 'bohemian',
    'industrial', 'rustic', 'elegant', 'edgy', 'casual', 'formal',
    'artistic', 'natural', 'glamorous', 'retro', 'contemporary', 'eclectic'
  ]
  
  const vibeOptions = [
    'calm', 'energetic', 'creative', 'professional', 'playful', 'mysterious',
    'romantic', 'dramatic', 'cheerful', 'moody', 'confident', 'dreamy',
    'bold', 'soft', 'intense', 'peaceful', 'adventurous', 'sophisticated'
  ]
  
  return { styleOptions, vibeOptions }
}
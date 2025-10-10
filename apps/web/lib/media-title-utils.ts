/**
 * Utility functions for generating smart default titles for media
 */

/**
 * Truncate text to a maximum length, adding ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Clean and format a prompt for use as a title
 */
function cleanPromptForTitle(prompt: string): string {
  // Remove excessive whitespace
  let cleaned = prompt.trim().replace(/\s+/g, ' ')

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  return cleaned
}

/**
 * Format a date for use in titles
 */
function formatDateForTitle(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}

/**
 * Generate a smart default title for an AI-generated image
 */
export function generateImageTitle(prompt?: string, style?: string): string {
  if (prompt && prompt.trim()) {
    const cleanPrompt = cleanPromptForTitle(prompt)
    const title = truncate(cleanPrompt, 50)
    return title
  }

  if (style) {
    return `${style.charAt(0).toUpperCase() + style.slice(1)} Image - ${formatDateForTitle()}`
  }

  return `AI Image - ${formatDateForTitle()}`
}

/**
 * Generate a smart default title for an AI-generated video
 */
export function generateVideoTitle(
  prompt?: string,
  motionType?: string,
  aspectRatio?: string
): string {
  if (prompt && prompt.trim()) {
    const cleanPrompt = cleanPromptForTitle(prompt)
    const title = truncate(cleanPrompt, 50)
    return title
  }

  if (motionType) {
    const formattedMotion = motionType
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    return `${formattedMotion} Video - ${formatDateForTitle()}`
  }

  return `AI Video - ${formatDateForTitle()}`
}

/**
 * Generate a smart default title for an uploaded image
 */
export function generateUploadedImageTitle(filename?: string): string {
  if (filename) {
    // Remove extension and clean up filename
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
    const cleaned = nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleaned) {
      const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      return truncate(title, 50)
    }
  }

  return `Uploaded Image - ${formatDateForTitle()}`
}

/**
 * Generate smart default tags based on generation metadata
 */
export function generateDefaultTags(metadata?: {
  style?: string
  motionType?: string
  aspectRatio?: string
  resolution?: string
  provider?: string
  mediaType?: 'image' | 'video'
}): string[] {
  const tags: string[] = []

  if (!metadata) return ['ai-generated']

  // Always add ai-generated tag
  tags.push('ai-generated')

  // Add media type
  if (metadata.mediaType === 'video') {
    tags.push('video')
  } else {
    tags.push('image')
  }

  // Add style if available
  if (metadata.style && metadata.style !== 'none') {
    tags.push(metadata.style.toLowerCase())
  }

  // Add motion type for videos
  if (metadata.motionType) {
    tags.push(metadata.motionType.toLowerCase())
  }

  // Add aspect ratio
  if (metadata.aspectRatio) {
    tags.push(metadata.aspectRatio.replace(':', '-'))
  }

  return tags
}

/**
 * Generate a smart default description based on generation metadata
 */
export function generateDefaultDescription(metadata?: {
  prompt?: string
  enhancedPrompt?: string
  style?: string
  aspectRatio?: string
  resolution?: string
}): string {
  if (!metadata) return ''

  const parts: string[] = []

  // Use enhanced prompt if available, otherwise regular prompt
  if (metadata.enhancedPrompt) {
    parts.push(metadata.enhancedPrompt)
  } else if (metadata.prompt) {
    parts.push(metadata.prompt)
  }

  // Add technical details
  const details: string[] = []
  if (metadata.style && metadata.style !== 'none') {
    details.push(`Style: ${metadata.style}`)
  }
  if (metadata.aspectRatio) {
    details.push(`Aspect Ratio: ${metadata.aspectRatio}`)
  }
  if (metadata.resolution) {
    details.push(`Resolution: ${metadata.resolution}`)
  }

  if (details.length > 0) {
    parts.push('\n\n' + details.join(' • '))
  }

  return parts.join('')
}

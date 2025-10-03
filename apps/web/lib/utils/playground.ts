// Playground Utility Functions
// This file contains reusable helper functions for the image generation playground

import { ImageDimensions } from '../types/playground'

/**
 * Format style name for display in prompts
 * Converts snake_case/kebab-case/camelCase to Title Case
 */
export const formatStyleName = (style: string): string => {
  return style
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/-/g, ' ')           // Replace hyphens with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .split(' ')                   // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(' ')                    // Join back with spaces
}

/**
 * Detect subject category for AI enhancement
 */
export const detectSubjectCategory = (subject: string): string => {
  const subjectLower = subject.toLowerCase()
  if (subjectLower.match(/person|man|woman|child|portrait|face|people/)) return 'person'
  if (subjectLower.match(/cat|dog|bird|animal|pet|wildlife/)) return 'animal'
  if (subjectLower.match(/landscape|mountain|forest|ocean|nature|scenery/)) return 'landscape'
  if (subjectLower.match(/building|house|architecture|structure|interior/)) return 'architecture'
  if (subjectLower.match(/product|bottle|phone|watch|gadget/)) return 'product'
  if (subjectLower.match(/abstract|art|painting|design/)) return 'abstract'
  return 'general'
}

/**
 * Calculate resolution from aspect ratio and base resolution
 */
export const calculateResolution = (aspectRatioValue: string, baseResolution: string): string => {
  const [widthRatio, heightRatio] = aspectRatioValue.split(':').map(Number)
  const baseSize = parseInt(baseResolution)

  // Calculate dimensions maintaining the aspect ratio
  const aspectRatioNum = widthRatio / heightRatio

  let width: number, height: number

  if (aspectRatioNum >= 1) {
    // Landscape or square
    width = baseSize
    height = Math.round(baseSize / aspectRatioNum)
  } else {
    // Portrait
    height = baseSize
    width = Math.round(baseSize * aspectRatioNum)
  }

  const result = `${width}*${height}`

  // Debug logging for aspect ratio calculation
  console.log('🎯 Aspect Ratio Calculation:', {
    aspectRatio: aspectRatioValue,
    baseResolution,
    widthRatio,
    heightRatio,
    aspectRatioNum: aspectRatioNum.toFixed(3),
    calculatedWidth: width,
    calculatedHeight: height,
    finalResolution: result
  })

  return result
}

/**
 * Extract aspect ratio from prompt text
 */
export const extractAspectRatioFromPrompt = (prompt: string): string | null => {
  const aspectRatioPatterns = [
    { pattern: /(\d+):(\d+)\s*(?:widescreen|aspect|ratio)/gi, name: 'explicit' },
    { pattern: /16:9|16\s*:\s*9/gi, name: '16:9' },
    { pattern: /9:16|9\s*:\s*16/gi, name: '9:16' },
    { pattern: /4:3|4\s*:\s*3/gi, name: '4:3' },
    { pattern: /3:4|3\s*:\s*4/gi, name: '3:4' },
    { pattern: /1:1|1\s*:\s*1|square/gi, name: '1:1' },
    { pattern: /21:9|21\s*:\s*9/gi, name: '21:9' },
    { pattern: /3:2|3\s*:\s*2/gi, name: '3:2' },
    { pattern: /2:3|2\s*:\s*3/gi, name: '2:3' }
  ]

  for (const { pattern, name } of aspectRatioPatterns) {
    const match = prompt.match(pattern)
    if (match) {
      if (name === 'explicit') {
        const [, width, height] = match[0].match(/(\d+):(\d+)/) || []
        if (width && height) return `${width}:${height}`
      } else {
        return name
      }
    }
  }

  return null
}

/**
 * Get image dimensions from URL
 */
export const getImageDimensions = (url: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Calculate aspect ratio from dimensions
 */
export const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  const widthRatio = width / divisor
  const heightRatio = height / divisor

  // Match to common aspect ratios
  const commonRatios: { [key: string]: string } = {
    '1:1': '1:1',
    '16:9': '16:9',
    '9:16': '9:16',
    '4:3': '4:3',
    '3:4': '3:4',
    '21:9': '21:9',
    '3:2': '3:2',
    '2:3': '2:3'
  }

  const calculatedRatio = `${widthRatio}:${heightRatio}`
  return commonRatios[calculatedRatio] || calculatedRatio
}

/**
 * Validate hex color code
 */
export const isValidHexColor = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
}

/**
 * Check if prompt is a default style prompt
 */
export const isDefaultPrompt = (promptText: string): boolean => {
  const defaultPatterns = [
    'Create a photorealistic image',
    'Create an artistic painting',
    'Create a cartoon-style illustration',
    'Create a vintage aesthetic',
    'Create a cyberpunk style',
    'Create a watercolor painting',
    'Create a pencil sketch',
    'Create an oil painting',
    'Create a professional portrait',
    'Create a fashion photography',
    'Create an editorial photography',
    'Create a commercial photography',
    'Create a lifestyle photography',
    'Create a street photography',
    'Create an architectural photography',
    'Create a nature photography',
    'Create an abstract artwork',
    'Create a surreal artwork',
    'Create a minimalist artwork',
    'Create a maximalist artwork',
    'Create an impressionist painting',
    'Create a Renaissance-style artwork',
    'Create a Baroque-style artwork',
    'Create an Art Deco style',
    'Create a Pop Art style',
    'Create a graffiti art style',
    'Create a digital art style',
    'Create a concept art style',
    'Create a fantasy art style',
    'Create a sci-fi art style',
    'Create a steampunk style',
    'Create a gothic art style',
    'Create a cinematic image',
    'Create a film noir style',
    'Create a dramatic image',
    'Create a moody image',
    'Create a bright, cheerful image',
    'Create a monochrome image',
    'Create a sepia-toned image',
    'Create an HDR image'
  ]

  const trimmedPrompt = promptText.trim()
  return defaultPatterns.some(pattern => trimmedPrompt.startsWith(pattern))
}

/**
 * Replace subject placeholder in preset template
 */
export const replaceSubjectInTemplate = (
  template: string,
  subject: string,
  generationMode: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'
): string => {
  const isVideoMode = generationMode === 'text-to-video' || generationMode === 'image-to-video'

  if (generationMode === 'image-to-image' || generationMode === 'image-to-video') {
    // For image-to-image/video, replace {subject} with "this image"
    if (template.includes('{subject}')) {
      return template.replace(/\{subject\}/g, 'this image')
    } else {
      return `${template} this image`
    }
  } else {
    // For text-to-image/video
    if (template.includes('{subject}')) {
      if (subject.trim()) {
        // Replace {subject} with user's input
        return template.replace(/\{subject\}/g, subject.trim())
      } else {
        // If no subject provided, replace {subject} with "the scene"
        return template.replace(/\{subject\}/g, 'the scene')
      }
    }
  }

  return template
}

/**
 * Get the appropriate prompt template for the generation mode
 * Prefers video-specific template for video modes, falls back to image template with adaptation
 */
export const getPromptTemplateForMode = (
  preset: any,
  generationMode: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'
): string => {
  const isVideoMode = generationMode === 'text-to-video' || generationMode === 'image-to-video'

  if (isVideoMode) {
    // Use video-specific template if available
    if (preset.prompt_template_video) {
      return preset.prompt_template_video
    }
    // Otherwise adapt image template
    if (preset.prompt_template) {
      return adaptTemplateForVideo(preset.prompt_template)
    }
  }

  // For image modes, use image template
  return preset.prompt_template || ''
}

/**
 * Adapt image preset template for video generation (FALLBACK)
 * Converts static image descriptions to motion-focused video descriptions
 */
export const adaptTemplateForVideo = (template: string): string => {
  // Remove static image terms and replace with motion equivalents
  let adapted = template
    .replace(/\b(photograph|photo|image|picture|shot)\b/gi, 'video')
    .replace(/\b(instant film photograph)\b/gi, 'instant film style video')
    .replace(/\b(captured|taken)\b/gi, 'filmed')

  // If the template doesn't mention motion/movement, add it
  if (!adapted.match(/\b(motion|movement|moving|animated|dynamic)\b/i)) {
    adapted = `Add motion with ${adapted}`
  }

  return adapted
}

/**
 * Debounce function for search input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

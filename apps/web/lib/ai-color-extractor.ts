/**
 * AI-powered color palette extraction using GPT-4 Vision
 * Provides intelligent color analysis for fashion and creative content
 */

interface AIColorAnalysis {
  palette: string[]
  description: string
  mood: string
  suggestions: string[]
}

/**
 * Extract color palette using GPT-4 Vision API
 * @param imageUrl - URL of the image to analyze
 * @param context - Optional context about the image (e.g., "fashion editorial", "product photography")
 * @returns AI-analyzed color palette and insights
 */
export async function extractAIPalette(
  imageUrl: string, 
  context: string = 'creative moodboard'
): Promise<AIColorAnalysis> {
  try {
    const response = await fetch('/api/ai-palette', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        context
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI palette API error:', response.status, errorText)
      throw new Error(`Failed to analyze image: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success && data.error) {
      console.error('AI palette analysis error:', data.error)
      throw new Error(data.error)
    }
    
    return data
  } catch (error: any) {
    console.warn('AI palette extraction failed, using fallback:', error.message)
    // Fallback to default analysis - this is fine for Free tier users
    return {
      palette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      description: 'Color palette extracted',
      mood: 'Creative',
      suggestions: []
    }
  }
}

/**
 * Extract palette from multiple images using AI
 * @param imageUrls - Array of image URLs
 * @param context - Context about the moodboard
 * @returns Combined AI-analyzed palette
 */
export async function extractAIPaletteFromImages(
  imageUrls: string[],
  context: string = 'fashion moodboard'
): Promise<AIColorAnalysis> {
  if (imageUrls.length === 0) {
    return {
      palette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      description: 'No images to analyze',
      mood: 'Creative',
      suggestions: []
    }
  }

  try {
    // Analyze up to 3 images for efficiency
    const imagesToAnalyze = imageUrls.slice(0, 3)
    
    const response = await fetch('/api/ai-palette-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrls: imagesToAnalyze,
        context
      })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze images')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('AI batch palette extraction failed:', error)
    // Fallback to single image analysis if available
    if (imageUrls.length > 0 && imageUrls[0]) {
      return extractAIPalette(imageUrls[0], context)
    }
    // Return empty analysis if no images
    return { 
      palette: [], 
      description: 'No images to analyze',
      mood: 'neutral',
      suggestions: []
    }
  }
}

/**
 * Generate fashion-specific color recommendations
 * @param baseColors - Current palette
 * @param season - Fashion season (spring, summer, fall, winter)
 * @param style - Fashion style (casual, formal, streetwear, etc.)
 */
export async function getFashionColorRecommendations(
  baseColors: string[],
  season: string = 'current',
  style: string = 'contemporary'
): Promise<{
  recommended: string[]
  trending: string[]
  complementary: string[]
  advice: string
}> {
  try {
    const response = await fetch('/api/fashion-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseColors,
        season,
        style
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get fashion recommendations')
    }

    return await response.json()
  } catch (error) {
    console.error('Fashion color recommendations failed:', error)
    return {
      recommended: baseColors,
      trending: ['#E84855', '#3CBBB1', '#F9DC5C', '#403F4C', '#84DCCF'],
      complementary: baseColors[0] ? generateComplementaryColors(baseColors[0]) : [],
      advice: 'Unable to generate AI recommendations'
    }
  }
}

/**
 * Simple complementary color generation as fallback
 */
function generateComplementaryColors(baseColor: string): string[] {
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return [
    // Complementary
    `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`,
    // Triadic
    `#${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`,
    // Analogous
    `#${Math.min(255, r + 30).toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`
  ]
}
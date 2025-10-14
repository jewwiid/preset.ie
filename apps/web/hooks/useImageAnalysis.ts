import { useState } from 'react'

interface UseImageAnalysisOptions {
  accessToken?: string
  onDescriptionAnalyzed?: (description: string) => void
  onTagsAnalyzed?: (tags: string[]) => void
}

/**
 * Hook for AI-powered image analysis
 * Handles description generation and tag extraction
 */
export function useImageAnalysis(options: UseImageAnalysisOptions = {}) {
  const { accessToken, onDescriptionAnalyzed, onTagsAnalyzed } = options

  const [analyzingDescription, setAnalyzingDescription] = useState(false)
  const [analyzingTags, setAnalyzingTags] = useState(false)

  /**
   * Generate contextual description from generation metadata
   */
  const generateContextualDescription = (metadata: any): string => {
    if (!metadata) {
      return 'A beautiful AI-generated image with artistic composition and natural lighting.'
    }

    const context = []

    if (metadata.generation_mode === 'image-to-image') {
      context.push('An AI-edited image with enhanced visual elements')
    } else {
      context.push('An AI-generated image created from text')
    }

    if (metadata.style) {
      context.push(`featuring ${metadata.style} styling`)
    }

    if (metadata.cinematic_parameters) {
      const params = metadata.cinematic_parameters
      const cinematicDetails = []
      if (params.lensType) cinematicDetails.push(`${params.lensType} lens`)
      if (params.shotSize) cinematicDetails.push(`${params.shotSize} shot`)
      if (params.timeSetting) cinematicDetails.push(`${params.timeSetting} lighting`)
      if (params.locationType) cinematicDetails.push(`${params.locationType} setting`)
      if (params.directorStyle) cinematicDetails.push(`in the style of ${params.directorStyle}`)

      if (cinematicDetails.length > 0) {
        context.push(`with ${cinematicDetails.join(', ')}`)
      }
    }

    if (context.length > 0) {
      return context.join(' ') + '. Professional quality with attention to composition, lighting, and artistic detail.'
    }

    return 'A beautiful AI-generated image with artistic composition and natural lighting.'
  }

  /**
   * Analyze image and generate description using AI
   */
  const analyzeImageDescription = async (
    imageUrl: string,
    metadata?: any
  ): Promise<string | null> => {
    console.log('🔍 AI Analyze Description started', {
      imageUrl,
      hasAccessToken: !!accessToken,
      hasMetadata: !!metadata
    })

    setAnalyzingDescription(true)

    // Generate contextual description from metadata
    const contextualDescription = generateContextualDescription(metadata)
    console.log('📝 Contextual description:', contextualDescription)

    try {
      const response = await fetch('/api/ai-image-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          imageUrl,
          context: contextualDescription,
          analysisType: 'description'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to analyze image' }))
        throw new Error(errorData.error || 'Failed to analyze image')
      }

      const data = await response.json()
      console.log('✅ AI analysis response:', data)

      const description = data.description || ''
      onDescriptionAnalyzed?.(description)

      return description
    } catch (error) {
      console.error('❌ Error analyzing image description:', error)
      throw error
    } finally {
      setAnalyzingDescription(false)
    }
  }

  /**
   * Analyze image and extract tags using AI
   */
  const analyzeImageTags = async (
    imageUrl: string,
    existingTags: string[] = []
  ): Promise<string[]> => {
    console.log('🔍 AI Analyze Tags started', {
      imageUrl,
      hasAccessToken: !!accessToken,
      existingTagsCount: existingTags.length
    })

    setAnalyzingTags(true)

    try {
      const response = await fetch('/api/ai-image-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          imageUrl,
          analysisType: 'tags'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to analyze image' }))
        throw new Error(errorData.error || 'Failed to analyze image')
      }

      const data = await response.json()
      console.log('✅ AI tags response:', data)

      // Merge with existing tags, avoiding duplicates
      const newTags = data.tags || []
      const mergedTags = [...existingTags]

      newTags.forEach((tag: string) => {
        const normalizedTag = tag.toLowerCase().trim()
        const exists = mergedTags.some(
          existingTag => existingTag.toLowerCase().trim() === normalizedTag
        )
        if (!exists) {
          mergedTags.push(tag)
        }
      })

      onTagsAnalyzed?.(mergedTags)

      return mergedTags
    } catch (error) {
      console.error('❌ Error analyzing image tags:', error)
      throw error
    } finally {
      setAnalyzingTags(false)
    }
  }

  return {
    analyzingDescription,
    analyzingTags,
    analyzeImageDescription,
    analyzeImageTags,
    generateContextualDescription,
  }
}

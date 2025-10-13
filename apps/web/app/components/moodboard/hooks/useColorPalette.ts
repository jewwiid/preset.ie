/**
 * Custom hook for color palette extraction
 * Handles both standard and AI-powered palette generation
 */

import { useState } from 'react'
import { extractPaletteFromImages } from '@/lib/color-extractor'
import { extractAIPaletteFromImages } from '@/lib/ai-color-extractor'
import { MoodboardItem, AIAnalysis } from '../lib/moodboardTypes'
import { extractImageUrlsForPalette } from '../lib/moodboardHelpers'
import { DEFAULT_PALETTE } from '../constants/moodboardConfig'

interface UseColorPaletteProps {
  gigData?: any
  moodboardTitle?: string
}

interface UseColorPaletteReturn {
  // State
  palette: string[]
  loading: boolean
  useAI: boolean
  aiAnalysis: AIAnalysis | null
  error: string | null

  // Actions
  setUseAI: (useAI: boolean) => void
  extractPalette: (items: MoodboardItem[]) => Promise<void>
  setPalette: (palette: string[]) => void
  clearError: () => void
}

export const useColorPalette = ({
  gigData,
  moodboardTitle = 'fashion moodboard'
}: UseColorPaletteProps): UseColorPaletteReturn => {
  const [palette, setPalette] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [useAI, setUseAI] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Extract color palette from moodboard items
   */
  const extractPalette = async (items: MoodboardItem[]) => {
    const imageUrls = extractImageUrlsForPalette(items)

    if (imageUrls.length === 0) {
      setError('Add at least one image to extract a palette')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (useAI) {
        console.log('Extracting AI palette from images:', imageUrls)

        // Call AI palette extraction with context
        const analysis = await extractAIPaletteFromImages(
          imageUrls,
          moodboardTitle,
          gigData
        )

        setPalette(analysis.palette)
        setAiAnalysis({
          description: analysis.description,
          mood: analysis.mood
        })

        console.log('AI palette extracted:', analysis)
      } else {
        console.log('Extracting standard palette from images:', imageUrls)

        // Call standard palette extraction
        const colors = await extractPaletteFromImages(imageUrls)
        setPalette(colors)
        setAiAnalysis(null)

        console.log('Standard palette extracted:', colors)
      }
    } catch (err: any) {
      console.error('Palette extraction error:', err)

      // Provide fallback palette on error
      setPalette(DEFAULT_PALETTE)

      const errorMessage = useAI
        ? 'AI palette extraction failed. Using standard extraction instead.'
        : 'Palette extraction failed. Using default palette.'

      setError(errorMessage)

      // If AI failed, try falling back to standard extraction
      if (useAI) {
        try {
          console.log('Falling back to standard palette extraction')
          const colors = await extractPaletteFromImages(imageUrls)
          setPalette(colors)
          setAiAnalysis(null)
        } catch (fallbackErr) {
          console.error('Fallback extraction also failed:', fallbackErr)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => setError(null)

  return {
    // State
    palette,
    loading,
    useAI,
    aiAnalysis,
    error,

    // Actions
    setUseAI,
    extractPalette,
    setPalette,
    clearError
  }
}

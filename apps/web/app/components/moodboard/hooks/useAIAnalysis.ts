/**
 * Custom hook for AI-powered moodboard analysis
 * Generates descriptions, mood analysis, and summaries
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { MoodboardItem, AIAnalysis } from '../lib/moodboardTypes'

interface UseAIAnalysisProps {
  moodboardId?: string
  gigId?: string
}

interface UseAIAnalysisReturn {
  // State
  analysis: AIAnalysis | null
  generating: boolean
  error: string | null

  // Actions
  generateAnalysis: (items: MoodboardItem[], selectedTags: string[]) => Promise<AIAnalysis | null>
  setAnalysis: (analysis: AIAnalysis | null) => void
  clearError: () => void
}

export const useAIAnalysis = ({
  moodboardId,
  gigId
}: UseAIAnalysisProps): UseAIAnalysisReturn => {
  const { user } = useAuth()

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Generate AI analysis for the moodboard
   */
  const generateAnalysis = async (
    items: MoodboardItem[],
    selectedTags: string[]
  ): Promise<AIAnalysis | null> => {
    if (!user) {
      setError('Please sign in to generate AI analysis')
      return null
    }

    if (items.length === 0) {
      setError('Add images to your moodboard before generating analysis')
      return null
    }

    setGenerating(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      if (!moodboardId && !gigId) {
        throw new Error('No moodboard or gig ID available')
      }

      console.log('Generating AI analysis for moodboard...')

      // Get session token
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No active session')
      }

      // Call AI to analyze the vibe and generate summary
      const aiAnalysisResponse = await fetch('/api/analyze-moodboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            url: item.url,
            caption: item.caption,
            photographer: item.photographer,
            source: item.source
          })),
          tags: selectedTags,
          moodboardId: moodboardId || gigId
        })
      })

      if (!aiAnalysisResponse.ok) {
        throw new Error('Failed to generate AI analysis')
      }

      const aiData = await aiAnalysisResponse.json()

      if (aiData.success) {
        const newAnalysis: AIAnalysis = {
          description: aiData.description,
          mood: aiData.mood
        }

        setAnalysis(newAnalysis)
        console.log('AI analysis generated:', newAnalysis)

        // Optionally update moodboard with AI-generated data
        if (moodboardId && supabase) {
          try {
            const { error: updateError } = await supabase
              .from('moodboards')
              .update({
                ai_description: aiData.description,
                ai_mood: aiData.mood,
                updated_at: new Date().toISOString()
              })
              .eq('id', moodboardId)

            if (updateError) {
              console.error('Error updating moodboard with AI data:', updateError)
            } else {
              console.log('Moodboard updated with AI analysis')
            }
          } catch (updateErr) {
            console.error('Error updating moodboard:', updateErr)
          }
        }

        return newAnalysis
      } else {
        throw new Error(aiData.error || 'AI analysis failed')
      }
    } catch (err: any) {
      console.error('AI analysis error:', err)
      const errorMessage = err.message || 'Failed to generate AI analysis'
      setError(errorMessage)
      return null
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => setError(null)

  return {
    // State
    analysis,
    generating,
    error,

    // Actions
    generateAnalysis,
    setAnalysis,
    clearError
  }
}

/**
 * Custom hook for image enhancement functionality
 * Handles enhancement requests, polling, and status tracking
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { optimizeImageForAPI, preloadImages } from '@/lib/image-optimizer'
import {
  MoodboardItem,
  EnhancementProvider,
  EnhancementTask,
  EnhancementModalState,
  ActiveEnhancement
} from '../lib/moodboardTypes'
import {
  ENHANCEMENT_POLL_INTERVAL,
  MAX_ENHANCEMENT_POLL_ATTEMPTS
} from '../constants/moodboardConfig'

interface UseImageEnhancementProps {
  moodboardId?: string
  onCreditsUpdate?: () => void
}

interface UseImageEnhancementReturn {
  // State
  enhancingItems: Set<string>
  enhancementTasks: Map<string, EnhancementTask>
  selectedProvider: EnhancementProvider
  enhancementModal: EnhancementModalState
  activeEnhancement: ActiveEnhancement | null
  error: string | null

  // Actions
  setSelectedProvider: (provider: EnhancementProvider) => void
  openEnhancementModal: (itemId: string) => void
  closeEnhancementModal: () => void
  enhanceImage: (
    item: MoodboardItem,
    enhancementType: string,
    prompt: string,
    provider?: EnhancementProvider
  ) => Promise<{ success: boolean; enhancedUrl?: string; error?: string }>
  clearError: () => void
}

export const useImageEnhancement = ({
  moodboardId,
  onCreditsUpdate
}: UseImageEnhancementProps): UseImageEnhancementReturn => {
  const { user } = useAuth()

  // Enhancement state
  const [enhancingItems, setEnhancingItems] = useState<Set<string>>(new Set())
  const [enhancementTasks, setEnhancementTasks] = useState<Map<string, EnhancementTask>>(new Map())
  const [selectedProvider, setSelectedProvider] = useState<EnhancementProvider>('seedream')
  const [enhancementModal, setEnhancementModal] = useState<EnhancementModalState>({
    isOpen: false,
    itemId: null
  })
  const [activeEnhancement, setActiveEnhancement] = useState<ActiveEnhancement | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Open enhancement modal for an item
   */
  const openEnhancementModal = useCallback((itemId: string) => {
    setEnhancementModal({ isOpen: true, itemId })
  }, [])

  /**
   * Close enhancement modal
   */
  const closeEnhancementModal = useCallback(() => {
    setEnhancementModal({ isOpen: false, itemId: null })
  }, [])

  /**
   * Poll for enhancement task status
   */
  const pollEnhancementStatus = async (
    itemId: string,
    taskId: string,
    apiEndpoint: string,
    accessToken: string
  ): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> => {
    return new Promise((resolve) => {
      let pollCount = 0
      const maxPolls = MAX_ENHANCEMENT_POLL_ATTEMPTS

      const pollInterval = setInterval(async () => {
        pollCount++

        // Update progress simulation
        const currentProgress = 30 + (pollCount * 3.5) // Progress from 30 to ~100
        setEnhancementTasks(prev =>
          new Map(prev).set(itemId, {
            status: 'polling',
            progress: Math.min(currentProgress, 95),
            taskId
          })
        )

        try {
          const statusResponse = await fetch(`${apiEndpoint}?taskId=${taskId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })

          const statusData = await statusResponse.json()
          console.log(`Poll ${pollCount}: Task status:`, statusData.task?.status, 'Result URL:', statusData.task?.resultUrl)

          if (statusData.success && statusData.task) {
            if (statusData.task.status === 'completed' && statusData.task.resultUrl) {
              // Update progress to 100%
              setEnhancementTasks(prev =>
                new Map(prev).set(itemId, { status: 'completed', progress: 100, taskId })
              )

              clearInterval(pollInterval)

              // Clean up after delay
              setTimeout(() => {
                setEnhancingItems(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(itemId)
                  return newSet
                })
                setEnhancementTasks(prev => {
                  const newMap = new Map(prev)
                  newMap.delete(itemId)
                  return newMap
                })
                closeEnhancementModal()
              }, 2000)

              // Refresh credits
              onCreditsUpdate?.()

              resolve({ success: true, enhancedUrl: statusData.task.resultUrl })
              return
            } else if (statusData.task.status === 'failed') {
              const errorMsg = statusData.task.errorMessage || 'Enhancement failed'
              setError(errorMsg)
              setEnhancementTasks(prev =>
                new Map(prev).set(itemId, { status: 'failed', progress: 0, taskId })
              )
              clearInterval(pollInterval)

              setTimeout(() => {
                setEnhancingItems(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(itemId)
                  return newSet
                })
                setEnhancementTasks(prev => {
                  const newMap = new Map(prev)
                  newMap.delete(itemId)
                  return newMap
                })
              }, 3000)

              resolve({ success: false, error: errorMsg })
              return
            }
          }

          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
            const timeoutError = 'Enhancement timed out. Please try again.'
            setError(timeoutError)
            setEnhancingItems(prev => {
              const newSet = new Set(prev)
              newSet.delete(itemId)
              return newSet
            })
            setEnhancementTasks(prev => {
              const newMap = new Map(prev)
              newMap.delete(itemId)
              return newMap
            })
            resolve({ success: false, error: timeoutError })
          }
        } catch (err: any) {
          console.error('Polling error:', err)
          clearInterval(pollInterval)
          const pollError = 'Error checking enhancement status'
          setError(pollError)
          resolve({ success: false, error: pollError })
        }
      }, ENHANCEMENT_POLL_INTERVAL)
    })
  }

  /**
   * Enhance an image
   */
  const enhanceImage = async (
    item: MoodboardItem,
    enhancementType: string,
    prompt: string,
    provider?: EnhancementProvider
  ): Promise<{ success: boolean; enhancedUrl?: string; error?: string }> => {
    console.log('enhanceImage called:', { itemId: item.id, enhancementType, prompt })

    if (!user) {
      const authError = 'You must be logged in to enhance images'
      setError(authError)
      return { success: false, error: authError }
    }

    const itemId = item.id
    setEnhancingItems(prev => new Set(prev).add(itemId))
    setEnhancementTasks(prev => new Map(prev).set(itemId, { status: 'processing', progress: 10 }))
    setError(null)

    try {
      if (!supabase) {
        throw new Error('Database connection not available. Please try again.')
      }

      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No active session. Please sign in again.')
      }

      // Optimize image before sending to API
      let optimizedUrl = item.url
      try {
        const result = await optimizeImageForAPI(item.url, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.85,
          format: 'jpeg'
        })
        optimizedUrl = result.optimizedUrl
      } catch (err) {
        console.warn('Could not optimize image, using original:', err)
      }

      console.log('Enhancing image:', {
        itemId,
        originalUrl: item.url,
        optimizedUrl,
        enhancementType,
        prompt
      })

      // Preload the original image for smoother preview
      await preloadImages([item.url]).catch(err => console.log('Preload failed:', err))

      // Call enhancement API
      const selectedProviderForEnhancement = provider || selectedProvider
      const apiEndpoint = '/api/enhance-image'

      console.log('Calling enhancement API:', apiEndpoint, {
        inputImageUrl: optimizedUrl,
        enhancementType,
        prompt,
        moodboardId,
        selectedProvider: selectedProviderForEnhancement
      })

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          inputImageUrl: optimizedUrl,
          enhancementType,
          prompt: prompt || `Enhance this ${enhancementType} for a fashion moodboard`,
          strength: 0.8,
          moodboardId,
          selectedProvider: selectedProviderForEnhancement
        })
      }).catch(err => {
        console.error('Fetch error details:', err)
        throw new Error(`Network error: ${err.message}`)
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response error:', response.status, errorText)
        throw new Error(`API Error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log('Enhancement API response:', data)

      if (!data.success) {
        console.error('Enhancement API error:', data)

        // Handle specific error codes
        const errorMessages: Record<string, string> = {
          DATA_URL_NOT_SUPPORTED: 'Please use a direct image URL instead of pasted/uploaded images for enhancement',
          IMAGE_URL_INACCESSIBLE: "The image URL is not accessible. Please ensure it's publicly available",
          INSUFFICIENT_CREDITS: data.error || 'Insufficient credits for enhancement',
          INVALID_IMAGE_FORMAT: 'Invalid image format. Please use JPEG, PNG, or WebP images',
          NETWORK_ERROR: 'Network error. Please check your connection and try again'
        }

        const errorMsg = errorMessages[data.code] || data.error || 'Enhancement failed'
        throw new Error(errorMsg)
      }

      // Check if we got an immediate result (Seedream sync mode)
      if (data.status === 'completed' && data.enhancedUrl) {
        console.log('Immediate result from Seedream:', data.enhancedUrl)

        // Clean up
        setEnhancingItems(prev => {
          const next = new Set(prev)
          next.delete(itemId)
          return next
        })

        // Refresh credits
        onCreditsUpdate?.()

        return { success: true, enhancedUrl: data.enhancedUrl }
      }

      // Set active enhancement to show preview
      console.log('Setting active enhancement:', {
        itemId,
        taskId: data.taskId,
        url: item.url,
        type: enhancementType,
        prompt
      })
      setActiveEnhancement({
        itemId,
        taskId: data.taskId,
        url: item.url,
        type: enhancementType,
        prompt
      })

      // Update progress
      setEnhancementTasks(prev => new Map(prev).set(itemId, { status: 'polling', progress: 30, taskId: data.taskId }))

      // Poll for completion
      const result = await pollEnhancementStatus(
        itemId,
        data.taskId,
        apiEndpoint,
        session.data.session.access_token
      )

      return result
    } catch (error: any) {
      console.error('Enhancement error details:', {
        error: error,
        message: error.message,
        stack: error.stack,
        itemId,
        enhancementType,
        prompt
      })

      // Handle specific error cases
      let errorMessage = error.message || 'Failed to enhance image'

      // Check if it's a JSON error response with specific error codes
      try {
        const errorData = JSON.parse(error.message.split(': ')[1] || '{}')
        if (errorData.code === 'ENHANCEMENT_SERVICE_CREDITS') {
          errorMessage = 'Enhancement service has insufficient credits. Please contact support to add credits to your enhancement service account.'
        } else if (errorData.code === 'PLATFORM_CREDITS_LOW') {
          errorMessage = 'Enhancement service is temporarily unavailable due to low platform credits. Please try again later or contact support.'
        } else if (errorData.details) {
          errorMessage = errorData.details
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
      }

      setError(errorMessage)
      setEnhancingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
      setEnhancementTasks(prev => {
        const newMap = new Map(prev)
        newMap.delete(itemId)
        return newMap
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Clear error state
   */
  const clearError = useCallback(() => setError(null), [])

  return {
    // State
    enhancingItems,
    enhancementTasks,
    selectedProvider,
    enhancementModal,
    activeEnhancement,
    error,

    // Actions
    setSelectedProvider,
    openEnhancementModal,
    closeEnhancementModal,
    enhanceImage,
    clearError
  }
}

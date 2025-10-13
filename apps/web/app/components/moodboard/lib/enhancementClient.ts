/**
 * Enhancement API client
 * Handles image enhancement requests and polling
 */

import { EnhancementProvider } from './moodboardTypes'

export interface EnhancementRequest {
  inputImageUrl: string
  enhancementType: string
  prompt: string
  strength?: number
  moodboardId?: string
  selectedProvider?: EnhancementProvider
}

export interface EnhancementResponse {
  success: boolean
  taskId?: string
  enhancedUrl?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  code?: string
  cost?: number
}

export interface EnhancementTask {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  errorMessage?: string
  progress?: number
}

/**
 * Request image enhancement
 */
export const requestEnhancement = async (
  request: EnhancementRequest,
  accessToken: string
): Promise<EnhancementResponse> => {
  const response = await fetch('/api/enhance-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      inputImageUrl: request.inputImageUrl,
      enhancementType: request.enhancementType,
      prompt: request.prompt || `Enhance this ${request.enhancementType}`,
      strength: request.strength || 0.8,
      moodboardId: request.moodboardId,
      selectedProvider: request.selectedProvider || 'seedream'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Enhancement API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Enhancement request failed')
  }

  return data
}

/**
 * Check enhancement task status
 */
export const checkEnhancementStatus = async (
  taskId: string,
  accessToken: string
): Promise<{ success: boolean; task?: EnhancementTask; error?: string }> => {
  const response = await fetch(`/api/enhance-image?taskId=${taskId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    return {
      success: false,
      error: `Status check failed: ${response.status}`
    }
  }

  const data = await response.json()
  return data
}

/**
 * Poll enhancement status until completion
 */
export const pollEnhancementStatus = async (
  taskId: string,
  accessToken: string,
  options: {
    interval?: number
    maxAttempts?: number
    onProgress?: (progress: number) => void
  } = {}
): Promise<{ success: boolean; resultUrl?: string; error?: string }> => {
  const { interval = 3000, maxAttempts = 60, onProgress } = options

  let attempts = 0

  return new Promise((resolve) => {
    const pollInterval = setInterval(async () => {
      attempts++

      // Update simulated progress
      if (onProgress) {
        const progress = Math.min(30 + attempts * 3.5, 95)
        onProgress(progress)
      }

      try {
        const statusResponse = await checkEnhancementStatus(taskId, accessToken)

        if (statusResponse.success && statusResponse.task) {
          const task = statusResponse.task

          if (task.status === 'completed' && task.resultUrl) {
            clearInterval(pollInterval)
            if (onProgress) onProgress(100)
            resolve({ success: true, resultUrl: task.resultUrl })
            return
          }

          if (task.status === 'failed') {
            clearInterval(pollInterval)
            resolve({
              success: false,
              error: task.errorMessage || 'Enhancement failed'
            })
            return
          }
        }

        // Check max attempts
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          resolve({
            success: false,
            error: 'Enhancement timed out after maximum attempts'
          })
        }
      } catch (err: any) {
        console.error('Polling error:', err)
        clearInterval(pollInterval)
        resolve({ success: false, error: err.message || 'Polling failed' })
      }
    }, interval)
  })
}

/**
 * Cancel enhancement task
 */
export const cancelEnhancement = async (
  taskId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/enhance-image/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ taskId })
    })

    if (!response.ok) {
      return { success: false, error: `Cancel failed: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (err: any) {
    return { success: false, error: err.message || 'Cancel request failed' }
  }
}

/**
 * Discard enhanced image
 */
export const discardEnhancement = async (
  enhancedUrl: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/enhance-image/discard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ enhancedUrl })
    })

    if (!response.ok) {
      return { success: false, error: `Discard failed: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (err: any) {
    return { success: false, error: err.message || 'Discard request failed' }
  }
}

/**
 * Get enhancement cost estimate
 */
export const getEnhancementCost = (provider: EnhancementProvider): number => {
  const costs = {
    nanobanana: 1,
    seedream: 2
  }
  return costs[provider] || 1
}

/**
 * Get enhancement time estimate
 */
export const getEnhancementTimeEstimate = (
  provider: EnhancementProvider
): string => {
  const times = {
    nanobanana: '30-60 seconds',
    seedream: '60-120 seconds'
  }
  return times[provider] || '30-60 seconds'
}

/**
 * Parse enhancement error
 */
export const parseEnhancementError = (error: any): string => {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error)
      if (parsed.code) {
        return getErrorMessage(parsed.code, parsed.details)
      }
    } catch {
      return error
    }
  }

  if (error?.message) {
    return error.message
  }

  return 'Enhancement failed with unknown error'
}

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (code: string, details?: string): string => {
  const errorMessages: Record<string, string> = {
    DATA_URL_NOT_SUPPORTED:
      'Please use a direct image URL instead of pasted/uploaded images',
    IMAGE_URL_INACCESSIBLE:
      'The image URL is not accessible. Please ensure it\'s publicly available',
    INSUFFICIENT_CREDITS: 'Insufficient credits for enhancement',
    INVALID_IMAGE_FORMAT: 'Invalid image format. Please use JPEG, PNG, or WebP',
    NETWORK_ERROR: 'Network error. Please check your connection and try again',
    ENHANCEMENT_SERVICE_CREDITS:
      'Enhancement service has insufficient credits. Please contact support',
    PLATFORM_CREDITS_LOW:
      'Enhancement service is temporarily unavailable. Please try again later'
  }

  return errorMessages[code] || details || 'Enhancement failed'
}

/**
 * Validate enhancement request
 */
export const validateEnhancementRequest = (
  request: EnhancementRequest
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!request.inputImageUrl) {
    errors.push('Image URL is required')
  }

  if (!request.enhancementType) {
    errors.push('Enhancement type is required')
  }

  if (!request.prompt || request.prompt.trim().length === 0) {
    errors.push('Enhancement prompt is required')
  }

  if (request.strength && (request.strength < 0 || request.strength > 1)) {
    errors.push('Strength must be between 0 and 1')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

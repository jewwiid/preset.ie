/**
 * API helper functions for error handling and parsing
 */

import type { Session } from '@supabase/supabase-js'
import { ERROR_MESSAGES } from '../constants/playgroundConfig'

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public title: string = 'Error',
    public status?: number
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Parse API error response
 */
export async function parseAPIError(
  response: Response,
  userCredits: number
): Promise<APIError> {
  let errorData: any
  try {
    errorData = await response.json()
  } catch (parseError) {
    return new APIError(
      `Server error (${response.status}): ${response.statusText}`,
      'Server Error',
      response.status
    )
  }

  let errorMessage = errorData.error || ERROR_MESSAGES.UNKNOWN_ERROR
  let errorTitle = 'Error'

  // Service unavailability
  if (response.status === 503 || errorMessage.includes('temporarily unavailable')) {
    errorTitle = 'Service Unavailable'
    errorMessage = ERROR_MESSAGES.SERVICE_UNAVAILABLE
  }
  // Insufficient credits
  else if (errorMessage.includes('Insufficient credits') && response.status === 403) {
    errorTitle = 'Insufficient Credits'
    const needMatch = errorMessage.match(/Need (\d+) credits/)
    const imagesMatch = errorMessage.match(/for (\d+) image/)

    if (needMatch && imagesMatch) {
      const needed = needMatch[1]
      const images = imagesMatch[1]
      errorMessage = `You need ${needed} credits to generate ${images} image(s), but you currently have ${userCredits} credits. Each image costs 2 credits.`
    } else {
      errorMessage = `${ERROR_MESSAGES.INSUFFICIENT_CREDITS} Current balance: ${userCredits} credits.`
    }
  }
  // Rate limiting
  else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    errorTitle = 'Rate Limited'
    errorMessage = ERROR_MESSAGES.RATE_LIMITED
  }
  // Authentication errors
  else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    errorTitle = 'Authentication Error'
    errorMessage = ERROR_MESSAGES.AUTH_REQUIRED
  }

  return new APIError(errorMessage, errorTitle, response.status)
}

/**
 * Validate session and token
 */
export function validateSession(session: Session | null): void {
  if (!session?.access_token) {
    throw new APIError(ERROR_MESSAGES.AUTH_REQUIRED, 'Authentication Required')
  }
}

/**
 * Create authorization headers
 */
export function createAuthHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  }
}

/**
 * Handle API response
 */
export async function handleAPIResponse<T>(
  response: Response,
  userCredits: number
): Promise<T> {
  if (!response.ok) {
    throw await parseAPIError(response, userCredits)
  }
  return response.json()
}

/**
 * Log session debug info
 */
export function logSessionDebug(session: Session | null, userId?: string, userEmail?: string): void {
  console.log('🔍 Session Debug:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    tokenLength: session?.access_token?.length || 0,
    user: userId,
    userEmail: userEmail,
  })
}

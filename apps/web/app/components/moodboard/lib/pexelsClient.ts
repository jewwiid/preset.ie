/**
 * Pexels API client
 * Wrapper for Pexels stock photo search
 */

import { PexelsPhoto, PexelsFilters } from './moodboardTypes'

export interface PexelsSearchParams {
  query: string
  page?: number
  perPage?: number
  orientation?: 'landscape' | 'portrait' | 'square' | ''
  size?: 'large' | 'medium' | 'small' | ''
  color?: string
}

export interface PexelsSearchResponse {
  photos: PexelsPhoto[]
  page: number
  perPage: number
  totalResults: number
  nextPage?: string
}

/**
 * Search Pexels for photos
 */
export const searchPexels = async (
  params: PexelsSearchParams
): Promise<PexelsSearchResponse> => {
  const { query, page = 1, perPage = 15, orientation, size, color } = params

  if (!query.trim()) {
    throw new Error('Search query is required')
  }

  // Build request body
  const body: Record<string, any> = {
    query: query.trim(),
    page,
    per_page: perPage
  }

  // Add optional filters
  if (orientation) body.orientation = orientation
  if (size) body.size = size
  if (color) body.color = color

  // Call our API endpoint which proxies to Pexels
  const response = await fetch('/api/moodboard/pexels/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return {
    photos: data.photos || [],
    page: data.page || page,
    perPage: data.per_page || perPage,
    totalResults: data.total_results || 0,
    nextPage: data.next_page
  }
}

/**
 * Format Pexels photo for moodboard item
 */
export const formatPexelsPhoto = (photo: PexelsPhoto) => {
  return {
    id: crypto.randomUUID(),
    type: 'pexels' as const,
    source: 'pexels' as const,
    url: photo.src.large2x || photo.src.large, // Use large2x for better balance of quality vs loading speed
    thumbnail_url: photo.src.large, // Use large for thumbnails
    caption: photo.alt || '',
    width: photo.width,
    height: photo.height,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    position: 0
  }
}

/**
 * Get photo by ID
 */
export const getPexelsPhoto = async (photoId: number): Promise<PexelsPhoto> => {
  const response = await fetch(`/api/moodboard/pexels/photo/${photoId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch photo: ${response.status}`)
  }

  const data = await response.json()
  return data.photo
}

/**
 * Get curated photos
 */
export const getCuratedPexels = async (
  page = 1,
  perPage = 15
): Promise<PexelsSearchResponse> => {
  const response = await fetch('/api/moodboard/pexels/curated', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, per_page: perPage })
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch curated photos: ${response.status}`)
  }

  const data = await response.json()

  return {
    photos: data.photos || [],
    page: data.page || page,
    perPage: data.per_page || perPage,
    totalResults: data.total_results || 0,
    nextPage: data.next_page
  }
}

/**
 * Build Pexels attribution text
 */
export const getPexelsAttribution = (photo: PexelsPhoto): string => {
  return `Photo by ${photo.photographer} on Pexels`
}

/**
 * Get Pexels photographer URL
 */
export const getPexelsPhotographerUrl = (photo: PexelsPhoto): string => {
  return photo.photographer_url
}

/**
 * Validate Pexels filters
 */
export const validatePexelsFilters = (
  filters: PexelsFilters
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  const validOrientations = ['', 'landscape', 'portrait', 'square']
  if (!validOrientations.includes(filters.orientation)) {
    errors.push('Invalid orientation filter')
  }

  const validSizes = ['', 'large', 'medium', 'small']
  if (!validSizes.includes(filters.size)) {
    errors.push('Invalid size filter')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate total pages for pagination
 */
export const calculateTotalPages = (
  totalResults: number,
  perPage: number
): number => {
  return Math.ceil(totalResults / perPage)
}

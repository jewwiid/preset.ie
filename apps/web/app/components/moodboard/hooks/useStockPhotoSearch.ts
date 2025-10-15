/**
 * Custom hook for unified stock photo search functionality
 * Handles search queries, pagination, and filters across all providers
 */

import { useState, useEffect } from 'react'
import { StockPhoto, StockPhotoFilters, StockPhotoProvider } from '../lib/moodboardTypes'
import { PEXELS_CONFIG, UNSPLASH_CONFIG, PIXABAY_CONFIG } from '../constants/moodboardConfig'

interface UseStockPhotoSearchReturn {
  // State
  query: string
  results: StockPhoto[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalResults: number
  filters: StockPhotoFilters
  provider: StockPhotoProvider

  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: StockPhotoFilters) => void
  setProvider: (provider: StockPhotoProvider) => void
  search: (page?: number) => Promise<void>
  goToNextPage: () => void
  goToPreviousPage: () => void
  clearResults: () => void
}

export const useStockPhotoSearch = (): UseStockPhotoSearchReturn => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [provider, setProvider] = useState<StockPhotoProvider>('pexels')
  const [filters, setFilters] = useState<StockPhotoFilters>({
    orientation: '',
    size: '',
    color: ''
  })

  /**
   * Get API endpoint based on provider
   */
  const getApiEndpoint = (provider: StockPhotoProvider): string => {
    switch (provider) {
      case 'pexels':
        return '/api/moodboard/pexels/search'
      case 'unsplash':
        return '/api/moodboard/unsplash/search'
      case 'pixabay':
        return '/api/moodboard/pixabay/search'
      default:
        return '/api/moodboard/pexels/search'
    }
  }

  /**
   * Get results per page based on provider
   */
  const getResultsPerPage = (provider: StockPhotoProvider): number => {
    switch (provider) {
      case 'pexels':
        return PEXELS_CONFIG.RESULTS_PER_PAGE
      case 'unsplash':
        return UNSPLASH_CONFIG.RESULTS_PER_PAGE
      case 'pixabay':
        return PIXABAY_CONFIG.RESULTS_PER_PAGE
      default:
        return 12
    }
  }

  /**
   * Search stock photos for the current provider
   */
  const search = async (page = 1) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const endpoint = getApiEndpoint(provider)
      const perPage = getResultsPerPage(provider)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          page,
          per_page: perPage,
          ...(filters.orientation && { orientation: filters.orientation }),
          ...(filters.size && { size: filters.size }),
          ...(filters.color && { color: filters.color })
        })
      })

      if (!response.ok) throw new Error(`Failed to search ${provider}`)

      const data = await response.json()

      // Replace results for pagination (no appending)
      setResults(data.photos || [])
      setCurrentPage(data.page || page)
      setTotalResults(data.total_results || 0)

      // Calculate total pages
      const pages = Math.ceil((data.total_results || 0) / perPage)
      setTotalPages(pages)
    } catch (err: any) {
      console.error(`${provider} search error:`, err)
      setError(`Failed to search ${provider} images`)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Go to next page
   */
  const goToNextPage = () => {
    if (currentPage < totalPages && !loading) {
      search(currentPage + 1)
    }
  }

  /**
   * Go to previous page
   */
  const goToPreviousPage = () => {
    if (currentPage > 1 && !loading) {
      search(currentPage - 1)
    }
  }

  /**
   * Clear search results
   */
  const clearResults = () => {
    setResults([])
    setTotalResults(0)
    setCurrentPage(1)
    setTotalPages(0)
  }

  /**
   * Handle provider change
   */
  const handleProviderChange = (newProvider: StockPhotoProvider) => {
    setProvider(newProvider)
    // Clear results when switching providers
    clearResults()
  }

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      clearResults()
      return
    }

    const timeoutId = setTimeout(() => {
      search(1)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [query, filters, provider])

  return {
    // State
    query,
    results,
    loading,
    error,
    currentPage,
    totalPages,
    totalResults,
    filters,
    provider,

    // Actions
    setQuery,
    setFilters,
    setProvider: handleProviderChange,
    search,
    goToNextPage,
    goToPreviousPage,
    clearResults
  }
}

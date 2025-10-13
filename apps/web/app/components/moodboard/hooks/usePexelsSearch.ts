/**
 * Custom hook for Pexels image search functionality
 * Handles search queries, pagination, and filters
 */

import { useState, useEffect } from 'react'
import { PexelsPhoto, PexelsFilters } from '../lib/moodboardTypes'
import { PEXELS_CONFIG } from '../constants/moodboardConfig'

interface UsePexelsSearchReturn {
  // State
  query: string
  results: PexelsPhoto[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalResults: number
  filters: PexelsFilters

  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: PexelsFilters) => void
  search: (page?: number) => Promise<void>
  goToNextPage: () => void
  goToPreviousPage: () => void
  clearResults: () => void
}

export const usePexelsSearch = (): UsePexelsSearchReturn => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PexelsPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [filters, setFilters] = useState<PexelsFilters>({
    orientation: PEXELS_CONFIG.DEFAULT_ORIENTATION as '',
    size: PEXELS_CONFIG.DEFAULT_SIZE as '',
    color: PEXELS_CONFIG.DEFAULT_COLOR
  })

  /**
   * Search Pexels for images
   */
  const search = async (page = 1) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          page,
          per_page: PEXELS_CONFIG.RESULTS_PER_PAGE,
          ...(filters.orientation && { orientation: filters.orientation }),
          ...(filters.size && { size: filters.size }),
          ...(filters.color && { color: filters.color })
        })
      })

      if (!response.ok) throw new Error('Failed to search Pexels')

      const data = await response.json()

      // Replace results for pagination (no appending)
      setResults(data.photos || [])
      setCurrentPage(data.page || page)
      setTotalResults(data.total_results || 0)

      // Calculate total pages
      const pages = Math.ceil((data.total_results || 0) / PEXELS_CONFIG.RESULTS_PER_PAGE)
      setTotalPages(pages)
    } catch (err: any) {
      console.error('Pexels search error:', err)
      setError('Failed to search images')
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
  }, [query, filters])

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

    // Actions
    setQuery,
    setFilters,
    search,
    goToNextPage,
    goToPreviousPage,
    clearResults
  }
}

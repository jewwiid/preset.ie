'use client'

import { useState, useEffect, useCallback } from 'react'
import { PexelsPhoto, PexelsFilters } from '../../types/playground'
import { isValidHexColor } from '../../utils/playground'

export const usePexelsSearch = () => {
  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsResults, setPexelsResults] = useState<PexelsPhoto[]>([])
  const [pexelsPage, setPexelsPage] = useState(1)
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0)
  const [pexelsFilters, setPexelsFilters] = useState<PexelsFilters>({
    orientation: '',
    size: '',
    color: ''
  })
  const [customHexColor, setCustomHexColor] = useState('')
  const [showHexInput, setShowHexInput] = useState(false)

  const searchPexels = useCallback(async (page = 1) => {
    if (!pexelsQuery.trim()) return

    setPexelsLoading(true)

    try {
      // Determine which color to use - custom hex or predefined color
      const colorValue = showHexInput && customHexColor && isValidHexColor(customHexColor)
        ? customHexColor
        : pexelsFilters.color

      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: pexelsQuery,
          page,
          per_page: 8, // Show exactly 8 images (2 rows of 4)
          ...(pexelsFilters.orientation && { orientation: pexelsFilters.orientation }),
          ...(pexelsFilters.size && { size: pexelsFilters.size }),
          ...(colorValue && { color: colorValue })
        })
      })

      if (!response.ok) throw new Error('Failed to search Pexels')

      const data = await response.json()

      setPexelsResults(data.photos)
      setPexelsPage(page)
      setPexelsTotalResults(data.total_results)
    } catch (error) {
      console.error('Pexels search error:', error)
      setPexelsResults([])
      setPexelsTotalResults(0)
    } finally {
      setPexelsLoading(false)
    }
  }, [pexelsQuery, pexelsFilters, customHexColor, showHexInput])

  // Debounced search effect
  useEffect(() => {
    if (!pexelsQuery.trim()) {
      setPexelsResults([])
      setPexelsTotalResults(0)
      setPexelsPage(1)
      return
    }

    const timeoutId = setTimeout(() => {
      searchPexels(1)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [pexelsQuery, pexelsFilters, customHexColor, showHexInput, searchPexels])

  const goToPage = useCallback((page: number) => {
    if (!pexelsLoading && pexelsQuery.trim()) {
      searchPexels(page)
    }
  }, [pexelsLoading, pexelsQuery, searchPexels])

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(pexelsTotalResults / 8)
    if (pexelsPage < totalPages) {
      goToPage(pexelsPage + 1)
    }
  }, [pexelsPage, pexelsTotalResults, goToPage])

  const prevPage = useCallback(() => {
    if (pexelsPage > 1) {
      goToPage(pexelsPage - 1)
    }
  }, [pexelsPage, goToPage])

  const updateQuery = useCallback((query: string) => {
    setPexelsQuery(query)
  }, [])

  const updateFilters = useCallback((filters: Partial<PexelsFilters>) => {
    setPexelsFilters(prev => ({ ...prev, ...filters }))
  }, [])

  const updateCustomHexColor = useCallback((color: string) => {
    setCustomHexColor(color)
  }, [])

  const toggleHexInput = useCallback((show: boolean) => {
    setShowHexInput(show)
  }, [])

  const resetFilters = useCallback(() => {
    setPexelsFilters({ orientation: '', size: '', color: '' })
    setCustomHexColor('')
    setShowHexInput(false)
  }, [])

  const clearSearch = useCallback(() => {
    setPexelsQuery('')
    setPexelsResults([])
    setPexelsTotalResults(0)
    setPexelsPage(1)
    resetFilters()
  }, [resetFilters])

  return {
    pexelsQuery,
    pexelsResults,
    pexelsPage,
    pexelsLoading,
    pexelsTotalResults,
    pexelsFilters,
    customHexColor,
    showHexInput,
    updateQuery,
    updateFilters,
    updateCustomHexColor,
    toggleHexInput,
    searchPexels,
    goToPage,
    nextPage,
    prevPage,
    resetFilters,
    clearSearch
  }
}

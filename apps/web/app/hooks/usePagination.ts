import { useState, useCallback, useMemo } from 'react'

interface UsePaginationOptions {
  pageSize?: number
  initialPage?: number
  maxPages?: number
}

interface UsePaginationResult<T> {
  currentPage: number
  totalPages: number
  pageSize: number
  paginatedItems: T[]
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setPageSize: (size: number) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const {
    pageSize: initialPageSize = 20,
    initialPage = 1,
    maxPages = 10
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(items.length / pageSize)
  const clampedTotalPages = Math.min(totalPages, maxPages)

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, pageSize])

  const hasNextPage = currentPage < clampedTotalPages
  const hasPreviousPage = currentPage > 1

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, clampedTotalPages))
    setCurrentPage(targetPage)
  }, [clampedTotalPages])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPreviousPage])

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const goToLastPage = useCallback(() => {
    setCurrentPage(clampedTotalPages)
  }, [clampedTotalPages])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  return {
    currentPage,
    totalPages: clampedTotalPages,
    pageSize,
    paginatedItems,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize: handleSetPageSize,
    isLoading,
    setIsLoading
  }
}

export default usePagination

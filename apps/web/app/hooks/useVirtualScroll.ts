import { useState, useEffect, useRef, useMemo } from 'react'

interface UseVirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  threshold?: number
}

interface VirtualScrollResult<T> {
  visibleItems: T[]
  totalHeight: number
  offsetY: number
  containerRef: React.RefObject<HTMLDivElement | null>
  scrollToIndex: (index: number) => void
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 5, threshold = 100 } = options
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  const offsetY = visibleRange.startIndex * itemHeight

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToIndex = (index: number) => {
    const container = containerRef.current
    if (!container) return

    const targetScrollTop = index * itemHeight
    container.scrollTop = targetScrollTop
  }

  return {
    visibleItems,
    totalHeight,
    offsetY,
    containerRef,
    scrollToIndex
  }
}

export default useVirtualScroll

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low'
  delay?: number
  maxConcurrent?: number
}

interface PreloadItem {
  url: string
  type: 'image' | 'video'
  priority: 'high' | 'medium' | 'low'
  loaded: boolean
  loading: boolean
}

export function useSmartPreloading(
  urls: string[],
  options: PreloadOptions = {}
) {
  const { priority = 'medium', delay = 0, maxConcurrent = 3 } = options
  const [preloadItems, setPreloadItems] = useState<PreloadItem[]>([])
  const [currentlyLoading, setCurrentlyLoading] = useState<Set<string>>(new Set())
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const preloadItemsRef = useRef<PreloadItem[]>([])
  const currentlyLoadingRef = useRef<Set<string>>(new Set())

  // Create stable reference for URLs
  const urlsKey = useMemo(() => urls.join('|'), [urls])
  
  // Initialize preload items
  useEffect(() => {
    const items: PreloadItem[] = urls.map(url => ({
      url,
      type: url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? 'video' : 'image',
      priority,
      loaded: false,
      loading: false
    }))
    
    setPreloadItems(items)
    preloadItemsRef.current = items
  }, [urlsKey, priority])

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject()
      img.src = url
    })
  }, [])

  const preloadVideo = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject()
      video.src = url
    })
  }, [])

  const processQueue = useCallback(async () => {
    if (currentlyLoadingRef.current.size >= maxConcurrent) return

    const nextItem = preloadItemsRef.current.find(
      item => !item.loaded && !item.loading && !currentlyLoadingRef.current.has(item.url)
    )

    if (!nextItem) return

    const newLoadingSet = new Set(currentlyLoadingRef.current).add(nextItem.url)
    setCurrentlyLoading(newLoadingSet)
    currentlyLoadingRef.current = newLoadingSet

    const updatedItems = preloadItemsRef.current.map(item => 
      item.url === nextItem.url ? { ...item, loading: true } : item
    )
    setPreloadItems(updatedItems)
    preloadItemsRef.current = updatedItems

    try {
      if (nextItem.type === 'image') {
        await preloadImage(nextItem.url)
      } else {
        await preloadVideo(nextItem.url)
      }

      const finalItems = preloadItemsRef.current.map(item => 
        item.url === nextItem.url ? { ...item, loaded: true, loading: false } : item
      )
      setPreloadItems(finalItems)
      preloadItemsRef.current = finalItems
    } catch (error) {
      console.warn(`Failed to preload ${nextItem.url}:`, error)
      const errorItems = preloadItemsRef.current.map(item => 
        item.url === nextItem.url ? { ...item, loading: false } : item
      )
      setPreloadItems(errorItems)
      preloadItemsRef.current = errorItems
    } finally {
      const finalLoadingSet = new Set(currentlyLoadingRef.current)
      finalLoadingSet.delete(nextItem.url)
      setCurrentlyLoading(finalLoadingSet)
      currentlyLoadingRef.current = finalLoadingSet
      
      // Continue processing queue if there are more items
      if (preloadItemsRef.current.some(item => !item.loaded && !item.loading)) {
        setTimeout(() => processQueue(), 100)
      }
    }
  }, [maxConcurrent, preloadImage, preloadVideo])

  // Start processing when items are initialized
  useEffect(() => {
    if (preloadItemsRef.current.length > 0) {
      const timeout = setTimeout(() => {
        processQueue()
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [urlsKey, delay, processQueue])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const preloadStatus = {
    total: preloadItems.length,
    loaded: preloadItems.filter(item => item.loaded).length,
    loading: preloadItems.filter(item => item.loading).length,
    pending: preloadItems.filter(item => !item.loaded && !item.loading).length
  }

  return {
    preloadItems,
    preloadStatus,
    isLoaded: (url: string) => preloadItems.find(item => item.url === url)?.loaded || false,
    isLoading: (url: string) => preloadItems.find(item => item.url === url)?.loading || false
  }
}

export default useSmartPreloading

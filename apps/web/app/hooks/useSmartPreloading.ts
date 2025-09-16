import { useEffect, useRef, useState } from 'react'

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
  const [loadingQueue, setLoadingQueue] = useState<string[]>([])
  const [currentlyLoading, setCurrentlyLoading] = useState<Set<string>>(new Set())
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

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
  }, [urls, priority])

  // Smart preloading logic
  useEffect(() => {
    const preloadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = url
      })
    }

    const preloadVideo = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject()
        video.src = url
      })
    }

    const processQueue = async () => {
      if (currentlyLoading.size >= maxConcurrent) return

      const nextItem = preloadItems.find(
        item => !item.loaded && !item.loading && !currentlyLoading.has(item.url)
      )

      if (!nextItem) return

      setCurrentlyLoading(prev => new Set(prev).add(nextItem.url))
      setPreloadItems(prev => 
        prev.map(item => 
          item.url === nextItem.url ? { ...item, loading: true } : item
        )
      )

      try {
        if (nextItem.type === 'image') {
          await preloadImage(nextItem.url)
        } else {
          await preloadVideo(nextItem.url)
        }

        setPreloadItems(prev => 
          prev.map(item => 
            item.url === nextItem.url ? { ...item, loaded: true, loading: false } : item
          )
        )
      } catch (error) {
        console.warn(`Failed to preload ${nextItem.url}:`, error)
        setPreloadItems(prev => 
          prev.map(item => 
            item.url === nextItem.url ? { ...item, loading: false } : item
          )
        )
      } finally {
        setCurrentlyLoading(prev => {
          const newSet = new Set(prev)
          newSet.delete(nextItem.url)
          return newSet
        })
      }
    }

    // Process queue with delay
    const timeout = setTimeout(() => {
      processQueue()
    }, delay)

    return () => clearTimeout(timeout)
  }, [preloadItems, currentlyLoading, maxConcurrent, delay])

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

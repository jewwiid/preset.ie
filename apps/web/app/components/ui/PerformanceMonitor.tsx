'use client'

import { useEffect, useState, useRef } from 'react'

interface PerformanceMetrics {
  loadTime: number
  imageCount: number
  videoCount: number
  totalSize: number
  averageImageSize: number
  averageVideoSize: number
  domNodes: number
  memoryUsage: number
  networkRequests: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  enabled?: boolean
}

export default function PerformanceMonitor({ 
  onMetricsUpdate, 
  enabled = true 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    imageCount: 0,
    videoCount: 0,
    totalSize: 0,
    averageImageSize: 0,
    averageVideoSize: 0,
    domNodes: 0,
    memoryUsage: 0,
    networkRequests: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0
  })
  
  const lastUpdateRef = useRef<PerformanceMetrics | null>(null)

  useEffect(() => {
    if (!enabled) return

    const startTime = performance.now()
    let isActive = true
    
    // Monitor image loading performance
    const imageObserver = new PerformanceObserver((list) => {
      if (!isActive) return
      
      const entries = list.getEntries()
      let totalImageSize = 0
      let imageCount = 0
      
      entries.forEach((entry) => {
        if (entry.name.includes('image') || entry.name.includes('.jpg') || entry.name.includes('.png') || entry.name.includes('.webp')) {
          imageCount++
          // Estimate size based on transfer size if available
          if ('transferSize' in entry) {
            totalImageSize += (entry as any).transferSize || 0
          }
        }
      })
      
      if (imageCount > 0) {
        setMetrics(prev => ({
          ...prev,
          imageCount: prev.imageCount + imageCount,
          totalSize: prev.totalSize + totalImageSize,
          averageImageSize: prev.imageCount > 0 ? prev.totalSize / prev.imageCount : 0
        }))
      }
    })

    // Monitor video loading performance
    const videoObserver = new PerformanceObserver((list) => {
      if (!isActive) return
      
      const entries = list.getEntries()
      let totalVideoSize = 0
      let videoCount = 0
      
      entries.forEach((entry) => {
        if (entry.name.includes('video') || entry.name.includes('.mp4') || entry.name.includes('.webm')) {
          videoCount++
          if ('transferSize' in entry) {
            totalVideoSize += (entry as any).transferSize || 0
          }
        }
      })
      
      if (videoCount > 0) {
        setMetrics(prev => ({
          ...prev,
          videoCount: prev.videoCount + videoCount,
          totalSize: prev.totalSize + totalVideoSize,
          averageVideoSize: prev.videoCount > 0 ? prev.totalSize / prev.videoCount : 0
        }))
      }
    })

    try {
      imageObserver.observe({ entryTypes: ['resource'] })
      videoObserver.observe({ entryTypes: ['resource'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }

    // Enhanced metrics calculation
    const calculateMetrics = () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Count DOM nodes
      const domNodes = document.querySelectorAll('*').length
      
      // Get memory usage (if available)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0
      
      // Count network requests
      const networkRequests = performance.getEntriesByType('resource').length
      
      // Get Core Web Vitals
      let firstContentfulPaint = 0
      let largestContentfulPaint = 0
      
      try {
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) firstContentfulPaint = fcpEntry.startTime
        
        // LCP is more complex and requires observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          largestContentfulPaint = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('Core Web Vitals not supported:', error)
      }
      
      setMetrics(prev => ({
        ...prev,
        loadTime,
        domNodes,
        memoryUsage,
        networkRequests,
        firstContentfulPaint,
        largestContentfulPaint
      }))
    }

    // Update metrics when component unmounts or after a delay
    const timeout = setTimeout(calculateMetrics, 5000)
    
    return () => {
      isActive = false
      clearTimeout(timeout)
      imageObserver.disconnect()
      videoObserver.disconnect()
      calculateMetrics()
    }
  }, [enabled])

  // Metrics are now only updated internally, no external callbacks

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development' || !enabled) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-primary-foreground p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Performance Metrics</div>
      <div className="space-y-1">
        <div>Load Time: {metrics.loadTime.toFixed(2)}ms</div>
        <div>FCP: {metrics.firstContentfulPaint.toFixed(2)}ms</div>
        <div>LCP: {metrics.largestContentfulPaint.toFixed(2)}ms</div>
        <div>Images: {metrics.imageCount}</div>
        <div>Videos: {metrics.videoCount}</div>
        <div>DOM Nodes: {metrics.domNodes}</div>
        <div>Network: {metrics.networkRequests}</div>
        <div>Memory: {formatBytes(metrics.memoryUsage)}</div>
        <div>Total Size: {formatBytes(metrics.totalSize)}</div>
        <div>Avg Image: {formatBytes(metrics.averageImageSize)}</div>
        <div>Avg Video: {formatBytes(metrics.averageVideoSize)}</div>
      </div>
    </div>
  )
}

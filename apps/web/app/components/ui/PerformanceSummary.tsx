'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, Image, Video, Database, Wifi } from 'lucide-react'

interface PerformanceMetrics {
  loadTime: number
  imageCount: number
  videoCount: number
  totalSize: number
  domNodes: number
  networkRequests: number
  memoryUsage: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

interface PerformanceSummaryProps {
  metrics: PerformanceMetrics
  previousMetrics?: PerformanceMetrics
}

export default function PerformanceSummary({ metrics, previousMetrics }: PerformanceSummaryProps) {
  const [improvements, setImprovements] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])

  useEffect(() => {
    const newImprovements: string[] = []
    const newRecommendations: string[] = []

    // Analyze load time
    if (metrics.loadTime > 3000) {
      newRecommendations.push('Load time is high (>3s). Consider reducing initial bundle size.')
    } else if (metrics.loadTime < 1000) {
      newImprovements.push('Excellent load time! (<1s)')
    }

    // Analyze DOM nodes
    if (metrics.domNodes > 1000) {
      newRecommendations.push('High DOM node count. Consider virtual scrolling for large lists.')
    } else if (metrics.domNodes < 500) {
      newImprovements.push('Low DOM complexity. Good for performance!')
    }

    // Analyze memory usage
    if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      newRecommendations.push('High memory usage. Consider lazy loading and cleanup.')
    } else if (metrics.memoryUsage < 10 * 1024 * 1024) { // 10MB
      newImprovements.push('Low memory usage. Excellent optimization!')
    }

    // Analyze Core Web Vitals
    if (metrics.firstContentfulPaint > 1800) {
      newRecommendations.push('FCP is slow (>1.8s). Optimize critical rendering path.')
    } else if (metrics.firstContentfulPaint < 1000) {
      newImprovements.push('Fast First Contentful Paint! (<1s)')
    }

    if (metrics.largestContentfulPaint > 2500) {
      newRecommendations.push('LCP is slow (>2.5s). Optimize largest content element.')
    } else if (metrics.largestContentfulPaint < 1200) {
      newImprovements.push('Fast Largest Contentful Paint! (<1.2s)')
    }

    // Analyze media loading
    const totalMedia = metrics.imageCount + metrics.videoCount
    if (totalMedia > 20) {
      newRecommendations.push('Many media items. Ensure lazy loading is working.')
    }

    // Analyze network requests
    if (metrics.networkRequests > 50) {
      newRecommendations.push('High number of network requests. Consider bundling.')
    }

    setImprovements(newImprovements)
    setRecommendations(newRecommendations)
  }, [metrics])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPerformanceScore = (): number => {
    let score = 100
    
    // Deduct points for poor metrics
    if (metrics.loadTime > 3000) score -= 20
    if (metrics.domNodes > 1000) score -= 15
    if (metrics.memoryUsage > 50 * 1024 * 1024) score -= 15
    if (metrics.firstContentfulPaint > 1800) score -= 20
    if (metrics.largestContentfulPaint > 2500) score -= 20
    if (metrics.networkRequests > 50) score -= 10
    
    return Math.max(0, score)
  }

  const score = getPerformanceScore()
  const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Analysis</h3>
        <div className={`text-2xl font-bold ${scoreColor}`}>
          {score}/100
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Load Time</span>
          </div>
          <div className="text-lg font-mono">{metrics.loadTime.toFixed(0)}ms</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">DOM Nodes</span>
          </div>
          <div className="text-lg font-mono">{metrics.domNodes}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Images</span>
          </div>
          <div className="text-lg font-mono">{metrics.imageCount}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Videos</span>
          </div>
          <div className="text-lg font-mono">{metrics.videoCount}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Network</span>
          </div>
          <div className="text-lg font-mono">{metrics.networkRequests}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">Memory</span>
          </div>
          <div className="text-lg font-mono">{formatBytes(metrics.memoryUsage)}</div>
        </div>
      </div>

      {improvements.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-green-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Improvements
          </h4>
          <ul className="space-y-1">
            {improvements.map((improvement, index) => (
              <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-orange-700 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Recommendations
          </h4>
          <ul className="space-y-1">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-orange-600 flex items-start gap-2">
                <span className="text-orange-500 mt-1">!</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

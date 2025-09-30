'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, X, CheckCircle, Loader2 } from 'lucide-react'

interface MasonryItem {
  id: string
  type: 'image' | 'video' | 'pexels'
  source: 'upload' | 'pexels' | 'url' | 'ai-enhanced'
  url: string
  thumbnail_url?: string
  enhanced_url?: string
  caption?: string
  width?: number
  height?: number
  photographer?: string
  photographer_url?: string
  position: number
  enhancement_prompt?: string
  original_image_id?: string
  original_url?: string
  enhancement_task_id?: string
  enhancement_status?: 'pending' | 'processing' | 'completed' | 'failed'
  cost?: number
  showing_original?: boolean
}

interface MasonryGridProps {
  items: MasonryItem[]
  onRemove?: (itemId: string) => void
  onEnhance?: (itemId: string) => void
  onToggleOriginal?: (itemId: string) => void
  onRedoEnhancement?: (itemId: string) => void
  onItemClick?: (item: MasonryItem) => void
  enhancingItems?: Set<string>
  enhancementTasks?: Map<string, { status: string, progress: number }>
  subscriptionTier?: 'free' | 'plus' | 'pro'
  editable?: boolean
}

export default function MasonryGrid({
  items,
  onRemove,
  onEnhance,
  onToggleOriginal,
  onRedoEnhancement,
  onItemClick,
  enhancingItems = new Set(),
  enhancementTasks = new Map(),
  subscriptionTier = 'free',
  editable = false
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(3)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Calculate number of columns based on container width
  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        if (width < 640) setColumns(2)
        else if (width < 1024) setColumns(3)
        else if (width < 1280) setColumns(4)
        else setColumns(5)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Handle image loading to get actual dimensions
  const handleImageLoad = useCallback((itemId: string) => {
    setLoadedImages(prev => new Set(prev).add(itemId))
  }, [])

  // Distribute items into columns
  const distributeItems = () => {
    const cols: MasonryItem[][] = Array.from({ length: columns }, () => [])
    const colHeights = new Array(columns).fill(0)

    items.forEach(item => {
      // Find shortest column
      const shortestCol = colHeights.indexOf(Math.min(...colHeights))
      cols[shortestCol].push(item)
      
      // Estimate height based on aspect ratio
      const aspectRatio = (item.width && item.height) ? item.width / item.height : 1
      const estimatedHeight = 200 / aspectRatio // Base height of 200px
      colHeights[shortestCol] += estimatedHeight
    })

    return cols
  }

  const columnItems = distributeItems()

  return (
    <div ref={containerRef} className="w-full">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {columnItems.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3">
            {column.map(item => {
              const isEnhancing = enhancingItems.has(item.id)
              const task = enhancementTasks.get(item.id)
              const imageUrl = item.showing_original && item.original_url 
                ? item.original_url 
                : item.enhanced_url || item.thumbnail_url || item.url

              return (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden bg-muted-50 cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => onItemClick?.(item)}
                >
                  {/* Image with natural height */}
                  {item.type === 'image' ? (
                    <img
                      src={imageUrl}
                      alt={item.caption || ''}
                      className={`w-full h-auto block ${
                        isEnhancing ? 'opacity-50' : 'opacity-100'
                      } ${!loadedImages.has(item.id) ? 'animate-pulse bg-muted-200' : ''}`}
                      loading="lazy"
                      onLoad={() => handleImageLoad(item.id)}
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-auto block"
                      muted
                      loop
                      playsInline
                      poster={item.thumbnail_url}
                    />
                  )}

                  {/* Enhancement status overlay */}
                  {isEnhancing && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center">
                      {task?.status === 'completed' ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-primary-400 mb-2" />
                          <span className="text-sm text-primary-foreground font-medium">Enhanced!</span>
                        </>
                      ) : task?.status === 'failed' ? (
                        <>
                          <X className="w-8 h-8 text-destructive-400 mb-2" />
                          <span className="text-sm text-primary-foreground font-medium">Failed</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mb-2" />
                          <div className="w-24 h-1.5 bg-muted-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${task?.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground-300 mt-2">Enhancing...</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Enhancement badge */}
                  {item.enhancement_status === 'completed' && !isEnhancing && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {item.showing_original ? 'Original' : 'Enhanced'}
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  {editable && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Remove button */}
                      {onRemove && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemove(item.id)
                          }}
                          className="absolute top-2 right-2 bg-destructive-500 text-primary-foreground rounded-full w-8 h-8 hover:bg-destructive-600 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Toggle original/enhanced */}
                      {item.original_url && item.enhancement_status === 'completed' && onToggleOriginal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleOriginal(item.id)
                          }}
                          className="absolute top-2 right-12 bg-background/90 text-muted-foreground-700 rounded px-2 py-1 text-xs hover:bg-background"
                        >
                          {item.showing_original ? "Enhanced" : "Original"}
                        </button>
                      )}

                      {/* Bottom actions */}
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                        {/* Enhance button */}
                        {subscriptionTier !== 'free' && item.type === 'image' && !item.enhanced_url && !isEnhancing && onEnhance && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEnhance(item.id)
                            }}
                            className="bg-primary-500 text-primary-foreground rounded px-3 py-1 text-xs hover:bg-primary-600 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Enhance
                          </button>
                        )}

                        {/* Redo enhancement */}
                        {item.enhancement_status === 'completed' && onRedoEnhancement && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRedoEnhancement(item.id)
                            }}
                            className="bg-primary-500 text-primary-foreground rounded px-3 py-1 text-xs hover:bg-primary-600"
                          >
                            Redo
                          </button>
                        )}

                        {/* Attribution */}
                        {item.photographer && (
                          <div className="text-xs text-primary-foreground">
                            📷 {item.photographer}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Non-editable attribution */}
                  {!editable && item.photographer && (
                    <div className="absolute bottom-2 left-2 text-xs text-primary-foreground bg-black/50 px-2 py-1 rounded">
                      📷 {item.photographer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground-500">
          <div className="text-6xl mb-4">📸</div>
          <p>No images added yet</p>
          <p className="text-sm">Upload some images to create your moodboard</p>
        </div>
      )}
    </div>
  )
}
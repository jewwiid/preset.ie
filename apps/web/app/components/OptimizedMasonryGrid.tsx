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

interface GridItem {
  item: MasonryItem
  column: number
  row: number
  span: number
}

export default function OptimizedMasonryGrid({
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
  const [gridLayout, setGridLayout] = useState<'grid' | 'masonry'>('grid')
  const [imagesLoaded, setImagesLoaded] = useState<Map<string, boolean>>(new Map())

  // Use CSS Grid with auto-placement for better space utilization
  const getGridClass = () => {
    return 'grid gap-3 auto-rows-[minmax(100px,_auto)] grid-flow-dense'
  }

  const getColumnsClass = () => {
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  }

  // Determine item span based on aspect ratio
  const getItemSpan = (item: MasonryItem) => {
    if (!item.width || !item.height) return ''
    
    const aspectRatio = item.width / item.height
    
    // Portrait images (taller than wide)
    if (aspectRatio < 0.8) {
      return 'row-span-2' // Take up 2 rows
    }
    // Square-ish images
    else if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
      return 'row-span-1' // Normal height
    }
    // Landscape images (wider than tall)
    else if (aspectRatio > 1.2 && aspectRatio <= 1.8) {
      return 'col-span-2 row-span-1' // Take up 2 columns
    }
    // Very wide landscape
    else {
      return 'col-span-2 sm:col-span-3 row-span-1' // Take up more columns on larger screens
    }
  }

  const handleImageLoad = useCallback((itemId: string, img: HTMLImageElement) => {
    setImagesLoaded(prev => {
      const newMap = new Map(prev)
      newMap.set(itemId, true)
      return newMap
    })
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      <div className={`${getGridClass()} ${getColumnsClass()}`}>
        {items.map((item) => {
          const isEnhancing = enhancingItems.has(item.id)
          const task = enhancementTasks.get(item.id)
          const imageUrl = item.showing_original && item.original_url 
            ? item.original_url 
            : item.enhanced_url || item.thumbnail_url || item.url
          const itemSpan = getItemSpan(item)

          return (
            <div
              key={item.id}
              className={`relative group rounded-lg overflow-hidden bg-muted-50 cursor-pointer hover:shadow-xl transition-all duration-300 ${itemSpan}`}
              onClick={() => onItemClick?.(item)}
            >
              {/* Image container with aspect ratio preservation */}
              <div className="relative w-full h-full min-h-[150px]">
                {item.type === 'image' ? (
                  <img
                    src={imageUrl}
                    alt={item.caption || ''}
                    className={`w-full h-full object-cover ${
                      isEnhancing ? 'opacity-50' : 'opacity-100'
                    }`}
                    loading="lazy"
                    onLoad={(e) => handleImageLoad(item.id, e.currentTarget)}
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    poster={item.thumbnail_url}
                  />
                )}

                {/* Loading placeholder */}
                {!imagesLoaded.get(item.id) && (
                  <div className="absolute inset-0 bg-muted-200 animate-pulse" />
                )}
              </div>

              {/* Enhancement status overlay */}
              {isEnhancing && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-10">
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
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3" />
                  {item.showing_original ? 'Original' : 'Enhanced'}
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Top actions */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {/* Remove button */}
                  {editable && onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(item.id)
                      }}
                      className="bg-destructive-500 text-primary-foreground rounded-full w-8 h-8 hover:bg-destructive-600 flex items-center justify-center transition-colors"
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
                      className="bg-background/90 text-muted-foreground-700 rounded px-2 py-1 text-xs hover:bg-background transition-colors"
                    >
                      {item.showing_original ? "Enhanced" : "Original"}
                    </button>
                  )}
                </div>

                {/* Bottom actions */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  <div className="flex gap-2">
                    {/* Enhance button */}
                    {editable && subscriptionTier !== 'free' && item.type === 'image' && !item.enhanced_url && !isEnhancing && onEnhance && (
                      <div className="relative group/enhance">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEnhance(item.id)
                          }}
                          className="bg-primary-500 text-primary-foreground rounded px-3 py-1 text-xs hover:bg-primary-600 flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Enhance
                        </button>
                        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-muted-900 text-primary-foreground text-xs rounded opacity-0 group-hover/enhance:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          AI enhance this image (1 credit)
                          <div className="absolute top-full left-4 -mt-1">
                            <div className="border-4 border-transparent border-t-muted-primary"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Redo enhancement */}
                    {editable && item.enhancement_status === 'completed' && onRedoEnhancement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRedoEnhancement(item.id)
                        }}
                        className="bg-primary-500 text-primary-foreground rounded px-3 py-1 text-xs hover:bg-primary-600 transition-colors"
                      >
                        Redo
                      </button>
                    )}
                  </div>

                  {/* Attribution */}
                  {item.photographer && (
                    <div className="text-xs text-primary-foreground bg-black/50 px-2 py-1 rounded">
                      📷 {item.photographer}
                    </div>
                  )}
                </div>
              </div>

              {/* Non-editable attribution */}
              {!editable && item.photographer && (
                <div className="absolute bottom-2 left-2 text-xs text-primary-foreground bg-black/50 px-2 py-1 rounded z-10">
                  📷 {item.photographer}
                </div>
              )}
            </div>
          )
        })}
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
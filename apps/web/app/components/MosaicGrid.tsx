'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, X, CheckCircle, Loader2 } from 'lucide-react'

interface MosaicItem {
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

interface MosaicGridProps {
  items: MosaicItem[]
  onRemove: (itemId: string) => void
  onEnhance?: (itemId: string) => void
  onToggleOriginal?: (itemId: string) => void
  onRedoEnhancement?: (itemId: string) => void
  onItemClick?: (item: MosaicItem) => void
  enhancingItems?: Set<string>
  enhancementTasks?: Map<string, { status: string, progress: number }>
  subscriptionTier?: 'free' | 'plus' | 'pro'
  onDragStart?: (e: React.DragEvent, index: number) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, dropIndex: number) => void
  draggedItem?: number | null
}

interface GridItem {
  id: string
  x: number
  y: number
  width: number
  height: number
  aspectRatio: number
  item: MosaicItem
}

export default function MosaicGrid({
  items,
  onRemove,
  onEnhance,
  onToggleOriginal,
  onRedoEnhancement,
  onItemClick,
  enhancingItems = new Set(),
  enhancementTasks = new Map(),
  subscriptionTier = 'free',
  onDragStart,
  onDragOver,
  onDrop,
  draggedItem
}: MosaicGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [gridItems, setGridItems] = useState<GridItem[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Calculate aspect ratio from image dimensions or use default
  const getAspectRatio = useCallback((item: MosaicItem): number => {
    if (item.width && item.height && item.width > 0 && item.height > 0) {
      return item.width / item.height
    }
    // Default aspect ratios based on common image types
    const defaultRatios = [1, 1.2, 1.5, 0.8, 1.33, 0.75]
    return defaultRatios[item.position % defaultRatios.length]
  }, [])

  // Calculate grid layout using a masonry algorithm
  const calculateLayout = useCallback(() => {
    if (!containerWidth || items.length === 0) return

    const minColumnWidth = 200 // Minimum width for readability
    const maxColumns = 5 // Maximum columns for larger screens
    const gap = 12 // Slightly larger gap for better separation
    
    // Calculate optimal number of columns
    const possibleColumns = Math.floor((containerWidth + gap) / (minColumnWidth + gap))
    const columns = Math.min(Math.max(2, possibleColumns), maxColumns)
    
    const columnWidth = (containerWidth - (columns - 1) * gap) / columns
    const columnHeights = new Array(columns).fill(0)
    const newGridItems: GridItem[] = []

    items.forEach((item, index) => {
      const aspectRatio = getAspectRatio(item)
      
      // Calculate height based on aspect ratio
      // Add some variation for more interesting layout
      let itemHeight = columnWidth / aspectRatio
      
      // Optional: Add slight size variations for more dynamic look
      // Portraits get slightly taller, landscapes slightly shorter
      if (aspectRatio < 0.8) {
        itemHeight *= 1.1 // Make portraits slightly taller
      } else if (aspectRatio > 1.5) {
        itemHeight *= 0.9 // Make landscapes slightly shorter
      }

      // Find the shortest column
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Calculate position
      const x = shortestColumn * (columnWidth + gap)
      const y = columnHeights[shortestColumn]

      // Update column height
      columnHeights[shortestColumn] += itemHeight + gap

      newGridItems.push({
        id: item.id,
        x,
        y,
        width: columnWidth,
        height: itemHeight,
        aspectRatio,
        item
      })
    })

    setGridItems(newGridItems)
  }, [containerWidth, items, getAspectRatio])

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Recalculate layout when items or container width changes
  useEffect(() => {
    calculateLayout()
  }, [calculateLayout])

  // Handle drag events
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setIsDragging(true)
    onDragStart?.(e, index)
  }, [onDragStart])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    onDragOver?.(e)
  }, [onDragOver])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setIsDragging(false)
    onDrop?.(e, dropIndex)
  }, [onDrop])

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground-500">
        <div className="text-6xl mb-4">📸</div>
        <p>No images added yet</p>
        <p className="text-sm">Upload some images to create your moodboard</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ height: gridItems.length > 0 ? Math.max(...gridItems.map(item => item.y + item.height)) : 'auto' }}
    >
      {gridItems.map((gridItem, index) => {
        const { item } = gridItem
        const isEnhancing = enhancingItems.has(item.id)
        const task = enhancementTasks.get(item.id)
        
        return (
          <div
            key={item.id}
            className={`absolute transition-all duration-300 ease-out ${
              isDragging && draggedItem === index ? 'opacity-50 scale-95' : 'opacity-100'
            }`}
            style={{
              left: gridItem.x,
              top: gridItem.y,
              width: gridItem.width,
              height: gridItem.height,
              transform: isDragging && draggedItem === index ? 'rotate(2deg)' : 'rotate(0deg)'
            }}
            draggable={!isEnhancing}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div 
              className={`relative w-full h-full group overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-shadow ${
                onItemClick ? 'cursor-pointer' : 'cursor-move'
              }`}
              onClick={() => onItemClick?.(item)}
            >
              {/* Image/Video - Fill container without cropping */}
              {item.type === 'image' ? (
                <img
                  src={
                    item.showing_original && item.original_url 
                      ? item.original_url 
                      : item.enhanced_url
                      ? item.enhanced_url
                      : (item.thumbnail_url || item.url)
                  }
                  alt={item.caption || ''}
                  className={`w-full h-full object-cover rounded-lg ${
                    isEnhancing ? 'opacity-50' : 'opacity-100'
                  }`}
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  loading="lazy"
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full h-full object-cover rounded-lg"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  muted
                  loop
                  playsInline
                />
              )}

              {/* Enhancement status overlay */}
              {isEnhancing && (
                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex flex-col items-center justify-center">
                  {(() => {
                    if (task?.status === 'completed') {
                      return (
                        <>
                          <CheckCircle className="w-8 h-8 text-primary-400 mb-2" />
                          <span className="text-sm text-primary-foreground font-medium">Enhanced!</span>
                        </>
                      )
                    } else if (task?.status === 'failed') {
                      return (
                        <>
                          <X className="w-8 h-8 text-destructive-400 mb-2" />
                          <span className="text-sm text-primary-foreground font-medium">Failed</span>
                        </>
                      )
                    } else {
                      return (
                        <>
                          <div className="relative mb-4">
                            <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
                            {task && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary-foreground">
                                  {Math.round(task.progress)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="w-24 h-1.5 bg-muted-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${task?.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground-300 mt-2">
                            {task?.status === 'processing' ? 'Initializing...' : 'Enhancing...'}
                          </span>
                        </>
                      )
                    }
                  })()}
                </div>
              )}

              {/* Enhancement badge */}
              {item.enhancement_status === 'completed' && !isEnhancing && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {item.showing_original ? 'Original' : 'Enhanced'}
                </div>
              )}

              {/* Action buttons overlay */}
              <div className="absolute inset-0">
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  className="absolute top-2 right-2 bg-destructive-500 text-primary-foreground rounded-full w-6 h-6 hover:bg-destructive-600 flex items-center justify-center text-xs font-bold"
                >
                  ×
                </button>

                {/* Before/After toggle */}
                {item.original_url && item.enhancement_status === 'completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleOriginal?.(item.id)
                    }}
                    className="absolute top-2 right-10 bg-background bg-opacity-90 text-muted-foreground-700 rounded px-2 py-1 text-xs hover:bg-opacity-100 whitespace-nowrap"
                    title={item.showing_original ? "Show Enhanced" : "Show Original"}
                  >
                    {item.showing_original ? "Enhanced" : "Original"}
                  </button>
                )}

                {/* Enhance button */}
                {subscriptionTier !== 'free' && item.type === 'image' && !item.enhanced_url && !isEnhancing && onEnhance && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEnhance(item.id)
                    }}
                    className="absolute bottom-2 left-2 bg-primary-500 text-primary-foreground rounded px-2 py-1 text-xs hover:bg-primary-600 whitespace-nowrap flex items-center gap-1"
                    title="Enhance with AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    Enhance
                  </button>
                )}

                {/* Redo enhancement button */}
                {item.enhancement_status === 'completed' && onRedoEnhancement && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRedoEnhancement(item.id)
                    }}
                    className="absolute bottom-2 right-2 bg-primary-500 text-primary-foreground rounded px-2 py-1 text-xs hover:bg-primary-600 whitespace-nowrap"
                    title="Redo Enhancement"
                  >
                    Redo
                  </button>
                )}

                {/* Attribution */}
                {(item.photographer || item.original_url) && (
                  <div className="absolute bottom-2 left-2 text-xs text-primary-foreground bg-black bg-opacity-50 px-2 py-1 rounded">
                    📷 {item.photographer || 'Original'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

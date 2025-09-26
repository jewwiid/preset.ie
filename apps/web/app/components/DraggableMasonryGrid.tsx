'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, X, CheckCircle, Loader2, Move, Maximize2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  onReorder?: (items: MasonryItem[]) => void
  enhancingItems?: Set<string>
  enhancementTasks?: Map<string, { status: string, progress: number }>
  subscriptionTier?: 'free' | 'plus' | 'pro'
  editable?: boolean
}

interface DragState {
  isDragging: boolean
  draggedItem: MasonryItem | null
  draggedOverItem: MasonryItem | null
  startPosition: { x: number, y: number }
  currentPosition: { x: number, y: number }
}

export default function DraggableMasonryGrid({
  items,
  onRemove,
  onEnhance,
  onToggleOriginal,
  onRedoEnhancement,
  onItemClick,
  onReorder,
  enhancingItems = new Set(),
  enhancementTasks = new Map(),
  subscriptionTier = 'free',
  editable = false
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    draggedOverItem: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  })
  const [orderedItems, setOrderedItems] = useState(items)
  const [imagesLoaded, setImagesLoaded] = useState<Map<string, boolean>>(new Map())
  const dragImageRef = useRef<HTMLDivElement>(null)

  // Update ordered items when props change
  useEffect(() => {
    setOrderedItems(items)
  }, [items])

  // Handle image loading
  const handleImageLoad = useCallback((itemId: string) => {
    setImagesLoaded(prev => {
      const newMap = new Map(prev)
      newMap.set(itemId, true)
      return newMap
    })
  }, [])

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: MasonryItem) => {
    if (!editable) return
    
    // Create custom drag image
    const dragImg = new Image()
    dragImg.src = item.thumbnail_url || item.url
    e.dataTransfer.setDragImage(dragImg, e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    e.dataTransfer.effectAllowed = 'move'
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: item,
      startPosition: { x: e.clientX, y: e.clientY }
    }))
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, item: MasonryItem) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      setDragState(prev => ({
        ...prev,
        draggedOverItem: item,
        currentPosition: { x: e.clientX, y: e.clientY }
      }))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: MasonryItem) => {
    e.preventDefault()
    
    if (!dragState.draggedItem || dragState.draggedItem.id === targetItem.id) {
      return
    }

    // Reorder items
    const newItems = [...orderedItems]
    const draggedIndex = newItems.findIndex(item => item.id === dragState.draggedItem!.id)
    const targetIndex = newItems.findIndex(item => item.id === targetItem.id)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item
      const [removed] = newItems.splice(draggedIndex, 1)
      // Insert at new position
      newItems.splice(targetIndex, 0, removed)
      
      // Update positions
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        position: index
      }))
      
      setOrderedItems(updatedItems)
      onReorder?.(updatedItems)
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedItem: null,
      draggedOverItem: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 }
    })
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      draggedOverItem: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 }
    })
  }

  // Touch handlers for mobile
  const [touchItem, setTouchItem] = useState<MasonryItem | null>(null)
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 })
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, item: MasonryItem) => {
    if (!editable) return
    
    const touch = e.touches[0]
    setTouchItem(item)
    setTouchPosition({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchItem) return
    
    const touch = e.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })
    
    // Find element under touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (element) {
      const targetElement = element.closest('[data-item-id]')
      if (targetElement) {
        const targetId = targetElement.getAttribute('data-item-id')
        const targetItem = orderedItems.find(item => item.id === targetId)
        if (targetItem && targetItem.id !== touchItem.id) {
          // Perform swap
          const newItems = [...orderedItems]
          const draggedIndex = newItems.findIndex(item => item.id === touchItem.id)
          const targetIndex = newItems.findIndex(item => item.id === targetItem.id)
          
          if (draggedIndex !== -1 && targetIndex !== -1) {
            [newItems[draggedIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[draggedIndex]]
            setOrderedItems(newItems)
          }
        }
      }
    }
  }

  const handleTouchEnd = () => {
    if (touchItem && onReorder) {
      const updatedItems = orderedItems.map((item, index) => ({
        ...item,
        position: index
      }))
      onReorder(updatedItems)
    }
    setTouchItem(null)
  }

  // Grid layout with snap points
  const getGridClass = () => {
    return 'grid gap-3 auto-rows-[minmax(150px,_auto)] grid-flow-dense'
  }

  const getColumnsClass = () => {
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  }

  // Determine item span based on aspect ratio
  const getItemSpan = (item: MasonryItem) => {
    if (!item.width || !item.height) return ''
    
    const aspectRatio = item.width / item.height
    
    if (aspectRatio < 0.8) {
      return 'row-span-2' // Portrait
    } else if (aspectRatio > 1.5) {
      return 'col-span-2' // Landscape
    }
    return '' // Square-ish
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* Drag indicator overlay */}
      {dragState.isDragging && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}

      <div className={`${getGridClass()} ${getColumnsClass()} relative`}>
        {orderedItems.map((item) => {
          const isEnhancing = enhancingItems.has(item.id)
          const task = enhancementTasks.get(item.id)
          const imageUrl = item.showing_original && item.original_url 
            ? item.original_url 
            : item.enhanced_url || item.thumbnail_url || item.url
          const itemSpan = getItemSpan(item)
          const isDragging = dragState.draggedItem?.id === item.id
          const isDraggedOver = dragState.draggedOverItem?.id === item.id

          return (
            <div
              key={item.id}
              data-item-id={item.id}
              className={`
                relative group rounded-lg overflow-hidden bg-muted/20 
                ${editable ? 'cursor-move' : 'cursor-pointer'}
                ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
                ${isDraggedOver ? 'ring-4 ring-primary ring-offset-2' : ''}
                hover:shadow-xl transition-all duration-300 
                ${itemSpan}
              `}
              draggable={editable && !isEnhancing}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, item)}
              onDrop={(e) => handleDrop(e, item)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, item)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => !editable && onItemClick?.(item)}
            >
              {/* Drag handle indicator */}
              {editable && !isEnhancing && (
                <div className="absolute top-2 left-2 z-20 bg-background/90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              {/* Image container */}
              <div className="relative w-full h-full min-h-[150px]">
                {item.type === 'image' ? (
                  <img
                    src={imageUrl}
                    alt={item.caption || ''}
                    className={`w-full h-full object-cover ${
                      isEnhancing ? 'opacity-50' : 'opacity-100'
                    }`}
                    loading="lazy"
                    onLoad={(e) => handleImageLoad(item.id)}
                    draggable={false}
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    poster={item.thumbnail_url}
                    draggable={false}
                  />
                )}

                {/* Loading placeholder */}
                {!imagesLoaded.get(item.id) && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
              </div>

              {/* Enhancement status overlay */}
              {isEnhancing && (
                <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center z-10">
                  {task?.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm text-primary-foreground font-medium">Enhanced!</span>
                    </>
                  ) : task?.status === 'failed' ? (
                    <>
                      <X className="w-8 h-8 text-destructive-400 mb-2" />
                      <span className="text-sm text-primary-foreground font-medium">Failed</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${task?.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">Enhancing...</span>
                    </>
                  )}
                </div>
              )}

              {/* Enhancement badge */}
              {item.enhancement_status === 'completed' && !isEnhancing && (
                <div className="absolute top-2 right-12 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3" />
                  {item.showing_original ? 'Original' : 'Enhanced'}
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                {/* Action buttons need pointer events */}
                <div className="pointer-events-auto">
                  {/* Top actions */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {/* Remove button */}
                    {editable && onRemove && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(item.id)
                        }}
                        variant="destructive"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Bottom actions */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <div className="flex gap-2">
                      {/* Toggle original/enhanced */}
                      {item.original_url && item.enhancement_status === 'completed' && onToggleOriginal && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleOriginal(item.id)
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-background/90 text-xs"
                        >
                          {item.showing_original ? "Enhanced" : "Original"}
                        </Button>
                      )}

                      {/* Enhance button */}
                      {editable && subscriptionTier !== 'free' && item.type === 'image' && !item.enhanced_url && !isEnhancing && onEnhance && (
                        <div className="relative group/enhance">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEnhance(item.id)
                            }}
                            variant="default"
                            size="sm"
                            className="text-xs"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Enhance
                          </Button>
                          <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover/enhance:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            AI enhance this image (1 credit)
                            <div className="absolute top-full left-4 -mt-1">
                              <div className="border-4 border-transparent border-t-popover"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Redo enhancement */}
                      {editable && item.enhancement_status === 'completed' && onRedoEnhancement && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRedoEnhancement(item.id)
                          }}
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                        >
                          Redo
                        </Button>
                      )}
                    </div>

                    {/* Attribution */}
                    {item.photographer && (
                      <div className="text-xs text-primary-foreground bg-background/50 px-2 py-1 rounded flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {item.photographer}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View mode attribution */}
              {!editable && item.photographer && (
                <div className="absolute bottom-2 left-2 text-xs text-primary-foreground bg-background/50 px-2 py-1 rounded z-10 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {item.photographer}
                </div>
              )}

              {/* Full screen button for view mode */}
              {!editable && onItemClick && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemClick(item)
                  }}
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-8 h-8"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {orderedItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p>No images added yet</p>
          <p className="text-sm">Upload some images to create your moodboard</p>
        </div>
      )}

    </div>
  )
}
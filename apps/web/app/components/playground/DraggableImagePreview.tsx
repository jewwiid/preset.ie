'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Move } from 'lucide-react'

interface DraggableImagePreviewProps {
  imageUrl: string
  aspectRatio: string
  resolution: string
  onPositionChange?: (yPosition: number) => void
  onSaveFraming?: (framing: { yPosition: number; dimensions: { width: number; height: number } }) => void
  className?: string
  showGridOverlay?: boolean
  gridType?: 'horizontal' | 'rule-of-thirds'
}

export default function DraggableImagePreview({
  imageUrl,
  aspectRatio,
  resolution,
  onPositionChange,
  onSaveFraming,
  className = '',
  showGridOverlay = true,
  gridType = 'horizontal'
}: DraggableImagePreviewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [yPosition, setYPosition] = useState(0)
  const [dragStart, setDragStart] = useState({ y: 0, initialPosition: 0 })
  const [isFramingSaved, setIsFramingSaved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const convertAspectRatio = (ratio: string): string => {
    switch (ratio) {
      case '1:1': return '1'
      case '16:9': return '16/9'
      case '9:16': return '9/16'
      case '4:3': return '4/3'
      case '3:4': return '3/4'
      case '21:9': return '21/9'
      default: return '1'
    }
  }

  const calculateDimensions = (aspectRatio: string, resolution: string) => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    const aspectRatioValue = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (resolution === '720p') {
      if (aspectRatioValue >= 1) {
        width = 1280
        height = Math.round(1280 / aspectRatioValue)
      } else {
        height = 720
        width = Math.round(720 * aspectRatioValue)
      }
    } else { // 480p
      if (aspectRatioValue >= 1) {
        width = 854
        height = Math.round(854 / aspectRatioValue)
      } else {
        height = 480
        width = Math.round(480 * aspectRatioValue)
      }
    }
    
    return { width, height }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      y: e.clientY,
      initialPosition: yPosition
    })
  }, [yPosition])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return

    const deltaY = e.clientY - dragStart.y
    const newPosition = dragStart.initialPosition + deltaY

    // Calculate the actual effective image height based on natural dimensions
    const containerWidth = containerRef.current?.offsetWidth || 0
    const containerHeight = containerRef.current?.offsetHeight || 0
    const imageNaturalWidth = imageRef.current?.naturalWidth || 0
    const imageNaturalHeight = imageRef.current?.naturalHeight || 0

    let effectiveImageHeight = 0
    if (imageNaturalWidth > 0 && imageNaturalHeight > 0 && containerWidth > 0) {
      effectiveImageHeight = containerWidth * (imageNaturalHeight / imageNaturalWidth)
    } else {
      // Fallback if natural dimensions or container width are not available.
      effectiveImageHeight = containerHeight
    }


    if (effectiveImageHeight > containerHeight) {
      const maxMovement = effectiveImageHeight - containerHeight
      const maxPosition = 0 // Cannot move above the top of the container
      const minPosition = -maxMovement // Can move down to show the bottom of the image
      const constrainedPosition = Math.max(minPosition, Math.min(maxPosition, newPosition))

      setYPosition(constrainedPosition)
      onPositionChange?.(constrainedPosition)
    } else {
      // If the image is shorter or perfectly fits, allow a small fixed range for fine-tuning
      const movementRange = containerHeight * 0.2 // Allow 20% movement in each direction
      const maxPosition = movementRange
      const minPosition = -movementRange
      const constrainedPosition = Math.max(minPosition, Math.min(maxPosition, newPosition))

      setYPosition(constrainedPosition)
      onPositionChange?.(constrainedPosition)
    }
  }, [isDragging, dragStart, onPositionChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const saveFraming = useCallback(() => {
    const dimensions = calculateDimensions(aspectRatio, resolution)
    setIsFramingSaved(true)
    onSaveFraming?.({
      yPosition,
      dimensions
    })
  }, [yPosition, aspectRatio, resolution, onSaveFraming])

  const resetFraming = useCallback(() => {
    setIsFramingSaved(false)
    // Don't reset position - keep the saved framing and allow further adjustment
  }, [])

  const resetPosition = useCallback(() => {
    setYPosition(0)
    onPositionChange?.(0)
    setIsFramingSaved(false)
  }, [onPositionChange])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const dimensions = calculateDimensions(aspectRatio, resolution)


  return (
    <div className={`relative ${className}`}>
      {/* Container with fixed aspect ratio */}
      <div 
        ref={containerRef}
        className={`w-full bg-muted border-2 border-dashed border-border rounded-lg overflow-hidden transition-all duration-300 relative group ${
          isFramingSaved ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{ 
          aspectRatio: convertAspectRatio(aspectRatio),
          maxWidth: '100%'
        }}
        onMouseDown={isFramingSaved ? undefined : handleMouseDown}
      >
        {/* Draggable Image */}
        <div
          className="absolute inset-0 transition-transform duration-100"
          style={{
            transform: `translateY(${yPosition}px)`,
            transformOrigin: 'center',
            pointerEvents: 'none'
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto select-none"
            draggable={false}
            style={{
              objectFit: 'cover',
              minHeight: '100%',
              width: '100%',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Grid overlay */}
        {showGridOverlay && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {gridType === 'horizontal' && (
              /* Horizontal center line */
              <div className="absolute top-1/2 left-0 right-0 h-px bg-primary-500/90 transform -translate-y-1/2 shadow-lg" />
            )}
            
            {gridType === 'rule-of-thirds' && (
              <>
                {/* Rule of thirds grid - horizontal lines */}
                <div className="absolute top-1/3 left-0 right-0 h-px bg-primary-500/90 transform -translate-y-1/2 shadow-lg" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-primary-500/90 transform -translate-y-1/2 shadow-lg" />
                
                {/* Rule of thirds grid - vertical lines */}
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-primary-500/90 transform -translate-x-1/2 shadow-lg" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-primary-500/90 transform -translate-x-1/2 shadow-lg" />
              </>
            )}
          </div>
        )}
          
        {/* State-based UI */}
        <div className="absolute inset-0 pointer-events-none">
          {isFramingSaved ? (
            <>
              {/* Saved state - show confirmation and options */}
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                ✓ Framing saved
              </div>
              <div className="absolute bottom-2 right-2 flex gap-2 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    resetPosition()
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs px-3 py-2 rounded transition-colors shadow-lg"
                >
                  Reset
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    resetFraming()
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-2 rounded transition-colors shadow-lg"
                >
                  Adjust More
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Default state - show drag instruction */}
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                <Move className="h-3 w-3" />
                Click & drag to adjust
              </div>
              
              {/* Save button - only show if position has changed */}
              {yPosition !== 0 && (
                <div className="absolute bottom-2 right-2 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      saveFraming()
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-2 rounded transition-colors shadow-lg"
                  >
                    Save Framing
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info display */}
      <div className="mt-2 text-xs text-muted-foreground-500">
        <div>Preview: {dimensions.width} × {dimensions.height}</div>
        <div className="text-primary-600">
          Y Position: {yPosition.toFixed(0)}px {yPosition !== 0 && `(${yPosition > 0 ? 'down' : 'up'})`}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 p-2 bg-primary-50 rounded text-xs text-primary-700">
        <strong>💡 Tip:</strong> Hover over the image to see the drag option, then drag to adjust framing. Click "Save Framing" when ready.
      </div>
    </div>
  )
}
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Move } from 'lucide-react'

interface DraggableImagePreviewProps {
  imageUrl: string
  aspectRatio: string
  resolution: string
  onPositionChange?: (yPosition: number) => void
  className?: string
}

export default function DraggableImagePreview({
  imageUrl,
  aspectRatio,
  resolution,
  onPositionChange,
  className = ''
}: DraggableImagePreviewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [yPosition, setYPosition] = useState(0)
  const [dragStart, setDragStart] = useState({ y: 0, initialPosition: 0 })
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

    const containerHeight = containerRef.current.clientHeight
    const containerWidth = containerRef.current.clientWidth
    
    // Get the actual image dimensions after it's loaded
    const img = imageRef.current
    if (!img.naturalWidth || !img.naturalHeight) return
    
    // Calculate how the image is displayed within the container
    const imageAspectRatio = img.naturalWidth / img.naturalHeight
    const containerAspectRatio = containerWidth / containerHeight
    
    let displayedImageHeight: number
    let displayedImageWidth: number
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - image fills width, height is constrained
      displayedImageWidth = containerWidth
      displayedImageHeight = containerWidth / imageAspectRatio
    } else {
      // Image is taller than container - image fills height, width is constrained
      displayedImageHeight = containerHeight
      displayedImageWidth = containerHeight * imageAspectRatio
    }
    
    const deltaY = e.clientY - dragStart.y
    const newPosition = dragStart.initialPosition + deltaY

    // Calculate the maximum range to ensure entire image height is reachable
    // When image is taller than container, allow full range of image movement
    if (displayedImageHeight > containerHeight) {
      const maxPosition = 0 // Can't move above the top of the container
      const minPosition = containerHeight - displayedImageHeight // Can move down to show bottom of image
      const constrainedPosition = Math.max(minPosition, Math.min(maxPosition, newPosition))
      
      setYPosition(constrainedPosition)
      onPositionChange?.(constrainedPosition)
    } else {
      // When image is shorter than container, allow some movement for fine-tuning
      const maxPosition = (containerHeight - displayedImageHeight) / 2 // Center position
      const minPosition = -(containerHeight - displayedImageHeight) / 2 // Opposite center
      const constrainedPosition = Math.max(minPosition, Math.min(maxPosition, newPosition))
      
      setYPosition(constrainedPosition)
      onPositionChange?.(constrainedPosition)
    }
  }, [isDragging, dragStart, onPositionChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetPosition = useCallback(() => {
    setYPosition(0)
    onPositionChange?.(0)
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
        className="w-full bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all duration-300 relative"
        style={{ 
          aspectRatio: convertAspectRatio(aspectRatio),
          maxWidth: '100%'
        }}
      >
        {/* Draggable Image */}
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing transition-transform duration-100"
          style={{
            transform: `translateY(${yPosition}px)`,
            transformOrigin: 'center'
          }}
          onMouseDown={handleMouseDown}
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
              width: '100%'
            }}
          />
        </div>

        {/* Overlay indicators */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Center line indicator */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 opacity-50 transform -translate-y-1/2" />
          
          {/* Top and bottom boundary indicators (only show when image is taller than container) */}
          {(() => {
            const containerHeight = containerRef.current?.clientHeight || 0
            const containerWidth = containerRef.current?.clientWidth || 0
            const img = imageRef.current
            
            if (img && img.naturalWidth && img.naturalHeight && containerHeight > 0) {
              const imageAspectRatio = img.naturalWidth / img.naturalHeight
              const containerAspectRatio = containerWidth / containerHeight
              
              if (imageAspectRatio <= containerAspectRatio) {
                // Image is taller than container - show boundary indicators
                return (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-400 opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400 opacity-60" />
                  </>
                )
              }
            }
            return null
          })()}
          
          {/* Drag handle indicator */}
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Move className="h-3 w-3" />
            Drag to adjust
          </div>
          
          {/* Position indicator */}
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            {aspectRatio}
          </div>
        </div>

        {/* Reset button */}
        {yPosition !== 0 && (
          <button
            onClick={resetPosition}
            className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
          >
            Reset Position
          </button>
        )}
      </div>

      {/* Info display */}
      <div className="mt-2 text-xs text-gray-500">
        <div>Preview: {dimensions.width} × {dimensions.height}</div>
        <div className="text-blue-600">
          Y Position: {yPosition.toFixed(0)}px {yPosition !== 0 && `(${yPosition > 0 ? 'down' : 'up'})`}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
        <strong>💡 Tip:</strong> Drag the image up or down to adjust the framing. You can reach the entire height of the image - drag to show the top or bottom of the original image within the preview frame. This determines which part will be used as the reference frame for video generation.
      </div>
    </div>
  )
}

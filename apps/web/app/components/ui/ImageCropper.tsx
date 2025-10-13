'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedImageUrl: string, position: { x: number; y: number; scale: number }) => void
  imageUrl: string
  aspectRatio?: number // Width/Height ratio
}

export function ImageCropper({ 
  isOpen, 
  onClose, 
  onCrop, 
  imageUrl, 
  aspectRatio = 16/9 
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 50, y: 50 })
    }
  }, [isOpen])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    // Convert mouse movement to percentage
    const containerRect = e.currentTarget.getBoundingClientRect()
    const deltaXPercent = (deltaX / containerRect.width) * 100
    const deltaYPercent = (deltaY / containerRect.height) * 100

    setPosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x + deltaXPercent)),
      y: Math.max(0, Math.min(100, prev.y + deltaYPercent))
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.1))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 50, y: 50 })
  }

  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    if (!ctx || !img) return

    // Set canvas size to desired aspect ratio
    const canvasWidth = 800
    const canvasHeight = canvasWidth / aspectRatio
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Calculate crop area
    const imgWidth = img.width * scale
    const imgHeight = img.height * scale
    
    // Position the image based on the position percentage
    const offsetX = (imgWidth - canvasWidth) * (position.x / 100)
    const offsetY = (imgHeight - canvasHeight) * (position.y / 100)

    // Draw the cropped image
    ctx.drawImage(
      img,
      -offsetX, -offsetY,
      imgWidth, imgHeight
    )

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        onCrop(croppedUrl, { x: position.x, y: position.y, scale })
      }
    }, 'image/jpeg', 0.9)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Adjust Header Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image Container */}
          <div 
            className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Header preview"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: `scale(${scale}) translate(${(position.x - 50) * 2}%, ${(position.y - 50) * 2}%)`,
                transformOrigin: 'center center'
              }}
              draggable={false}
            />
            
            {/* Crop Overlay */}
            <div className="absolute inset-0 border-2 border-white shadow-lg rounded-lg pointer-events-none">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Scale Slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Zoom</label>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  value={[scale]}
                  onValueChange={(value) => setScale(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Position Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Horizontal Position</label>
                <Slider
                  value={[position.x]}
                  onValueChange={(value) => setPosition(prev => ({ ...prev, x: value[0] }))}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vertical Position</label>
                <Slider
                  value={[position.y]}
                  onValueChange={(value) => setPosition(prev => ({ ...prev, y: value[0] }))}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Move className="h-4 w-4" />
              <span>Click and drag the image to reposition it</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCrop}>
              Apply Changes
            </Button>
          </div>
        </DialogFooter>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}

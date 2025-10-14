'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Move, ZoomIn, ZoomOut, RotateCcw, Save, X, Settings, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ImageManipulatorProps {
  imageUrl: string
  originalAspectRatio: string // e.g., "1:1"
  targetAspectRatio: string // e.g., "16:9"
  onSave: (croppedImageUrl: string, newDimensions: { width: number; height: number }) => void
  onCancel: () => void
  isOpen: boolean
}

interface TransformState {
  scale: number
  translateX: number
  translateY: number
  rotation: number
}

export default function ImageManipulator({
  imageUrl,
  originalAspectRatio,
  targetAspectRatio,
  onSave,
  onCancel,
  isOpen
}: ImageManipulatorProps) {
  console.log('ImageManipulator rendered', { imageUrl, originalAspectRatio, targetAspectRatio, isOpen })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentAspectRatio, setCurrentAspectRatio] = useState(targetAspectRatio)

  // Calculate aspect ratios
  const getAspectRatioValue = (ratio: string) => {
    const [width, height] = ratio.split(':').map(Number)
    return width / height
  }

  const originalRatio = getAspectRatioValue(originalAspectRatio)
  const currentRatio = getAspectRatioValue(currentAspectRatio)
  const needsManipulation = Math.abs(originalRatio - currentRatio) > 0.01

  // Calculate container dimensions
  const containerWidth = 600
  const containerHeight = containerWidth / currentRatio

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Mouse down detected', { needsManipulation, isDragging })
    setIsDragging(true)
    setDragStart({
      x: e.clientX - transform.translateX,
      y: e.clientY - transform.translateY
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    console.log('Mouse move detected', { clientX: e.clientX, clientY: e.clientY, dragStart })
    
    setTransform(prev => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Touch start detected', { needsManipulation, isDragging })
    
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - transform.translateX,
      y: touch.clientY - transform.translateY
    })
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    console.log('Touch move detected', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, dragStart })
    
    const touch = e.touches[0]
    setTransform(prev => ({
      ...prev,
      translateX: touch.clientX - dragStart.x,
      translateY: touch.clientY - dragStart.y
    }))
  }, [isDragging, dragStart])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: false })
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Handle wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    if (isDragging) return
    e.preventDefault()
    e.stopPropagation()
    console.log('Wheel event detected', { deltaY: e.deltaY })
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta))
    }))
  }

  // Reset transform
  const resetTransform = () => {
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0
    })
  }

  // Handle aspect ratio change
  const handleAspectRatioChange = (newRatio: string) => {
    setCurrentAspectRatio(newRatio)
    // Reset transform when aspect ratio changes
    resetTransform()
  }

  // Fit image to container
  const fitImageToContainer = () => {
    if (!imageRef.current) return

    const imageWidth = imageRef.current.naturalWidth
    const imageHeight = imageRef.current.naturalHeight
    const imageAspectRatio = imageWidth / imageHeight
    const containerAspectRatio = currentRatio

    // Calculate actual container dimensions (constrained to 400px max)
    const actualContainerWidth = Math.min(containerWidth, 400)
    const actualContainerHeight = Math.min(containerHeight, 400)

    // Calculate the scale needed to make the image fill the container
    // Since the image uses object-contain, we need to calculate the scale that would make it fill
    let optimalScale: number
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - scale to fill height (crop width)
      optimalScale = actualContainerHeight / imageHeight
    } else {
      // Image is taller than container - scale to fill width (crop height)
      optimalScale = actualContainerWidth / imageWidth
    }

    // The image is already scaled by object-contain, so we need to adjust the transform scale
    // to achieve the desired fill effect
    const baseScale = Math.min(actualContainerWidth / imageWidth, actualContainerHeight / imageHeight)
    const fillScale = optimalScale / baseScale

    setTransform({
      scale: fillScale,
      translateX: 0,
      translateY: 0,
      rotation: 0
    })
  }

  // Process and save the cropped image
  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return

    setIsProcessing(true)
    
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      // Set canvas size to current aspect ratio
      const targetWidth = 1024
      const targetHeight = Math.round(targetWidth / currentRatio)
      canvas.width = targetWidth
      canvas.height = targetHeight

      // Clear canvas
      ctx.clearRect(0, 0, targetWidth, targetHeight)

      // Calculate image dimensions and position
      const imageWidth = imageRef.current.naturalWidth
      const imageHeight = imageRef.current.naturalHeight
      
      // Calculate how the image should be scaled and positioned
      const imageAspectRatio = imageWidth / imageHeight
      const containerAspectRatio = currentRatio
      
      let drawWidth, drawHeight, drawX, drawY
      
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container - fit height
        drawHeight = targetHeight
        drawWidth = drawHeight * imageAspectRatio
        drawX = (targetWidth - drawWidth) / 2
        drawY = 0
      } else {
        // Image is taller than container - fit width
        drawWidth = targetWidth
        drawHeight = drawWidth / imageAspectRatio
        drawX = 0
        drawY = (targetHeight - drawHeight) / 2
      }

      // Apply user transformations
      const scaledWidth = drawWidth * transform.scale
      const scaledHeight = drawHeight * transform.scale
      const offsetX = drawX + transform.translateX * (targetWidth / containerWidth)
      const offsetY = drawY + transform.translateY * (targetHeight / containerHeight)

      // Draw the image
      ctx.save()
      ctx.translate(targetWidth / 2, targetHeight / 2)
      ctx.rotate((transform.rotation * Math.PI) / 180)
      ctx.translate(-targetWidth / 2, -targetHeight / 2)
      
      ctx.drawImage(
        imageRef.current,
        offsetX - (scaledWidth - drawWidth) / 2,
        offsetY - (scaledHeight - drawHeight) / 2,
        scaledWidth,
        scaledHeight
      )
      
      ctx.restore()

      // Convert to data URL first to avoid CORS issues
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      onSave(dataUrl, { width: targetWidth, height: targetHeight })
      
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) {
    console.log('ImageManipulator not open, returning null')
    return null
  }

  console.log('ImageManipulator rendering modal', { needsManipulation })
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-semibold">Adjust Image</CardTitle>
            <div className="text-sm text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg">
              <span className="font-medium">Image Manipulation Mode:</span> Your image is {originalAspectRatio} but the preview is {currentAspectRatio}. You can zoom, move, and rotate the image to get the perfect crop.
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {needsManipulation ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(90vh-120px)]">
              {/* Left Column - Controls */}
              <div className="p-6 space-y-6 overflow-y-auto">

                {/* Aspect Ratio Selector */}
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio" className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Crop Aspect Ratio
                  </Label>
                  <Select value={currentAspectRatio} onValueChange={handleAspectRatioChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                      <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                      <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                      <SelectItem value="2:3">2:3 (Portrait Photo)</SelectItem>
                      <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  {/* Zoom Control */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Zoom: {Math.round(transform.scale * 100)}%
                    </label>
                    <Slider
                      value={[transform.scale]}
                      onValueChange={(values) => setTransform(prev => ({ ...prev, scale: Array.isArray(values) ? values[0] : values }))}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation Control */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Rotation: {transform.rotation}°
                    </label>
                    <Slider
                      value={[transform.rotation]}
                      onValueChange={(values) => setTransform(prev => ({ ...prev, rotation: Array.isArray(values) ? values[0] : values }))}
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={fitImageToContainer}
                    className="w-full"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fit to Container
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetTransform}
                    className="w-full"
                  >
                    <Move className="h-4 w-4 mr-2" />
                    Reset Position
                  </Button>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Cropped Image
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Column - Image Preview */}
              <div className="p-6 flex items-center justify-center bg-muted">
                <div className="relative bg-muted border-2 border-dashed border-border rounded-lg overflow-hidden">
                  <div
                    className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
                    style={{
                      width: Math.min(containerWidth, 400),
                      height: Math.min(containerHeight, 400),
                      margin: '0 auto',
                      aspectRatio: currentAspectRatio.replace(':', '/'),
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onWheel={handleWheel}
                  >
                    {/* Target aspect ratio frame */}
                    <div className="absolute inset-0 border-2 border-primary bg-primary/20 pointer-events-none" />
                    
                    {/* Image */}
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt="Image to manipulate"
                      className="absolute inset-0 w-full h-full object-contain"
                      crossOrigin="anonymous"
                      style={{
                        transform: `scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px) rotate(${transform.rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        pointerEvents: 'none'
                      }}
                      draggable={false}
                    />
                    
                    {/* Overlay instructions */}
                    <div className="absolute top-2 left-2 bg-backdrop text-foreground text-xs px-2 py-1 rounded pointer-events-none">
                      {isDragging ? 'Dragging...' : 'Drag to move • Scroll to zoom • Touch to drag on mobile'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No manipulation needed - the image already matches the {targetAspectRatio} aspect ratio.
              </p>
              <Button onClick={onCancel}>
                Close
              </Button>
            </div>
          )}
          
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>
    </div>
  )
}

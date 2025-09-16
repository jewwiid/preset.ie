'use client'

import { useState, useEffect } from 'react'
import { Wand2, Download, Heart, Settings, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { downloadImageWithWatermark } from '../../../lib/watermark-utils'

interface DynamicPreviewAreaProps {
  aspectRatio: string
  resolution: string
  images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
    type?: string
  }>
  selectedImage: string | null
  onSelectImage: (url: string | null) => void
  onSaveToGallery: (url: string) => Promise<void>
  savingImage: string | null
  loading?: boolean
  subscriptionTier?: 'free' | 'plus' | 'pro'
}

export default function DynamicPreviewArea({
  aspectRatio,
  resolution,
  images,
  selectedImage,
  onSelectImage,
  onSaveToGallery,
  savingImage,
  loading = false,
  subscriptionTier = 'free'
}: DynamicPreviewAreaProps) {
  const [previewAspectRatio, setPreviewAspectRatio] = useState('1/1')
  const [displayAspectRatio, setDisplayAspectRatio] = useState('1:1')
  const { showSuccess, showError } = useToast()

  const handleSaveToGallery = async (imageUrl: string) => {
    try {
      await onSaveToGallery(imageUrl)
      showSuccess(
        'Image Saved! 💖',
        'Your image has been saved to your gallery. You can find it in the "Saved Images" section below and use it later in moodboards, showcases, or as profile images.',
        {
          label: 'View Gallery',
          onClick: () => {
            // Scroll to the saved images gallery
            const galleryElement = document.querySelector('[data-saved-gallery]')
            if (galleryElement) {
              galleryElement.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      )
    } catch (error) {
      showError(
        'Save Failed',
        'There was an error saving your image. Please try again.',
        {
          label: 'Retry',
          onClick: () => handleSaveToGallery(imageUrl)
        }
      )
    }
  }

  // Convert aspect ratio from "1:1" format to "1/1" format for CSS
  const convertAspectRatio = (ratio: string) => {
    return ratio.replace(':', '/')
  }

  // Handle aspect ratio change
  const handleAspectRatioChange = (newRatio: string) => {
    setDisplayAspectRatio(newRatio)
    setPreviewAspectRatio(convertAspectRatio(newRatio))
  }

  useEffect(() => {
    // Calculate the aspect ratio for the preview area
    const safeAspectRatio = aspectRatio || '1:1'
    const [widthRatio, heightRatio] = safeAspectRatio.split(':').map(Number)
    const aspectRatioValue = widthRatio / heightRatio
    setPreviewAspectRatio(`${aspectRatioValue}`)
  }, [aspectRatio])

  const calculateDimensions = (aspectRatio: string, baseResolution: string) => {
    // Default to 1:1 if aspectRatio is undefined or invalid
    const safeAspectRatio = aspectRatio || '1:1'
    const [widthRatio, heightRatio] = safeAspectRatio.split(':').map(Number)
    const baseSize = parseInt(baseResolution)
    
    const aspectRatioValue = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (aspectRatioValue >= 1) {
      width = baseSize
      height = Math.round(baseSize / aspectRatioValue)
    } else {
      height = baseSize
      width = Math.round(baseSize * aspectRatioValue)
    }
    
    return { width, height }
  }

  const dimensions = calculateDimensions(aspectRatio, resolution)

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Load watermark SVG from brandkit
          const watermarkSvg = await fetch('/brandkit-watermark.svg').then(res => res.text()).catch(() => '')
      
      const isPaidUser = subscriptionTier === 'plus' || subscriptionTier === 'pro'
      
      await downloadImageWithWatermark(
        imageUrl,
        filename,
        isPaidUser,
        watermarkSvg
      )
      
      showSuccess(
        'Download Complete! 📥',
        isPaidUser 
          ? 'Image downloaded successfully!' 
          : 'Image downloaded with watermark (upgrade to remove watermark)'
      )
    } catch (error) {
      console.error('Error downloading image:', error)
      showError(
        'Download Failed',
        'There was an error downloading the image. Please try again.'
      )
    }
  }

  const handleDownloadVideo = async (videoUrl: string, filename: string) => {
    try {
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error('Failed to fetch video')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showSuccess(
        'Download Complete! 📥',
        'Video downloaded successfully!'
      )
    } catch (error) {
      console.error('Error downloading video:', error)
      showError(
        'Download Failed',
        'There was an error downloading the video. Please try again.'
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            {images.length > 0 
              ? 'Preview area will appear here when images are generated'
              : 'Preview area will appear here when images are generated'
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <div className="space-y-4">
            {/* Dynamic Preview Container */}
            {images.length === 1 ? (
              // Single image - full size
              <div 
                className="relative w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all duration-300"
                style={{ 
                  aspectRatio: previewAspectRatio,
                  minHeight: '300px',
                  maxHeight: '500px'
                }}
              >
                <div
                  className={`absolute inset-0 cursor-pointer transition-all duration-200 ${
                    selectedImage === images[0].url 
                      ? 'ring-2 ring-purple-500 ring-offset-2' 
                      : 'hover:ring-1 hover:ring-gray-400'
                  }`}
                  onClick={() => onSelectImage(images[0].url)}
                >
                  {images[0].type === 'video' ? (
                    <video
                      src={images[0].url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      poster={images[0].url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={images[0].url}
                      alt="Generated image"
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Action buttons - always visible */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveToGallery(images[0].url)
                      }}
                      disabled={savingImage === images[0].url}
                      title="Save to Gallery"
                    >
                      {savingImage === images[0].url ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (images[0].type === 'video') {
                          handleDownloadVideo(images[0].url, `generated-video.mp4`)
                        } else {
                          handleDownloadImage(images[0].url, `generated-image.png`)
                        }
                      }}
                      title={images[0].type === 'video' ? "Download Video" : "Download Image"}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {selectedImage === images[0].url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 text-white shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectImage(null)
                        }}
                        title="Deselect Image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {selectedImage === images[0].url && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="default" className="bg-green-500">Selected</Badge>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Multiple images - grid layout
              <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                      selectedImage === image.url 
                        ? 'ring-2 ring-purple-500 ring-offset-2' 
                        : 'hover:ring-1 hover:ring-gray-400'
                    }`}
                    style={{ 
                      aspectRatio: previewAspectRatio,
                      minHeight: '200px'
                    }}
                    onClick={() => onSelectImage(image.url)}
                  >
                    {image.type === 'video' ? (
                      <video
                        src={image.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster={image.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={image.url}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Image number badge */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    
                    {/* Action buttons - always visible */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveToGallery(image.url)
                        }}
                        disabled={savingImage === image.url}
                        title="Save to Gallery"
                      >
                        {savingImage === image.url ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (image.type === 'video') {
                            handleDownloadVideo(image.url, `generated-video-${index + 1}.mp4`)
                          } else {
                            handleDownloadImage(image.url, `generated-image-${index + 1}.png`)
                          }
                        }}
                        title={image.type === 'video' ? "Download Video" : "Download Image"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {selectedImage === image.url && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 text-white shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectImage(null)
                          }}
                          title="Deselect Image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {selectedImage === image.url && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="default" className="bg-green-500">Selected</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Controls and Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <span>Dimensions: {dimensions.width} × {dimensions.height}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span>{images.length} image{images.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="previewAspectRatio" className="text-sm font-medium text-gray-700">
                  <Settings className="h-4 w-4 inline mr-1" />
                  Aspect Ratio:
                </Label>
                <Select value={displayAspectRatio} onValueChange={handleAspectRatioChange}>
                  <SelectTrigger className="w-36">
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
            </div>
          </div>
        ) : (
          <div 
            className="relative w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center transition-all duration-300"
            style={{ 
              aspectRatio: previewAspectRatio,
              minHeight: '300px',
              maxHeight: '500px'
            }}
          >
            {loading ? (
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="font-medium">Generating your image...</p>
                <p className="text-sm">This usually takes 5-30 seconds</p>
                <div className="mt-2 text-xs text-gray-400">
                  Preview area: {aspectRatio} ({dimensions.width} × {dimensions.height})
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No images generated yet</p>
                <p className="text-sm">Create your first image!</p>
                <div className="mt-2 text-xs text-gray-400">
                  Preview area: {aspectRatio} ({dimensions.width} × {dimensions.height})
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

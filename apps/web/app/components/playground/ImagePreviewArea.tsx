'use client'

import { useState, useEffect } from 'react'
import { Download, Heart, Settings, Maximize2, X, Trash2, Crop } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { downloadImageWithWatermark } from '../../../lib/watermark-utils'
import ImageManipulator from './ImageManipulator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ImagePreviewAreaProps {
  title?: string
  description?: string
  aspectRatio?: string
  resolution?: string
  images: Array<{
    url: string
    width: number
    height: number
    generated_at?: string
    type?: string
  }>
  selectedImage: string | null
  onSelectImage: (url: string | null) => void
  onSaveToGallery: (url: string, overrideExisting?: boolean) => Promise<void>
  onRemoveImage?: (url: string) => void
  savingImage: string | null
  loading?: boolean
  showSaveButton?: boolean
  showDownloadButton?: boolean
  showRemoveButton?: boolean
  showDimensions?: boolean
  emptyStateMessage?: string
  subscriptionTier?: 'free' | 'plus' | 'pro'
  // Video generation props
  videoGenerationStatus?: 'idle' | 'generating' | 'completed'
  generatedVideoUrl?: string | null
}

export default function ImagePreviewArea({
  title = "Generated Content",
  description,
  aspectRatio = "1:1",
  resolution = "1024",
  images,
  selectedImage,
  onSelectImage,
  onSaveToGallery,
  onRemoveImage,
  savingImage,
  loading = false,
  showSaveButton = true,
  showDownloadButton = true,
  showRemoveButton = false,
  showDimensions = true,
  emptyStateMessage = "Preview area will appear here when images are generated",
  subscriptionTier = 'free',
  videoGenerationStatus = 'idle',
  generatedVideoUrl = null
}: ImagePreviewAreaProps) {
  const [previewAspectRatio, setPreviewAspectRatio] = useState('1/1')
  const [displayAspectRatio, setDisplayAspectRatio] = useState('1:1')
  const [fullScreenImage, setFullScreenImage] = useState<{
    url: string
    title?: string
    index: number
  } | null>(null)
  const [imageToRemove, setImageToRemove] = useState<string | null>(null)
  const [imageManipulator, setImageManipulator] = useState<{
    isOpen: boolean
    imageUrl: string
    originalAspectRatio: string
    targetAspectRatio: string
  } | null>(null)
  const { showSuccess, showError } = useToast()

  const handleSaveToGallery = async (imageUrl: string, overrideExisting = false) => {
    console.log('🎯 ImagePreviewArea handleSaveToGallery called:', { imageUrl, overrideExisting })
    
    // Prevent multiple simultaneous calls
    if (savingImage === imageUrl) {
      console.log('⚠️ Save already in progress for this URL, skipping...')
      return
    }
    
    try {
      console.log('🔄 Calling onSaveToGallery...')
      await onSaveToGallery(imageUrl, overrideExisting)
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
    } catch (error: any) {
      // Handle duplicate detection
      if (error?.error === 'duplicate') {
        showError(
          'Image Already Saved',
          `This image is already in your gallery as "${error.existingImage?.title}". Would you like to update it with new details?`,
          {
            label: 'Update Existing',
            onClick: () => handleSaveToGallery(imageUrl, true)
          }
        )
      } else {
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
  }

  const handleRemoveImage = (imageUrl: string) => {
    setImageToRemove(imageUrl)
  }

  const confirmRemoveImage = () => {
    if (imageToRemove && onRemoveImage) {
      onRemoveImage(imageToRemove)
      setImageToRemove(null)
      
      // If the removed image was selected, clear selection
      if (selectedImage === imageToRemove) {
        onSelectImage('')
      }
    }
  }

  // Check if aspect ratios differ and manipulation is needed
  const needsManipulation = (originalRatio: string, targetRatio: string) => {
    const getAspectRatioValue = (ratio: string) => {
      const [width, height] = ratio.split(':').map(Number)
      return width / height
    }
    const originalValue = getAspectRatioValue(originalRatio)
    const targetValue = getAspectRatioValue(targetRatio)
    return Math.abs(originalValue - targetValue) > 0.01
  }

  // Open image manipulator
  const openImageManipulator = (imageUrl: string) => {
    console.log('openImageManipulator called', { imageUrl, selectedImage, aspectRatio, displayAspectRatio })
    if (!selectedImage) {
      console.log('No selectedImage, returning')
      return
    }
    
    const manipulatorData = {
      isOpen: true,
      imageUrl: selectedImage,
      originalAspectRatio: aspectRatio || '1:1',
      targetAspectRatio: displayAspectRatio
    }
    console.log('Setting imageManipulator state', manipulatorData)
    setImageManipulator(manipulatorData)
  }

  // Handle cropped image save
  const handleCroppedImageSave = async (croppedImageUrl: string, newDimensions: { width: number; height: number }) => {
    try {
      // Save the cropped image to gallery
      await onSaveToGallery(croppedImageUrl, false)
      
      // Clean up the blob URL
      URL.revokeObjectURL(croppedImageUrl)
      
      showSuccess(
        'Cropped Image Saved! ✂️',
        `Your image has been cropped to ${displayAspectRatio} (${newDimensions.width} × ${newDimensions.height}) and saved to your gallery.`,
        {
          label: 'View Gallery',
          onClick: () => {
            const galleryElement = document.querySelector('[data-saved-gallery]')
            if (galleryElement) {
              galleryElement.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      )
      
      setImageManipulator(null)
    } catch (error: any) {
      console.error('Error saving cropped image:', error)
      showError(
        'Save Failed',
        'There was an error saving the cropped image. Please try again.'
      )
    }
  }

  const isImageSaved = (imageUrl: string) => {
    // Check if this image is from a saved source (has type: 'saved')
    return images.some(img => img.url === imageUrl && img.type === 'saved')
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
    // Initialize with the original aspect ratio
    const safeAspectRatio = aspectRatio || '1:1'
    setDisplayAspectRatio(safeAspectRatio)
    setPreviewAspectRatio(convertAspectRatio(safeAspectRatio))
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description || emptyStateMessage}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <div className="space-y-4">
            {/* Selected Image - Large Display (TOP) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                {videoGenerationStatus === 'generating' ? 'Video Generation Started!' : 
                 videoGenerationStatus === 'completed' ? 'Generated Video' : 'Selected Image'}
              </h4>
              
              {/* Video Generation Status Display */}
              {videoGenerationStatus === 'generating' ? (
                <div 
                  className="relative w-full bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg overflow-hidden transition-all duration-300 flex items-center justify-center"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    maxWidth: '100%',
                    minHeight: '300px'
                  }}
                >
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-purple-700">Video Generation Started!</h3>
                      <p className="text-sm text-purple-600">Creating your video from the selected image...</p>
                      <p className="text-xs text-gray-500">This may take a few minutes</p>
                    </div>
                  </div>
                </div>
              ) : videoGenerationStatus === 'completed' && generatedVideoUrl ? (
                <div 
                  className="relative w-full bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all duration-300"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    maxWidth: '100%'
                  }}
                >
                  <div className="absolute inset-0">
                    {generatedVideoUrl === 'pending' || !generatedVideoUrl.startsWith('http') ? (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <div className="text-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-600">Video processing...</p>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={generatedVideoUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster={generatedVideoUrl.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                        onError={(e) => {
                          console.error('Video load error:', e);
                          console.error('Video URL:', generatedVideoUrl);
                          console.error('Video element:', e.target);
                          const videoElement = e.target as HTMLVideoElement;
                          console.error('Video error details:', videoElement?.error);
                        }}
                        onLoadStart={() => {
                          console.log('Video loading started:', generatedVideoUrl);
                        }}
                        onCanPlay={() => {
                          console.log('Video can play:', generatedVideoUrl);
                        }}
                        onLoadedMetadata={() => {
                          console.log('Video metadata loaded:', generatedVideoUrl);
                        }}
                      >
                        <source src={generatedVideoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    
                    {/* Action buttons for generated video */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                        onClick={() => {
                          setFullScreenImage({
                            url: generatedVideoUrl,
                            title: 'Generated Video',
                            index: -1
                          })
                        }}
                        title="View Full Size"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      {showSaveButton && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                          onClick={() => {
                            console.log('🎯 Save button clicked for generated video:', generatedVideoUrl)
                            handleSaveToGallery(generatedVideoUrl)
                          }}
                          disabled={savingImage === generatedVideoUrl}
                          title="Save to Gallery"
                        >
                          {savingImage === generatedVideoUrl ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {showDownloadButton && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                          onClick={() => handleDownloadVideo(generatedVideoUrl, 'generated-video.mp4')}
                          title="Download Video"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedImage ? (
                <div 
                  className="relative w-full bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden transition-all duration-300"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    maxWidth: '100%'
                  }}
                >
                  <div className="absolute inset-0">
                    {(() => {
                      const selectedImageData = images.find(img => img.url === selectedImage)
                      return selectedImageData?.type === 'video' ? (
                        <video
                          src={selectedImage}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                          poster={selectedImage.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={selectedImage}
                          alt="Selected image"
                          className="w-full h-full object-cover"
                        />
                      )
                    })()}
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                        onClick={() => {
                          const imageIndex = images.findIndex(img => img.url === selectedImage)
                          setFullScreenImage({
                            url: selectedImage,
                            title: `Generated Image ${imageIndex + 1}`,
                            index: imageIndex
                          })
                        }}
                        title="View Full Size"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      {/* Crop button - only show if aspect ratios differ */}
                      {(() => {
                        const needsManip = needsManipulation(aspectRatio || '1:1', displayAspectRatio)
                        console.log('Crop button check', { 
                          aspectRatio: aspectRatio || '1:1', 
                          displayAspectRatio, 
                          needsManip,
                          selectedImage 
                        })
                        return needsManip
                      })() && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                          onClick={() => {
                            console.log('Crop button clicked')
                            openImageManipulator(selectedImage)
                          }}
                          title="Crop & Adjust Image"
                        >
                          <Crop className="h-4 w-4" />
                        </Button>
                      )}
                      {showSaveButton && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                          onClick={() => {
                            console.log('🎯 Save button clicked for selected image:', selectedImage)
                            handleSaveToGallery(selectedImage)
                          }}
                          disabled={savingImage === selectedImage}
                          title="Save to Gallery"
                        >
                          {savingImage === selectedImage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {showDownloadButton && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                          onClick={() => {
                            const selectedImageData = images.find(img => img.url === selectedImage)
                            if (selectedImageData?.type === 'video') {
                              handleDownloadVideo(selectedImage, `generated-video-${Date.now()}.mp4`)
                            } else {
                              handleDownloadImage(selectedImage, `generated-image-${Date.now()}.png`)
                            }
                          }}
                          title={(() => {
                            const selectedImageData = images.find(img => img.url === selectedImage)
                            return selectedImageData?.type === 'video' ? "Download Video" : "Download Image"
                          })()}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500 text-white shadow-md"
                        onClick={() => onSelectImage(null)}
                        title="Deselect Image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Selection indicator */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="default" className="bg-green-500">Selected</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    maxWidth: '100%'
                  }}
                >
                  <div className="text-center text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                      <Settings className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm">Click an image below to view it here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Row - All Images (BOTTOM) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">All Images</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 bg-gray-100 ${
                      selectedImage === image.url 
                        ? 'border-purple-500 ring-2 ring-purple-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      aspectRatio: previewAspectRatio,
                      width: '80px',
                      height: '80px'
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
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                      {index + 1}
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedImage === image.url && (
                      <div className="absolute bottom-1 left-1">
                        <Badge variant="default" className="bg-green-500 text-[10px] px-1 py-0.5">✓</Badge>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    {showRemoveButton && onRemoveImage && (
                      <div className="absolute top-1 right-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-5 w-5 p-0 bg-red-500 hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveImage(image.url)
                          }}
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls and Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {showDimensions && (
                  <>
                    <span>Dimensions: {dimensions.width} × {dimensions.height}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span>{images.length} image{images.length > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg"
            style={{ 
              aspectRatio: previewAspectRatio,
              maxWidth: '100%'
            }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium mb-2">{emptyStateMessage}</p>
              {loading && (
                <div className="flex items-center justify-center mt-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  <span className="ml-2 text-sm">Generating...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Media */}
            {(() => {
              const imageData = images.find(img => img.url === fullScreenImage.url);
              return imageData?.type === 'video';
            })() ? (
              <video
                src={fullScreenImage.url}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                preload="metadata"
                poster={fullScreenImage.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={fullScreenImage.url}
                alt={fullScreenImage.title}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Image info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{fullScreenImage.title}</h3>
                  <p className="text-sm text-gray-300">Image {fullScreenImage.index + 1} of {images.length}</p>
                </div>
                <div className="flex gap-2">
                  {showSaveButton && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSaveToGallery(fullScreenImage.url)}
                      disabled={savingImage === fullScreenImage.url}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      {savingImage === fullScreenImage.url ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {showDownloadButton && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const imageData = images.find(img => img.url === fullScreenImage.url);
                        if (imageData?.type === 'video') {
                          handleDownloadVideo(fullScreenImage.url, `generated-video-${fullScreenImage.index + 1}.mp4`)
                        } else {
                          handleDownloadImage(fullScreenImage.url, `generated-image-${fullScreenImage.index + 1}.png`)
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      title={(() => {
                        const imageData = images.find(img => img.url === fullScreenImage.url);
                        return imageData?.type === 'video' ? "Download Video" : "Download Image";
                      })()}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSelectImage(fullScreenImage.url)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Select This Image
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation arrows for multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const prevIndex = fullScreenImage.index > 0 ? fullScreenImage.index - 1 : images.length - 1
                    setFullScreenImage({
                      url: images[prevIndex].url,
                      title: `Generated Image ${prevIndex + 1}`,
                      index: prevIndex
                    })
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const nextIndex = fullScreenImage.index < images.length - 1 ? fullScreenImage.index + 1 : 0
                    setFullScreenImage({
                      url: images[nextIndex].url,
                      title: `Generated Image ${nextIndex + 1}`,
                      index: nextIndex
                    })
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Remove Image Confirmation Dialog */}
      <AlertDialog open={!!imageToRemove} onOpenChange={() => setImageToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Image</AlertDialogTitle>
            <AlertDialogDescription>
              {isImageSaved(imageToRemove || '') ? (
                <>
                  This image is saved in your gallery. Removing it will only remove it from this preview area, 
                  but it will remain in your saved images gallery.
                </>
              ) : (
                <>
                  Are you sure you want to remove this image? This action cannot be undone and the image 
                  will be removed from this preview area.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveImage}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Manipulator Modal */}
      {imageManipulator && (
        <ImageManipulator
          imageUrl={imageManipulator.imageUrl}
          originalAspectRatio={imageManipulator.originalAspectRatio}
          targetAspectRatio={imageManipulator.targetAspectRatio}
          onSave={handleCroppedImageSave}
          onCancel={() => setImageManipulator(null)}
          isOpen={imageManipulator.isOpen}
        />
      )}
    </Card>
  )
}

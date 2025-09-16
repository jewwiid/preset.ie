'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Download, Trash2, Info, ChevronDown, ChevronUp, Play, Pause, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProgressiveImage from '../ui/ProgressiveImage'
import ProgressiveVideo from '../ui/ProgressiveVideo'
import { usePagination } from '../../hooks/usePagination'

interface SavedMedia {
  id: string
  media_type: 'image' | 'video'
  image_url?: string
  video_url?: string
  thumbnail_url: string
  title: string
  description?: string
  tags: string[]
  created_at: string
  width: number
  height: number
  // Video-specific fields
  video_duration?: number
  video_resolution?: string
  video_format?: string
  generation_metadata?: {
    prompt: string
    style: string
    aspect_ratio: string
    resolution: string
    consistency_level: string
    enhanced_prompt: string
    style_applied: string
    style_prompt: string
    custom_style_preset?: any
    generation_mode?: string
    base_image?: string
    api_endpoint?: string
    credits_used: number
    generated_at: string
    // Video-specific metadata
    duration?: number
    motion_type?: string
  }
  project_id?: string
}

interface SavedMediaMasonryProps {
  images: SavedMedia[]
  onImageSelect?: (media: SavedMedia) => void
  onDownload?: (url: string, title: string) => void
  onDelete?: (id: string) => void
  onReusePrompt?: (prompt: string) => void
  onReuseGenerationSettings?: (metadata: SavedMedia['generation_metadata']) => void
  onAddImageToPreview?: (mediaUrl: string) => void
  deletingImage?: string | null
  selectedImageUrl?: string | null
  onExpandMedia?: (media: SavedMedia) => void
  currentTab?: string
}

export default function SavedMediaMasonry({
  images,
  onImageSelect,
  onDownload,
  onDelete,
  onReusePrompt,
  onReuseGenerationSettings,
  onAddImageToPreview,
  deletingImage,
  selectedImageUrl,
  onExpandMedia,
  currentTab = 'generate'
}: SavedMediaMasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imagesLoaded, setImagesLoaded] = useState<Map<string, boolean>>(new Map())
  const [selectedImageForInfo, setSelectedImageForInfo] = useState<SavedMedia | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [imagesPerRow, setImagesPerRow] = useState(4)
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  
  // Pagination for performance optimization
  const {
    currentPage,
    totalPages,
    pageSize,
    paginatedItems: paginatedImages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    isLoading: paginationLoading,
    setIsLoading: setPaginationLoading
  } = usePagination(images, { pageSize: 16, initialPage: 1 })

  // Handle image loading
  const handleImageLoad = (imageId: string) => {
    setImagesLoaded(prev => {
      const newMap = new Map(prev)
      newMap.set(imageId, true)
      return newMap
    })
  }

  // Handle video play/pause
  const handleVideoPlay = (imageId: string) => {
    setPlayingVideos(prev => new Set(prev).add(imageId))
  }

  const handleVideoPause = (imageId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  // Update images per row based on screen size
  useEffect(() => {
    const updateImagesPerRow = () => {
      if (window.innerWidth >= 1024) {
        setImagesPerRow(4) // lg:grid-cols-4
      } else if (window.innerWidth >= 768) {
        setImagesPerRow(3) // md:grid-cols-3
      } else {
        setImagesPerRow(2) // grid-cols-2
      }
    }

    updateImagesPerRow()
    window.addEventListener('resize', updateImagesPerRow)
    return () => window.removeEventListener('resize', updateImagesPerRow)
  }, [])

  // Calculate aspect ratio and determine column span
  const getImageStyle = (image: SavedMedia) => {
    const aspectRatio = image.width / image.height
    
    // Determine column span based on aspect ratio
    let colSpan = 1
    if (aspectRatio > 1.5) {
      colSpan = 2 // Wide images span 2 columns
    } else if (aspectRatio < 0.7) {
      colSpan = 1 // Tall images span 1 column
    } else {
      colSpan = 1 // Square images span 1 column
    }
    
    return {
      gridColumn: `span ${colSpan}`,
      aspectRatio: aspectRatio.toString()
    }
  }

  // Convert aspect ratio to readable format
  const getAspectRatioLabel = (width: number, height: number): string => {
    const aspectRatio = width / height
    
    // Common aspect ratios with more generous tolerance
    if (Math.abs(aspectRatio - 1) < 0.05) return '1:1'
    if (Math.abs(aspectRatio - 16/9) < 0.05) return '16:9'
    if (Math.abs(aspectRatio - 9/16) < 0.05) return '9:16'
    if (Math.abs(aspectRatio - 4/3) < 0.05) return '4:3'
    if (Math.abs(aspectRatio - 3/4) < 0.05) return '3:4'
    if (Math.abs(aspectRatio - 21/9) < 0.05) return '21:9'
    if (Math.abs(aspectRatio - 3/2) < 0.05) return '3:2'
    if (Math.abs(aspectRatio - 2/3) < 0.05) return '2:3'
    if (Math.abs(aspectRatio - 5/4) < 0.05) return '5:4'
    if (Math.abs(aspectRatio - 4/5) < 0.05) return '4:5'
    
    // For other ratios, find the closest simple ratio
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(width, height)
    const w = Math.round(width / divisor)
    const h = Math.round(height / divisor)
    
    // If the ratio is too complex, show decimal
    if (w > 32 || h > 32) {
      return aspectRatio.toFixed(2) + ':1'
    }
    
    return `${w}:${h}`
  }

  return (
    <div className="space-y-4">
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={!hasPreviousPage || paginationLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={!hasNextPage || paginationLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Showing {paginatedImages.length} of {images.length} items
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]"
      >
        {paginatedImages.map((image: SavedMedia) => {
        const isLoaded = imagesLoaded.get(image.id)
        const style = getImageStyle(image)
        
        return (
          <div
            key={image.id}
            className={`group relative rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer ${
              selectedImageUrl === (image.image_url || image.video_url)
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            style={style}
            onClick={() => onImageSelect?.(image)}
          >
            {/* Media */}
            <div className="relative w-full h-full">
              {image.media_type === 'video' ? (
                <ProgressiveVideo
                  src={image.video_url || ''}
                  poster={image.thumbnail_url}
                  className="w-full h-full"
                  onLoad={() => handleImageLoad(image.id)}
                  onError={() => handleImageLoad(image.id)}
                  onPlay={() => handleVideoPlay(image.id)}
                  onPause={() => handleVideoPause(image.id)}
                  onEnded={() => handleVideoPause(image.id)}
                  preload="metadata"
                  muted
                />
              ) : (
                <ProgressiveImage
                  src={image.thumbnail_url || image.image_url || ''}
                  alt={image.title}
                  className="w-full h-full"
                  onLoad={() => handleImageLoad(image.id)}
                  loading="lazy"
                  quality={75}
                />
              )}
              
              {/* Playing indicator */}
              {image.media_type === 'video' && playingVideos.has(image.id) && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Playing</span>
                </div>
              )}
              
              {/* Aspect ratio badge */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <span>{getAspectRatioLabel(image.width, image.height)}</span>
                {image.media_type === 'video' && (
                  <span className="text-blue-300">🎬</span>
                )}
              </div>
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {/* Play button for videos */}
                  {image.media_type === 'video' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-10 w-10 p-0 bg-white/90 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Play video in place
                        const video = e.currentTarget.closest('.group')?.querySelector('video') as HTMLVideoElement
                        if (video) {
                          if (video.paused) {
                            video.play().catch(error => {
                              console.error('Error playing video:', error)
                            })
                          } else {
                            video.pause()
                          }
                        }
                      }}
                      title={playingVideos.has(image.id) ? "Pause video" : "Play video"}
                    >
                      {playingVideos.has(image.id) ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current" />
                      )}
                    </Button>
                  )}
                  
                  {/* Expand button for all media */}
                  {onExpandMedia && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onExpandMedia(image)
                      }}
                      title="Expand to full size"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onAddImageToPreview && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddImageToPreview(image.image_url || image.video_url || '')
                      }}
                      title={currentTab === 'video' ? 'Add to video preview' : 'Add to preview'}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageForInfo(image)
                    }}
                    title="View metadata"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  {onDownload && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownload(image.image_url || image.video_url || '', image.title)
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(image.id)
                      }}
                      disabled={deletingImage === image.id}
                      title="Delete"
                    >
                      {deletingImage === image.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Media info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">{image.title}</h4>
                  <p className="text-white/80 text-xs truncate">{image.description}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    {getAspectRatioLabel(image.width, image.height)}
                  </Badge>
                  {image.media_type === 'video' && (
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-200 border-blue-400/30">
                      Video
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      </div>
      
      
      {/* Metadata Popup Modal */}
      {selectedImageForInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Image Metadata</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImageForInfo(null)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Preview */}
              <div className="aspect-square rounded-lg overflow-hidden border">
                {selectedImageForInfo.media_type === 'video' ? (
                  <video
                    src={selectedImageForInfo.video_url}
                    poster={selectedImageForInfo.thumbnail_url}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={selectedImageForInfo.image_url}
                    alt={selectedImageForInfo.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-sm">{selectedImageForInfo.title}</p>
                </div>
                
                {selectedImageForInfo.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-sm">{selectedImageForInfo.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Dimensions</label>
                  <p className="text-sm">{selectedImageForInfo.width} × {selectedImageForInfo.height}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Aspect Ratio</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-sm">
                      {getAspectRatioLabel(selectedImageForInfo.width, selectedImageForInfo.height)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      ({selectedImageForInfo.media_type === 'video' ? 'Video' : 'Image'})
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm">{new Date(selectedImageForInfo.created_at).toLocaleString()}</p>
                </div>
                
                {selectedImageForInfo.tags && selectedImageForInfo.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedImageForInfo.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generation Metadata */}
                {selectedImageForInfo.generation_metadata && (
                  <div className="border-t pt-3">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Generation Settings</label>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Prompt:</span>
                        <p className="text-gray-700 mt-1">{selectedImageForInfo.generation_metadata.prompt || 'Not available'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Style:</span>
                          <p className="text-gray-700">{selectedImageForInfo.generation_metadata.style || 'Not available'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Resolution:</span>
                          <p className="text-gray-700">{selectedImageForInfo.generation_metadata.resolution || 'Not available'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Aspect Ratio:</span>
                          <p className="text-gray-700">{selectedImageForInfo.generation_metadata.aspect_ratio || 'Not available'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Consistency:</span>
                          <p className="text-gray-700">{selectedImageForInfo.generation_metadata.consistency_level || 'Not available'}</p>
                        </div>
                      </div>
                      {selectedImageForInfo.generation_metadata.custom_style_preset && (
                        <div>
                          <span className="font-medium">Style Preset:</span>
                          <p className="text-gray-700">{selectedImageForInfo.generation_metadata.custom_style_preset.name}</p>
                        </div>
                      )}
                      {selectedImageForInfo.generation_metadata.generation_mode && (
                        <div>
                          <span className="font-medium">Generation Mode:</span>
                          <p className="text-gray-700">
                            {selectedImageForInfo.generation_metadata.generation_mode === 'image-to-image' ? '🖼️ Image-to-Image' : '📝 Text-to-Image'}
                          </p>
                        </div>
                      )}
                      {selectedImageForInfo.generation_metadata.base_image && (
                        <div>
                          <span className="font-medium">Base Image:</span>
                          <div className="mt-1">
                            <img 
                              src={selectedImageForInfo.generation_metadata.base_image} 
                              alt="Base image" 
                              className="w-16 h-16 object-cover rounded border"
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Generated: {selectedImageForInfo.generation_metadata.generated_at 
                          ? new Date(selectedImageForInfo.generation_metadata.generated_at).toLocaleString()
                          : 'Unknown'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {onReusePrompt && (
                  <Button
                    onClick={() => {
                      onReusePrompt(selectedImageForInfo.generation_metadata?.prompt || selectedImageForInfo.title)
                      setSelectedImageForInfo(null)
                    }}
                    className="flex-1"
                    variant="outline"
                  >
                    Reuse Prompt
                  </Button>
                )}
                {onReuseGenerationSettings && selectedImageForInfo.generation_metadata && (
                  <Button
                    onClick={() => {
                      onReuseGenerationSettings(selectedImageForInfo.generation_metadata)
                      setSelectedImageForInfo(null)
                    }}
                    className="flex-1"
                  >
                    Reuse All Settings
                  </Button>
                )}
                {onImageSelect && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onImageSelect(selectedImageForInfo)
                      setSelectedImageForInfo(null)
                    }}
                    className="flex-1"
                  >
                    Use Image
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, Download, Trash2, AlertCircle, Image as ImageIcon, CheckCircle, Edit3, Eye, X, Save, Video, Play, Pause, Maximize2, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../../../lib/auth-context'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import ProgressiveImage from '../ui/ProgressiveImage'
import ProgressiveVideo from '../ui/ProgressiveVideo'
import { usePagination } from '../../hooks/usePagination'
import { useSmartPreloading } from '../../hooks/useSmartPreloading'

interface PastGeneration {
  id: string
  title: string
  prompt: string
  style?: string
  generated_images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
    type?: string
  }>
  credits_used: number
  created_at: string
  last_generated_at: string
  status: string
  is_saved?: boolean
  is_edit?: boolean
  is_video?: boolean
  metadata?: {
    enhanced_prompt?: string
    style_applied?: string
    style_prompt?: string
  }
}

interface PastGenerationsPanelProps {
  onImportProject: (project: PastGeneration) => void
}

export default function PastGenerationsPanel({ onImportProject }: PastGenerationsPanelProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [generations, setGenerations] = useState<PastGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingImages, setViewingImages] = useState<PastGeneration | null>(null)
  const [savingImage, setSavingImage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [requiresPermanent, setRequiresPermanent] = useState(false)
  
  // Masonry layout state
  const containerRef = useRef<HTMLDivElement>(null)
  const [imagesLoaded, setImagesLoaded] = useState<Map<string, boolean>>(new Map())
  const [selectedImageForInfo, setSelectedImageForInfo] = useState<PastGeneration | null>(null)
  const [imagesPerRow, setImagesPerRow] = useState(4)
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  
  // Pagination for performance optimization
  const {
    currentPage,
    totalPages,
    pageSize,
    paginatedItems: paginatedGenerations,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    isLoading: paginationLoading,
    setIsLoading: setPaginationLoading
  } = usePagination(generations, { pageSize: 12, initialPage: 1 })

  // Smart preloading for visible media
  const mediaUrls = paginatedGenerations
    .flatMap(gen => gen.generated_images.map(img => img.url))
    .filter(Boolean)
  
  const { preloadStatus } = useSmartPreloading(mediaUrls, {
    priority: 'high',
    delay: 500, // 500ms delay to prioritize initial render
    maxConcurrent: 2 // Limit concurrent preloads
  })

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
  const getImageStyle = (generation: PastGeneration) => {
    if (generation.generated_images.length === 0) {
      return { gridColumn: 'span 1', aspectRatio: '1' }
    }
    
    const image = generation.generated_images[0]
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

  useEffect(() => {
    if (user && session?.access_token) {
      fetchPastGenerations()
    }
  }, [user, session?.access_token])

  const fetchPastGenerations = async () => {
    try {
      setLoading(true)
      
      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('/api/playground/past-generations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Failed to fetch past generations: ${response.status} ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      setGenerations(data.generations || [])
    } catch (error) {
      console.error('Error fetching past generations:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Load',
        message: 'Could not load past generations'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setShowDeleteConfirm(true)
    setRequiresPermanent(false)
  }

  const handleDeleteConfirm = async (permanent: boolean = false) => {
    if (!itemToDelete) return

    setDeletingId(itemToDelete)
    try {
      const response = await fetch(`/api/playground/past-generations/${itemToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permanent })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.requiresPermanent) {
          setRequiresPermanent(true)
          return // Don't close dialog, show permanent option
        }
        
        // Provide more detailed error information
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to delete generation'
        
        throw new Error(errorMessage)
      }

      setGenerations(prev => prev.filter(gen => gen.id !== itemToDelete))
      showFeedback({
        type: 'success',
        title: 'Deleted',
        message: permanent ? 'Generation permanently deleted' : 'Generation deleted successfully'
      })
      
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      setRequiresPermanent(false)
    } catch (error) {
      console.error('Error deleting generation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Could not delete generation'
      showFeedback({
        type: 'error',
        title: 'Delete Failed',
        message: errorMessage
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
    setRequiresPermanent(false)
  }

  const getDaysRemaining = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = now.getTime() - created.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, 6 - diffDays)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const saveImageToGallery = async (imageUrl: string, projectTitle: string, generation: any) => {
    setSavingImage(imageUrl)
    try {
      const response = await fetch('/api/playground/save-to-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          imageUrl,
          title: projectTitle,
          description: `Generated from: ${projectTitle}`,
          tags: ['ai-generated'],
          generationMetadata: generation.metadata || {}
        })
      })

      if (response.ok) {
        showFeedback({
          type: 'success',
          title: 'Saved!',
          message: 'Image saved to gallery successfully'
        })

        // Refresh the generations list to update save status
        fetchPastGenerations()
      } else {
        const errorData = await response.json()
        
        // Handle duplicate images gracefully
        if (response.status === 409 && errorData.error === 'duplicate') {
          showFeedback({
            type: 'info',
            title: 'Already Saved',
            message: errorData.message || 'This image is already saved in your gallery.'
          })
          return // Don't throw error for duplicates
        }
        
        throw new Error(errorData.error || 'Failed to save image')
      }
    } catch (error) {
      console.error('Error saving image:', error)
      showFeedback({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Could not save image to gallery'
      })
    } finally {
      setSavingImage(null)
    }
  }

  if (loading) {
    return (
      <Card className="border-t-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Past Generations
              </CardTitle>
              <CardDescription>
                Your recent AI generations (Last 6 days)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-600">Loading past generations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-t-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Past Generations
              </CardTitle>
              <CardDescription>
                Your recent AI generations ({generations.length}) - Last 6 days
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPastGenerations}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {generations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No recent generations found</p>
              <p className="text-sm">Generate some images or videos to see them here</p>
            </div>
          ) : (
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
                    Showing {paginatedGenerations.length} of {generations.length} generations
                    {preloadStatus.loading > 0 && (
                      <span className="ml-2 text-blue-500">
                        • Preloading {preloadStatus.loading}/{preloadStatus.total}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div 
                ref={containerRef}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]"
              >
                {paginatedGenerations.map((generation: PastGeneration) => {
                  const isLoaded = imagesLoaded.get(generation.id)
                  const style = getImageStyle(generation)
                  const daysRemaining = getDaysRemaining(generation.created_at)
                  const isUrgent = daysRemaining <= 1
                  
                  return (
                    <div
                      key={generation.id}
                      className={`group relative rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer ${
                        isUrgent && !generation.is_saved ? 'border-red-300 ring-2 ring-red-200' : 'border-gray-200 hover:border-purple-300'
                      }`}
                      style={style}
                      onClick={() => onImportProject(generation)}
                    >
                      {/* Media */}
                      <div className="relative w-full h-full">
                        {generation.generated_images.length > 0 ? (
                          <>
                            {generation.generated_images[0].type === 'video' ? (
                              <ProgressiveVideo
                                src={generation.generated_images[0].url}
                                poster={generation.generated_images[0].url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                                className="w-full h-full"
                                onLoad={() => handleImageLoad(generation.id)}
                                onError={() => handleImageLoad(generation.id)}
                                onPlay={() => handleVideoPlay(generation.id)}
                                onPause={() => handleVideoPause(generation.id)}
                                onEnded={() => handleVideoPause(generation.id)}
                                preload="metadata"
                                muted
                              />
                            ) : (
                              <ProgressiveImage
                                src={(() => {
                                  const url = generation.generated_images[0].url
                                  if (typeof url === 'string') return url
                                  if (typeof url === 'object' && url !== null) {
                                    return (url as any).url || (url as any).image_url || ''
                                  }
                                  return ''
                                })()}
                                alt={generation.title}
                                className="w-full h-full"
                                onLoad={() => handleImageLoad(generation.id)}
                                loading="lazy"
                                quality={75}
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Playing indicator */}
                        {generation.generated_images.length > 0 && 
                         generation.generated_images[0].type === 'video' && 
                         playingVideos.has(generation.id) && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span>Playing</span>
                          </div>
                        )}
                        
                        {/* Status badges */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          {generation.generated_images.length > 0 && (
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <span>{getAspectRatioLabel(generation.generated_images[0].width, generation.generated_images[0].height)}</span>
                              {generation.is_video && (
                                <span className="text-blue-300">🎬</span>
                              )}
                            </div>
                          )}
                          {generation.is_saved && (
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Saved</span>
                            </div>
                          )}
                          {isUrgent && !generation.is_saved && (
                            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{daysRemaining === 0 ? 'Expires today' : '1 day left'}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Multiple images indicator */}
                        {generation.generated_images.length > 1 && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            +{generation.generated_images.length - 1} more
                          </div>
                        )}
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            {/* Play button for videos */}
                            {generation.generated_images.length > 0 && 
                             generation.generated_images[0].type === 'video' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-10 w-10 p-0 bg-white/90 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation()
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
                                title={playingVideos.has(generation.id) ? "Pause video" : "Play video"}
                              >
                                {playingVideos.has(generation.id) ? (
                                  <Pause className="h-5 w-5 fill-current" />
                                ) : (
                                  <Play className="h-5 w-5 fill-current" />
                                )}
                              </Button>
                            )}
                            
                            {/* View all images button */}
                            {generation.generated_images.length > 1 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setViewingImages(generation)
                                }}
                                title="View all images"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Info button */}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImageForInfo(generation)
                              }}
                              title="View metadata"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            
                            {/* Import button */}
                            {!generation.is_edit && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onImportProject(generation)
                                }}
                                title={generation.is_video ? "Import to Video" : "Import to Edit"}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Delete button */}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(generation.id)
                              }}
                              disabled={deletingId === generation.id}
                              title="Delete generation"
                            >
                              {deletingId === generation.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Media info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-sm font-medium truncate">{generation.title}</h4>
                            <p className="text-white/80 text-xs truncate">{generation.prompt}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                              {generation.generated_images.length} {generation.is_video ? 'video(s)' : 'image(s)'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-200 border-purple-400/30">
                              {generation.credits_used} credits
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Images auto-delete after 6 days unless saved to gallery. 
                  <span className="text-green-600">●</span> Saved items are permanent.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Popup Modal */}
      {selectedImageForInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generation Metadata</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImageForInfo(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Preview */}
              <div className="aspect-square rounded-lg overflow-hidden border">
                {selectedImageForInfo.generated_images.length > 0 ? (
                  <>
                    {selectedImageForInfo.generated_images[0].type === 'video' ? (
                      <video
                        src={selectedImageForInfo.generated_images[0].url}
                        poster={selectedImageForInfo.generated_images[0].url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        loop
                      />
                    ) : (
                      <img
                        src={selectedImageForInfo.generated_images[0].url}
                        alt={selectedImageForInfo.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-sm">{selectedImageForInfo.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Prompt</label>
                  <p className="text-sm">{selectedImageForInfo.prompt}</p>
                </div>
                
                {selectedImageForInfo.generated_images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Dimensions</label>
                    <p className="text-sm">{selectedImageForInfo.generated_images[0].width} × {selectedImageForInfo.generated_images[0].height}</p>
                  </div>
                )}
                
                {selectedImageForInfo.generated_images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Aspect Ratio</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {getAspectRatioLabel(selectedImageForInfo.generated_images[0].width, selectedImageForInfo.generated_images[0].height)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({selectedImageForInfo.is_video ? 'Video' : 'Image'})
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm">{new Date(selectedImageForInfo.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Credits Used</label>
                  <p className="text-sm">{selectedImageForInfo.credits_used}</p>
                </div>
                
                {selectedImageForInfo.style && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Style</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {selectedImageForInfo.style === 'realistic' ? '📸' : 
                         selectedImageForInfo.style === 'artistic' ? '🎨' :
                         selectedImageForInfo.style === 'cartoon' ? '🎭' :
                         selectedImageForInfo.style === 'anime' ? '🌸' :
                         selectedImageForInfo.style === 'fantasy' ? '✨' : 
                         selectedImageForInfo.is_edit ? '✏️' : ''} {selectedImageForInfo.style}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedImageForInfo.is_saved && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                    {selectedImageForInfo.is_edit && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Badge>
                    )}
                    {selectedImageForInfo.is_video && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Generation Metadata */}
                {selectedImageForInfo.metadata && (
                  <div className="border-t pt-3">
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Additional Metadata</label>
                    <div className="space-y-2 text-sm">
                      {selectedImageForInfo.metadata.enhanced_prompt && (
                        <div>
                          <span className="font-medium">Enhanced Prompt:</span>
                          <p className="text-gray-700 mt-1">{selectedImageForInfo.metadata.enhanced_prompt}</p>
                        </div>
                      )}
                      {selectedImageForInfo.metadata.style_applied && (
                        <div>
                          <span className="font-medium">Style Applied:</span>
                          <p className="text-gray-700">{selectedImageForInfo.metadata.style_applied}</p>
                        </div>
                      )}
                      {selectedImageForInfo.metadata.style_prompt && (
                        <div>
                          <span className="font-medium">Style Prompt:</span>
                          <p className="text-gray-700">{selectedImageForInfo.metadata.style_prompt}</p>
                        </div>
                      )}
                      {(selectedImageForInfo.metadata as any).cinematic_parameters && (
                        <div>
                          <span className="font-medium">Cinematic Parameters:</span>
                          <div className="mt-2 space-y-1">
                            {Object.entries((selectedImageForInfo.metadata as any).cinematic_parameters).map(([key, value]) => (
                              value ? (
                                <div key={key} className="flex justify-between text-xs">
                                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="text-gray-800 font-medium">{String(value).replace(/-/g, ' ')}</span>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}
                      {(selectedImageForInfo.metadata as any).include_technical_details !== undefined && (
                        <div>
                          <span className="font-medium">Technical Details:</span>
                          <span className="text-gray-700 ml-2">{(selectedImageForInfo.metadata as any).include_technical_details ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      )}
                      {(selectedImageForInfo.metadata as any).include_style_references !== undefined && (
                        <div>
                          <span className="font-medium">Style References:</span>
                          <span className="text-gray-700 ml-2">{(selectedImageForInfo.metadata as any).include_style_references ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    onImportProject(selectedImageForInfo)
                    setSelectedImageForInfo(null)
                  }}
                  className="flex-1"
                >
                  {selectedImageForInfo.is_video ? 'Import to Video' : 'Import to Edit'}
                </Button>
                {selectedImageForInfo.generated_images.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingImages(selectedImageForInfo)
                      setSelectedImageForInfo(null)
                    }}
                    className="flex-1"
                  >
                    View All Images
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Viewing Modal */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {viewingImages.title} - All Images ({viewingImages.generated_images.length})
              </h3>
              <button
                onClick={() => setViewingImages(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {viewingImages.generated_images.map((image, index) => (
                  <div key={index} className="relative group">
                    {image.type === 'video' ? (
                      <video
                        src={image.url}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                        controls
                        preload="metadata"
                        loop
                        poster={image.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={image.url}
                        alt={`${viewingImages.title} - Image ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center space-y-2">
                        <span className="text-white text-sm font-medium bg-black bg-opacity-70 px-2 py-1 rounded">
                          {image.type === 'video' ? 'Video' : 'Image'} {index + 1}
                        </span>
                        <button
                          onClick={() => saveImageToGallery(image.url, viewingImages.title, viewingImages)}
                          disabled={savingImage === image.url}
                          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          <span>{savingImage === image.url ? 'Saving...' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>{viewingImages.generated_images.length} {viewingImages.is_video ? 'video(s)' : 'image(s)'}</span>
                  <span>{viewingImages.credits_used} credits</span>
                  {viewingImages.style && (
                    <span className="text-blue-600 font-medium">
                      {viewingImages.style === 'realistic' ? '📸' : 
                       viewingImages.style === 'artistic' ? '🎨' :
                       viewingImages.style === 'cartoon' ? '🎭' :
                       viewingImages.style === 'anime' ? '🌸' :
                       viewingImages.style === 'fantasy' ? '✨' : 
                       viewingImages.is_edit ? '✏️' : ''} {viewingImages.style}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      viewingImages.generated_images.forEach(image => {
                        saveImageToGallery(image.url, viewingImages.title, viewingImages)
                      })
                    }}
                    disabled={savingImage !== null}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingImage ? 'Saving...' : 'Save All'}</span>
                  </button>
                  <button
                    onClick={() => onImportProject(viewingImages)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>{viewingImages?.is_video ? 'Import to Video' : 'Import to Edit'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {requiresPermanent ? 'Permanent Delete Required' : 'Delete Generation'}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-gray-600 mb-6">
              {requiresPermanent ? (
                <>
                  This generation has been saved to your gallery and cannot be deleted normally. 
                  <strong className="text-red-600"> Permanent deletion will remove it completely</strong> from both Past Generations and Saved Media. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete this generation? It will be removed from Past Generations but can be restored from Saved Media if needed.
                </>
              )}
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deletingId === itemToDelete}
              >
                Cancel
              </Button>
              {requiresPermanent ? (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteConfirm(true)}
                  disabled={deletingId === itemToDelete}
                >
                  {deletingId === itemToDelete ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Permanent Delete'
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteConfirm(false)}
                    disabled={deletingId === itemToDelete}
                  >
                    {deletingId === itemToDelete ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteConfirm(true)}
                    disabled={deletingId === itemToDelete}
                  >
                    Permanent Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
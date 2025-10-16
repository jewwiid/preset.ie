'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Download, Trash2, Info, ChevronDown, ChevronUp, Play, Pause, Maximize2, ChevronLeft, ChevronRight, Share, Sparkles, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import ProgressiveImage from '../ui/ProgressiveImage'
import ProgressiveVideo from '../ui/ProgressiveVideo'
import { NSFWContentWrapper } from '../ui/nsfw-content-wrapper'
import { usePagination } from '../../hooks/usePagination'
import { useAuth } from '../../../lib/auth-context'
import { useImageGalleryState } from '../../../hooks/useImageGalleryState'
import { useImageAnalysis } from '../../../hooks/useImageAnalysis'
import { getImageGridStyle, getAspectRatioLabel } from '../../../lib/utils/aspect-ratio-utils'
import UnifiedMediaMetadataModal from '../UnifiedMediaMetadataModal'

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
  // NSFW moderation fields
  is_nsfw?: boolean
  is_flagged?: boolean
  moderation_status?: string
  user_marked_nsfw?: boolean
  nsfw_confidence_score?: number
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
    // Cinematic parameters
    cinematic_parameters?: any
    include_technical_details?: boolean
    include_style_references?: boolean
    // Video-specific metadata
    duration?: number
    camera_movement?: string
  }
  project_id?: string
}

interface SavedMediaMasonryProps {
  images: SavedMedia[]
  onImageSelect?: (media: SavedMedia) => void
  onDownload?: (url: string, title: string) => void
  onDelete?: (id: string) => void
  onPromote?: (id: string) => void
  onReusePrompt?: (prompt: string) => void
  onReuseGenerationSettings?: (metadata: SavedMedia['generation_metadata']) => void
  onSaveAsPreset?: (metadata: SavedMedia['generation_metadata'], imageUrl: string) => void
  onAddImageToPreview?: (mediaUrl: string) => void
  deletingImage?: string | null
  promotingImage?: string | null
  selectedImageUrl?: string | null
  onExpandMedia?: (media: SavedMedia) => void
  currentTab?: string
  onRefresh?: () => void
}

export default function SavedMediaMasonry({
  images,
  onImageSelect,
  onDownload,
  onDelete,
  onPromote,
  onReusePrompt,
  onReuseGenerationSettings,
  onSaveAsPreset,
  onAddImageToPreview,
  deletingImage,
  promotingImage,
  selectedImageUrl,
  onExpandMedia,
  currentTab = 'generate',
  onRefresh
}: SavedMediaMasonryProps) {
  const { session } = useAuth()

  // Gallery state management
  const handleModalOpen = useCallback((imageId: string) => {
    console.log('📖 Modal opened for image:', imageId)
  }, [])

  const galleryState = useImageGalleryState({
    onModalOpen: handleModalOpen
  })

  // AI analysis hooks
  const imageAnalysis = useImageAnalysis({
    accessToken: session?.access_token,
    onDescriptionAnalyzed: (description) => {
      galleryState.setEditableDescription(description)
    },
    onTagsAnalyzed: (tags) => {
      galleryState.setEditableTags(tags)
    }
  })
  
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

  // Note: galleryState.handleImageLoad, galleryState.handleVideoPlay, galleryState.handleVideoPause are now in galleryState hook
  // Note: imagesPerRow resize listener is now in galleryState hook
  // Note: getImageStyle and getAspectRatioLabel are now imported from aspect-ratio-utils

  // Wrapper for imported utility to match local signature
  const getImageStyle = (image: SavedMedia) => getImageGridStyle(image.width, image.height)

  // Delegate to imageAnalysis hook with logging
  const analyzeImageDescription = async (imageUrl: string) => {
    console.log('🔍 AI Analyze Description button clicked!', {
      imageUrl,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      selectedImageId: galleryState.selectedImageForInfo?.id
    })

    try {
      const description = await imageAnalysis.analyzeImageDescription(
        imageUrl,
        galleryState.selectedImageForInfo?.generation_metadata
      )
      console.log('✅ Description analysis completed:', description)
    } catch (error) {
      console.error('❌ Description analysis failed:', error)
    }
  }

  // Delegate to imageAnalysis hook with logging
  const analyzeImageTags = async (imageUrl: string) => {
    console.log('🏷️ AI Analyze Tags button clicked!', {
      imageUrl,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      selectedImageId: galleryState.selectedImageForInfo?.id
    })

    try {
      const tags = await imageAnalysis.analyzeImageTags(
        imageUrl,
        galleryState.editableTags
      )
      console.log('✅ Tags analysis completed:', tags)
    } catch (error) {
      console.error('❌ Tags analysis failed:', error)
    }
  }

  // Save updated description and tags
  const saveUpdatedDescription = async () => {
    if (!galleryState.selectedImageForInfo || !galleryState.editableDescription.trim()) {
      console.log('❌ Cannot save: missing image info or description')
      return
    }

    console.log('💾 Starting save process...', {
      itemId: galleryState.selectedImageForInfo.id,
      descriptionLength: galleryState.editableDescription.trim().length,
      description: galleryState.editableDescription.trim(),
      tagsCount: galleryState.editableTags.length,
      tags: galleryState.editableTags,
      hasSession: !!session?.access_token,
      currentDescription: galleryState.selectedImageForInfo.description,
      currentTags: galleryState.selectedImageForInfo.tags
    })

    galleryState.setSavingDescription(true)
    try {
      const response = await fetch('/api/playground/update-gallery-item', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          itemId: galleryState.selectedImageForInfo.id,
          description: galleryState.editableDescription.trim(),
          tags: galleryState.editableTags
        })
      })

      console.log('💾 Save API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ Save successful:', responseData)

        // Update the local state
        galleryState.setSelectedImageForInfo(prev => prev ? {
          ...prev,
          description: galleryState.editableDescription.trim(),
          tags: galleryState.editableTags
        } : null)

        // Refresh the saved media list to show updated description
        if (onRefresh) {
          console.log('🔄 Refreshing media list...')
          onRefresh()
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Failed to update description:', {
          status: response.status,
          error: errorData
        })
      }
    } catch (error) {
      console.error('❌ Error saving description:', error)
    } finally {
      console.log('🏁 Save process finished')
      galleryState.setSavingDescription(false)
    }
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
            <span className="text-sm text-muted-foreground">
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
          <div className="text-sm text-muted-foreground">
            Showing {paginatedImages.length} of {images.length} items
          </div>
        </div>
      )}

      <div
        ref={galleryState.containerRef}
        className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
      >
        {paginatedImages.map((image: SavedMedia) => {
        const isLoaded = galleryState.imagesLoaded.get(image.id)
        const style = getImageStyle(image)
        
        return (
          <NSFWContentWrapper
            key={image.id}
            contentId={image.id}
            contentType="playground_gallery"
            isNsfw={image.is_nsfw || image.user_marked_nsfw || false}
            className={`group relative rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer break-inside-avoid mb-4 ${
              selectedImageUrl === (image.image_url || image.video_url)
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
            onContentAccess={(action) => {
              // Log content access for audit trail
              console.log('NSFW Content Access:', {
                contentId: image.id,
                contentType: 'playground_gallery',
                action,
                timestamp: new Date().toISOString()
              })
            }}
          >
            <div
              style={{ aspectRatio: style.aspectRatio }}
              onClick={() => onImageSelect?.(image)}
            >
              {/* Media */}
              <div className="relative w-full h-full">
                {image.media_type === 'video' ? (
                  <ProgressiveVideo
                    src={image.video_url || ''}
                    poster={image.thumbnail_url && image.thumbnail_url !== image.video_url ? image.thumbnail_url : undefined}
                    className="w-full h-full"
                    onLoad={() => galleryState.handleImageLoad(image.id)}
                    onError={() => galleryState.handleImageLoad(image.id)}
                    onPlay={() => galleryState.handleVideoPlay(image.id)}
                    onPause={() => galleryState.handleVideoPause(image.id)}
                    onEnded={() => galleryState.handleVideoPause(image.id)}
                    preload="metadata"
                    muted
                  />
                ) : (
                  <ProgressiveImage
                    src={image.thumbnail_url || image.image_url || ''}
                    alt={image.title}
                    className="w-full h-full"
                    onLoad={() => galleryState.handleImageLoad(image.id)}
                    loading="lazy"
                    quality={75}
                  />
                )}
              
              {/* Playing indicator */}
              {image.media_type === 'video' && galleryState.playingVideos.has(image.id) && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
                  <span>Playing</span>
                </div>
              )}
              
              {/* Aspect ratio and media type badges */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs bg-primary/90 backdrop-blur-sm text-primary-foreground border-0 shadow-sm">
                  {getAspectRatioLabel(image.width, image.height)}
                </Badge>
                {image.media_type === 'video' && (
                  <Badge className="text-xs bg-primary/80 backdrop-blur-sm text-primary-foreground border-0 shadow-sm">
                    Video
                  </Badge>
                )}
              </div>
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-backdrop bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {/* Play button for videos */}
                  {image.media_type === 'video' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:shadow-md hover:text-primary"
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
                      title={galleryState.playingVideos.has(image.id) ? "Pause video" : "Play video"}
                    >
                      {galleryState.playingVideos.has(image.id) ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {/* Expand button for all media */}
                  {onExpandMedia && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-accent/80 hover:shadow-md"
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
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:shadow-md hover:text-primary"
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
                    className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:shadow-md hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      galleryState.setSelectedImageForInfo(image)
                    }}
                    title="View metadata"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  {onDownload && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:shadow-md hover:text-primary"
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
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-destructive/80 hover:shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(image.id)
                      }}
                      disabled={deletingImage === image.id}
                      title="Delete"
                    >
                      {deletingImage === image.id ? (
                        <LoadingSpinner size="sm" className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {onPromote && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:bg-primary/90 hover:shadow-md bg-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPromote(image.id)
                      }}
                      disabled={promotingImage === image.id}
                      title="Promote to Media"
                    >
                      {promotingImage === image.id ? (
                        <LoadingSpinner size="sm" className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Media info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">{image.title}</h4>
                  <p className="text-white/80 text-xs truncate">{image.description}</p>
                </div>
              </div>
            </div>
            </div>
          </NSFWContentWrapper>
        )
      })}
      </div>
      
      
      {/* Unified Media Metadata Modal */}
      <UnifiedMediaMetadataModal
        isOpen={!!galleryState.selectedImageForInfo}
        onClose={() => galleryState.setSelectedImageForInfo(null)}
        mediaId={galleryState.selectedImageForInfo?.id || null}
        mediaSource="gallery"
      />
    </div>
  )
}
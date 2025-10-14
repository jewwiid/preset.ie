import { useState, useEffect, useRef } from 'react'

export interface UseImageGalleryStateOptions {
  onModalOpen?: (imageId: string) => void
}

/**
 * Manages all state for the image gallery masonry layout
 * Including: image loading, video playback, modal state, editing state
 */
export function useImageGalleryState(options: UseImageGalleryStateOptions = {}) {
  const { onModalOpen } = options
  const containerRef = useRef<HTMLDivElement>(null)

  // Image loading state
  const [imagesLoaded, setImagesLoaded] = useState<Map<string, boolean>>(new Map())

  // Modal and selection state
  const [selectedImageForInfo, setSelectedImageForInfo] = useState<any | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Layout state
  const [imagesPerRow, setImagesPerRow] = useState(4)

  // Video playback state
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())

  // Editing state for descriptions and tags
  const [editableDescription, setEditableDescription] = useState('')
  const [editableTags, setEditableTags] = useState<string[]>([])
  const [savingDescription, setSavingDescription] = useState(false)

  // Sync editable fields when modal opens/closes
  useEffect(() => {
    if (selectedImageForInfo) {
      console.log('🔄 Modal opened - syncing description and tags:', {
        id: selectedImageForInfo.id,
        currentDescription: selectedImageForInfo.description,
        currentTags: selectedImageForInfo.tags,
      })
      setEditableDescription(selectedImageForInfo.description || '')
      setEditableTags(selectedImageForInfo.tags || [])

      // Debug: Check dimensions metadata
      console.log('📊 Image metadata debug:', {
        storedDimensions: { width: selectedImageForInfo.width, height: selectedImageForInfo.height },
        hasGenerationMetadata: !!selectedImageForInfo.generation_metadata,
        generationResolution: selectedImageForInfo.generation_metadata?.resolution,
        generationAspectRatio: selectedImageForInfo.generation_metadata?.aspect_ratio,
        actualDimensions: {
          actual_width: (selectedImageForInfo.generation_metadata as any)?.actual_width,
          actual_height: (selectedImageForInfo.generation_metadata as any)?.actual_height
        }
      })

      onModalOpen?.(selectedImageForInfo.id)
    } else {
      setEditableDescription('')
      setEditableTags([])
    }
  }, [selectedImageForInfo, onModalOpen])

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

  // Image loading handler
  const handleImageLoad = (imageId: string) => {
    setImagesLoaded(prev => {
      const newMap = new Map(prev)
      newMap.set(imageId, true)
      return newMap
    })
  }

  // Video playback handlers
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

  // Modal handlers
  const openInfoModal = (image: any) => {
    setSelectedImageForInfo(image)
  }

  const closeInfoModal = () => {
    setSelectedImageForInfo(null)
    setIsExpanded(false)
  }

  return {
    // Refs
    containerRef,

    // State
    imagesLoaded,
    selectedImageForInfo,
    isExpanded,
    imagesPerRow,
    playingVideos,
    editableDescription,
    editableTags,
    savingDescription,

    // Setters
    setImagesLoaded,
    setSelectedImageForInfo,
    setIsExpanded,
    setImagesPerRow,
    setPlayingVideos,
    setEditableDescription,
    setEditableTags,
    setSavingDescription,

    // Handlers
    handleImageLoad,
    handleVideoPlay,
    handleVideoPause,
    openInfoModal,
    closeInfoModal,
  }
}

'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImageIcon, X, ArrowUp } from 'lucide-react'
import { useAuth } from '../../../lib/auth-context'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { downloadImageWithWatermark } from '../../../lib/watermark-utils'
import SavedMediaMasonry from './SavedImagesMasonry'

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
    credits_used: number
    generated_at: string
    // Cinematic parameters
    cinematic_parameters?: any
    include_technical_details?: boolean
    include_style_references?: boolean
    // Video-specific metadata
    duration?: number
    motion_type?: string
  }
  project_id?: string
}

interface SavedMediaGalleryProps {
  onMediaSelect?: (media: SavedMedia) => void
  onReusePrompt?: (prompt: string) => void
  onReuseGenerationSettings?: (metadata: SavedMedia['generation_metadata']) => void
  onSaveAsPreset?: (metadata: SavedMedia['generation_metadata'], imageUrl: string) => void
  onMediaUpdated?: (media: SavedMedia[]) => void
  onAddMediaToPreview?: (mediaUrl: string) => void
  onExpandMedia?: (media: SavedMedia) => void
  selectedMediaUrl?: string | null
  currentTab?: string
  className?: string
}

export interface SavedMediaGalleryRef {
  refresh: () => void
}

const SavedMediaGallery = forwardRef<SavedMediaGalleryRef, SavedMediaGalleryProps>(
  ({ onMediaSelect, onReusePrompt, onReuseGenerationSettings, onSaveAsPreset, onMediaUpdated, onAddMediaToPreview, onExpandMedia, selectedMediaUrl, currentTab = 'generate', className = '' }, ref) => {
  const router = useRouter()
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const [savedMedia, setSavedMedia] = useState<SavedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null)
  const [promotingMedia, setPromotingMedia] = useState<string | null>(null)

  const handleViewMediaManagement = () => {
    router.push('/dashboard/media')
  }
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'plus' | 'pro'>('free')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null)

  const fetchSubscriptionTier = async () => {
    if (!session?.access_token || !user) return

    try {
      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.subscriptionTier) {
          setSubscriptionTier(data.subscriptionTier.toLowerCase())
        }
      }
    } catch (error) {
      console.error('Error fetching subscription tier:', error)
    }
  }

  const fetchSavedMedia = async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/playground/gallery', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch saved media`)
      }

      const data = await response.json()
      console.log('📦 Gallery API response:', {
        success: data.success,
        mediaCount: data.media?.length || 0
      })

      if (data.success) {
        const media = data.media || []
        console.log('✅ Setting saved media:', media.length, 'items')
        setSavedMedia(media)

        if (onMediaUpdated) {
          console.log('📢 Calling onMediaUpdated callback with', media.length, 'items')
          onMediaUpdated(media)
        } else {
          console.log('⚠️ No onMediaUpdated callback provided')
        }
      } else {
        console.error('Gallery API error:', data.error)
        throw new Error(data.error || 'Failed to fetch saved media')
      }
    } catch (error) {
      // Don't show error feedback for authentication issues - just silently fail
      if (error instanceof Error && (
        error.message.includes('Invalid token') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('401')
      )) {
        // User is not authenticated, fail silently
        setSavedMedia([])
      } else {
        // Show error for non-auth issues
        console.error('Error fetching saved media:', error)
        showFeedback({
          type: 'error', 
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to load saved media'
        })
        setSavedMedia([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (mediaId: string) => {
    setMediaToDelete(mediaId)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete || !session?.access_token) return

    try {
      setDeletingMedia(mediaToDelete)
      const response = await fetch(`/api/playground/gallery/${mediaToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete media')
      }

      const updatedMedia = savedMedia.filter(img => img.id !== mediaToDelete)
      setSavedMedia(updatedMedia)
      onMediaUpdated?.(updatedMedia)
      showFeedback({
        type: 'success',
        title: 'Success',
        message: 'Media deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting media:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete media'
      })
    } finally {
      setDeletingMedia(null)
      setShowDeleteConfirm(false)
      setMediaToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setMediaToDelete(null)
  }

  const promoteToMedia = async (mediaId: string) => {
    if (!session?.access_token) return

    try {
      setPromotingMedia(mediaId)
      const response = await fetch('/api/playground/promote-to-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ galleryItemId: mediaId })
      })

      if (response.ok) {
        showFeedback({
          type: 'success',
          title: 'Promoted!',
          message: 'Image promoted to media library. You can now use it in showcases!'
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to promote image')
      }
    } catch (error) {
      console.error('Error promoting image:', error)
      showFeedback({
        type: 'error',
        title: 'Promote Failed',
        message: error instanceof Error ? error.message : 'Could not promote image to media'
      })
    } finally {
      setPromotingMedia(null)
    }
  }

  const downloadImage = async (imageUrl: string, title: string) => {
    try {
      // Load watermark SVG from brandkit
          const watermarkSvg = await fetch('/brandkit-watermark.svg').then(res => res.text()).catch(() => '')
      
      const isPaidUser = subscriptionTier === 'plus' || subscriptionTier === 'pro'
      
      await downloadImageWithWatermark(
        imageUrl,
        `${title || 'image'}.jpg`,
        isPaidUser,
        watermarkSvg
      )
      
      showFeedback({
        type: 'success',
        title: 'Download Complete',
        message: isPaidUser 
          ? 'Image downloaded successfully!' 
          : 'Image downloaded with watermark (upgrade to remove watermark)'
      })
    } catch (error) {
      console.error('Error downloading image:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to download image'
      })
    }
  }

  useEffect(() => {
    console.log('🔍 SavedMediaGallery mounted/updated:', {
      hasSession: !!session?.access_token,
      hasUser: !!user,
      userId: user?.id
    })

    if (session?.access_token && user) {
      console.log('🔄 Fetching saved media for user:', user.id)
      fetchSavedMedia()
      fetchSubscriptionTier()
    } else {
      console.log('⚠️ Not fetching - missing session or user')
    }
  }, [session?.access_token, user])

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchSavedMedia
  }))

  if (!session?.access_token || !user) {
    return null
  }

  return (
    <>
    <Card className={`border-t-2 border-primary/20 bg-primary/5 ${className}`} data-saved-gallery>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Saved Images
            </CardTitle>
            <CardDescription>
              Your saved playground media ({savedMedia.length})
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewMediaManagement}
          >
            View
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-muted-foreground">Loading saved images...</span>
          </div>
        ) : savedMedia.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium">No saved images yet</p>
            <p className="text-sm">Save images from your generations to see them here</p>
          </div>
        ) : (
              <SavedMediaMasonry
                images={savedMedia}
                onImageSelect={onMediaSelect}
                onDownload={downloadImage}
                onDelete={handleDeleteClick}
                onPromote={promoteToMedia}
                onReusePrompt={onReusePrompt}
                onReuseGenerationSettings={onReuseGenerationSettings}
                onSaveAsPreset={onSaveAsPreset}
                onAddImageToPreview={onAddMediaToPreview}
                onExpandMedia={onExpandMedia}
                deletingImage={deletingMedia}
                promotingImage={promotingMedia}
                selectedImageUrl={selectedMediaUrl}
                currentTab={currentTab}
                onRefresh={fetchSavedMedia}
              />
        )}
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
        <div className="bg-popover rounded-lg p-6 max-w-md w-full mx-4 border border-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Delete Media</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Are you sure you want to delete this media? This action cannot be undone.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deletingMedia === mediaToDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingMedia === mediaToDelete}
            >
              {deletingMedia === mediaToDelete ? (
                <>
                  <LoadingSpinner size="sm" />
                  Deleting...
                </>
              ) : (
                'Delete Media'
              )}
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  )
})

SavedMediaGallery.displayName = 'SavedMediaGallery'

export default SavedMediaGallery

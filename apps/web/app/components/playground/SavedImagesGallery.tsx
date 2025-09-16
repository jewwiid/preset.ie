'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'
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
  onMediaUpdated?: (media: SavedMedia[]) => void
  onAddMediaToPreview?: (mediaUrl: string) => void
  onExpandMedia?: (media: SavedMedia) => void
  selectedMediaUrl?: string | null
  className?: string
}

export interface SavedMediaGalleryRef {
  refresh: () => void
}

const SavedMediaGallery = forwardRef<SavedMediaGalleryRef, SavedMediaGalleryProps>(
  ({ onMediaSelect, onReusePrompt, onReuseGenerationSettings, onMediaUpdated, onAddMediaToPreview, onExpandMedia, selectedMediaUrl, className = '' }, ref) => {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const [savedMedia, setSavedMedia] = useState<SavedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'plus' | 'pro'>('free')

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
    console.log('fetchSavedMedia called', { hasToken: !!session?.access_token, hasUser: !!user })
    if (!session?.access_token) {
      console.log('No access token, skipping fetch')
      setLoading(false)
      return
    }

    if (!user) {
      console.log('No user, skipping fetch')
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
      console.log('Gallery API response:', data)
      if (data.success) {
        const media = data.media || []
        console.log('Gallery media received:', media.length, 'items')
        setSavedMedia(media)
        onMediaUpdated?.(media)
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

  const deleteMedia = async (mediaId: string) => {
    if (!session?.access_token) return

    try {
      setDeletingMedia(mediaId)
      const response = await fetch(`/api/playground/gallery/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      const updatedMedia = savedMedia.filter(img => img.id !== mediaId)
      setSavedMedia(updatedMedia)
      onMediaUpdated?.(updatedMedia)
      showFeedback({
        type: 'success',
        title: 'Success',
        message: 'Image deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting image:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete image'
      })
    } finally {
      setDeletingMedia(null)
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
    if (session?.access_token && user) {
      fetchSavedMedia()
      fetchSubscriptionTier()
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
    <Card className={`border-t-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 ${className}`} data-saved-gallery>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Saved Images
            </CardTitle>
            <CardDescription>
              Your saved playground media ({savedMedia.length})
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSavedMedia}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-600">Loading saved images...</span>
          </div>
        ) : savedMedia.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No saved images yet</p>
            <p className="text-sm">Save images from your generations to see them here</p>
          </div>
        ) : (
              <SavedMediaMasonry
                images={savedMedia}
                onImageSelect={onMediaSelect}
                onDownload={downloadImage}
                onDelete={deleteMedia}
                onReusePrompt={onReusePrompt}
                onReuseGenerationSettings={onReuseGenerationSettings}
                onAddImageToPreview={onAddMediaToPreview}
                onExpandMedia={onExpandMedia}
                deletingImage={deletingMedia}
                selectedImageUrl={selectedMediaUrl}
              />
        )}
      </CardContent>
    </Card>
  )
})

SavedMediaGallery.displayName = 'SavedMediaGallery'

export default SavedMediaGallery

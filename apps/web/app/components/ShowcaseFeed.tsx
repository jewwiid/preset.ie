'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Heart, Eye, MessageCircle, Share2, MoreHorizontal, Flag, Bookmark, Copy, Trash2, Info } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import CinematicShowcaseFilters from './CinematicShowcaseFilters'
import MediaMetadataModal from './MediaMetadataModal'
import { useToast, ToastContainer } from '../../components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Helper function to calculate aspect ratio
const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  const ratioWidth = width / divisor
  const ratioHeight = height / divisor
  
  // Common aspect ratios
  if (ratioWidth === 16 && ratioHeight === 9) return '16:9'
  if (ratioWidth === 4 && ratioHeight === 3) return '4:3'
  if (ratioWidth === 3 && ratioHeight === 2) return '3:2'
  if (ratioWidth === 1 && ratioHeight === 1) return '1:1'
  if (ratioWidth === 9 && ratioHeight === 16) return '9:16'
  if (ratioWidth === 21 && ratioHeight === 9) return '21:9'
  if (ratioWidth === 19 && ratioHeight === 9) return '19:9'
  
  return `${ratioWidth}:${ratioHeight}`
}

interface ShowcaseMedia {
  id: string
  image_url: string
  title?: string
  description?: string
  tags?: string[]
  order_index: number
  cinematic_metadata?: {
    ai_metadata?: any
    cinematic_tags?: string[]
  } | null
}

interface ShowcaseCreator {
  id: string
  display_name: string
  handle: string
  avatar_url?: string
}

interface Showcase {
  id: string
  title: string
  description?: string
  creator: ShowcaseCreator
  showcase_type: 'moodboard' | 'individual_image'
  moodboard_id?: string
  individual_image_url?: string
  individual_image_title?: string
  individual_image_description?: string
  individual_image_width?: number
  individual_image_height?: number
  visibility: string
  tags: string[]
  likes_count: number
  views_count: number
  media_count: number
  created_at: string
  updated_at: string
  media: ShowcaseMedia[]
  is_liked: boolean
}

interface CinematicFilters {
  cinematic_query?: string
  director_style?: string
  camera_angle?: string
  lighting_style?: string
  color_palette?: string
}

interface ShowcaseFeedProps {
  className?: string
  showcaseType?: 'moodboard' | 'individual_image' | 'all' | 'video' | 'treatment'
  showCinematicFilters?: boolean
  tabFilter?: 'trending' | 'featured' | 'latest' | 'community'
}

export default function ShowcaseFeed({ className = '', showcaseType = 'all', showCinematicFilters = true, tabFilter }: ShowcaseFeedProps) {
  const { user, session } = useAuth()
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast()
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likingShowcase, setLikingShowcase] = useState<string | null>(null)
  const [cinematicFilters, setCinematicFilters] = useState<CinematicFilters>({})
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deletingShowcase, setDeletingShowcase] = useState<string | null>(null)
  const [metadataModal, setMetadataModal] = useState<{
    isOpen: boolean
    media: {
      id: string
      type: string
      url: string
      width?: number
      height?: number
      metadata?: any
      cinematic_metadata?: any
    } | null
    showcase: Showcase | null
  }>({ isOpen: false, media: null, showcase: null })
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

  // Track previous filters to avoid unnecessary refetches
  const prevFiltersRef = useRef<string>('')
  
  // Fetch showcases on mount and when showcaseType changes
  useEffect(() => {
    fetchShowcases()
  }, [showcaseType])

  // Separate effect for cinematic filters - only fetch when filters actually change
  useEffect(() => {
    const currentFiltersString = JSON.stringify(cinematicFilters)
    const hasFilters = Object.values(cinematicFilters).some(value => value && value !== '')
    
    // Only fetch if filters have actually changed and there are filters applied
    if (hasFilters && currentFiltersString !== prevFiltersRef.current) {
      fetchShowcases()
    }
    
    prevFiltersRef.current = currentFiltersString
  }, [cinematicFilters])

  // Fetch current user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !session?.access_token) return

      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`}})

        if (response.ok) {
          const data = await response.json()
          setCurrentUserProfile(data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [user, session])

  const fetchShowcases = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      console.log('=== FETCHING SHOWCASES ===', new Date().toISOString()) // Debug log with timestamp
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Build URL with cinematic filters
      const params = new URLSearchParams()
      if (showcaseType !== 'all') {
        params.append('type', showcaseType)
      }
      
      // Add cinematic filters
      Object.entries(cinematicFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })
      
      const url = `/api/showcases/feed?${params.toString()}&_t=${Date.now()}`

      console.log('Fetching showcases from:', url)
      const response = await fetch(url, {
        headers
      })

      console.log('Response status:', response.status, response.ok)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch showcases: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      setShowcases(data.showcases || [])
    } catch (err) {
      console.error('Error fetching showcases:', err)
      setError('Failed to load showcases')
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (showcaseId: string, currentlyLiked: boolean) => {
    if (!user || !session) {
      showError('Authentication Required', 'Please sign in to like showcases')
      setTimeout(() => window.location.href = '/auth/signin', 2000)
      return
    }

    if (!session.access_token) {
      showError('Session Expired', 'Your session has expired. Please sign in again.')
      setTimeout(() => window.location.href = '/auth/signin', 2000)
      return
    }

    setLikingShowcase(showcaseId)
    
    try {
      const method = currentlyLiked ? 'DELETE' : 'POST'
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      }

      // Add body for POST requests
      if (method === 'POST') {
        requestOptions.body = JSON.stringify({ action: 'like' })
      }

      const response = await fetch(`/api/showcases/${showcaseId}/like`, requestOptions)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        if (response.status === 403) {
          throw new Error('You can only like public showcases or your own showcases')
        }
        throw new Error(errorData.error || 'Failed to update like')
      }

      const data = await response.json()
      
      // Update the showcase in the list
      setShowcases(prev => prev.map(showcase => 
        showcase.id === showcaseId 
          ? { 
              ...showcase, 
              is_liked: data.is_liked_by_user,
              likes_count: data.likes_count 
            }
          : showcase
      ))
          } catch (err) {
            console.error('Error toggling like:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to update like'
            showError('Like Failed', errorMessage)
          } finally {
            setLikingShowcase(null)
          }
  }

  const handleComment = (showcaseId: string) => {
    // TODO: Implement comment functionality
    console.log('Comment clicked for showcase:', showcaseId)
    showInfo('Coming Soon', 'Comment functionality is being developed!')
  }

  const handleShare = async (showcaseId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this showcase on Preset',
          url: `${window.location.origin}/showcases/${showcaseId}`})
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/showcases/${showcaseId}`)
        showSuccess('Link Copied', 'Showcase link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      showError('Share Failed', 'Unable to share showcase')
    }
  }

  const toggleMenu = (showcaseId: string) => {
    setOpenMenuId(openMenuId === showcaseId ? null : showcaseId)
  }

  const handleCopyLink = async (showcaseId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/showcases/${showcaseId}`)
      showSuccess('Link Copied', 'Showcase link copied to clipboard!')
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error copying link:', error)
      showError('Copy Failed', 'Unable to copy link to clipboard')
    }
  }

  const handleReport = (showcaseId: string) => {
    showInfo('Coming Soon', 'Report functionality is being developed!')
    setOpenMenuId(null)
  }

  const handleBookmark = (showcaseId: string) => {
    showInfo('Coming Soon', 'Bookmark functionality is being developed!')
    setOpenMenuId(null)
  }

  const handleDeleteClick = (showcaseId: string) => {
    setShowDeleteConfirm(showcaseId)
    setOpenMenuId(null)
  }

  const handleDeleteConfirm = async (showcaseId: string) => {
    if (!user || !session) {
      showError('Authentication Required', 'Please sign in to delete showcases')
      setTimeout(() => window.location.href = '/auth/signin', 2000)
      return
    }

    if (!session.access_token) {
      showError('Session Expired', 'Your session has expired. Please sign in again.')
      setTimeout(() => window.location.href = '/auth/signin', 2000)
      return
    }

    setDeletingShowcase(showcaseId)
    
    try {
      const response = await fetch('/api/showcases', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`},
        body: JSON.stringify({ showcaseId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to delete showcase')
      }

      // Remove the showcase from the local state
      setShowcases(prev => prev.filter(showcase => showcase.id !== showcaseId))
      
      showSuccess('Showcase Deleted', 'Your showcase has been successfully deleted!')
    } catch (err) {
      console.error('Error deleting showcase:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete showcase'
      showError('Delete Failed', errorMessage)
    } finally {
      setDeletingShowcase(null)
      setShowDeleteConfirm(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null)
  }


  const handleViewMetadata = async (media: ShowcaseMedia, showcase: Showcase) => {
    // Track view when info button is clicked
    try {
      const response = await fetch(`/api/showcases/${showcase.id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'}})

      if (response.ok) {
        const data = await response.json()
        // Update the showcase in the list with new view count
        setShowcases(prev => prev.map(s => 
          s.id === showcase.id 
            ? { ...s, views_count: data.views_count }
            : s
        ))
      }
    } catch (error) {
      console.error('Error tracking view:', error)
      // Don't show error to user as this is background tracking
    }

    // Convert ShowcaseMedia to the format expected by MediaMetadataModal
    const mediaForModal = {
      id: media.id,
      type: media.image_url?.endsWith('.mp4') ? 'video' : 'image',
      url: media.image_url,
      width: undefined,
      height: undefined,
      metadata: null,
      cinematic_metadata: media.cinematic_metadata
    }
    setMetadataModal({ isOpen: true, media: mediaForModal, showcase })
  }

  const handleCloseMetadataModal = () => {
    setMetadataModal({ isOpen: false, media: null, showcase: null })
  }

  // Helper function to check if current user owns the showcase or is admin
  const isOwner = (showcase: Showcase) => {
    if (!currentUserProfile) return false
    // Check if user is admin
    const isAdmin = currentUserProfile.role_flags?.includes('ADMIN')
    // Check if user owns the showcase
    const isCreator = showcase.creator.id === currentUserProfile.id
    return isAdmin || isCreator
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-sm text-muted-foreground">Loading showcases...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-destructive-500 mb-4">{error}</p>
        <button 
          onClick={fetchShowcases}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (showcases.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground mb-4">No showcases found</p>
        <p className="text-sm text-muted-foreground/70">Be the first to create a showcase!</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cinematic Filters */}
      {showCinematicFilters && (
        <CinematicShowcaseFilters
          onFiltersChange={setCinematicFilters}
          onClearFilters={() => setCinematicFilters({})}
          activeFilters={cinematicFilters}
        />
      )}

      {showcases.map((showcase) => (
        <div key={showcase.id} className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  {showcase.creator.avatar_url ? (
                    <img 
                      src={showcase.creator.avatar_url} 
                      alt={showcase.creator.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground font-medium">
                      {showcase.creator.display_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {showcase.creator.display_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{showcase.creator.handle} • {formatDate(showcase.created_at)}
                  </p>
                </div>
              </div>
              <div className="relative" ref={el => { menuRefs.current[showcase.id] = el; }}>
                <button 
                  onClick={() => toggleMenu(showcase.id)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </button>
                
                {openMenuId === showcase.id && (
                  <div className="absolute right-0 top-10 bg-background border border-border rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                    <button
                      onClick={() => handleCopyLink(showcase.id)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={() => handleBookmark(showcase.id)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center space-x-2"
                    >
                      <Bookmark className="h-4 w-4" />
                      <span>Bookmark</span>
                    </button>
                    <button
                      onClick={() => handleReport(showcase.id)}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center space-x-2"
                    >
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                    {isOwner(showcase) && (
                      <>
                        <div className="border-t border-border my-1"></div>
                        <button
                          onClick={() => handleDeleteClick(showcase.id)}
                          className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3">
              <h2 className="text-lg font-semibold text-foreground">{showcase.title}</h2>
              {showcase.description && (
                <p className="text-muted-foreground mt-1">{showcase.description}</p>
              )}
            </div>
          </div>

          {/* Media Grid */}
          <div>
            {showcase.showcase_type === 'individual_image' ? (
              // Individual image showcase
              <>
                <div className="relative group">
                {(() => {
                  // For individual images, we'll use a more flexible approach
                  // Since we don't have width/height for individual_image_url, use aspect-video for videos
                  const isVideo = showcase.individual_image_url?.endsWith('.mp4') || 
                                 showcase.individual_image_url?.endsWith('.webm') || 
                                 showcase.individual_image_url?.endsWith('.mov')
                  
                  return isVideo ? (
                    <video
                      src={showcase.individual_image_url}
                      className="w-full h-auto"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      style={{
                        aspectRatio: showcase.individual_image_width && showcase.individual_image_height 
                          ? `${showcase.individual_image_width}:${showcase.individual_image_height}`
                          : '16:9',
                        objectFit: 'cover'
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={showcase.individual_image_url}
                      alt={showcase.individual_image_title || showcase.title}
                      className="w-full h-auto"
                      style={{
                        aspectRatio: showcase.individual_image_width && showcase.individual_image_height 
                          ? `${showcase.individual_image_width}:${showcase.individual_image_height}`
                          : '1:1',
                        objectFit: 'cover'
                      }}
                    />
                  )
                })()}
                {showcase.individual_image_title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-primary-foreground p-3 rounded-b-lg">
                    <p className="font-medium">{showcase.individual_image_title}</p>
                    {showcase.individual_image_description && (
                      <p className="text-sm opacity-90">{showcase.individual_image_description}</p>
                    )}
                  </div>
                )}
                
                {/* Info button overlay */}
                <button
                  onClick={() => {
                    // Create a mock media object for individual images
                    const mockMedia: ShowcaseMedia = {
                      id: showcase.id,
                      image_url: showcase.individual_image_url || '',
                      order_index: 0,
                      cinematic_metadata: null,
                      title: showcase.individual_image_title || undefined
                    }
                    handleViewMetadata(mockMedia, showcase)
                  }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-primary-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View treatment details"
                >
                  <Info className="h-3 w-3" />
                </button>
                </div>
                
                {/* Individual image title below */}
                {showcase.individual_image_title && (
                  <div className="mt-2 px-1">
                    <p className="text-xs text-muted-foreground truncate" title={showcase.individual_image_title}>
                      {showcase.individual_image_title}
                    </p>
                  </div>
                )}
              </>
            ) : showcase.media.length > 0 ? (
              // Moodboard showcase
              <>
                <div className={`grid ${
                  showcase.media.length === 1 ? 'grid-cols-1' :
                  showcase.media.length === 2 ? 'grid-cols-2' :
                  showcase.media.length === 3 ? 'grid-cols-3' :
                  'grid-cols-2'
                }`}>
                {showcase.media.slice(0, 4).map((media, index) => {
                  // Use default aspect ratio since width/height not available
                  const aspectRatio = 1
                  
                  return (
                    <div key={`${media.id}-${index}`}>
                      <div className="relative group">
                      {media.image_url?.endsWith('.mp4') || media.image_url?.endsWith('.webm') || media.image_url?.endsWith('.mov') ? (
                        <video
                          src={media.image_url}
                          className="w-full h-auto"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          style={{
                            aspectRatio: '16:9',
                            objectFit: 'cover'
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={media.image_url}
                          alt={media.title || `Showcase image ${index + 1}`}
                          className="w-full h-auto"
                          style={{
                            aspectRatio: '16:9',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      {showcase.media.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            +{showcase.media.length - 4} more
                          </span>
                        </div>
                      )}
                      
                      {/* Info button overlay */}
                      <button
                        onClick={() => handleViewMetadata(media, showcase)}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-primary-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View treatment details"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                      </div>
                      
                      {/* Media title */}
                      {media.title && (
                        <div className="mt-2 px-1">
                          <p className="text-xs text-muted-foreground truncate" title={media.title}>
                            {media.title}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              </>
            ) : (
              <div className="h-48 bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No media available</p>
              </div>
            )}
          </div>


          {/* Actions */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => toggleLike(showcase.id, showcase.is_liked)}
                  disabled={likingShowcase === showcase.id}
                  className={`flex items-center space-x-2 ${
                    showcase.is_liked ? 'text-destructive' : 'text-muted-foreground'
                  } hover:text-destructive transition-colors`}
                >
                  {likingShowcase === showcase.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-destructive"></div>
                  ) : (
                    <Heart className={`h-5 w-5 ${showcase.is_liked ? 'fill-current' : ''}`} />
                  )}
                  <span>{showcase.likes_count}</span>
                </button>

                <button 
                  onClick={() => handleComment(showcase.id)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>0</span>
                </button>

                <button 
                  onClick={() => handleShare(showcase.id)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{showcase.views_count}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Showcase</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this showcase? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                disabled={deletingShowcase === showDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 disabled:bg-destructive/50 rounded-md transition-colors flex items-center space-x-2"
              >
                {deletingShowcase === showDeleteConfirm && (
                  <LoadingSpinner size="sm" />
                )}
                <span>{deletingShowcase === showDeleteConfirm ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Media Metadata Modal */}
      {metadataModal.media && metadataModal.showcase && (
        <MediaMetadataModal
          isOpen={metadataModal.isOpen}
          onClose={handleCloseMetadataModal}
          media={metadataModal.media}
          showcase={metadataModal.showcase}
        />
      )}
    </div>
  )
}
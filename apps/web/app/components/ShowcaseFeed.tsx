'use client'

import { useState, useEffect } from 'react'
import { Heart, Eye, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

interface ShowcaseMedia {
  id: string
  image_url: string
  title?: string
  description?: string
  tags?: string[]
  order_index: number
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

interface ShowcaseFeedProps {
  className?: string
  showcaseType?: 'moodboard' | 'individual_image' | 'all'
}

export default function ShowcaseFeed({ className = '', showcaseType = 'all' }: ShowcaseFeedProps) {
  const { user, session } = useAuth()
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likingShowcase, setLikingShowcase] = useState<string | null>(null)

  useEffect(() => {
    fetchShowcases()
  }, [showcaseType])

  const fetchShowcases = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const url = showcaseType === 'all' 
        ? '/api/showcases/feed'
        : `/api/showcases/feed?type=${showcaseType}`

      const response = await fetch(url, {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch showcases')
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
      alert('Please sign in to like showcases')
      return
    }

    setLikingShowcase(showcaseId)
    
    try {
      const method = currentlyLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/showcases/${showcaseId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to update like')
      }

      const data = await response.json()
      
      // Update the showcase in the list
      setShowcases(prev => prev.map(showcase => 
        showcase.id === showcaseId 
          ? { 
              ...showcase, 
              is_liked: data.liked,
              likes_count: data.likes_count 
            }
          : showcase
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      alert('Failed to update like')
    } finally {
      setLikingShowcase(null)
    }
  }

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchShowcases}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (showcases.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 mb-4">No showcases found</p>
        <p className="text-sm text-gray-400">Be the first to create a showcase!</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showcases.map((showcase) => (
        <div key={showcase.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {showcase.creator.avatar_url ? (
                    <img 
                      src={showcase.creator.avatar_url} 
                      alt={showcase.creator.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {showcase.creator.display_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {showcase.creator.display_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    @{showcase.creator.handle} • {formatDate(showcase.created_at)}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mt-3">
              <h2 className="text-lg font-semibold text-gray-900">{showcase.title}</h2>
              {showcase.description && (
                <p className="text-gray-600 mt-1">{showcase.description}</p>
              )}
            </div>
          </div>

          {/* Media Grid */}
          <div className="p-4">
            {showcase.showcase_type === 'individual_image' ? (
              // Individual image showcase
              <div className="relative group">
                <img
                  src={showcase.individual_image_url}
                  alt={showcase.individual_image_title || showcase.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {showcase.individual_image_title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 rounded-b-lg">
                    <p className="font-medium">{showcase.individual_image_title}</p>
                    {showcase.individual_image_description && (
                      <p className="text-sm opacity-90">{showcase.individual_image_description}</p>
                    )}
                  </div>
                )}
              </div>
            ) : showcase.media.length > 0 ? (
              // Moodboard showcase
              <div className={`grid gap-2 ${
                showcase.media.length === 1 ? 'grid-cols-1' :
                showcase.media.length === 2 ? 'grid-cols-2' :
                showcase.media.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {showcase.media.slice(0, 4).map((media, index) => (
                  <div key={media.id} className="relative group">
                    <img
                      src={media.image_url}
                      alt={media.title || `Showcase image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {showcase.media.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{showcase.media.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No media available</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => toggleLike(showcase.id, showcase.is_liked)}
                  disabled={likingShowcase === showcase.id}
                  className={`flex items-center space-x-2 ${
                    showcase.is_liked ? 'text-red-500' : 'text-gray-500'
                  } hover:text-red-500 transition-colors`}
                >
                  {likingShowcase === showcase.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  ) : (
                    <Heart className={`h-5 w-5 ${showcase.is_liked ? 'fill-current' : ''}`} />
                  )}
                  <span>{showcase.likes_count}</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span>0</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{showcase.views_count}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
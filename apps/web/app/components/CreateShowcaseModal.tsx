'use client'

import { useState, useEffect } from 'react'
import { X, Image, Tag, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'

interface Moodboard {
  id: string
  title: string
  description?: string
  items_count: number
  created_at: string
}

interface GalleryImage {
  id: string
  image_url?: string
  video_url?: string
  thumbnail_url: string
  title: string
  description?: string
  tags: string[]
  created_at: string
  media_type: 'image' | 'video'
  width: number
  height: number
}

interface CreateShowcaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateShowcaseModal({ isOpen, onClose, onSuccess }: CreateShowcaseModalProps) {
  const { user, session } = useAuth()
  const router = useRouter()
  const [moodboards, setMoodboards] = useState<Moodboard[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingMoodboards, setFetchingMoodboards] = useState(false)
  const [fetchingGallery, setFetchingGallery] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    moodboardId: '',
    individualImageId: '',
    individualImageUrl: '',
    individualImageTitle: '',
    individualImageDescription: '',
    showcaseType: 'moodboard' as 'moodboard' | 'individual_image',
    visibility: 'public' as 'public' | 'private',
    tags: [] as string[]
  })
  
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      fetchMoodboards()
      fetchGalleryImages()
    }
  }, [isOpen, user])

  const fetchMoodboards = async () => {
    if (!user || !session) return

    try {
      setFetchingMoodboards(true)
      const response = await fetch('/api/moodboards', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMoodboards(data.moodboards || [])
      }
    } catch (error) {
      console.error('Error fetching moodboards:', error)
    } finally {
      setFetchingMoodboards(false)
    }
  }

  const fetchGalleryImages = async () => {
    if (!user || !session) return

    try {
      setFetchingGallery(true)
      const response = await fetch('/api/playground/gallery', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGalleryImages(data.media || [])
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error)
    } finally {
      setFetchingGallery(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !session) {
      alert('Please sign in to create a showcase')
      return
    }

    if (!formData.title) {
      alert('Please fill in the title')
      return
    }

    if (formData.showcaseType === 'moodboard' && !formData.moodboardId) {
      alert('Please select a moodboard')
      return
    }

    if (formData.showcaseType === 'individual_image' && !formData.individualImageId) {
      alert('Please select an image')
      return
    }

    setLoading(true)
    
    try {
      const requestData = {
        title: formData.title,
        description: formData.description,
        showcaseType: formData.showcaseType,
        visibility: formData.visibility,
        tags: formData.tags,
        ...(formData.showcaseType === 'moodboard' ? {
          moodboardId: formData.moodboardId
        } : {
          individualImageUrl: formData.individualImageUrl,
          individualImageTitle: formData.individualImageTitle,
          individualImageDescription: formData.individualImageDescription
        })
      }

      console.log('🚀 Sending showcase creation request:', requestData)
      console.log('🔑 Session token:', session.access_token ? 'Present' : 'Missing')

      const response = await fetch('/api/showcases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData)
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorData = {}
        try {
          const responseText = await response.text()
          console.error('❌ Raw response text:', responseText)
          
          if (responseText) {
            errorData = JSON.parse(responseText)
          }
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('❌ API Error Response:', errorData)
        console.error('❌ Response status:', response.status)
        console.error('❌ Response statusText:', response.statusText)
        
        // Try to get more details about the error
        const errorMessage = (errorData as any).error || (errorData as any).message || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const successData = await response.json()
      console.log('✅ Showcase created successfully:', successData)
      onSuccess()
    } catch (error) {
      console.error('❌ Error creating showcase:', error)
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      })
      alert((error as Error).message || 'Failed to create showcase')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleImageSelect = (image: GalleryImage) => {
    setFormData(prev => ({
      ...prev,
      individualImageId: image.id,
      individualImageUrl: image.image_url || image.video_url || image.thumbnail_url,
      individualImageTitle: image.title,
      individualImageDescription: image.description || ''
    }))
  }

  const handleGoToPlayground = () => {
    onClose() // Close the modal first
    router.push('/playground') // Navigate to playground
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create Showcase</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter showcase title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe your showcase"
              rows={3}
            />
          </div>

          {/* Showcase Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Showcase Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="moodboard"
                  checked={formData.showcaseType === 'moodboard'}
                  onChange={(e) => setFormData(prev => ({ ...prev, showcaseType: e.target.value as 'moodboard' | 'individual_image' }))}
                  className="mr-2"
                />
                <span className="text-sm">Moodboard</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="individual_image"
                  checked={formData.showcaseType === 'individual_image'}
                  onChange={(e) => setFormData(prev => ({ ...prev, showcaseType: e.target.value as 'moodboard' | 'individual_image' }))}
                  className="mr-2"
                />
                <span className="text-sm">Individual Image</span>
              </label>
            </div>
          </div>

          {/* Moodboard Selection */}
          {formData.showcaseType === 'moodboard' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Moodboard *
              </label>
              {fetchingMoodboards ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <select
                  value={formData.moodboardId}
                  onChange={(e) => setFormData(prev => ({ ...prev, moodboardId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Choose a moodboard</option>
                  {moodboards.map((moodboard) => (
                    <option key={moodboard.id} value={moodboard.id}>
                      {moodboard.title} ({moodboard.items_count} items)
                    </option>
                  ))}
                </select>
              )}
              {moodboards.length === 0 && !fetchingMoodboards && (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-4">
                    No moodboards found. Create a moodboard first.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToPlayground}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Go to Playground
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Individual Image Selection */}
          {formData.showcaseType === 'individual_image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image *
              </label>
              {fetchingGallery ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {galleryImages.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                        formData.individualImageId === image.id 
                          ? 'border-purple-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <img
                        src={image.image_url || image.video_url || image.thumbnail_url}
                        alt={image.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.title}
                        </p>
                        {image.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {image.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {galleryImages.length === 0 && !fetchingGallery && (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-4">
                    No images found in your gallery. Generate some images in the playground first.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToPlayground}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Go to Playground
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                  className="mr-2"
                />
                <Eye className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm">Public</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                  className="mr-2"
                />
                <EyeOff className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm">Private</span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || (formData.showcaseType === 'moodboard' && !formData.moodboardId) || (formData.showcaseType === 'individual_image' && !formData.individualImageId)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Showcase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
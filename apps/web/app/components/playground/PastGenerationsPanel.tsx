'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, Trash2, AlertCircle, Image as ImageIcon, CheckCircle, Edit3, Eye, X, Save, Video } from 'lucide-react'
import { useAuth } from '../../../lib/auth-context'
import { useFeedback } from '../../../components/feedback/FeedbackContext'

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

  useEffect(() => {
    if (user) {
      fetchPastGenerations()
    }
  }, [user])

  const fetchPastGenerations = async () => {
    try {
      const response = await fetch('/api/playground/past-generations', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch past generations')
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

  const deleteGeneration = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/playground/past-generations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete generation')
      }

      setGenerations(prev => prev.filter(gen => gen.id !== id))
      showFeedback({
        type: 'success',
        title: 'Deleted',
        message: 'Generation deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting generation:', error)
      showFeedback({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete generation'
      })
    } finally {
      setDeletingId(null)
    }
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

  const saveImageToGallery = async (imageUrl: string, projectTitle: string) => {
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
          tags: ['ai-generated']
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save image')
      }

      showFeedback({
        type: 'success',
        title: 'Saved!',
        message: 'Image saved to gallery successfully'
      })

      // Refresh the generations list to update save status
      fetchPastGenerations()
    } catch (error) {
      console.error('Error saving image:', error)
      showFeedback({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save image to gallery'
      })
    } finally {
      setSavingImage(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Past Generations</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Past Generations</h3>
        <span className="text-sm text-gray-500">(Last 6 days)</span>
      </div>

      {generations.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No recent generations found</p>
          <p className="text-gray-400 text-xs mt-1">Generate some images to see them here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {generations.map((generation) => {
            const daysRemaining = getDaysRemaining(generation.created_at)
            const isUrgent = daysRemaining <= 1
            
            return (
              <div
                key={generation.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3 mb-3">
                  {/* Thumbnail Preview */}
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {generation.generated_images.length > 0 ? (
                        <>
                          {generation.generated_images[0].type === 'video' ? (
                            <video
                              src={generation.generated_images[0].url}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                              poster={generation.generated_images[0].url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                            >
                              <source src={generation.generated_images[0].url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={generation.generated_images[0].url}
                              alt={generation.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {generation.generated_images.length > 1 && (
                            <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                              +{generation.generated_images.length - 1}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {generation.title}
                          </h4>
                          {generation.is_saved && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {generation.is_edit && (
                            <Edit3 className="h-4 w-4 text-blue-500" />
                          )}
                          {generation.is_video && (
                            <Video className="h-4 w-4 text-purple-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {generation.prompt}
                        </p>
                      </div>
                      {isUrgent && !generation.is_saved && (
                        <div className="flex items-center space-x-1 ml-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">
                            {daysRemaining === 0 ? 'Expires today' : '1 day left'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-4">
                    <span>{generation.generated_images.length} image(s)</span>
                    <span>{generation.credits_used} credits</span>
                    {generation.style && (
                      <span className="text-blue-600 font-medium">
                        {generation.style === 'realistic' ? '📸' : 
                         generation.style === 'artistic' ? '🎨' :
                         generation.style === 'cartoon' ? '🎭' :
                         generation.style === 'anime' ? '🌸' :
                         generation.style === 'fantasy' ? '✨' : 
                         generation.is_edit ? '✏️' : ''} {generation.style}
                      </span>
                    )}
                    <span>{formatDate(generation.last_generated_at)}</span>
                  </div>
                  {daysRemaining > 1 && !generation.is_saved && (
                    <span className="text-gray-400">
                      {daysRemaining} days left
                    </span>
                  )}
                  {generation.is_saved && (
                    <span className="text-green-600 font-medium">
                      Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {generation.generated_images.length > 1 && (
                    <button
                      onClick={() => setViewingImages(generation)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View All ({generation.generated_images.length})</span>
                    </button>
                  )}
                  
                  {!generation.is_edit && (
                    <button
                      onClick={() => onImportProject(generation)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Import</span>
                    </button>
                  )}
                  
                  {!generation.is_saved && (
                    <button
                      onClick={() => deleteGeneration(generation.id)}
                      disabled={deletingId === generation.id}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{deletingId === generation.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Images auto-delete after 6 days unless saved to gallery. 
          <span className="text-green-600">●</span> Saved items are permanent.
        </p>
      </div>

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
                          Image {index + 1}
                        </span>
                        <button
                          onClick={() => saveImageToGallery(image.url, viewingImages.title)}
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
                  <span>{viewingImages.generated_images.length} image(s)</span>
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
                        saveImageToGallery(image.url, viewingImages.title)
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
                    <span>Import Project</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react'
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
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {generation.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {generation.prompt}
                    </p>
                  </div>
                  {isUrgent && (
                    <div className="flex items-center space-x-1 ml-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">
                        {daysRemaining === 0 ? 'Expires today' : '1 day left'}
                      </span>
                    </div>
                  )}
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
                         generation.style === 'fantasy' ? '✨' : ''} {generation.style}
                      </span>
                    )}
                    <span>{formatDate(generation.last_generated_at)}</span>
                  </div>
                  {daysRemaining > 1 && (
                    <span className="text-gray-400">
                      {daysRemaining} days left
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onImportProject(generation)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span>Import</span>
                  </button>
                  
                  <button
                    onClick={() => deleteGeneration(generation.id)}
                    disabled={deletingId === generation.id}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{deletingId === generation.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Images auto-delete after 6 days unless saved to gallery
        </p>
      </div>
    </div>
  )
}
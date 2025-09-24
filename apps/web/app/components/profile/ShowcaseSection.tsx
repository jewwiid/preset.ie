'use client'

import { useState, useEffect } from 'react'
import { Plus, Heart, Eye } from 'lucide-react'
import CreateShowcaseModal from '../CreateShowcaseModal'

interface ProfileShowcaseSectionProps {
  userId: string
  isOwnProfile: boolean
}

export default function ProfileShowcaseSection({ 
  userId, 
  isOwnProfile 
}: ProfileShowcaseSectionProps) {
  const [showcases, setShowcases] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserShowcases()
  }, [userId])

  const fetchUserShowcases = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/showcases`)
      const data = await response.json()
      setShowcases(data.showcases)
    } catch (error) {
      console.error('Failed to fetch user showcases:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Showcases</h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Create Showcase</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : showcases.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isOwnProfile ? 'No showcases yet' : 'No showcases'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isOwnProfile 
              ? 'Create your first showcase from your enhanced moodboard photos'
              : 'This user hasn\'t created any showcases yet'
            }
          </p>
          {isOwnProfile && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary/90"
            >
              Create Your First Showcase
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcases.map((showcase) => (
            <ShowcaseCard key={showcase.id} showcase={showcase} />
          ))}
        </div>
      )}

      <CreateShowcaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchUserShowcases()
          // Redirect to showcases page
          window.location.href = `/showcases`
        }}
      />
    </div>
  )
}

function ShowcaseCard({ showcase }: { showcase: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Media Grid */}
      <div className="grid grid-cols-2 gap-1 p-2">
        {showcase.media?.slice(0, 4).map((media: any, index: number) => (
          <div 
            key={`${media.id}-${index}`}
            className={`relative ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
          >
            <img
              src={media.url}
              alt={media.caption || ''}
              className="w-full h-32 object-cover rounded"
            />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
          {showcase.title}
        </h3>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{showcase.likes_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{showcase.views_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Star, Eye, Calendar, User, Camera } from 'lucide-react'

interface Showcase {
  id: string
  title: string
  description: string
  created_at: string
  creator_user_id: string
  talent_user_id: string
  media_urls: string[]
  tags: string[]
  likes_count: number
  views_count: number
  creator_profile?: {
    display_name: string
    handle: string
  }
  talent_profile?: {
    display_name: string
    handle: string
  }
}

export default function ShowcasesPage() {
  const { user } = useAuth()
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my-creations' | 'my-appearances'>('all')

  useEffect(() => {
    fetchShowcases()
  }, [filter, user])

  const fetchShowcases = async () => {
    try {
      let query = supabase
        .from('showcases')
        .select(`
          *,
          creator_profile:creator_user_id(display_name, handle),
          talent_profile:talent_user_id(display_name, handle)
        `)
        .eq('visibility', 'PUBLIC')
        .order('created_at', { ascending: false })

      if (user && filter === 'my-creations') {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          query = query.eq('creator_user_id', profile.id)
        }
      } else if (user && filter === 'my-appearances') {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          query = query.eq('talent_user_id', profile.id)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching showcases:', error)
        setShowcases([])
      } else {
        setShowcases(data || [])
      }
    } catch (error) {
      console.error('Error fetching showcases:', error)
      setShowcases([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading showcases...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Showcases</h1>
          <p className="text-gray-600">Discover amazing creative collaborations from our community</p>
        </div>

        {/* Filters */}
        {user && (
          <div className="mb-6">
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Showcases
              </button>
              <button
                onClick={() => setFilter('my-creations')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'my-creations'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Creations
              </button>
              <button
                onClick={() => setFilter('my-appearances')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'my-appearances'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Appearances
              </button>
            </div>
          </div>
        )}

        {/* Showcases Grid */}
        {showcases.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No showcases found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "Be the first to create and share a showcase!" 
                : "You don't have any showcases in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcases.map((showcase) => (
              <div key={showcase.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Placeholder for showcase image */}
                <div className="h-48 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-white opacity-50" />
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {showcase.title || 'Untitled Showcase'}
                  </h3>
                  
                  {showcase.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {showcase.description}
                    </p>
                  )}
                  
                  {/* Collaborators */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{showcase.creator_profile?.display_name || 'Unknown'}</span>
                    </div>
                    {showcase.talent_profile && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{showcase.talent_profile.display_name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {showcase.tags && showcase.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {showcase.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{showcase.views_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>{showcase.likes_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(showcase.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
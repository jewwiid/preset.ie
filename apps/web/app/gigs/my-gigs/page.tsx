'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { Plus, Edit, Eye, Calendar, MapPin, Users, Loader2 } from 'lucide-react'

interface Gig {
  id: string
  title: string
  description: string
  purpose?: string
  comp_type: string
  location_text: string
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  status: string
  created_at: string
  application_count?: number
}

export default function MyGigsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all')

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    fetchMyGigs()
  }, [user, filter])

  const fetchMyGigs = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        console.error('Profile not found')
        return
      }

      // Build query
      let query = supabase
        .from('gigs')
        .select('*')
        .eq('owner_user_id', profile.id)
        .order('created_at', { ascending: false })

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('status', filter.toUpperCase())
      }

      const { data: gigsData, error } = await query

      if (error) throw error

      // Get application counts for each gig
      const gigsWithCounts = await Promise.all(
        (gigsData || []).map(async (gig) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('gig_id', gig.id)
          
          return {
            ...gig,
            application_count: count || 0
          }
        })
      )

      setGigs(gigsWithCounts)
    } catch (error) {
      console.error('Error fetching gigs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompType = (type: string) => {
    const types: Record<string, string> = {
      'TFP': 'Time for Prints',
      'PAID': 'Paid',
      'EXPENSES': 'Expenses Covered',
      'OTHER': 'Other'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Gigs</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your created gigs</p>
            </div>
            <button
              onClick={() => router.push('/gigs/create')}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Gig
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2">
          {['all', 'draft', 'published', 'closed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Gigs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {gigs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't created any gigs yet." 
                : `You don't have any ${filter} gigs.`}
            </p>
            <button
              onClick={() => router.push('/gigs/create')}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Gig
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {gigs.map((gig) => {
              const isPastDeadline = new Date(gig.application_deadline) < new Date()
              
              return (
                <div key={gig.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{gig.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gig.status)}`}>
                            {gig.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{gig.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {gig.location_text}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(gig.start_time)}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {gig.application_count}/{gig.max_applicants} applicants
                          </span>
                          <span>{getCompType(gig.comp_type)}</span>
                        </div>
                        
                        {isPastDeadline && gig.status === 'PUBLISHED' && (
                          <div className="mt-2 text-sm text-orange-600">
                            ⚠️ Applications closed (deadline passed)
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => router.push(`/gigs/${gig.id}`)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/gigs/${gig.id}/edit`)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {gig.application_count && gig.application_count > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={() => router.push(`/gigs/${gig.id}/applications`)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View {gig.application_count} application{gig.application_count !== 1 ? 's' : ''} →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
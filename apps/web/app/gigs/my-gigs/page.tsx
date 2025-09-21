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
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        console.log('No profile found - user has no gigs yet')
        setGigs([])
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
          if (!supabase) {
            return {
              ...gig,
              applicationCount: 0
            }
          }

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
        return 'bg-primary-100 text-primary-800'
      case 'draft':
        return 'bg-muted text-muted-foreground'
      case 'closed':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-muted text-muted-foreground'
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Gigs</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your created gigs</p>
            </div>
            <button
              onClick={() => router.push('/gigs/create')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary/90"
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-card text-foreground hover:bg-muted'
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
          <div className="bg-card rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No gigs found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? "You haven't created any gigs yet." 
                : `You don't have any ${filter} gigs.`}
            </p>
            <button
              onClick={() => router.push('/gigs/create')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary/90"
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
                <div key={gig.id} className="bg-card rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{gig.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gig.status)}`}>
                            {gig.status}
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">{gig.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/gigs/${gig.id}/edit`)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
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
                          className="text-sm text-primary-600 hover:text-primary/80 font-medium"
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
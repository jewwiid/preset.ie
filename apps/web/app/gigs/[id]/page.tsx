'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import MoodboardViewer from '../../components/MoodboardViewer'

interface GigDetails {
  id: string
  title: string
  description: string
  purpose?: string
  comp_type: string
  usage_rights: string
  location_text: string
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  status: string
  created_at: string
  owner_user_id: string
  users_profile?: {
    display_name: string
    handle: string
    city?: string
    style_tags: string[]
  }
}

export default function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const [gig, setGig] = useState<GigDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Unwrap params with React.use() for Next.js 15
  const resolvedParams = use(params)
  const gigId = resolvedParams.id

  useEffect(() => {
    fetchGigDetails()
    if (user) {
      fetchUserProfile()
    }
  }, [gigId, user])

  const fetchUserProfile = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setUserProfile(data)
    }
  }

  const fetchGigDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Validate gigId
      if (!gigId) {
        throw new Error('No gig ID provided')
      }
      
      console.log('Fetching gig with ID:', gigId)
      
      // First fetch the gig details
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', gigId)
        .single()

      if (gigError) {
        console.error('Supabase error fetching gig:', gigError)
        throw new Error(gigError.message || 'Failed to fetch gig')
      }

      if (!gigData) {
        throw new Error('Gig not found')
      }

      console.log('Gig data fetched:', gigData.title)

      // Then fetch the owner's profile separately
      if (gigData.owner_user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .select('display_name, handle, city, style_tags')
          .eq('id', gigData.owner_user_id)
          .single()

        if (profileError) {
          console.warn('Could not fetch owner profile:', profileError.message)
        } else if (profileData) {
          // Combine the data
          gigData.users_profile = profileData
        }
      }

      setGig(gigData)
    } catch (err: any) {
      console.error('Error in fetchGigDetails:', {
        error: err,
        message: err?.message,
        gigId: gigId
      })
      setError(err?.message || 'Failed to load gig')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCompensationType = (type: string) => {
    const types: Record<string, string> = {
      'TFP': 'Time for Prints/Portfolio',
      'PAID': 'Paid',
      'EXPENSES': 'Expenses Covered',
      'OTHER': 'Other (see description)'
    }
    return types[type] || type
  }

  const getPurposeLabel = (purpose?: string) => {
    if (!purpose) return 'Not specified'
    const purposes: Record<string, string> = {
      'PORTFOLIO': 'Portfolio Building',
      'COMMERCIAL': 'Commercial',
      'EDITORIAL': 'Editorial',
      'FASHION': 'Fashion',
      'BEAUTY': 'Beauty',
      'LIFESTYLE': 'Lifestyle',
      'WEDDING': 'Wedding',
      'EVENT': 'Event',
      'PRODUCT': 'Product',
      'ARCHITECTURE': 'Architecture',
      'STREET': 'Street',
      'CONCEPTUAL': 'Conceptual',
      'OTHER': 'Other'
    }
    return purposes[purpose] || purpose
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gig not found</h2>
          <p className="text-gray-600 mb-4">{error || 'This gig may have been removed or does not exist.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isOwner = userProfile?.id === gig.owner_user_id
  const isTalent = userProfile?.role_flags?.includes('TALENT')
  const applicationDeadlinePassed = new Date(gig.application_deadline) < new Date()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{gig.title}</h1>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <span>Posted by {gig.users_profile?.display_name || 'Unknown'}</span>
                {gig.users_profile?.handle && (
                  <span>@{gig.users_profile.handle}</span>
                )}
                {gig.users_profile?.city && (
                  <span className="text-gray-500">Based in: {gig.users_profile.city}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                gig.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                gig.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {gig.status}
              </span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Compensation</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{getCompensationType(gig.comp_type)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Purpose</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{getPurposeLabel(gig.purpose)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Usage Rights</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{gig.usage_rights}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Shoot Location</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">📍 {gig.location_text}</p>
            </div>
          </div>
        </div>

        {/* Moodboard */}
        <MoodboardViewer gigId={gigId} />

        {/* Description */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About this Gig</h2>
          <div className="prose max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{gig.description}</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Shoot Date & Time</h3>
              <p className="mt-1 text-gray-900">
                <span className="font-medium">Starts:</span> {formatDate(gig.start_time)}
              </p>
              <p className="mt-1 text-gray-900">
                <span className="font-medium">Ends:</span> {formatDate(gig.end_time)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Application Deadline</h3>
              <p className="mt-1 text-gray-900">
                {formatDate(gig.application_deadline)}
                {applicationDeadlinePassed && (
                  <span className="ml-2 text-red-600 text-sm">(Applications closed)</span>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Max Applicants</h3>
              <p className="mt-1 text-gray-900">{gig.max_applicants} spots available</p>
            </div>
          </div>
        </div>

        {/* Contributor Styles */}
        {gig.users_profile?.style_tags && gig.users_profile.style_tags.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contributor's Style</h2>
            <div className="flex flex-wrap gap-2">
              {gig.users_profile.style_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            
            <div className="space-x-3">
              {isOwner && (
                <>
                  <button 
                    onClick={() => router.push(`/gigs/${gigId}/edit`)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Edit Gig
                  </button>
                  <button 
                    onClick={() => router.push(`/gigs/${gigId}/applications`)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    View Applications
                  </button>
                </>
              )}
              
              {!isOwner && isTalent && !applicationDeadlinePassed && (
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                  Apply to this Gig
                </button>
              )}
              
              {!user && (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Sign in to Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
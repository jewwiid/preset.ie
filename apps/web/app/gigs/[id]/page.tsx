'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import MoodboardViewer from '../../components/MoodboardViewer'
import CompatibilityScore from '../../components/matchmaking/CompatibilityScore'
import MatchmakingCard from '../../components/matchmaking/MatchmakingCard'
import CompatibilityBreakdownModal from '../../components/matchmaking/CompatibilityBreakdownModal'
import { CompatibilityData, Recommendation } from '../../../lib/types/matchmaking'

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
  
  // Matchmaking state
  const [compatibilityData, setCompatibilityData] = useState<CompatibilityData | null>(null)
  const [similarUsers, setSimilarUsers] = useState<Recommendation[]>([])
  const [similarGigs, setSimilarGigs] = useState<Recommendation[]>([])
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false)
  const [matchmakingLoading, setMatchmakingLoading] = useState(false)
  
  // Unwrap params with React.use() for Next.js 15
  const resolvedParams = use(params)
  const gigId = resolvedParams.id

  useEffect(() => {
    fetchGigDetails()
    if (user) {
      fetchUserProfile()
    }
  }, [gigId, user])

  useEffect(() => {
    if (gig && userProfile) {
      fetchMatchmakingData()
    }
  }, [gig, userProfile])

  const fetchUserProfile = async () => {
    if (!user) return
    
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setUserProfile(data)
    }
  }

  const fetchMatchmakingData = async () => {
    if (!gig || !userProfile || !supabase) return

    try {
      setMatchmakingLoading(true)

      // Fetch compatibility score for current user
      const { data: compatibilityResult, error: compatibilityError } = await supabase
        .rpc('calculate_gig_compatibility', {
          p_profile_id: userProfile.id,
          p_gig_id: gig.id
        })

      if (compatibilityError) {
        console.error('Error fetching compatibility:', compatibilityError)
      } else if (compatibilityResult && compatibilityResult.length > 0) {
        const result = compatibilityResult[0]
        setCompatibilityData({
          score: result.compatibility_score,
          breakdown: {
            gender: result.match_factors.gender_match ? 20 : 0,
            age: result.match_factors.age_match ? 20 : 0,
            height: result.match_factors.height_match ? 15 : 0,
            experience: result.match_factors.experience_match ? 25 : 0,
            specialization: typeof result.match_factors.specialization_match === 'number' ? 
              (result.match_factors.specialization_match / result.match_factors.total_required) * 20 : 
              result.match_factors.specialization_match ? 20 : 0,
            total: result.compatibility_score
          },
          factors: result.match_factors
        })
      }

      // Fetch similar users (compatible talent for this gig)
      const { data: usersResult, error: usersError } = await supabase
        .rpc('find_compatible_users_for_gig', {
          p_gig_id: gig.id,
          p_limit: 6
        })

      if (usersError) {
        console.error('Error fetching similar users:', usersError)
      } else if (usersResult) {
        setSimilarUsers(usersResult.map((user: any) => ({
          id: user.profile_id,
          type: 'user' as const,
          data: {
            id: user.profile_id,
            user_id: user.profile_id,
            display_name: user.display_name,
            handle: user.display_name.toLowerCase().replace(/\s+/g, ''),
            city: user.city,
            country: 'Unknown',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          compatibility_score: user.compatibility_score,
          compatibility_breakdown: {
            gender: user.match_factors.gender_match ? 20 : 0,
            age: user.match_factors.age_match ? 20 : 0,
            height: user.match_factors.height_match ? 15 : 0,
            experience: user.match_factors.experience_match ? 25 : 0,
            specialization: typeof user.match_factors.specialization_match === 'number' ? 
              (user.match_factors.specialization_match / user.match_factors.total_required) * 20 : 
              user.match_factors.specialization_match ? 20 : 0,
            total: user.compatibility_score
          },
          reason: 'Matches gig requirements',
          priority: user.compatibility_score >= 80 ? 'high' as const : 
                   user.compatibility_score >= 60 ? 'medium' as const : 'low' as const
        })))
      }

      // Fetch similar gigs (compatible gigs for current user)
      const { data: gigsResult, error: gigsError } = await supabase
        .rpc('find_compatible_gigs_for_user', {
          p_profile_id: userProfile.id,
          p_limit: 6
        })

      if (gigsError) {
        console.error('Error fetching similar gigs:', gigsError)
      } else if (gigsResult) {
        setSimilarGigs(gigsResult.map((gig: any) => ({
          id: gig.gig_id,
          type: 'gig' as const,
          data: {
            id: gig.gig_id,
            title: gig.title,
            description: 'Similar gig based on your profile',
            location_text: gig.location_text,
            start_time: gig.start_time,
            end_time: gig.start_time, // We don't have end_time from the function
            comp_type: 'TFP', // Default value
            owner_user_id: 'unknown',
            status: 'PUBLISHED',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          compatibility_score: gig.compatibility_score,
          compatibility_breakdown: {
            gender: gig.match_factors.gender_match ? 20 : 0,
            age: gig.match_factors.age_match ? 20 : 0,
            height: gig.match_factors.height_match ? 15 : 0,
            experience: gig.match_factors.experience_match ? 25 : 0,
            specialization: typeof gig.match_factors.specialization_match === 'number' ? 
              (gig.match_factors.specialization_match / gig.match_factors.total_required) * 20 : 
              gig.match_factors.specialization_match ? 20 : 0,
            total: gig.compatibility_score
          },
          reason: 'Matches your profile',
          priority: gig.compatibility_score >= 80 ? 'high' as const : 
                   gig.compatibility_score >= 60 ? 'medium' as const : 'low' as const
        })))
      }

    } catch (error) {
      console.error('Error in fetchMatchmakingData:', error)
    } finally {
      setMatchmakingLoading(false)
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
      
      if (!supabase) {
        console.error('Supabase client not available')
        throw new Error('Database connection not available')
      }

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

        {/* Compatibility Score Section */}
        {user && userProfile && compatibilityData && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Compatibility</h2>
              <button
                onClick={() => setShowCompatibilityModal(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View Details
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <CompatibilityScore 
                score={compatibilityData.score}
                breakdown={compatibilityData.breakdown}
                size="lg"
                showBreakdown={true}
              />
              <div className="text-sm text-gray-600">
                <p>Based on your profile and this gig's requirements</p>
                <p className="text-xs text-gray-500 mt-1">
                  {compatibilityData.score >= 80 ? 'Excellent match!' :
                   compatibilityData.score >= 60 ? 'Good match' :
                   compatibilityData.score >= 40 ? 'Fair match' : 'Consider improving your profile'}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Similar Users Section */}
        {similarUsers.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Talent</h2>
            <p className="text-sm text-gray-600 mb-4">
              Other users who match this gig's requirements
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarUsers.map((user) => (
                <MatchmakingCard
                  key={user.id}
                  type={user.type}
                  data={user.data}
                  compatibilityScore={user.compatibility_score}
                  compatibilityBreakdown={user.compatibility_breakdown}
                  onViewDetails={() => router.push(`/profile/${user.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Similar Gigs Section */}
        {similarGigs.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Gigs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Other gigs that match your profile
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarGigs.map((gig) => (
                <MatchmakingCard
                  key={gig.id}
                  type={gig.type}
                  data={gig.data}
                  compatibilityScore={gig.compatibility_score}
                  compatibilityBreakdown={gig.compatibility_breakdown}
                  onViewDetails={() => router.push(`/gigs/${gig.id}`)}
                />
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

      {/* Compatibility Breakdown Modal */}
      {showCompatibilityModal && compatibilityData && (
        <CompatibilityBreakdownModal
          isOpen={showCompatibilityModal}
          onClose={() => setShowCompatibilityModal(false)}
          compatibilityData={compatibilityData}
          userProfile={userProfile}
          gig={{
            ...gig,
            updated_at: gig.created_at // Use created_at as updated_at since we don't have it
          }}
        />
      )}
    </div>
  )
}
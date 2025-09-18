'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User, Target, TrendingUp, Users } from 'lucide-react'
import CompatibilityScore from '../components/matchmaking/CompatibilityScore'
import MatchmakingCard from '../components/matchmaking/MatchmakingCard'
import MarketplaceNotifications from '@/components/marketplace/MarketplaceNotifications'
import { CompatibilityData, Recommendation } from '../../lib/types/matchmaking'
import SavedMediaGallery from '../components/playground/SavedImagesGallery'
// Simplified credit calculation
const calculateCreditValue = (credits: number) => credits * 0.01; // Mock calculation

// Profile completion calculation
const calculateProfileCompletion = (profile: UserProfile): { percentage: number; missingFields: string[] } => {
  const fields = [
    { key: 'bio', label: 'Bio', weight: 5 },
    { key: 'city', label: 'Location', weight: 5 },
    { key: 'country', label: 'Country', weight: 3 },
    { key: 'phone_number', label: 'Phone Number', weight: 3 },
    { key: 'instagram_handle', label: 'Instagram', weight: 2 },
    { key: 'tiktok_handle', label: 'TikTok', weight: 2 },
    { key: 'website_url', label: 'Website', weight: 3 },
    { key: 'portfolio_url', label: 'Portfolio', weight: 5 },
    { key: 'years_experience', label: 'Experience', weight: 8 },
    { key: 'specializations', label: 'Specializations', weight: 10 },
    { key: 'equipment_list', label: 'Equipment', weight: 5 },
    { key: 'editing_software', label: 'Software', weight: 5 },
    { key: 'languages', label: 'Languages', weight: 3 },
    { key: 'hourly_rate_min', label: 'Rate Range', weight: 8 },
    { key: 'available_for_travel', label: 'Travel Availability', weight: 3 },
    { key: 'has_studio', label: 'Studio Info', weight: 3 },
    { key: 'typical_turnaround_days', label: 'Turnaround Time', weight: 3 },
    
    // New demographic fields
    { key: 'gender_identity', label: 'Gender Identity', weight: 3 },
    { key: 'ethnicity', label: 'Ethnicity', weight: 2 },
    { key: 'nationality', label: 'Nationality', weight: 2 },
    { key: 'body_type', label: 'Body Type', weight: 3 },
    { key: 'experience_level', label: 'Experience Level', weight: 5 },
    { key: 'state_province', label: 'State/Province', weight: 2 },
    { key: 'availability_status', label: 'Availability Status', weight: 4 },
    
    // Work preferences
    { key: 'accepts_tfp', label: 'TFP Acceptance', weight: 3 },
    { key: 'prefers_studio', label: 'Studio Preference', weight: 2 },
    { key: 'prefers_outdoor', label: 'Outdoor Preference', weight: 2 },
    { key: 'available_weekdays', label: 'Weekday Availability', weight: 2 },
    { key: 'available_weekends', label: 'Weekend Availability', weight: 2 },
    { key: 'works_with_teams', label: 'Team Work Preference', weight: 2 }
  ];

  let completedWeight = 0;
  let totalWeight = 0;
  const missingFields: string[] = [];

  fields.forEach(field => {
    totalWeight += field.weight;
    const value = profile[field.key as keyof UserProfile];
    
    if (value !== undefined && value !== null && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      completedWeight += field.weight;
    } else {
      missingFields.push(field.label);
    }
  });

  return {
    percentage: Math.round((completedWeight / totalWeight) * 100),
    missingFields
  };
};

interface UserProfile {
  id: string
  display_name: string
  handle: string
  bio?: string
  city?: string
  country?: string
  age_verified?: boolean
  account_status?: string
  phone_number?: string
  instagram_handle?: string
  tiktok_handle?: string
  website_url?: string
  portfolio_url?: string
  years_experience?: number
  specializations?: string[]
  equipment_list?: string[]
  editing_software?: string[]
  languages?: string[]
  hourly_rate_min?: number
  hourly_rate_max?: number
  available_for_travel?: boolean
  travel_radius_km?: number
  studio_name?: string
  has_studio?: boolean
  studio_address?: string
  typical_turnaround_days?: number
  height_cm?: number
  measurements?: string
  eye_color?: string
  hair_color?: string
  shoe_size?: string
  clothing_sizes?: string
  tattoos?: boolean
  piercings?: boolean
  talent_categories?: string[]
  role_flags: string[]
  style_tags: string[]
  subscription_tier: string
  verification_status: string
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string // JSON string of BannerPosition
  
  // New demographic fields from migration
  gender_identity?: 'male' | 'female' | 'non_binary' | 'genderfluid' | 'agender' | 'transgender_male' | 'transgender_female' | 'prefer_not_to_say' | 'other'
  ethnicity?: 'african_american' | 'asian' | 'caucasian' | 'hispanic_latino' | 'middle_eastern' | 'native_american' | 'pacific_islander' | 'mixed_race' | 'other' | 'prefer_not_to_say'
  nationality?: string
  weight_kg?: number
  body_type?: 'petite' | 'slim' | 'athletic' | 'average' | 'curvy' | 'plus_size' | 'muscular' | 'tall' | 'short' | 'other'
  hair_length?: string
  skin_tone?: string
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'expert'
  state_province?: string
  timezone?: string
  passport_valid?: boolean
  availability_status?: 'available' | 'busy' | 'unavailable' | 'limited' | 'weekends_only' | 'weekdays_only'
  preferred_working_hours?: string
  blackout_dates?: string[]
  
  // Privacy controls
  show_age?: boolean
  show_location?: boolean
  show_physical_attributes?: boolean
  
  // Work preferences
  accepts_tfp?: boolean
  accepts_expenses_only?: boolean
  prefers_studio?: boolean
  prefers_outdoor?: boolean
  available_weekdays?: boolean
  available_weekends?: boolean
  available_evenings?: boolean
  available_overnight?: boolean
  works_with_teams?: boolean
  prefers_solo_work?: boolean
  comfortable_with_nudity?: boolean
  comfortable_with_intimate_content?: boolean
  requires_model_release?: boolean
}

interface BannerPosition {
  y: number
  scale: number
}

interface RecentGig {
  id: string
  title: string
  description: string
  comp_type: string
  location_text: string
  created_at: string
  status: string
}

export default function Dashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentGigs, setRecentGigs] = useState<RecentGig[]>([])
  const [stats, setStats] = useState({
    totalGigs: 0,
    totalApplications: 0,
    totalShowcases: 0,
    totalMessages: 0
  })
  const [credits, setCredits] = useState({
    current_balance: 0,
    monthly_allowance: 0,
    consumed_this_month: 0
  })
  const [isRecentGigsExpanded, setIsRecentGigsExpanded] = useState(false)
  
  // Matchmaking state
  const [matchmakingData, setMatchmakingData] = useState({
    topCompatibleGigs: [] as Recommendation[],
    topCompatibleUsers: [] as Recommendation[],
    averageCompatibility: 0,
    totalMatches: 0
  })
  const [matchmakingLoading, setMatchmakingLoading] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered:', {
      authLoading,
      hasUser: !!user,
      userId: user?.id
    })

    if (!authLoading && !user) {
      console.log('🔀 No user found, redirecting to signin')
      router.push('/auth/signin')
      return
    }

    if (user) {
      console.log('✅ User found, fetching profile...')
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    if (!user) {
      console.log('🚫 fetchProfile: No user available')
      return
    }

    console.log('👤 fetchProfile: Starting profile fetch for user:', user.id)

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('❌ Profile fetch error:', error)
        // If no profile exists, redirect to create profile
        if (error.code === 'PGRST116') {
          console.log('🔀 No profile found, redirecting to create-profile')
          router.push('/auth/create-profile')
          return
        }
        console.error('Error fetching profile:', error)
      } else {
        console.log('✅ Profile fetched successfully:', data)
        setProfile(data)
        // Load additional data after profile is set
        console.log('📊 Starting dashboard data load...')
        await loadDashboardData(data) // Pass profile directly to avoid state race condition
      }
    } catch (err) {
      console.error('💥 fetchProfile exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (profileData?: UserProfile) => {
    const currentProfile = profileData || profile
    if (!user || !currentProfile) {
      console.log('🚫 loadDashboardData: Missing user or profile:', { hasUser: !!user, hasProfile: !!currentProfile })
      return
    }

    const isContributor = userRole?.isContributor || currentProfile.role_flags?.includes('CONTRIBUTOR') || currentProfile.role_flags?.includes('BOTH')
    const isTalent = userRole?.isTalent || currentProfile.role_flags?.includes('TALENT') || currentProfile.role_flags?.includes('BOTH')
    
    console.log('🔍 Dashboard Debug:', {
      userId: user.id,
      userRole: userRole,
      profileRoleFlags: currentProfile.role_flags,
      isContributor,
      isTalent
    })

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      // Debug: Check what gigs exist in the database first
      const { data: allGigs, error: allGigsError } = await supabase
        .from('gigs')
        .select('id, title, owner_user_id')
        .order('created_at', { ascending: false })
        
      console.log('🔍 All gigs in database:', allGigs)
      console.log('🔍 Current user ID:', user.id)
      console.log('🔍 Looking for gigs with owner_user_id:', user.id)
      
      // Debug: Show the actual owner_user_id values from all gigs
      if (allGigs) {
        allGigs.forEach((gig, index) => {
          console.log(`🔍 Gig ${index + 1}: "${gig.title}" owner_user_id: "${gig.owner_user_id}"`)
          console.log(`🔍 Does "${gig.owner_user_id}" === "${user.id}"?`, gig.owner_user_id === user.id)
        })
      }
      
      // Load recent gigs - for contributors show their own, for talent show published gigs
      let gigsQuery = supabase
        .from('gigs')
        .select('id, title, description, comp_type, location_text, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3)

      if (isContributor) {
        gigsQuery = gigsQuery.eq('owner_user_id', user.id)
        console.log('🔍 Filtering gigs for contributor with user.id:', user.id)
      } else {
        gigsQuery = gigsQuery.eq('status', 'published')
        console.log('🔍 Filtering gigs for talent with status: published')
      }

      const { data: gigs, error: gigsError } = await gigsQuery

      if (gigsError) {
        console.error('❌ Error fetching gigs:', {
          message: gigsError?.message || 'No message',
          code: gigsError?.code || 'No code',
          details: gigsError?.details || 'No details',
          hint: gigsError?.hint || 'No hint',
          fullError: gigsError,
          errorType: typeof gigsError,
          errorKeys: gigsError ? Object.keys(gigsError) : 'No keys',
          errorStringified: JSON.stringify(gigsError)
        })
      } else {
        console.log('✅ Fetched filtered gigs:', gigs)
        setRecentGigs(gigs || [])
      }

      // Load real user statistics
      const statsPromises = []

      // Count user's gigs (if contributor)
      if (isContributor) {
        console.log('🔢 Counting gigs for contributor user.id:', user.id)
        const gigsCountQuery = supabase
          .from('gigs')
          .select('id', { count: 'exact' })
          .eq('owner_user_id', user.id)
        statsPromises.push(gigsCountQuery)
      } else {
        console.log('🔢 Not a contributor, setting gigs count to 0')
        statsPromises.push(Promise.resolve({ count: 0 }))
      }

      // Count user's applications (if talent)
      if (isTalent) {
        statsPromises.push(
          supabase
            .from('applications')
            .select('id', { count: 'exact' })
            .eq('applicant_user_id', user.id)
        )
      } else {
        statsPromises.push(Promise.resolve({ count: 0 }))
      }

      // Count user's showcases
      statsPromises.push(
        supabase
          .from('showcases')
          .select('id', { count: 'exact' })
          .or(`creator_user_id.eq.${user.id},talent_user_id.eq.${user.id}`)
      )

      // Count user's messages (both sent and received)
      statsPromises.push(
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      )

      // Also fetch user credits with proper error handling
      const creditsQuery = supabase
        .from('user_credits')
        .select('current_balance, monthly_allowance, consumed_this_month')
        .eq('user_id', user.id)
        .maybeSingle() // Use maybeSingle instead of single to handle missing records

      const [gigsCount, applicationsCount, showcasesCount, messagesCount, userCredits] = await Promise.all([
        ...statsPromises,
        creditsQuery
      ])

      console.log('📊 Stats results:', {
        gigsCount: gigsCount.count || 0,
        applicationsCount: applicationsCount.count || 0,
        showcasesCount: showcasesCount.count || 0,
        messagesCount: messagesCount.count || 0,
        userCredits: 'data' in userCredits ? userCredits.data : null
      })

      // Always use real database results - no fallback
      setStats({
        totalGigs: gigsCount.count || 0,
        totalApplications: applicationsCount.count || 0,
        totalShowcases: showcasesCount.count || 0,
        totalMessages: messagesCount.count || 0
      })

      // Set credits data with proper null checking
      if ('data' in userCredits && userCredits.data && 'current_balance' in userCredits.data) {
        setCredits({
          current_balance: userCredits.data.current_balance || 0,
          monthly_allowance: userCredits.data.monthly_allowance || 0,
          consumed_this_month: userCredits.data.consumed_this_month || 0
        })
      } else {
        // Initialize credits for new user
        const { data: profile } = await supabase
          .from('users_profile')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .single()
        
        const tier = profile?.subscription_tier || 'free'
        const allowance = tier === 'pro' ? 25 : tier === 'plus' ? 10 : 0
        
        // Create credit record
        await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            subscription_tier: tier,
            monthly_allowance: allowance,
            current_balance: allowance,
            consumed_this_month: 0,
            last_reset_at: new Date().toISOString()
          })
        
        setCredits({
          current_balance: allowance,
          monthly_allowance: allowance,
          consumed_this_month: 0
        })
      }

        console.log('✅ Dashboard data loaded successfully with real database results')
        
        // Load matchmaking data
        await loadMatchmakingData(currentProfile)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
  }

  const loadMatchmakingData = async (profileData: UserProfile) => {
    if (!user || !profileData || !supabase) return

    try {
      setMatchmakingLoading(true)
      const isTalent = userRole?.isTalent || profileData.role_flags?.includes('TALENT') || profileData.role_flags?.includes('BOTH')
      const isContributor = userRole?.isContributor || profileData.role_flags?.includes('CONTRIBUTOR') || profileData.role_flags?.includes('BOTH')

      // For talent users, get compatible gigs
      if (isTalent) {
        const { data: compatibleGigs, error: gigsError } = await supabase
          .rpc('find_compatible_gigs_for_user', {
            p_profile_id: profileData.id,
            p_limit: 3
          })

        if (gigsError && gigsError.code === 'PGRST202') {
          // Function doesn't exist, use fallback query
          console.log('⚠️ Matchmaking function not found, using fallback query')
          const { data: fallbackGigs, error: fallbackError } = await supabase
            .from('gigs')
            .select('*')
            .eq('status', 'PUBLISHED')
            .order('created_at', { ascending: false })
            .limit(3)

          if (!fallbackError && fallbackGigs) {
            const gigRecommendations = fallbackGigs.map((gig: any) => ({
              id: gig.id,
              type: 'gig' as const,
              data: gig,
              compatibility_score: 75, // Default score
              compatibility_breakdown: {
                gender: 20,
                age: 20,
                height: 15,
                experience: 25,
                specialization: 20,
                total: 75
              },
              reason: 'Recent gigs (fallback)',
              priority: 'medium' as const
            }))

            setMatchmakingData(prev => ({
              ...prev,
              topCompatibleGigs: gigRecommendations,
              averageCompatibility: 75,
              totalMatches: gigRecommendations.length
            }))
          }
        } else if (!gigsError && compatibleGigs) {
          const gigRecommendations = compatibleGigs.map((gig: any) => ({
            id: gig.gig_id,
            type: 'gig' as const,
            data: {
              id: gig.gig_id,
              title: gig.title,
              description: 'Compatible gig based on your profile',
              location_text: gig.location_text,
              start_time: gig.start_time,
              end_time: gig.start_time,
              comp_type: 'TFP',
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
          }))

          setMatchmakingData(prev => ({
            ...prev,
            topCompatibleGigs: gigRecommendations,
            averageCompatibility: gigRecommendations.length > 0 ? 
              gigRecommendations.reduce((sum: number, gig: Recommendation) => sum + gig.compatibility_score, 0) / gigRecommendations.length : 0,
            totalMatches: gigRecommendations.length
          }))
        }
      }

      // For contributors, get compatible users
      if (isContributor) {
        // Get compatible users for recent gigs
        const { data: recentGigs } = await supabase
          .from('gigs')
          .select('id')
          .eq('owner_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (recentGigs && recentGigs.length > 0) {
          const { data: compatibleUsers, error: usersError } = await supabase
            .rpc('find_compatible_users_for_gig', {
              p_gig_id: recentGigs[0].id,
              p_limit: 3
            })

          if (!usersError && compatibleUsers) {
            const userRecommendations = compatibleUsers.map((user: any) => ({
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
            }))

            setMatchmakingData(prev => ({
              ...prev,
              topCompatibleUsers: userRecommendations,
              averageCompatibility: userRecommendations.length > 0 ? 
                userRecommendations.reduce((sum: number, user: Recommendation) => sum + user.compatibility_score, 0) / userRecommendations.length : 0,
              totalMatches: userRecommendations.length
            }))
          }
        }
      }

    } catch (error: any) {
      console.error('Error loading matchmaking data:', {
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        fullError: error,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : 'No keys',
        errorStringified: JSON.stringify(error)
      })
    } finally {
      setMatchmakingLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-preset-50 to-white">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-preset-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-preset-500 border-t-transparent absolute top-0"></div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const isContributor = userRole?.isContributor || profile.role_flags?.includes('CONTRIBUTOR') || profile.role_flags?.includes('BOTH')
  const isTalent = userRole?.isTalent || profile.role_flags?.includes('TALENT') || profile.role_flags?.includes('BOTH')
  const isAdmin = userRole?.isAdmin || profile.role_flags?.includes('ADMIN')

  return (
    <div className="min-h-screen bg-gradient-to-br from-preset-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header */}
      <div className="relative overflow-hidden pb-64">
        {/* Custom Banner Background */}
        {profile.header_banner_url ? (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300">
            <img
              src={profile.header_banner_url}
              alt="Header banner"
              className="w-full h-full object-cover transition-transform duration-300"
              style={(() => {
                try {
                  const position: BannerPosition = profile.header_banner_position 
                    ? JSON.parse(profile.header_banner_position) 
                    : { y: 0, scale: 1.2 }
                  return {
                    transform: `translateY(${position.y}px) scale(${position.scale})`,
                    transformOrigin: 'center center'
                  }
                } catch {
                  return {}
                }
              })()}
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-preset-500 to-preset-600">
            <div className="absolute inset-0 bg-gradient-to-r from-preset-600/90 to-preset-500/90"></div>
          </div>
        )}
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Mobile-first layout: buttons first, then welcome message */}
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:justify-between lg:items-start">
            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-wrap gap-2 lg:order-2">
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all flex-shrink-0"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => router.push('/profile')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0"
              >
                Profile Settings
              </button>
              <button
                onClick={handleSignOut}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all flex-shrink-0"
              >
                Sign Out
              </button>
            </div>
            
            {/* Welcome Message - Below buttons on mobile */}
            <div className="text-white lg:order-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                Welcome back, {isAdmin ? 'Admin' : profile.display_name}!
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative -mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Enhanced Profile & Recent Gigs - 2 Column Layout */}
          <div className="mb-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Enhanced Profile & Status Card */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              {/* Profile Header with Avatar Integration */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* User Avatar */}
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.display_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-preset-200 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-preset-400 to-preset-600 rounded-full flex items-center justify-center border-2 border-preset-200 shadow-lg">
                        <span className="text-white font-bold text-xl">
                          {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* User Info & Role */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile.display_name}</h3>
                      <span className="px-3 py-1 bg-gradient-to-r from-preset-500 to-preset-600 text-white text-sm font-bold rounded-full uppercase tracking-wide">
                        {profile.subscription_tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="text-sm">@{profile.handle}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm font-medium">
                          {isContributor && isTalent ? 'Contributor & Talent' : 
                           isContributor ? 'Contributor' : 'Talent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Badge */}
                {(profile.verification_status === 'id_verified' || profile.verification_status === 'fully_verified') && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-preset-50 dark:bg-preset-900/20 text-preset-600 dark:text-preset-400 rounded-lg border border-preset-100 dark:border-preset-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">Verified</span>
                  </div>
                )}
              </div>
              
              {/* Credits & Balance Row - Enhanced Mobile Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button 
                  onClick={() => router.push('/credits/purchase')}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 sm:p-4 border border-green-100 dark:border-green-800/50 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium mb-1 truncate">Available Credits</p>
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <p className="text-gray-900 dark:text-white text-lg sm:text-2xl font-bold">{credits.current_balance}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                          of {credits.monthly_allowance || 'unlimited'}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/credits/purchase')}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 sm:p-4 border border-blue-100 dark:border-blue-800/50 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium mb-1 truncate">Account Balance</p>
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <p className="text-gray-900 dark:text-white text-lg sm:text-2xl font-bold">€{calculateCreditValue(credits.current_balance).toFixed(2)}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">EUR</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Profile Completion Progress */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Profile Completion</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Complete your profile to get more gigs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white text-xl font-bold">{calculateProfileCompletion(profile).percentage}%</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProfileCompletion(profile).percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Missing Fields */}
                  {calculateProfileCompletion(profile).missingFields.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Missing information:</p>
                      <div className="flex flex-wrap gap-1">
                        {calculateProfileCompletion(profile).missingFields.slice(0, 4).map((field, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                          >
                            {field}
                          </span>
                        ))}
                        {calculateProfileCompletion(profile).missingFields.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                            +{calculateProfileCompletion(profile).missingFields.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => router.push('/auth/complete-profile')}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Complete Profile
                  </button>
                </div>
              </div>

              {/* Location Row */}
              {profile.city && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{profile.city}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          
          {/* My Recent Gigs - Second Column */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {isContributor ? 'My Recent Gigs' : 'Recent Gigs'}
                  </h3>
                  {/* Mobile summary when collapsed */}
                  {!isRecentGigsExpanded && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 lg:hidden">
                      {recentGigs.length > 0 
                        ? `${recentGigs.length} recent ${recentGigs.length === 1 ? 'gig' : 'gigs'}` 
                        : 'No recent gigs'
                      }
                    </p>
                  )}
                </div>
              </div>
              
              {/* Mobile expand/collapse button */}
              <button
                onClick={() => setIsRecentGigsExpanded(!isRecentGigsExpanded)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isRecentGigsExpanded ? 'Collapse gigs' : 'Expand gigs'}
              >
                <svg 
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                    isRecentGigsExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className={`space-y-3 transition-all duration-300 ease-in-out overflow-hidden lg:max-h-none lg:opacity-100 ${
              isRecentGigsExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              {recentGigs.length > 0 ? (
                recentGigs.map((gig) => (
                  <div key={gig.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{gig.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{gig.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-preset-600 dark:text-preset-400">{gig.comp_type}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{gig.location_text}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(gig.created_at).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        gig.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {gig.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">
                    {isContributor ? 'No gigs created yet' : 'No recent gigs available'}
                  </p>
                </div>
              )}
              {recentGigs.length > 0 && (
                <button 
                  onClick={() => router.push(isContributor ? '/gigs/my-gigs' : '/gigs')}
                  className="w-full text-center py-3 text-sm text-preset-600 dark:text-preset-400 hover:text-preset-700 dark:hover:text-preset-300 font-medium"
                >
                  {isContributor ? 'View All My Gigs' : 'Browse All Gigs'} →
                </button>
              )}
            </div>
          </div>

          {/* Marketplace Notifications - Third Column */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <MarketplaceNotifications compact={true} limit={5} />
          </div>
            </div>
          </div>

          {/* Experience-Based Suggestions */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Smart Suggestions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Based on your experience and profile</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Experience-based suggestions */}
              {profile.years_experience && profile.years_experience >= 3 && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Premium Creator Status
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        With {profile.years_experience} years of experience, consider applying for premium creator status to access higher-paying gigs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Specialization suggestions */}
              {profile.specializations && profile.specializations.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Specialization Opportunities
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Your specializations in {profile.specializations.slice(0, 2).join(', ')} are in high demand. Consider creating targeted gigs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rate optimization suggestions */}
              {profile.hourly_rate_min && profile.hourly_rate_max && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Rate Optimization
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                        Your rate range (€{profile.hourly_rate_min}-{profile.hourly_rate_max}/hour) is competitive. Consider adjusting based on project complexity.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Travel availability suggestions */}
              {profile.available_for_travel && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Travel Opportunities
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                        Your travel availability (up to {profile.travel_radius_km || 'unlimited'}km) opens up more gig opportunities. Highlight this in your profile.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default suggestion for new users */}
              {(!profile.years_experience || !profile.specializations || profile.specializations.length === 0) && (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl border border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Complete Your Profile
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Add your experience, specializations, and rate information to get personalized suggestions and more gig opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Matchmaking Widgets */}
          {user && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Smart Matches</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {matchmakingData.totalMatches > 0 
                      ? `${matchmakingData.totalMatches} compatible ${matchmakingData.totalMatches === 1 ? 'match' : 'matches'} found`
                      : 'Finding compatible opportunities...'
                    }
                  </p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => router.push('/matchmaking')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>

              {/* Matchmaking Summary */}
              {matchmakingData.averageCompatibility > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          Average Compatibility Score
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-300">
                          Based on your profile and available opportunities
                        </p>
                      </div>
                    </div>
                    <CompatibilityScore 
                      score={Math.round(matchmakingData.averageCompatibility)}
                      size="md"
                    />
                  </div>
                </div>
              )}

              {/* Compatible Gigs for Talent */}
              {matchmakingData.topCompatibleGigs.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                      Recommended Gigs
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchmakingData.topCompatibleGigs.map((gig) => (
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

              {/* Compatible Users for Contributors */}
              {matchmakingData.topCompatibleUsers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                      Recommended Talent
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchmakingData.topCompatibleUsers.map((user) => (
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

              {/* No Matches State */}
              {matchmakingData.topCompatibleGigs.length === 0 && matchmakingData.topCompatibleUsers.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No matches yet</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Complete your profile to get personalized matches and recommendations
                  </p>
                  <button
                    onClick={() => router.push('/matchmaking')}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Explore Matchmaking
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Saved Images Gallery */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">My Saved Images</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Images saved from the playground for use in moodboards, showcases, and profiles</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/playground')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Generate More →
              </button>
            </div>
            
            <SavedMediaGallery
              onMediaSelect={(media) => {
                // Future: Could open a modal to use the media in moodboards, showcases, etc.
                console.log('Selected media for use:', media)
              }}
            />
          </div>

        {/* Stats Overview - Clickable Navigation Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => router.push(isContributor ? '/gigs/my-gigs' : '/gigs')}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-preset-300 dark:hover:border-preset-600 transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Gigs</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalGigs}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/applications')}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Applications</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/showcases')}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Showcases</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalShowcases}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/messages')}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-green-300 dark:hover:border-green-600 transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Messages</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMessages}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          {/* Action Cards - 2 Column Layout on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contributor Actions */}
            {isContributor && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contributor Actions</h3>
                </div>
                <div className="space-y-4">
                  <button 
                    onClick={() => router.push('/gigs/create')}
                    className="group relative overflow-hidden bg-gradient-to-r from-preset-500 to-preset-600 text-white px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg w-full"
                  >
                    <span className="relative z-10">Create New Gig</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-preset-600 to-preset-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => router.push('/gigs/my-gigs')}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-4 rounded-xl font-medium transition-all hover:scale-105"
                    >
                      My Gigs
                    </button>
                    <button 
                      onClick={() => router.push('/applications')}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-4 rounded-xl font-medium transition-all hover:scale-105"
                    >
                      Applications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Talent Actions */}
            {isTalent && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Talent Actions</h3>
                </div>
                <div className="space-y-4">
                  <button 
                    onClick={() => router.push('/gigs')}
                    className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg w-full"
                  >
                    <span className="relative z-10">Browse Gigs</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => router.push('/applications/my-applications')}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-4 rounded-xl font-medium transition-all hover:scale-105"
                    >
                      My Applications
                    </button>
                    <button 
                      onClick={() => router.push('/showcases')}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-4 rounded-xl font-medium transition-all hover:scale-105"
                    >
                      Showcases
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
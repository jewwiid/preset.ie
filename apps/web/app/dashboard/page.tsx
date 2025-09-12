'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  display_name: string
  handle: string
  bio?: string
  city?: string
  role_flags: string[]
  style_tags: string[]
  subscription_tier: string
  verification_status: string
  avatar_url?: string
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
        console.error('❌ Error fetching gigs:', gigsError)
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

      // Also fetch user credits
      const creditsQuery = supabase
        .from('user_credits')
        .select('current_balance, monthly_allowance, consumed_this_month')
        .eq('user_id', user.id)
        .single()

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

      // Set credits data - use fallback for new users without credit records
      if ('data' in userCredits && userCredits.data) {
        setCredits({
          current_balance: userCredits.data.current_balance || 0,
          monthly_allowance: userCredits.data.monthly_allowance || 0,
          consumed_this_month: userCredits.data.consumed_this_month || 0
        })
      } else {
        // New user - no credit record yet
        setCredits({
          current_balance: 0,
          monthly_allowance: 0,
          consumed_this_month: 0
        })
      }

      console.log('✅ Dashboard data loaded successfully with real database results')
    } catch (err) {
      console.error('Error loading dashboard data:', err)
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
    <div className="min-h-screen bg-gradient-to-br from-preset-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-preset-500 to-preset-600 pb-32">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Welcome back, {isAdmin ? 'Admin' : profile.display_name}!
              </h1>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-preset-600/90 to-preset-500/90"></div>
      </div>

      {/* Main Content */}
      <main className="relative -mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Enhanced Profile & Recent Gigs - 2 Column Layout */}
          <div className="mb-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
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
              
              {/* Credits & Balance Row - Enhanced Layout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Available Credits</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-gray-900 dark:text-white text-2xl font-bold">{credits.current_balance}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          of {credits.monthly_allowance || 'unlimited'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Account Balance</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-gray-900 dark:text-white text-2xl font-bold">€{(credits.current_balance * 0.025).toFixed(2)}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">EUR</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 px-4 py-2 text-preset-600 dark:text-preset-400 hover:bg-preset-50 dark:hover:bg-preset-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm font-medium">Edit Profile</span>
                  </button>

                  {profile.city && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{profile.city}</span>
                    </div>
                  )}
                </div>
              </div>
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
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Now First on Mobile */}
            <div className="lg:order-2 space-y-6">

            </div>

            {/* Quick Actions - Second on Mobile, First on Desktop */}
            <div className="lg:order-1 lg:col-span-2 space-y-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => router.push('/gigs/create')}
                      className="group relative overflow-hidden bg-gradient-to-r from-preset-500 to-preset-600 text-white px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg"
                    >
                      <span className="relative z-10">Create New Gig</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-preset-600 to-preset-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </button>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => router.push('/gigs')}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg"
                    >
                      <span className="relative z-10">Browse Gigs</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </button>
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
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
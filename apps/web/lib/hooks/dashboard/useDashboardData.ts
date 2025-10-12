import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth-context'
import { supabase } from '../../supabase'
import { getAuthToken } from '../../auth-utils'
import { UserProfile, RecentGig, DashboardStats, CreditsData, Conversation } from '../../types/dashboard'
import { Recommendation } from '../../types/matchmaking'

interface MatchmakingData {
  topCompatibleGigs: Recommendation[]
  topCompatibleUsers: Recommendation[]
  topCompatibleProjects: any[]
  averageCompatibility: number
  totalMatches: number
}

export const useDashboardData = () => {
  const { user, userRole } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentGigs, setRecentGigs] = useState<RecentGig[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalGigs: 0,
    totalApplications: 0,
    totalShowcases: 0,
    totalMessages: 0
  })
  const [credits, setCredits] = useState<CreditsData>({
    current_balance: 0,
    monthly_allowance: 0,
    consumed_this_month: 0
  })
  const [recentMessages, setRecentMessages] = useState<Conversation[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [matchmakingData, setMatchmakingData] = useState<MatchmakingData>({
    topCompatibleGigs: [],
    topCompatibleUsers: [],
    topCompatibleProjects: [],
    averageCompatibility: 0,
    totalMatches: 0
  })
  const [matchmakingLoading, setMatchmakingLoading] = useState(false)

  const isTalent = userRole?.isTalent || profile?.role_flags?.includes('TALENT') || profile?.role_flags?.includes('BOTH')
  const isContributor = userRole?.isContributor || profile?.role_flags?.includes('CONTRIBUTOR') || profile?.role_flags?.includes('BOTH')

  const loadMatchmakingData = useCallback(async (profileData: UserProfile) => {
    if (!user || !profileData || !supabase) return

    try {
      setMatchmakingLoading(true)
      const isTalent = userRole?.isTalent || profileData.role_flags?.includes('TALENT') || profileData.role_flags?.includes('BOTH')

      if (isTalent) {
        // Fetch collaboration recommendations
        try {
          const token = await getAuthToken()
          if (token) {
            const collabResponse = await fetch('/api/collab/recommendations?limit=3&min_compatibility=30', {
              headers: { 'Authorization': `Bearer ${token}` }
            })

            if (collabResponse.ok) {
              const { recommendations } = await collabResponse.json()
              setMatchmakingData(prev => ({
                ...prev,
                topCompatibleProjects: recommendations || []
              }))
            }
          }
        } catch (collabError) {
          console.error('Error fetching collaboration recommendations:', collabError)
        }

        // Fetch gig recommendations
        const { data: compatibleGigs } = await (supabase as any)
          .rpc('find_compatible_gigs_for_user', {
            p_profile_id: profileData.id,
            p_limit: 3
          })

        if (compatibleGigs) {
          const gigRecommendations = compatibleGigs.map((gig: any) => ({
            id: gig.gig_id,
            type: 'gig' as const,
            data: {
              id: gig.gig_id,
              title: gig.title,
              location_text: gig.location_text,
              start_time: gig.start_time,
              comp_type: 'TFP',
              owner_user_id: 'unknown',
              status: 'PUBLISHED',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            compatibility_score: gig.compatibility_score,
            compatibility_breakdown: {
              total: gig.compatibility_score
            },
            reason: 'Matches your profile',
            priority: gig.compatibility_score >= 80 ? 'high' as const : 'medium' as const
          }))

          setMatchmakingData(prev => ({
            ...prev,
            topCompatibleGigs: gigRecommendations,
            averageCompatibility: gigRecommendations.length > 0
              ? gigRecommendations.reduce((sum: number, gig: Recommendation) => sum + gig.compatibility_score, 0) / gigRecommendations.length
              : 0,
            totalMatches: gigRecommendations.length
          }))
        }
      }
    } catch (error) {
      console.error('Error loading matchmaking data:', error)
    } finally {
      setMatchmakingLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Simplified to prevent loops

  const loadRecentMessages = useCallback(async () => {
    if (!user || !supabase) return

    setMessagesLoading(true)
    try {
      const { data: userProfile } = await (supabase as any)
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!userProfile) return

      const { data: messages } = await (supabase as any)
        .from('messages')
        .select(`
          id,
          body,
          created_at,
          from_user_id,
          to_user_id,
          gig_id,
          listing_id,
          from_user:users_profile!messages_from_user_id_fkey(id, display_name, avatar_url),
          to_user:users_profile!messages_to_user_id_fkey(id, display_name, avatar_url)
        `)
        .or(`from_user_id.eq.${(userProfile as any).id},to_user_id.eq.${(userProfile as any).id}`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (messages) {
        const conversations: { [key: string]: Conversation } = {}

        messages.forEach((message: any) => {
          const otherUserId = message.from_user_id === (userProfile as any).id
            ? message.to_user_id
            : message.from_user_id
          const otherUser = message.from_user_id === (userProfile as any).id
            ? message.to_user
            : message.from_user

          const conversationKey = `${otherUserId}-${message.gig_id || message.listing_id || 'general'}`

          if (!conversations[conversationKey]) {
            conversations[conversationKey] = {
              id: conversationKey,
              other_user: otherUser,
              last_message: message.body,
              last_message_time: message.created_at,
              context_type: message.gig_id ? 'gig' : message.listing_id ? 'marketplace' : 'general',
              gig_id: message.gig_id,
              listing_id: message.listing_id
            }
          }
        })

        setRecentMessages(Object.values(conversations).slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setMessagesLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Simplified to prevent loops

  const loadDashboardData = useCallback(async (profileData?: UserProfile) => {
    const currentProfile = profileData || profile
    if (!user || !currentProfile || !supabase) return

    try {
      const isContributor = userRole?.isContributor || currentProfile.role_flags?.includes('CONTRIBUTOR') || currentProfile.role_flags?.includes('BOTH')

      // Load gigs
      const gigsQuery = isContributor
        ? (supabase as any).from('gigs').select('*').eq('owner_user_id', currentProfile.id).order('created_at', { ascending: false }).limit(5)
        : (supabase as any).from('gigs').select('*').eq('status', 'PUBLISHED').order('created_at', { ascending: false }).limit(5)

      const { data: gigs } = await gigsQuery
      setRecentGigs(gigs || [])

      // Load stats
      const [gigsCount, applicationsCount, showcasesCount, messagesCount, userCredits] = await Promise.all([
        (supabase as any).from('gigs').select('*', { count: 'exact', head: true }).eq(isContributor ? 'owner_user_id' : 'status', isContributor ? currentProfile.id : 'PUBLISHED'),
        (supabase as any).from('applications').select('*', { count: 'exact', head: true }).eq('applicant_user_id', currentProfile.id),
        (supabase as any).from('showcases').select('*', { count: 'exact', head: true }).or(`creator_user_id.eq.${currentProfile.id},talent_user_id.eq.${currentProfile.id}`),
        (supabase as any).from('messages').select('*', { count: 'exact', head: true }).or(`from_user_id.eq.${currentProfile.id},to_user_id.eq.${currentProfile.id}`),
        (supabase as any).from('user_credits').select('*').eq('user_id', user.id).single()
      ])

      setStats({
        totalGigs: gigsCount.count || 0,
        totalApplications: applicationsCount.count || 0,
        totalShowcases: showcasesCount.count || 0,
        totalMessages: messagesCount.count || 0
      })

      if ('data' in userCredits && userCredits.data) {
        setCredits({
          current_balance: userCredits.data.current_balance || 0,
          monthly_allowance: userCredits.data.monthly_allowance || 0,
          consumed_this_month: userCredits.data.consumed_this_month || 0
        })
      }

      await loadMatchmakingData(currentProfile)
      await loadRecentMessages()
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Simplified dependencies to prevent loops

  const fetchProfile = useCallback(async () => {
    if (!user || !supabase) return

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile exists
          return
        }
        console.error('Error fetching profile:', profileError)
        return
      }

      // Fetch verification badges separately
      const { data: badgesData } = await (supabase as any)
        .from('verification_badges')
        .select('badge_type, issued_at, expires_at, revoked_at')
        .eq('user_id', user.id)
        .is('revoked_at', null)

      // Combine the data
      const combinedData = {
        ...profileData,
        verification_badges: badgesData || []
      }

      setProfile(combinedData as any)
      await loadDashboardData(combinedData as any)
    } catch (err) {
      console.error('Error in fetchProfile:', err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only depend on user ID to prevent infinite loops

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only re-run when user ID changes, not the whole user object

  return {
    profile,
    loading,
    recentGigs,
    stats,
    credits,
    recentMessages,
    messagesLoading,
    matchmakingData,
    matchmakingLoading,
    isTalent,
    isContributor,
    refetch: fetchProfile
  }
}

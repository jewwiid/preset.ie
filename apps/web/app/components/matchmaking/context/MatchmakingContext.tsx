'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../lib/auth-context'
import { 
  MatchmakingContextType, 
  MatchmakingFilters, 
  Recommendation, 
  CompatibilityData 
} from '../../../../lib/types/matchmaking'

const MatchmakingContext = createContext<MatchmakingContextType | undefined>(undefined)

interface MatchmakingProviderProps {
  children: ReactNode
}

export const MatchmakingProvider: React.FC<MatchmakingProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [compatibilityCache, setCompatibilityCache] = useState<Map<string, CompatibilityData>>(new Map())
  const [loading, setLoading] = useState(false)
  
  const [filters, setFilters] = useState<MatchmakingFilters>({
    compatibility_min: 60,
    compatibility_max: 100,
    location_radius: 50,
    date_range: {
      start: null,
      end: null
    },
    compensation_types: [],
    specializations: [],
    experience_levels: [],
    availability_status: []
  })

  // Calculate compatibility between user and gig
  const calculateCompatibility = useCallback(async (userId: string, gigId: string): Promise<CompatibilityData> => {
    const cacheKey = `${userId}-${gigId}`
    
    // Check cache first
    if (compatibilityCache.has(cacheKey)) {
      return compatibilityCache.get(cacheKey)!
    }

    if (!supabase) {
      console.error('Supabase client not available')
      throw new Error('Database connection failed')
    }

    try {
      const { data, error } = await supabase.rpc('calculate_gig_compatibility', {
        p_profile_id: userId,
        p_gig_id: gigId
      })

      if (error) {
        console.error('Error calculating compatibility:', error)
        throw error
      }

      const result = data[0]
      const compatibilityData: CompatibilityData = {
        score: parseFloat(result.compatibility_score),
        breakdown: {
          gender: result.match_factors.gender_match ? 20 : 0,
          age: result.match_factors.age_match ? 20 : 0,
          height: result.match_factors.height_match ? 15 : 0,
          experience: result.match_factors.experience_match ? 25 : 0,
          specialization: typeof result.match_factors.specialization_match === 'number' 
            ? result.match_factors.specialization_match 
            : result.match_factors.specialization_match ? 20 : 0,
          total: parseFloat(result.compatibility_score)
        },
        factors: result.match_factors
      }

      // Cache the result
      setCompatibilityCache(prev => new Map(prev).set(cacheKey, compatibilityData))
      
      return compatibilityData
    } catch (error) {
      console.error('Error calculating compatibility:', error)
      throw error
    }
  }, [compatibilityCache])

  // Fetch recommendations for user
  const fetchRecommendations = useCallback(async () => {
    if (!user || !supabase) return

    setLoading(true)
    try {
      // Get compatible gigs for the user
      const { data: gigsData, error: gigsError } = await supabase.rpc('find_compatible_gigs_for_user', {
        p_profile_id: user.id,
        p_limit: 20
      })

      if (gigsError) {
        console.error('Error fetching compatible gigs:', {
          message: gigsError?.message || 'No message',
          code: gigsError?.code || 'No code',
          details: gigsError?.details || 'No details',
          hint: gigsError?.hint || 'No hint',
          fullError: gigsError,
          errorType: typeof gigsError,
          errorKeys: gigsError ? Object.keys(gigsError) : 'No keys',
          errorStringified: JSON.stringify(gigsError)
        })
        
        // Handle specific schema cache errors gracefully
        if (gigsError.code === 'PGRST200' && gigsError.message?.includes('relationship')) {
          console.warn('Schema cache issue detected, falling back to basic gig query')
          
          // Fallback: Get basic gigs without matchmaking
          const { data: basicGigs, error: basicError } = await supabase
            .from('gigs')
            .select('id, title, location_text, start_time, description, comp_type, owner_user_id, status, created_at, updated_at')
            .eq('status', 'PUBLISHED')
            .order('created_at', { ascending: false })
            .limit(20)
          
          if (basicError) {
            throw basicError
          }
          
          // Transform to recommendations with default compatibility
          const basicRecommendations: Recommendation[] = basicGigs.map((gig: any) => ({
            id: gig.id,
            type: 'gig' as const,
            data: gig,
            compatibility_score: 75, // Default score
            compatibility_breakdown: {
              gender: 15,
              age: 15,
              height: 10,
              experience: 20,
              specialization: 15,
              total: 75
            },
            reason: 'Available gigs (matchmaking temporarily unavailable)',
            priority: 'medium'
          }))
          
          setRecommendations(basicRecommendations)
          return
        }
        
        throw gigsError
      }

      // Transform gigs data into recommendations
      const gigRecommendations: Recommendation[] = gigsData.map((gig: any) => ({
        id: gig.gig_id,
        type: 'gig' as const,
        data: {
          id: gig.gig_id,
          title: gig.title,
          location_text: gig.location_text,
          start_time: gig.start_time,
          end_time: gig.start_time, // We'll need to fetch full gig details
          comp_type: 'TFP', // Default, will be fetched separately
          owner_user_id: '',
          status: 'PUBLISHED',
          created_at: '',
          updated_at: '',
          description: ''
        },
        compatibility_score: parseFloat(gig.compatibility_score),
        compatibility_breakdown: {
          gender: 20,
          age: 20,
          height: 15,
          experience: 25,
          specialization: 20,
          total: parseFloat(gig.compatibility_score)
        },
        reason: `High compatibility based on your profile and gig requirements`,
        priority: parseFloat(gig.compatibility_score) >= 80 ? 'high' : 
                  parseFloat(gig.compatibility_score) >= 60 ? 'medium' : 'low'
      }))

      setRecommendations(gigRecommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update filters
  const updateFilters = useCallback((newFilters: MatchmakingFilters) => {
    setFilters(newFilters)
  }, [])

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    await fetchRecommendations()
  }, [fetchRecommendations])

  const value: MatchmakingContextType = {
    recommendations,
    compatibilityCache,
    filters,
    loading,
    fetchRecommendations,
    calculateCompatibility,
    updateFilters,
    refreshRecommendations
  }

  return (
    <MatchmakingContext.Provider value={value}>
      {children}
    </MatchmakingContext.Provider>
  )
}

export const useMatchmaking = (): MatchmakingContextType => {
  const context = useContext(MatchmakingContext)
  if (context === undefined) {
    throw new Error('useMatchmaking must be used within a MatchmakingProvider')
  }
  return context
}

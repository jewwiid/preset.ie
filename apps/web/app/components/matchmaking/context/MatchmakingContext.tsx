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

// Helper function for basic compatibility calculation (fallback)
const calculateBasicCompatibility = async (gig: any, userProfile: any): Promise<CompatibilityData> => {
  let score = 0
  const breakdown = {
    gender: 0,
    age: 0,
    height: 0,
    experience: 0,
    specialization: 0,
    total: 0
  }
  const factors = {
    gender_match: false,
    age_match: false,
    height_match: false,
    experience_match: false,
    specialization_match: false
  }
  const matched = []

  // 1. Primary role matching (35 points) - Core compatibility
  if (gig.looking_for && userProfile.primary_skill && gig.looking_for.includes(userProfile.primary_skill)) {
    score += 35
    breakdown.experience = 35  // Using experience field for role match
    matched.push(`Perfect role: ${userProfile.primary_skill}`)
  }

  // 2. Category/role alignment (15 points) - Secondary role match
  if (gig.looking_for_types && userProfile.talent_categories && userProfile.talent_categories.some(cat => gig.looking_for_types.includes(cat))) {
    score += 15
    breakdown.specialization = 15  // Using specialization for category match
    matched.push('Category match')
  }

  // 3. Location bonus (12 points) - Proximity advantage
  if (gig.location_text && userProfile.city && gig.location_text.toLowerCase().includes(userProfile.city.toLowerCase())) {
    score += 12
    matched.push(`Same city: ${userProfile.city}`)
  } else if (gig.location_text && userProfile.country && gig.location_text.toLowerCase().includes(userProfile.country.toLowerCase())) {
    score += 6  // Half points for same country
    matched.push(`Same country: ${userProfile.country}`)
  }

  // 4. Granular preference matching (using gig.applicant_preferences or basic checks)
  if (gig.applicant_preferences) {
    const prefs = gig.applicant_preferences

    // Height matching (8 points) - Range-based scoring
    if (prefs.physical?.height_range && userProfile.height_cm) {
      const { min, max } = prefs.physical.height_range
      if (min && max && userProfile.height_cm >= min && userProfile.height_cm <= max) {
        score += 8
        breakdown.height = 8
        factors.height_match = true
        matched.push(`Height match: ${userProfile.height_cm}cm`)
      } else if (min && userProfile.height_cm >= min) {
        // Partial points for being above minimum
        const margin = Math.min(10, userProfile.height_cm - min)
        score += Math.round(4 * (margin / 10)) // 0-4 points based on how close to minimum
        breakdown.height = Math.round(4 * (margin / 10))
        matched.push(`Height above minimum: ${userProfile.height_cm}cm`)
      } else if (max && userProfile.height_cm <= max) {
        // Partial points for being below maximum
        const margin = Math.min(10, max - userProfile.height_cm)
        score += Math.round(4 * (margin / 10)) // 0-4 points based on how close to maximum
        breakdown.height = Math.round(4 * (margin / 10))
        matched.push(`Height below maximum: ${userProfile.height_cm}cm`)
      }
    }

    // Eye color matching (5 points)
    if (prefs.physical?.eye_color?.preferred?.length > 0 && userProfile.eye_color) {
      if (prefs.physical.eye_color.preferred.includes(userProfile.eye_color)) {
        score += 5
        breakdown.gender = 5  // Using gender field for eye color
        factors.gender_match = true
        matched.push(`Eye color: ${userProfile.eye_color}`)
      }
    }

    // Hair color matching (5 points)
    if (prefs.physical?.hair_color?.preferred?.length > 0 && userProfile.hair_color) {
      if (prefs.physical.hair_color.preferred.includes(userProfile.hair_color)) {
        score += 5
        breakdown.age = 5  // Using age field for hair color
        factors.age_match = true
        matched.push(`Hair color: ${userProfile.hair_color}`)
      }
    }

    // Weight matching (6 points) - Range-based for gigs that specify weight
    if (prefs.physical?.weight_range && userProfile.weight_kg) {
      const { min, max } = prefs.physical.weight_range
      if (min && max && userProfile.weight_kg >= min && userProfile.weight_kg <= max) {
        score += 6
        matched.push(`Weight match: ${userProfile.weight_kg}kg`)
      } else if (min && userProfile.weight_kg >= min) {
        // Partial points for being close to minimum
        const margin = Math.min(5, userProfile.weight_kg - min)
        score += Math.round(3 * (margin / 5)) // 0-3 points
        matched.push(`Weight close to requirement: ${userProfile.weight_kg}kg`)
      } else if (max && userProfile.weight_kg <= max) {
        // Partial points for being close to maximum
        const margin = Math.min(5, max - userProfile.weight_kg)
        score += Math.round(3 * (margin / 5)) // 0-3 points
        matched.push(`Weight close to requirement: ${userProfile.weight_kg}kg`)
      }
    }

    // Body type matching (4 points)
    if (prefs.physical?.body_type?.preferred?.length > 0 && userProfile.body_type) {
      if (prefs.physical.body_type.preferred.includes(userProfile.body_type)) {
        score += 4
        matched.push(`Body type: ${userProfile.body_type}`)
      }
    }

    // Tattoos preference matching (3 points)
    if (prefs.physical?.tattoos !== undefined && userProfile.tattoos !== undefined) {
      if (prefs.physical.tattoos === 'required' && userProfile.tattoos) {
        score += 3
        matched.push('Has tattoos (preferred)')
      } else if (prefs.physical.tattoos === 'no_tattoos' && !userProfile.tattoos) {
        score += 3
        matched.push('No tattoos (preferred)')
      } else if (prefs.physical.tattoos === 'acceptable') {
        score += 1  // Small bonus for acceptable
        matched.push('Tattoos acceptable')
      }
    }

    // Piercings preference matching (3 points)
    if (prefs.physical?.piercings !== undefined && userProfile.piercings !== undefined) {
      if (prefs.physical.piercings === 'required' && userProfile.piercings) {
        score += 3
        matched.push('Has piercings (preferred)')
      } else if (prefs.physical.piercings === 'no_piercings' && !userProfile.piercings) {
        score += 3
        matched.push('No piercings (preferred)')
      } else if (prefs.physical.piercings === 'acceptable') {
        score += 1  // Small bonus for acceptable
        matched.push('Piercings acceptable')
      }
    }

    // Hair length matching (2 points)
    if (prefs.physical?.hair_length?.preferred?.length > 0 && userProfile.hair_length) {
      if (prefs.physical.hair_length.preferred.includes(userProfile.hair_length)) {
        score += 2
        matched.push(`Hair length: ${userProfile.hair_length}`)
      }
    }

    // Skin tone matching (2 points)
    if (prefs.physical?.skin_tone?.preferred?.length > 0 && userProfile.skin_tone) {
      if (prefs.physical.skin_tone.preferred.includes(userProfile.skin_tone)) {
        score += 2
        matched.push(`Skin tone: ${userProfile.skin_tone}`)
      }
    }

    // Experience level matching (10 points)
    if (prefs.professional?.required_years_experience && userProfile.years_experience) {
      const required = prefs.professional.required_years_experience
      if (userProfile.years_experience >= required) {
        score += 10
        factors.experience_match = true
        matched.push(`Experience: ${userProfile.years_experience} years`)
      } else {
        // Partial points based on how close to requirement
        const ratio = userProfile.years_experience / required
        score += Math.round(10 * ratio)
        matched.push(`Experience: ${userProfile.years_experience} years (needs ${required})`)
      }
    }
  } else {
    // Fallback: Basic experience scoring if no preferences
    if (userProfile.years_experience) {
      if (userProfile.years_experience >= 5) {
        score += 10
        factors.experience_match = true
        matched.push(`Experienced: ${userProfile.years_experience} years`)
      } else if (userProfile.years_experience >= 2) {
        score += 5
        matched.push(`Some experience: ${userProfile.years_experience} years`)
      }
    }
  }

  // 5. Professional skills matching (10 points) - Contributor-specific
  if (gig.looking_for && userProfile.professional_skills && Array.isArray(userProfile.professional_skills)) {
    const skillMatches = userProfile.professional_skills.filter(skill =>
      gig.looking_for.some(lookingFor =>
        lookingFor.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(lookingFor.toLowerCase())
      )
    )
    if (skillMatches.length > 0) {
      const skillPoints = Math.min(10, skillMatches.length * 3)
      score += skillPoints
      matched.push(`Skills: ${skillMatches.join(', ')}`)
    }
  }

  breakdown.total = Math.min(100, score) // Cap at 100%

  return {
    score: Math.min(100, score),
    breakdown,
    factors
  }
}

// Helper function to generate human-readable compatibility reason
const generateCompatibilityReason = (gig: any, userProfile: any, compatibilityData: CompatibilityData): string => {
  const reasons = []

  // Role matching
  if (gig.looking_for && userProfile.primary_skill && gig.looking_for.includes(userProfile.primary_skill)) {
    reasons.push(`Perfect role match: ${userProfile.primary_skill}`)
  } else if (gig.looking_for && userProfile.talent_categories && userProfile.talent_categories.some(cat => gig.looking_for.includes(cat))) {
    reasons.push('Partial role match')
  }

  // Category matching
  if (gig.looking_for_types && userProfile.talent_categories && userProfile.talent_categories.some(cat => gig.looking_for_types.includes(cat))) {
    reasons.push('Category type match')
  }

  // Location matching
  if (gig.location_text && userProfile.city && gig.location_text.includes(userProfile.city)) {
    reasons.push(`Same location: ${userProfile.city}`)
  }

  // Advanced preference matches
  if (compatibilityData.breakdown.gender > 0) {
    reasons.push('Gender requirements match')
  }

  if (compatibilityData.breakdown.age > 0) {
    reasons.push('Age requirements match')
  }

  if (compatibilityData.breakdown.height > 0) {
    reasons.push('Height requirements match')
  }

  if (compatibilityData.breakdown.experience > 0) {
    reasons.push('Experience level matches')
  }

  if (compatibilityData.breakdown.specialization > 0) {
    reasons.push('Specializations align')
  }

  return reasons.length > 0 ? reasons.join(', ') : 'Basic compatibility match'
}

export const MatchmakingProvider: React.FC<MatchmakingProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<{
    all: Recommendation[]
    filtered: Recommendation[]
  }>({ all: [], filtered: [] })
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
      const { data, error } = await supabase.rpc('calculate_gig_compatibility_with_preferences', {
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
      // Get published gigs with preferences and check compatibility
      const { data: allGigs, error: gigsError } = await supabase
        .from('gigs')
        .select(`
          id,
          title,
          location_text,
          start_time,
          description,
          looking_for,
          looking_for_types,
          applicant_preferences,
          comp_type,
          owner_user_id,
          status,
          created_at,
          updated_at,
          moodboards!left (
            id,
            featured_image_id,
            items
          )
        `)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })
        .limit(20)

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
          
          setRecommendations({
            all: basicRecommendations,
            filtered: basicRecommendations
          })
          return
        }
        
        throw gigsError
      }

      // Get user profile data for compatibility calculation (include granular preferences)
      const { data: userProfile, error: profileError } = await supabase
        .from('users_profile')
        .select(`
          primary_skill,
          talent_categories,
          city,
          country,
          height_cm,
          weight_kg,
          eye_color,
          hair_color,
          hair_length,
          skin_tone,
          body_type,
          tattoos,
          piercings,
          years_experience,
          professional_skills,
          contributor_roles
        `)
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        throw profileError
      }

      // Calculate compatibility using advanced preference-based scoring
      const allGigRecommendations: Recommendation[] = []
      const filteredGigRecommendations: Recommendation[] = []

      for (const gig of allGigs || []) {
        try {
          let compatibilityData: CompatibilityData
          let score: number
          let reason: string

          // Check if gig has preferences - use advanced scoring if available
          if (gig.applicant_preferences) {
            // Use the advanced database function for preference-based scoring
            const { data: advancedScore, error: advancedError } = await supabase.rpc('calculate_gig_compatibility_with_preferences', {
              p_profile_id: user.id,
              p_gig_id: gig.id
            })

            if (advancedError) {
              console.warn(`Advanced scoring failed for gig ${gig.id}, falling back to basic:`, advancedError)
              // Fall back to basic calculation if advanced fails
              compatibilityData = await calculateBasicCompatibility(gig, userProfile)
            } else if (advancedScore && advancedScore.length > 0) {
              const result = advancedScore[0]

              // Check if the result has the expected structure
              if (result && result.compatibility_score && result.match_factors) {
                compatibilityData = {
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
              } else {
                console.warn('Advanced function returned unexpected format, falling back to basic calculation')
                console.log('Result structure:', result)
                compatibilityData = await calculateBasicCompatibility(gig, userProfile)
              }
            } else {
              compatibilityData = await calculateBasicCompatibility(gig, userProfile)
            }
          } else {
            // Use basic calculation for gigs without preferences
            compatibilityData = await calculateBasicCompatibility(gig, userProfile)
          }

          score = compatibilityData.score
          reason = generateCompatibilityReason(gig, userProfile, compatibilityData)

          const gigRecommendation: Recommendation = {
            id: gig.id,
            type: 'gig' as const,
            data: {
              id: gig.id,
              title: gig.title,
              location_text: gig.location_text || 'Remote',
              start_time: gig.start_time,
              end_time: gig.start_time,
              comp_type: gig.comp_type || 'TFP',
              owner_user_id: gig.owner_user_id || '',
              status: gig.status,
              created_at: gig.created_at || '',
              updated_at: gig.updated_at || '',
              description: gig.description || '',
              looking_for: gig.looking_for || [],
              looking_for_types: gig.looking_for_types || [],
              moodboard: gig.moodboards && gig.moodboards.length > 0 ? gig.moodboards[0] : null
            },
            compatibility_score: score,
            compatibility_breakdown: compatibilityData.breakdown || {
              gender: 0,
              age: 0,
              height: 0,
              experience: 0,
              specialization: 0,
              total: score
            },
            reason: reason,
            priority: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
          }

          // Add to all recommendations
          allGigRecommendations.push(gigRecommendation)

          // Only include gigs with at least 30 points (30% match) in filtered recommendations
          if (score >= 30) {
            filteredGigRecommendations.push(gigRecommendation)
          }
        } catch (error) {
          console.error(`Error processing gig ${gig.id}:`, error)
          // Continue with next gig instead of failing completely
          continue
        }
      }

      // Sort both arrays by compatibility score
      allGigRecommendations.sort((a, b) => b.compatibility_score - a.compatibility_score)
      filteredGigRecommendations.sort((a, b) => b.compatibility_score - a.compatibility_score)

      // Remove duplicates by ID
      const uniqueAllRecommendations = Array.from(
        new Map(allGigRecommendations.map(rec => [rec.id, rec])).values()
      )
      const uniqueFilteredRecommendations = Array.from(
        new Map(filteredGigRecommendations.map(rec => [rec.id, rec])).values()
      )

      setRecommendations({
        all: uniqueAllRecommendations,
        filtered: uniqueFilteredRecommendations
      })
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

  // Force TypeScript recompilation
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

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { UserProfile } from '@/lib/types/dashboard'

interface GigMatch {
  id: string
  title: string
  city: string
  country: string
  location_text: string
  comp_type: string
  application_deadline: string
  compatibility_score: number
  role_match_status: string
  looking_for: string[]
}

interface MatchingImprovement {
  field: string
  action: string
  message: string
  impact: number
  category: 'physical' | 'professional' | 'location' | 'availability'
  gigCount?: number
}

interface MatchingInsights {
  current: number
  potential: number
  improvements: MatchingImprovement[]
  topImprovement: MatchingImprovement | null
}

interface NearbyGig {
  city: string
  country: string
  distance: number
  gigCount: number
}

interface SmartSuggestionsData {
  topMatches: GigMatch[]
  matchingInsights: MatchingInsights | null
  nearbyGigs: NearbyGig[]
  deadlineGigs: GigMatch[]
  loading: boolean
  error: string | null
}

// Basic compatibility calculation (identical to Matchmaker for consistency)
const calculateBasicCompatibility = async (gig: any, userProfile: any): Promise<number> => {
  let score = 0
  const matched = []

  // 1. Primary role matching (35 points) - Core compatibility
  if (gig.looking_for && userProfile.primary_skill && gig.looking_for.includes(userProfile.primary_skill)) {
    score += 35
    matched.push(`Perfect role: ${userProfile.primary_skill}`)
  }

  // 2. Category/role alignment (15 points) - Secondary role match
  if (gig.looking_for_types && userProfile.talent_categories && userProfile.talent_categories.some(cat => gig.looking_for_types.includes(cat))) {
    score += 15
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
        matched.push(`Height match: ${userProfile.height_cm}cm`)
      } else if (min && userProfile.height_cm >= min) {
        // Partial points for being above minimum
        const margin = Math.min(10, userProfile.height_cm - min)
        score += Math.round(4 * (margin / 10)) // 0-4 points based on how close to minimum
        matched.push(`Height above minimum: ${userProfile.height_cm}cm`)
      } else if (max && userProfile.height_cm <= max) {
        // Partial points for being below maximum
        const margin = Math.min(10, max - userProfile.height_cm)
        score += Math.round(4 * (margin / 10)) // 0-4 points based on how close to maximum
        matched.push(`Height below maximum: ${userProfile.height_cm}cm`)
      }
    }

    // Eye color matching (5 points)
    if (prefs.physical?.eye_color?.preferred?.length > 0 && userProfile.eye_color) {
      if (prefs.physical.eye_color.preferred.includes(userProfile.eye_color)) {
        score += 5
        matched.push(`Eye color: ${userProfile.eye_color}`)
      }
    }

    // Hair color matching (5 points)
    if (prefs.physical?.hair_color?.preferred?.length > 0 && userProfile.hair_color) {
      if (prefs.physical.hair_color.preferred.includes(userProfile.hair_color)) {
        score += 5
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

  return Math.min(100, score)
}

export function useSmartSuggestions(profile: UserProfile | null): SmartSuggestionsData {

  const [topMatches, setTopMatches] = useState<GigMatch[]>([])
  const [matchingInsights, setMatchingInsights] = useState<MatchingInsights | null>(null)
  const [nearbyGigs, setNearbyGigs] = useState<NearbyGig[]>([])
  const [deadlineGigs, setDeadlineGigs] = useState<GigMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchSuggestions() {
          // Need to get the actual user ID, not the profile ID
      // The profile object has 'id' which is the profile ID, but we need user_id for compatibility calculations
      const userId = (profile as any).user_id || profile?.id

      if (!userId) {
        setLoading(false)
        return
      }
      
      try {
        if (!supabase) {
          console.error('Supabase client not initialized')
          setLoading(false)
          return
        }
        
        // Get top 5 gig matches using the same advanced compatibility function as Matchmaker
        const { data: allGigs, error: gigsError } = await (supabase as any)
          .from('gigs')
          .select(`
            id,
            title,
            description,
            location_text,
            comp_type,
            application_deadline,
            looking_for,
            looking_for_types,
            applicant_preferences,
            status
          `)
          .eq('status', 'PUBLISHED')
          .order('created_at', { ascending: false })
          .limit(20)

        if (gigsError) {
          console.error('Error fetching gigs:', gigsError)
        } else if (!allGigs || allGigs.length === 0) {
          return
        } else {
          // Get user profile for compatibility calculation (same as Matchmaker)
          const { data: userProfile, error: profileError } = await (supabase as any)
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
            .eq('user_id', userId)
            .single()

          if (profileError) {
          console.error('Error fetching user profile:', profileError)
          return
        }

          // Calculate compatibility for each gig using the same logic as Matchmaker
          const gigMatches = []

          for (const gig of allGigs || []) {
            try {
              let compatibilityScore = 0

              // Use the same advanced compatibility function as Matchmaker
              if (gig.applicant_preferences) {
                const { data: advancedScore, error: advancedError } = await (supabase as any)
                  .rpc('calculate_gig_compatibility_with_preferences', {
                    p_profile_id: userId,
                    p_gig_id: gig.id
                  })

                if (!advancedError && advancedScore && advancedScore.length > 0) {
                  const rawScore = advancedScore[0].compatibility_score
                  compatibilityScore = parseFloat(rawScore) || 0

                  // If advanced calculation gives 0, fall back to basic to get some scores
                  if (compatibilityScore === 0) {
                    compatibilityScore = await calculateBasicCompatibility(gig, userProfile)
                  }
                } else {
                  // Fall back to basic calculation if advanced fails
                  compatibilityScore = await calculateBasicCompatibility(gig, userProfile)
                }
              } else {
                // Use basic calculation for gigs without preferences
                compatibilityScore = await calculateBasicCompatibility(gig, userProfile)
              }

              // Only include gigs with minimum compatibility score
              if (compatibilityScore >= 30) {
                const locationText = gig.location_text || 'Location TBD'
                let city = 'Location TBD'
                let country = ''

                // Parse location
                if (locationText && locationText !== 'Location TBD') {
                  const parts = locationText.split(',')
                  if (parts.length >= 2) {
                    city = parts[0]?.trim() || 'Location TBD'
                    country = parts.slice(1).join(',').trim() || ''
                  } else {
                    city = locationText
                  }
                }

                gigMatches.push({
                  id: gig.id,
                  title: gig.title,
                  city,
                  country,
                  location_text: locationText,
                  comp_type: gig.comp_type || 'TFP',
                  application_deadline: gig.application_deadline,
                  compatibility_score: compatibilityScore,
                  role_match_status: compatibilityScore >= 80 ? 'perfect' : compatibilityScore >= 60 ? 'partial' : 'weak',
                  looking_for: gig.looking_for || []
                })
              }
            } catch (error) {
              console.error(`Error processing gig ${gig.id}:`, error)
              continue
            }
          }

          // Sort by compatibility score and take top 5
          gigMatches.sort((a, b) => b.compatibility_score - a.compatibility_score)
          const top5Matches = gigMatches.slice(0, 5)

          setTopMatches(top5Matches)

          // Filter for deadline alerts (closing in 3 days)
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

          const urgentGigs = top5Matches.filter((gig: GigMatch) => {
            if (!gig.application_deadline) return false
            const deadline = new Date(gig.application_deadline)
            return deadline <= threeDaysFromNow && deadline > new Date()
          })

          setDeadlineGigs(urgentGigs)
        }
        
        // Analyze what would improve their matches
        const insights = await analyzeMatchingPotential(profile, supabase)
        setMatchingInsights(insights)
        
        // Get nearby gigs if user has location
        if (profile.city && profile.country) {
          const nearby = await fetchNearbyGigs(profile, supabase)
          setNearbyGigs(nearby)
        }
        
      } catch (err) {
        console.error('Error fetching smart suggestions:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSuggestions()
  }, [profile?.id, (profile as any)?.user_id])
  
  return { 
    topMatches, 
    matchingInsights, 
    nearbyGigs,
    deadlineGigs,
    loading, 
    error 
  }
}

/**
 * Analyze what fields would improve matching
 */
async function analyzeMatchingPotential(
  profile: UserProfile, 
  supabaseClient: typeof supabase
): Promise<MatchingInsights> {
  const improvements: MatchingImprovement[] = []
  
  // Check if adding height would help (for TALENT users)
  if (profile.account_type?.includes('TALENT') && !profile.height_cm) {
    const { data: gigsNeedingHeight } = await (supabaseClient as any)
      .from('gigs')
      .select('id')
      .not('applicant_preferences->physical->height_range', 'is', null)
      .eq('status', 'PUBLISHED')
    
    if (gigsNeedingHeight && gigsNeedingHeight.length > 0) {
      improvements.push({
        field: 'height_cm',
        action: 'Add your height',
        message: `${gigsNeedingHeight.length} model gig${gigsNeedingHeight.length > 1 ? 's' : ''} require height info`,
        impact: 15,
        category: 'physical',
        gigCount: gigsNeedingHeight.length
      })
    }
  }
  
  // Check if adding equipment would help (for CONTRIBUTOR users)
  if (profile.account_type?.includes('CONTRIBUTOR') && 
      (!profile.equipment_list || profile.equipment_list.length === 0)) {
    const { data: gigsNeedingEquipment } = await (supabaseClient as any)
      .from('gigs')
      .select('id')
      .contains('looking_for_types', ['PHOTOGRAPHERS', 'VIDEOGRAPHERS'])
      .eq('status', 'PUBLISHED')
    
    if (gigsNeedingEquipment && gigsNeedingEquipment.length > 0) {
      improvements.push({
        field: 'equipment_list',
        action: 'List your equipment',
        message: `${gigsNeedingEquipment.length} photographer gig${gigsNeedingEquipment.length > 1 ? 's need' : ' needs'} equipment info`,
        impact: 20,
        category: 'professional',
        gigCount: gigsNeedingEquipment.length
      })
    }
  }
  
  // Check if portfolio would help
  if (!profile.portfolio_url) {
    const { data: gigsNeedingPortfolio } = await (supabaseClient as any)
      .from('gigs')
      .select('id')
      .eq('applicant_preferences->professional->portfolio_required', true)
      .eq('status', 'PUBLISHED')
    
    if (gigsNeedingPortfolio && gigsNeedingPortfolio.length > 0) {
      improvements.push({
        field: 'portfolio_url',
        action: 'Add portfolio link',
        message: `Required for ${gigsNeedingPortfolio.length} premium gig${gigsNeedingPortfolio.length > 1 ? 's' : ''}`,
        impact: 25,
        category: 'professional',
        gigCount: gigsNeedingPortfolio.length
      })
    }
  }
  
  // Check if location would help
  if (!profile.city || !profile.country) {
    const { count } = await (supabaseClient as any)
      .from('gigs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED')
    
    if (count && count > 0) {
      improvements.push({
        field: 'city',
        action: 'Add your location',
        message: `Location matching is crucial for ${count} active gig${count > 1 ? 's' : ''}`,
        impact: 30,
        category: 'location',
        gigCount: count
      })
    }
  }
  
  // Check if body type/physical attributes would help (for TALENT)
  if (profile.account_type?.includes('TALENT') && !profile.body_type) {
    const { data: gigsNeedingBodyType } = await (supabaseClient as any)
      .from('gigs')
      .select('id')
      .not('applicant_preferences->physical->body_type', 'is', null)
      .eq('status', 'PUBLISHED')
    
    if (gigsNeedingBodyType && gigsNeedingBodyType.length > 0) {
      improvements.push({
        field: 'body_type',
        action: 'Add body type',
        message: `${gigsNeedingBodyType.length} gig${gigsNeedingBodyType.length > 1 ? 's' : ''} prefer specific body types`,
        impact: 12,
        category: 'physical',
        gigCount: gigsNeedingBodyType.length
      })
    }
  }
  
  // Check if travel availability would help
  if (profile.available_for_travel === null || profile.available_for_travel === undefined) {
    const { data: remoteGigs } = await (supabaseClient as any)
      .from('gigs')
      .select('id, city')
      .eq('status', 'PUBLISHED')
      .neq('city', profile.city || '')
    
    if (remoteGigs && remoteGigs.length > 0) {
      improvements.push({
        field: 'available_for_travel',
        action: 'Set travel availability',
        message: `${remoteGigs.length} gig${remoteGigs.length > 1 ? 's are' : ' is'} in other cities`,
        impact: 18,
        category: 'availability',
        gigCount: remoteGigs.length
      })
    }
  }
  
  // Sort by impact
  improvements.sort((a, b) => b.impact - a.impact)
  
  // Calculate current and potential scores
  const currentScore = calculateCurrentMatchScore(profile)
  const potentialScore = calculatePotentialMatchScore(profile, improvements)
  
  return {
    current: currentScore,
    potential: potentialScore,
    improvements,
    topImprovement: improvements[0] || null
  }
}

/**
 * Fetch nearby gigs in other cities
 */
async function fetchNearbyGigs(
  profile: UserProfile, 
  supabaseClient: typeof supabase
): Promise<NearbyGig[]> {
  if (!profile.city || !profile.country) return []
  
  // For now, just get gigs in the same country but different cities
  const { data: nearbyGigs } = await (supabaseClient as any)
    .from('gigs')
    .select('city, country')
    .eq('country', profile.country)
    .neq('city', profile.city)
    .eq('status', 'PUBLISHED')
  
  if (!nearbyGigs || nearbyGigs.length === 0) return []
  
  // Group by city
  const cityGroups = nearbyGigs.reduce((acc: Record<string, { city: string; country: string; count: number }>, gig: { city: string; country: string }) => {
    if (!acc[gig.city]) {
      acc[gig.city] = { city: gig.city, country: gig.country, count: 0 }
    }
    acc[gig.city].count++
    return acc
  }, {} as Record<string, { city: string; country: string; count: number }>)
  
  // Convert to array and estimate distances (placeholder - would need geolocation API)
  return (Object.values(cityGroups) as { city: string; country: string; count: number }[])
    .map((group) => ({
      city: group.city,
      country: group.country,
      distance: 50, // Placeholder - would calculate real distance
      gigCount: group.count
    }))
    .sort((a, b) => b.gigCount - a.gigCount)
    .slice(0, 3)
}

/**
 * Calculate current match score (estimate based on profile completeness)
 */
function calculateCurrentMatchScore(profile: UserProfile): number {
  // Use profile completion as a proxy for match score
  return Math.round((profile.profile_completion_percentage || 0) * 0.8)
}

/**
 * Calculate potential match score with improvements
 */
function calculatePotentialMatchScore(
  profile: UserProfile, 
  improvements: MatchingImprovement[]
): number {
  const current = calculateCurrentMatchScore(profile)
  
  // Each improvement adds to the score
  const totalImpact = improvements
    .slice(0, 3) // Top 3 improvements
    .reduce((sum, imp) => sum + imp.impact, 0)
  
  return Math.min(100, current + totalImpact)
}

// Export types
export type { GigMatch, MatchingInsights, MatchingImprovement, NearbyGig }


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

export function useSmartSuggestions(profile: UserProfile | null): SmartSuggestionsData {
  const [topMatches, setTopMatches] = useState<GigMatch[]>([])
  const [matchingInsights, setMatchingInsights] = useState<MatchingInsights | null>(null)
  const [nearbyGigs, setNearbyGigs] = useState<NearbyGig[]>([])
  const [deadlineGigs, setDeadlineGigs] = useState<GigMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchSuggestions() {
      if (!profile?.id) {
        setLoading(false)
        return
      }
      
      try {
        if (!supabase) {
          console.error('Supabase client not initialized')
          setLoading(false)
          return
        }
        
        // Get top 3 gig matches using existing matchmaking function
        const { data: matches, error: matchError } = await (supabase as any)
          .rpc('find_compatible_gigs_for_user', { 
            p_profile_id: profile.id, 
            p_limit: 5 
          })
        
        if (matchError) {
          console.error('Error fetching gig matches:', matchError)
        } else {
          setTopMatches(matches || [])
          
          // Filter for deadline alerts (closing in 3 days)
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
          
          const urgentGigs = (matches || []).filter((gig: GigMatch) => {
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
  }, [profile?.id])
  
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


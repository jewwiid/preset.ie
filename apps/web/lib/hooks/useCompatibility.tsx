'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { CompatibilityData } from '../types/matchmaking'

interface UseCompatibilityProps {
  userId: string
  gigId: string
  enabled?: boolean
}

export const useCompatibility = ({ userId, gigId, enabled = true }: UseCompatibilityProps) => {
  const [data, setData] = useState<CompatibilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateCompatibility = useCallback(async () => {
    if (!userId || !gigId || !enabled || !supabase) return

    setLoading(true)
    setError(null)

    try {
      const { data: result, error: fetchError } = await supabase.rpc('calculate_gig_compatibility', {
        p_profile_id: userId,
        p_gig_id: gigId
      })

      if (fetchError) {
        throw fetchError
      }

      if (result && result.length > 0) {
        const compatibilityResult = result[0]
        const compatibilityData: CompatibilityData = {
          score: parseFloat(compatibilityResult.compatibility_score),
          breakdown: {
            gender: compatibilityResult.match_factors.gender_match ? 20 : 0,
            age: compatibilityResult.match_factors.age_match ? 20 : 0,
            height: compatibilityResult.match_factors.height_match ? 15 : 0,
            experience: compatibilityResult.match_factors.experience_match ? 25 : 0,
            specialization: typeof compatibilityResult.match_factors.specialization_match === 'number' 
              ? compatibilityResult.match_factors.specialization_match 
              : compatibilityResult.match_factors.specialization_match ? 20 : 0,
            total: parseFloat(compatibilityResult.compatibility_score)
          },
          factors: compatibilityResult.match_factors
        }

        setData(compatibilityData)
      }
    } catch (err) {
      console.error('Error calculating compatibility:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate compatibility')
    } finally {
      setLoading(false)
    }
  }, [userId, gigId, enabled])

  useEffect(() => {
    if (enabled && userId && gigId && supabase) {
      calculateCompatibility()
    }
  }, [calculateCompatibility, enabled, userId, gigId])

  return {
    data,
    loading,
    error,
    refetch: calculateCompatibility
  }
}

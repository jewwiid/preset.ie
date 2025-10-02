'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export interface CollaborationCompatibilityData {
  overall_score: number
  skill_match_score: number
  profile_completeness_score: number
  matched_skills: string[]
  missing_skills: string[]
  missing_profile_fields: string[]
  breakdown: {
    skill_match: {
      score: number
      weight: number
      weighted_contribution: number
      matched_skills: string[]
      missing_skills: string[]
    }
    profile_completeness: {
      score: number
      weight: number
      weighted_contribution: number
      missing_fields: string[]
    }
    overall: {
      score: number
      meets_minimum_threshold: boolean
    }
  }
}

interface UseCollaborationCompatibilityProps {
  profileId: string | null
  roleId: string | null
  enabled?: boolean
}

export const useCollaborationCompatibility = ({
  profileId,
  roleId,
  enabled = true
}: UseCollaborationCompatibilityProps) => {
  const [data, setData] = useState<CollaborationCompatibilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateCompatibility = useCallback(async () => {
    if (!profileId || !roleId || !enabled || !supabase) return

    setLoading(true)
    setError(null)

    try {
      const { data: result, error: fetchError } = await supabase.rpc(
        'calculate_collaboration_compatibility',
        {
          p_profile_id: profileId,
          p_role_id: roleId
        }
      )

      if (fetchError) {
        throw fetchError
      }

      if (result && result.length > 0) {
        const compatResult = result[0]
        setData({
          overall_score: parseFloat(compatResult.overall_score),
          skill_match_score: parseFloat(compatResult.skill_match_score),
          profile_completeness_score: parseFloat(compatResult.profile_completeness_score),
          matched_skills: compatResult.matched_skills || [],
          missing_skills: compatResult.missing_skills || [],
          missing_profile_fields: compatResult.missing_profile_fields || [],
          breakdown: compatResult.breakdown
        })
      }
    } catch (err) {
      console.error('Error calculating collaboration compatibility:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate compatibility')
    } finally {
      setLoading(false)
    }
  }, [profileId, roleId, enabled])

  useEffect(() => {
    if (enabled && profileId && roleId && supabase) {
      calculateCompatibility()
    }
  }, [calculateCompatibility, enabled, profileId, roleId])

  return {
    data,
    loading,
    error,
    refetch: calculateCompatibility,
    meetsMinimumThreshold: data?.breakdown?.overall?.meets_minimum_threshold ?? false
  }
}

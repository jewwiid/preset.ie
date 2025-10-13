/**
 * Custom hook for managing user credits and subscription tier
 * Handles fetching credit balance and subscription information
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { UserCredits, SubscriptionTier } from '../lib/moodboardTypes'

interface UseUserCreditsReturn {
  // State
  credits: UserCredits | null
  tier: SubscriptionTier
  loading: boolean
  error: string | null

  // Actions
  fetchCredits: () => Promise<void>
  fetchTier: () => Promise<void>
  refetchAll: () => Promise<void>
}

export const useUserCredits = (): UseUserCreditsReturn => {
  const { user } = useAuth()

  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch user's subscription tier
   */
  const fetchTier = async () => {
    if (!user) return

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching subscription tier:', profileError)
        return
      }

      if (profile?.subscription_tier) {
        setTier(profile.subscription_tier as SubscriptionTier)
        console.log('Fetched subscription tier:', profile.subscription_tier)
      }
    } catch (err: any) {
      console.error('Error fetching tier:', err)
      setError('Failed to fetch subscription tier')
    }
  }

  /**
   * Fetch user's credit balance
   */
  const fetchCredits = async () => {
    if (!user) return

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('current_balance, monthly_allowance')
        .eq('user_id', user.id)
        .single()

      if (creditsError) {
        console.error('Error fetching credits:', creditsError)
        return
      }

      if (creditsData) {
        setCredits({
          current: creditsData.current_balance,
          monthly: creditsData.monthly_allowance
        })
        console.log('Fetched user credits:', {
          current: creditsData.current_balance,
          monthly: creditsData.monthly_allowance
        })
      }
    } catch (err: any) {
      console.error('Error fetching credits:', err)
      setError('Failed to fetch credits')
    }
  }

  /**
   * Fetch both credits and tier
   */
  const refetchAll = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([fetchTier(), fetchCredits()])
    } catch (err: any) {
      console.error('Error refetching credits and tier:', err)
      setError('Failed to refresh account information')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    if (user) {
      refetchAll()
    }
  }, [user])

  return {
    // State
    credits,
    tier,
    loading,
    error,

    // Actions
    fetchCredits,
    fetchTier,
    refetchAll
  }
}

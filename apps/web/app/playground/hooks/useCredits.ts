/**
 * Hook for managing user credits
 */

import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { SubscriptionTier } from '../types'
import { API_ENDPOINTS } from '../constants/playgroundConfig'

interface UseCreditsReturn {
  userCredits: number
  userSubscriptionTier: SubscriptionTier
  fetchUserCredits: () => Promise<void>
  deductCredits: (amount: number) => void
  loading: boolean
}

export function useCredits(session: Session | null): UseCreditsReturn {
  const [userCredits, setUserCredits] = useState(0)
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<SubscriptionTier>('FREE')
  const [loading, setLoading] = useState(false)

  const fetchUserCredits = async () => {
    if (!session?.access_token) {
      console.log('No session token available for fetching credits')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.USER_CREDITS, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch credits: ${response.status}`)
      }

      const data = await response.json()
      setUserCredits(data.current_balance)
      setUserSubscriptionTier(data.subscription_tier || 'FREE')
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const deductCredits = (amount: number) => {
    setUserCredits((prev) => Math.max(0, prev - amount))
  }

  useEffect(() => {
    if (session?.access_token) {
      fetchUserCredits()
    }
  }, [session])

  return {
    userCredits,
    userSubscriptionTier,
    fetchUserCredits,
    deductCredits,
    loading,
  }
}

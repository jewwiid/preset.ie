'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/auth-context'

interface NSFWAccessStatus {
  can_view_nsfw: boolean
  should_blur: boolean
  age_verified: boolean
  nsfw_consent_given: boolean
  show_nsfw_content: boolean
  user_age: number | null
  needs_age_verification: boolean
  needs_nsfw_consent: boolean
  needs_nsfw_toggle: boolean
}

interface AgeVerificationStatus {
  age_verified: boolean
  age_verified_at: string | null
  account_status: string
  verification_method: string | null
  date_of_birth: string | null
  calculated_age: number | null
  nsfw_consent_given: boolean
  nsfw_consent_given_at: string | null
  show_nsfw_content: boolean
  blur_nsfw_content: boolean
  can_view_nsfw: boolean
}

export function useNSFWContent() {
  const { session } = useAuth()
  const [accessStatus, setAccessStatus] = useState<NSFWAccessStatus | null>(null)
  const [ageStatus, setAgeStatus] = useState<AgeVerificationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkNSFWAccess = useCallback(async () => {
    if (!session?.access_token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/nsfw-consent', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const status = await response.json()
        setAccessStatus(status)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to check NSFW access')
      }
    } catch (err) {
      setError('Network error while checking NSFW access')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  const checkAgeVerification = useCallback(async () => {
    if (!session?.access_token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/age-verification', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const status = await response.json()
        setAgeStatus(status)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to check age verification')
      }
    } catch (err) {
      setError('Network error while checking age verification')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  const giveNSFWConsent = useCallback(async () => {
    if (!session?.access_token) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/nsfw-consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'give_consent' })
      })

      if (response.ok) {
        await checkNSFWAccess()
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to give NSFW consent')
        return false
      }
    } catch (err) {
      setError('Network error while giving NSFW consent')
      return false
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, checkNSFWAccess])

  const toggleNSFWContent = useCallback(async (show: boolean) => {
    if (!session?.access_token) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/nsfw-consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'toggle_nsfw',
          show_nsfw_content: show
        })
      })

      if (response.ok) {
        await checkNSFWAccess()
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to toggle NSFW content')
        return false
      }
    } catch (err) {
      setError('Network error while toggling NSFW content')
      return false
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, checkNSFWAccess])

  const verifyAge = useCallback(async (dateOfBirth: string) => {
    if (!session?.access_token) return false

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/age-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
          verification_method: 'self_attestation'
        })
      })

      if (response.ok) {
        await checkAgeVerification()
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to verify age')
        return false
      }
    } catch (err) {
      setError('Network error while verifying age')
      return false
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, checkAgeVerification])

  const logContentAccess = useCallback(async (
    contentId: string,
    contentType: string,
    action: 'view' | 'unblur' | 'blur' | 'blocked'
  ) => {
    if (!session?.access_token) return

    try {
      // This would call a logging endpoint if needed
      // For now, we'll just log to console
      console.log('NSFW Content Access:', {
        contentId,
        contentType,
        action,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to log content access:', err)
    }
  }, [session?.access_token])

  // Auto-check on mount and when session changes
  useEffect(() => {
    if (session?.access_token) {
      checkNSFWAccess()
      checkAgeVerification()
    }
  }, [session?.access_token, checkNSFWAccess, checkAgeVerification])

  return {
    // State
    accessStatus,
    ageStatus,
    loading,
    error,
    
    // Actions
    checkNSFWAccess,
    checkAgeVerification,
    giveNSFWConsent,
    toggleNSFWContent,
    verifyAge,
    logContentAccess,
    
    // Computed values
    canViewNSFW: accessStatus?.can_view_nsfw || false,
    shouldBlurNSFW: accessStatus?.should_blur || true,
    isAgeVerified: accessStatus?.age_verified || false,
    hasNSFWConsent: accessStatus?.nsfw_consent_given || false,
    needsAgeVerification: accessStatus?.needs_age_verification || false,
    needsNSFWConsent: accessStatus?.needs_nsfw_consent || false,
    needsNSFWToggle: accessStatus?.needs_nsfw_toggle || false,
    
    // Helper functions
    clearError: () => setError(null)
  }
}

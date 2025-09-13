'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Shield, AlertTriangle, Lock, CheckCircle } from 'lucide-react'
import { VerificationBadge } from './VerificationBadge'

interface VerificationGateProps {
  feature: 'view_gigs' | 'create_gigs' | 'apply_to_gigs' | 'messaging' | 'create_showcases'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function VerificationGate({ feature, children, fallback }: VerificationGateProps) {
  const [canAccess, setCanAccess] = useState<boolean | null>(null)
  const [userStatus, setUserStatus] = useState<{
    ageVerified: boolean
    emailVerified: boolean
    accountStatus: string
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [feature])

  const checkAccess = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        setCanAccess(false)
        return
      }

      const { data: { user } } = await supabase!.auth.getUser()
      
      if (!user) {
        setCanAccess(false)
        return
      }

      // Check if user can access the feature
      const { data, error } = await supabase!.rpc('can_access_feature', {
        p_user_id: user.id,
        p_feature: feature
      })

      if (error) {
        console.error('Error checking access:', error)
        setCanAccess(false)
        return
      }

      setCanAccess(data)

      // Also get user verification status for the UI
      const { data: profile } = await supabase
        .from('users_profile')
        .select('age_verified, account_status, email')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setUserStatus({
          ageVerified: profile.age_verified || false,
          emailVerified: !!user.email_confirmed_at,
          accountStatus: profile.account_status || 'pending_verification'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setCanAccess(false)
    }
  }

  // Loading state
  if (canAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Access granted
  if (canAccess) {
    return <>{children}</>
  }

  // Access denied - show appropriate message
  const getBlockedMessage = () => {
    if (!userStatus) {
      return {
        icon: Lock,
        title: 'Authentication Required',
        message: 'Please sign in to access this feature.',
        action: () => router.push('/auth/signin')
      }
    }

    if (userStatus.accountStatus === 'suspended') {
      return {
        icon: AlertTriangle,
        title: 'Account Suspended',
        message: 'Your account has been suspended. Please contact support for assistance.',
        action: null
      }
    }

    if (userStatus.accountStatus === 'banned') {
      return {
        icon: AlertTriangle,
        title: 'Account Banned',
        message: 'Your account has been banned due to policy violations.',
        action: null
      }
    }

    if (!userStatus.ageVerified) {
      return {
        icon: Shield,
        title: 'Age Verification Required',
        message: 'You must be 18 or older to access this feature. Your age verification is pending admin review.',
        action: null
      }
    }

    if (!userStatus.emailVerified && feature !== 'view_gigs') {
      return {
        icon: CheckCircle,
        title: 'Email Verification Required',
        message: 'Please verify your email address to access this feature.',
        action: () => router.push('/auth/verify-email')
      }
    }

    if (feature === 'create_showcases' && userStatus.accountStatus !== 'fully_verified') {
      return {
        icon: Shield,
        title: 'Full Verification Required',
        message: 'You need to complete identity verification to create showcases.',
        action: () => router.push('/settings/verification')
      }
    }

    return {
      icon: Lock,
      title: 'Access Restricted',
      message: 'You do not have permission to access this feature.',
      action: null
    }
  }

  const blockedInfo = getBlockedMessage()
  const Icon = blockedInfo.icon

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Default fallback UI
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {blockedInfo.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {blockedInfo.message}
        </p>
        
        {/* Show user's current verification status */}
        {userStatus && (
          <div className="flex justify-center gap-2 mb-6">
            <VerificationBadge 
              type={userStatus.ageVerified ? 'verified_age' : 'pending_verification'}
              size="md"
              showLabel={true}
            />
            {userStatus.emailVerified && (
              <VerificationBadge 
                type="verified_email"
                size="md"
                showLabel={true}
              />
            )}
          </div>
        )}
        
        {blockedInfo.action && (
          <button
            onClick={blockedInfo.action}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

// Hook for checking verification status
export function useVerificationStatus() {
  const [status, setStatus] = useState<{
    isAgeVerified: boolean
    isEmailVerified: boolean
    isIdentityVerified: boolean
    accountStatus: string
    canCreateGigs: boolean
    canApplyToGigs: boolean
    canMessage: boolean
  } | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        setStatus(null)
        return
      }

      const { data: { user } } = await supabase!.auth.getUser()
      
      if (!user) {
        setStatus(null)
        return
      }

      const { data: profile } = await supabase!
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        // Check various permissions
        const [canCreateGigs, canApplyToGigs, canMessage] = await Promise.all([
          supabase!.rpc('can_access_feature', { p_user_id: user.id, p_feature: 'create_gigs' }),
          supabase!.rpc('can_access_feature', { p_user_id: user.id, p_feature: 'apply_to_gigs' }),
          supabase!.rpc('can_access_feature', { p_user_id: user.id, p_feature: 'messaging' })
        ])

        setStatus({
          isAgeVerified: profile.age_verified || false,
          isEmailVerified: !!user.email_confirmed_at,
          isIdentityVerified: profile.role_flags?.includes('VERIFIED_ID') || false,
          accountStatus: profile.account_status || 'pending_verification',
          canCreateGigs: canCreateGigs.data || false,
          canApplyToGigs: canApplyToGigs.data || false,
          canMessage: canMessage.data || false
        })
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      setStatus(null)
    }
  }

  return status
}
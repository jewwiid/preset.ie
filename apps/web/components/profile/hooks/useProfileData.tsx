'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { UserProfile, UserSettings, NotificationPreferences, UseProfileDataReturn } from '../types/profile'

export function useProfileData(): UseProfileDataReturn {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchSettings = useCallback(async () => {
    if (!user || !profile) return

    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Fetch both user settings and notification preferences in parallel
      const [settingsResult, notificationResult] = await Promise.all([
        supabase
          .from('user_settings')
          .select('*')
          .eq('profile_id', profile.id)
          .single(),
        supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ])

      if (settingsResult.error) {
        console.error('Error fetching settings:', settingsResult.error)
      } else {
        setSettings(settingsResult.data)
      }

      if (notificationResult.error) {
        console.error('Error fetching notification preferences:', notificationResult.error)
      } else {
        setNotificationPrefs(notificationResult.data)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    }
  }, [user, profile])

  const refetch = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchSettings()])
  }, [fetchProfile, fetchSettings])

  useEffect(() => {
    if (user) {
      refetch()
    }
  }, [user, refetch])

  return {
    profile,
    settings,
    notificationPrefs,
    loading,
    error,
    refetch
  }
}

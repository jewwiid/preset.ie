import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  avatar_url?: string
  display_name?: string
  role_flags?: string[]
  handle?: string
}

export function useNavBarProfile(user: User | null, loading: boolean) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFetchFailed, setProfileFetchFailed] = useState(false)

  useEffect(() => {
    // Timeout safety
    const loadingTimeoutId = setTimeout(() => {
      if (loading && user) {
        fetchProfile()
      }
    }, 5000)

    // Debounce profile fetching
    const debounceTimeout = setTimeout(() => {
      if (user && !loading) {
        fetchProfile()
      } else if (!user) {
        setProfile(null)
        setProfileLoading(false)
        setProfileFetchFailed(false)
      }
    }, 100)

    return () => {
      clearTimeout(debounceTimeout)
      clearTimeout(loadingTimeoutId)
    }
  }, [user, loading])

  // Listen for OAuth callback completion
  useEffect(() => {
    const handleOAuthCallbackComplete = () => {
      setTimeout(() => {
        if (user && !loading) {
          fetchProfile()
        }
      }, 500)
    }

    window.addEventListener('oauth-callback-complete', handleOAuthCallbackComplete)
    return () => {
      window.removeEventListener('oauth-callback-complete', handleOAuthCallbackComplete)
    }
  }, [user, loading])

  const fetchProfile = async () => {
    if (!user || !supabase) {
      setProfileLoading(false)
      return
    }

    if ((window as any).__disableNavBarProfileFetch) {
      setProfileLoading(false)
      return
    }

    if ((window as any).__triggerNavBarProfileFetch) {
      ;(window as any).__triggerNavBarProfileFetch = false
    }

    setProfileLoading(true)
    setProfileFetchFailed(false)

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('avatar_url, display_name, role_flags, handle')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        setProfile(null)
        setProfileFetchFailed(true)
      } else if (data) {
        setProfile(data)
        setProfileFetchFailed(false)
      } else {
        setProfile(null)
      }
    } catch (error: any) {
      setProfileFetchFailed(true)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const isAdmin = profile?.role_flags?.includes('ADMIN') || false
  const isContributor = profile?.role_flags?.includes('CONTRIBUTOR') || false

  return {
    profile,
    profileLoading,
    profileFetchFailed,
    isAdmin,
    isContributor,
  }
}

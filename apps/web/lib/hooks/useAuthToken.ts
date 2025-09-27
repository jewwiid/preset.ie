'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../auth-context'

/**
 * Hook to get the current auth token
 * This ensures consistent token access across components
 */
export function useAuthToken() {
  const { session } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (session?.access_token) {
      setToken(session.access_token)
    } else {
      setToken(null)
    }
  }, [session])

  return token
}

/**
 * Hook to get headers for API calls with auth token
 */
export function useAuthHeaders() {
  const token = useAuthToken()
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

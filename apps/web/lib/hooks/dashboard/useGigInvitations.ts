import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAuthToken } from '@/lib/auth-utils'

export interface GigInvitation {
  id: string
  gig_id: string
  inviter_id: string
  invitee_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  expires_at: string
  created_at: string
  accepted_at: string | null
  responded_at: string | null
  inviter: {
    id: string
    handle: string
    display_name: string
    avatar_url: string | null
  }
  invitee: {
    id: string
    handle: string
    display_name: string
    avatar_url: string | null
    primary_skill: string | null
  }
  gig: {
    id: string
    title: string
    status: string
    comp_type: string
    location_text: string
    start_time: string
    application_deadline: string
  }
}

export const useGigInvitations = () => {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<GigInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvitations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch('/api/gigs/invitations?type=received&status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const { invitations: data } = await response.json()
        setInvitations(data || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load gig invitations (${response.status})`)
      }
    } catch (err) {
      console.error('Error loading gig invitations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load gig invitations')
    } finally {
      setLoading(false)
    }
  }, [user])

  const acceptInvitation = useCallback(async (invitationId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Authentication required')

      const response = await fetch(`/api/gigs/${invitationId}/invitations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'accept' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept invitation')
      }

      // Reload invitations
      await loadInvitations()
      return true
    } catch (err) {
      console.error('Error accepting invitation:', err)
      throw err
    }
  }, [loadInvitations])

  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Authentication required')

      const response = await fetch(`/api/gigs/${invitationId}/invitations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'decline' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to decline invitation')
      }

      // Reload invitations
      await loadInvitations()
      return true
    } catch (err) {
      console.error('Error declining invitation:', err)
      throw err
    }
  }, [loadInvitations])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  return {
    invitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation,
    refreshInvitations: loadInvitations
  }
}


import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth-context'
import { getAuthToken } from '../../auth-utils'
import { Invitation } from '../../types/dashboard'

export const usePendingInvitations = () => {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInvitations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch('/api/collab/invitations?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const { invitations: data } = await response.json()
        setInvitations(data || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load invitations (${response.status})`)
      }
    } catch (err) {
      console.error('Error loading invitations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }, [user])

  const acceptInvitation = useCallback(async (invitationId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return false

      const response = await fetch(`/api/collab/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted' })
      })

      if (response.ok) {
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        return true
      }

      return false
    } catch (err) {
      console.error('Error accepting invitation:', err)
      return false
    }
  }, [])

  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return false

      const response = await fetch(`/api/collab/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'declined' })
      })

      if (response.ok) {
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        return true
      }

      return false
    } catch (err) {
      console.error('Error declining invitation:', err)
      return false
    }
  }, [])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  return {
    invitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation,
    refetch: loadInvitations
  }
}

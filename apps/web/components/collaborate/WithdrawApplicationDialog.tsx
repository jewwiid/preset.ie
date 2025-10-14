'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Loader2 } from 'lucide-react'
import { getAuthToken } from '@/lib/auth-utils'

interface WithdrawApplicationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projectId: string
  applicationId: string
  roleName: string
}

export function WithdrawApplicationDialog({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  applicationId,
  roleName
}: WithdrawApplicationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      const response = await fetch(
        `/api/collab/projects/${projectId}/applications/${applicationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'withdrawn'
          })
        }
      )

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to withdraw application')
      }
    } catch (err) {
      console.error('Error withdrawing application:', err)
      setError('Failed to withdraw application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to withdraw your application for the <strong>{roleName}</strong> role?
            This action cannot be undone and you will need to reapply if you change your mind.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-md">
            <p className="text-destructive-600 text-sm">{error}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleWithdraw()
            }}
            disabled={loading}
            className="bg-destructive-600 hover:bg-destructive-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Withdrawing...
              </>
            ) : (
              'Withdraw Application'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

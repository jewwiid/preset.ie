'use client'

import { useState, useEffect } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Clock, CheckCircle, XCircle, Star } from 'lucide-react'

interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected' | null
  requested_at?: string
  reviewed_at?: string
  admin_notes?: string
  is_featured: boolean
}

interface ApprovalStatusBadgeProps {
  presetId: string
  isCreator?: boolean
}

export function ApprovalStatusBadge({ presetId, isCreator = false }: ApprovalStatusBadgeProps) {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isCreator) {
      fetchApprovalStatus()
    } else {
      setLoading(false)
    }
  }, [presetId, isCreator])

  const fetchApprovalStatus = async () => {
    try {
      const response = await fetch(`/api/presets/${presetId}/featured-status`)
      if (response.ok) {
        const data = await response.json()
        setApprovalStatus(data)
      }
    } catch (error) {
      console.error('Error fetching approval status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isCreator || loading) {
    return null
  }

  if (!approvalStatus) {
    return null
  }

  const getStatusBadge = () => {
    switch (approvalStatus.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Featured Request Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Featured Request Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Featured Request Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-2">
      {getStatusBadge()}
      
      {approvalStatus.status === 'pending' && approvalStatus.requested_at && (
        <p className="text-xs text-gray-500">
          Requested on {formatDate(approvalStatus.requested_at)}
        </p>
      )}
      
      {approvalStatus.status === 'approved' && approvalStatus.reviewed_at && (
        <p className="text-xs text-gray-500">
          Approved on {formatDate(approvalStatus.reviewed_at)}
        </p>
      )}
      
      {approvalStatus.status === 'rejected' && (
        <div className="space-y-1">
          {approvalStatus.reviewed_at && (
            <p className="text-xs text-gray-500">
              Rejected on {formatDate(approvalStatus.reviewed_at)}
            </p>
          )}
          {approvalStatus.admin_notes && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <p className="text-xs text-red-700 font-medium">Admin Notes:</p>
              <p className="text-xs text-red-600">{approvalStatus.admin_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

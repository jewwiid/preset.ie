'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Ban, 
  Clock, 
  AlertTriangle, 
  UserCheck,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UserActionsModalProps {
  user: {
    user_id: string
    display_name: string
    handle: string
    is_suspended: boolean
    is_banned: boolean
    role_flags: string[]
    subscription_tier: string
  }
  isOpen: boolean
  onClose: () => void
}

export function UserActionsModal({ user, isOpen, onClose }: UserActionsModalProps) {
  const [action, setAction] = useState<string>('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('24')
  const [creditAmount, setCreditAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleAction = async () => {
    if (!action) {
      toast.error('Please select an action')
      return
    }

    if (!reason && ['suspend', 'ban', 'warn'].includes(action)) {
      toast.error('Please provide a reason')
      return
    }

    setProcessing(true)
    try {
      let endpoint = ''
      let body: any = {
        reason,
        notes,
      }

      switch (action) {
        case 'suspend':
          endpoint = `/api/admin/users/${user.user_id}/suspend`
          body.duration_hours = parseInt(duration)
          break
        case 'ban':
          endpoint = `/api/admin/users/${user.user_id}/ban`
          break
        case 'unsuspend':
          endpoint = `/api/admin/users/${user.user_id}/unsuspend`
          break
        case 'unban':
          endpoint = `/api/admin/users/${user.user_id}/unban`
          break
        case 'warn':
          endpoint = `/api/admin/users/${user.user_id}/warn`
          break
        case 'verify':
          endpoint = `/api/admin/users/${user.user_id}/verify`
          body.verification_type = 'manual'
          break
        case 'add_credits':
          endpoint = `/api/admin/users/${user.user_id}/credits`
          body = {
            amount: parseInt(creditAmount),
            reason: reason || 'Admin credit adjustment',
            notes
          }
          break
        case 'change_tier':
          endpoint = `/api/admin/users/${user.user_id}/subscription`
          body.tier = reason // Using reason field for tier selection
          break
        default:
          toast.error('Invalid action')
          return
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(`Action completed successfully`)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error('Failed to perform action')
    } finally {
      setProcessing(false)
    }
  }

  const getAvailableActions = () => {
    const actions = []

    if (user.is_banned) {
      actions.push({ value: 'unban', label: 'Unban User', icon: UserCheck })
    } else if (user.is_suspended) {
      actions.push({ value: 'unsuspend', label: 'Remove Suspension', icon: UserCheck })
      actions.push({ value: 'ban', label: 'Ban User', icon: Ban })
    } else {
      actions.push({ value: 'warn', label: 'Issue Warning', icon: AlertTriangle })
      actions.push({ value: 'suspend', label: 'Suspend User', icon: Clock })
      actions.push({ value: 'ban', label: 'Ban User', icon: Ban })
    }

    if (!user.role_flags?.includes('VERIFIED_ID')) {
      actions.push({ value: 'verify', label: 'Verify User', icon: Shield })
    }

    actions.push({ value: 'add_credits', label: 'Add Credits', icon: CreditCard })
    actions.push({ value: 'change_tier', label: 'Change Subscription', icon: CreditCard })

    return actions
  }

  const renderActionFields = () => {
    switch (action) {
      case 'suspend':
        return (
          <>
            <div>
              <Label>Suspension Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="336">14 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms_violation">Terms Violation</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="fraudulent_activity">Fraudulent Activity</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      case 'ban':
      case 'warn':
        return (
          <div>
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terms_violation">Terms Violation</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="fraudulent_activity">Fraudulent Activity</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="repeated_violations">Repeated Violations</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'add_credits':
        return (
          <>
            <div>
              <Label>Credit Amount *</Label>
              <Input
                type="number"
                placeholder="Enter amount..."
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                min="1"
                max="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive amount to add credits
              </p>
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                placeholder="e.g., Compensation for issue"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </>
        )

      case 'change_tier':
        return (
          <div>
            <Label>New Subscription Tier</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select tier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Current tier: <span className="font-medium capitalize">{user.subscription_tier || 'free'}</span>
            </p>
          </div>
        )

      case 'verify':
        return (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Manual Verification</p>
                <p className="text-blue-700 mt-1">
                  This will grant the user a verified badge without requiring document submission.
                </p>
              </div>
            </div>
          </div>
        )

      case 'unsuspend':
      case 'unban':
        return (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-start gap-2">
              <UserCheck className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Restore Access</p>
                <p className="text-green-700 mt-1">
                  This will immediately restore the user's access to the platform.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Moderate User
          </DialogTitle>
          <DialogDescription>
            Take moderation action for {user.display_name} (@{user.handle})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Current Status:</span>
            {user.is_banned ? (
              <Badge className="bg-red-600 text-white">Banned</Badge>
            ) : user.is_suspended ? (
              <Badge className="bg-orange-600 text-white">Suspended</Badge>
            ) : (
              <Badge className="bg-green-600 text-white">Active</Badge>
            )}
            {user.role_flags?.includes('VERIFIED_ID') && (
              <Badge className="bg-blue-600 text-white">Verified</Badge>
            )}
          </div>

          {/* Action Selection */}
          <div>
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {getAvailableActions().map((act) => {
                  const Icon = act.icon
                  return (
                    <SelectItem key={act.value} value={act.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {act.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields */}
          {action && renderActionFields()}

          {/* Notes */}
          {action && (
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Additional notes (internal only)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={processing || !action}
            className={
              ['ban', 'suspend', 'warn'].includes(action)
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            {processing ? 'Processing...' : 'Confirm Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
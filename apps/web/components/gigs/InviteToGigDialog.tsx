'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, MapPin, DollarSign, Loader2, ChevronDown } from 'lucide-react'
import { getAuthToken } from '@/lib/auth-utils'

interface Gig {
  id: string
  title: string
  status: string
  comp_type: string
  location_text: string
  start_time: string
  application_deadline: string
}

interface InviteToGigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  talentId: string
  talentName: string
}

export function InviteToGigDialog({
  open,
  onOpenChange,
  talentId,
  talentName
}: InviteToGigDialogProps) {
  const { user } = useAuth()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [selectedGig, setSelectedGig] = useState<string>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingInvitations, setExistingInvitations] = useState<Set<string>>(new Set())

  // Fetch user's gigs when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchUserGigs()
    }
  }, [open, user])

  const checkExistingInvitations = async (gigIds: string[], token: string) => {
    try {
      console.log('Checking existing invitations for talent:', talentId, 'across gigs:', gigIds)
      
      // Check each gig for existing invitations to this talent
      const invitationChecks = await Promise.all(
        gigIds.map(async (gigId) => {
          try {
            console.log(`Checking invitations for gig ${gigId}`)
            const response = await fetch(`/api/gigs/${gigId}/invitations?invitee_id=${talentId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            console.log(`Response for gig ${gigId}:`, response.status, response.ok)
            
            if (response.ok) {
              const data = await response.json()
              console.log(`Invitations data for gig ${gigId}:`, data)
              
              // Check if there's a pending invitation
              const hasPendingInvitation = data.invitations?.some(
                (inv: any) => inv.invitee_id === talentId && inv.status === 'pending'
              )
              
              console.log(`Has pending invitation for gig ${gigId}:`, hasPendingInvitation)
              return hasPendingInvitation ? gigId : null
            } else {
              console.error(`Failed to fetch invitations for gig ${gigId}:`, response.status)
            }
            return null
          } catch (error) {
            console.error(`Error checking gig ${gigId}:`, error)
            return null
          }
        })
      )

      // Filter out nulls and create a Set of gig IDs with existing invitations
      const gigsWithInvitations = invitationChecks.filter(Boolean) as string[]
      console.log('Gigs with existing invitations:', gigsWithInvitations)
      setExistingInvitations(new Set(gigsWithInvitations))
    } catch (err) {
      console.error('Error checking existing invitations:', err)
    }
  }

  const fetchUserGigs = async () => {
    try {
      setFetching(true)
      setError(null)
      
      const token = await getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      // Fetch user's gigs that are DRAFT or PUBLISHED
      const response = await fetch('/api/gigs?owner=me&status=DRAFT,PUBLISHED', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch gigs')
      }

      const data = await response.json()
      setGigs(data.gigs || [])

      if (!data.gigs || data.gigs.length === 0) {
        setError('You don\'t have any active gigs. Create a gig first to send invitations.')
      } else {
        // Check for existing invitations
        await checkExistingInvitations(data.gigs.map((g: Gig) => g.id), token)
      }
    } catch (err: any) {
      console.error('Error fetching gigs:', err)
      setError(err.message || 'Failed to load your gigs')
    } finally {
      setFetching(false)
    }
  }

  const handleInvite = async () => {
    if (!selectedGig) {
      setError('Please select a gig')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const token = await getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`/api/gigs/${selectedGig}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invitee_id: talentId,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API Error Response:', data)
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || data.message || 'Failed to send invitation')
        throw new Error(errorMsg)
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        // Reset form
        setSelectedGig('')
        setMessage('')
        setSuccess(false)
      }, 1500)

    } catch (err: any) {
      console.error('Error sending invitation:', err)
      setError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const getCompTypeLabel = (type: string) => {
    switch (type) {
      case 'PAID': return 'Paid'
      case 'TFP': return 'TFP'
      case 'EXPENSES': return 'Expenses'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Invite {talentName} to a Gig</DialogTitle>
          <DialogDescription>
            Select one of your gigs to invite this talent to apply. They will receive a notification and can accept or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Gig Selection */}
          <div className="space-y-2">
            <Label htmlFor="gig">Select Gig *</Label>
            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : gigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">No Active Gigs</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Create a gig first to send invitations to talent.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open('/gigs/create', '_blank')}
                  className="text-xs"
                >
                  Create New Gig
                </Button>
              </div>
            ) : (
              <Select value={selectedGig} onValueChange={setSelectedGig}>
                <SelectTrigger className="h-auto min-h-[60px] p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <SelectValue placeholder="Choose a gig...">
                    {selectedGig && gigs.find(g => g.id === selectedGig) && (
                      <div className="flex flex-col gap-1 text-left w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {gigs.find(g => g.id === selectedGig)?.title}
                          </span>
                          <Badge 
                            variant={gigs.find(g => g.id === selectedGig)?.status === 'PUBLISHED' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {gigs.find(g => g.id === selectedGig)?.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {gigs.find(g => g.id === selectedGig)?.location_text}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(gigs.find(g => g.id === selectedGig)?.start_time || '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {getCompTypeLabel(gigs.find(g => g.id === selectedGig)?.comp_type || '')}
                          </span>
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-w-[500px]">
                  {gigs.map((gig) => {
                    const hasInvitation = existingInvitations.has(gig.id)
                    const isDeadlinePassed = gig.application_deadline ? new Date(gig.application_deadline) < new Date() : false
                    const isDisabled = hasInvitation || isDeadlinePassed
                    
                    return (
                      <SelectItem 
                        key={gig.id} 
                        value={gig.id} 
                        disabled={isDisabled}
                        className="p-0"
                      >
                        <div className="flex flex-col gap-2 p-3 w-full">
                          {/* Header with title and status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm leading-tight truncate ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {gig.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge 
                                variant={gig.status === 'PUBLISHED' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {gig.status}
                              </Badge>
                              {hasInvitation && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  ✓ Already Invited
                                </Badge>
                              )}
                              {isDeadlinePassed && !hasInvitation && (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                                  ⚠️ Deadline Passed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Gig details */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[120px]">{gig.location_text}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(gig.start_time)}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>{getCompTypeLabel(gig.comp_type)}</span>
                            </span>
                          </div>
                          
                          {/* Application deadline warning if passed */}
                          {isDeadlinePassed && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Cannot invite - application deadline has passed</span>
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder={`Hi ${talentName.split(' ')[0]}, I think you'd be perfect for this gig!`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-primary-500/10 border border-primary-500/20 p-3">
              <p className="text-sm text-primary">
                ✓ Invitation sent successfully!
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInvite}
            disabled={loading || !selectedGig || gigs.length === 0 || success}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


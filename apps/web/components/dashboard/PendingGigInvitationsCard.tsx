'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Briefcase, Calendar, MapPin, DollarSign, CheckCircle, X, Loader2 } from 'lucide-react'
import { GigInvitation } from '@/lib/hooks/dashboard/useGigInvitations'

interface PendingGigInvitationsCardProps {
  invitations: GigInvitation[]
  loading: boolean
  onAccept: (invitationId: string) => Promise<boolean>
  onDecline: (invitationId: string) => Promise<boolean>
}

export function PendingGigInvitationsCard({
  invitations,
  loading,
  onAccept,
  onDecline
}: PendingGigInvitationsCardProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAccept = async (invitationId: string) => {
    try {
      setProcessingId(invitationId)
      setActionError(null)
      await onAccept(invitationId)
    } catch (error: any) {
      setActionError(error.message || 'Failed to accept invitation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (invitationId: string) => {
    try {
      setProcessingId(invitationId)
      setActionError(null)
      await onDecline(invitationId)
    } catch (error: any) {
      setActionError(error.message || 'Failed to decline invitation')
    } finally {
      setProcessingId(null)
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

  const formatExpiresIn = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return 'Expires tomorrow'
    return `Expires in ${diffDays} days`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Gig Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!invitations || invitations.length === 0) {
    return null // Don't show card if no invitations
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Gig Invitations
          <Badge variant="default" className="ml-auto">
            {invitations.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          You've been invited to apply for these gigs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {actionError && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{actionError}</p>
          </div>
        )}

        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
            >
              {/* Header: Inviter Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={invitation.inviter.avatar_url || undefined} />
                  <AvatarFallback>
                    {invitation.inviter.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <Link 
                      href={`/users/${invitation.inviter.handle}`}
                      className="hover:underline"
                    >
                      {invitation.inviter.display_name}
                    </Link>
                    {' '}invited you to apply
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatExpiresIn(invitation.expires_at)}
                  </p>
                </div>
              </div>

              {/* Gig Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-base">
                  <Link 
                    href={`/gigs/${invitation.gig.id}`}
                    className="hover:underline"
                  >
                    {invitation.gig.title}
                  </Link>
                </h4>

                {/* Gig Info Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {invitation.gig.location_text}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(invitation.gig.start_time)}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    {getCompTypeLabel(invitation.gig.comp_type)}
                  </div>
                </div>

                {/* Message */}
                {invitation.message && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground italic">
                      "{invitation.message}"
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(invitation.id)}
                  disabled={processingId === invitation.id}
                  className="flex-1"
                >
                  {processingId === invitation.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Apply
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={processingId === invitation.id}
                  className="flex-1"
                >
                  {processingId === invitation.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {invitations.length > 3 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/dashboard/invitations?type=gigs">
              <Button variant="ghost" className="w-full">
                View All Gig Invitations
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


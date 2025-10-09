'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  MessageSquare,
  Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SentInvitation {
  id: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  message?: string
  created_at: string
  expires_at: string
  invitee: {
    id: string
    handle: string
    display_name: string
    avatar_url?: string
    primary_skill?: string
  }
  gig: {
    id: string
    title: string
    status: string
  }
}

interface SentGigInvitationsCardProps {
  gigId: string
  className?: string
}

export function SentGigInvitationsCard({ 
  gigId, 
  className = "" 
}: SentGigInvitationsCardProps) {
  const [invitations, setInvitations] = useState<SentInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSentInvitations = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch(`/api/gigs/${gigId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (err: any) {
      console.error('Error fetching sent invitations:', err)
      setError(err.message || 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSentInvitations()
  }, [gigId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ Pending</Badge>
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">✅ Accepted</Badge>
      case 'declined':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">❌ Declined</Badge>
      case 'expired':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">⏰ Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sent Invitations
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

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sent Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchSentInvitations} size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sent Invitations
          </CardTitle>
          <CardDescription>
            Track invitations you've sent to talent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No invitations sent yet</h3>
            <p className="text-muted-foreground mb-4">
              Invite talent to apply for this gig from their profiles.
            </p>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Browse Talent
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sent Invitations
          <Badge variant="default" className="ml-auto">
            {invitations.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Track invitations sent to talent for this gig
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
            >
              {/* Header: Invitee Info & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invitation.invitee.avatar_url || undefined} />
                    <AvatarFallback>
                      {invitation.invitee.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      <Link 
                        href={`/users/${invitation.invitee.handle}`}
                        className="hover:underline"
                      >
                        {invitation.invitee.display_name}
                      </Link>
                    </p>
                    {invitation.invitee.primary_skill && (
                      <p className="text-xs text-muted-foreground">
                        {invitation.invitee.primary_skill}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(invitation.status)}
                </div>
              </div>

              {/* Message */}
              {invitation.message && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground italic">
                      "{invitation.message}"
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline & Actions */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Sent {formatDate(invitation.created_at)}
                  </div>
                  <div className={`flex items-center gap-1 ${isExpired(invitation.expires_at) ? 'text-destructive' : ''}`}>
                    <Clock className="h-3 w-3" />
                    {formatExpiresIn(invitation.expires_at)}
                  </div>
                </div>

                {/* Actions based on status */}
                <div className="flex items-center gap-2">
                  {invitation.status === 'accepted' && (
                    <Link href={`/users/${invitation.invitee.handle}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </Link>
                  )}
                  {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                    <Badge variant="outline" className="text-xs">
                      Waiting for response
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {invitations.length > 3 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" className="w-full">
              View All Invitations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign,
  CheckCircle, 
  X, 
  Loader2,
  MessageSquare,
  ArrowLeft,
  Clock,
  Mail
} from 'lucide-react'
import Link from 'next/link'

interface GigInvitation {
  id: string
  status: string
  message?: string
  created_at: string
  expires_at: string
  inviter: {
    id: string
    handle: string
    display_name: string
    avatar_url?: string
  }
  gig: {
    id: string
    title: string
    status: string
    location_text: string
    start_time: string
    comp_type: string
  }
}

interface CollabInvitation {
  id: string
  status: string
  message?: string
  created_at: string
  expires_at: string
  inviter: {
    id: string
    handle: string
    display_name: string
    avatar_url?: string
  }
  project: {
    id: string
    title: string
    description?: string
    city?: string
    country?: string
    start_date?: string
    end_date?: string
  }
  role?: {
    id: string
    role_name: string
  }
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    }>
      <InvitationsPageContent />
    </Suspense>
  )
}

function InvitationsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'gigs' | 'collabs'>('gigs')
  const [gigInvitations, setGigInvitations] = useState<GigInvitation[]>([])
  const [collabInvitations, setCollabInvitations] = useState<CollabInvitation[]>([])
  const [gigLoading, setGigLoading] = useState(true)
  const [collabLoading, setCollabLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Set initial tab from URL parameter
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'gigs' || type === 'collabs') {
      setActiveTab(type)
    }
  }, [searchParams])

  // Fetch gig invitations
  useEffect(() => {
    if (user) {
      fetchGigInvitations()
    }
  }, [user])

  // Fetch collaboration invitations
  useEffect(() => {
    if (user) {
      fetchCollabInvitations()
    }
  }, [user])

  const fetchGigInvitations = async () => {
    if (!supabase) return
    
    try {
      setGigLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/gigs/invitations?type=received&status=pending', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGigInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error('Error fetching gig invitations:', err)
    } finally {
      setGigLoading(false)
    }
  }

  const fetchCollabInvitations = async () => {
    if (!supabase) return
    
    try {
      setCollabLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/collab/invitations?status=pending', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCollabInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error('Error fetching collab invitations:', err)
    } finally {
      setCollabLoading(false)
    }
  }

  const handleGigInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    if (!supabase) return
    
    try {
      setProcessingId(invitationId)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Find the gig ID for this invitation
      const invitation = gigInvitations.find(inv => inv.id === invitationId)
      if (!invitation) throw new Error('Invitation not found')

      const response = await fetch(`/api/gigs/${invitation.gig.id}/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} invitation`)
      }

      // Remove invitation from list
      setGigInvitations(prev => prev.filter(inv => inv.id !== invitationId))

      // If accepted, redirect to gig application
      if (action === 'accept') {
        router.push(`/gigs/${invitation.gig.id}`)
      }
    } catch (err: any) {
      console.error(`Error ${action}ing gig invitation:`, err)
      setError(err.message || `Failed to ${action} invitation`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleCollabInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    if (!supabase) return
    
    try {
      setProcessingId(invitationId)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/collab/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} invitation`)
      }

      // Remove invitation from list
      setCollabInvitations(prev => prev.filter(inv => inv.id !== invitationId))

      // If accepted, redirect to project
      if (action === 'accept') {
        const invitation = collabInvitations.find(inv => inv.id === invitationId)
        if (invitation) {
          router.push(`/collaborate/projects/${invitation.project.id}`)
        }
      }
    } catch (err: any) {
      console.error(`Error ${action}ing collab invitation:`, err)
      setError(err.message || `Failed to ${action} invitation`)
    } finally {
      setProcessingId(null)
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const getCompTypeLabel = (type: string) => {
    switch (type) {
      case 'PAID': return 'Paid'
      case 'TFP': return 'TFP'
      case 'EXPENSES': return 'Expenses'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">My Invitations</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your gig and collaboration invitations in one place
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'gigs' | 'collabs')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="gigs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Gig Invitations
              {gigInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {gigInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collabs" className="gap-2">
              <Users className="h-4 w-4" />
              Collaborations
              {collabInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {collabInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Gig Invitations Tab */}
          <TabsContent value="gigs" className="mt-6">
            {gigLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                </CardContent>
              </Card>
            ) : gigInvitations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No Gig Invitations
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      You don't have any pending gig invitations at the moment.
                    </p>
                    <Link href="/directory">
                      <Button variant="outline">
                        Browse Gigs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {gigInvitations.map((invitation) => {
                  const expired = isExpired(invitation.expires_at)
                  const isProcessing = processingId === invitation.id

                  return (
                    <Card key={invitation.id} className={expired ? 'opacity-60' : ''}>
                      <CardContent className="pt-6">
                        {/* Header: Inviter Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={invitation.inviter.avatar_url || undefined} />
                            <AvatarFallback>
                              {invitation.inviter.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              <Link 
                                href={`/users/${invitation.inviter.handle}`}
                                className="font-medium text-foreground hover:underline"
                              >
                                {invitation.inviter.display_name}
                              </Link>
                              {' '}invited you to apply
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(invitation.created_at)}
                              <span className="mx-1">•</span>
                              <Clock className={`h-3 w-3 ${expired ? 'text-destructive' : ''}`} />
                              <span className={expired ? 'text-destructive' : ''}>
                                {formatExpiresIn(invitation.expires_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Gig Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg">
                            <Link 
                              href={`/gigs/${invitation.gig.id}`}
                              className="hover:underline"
                            >
                              {invitation.gig.title}
                            </Link>
                          </h4>

                          {/* Gig Info */}
                          <div className="flex flex-wrap gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {invitation.gig.location_text}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(invitation.gig.start_time)}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              {getCompTypeLabel(invitation.gig.comp_type)}
                            </div>
                          </div>

                          {/* Message */}
                          {invitation.message && (
                            <div className="bg-muted p-3 rounded-md">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground italic">
                                  "{invitation.message}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!expired && (
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              onClick={() => handleGigInvitationAction(invitation.id, 'accept')}
                              disabled={isProcessing}
                              className="flex-1"
                            >
                              {isProcessing ? (
                                <>
                                  <LoadingSpinner size="sm" />
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
                              variant="outline"
                              onClick={() => handleGigInvitationAction(invitation.id, 'decline')}
                              disabled={isProcessing}
                              className="flex-1"
                            >
                              {isProcessing ? (
                                <>
                                  <LoadingSpinner size="sm" />
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
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Collaboration Invitations Tab */}
          <TabsContent value="collabs" className="mt-6">
            {collabLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                </CardContent>
              </Card>
            ) : collabInvitations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No Collaboration Invitations
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      You don't have any pending collaboration invitations at the moment.
                    </p>
                    <Link href="/collaborate">
                      <Button variant="outline">
                        Browse Projects
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {collabInvitations.map((invitation) => {
                  const expired = isExpired(invitation.expires_at)
                  const isProcessing = processingId === invitation.id

                  return (
                    <Card key={invitation.id} className={expired ? 'opacity-60' : ''}>
                      <CardContent className="pt-6">
                        {/* Header: Inviter Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={invitation.inviter.avatar_url || undefined} />
                            <AvatarFallback>
                              {invitation.inviter.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              <Link 
                                href={`/users/${invitation.inviter.handle}`}
                                className="font-medium text-foreground hover:underline"
                              >
                                {invitation.inviter.display_name}
                              </Link>
                              {' '}invited you to join
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(invitation.created_at)}
                              <span className="mx-1">•</span>
                              <Clock className={`h-3 w-3 ${expired ? 'text-destructive' : ''}`} />
                              <span className={expired ? 'text-destructive' : ''}>
                                {formatExpiresIn(invitation.expires_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Project Details */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-lg">
                              <Link 
                                href={`/collaborate/projects/${invitation.project.id}`}
                                className="hover:underline"
                              >
                                {invitation.project.title}
                              </Link>
                            </h4>
                            {invitation.role && (
                              <Badge variant="secondary">
                                {invitation.role.role_name}
                              </Badge>
                            )}
                          </div>

                          {invitation.project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {invitation.project.description}
                            </p>
                          )}

                          {/* Project Info */}
                          {(invitation.project.city || invitation.project.start_date) && (
                            <div className="flex flex-wrap gap-3 text-sm">
                              {invitation.project.city && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {invitation.project.city}
                                  {invitation.project.country && `, ${invitation.project.country}`}
                                </div>
                              )}
                              {invitation.project.start_date && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(invitation.project.start_date)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message */}
                          {invitation.message && (
                            <div className="bg-muted p-3 rounded-md">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground italic">
                                  "{invitation.message}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!expired && (
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              onClick={() => handleCollabInvitationAction(invitation.id, 'accept')}
                              disabled={isProcessing}
                              className="flex-1"
                            >
                              {isProcessing ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleCollabInvitationAction(invitation.id, 'decline')}
                              disabled={isProcessing}
                              className="flex-1"
                            >
                              {isProcessing ? (
                                <>
                                  <LoadingSpinner size="sm" />
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
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


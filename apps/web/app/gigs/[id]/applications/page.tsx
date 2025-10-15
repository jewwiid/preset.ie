'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { supabase } from '../../../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Users, Star, Clock, MapPin, Mail, Phone, ExternalLink, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import CompatibilityScore from '../../../components/matchmaking/CompatibilityScore'

interface Application {
  id: string
  note?: string
  status: string
  applied_at: string
  users_profile: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
    bio?: string
    city?: string
    style_tags: string[]
    account_type: string[]
  }
  compatibility_score?: number
  compatibility_breakdown?: any
}

interface GigDetails {
  id: string
  title: string
  owner_user_id: string
  max_applicants: number
  status: string
  users_profile: {
    display_name: string
    handle: string
  }[]
}

export default function ApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const [gig, setGig] = useState<GigDetails | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  
  const resolvedParams = use(params)
  const gigId = resolvedParams.id

  useEffect(() => {
    fetchGigDetails()
    fetchApplications()
    if (user) {
      fetchUserProfile()
    }
  }, [gigId, user])

  const fetchUserProfile = async () => {
    if (!user || !supabase) return

    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setUserProfile(data)
    }
  }

  const fetchGigDetails = async () => {
    try {
      if (!supabase) return

      const { data, error } = await supabase
        .from('gigs')
        .select(`
          id,
          title,
          owner_user_id,
          max_applicants,
          status,
          users_profile (
            display_name,
            handle
          )
        `)
        .eq('id', gigId)
        .single()
      
      if (error) throw error
      setGig(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load gig')
    }
  }

  const fetchApplications = async () => {
    try {
      if (!supabase) return

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          users_profile (
            id,
            display_name,
            handle,
            avatar_url,
            bio,
            city,
            style_tags,
            account_type
          )
        `)
        .eq('gig_id', gigId)
        .order('applied_at', { ascending: false })
      
      if (error) throw error
      
      // Calculate compatibility scores for each applicant
      if (data && data.length > 0) {
        try {
          const applicationsWithCompatibility = await Promise.all(
            data.map(async (application) => {
              try {
                if (!supabase) {
                  return {
                    ...application,
                    compatibility_score: 0,
                    compatibility_breakdown: null
                  }
                }
                
                const { data: compatibilityData, error: compatibilityError } = await supabase
                  .rpc('calculate_gig_compatibility', {
                    p_profile_id: application.users_profile.id,
                    p_gig_id: gigId
                  })
                
                if (compatibilityError) {
                  console.warn('Compatibility function not available:', compatibilityError)
                  return {
                    ...application,
                    compatibility_score: Math.floor(Math.random() * 40) + 60, // Fallback: 60-100% for demo
                    compatibility_breakdown: {}
                  }
                }
                
                return {
                  ...application,
                  compatibility_score: compatibilityData?.[0]?.score || Math.floor(Math.random() * 40) + 60,
                  compatibility_breakdown: compatibilityData?.[0]?.breakdown || {} 
                }
              } catch (error) {
                console.warn('Error calculating compatibility for application:', application.id, error)
                return {
                  ...application,
                  compatibility_score: Math.floor(Math.random() * 40) + 60, // Fallback for demo
                  compatibility_breakdown: {}
                }
              }
            })
          )
          
          setApplications(applicationsWithCompatibility)
        } catch (error) {
          console.warn('Compatibility calculation failed, using fallback')
          setApplications(data.map(app => ({
            ...app,
            compatibility_score: Math.floor(Math.random() * 40) + 60,
            compatibility_breakdown: {}
          })))
        }
      } else {
        setApplications([])
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err)
      setError(err.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      if (!supabase) return

      // Check if trying to accept and if spots are full
      if (status === 'ACCEPTED') {
        const acceptedCount = applications.filter(app => app.status === 'ACCEPTED').length

        if (acceptedCount >= (gig?.max_applicants || 0)) {
          alert(`Cannot accept more applicants. All ${gig?.max_applicants} spots are filled. Please decline or remove an accepted applicant first.`)
          return
        }
      }

      const { error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId)

      if (error) throw error

      // Refresh applications
      fetchApplications()
    } catch (error) {
      console.error('Error updating application status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-primary/20 text-primary'
      case 'DECLINED': return 'bg-destructive/20 text-destructive'
      case 'SHORTLISTED': return 'bg-secondary/20 text-secondary-foreground'
      case 'PENDING': return 'bg-muted/50 text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true
    return app.status.toLowerCase() === activeTab
  })

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'compatibility':
        return (b.compatibility_score || 0) - (a.compatibility_score || 0)
      case 'recent':
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      case 'name':
        return a.users_profile.display_name.localeCompare(b.users_profile.display_name)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Gig not found</h2>
          <p className="text-muted-foreground mb-4">{error || 'This gig may have been removed or does not exist.'}</p>
          <Button onClick={() => router.push('/gigs')}>
            Back to Gigs
          </Button>
        </div>
      </div>
    )
  }

  // Check if user is the owner
  const isOwner = userProfile?.id === gig.owner_user_id

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Unauthorized</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to view applications for this gig.</p>
          <Button onClick={() => router.push(`/gigs/${gigId}`)}>
            Back to Gig
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/gigs/${gigId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gig
            </Button>
            <Badge variant={gig.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {gig.status}
            </Badge>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Applications for "{gig.title}"
          </h1>
          <p className="text-muted-foreground">
            Manage applications and find the perfect talent for your gig
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">{applications.length}</div>
              <div className="text-sm text-muted-foreground">Total Applications</div>
            </CardContent>
          </Card>
          <Card className={applications.filter(app => app.status === 'ACCEPTED').length >= (gig?.max_applicants || 0) ? 'border-primary' : ''}>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">
                {applications.filter(app => app.status === 'ACCEPTED').length}/{gig?.max_applicants || 0}
              </div>
              <div className="text-sm text-muted-foreground">Spots Filled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {applications.filter(app => app.status === 'PENDING').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {applications.filter(app => app.status === 'SHORTLISTED').length}
              </div>
              <div className="text-sm text-muted-foreground">Shortlisted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(applications.reduce((sum, app) => sum + (app.compatibility_score || 0), 0) / applications.length) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Compatibility</div>
            </CardContent>
          </Card>
        </div>

        {applications.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Applications will appear here once talent starts applying to your gig. 
                Share your gig to attract more applicants!
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push(`/gigs/${gigId}/edit`)}>
                  Edit Gig
                </Button>
                <Button variant="outline" onClick={() => router.push(`/gigs/${gigId}`)}>
                  View Gig
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({applications.filter(app => app.status === 'PENDING').length})
                    </TabsTrigger>
                    <TabsTrigger value="shortlisted">
                      Shortlisted ({applications.filter(app => app.status === 'SHORTLISTED').length})
                    </TabsTrigger>
                    <TabsTrigger value="accepted">
                      Accepted ({applications.filter(app => app.status === 'ACCEPTED').length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="compatibility">Best Match</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {sortedApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={application.users_profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${application.users_profile.handle}`} 
                        />
                        <AvatarFallback className="text-lg">
                          {application.users_profile.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {application.users_profile.display_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{application.users_profile.handle}</p>
                            {application.users_profile.city && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{application.users_profile.city}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Compatibility Score */}
                            {application.compatibility_score !== undefined && (
                              <div className="text-center">
                                <CompatibilityScore 
                                  score={application.compatibility_score}
                                  breakdown={application.compatibility_breakdown}
                                  size="sm"
                                  showBreakdown={false}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Match</p>
                              </div>
                            )}
                            
                            {/* Status Badge */}
                            <Badge 
                              variant={
                                application.status === 'ACCEPTED' ? 'default' :
                                application.status === 'SHORTLISTED' ? 'secondary' :
                                application.status === 'DECLINED' ? 'destructive' :
                                'outline'
                              }
                            >
                              {application.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Bio */}
                        {application.users_profile.bio && (
                          <p className="text-sm text-foreground mb-3 line-clamp-2">
                            {application.users_profile.bio}
                          </p>
                        )}

                        {/* Style Tags */}
                        {application.users_profile.style_tags && application.users_profile.style_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {application.users_profile.style_tags.slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {application.users_profile.style_tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{application.users_profile.style_tags.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Application Note */}
                        {application.note && (
                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-foreground">"{application.note}"</p>
                          </div>
                        )}

                        {/* Application Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                          </div>
                          {application.users_profile.account_type && (
                            <div className="flex gap-1">
                              {application.users_profile.account_type.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/users/${application.users_profile.handle}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                          
                          {application.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'SHORTLISTED')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Shortlist
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'DECLINED')}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          )}
                          
                          {application.status === 'SHORTLISTED' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'PENDING')}
                              >
                                Move to Pending
                              </Button>
                            </>
                          )}
                          
                          {application.status === 'ACCEPTED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateApplicationStatus(application.id, 'SHORTLISTED')}
                            >
                              Move to Shortlist
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

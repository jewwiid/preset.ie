'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import CompatibilityScore from '../../components/matchmaking/CompatibilityScore'
import MatchmakingCard from '../../components/matchmaking/MatchmakingCard'
import CompatibilityBreakdownModal from '../../components/matchmaking/CompatibilityBreakdownModal'
import SimilarTalentSlim from '../../components/SimilarTalentSlim'
import { CompatibilityData, Recommendation } from '../../../lib/types/matchmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin, Calendar, Clock, Users, Eye, Edit, ArrowLeft, Palette, Camera, Star, Sparkles, CheckCircle, Upload, CheckSquare } from 'lucide-react'
import LocationMap from '../../../components/LocationMap'
// import { GigShowcaseUpload } from '../../components/gigs/GigShowcaseUpload'
// import { ShowcaseApprovalReview } from '../../components/showcases/ShowcaseApprovalReview'

interface GigDetails {
  id: string
  title: string
  description: string
  purpose?: string
  comp_type: string
  usage_rights: string
  location_text: string
  location?: {
    lat: number
    lng: number
  }
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  status: string
  created_at: string
  owner_user_id: string
  users_profile?: {
    display_name: string
    handle: string
    city?: string
    style_tags: string[]
    avatar_url?: string
  }
}

export default function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, session } = useAuth()
  const [gig, setGig] = useState<GigDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [moodboardData, setMoodboardData] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [applicationCount, setApplicationCount] = useState(0)
  const [acceptedApplicants, setAcceptedApplicants] = useState<any[]>([])
  const [acceptedCount, setAcceptedCount] = useState(0)
  
  // Showcase state
  const [showcase, setShowcase] = useState<any>(null)
  const [showCreateShowcase, setShowCreateShowcase] = useState(false)
  const [showApprovalReview, setShowApprovalReview] = useState(false)
  
  // Matchmaking state
  const [compatibilityData, setCompatibilityData] = useState<CompatibilityData | null>(null)
  const [similarUsers, setSimilarUsers] = useState<Recommendation[]>([])
  const [similarGigs, setSimilarGigs] = useState<Recommendation[]>([])
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false)
  const [matchmakingLoading, setMatchmakingLoading] = useState(false)
  
  // Unwrap params with React.use() for Next.js 15
  const resolvedParams = use(params)
  const gigId = resolvedParams.id

  useEffect(() => {
    fetchGigDetails()
    fetchMoodboardData()
    fetchApplications()
    fetchAcceptedApplicants()
    fetchShowcase()
    if (user) {
      fetchUserProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gigId, user])

  useEffect(() => {
    if (gig && userProfile) {
      fetchMatchmakingData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gig, userProfile])

  const fetchUserProfile = async () => {
    if (!user) return
    
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setUserProfile(data)
    }
  }

  // Helper function to get featured image from moodboard
  const getFeaturedImage = () => {
    if (!moodboardData?.featured_image_id || !moodboardData?.items) return null
    
    const featuredItem = moodboardData.items.find((item: any) => item.id === moodboardData.featured_image_id)
    return featuredItem || null
  }

  const featuredImage = getFeaturedImage()

  const fetchMoodboardData = async () => {
    if (!supabase) return

    try {
      const { data } = await supabase
        .from('moodboards')
        .select('*')
        .eq('gig_id', gigId)
        .single()
      
      if (data) {
        // Sort items by position if they exist
        if (data.items && Array.isArray(data.items)) {
          data.items.sort((a: any, b: any) => a.position - b.position)
        }
        setMoodboardData(data)
      }
    } catch (error) {
      console.log('No moodboard found for this gig')
    }
  }

  const fetchApplications = async () => {
    if (!supabase) return

    try {
      const { data, error, count } = await supabase
        .from('applications')
        .select(`
          *,
          users_profile (
            display_name,
            handle,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('gig_id', gigId)
        .order('applied_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (data) {
        setApplications(data)
        setApplicationCount(count || 0)
      }
    } catch (error) {
      console.log('Error fetching applications:', error)
    }
  }

  const fetchAcceptedApplicants = async () => {
    if (!supabase) return

    try {
      // Fetch both ACCEPTED and PENDING applications (invitation acceptances)
      const { data, error, count } = await supabase
        .from('applications')
        .select(`
          *,
          users_profile (
            id,
            display_name,
            handle,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('gig_id', gigId)
        .in('status', ['ACCEPTED', 'PENDING'])
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data) {
        setAcceptedApplicants(data)
        setAcceptedCount(count || 0)
      }
    } catch (error) {
      console.log('Error fetching accepted applicants:', error)
    }
  }

  const fetchShowcase = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('showcases')
        .select(`
          *,
          creator:users_profile!showcases_creator_user_id_fkey (
            display_name,
            handle,
            avatar_url
          ),
          talent:users_profile!showcases_talent_user_id_fkey (
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('gig_id', gigId)
        .eq('from_gig', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setShowcase(data)
      }
    } catch (error) {
      console.log('Error fetching showcase:', error)
    }
  }

  const fetchMatchmakingData = async () => {
    if (!gig || !userProfile || !supabase) return

    try {
      setMatchmakingLoading(true)

      // Fetch compatibility score for current user
      try {
        const { data: compatibilityResult, error: compatibilityError } = await supabase
          .rpc('calculate_gig_compatibility', {
            p_profile_id: userProfile.id,
            p_gig_id: gig.id
          })

        if (compatibilityError) {
          console.warn('Compatibility function not available:', compatibilityError)
        } else if (compatibilityResult && compatibilityResult.length > 0) {
          setCompatibilityData(compatibilityResult[0])
        }
      } catch (error) {
        console.warn('Compatibility calculation not available:', error)
      }

      // Fetch similar users (talent recommendations)
      try {
        const { data: similarUsersData, error: similarUsersError } = await supabase
          .rpc('get_gig_talent_recommendations', {
            p_gig_id: gig.id,
            p_limit: 6
          })

        if (similarUsersError) {
          console.warn('Similar users function not available:', similarUsersError)
        } else if (similarUsersData) {
          setSimilarUsers(similarUsersData)
        }
      } catch (error) {
        console.warn('Similar users calculation not available:', error)
      }

      // Fetch similar gigs
      try {
        const { data: similarGigsData, error: similarGigsError } = await supabase
          .rpc('get_user_gig_recommendations', {
            p_profile_id: userProfile.id,
            p_limit: 6
          })

        if (similarGigsError) {
          console.warn('Similar gigs function not available:', similarGigsError)
        } else if (similarGigsData) {
          setSimilarGigs(similarGigsData)
        }
      } catch (error) {
        console.warn('Similar gigs calculation not available:', error)
      }

    } catch (error) {
      console.error('Error in fetchMatchmakingData:', error)
    } finally {
      setMatchmakingLoading(false)
    }
  }

  const fetchGigDetails = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // First get the basic gig data
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          users_profile (
            display_name,
            handle,
            city,
            style_tags,
            avatar_url
          )
        `)
        .eq('id', gigId)
        .single()
      
      // Extract coordinates from location field if available
      let processedData = data
      if (data && data.location) {
        try {
          // Try to extract coordinates using PostGIS functions
          const { data: coordsData, error: coordsError } = await supabase
            .rpc('get_location_coordinates', { gig_id: gigId })
          
          if (!coordsError && coordsData && coordsData.length > 0) {
            processedData = {
              ...data,
              location: {
                lat: coordsData[0].latitude,
                lng: coordsData[0].longitude
              }
            }
          }
        } catch (coordsError) {
          console.warn('Could not extract coordinates:', coordsError)
          // Continue without coordinates
        }
      }
      
      if (error) throw error
      
      setGig(processedData)
    } catch (err: any) {
      console.error('Error fetching gig:', err)
      setError(err.message || 'Failed to load gig')
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCompensationType = (type: string) => {
    switch (type) {
      case 'PAID': return 'Paid'
      case 'TFP': return 'TFP (Trade for Photos)'
      case 'EXPENSES': return 'Expenses Covered'
      default: return type
    }
  }

  const getPurposeLabel = (purpose?: string) => {
    if (!purpose) return 'Not specified'
    return purpose.charAt(0).toUpperCase() + purpose.slice(1).toLowerCase()
  }

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

  const isOwner = userProfile?.id === gig.owner_user_id
  const isTalent = userProfile?.account_type?.includes('TALENT')
  const applicationDeadlinePassed = new Date(gig.application_deadline) < new Date()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner with Moodboard Background */}
      <div className="relative h-[500px] overflow-hidden border-b border-border">
        {/* Background Image - Use moodboard images if available */}
        {moodboardData && moodboardData.items && moodboardData.items.length > 0 ? (
          <>
            {/* Moodboard Image Grid */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1">
              {moodboardData.items.slice(0, 6).map((item: any, index: number) => (
                <div
                  key={index}
                  className="relative w-full h-full"
                >
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={`Moodboard ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Stronger gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          </>
        ) : (
          <>
            {/* Fallback gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </>
        )}

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between py-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/gigs')}
              className="backdrop-blur-sm bg-background/80 hover:bg-background/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gigs
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant={gig.status === 'PUBLISHED' ? 'default' : 'secondary'} className="backdrop-blur-sm">
                {gig.status}
              </Badge>
              {gig.purpose && (
                <Badge variant="outline" className="backdrop-blur-sm bg-background/80">
                  {getPurposeLabel(gig.purpose)}
                </Badge>
              )}
              <Badge variant="outline" className="backdrop-blur-sm bg-background/80">
                {getCompensationType(gig.comp_type)}
              </Badge>
            </div>
          </div>

          {/* Main Title Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                {gig.title}
              </h1>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 border-2 border-background shadow-xl ring-2 ring-primary/20">
                    <AvatarImage
                      src={gig.users_profile?.avatar_url || undefined}
                      alt={`${gig.users_profile?.display_name || 'User'} avatar`}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {gig.users_profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="backdrop-blur-sm bg-background/60 px-3 py-2 rounded-lg">
                    <p className="text-xs text-muted-foreground/80">Posted by</p>
                    <p className="font-semibold text-foreground">{gig.users_profile?.display_name || 'Unknown'}</p>
                  </div>
                </div>

                {gig.users_profile?.city && (
                  <div className="flex items-center gap-2 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{gig.users_profile.city}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{new Date(gig.start_time).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{gig.max_applicants} spots</span>
                </div>

                {/* Style Tags */}
                {gig.users_profile?.style_tags && gig.users_profile.style_tags.length > 0 && (
                  <>
                    {gig.users_profile.style_tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="backdrop-blur-sm bg-background/80 px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                    {gig.users_profile.style_tags.length > 3 && (
                      <Badge variant="outline" className="backdrop-blur-sm bg-background/80 px-3 py-1">
                        +{gig.users_profile.style_tags.length - 3}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Moodboard Section - Masonry Layout */}
            {moodboardData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      <CardTitle>{moodboardData.title || 'Visual Inspiration'}</CardTitle>
                    </div>
                    {moodboardData.palette && moodboardData.palette.length > 0 && (
                      <div className="flex gap-1">
                        {moodboardData.palette.slice(0, 5).map((color: string, index: number) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {moodboardData.summary && (
                    <CardDescription>{moodboardData.summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Dynamic Layout based on number of images */}
                  {moodboardData.items.length <= 2 ? (
                    /* 1-2 images: Show in a clean grid layout */
                    <div className={`grid gap-4 ${moodboardData.items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {moodboardData.items.map((item: any, index: number) => {
                        const isFeatured = item.id === moodboardData.featured_image_id
                        return (
                          <div
                            key={index}
                            className="group cursor-pointer"
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <div className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] ${
                              isFeatured ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                            }`}>
                              <img
                                src={item.thumbnail_url || item.url}
                                alt={item.caption || `Moodboard image ${index + 1}`}
                                className="w-full h-[300px] object-cover"
                                loading="lazy"
                              />
                              {isFeatured && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-medium">Featured</span>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 text-foreground bg-background/90 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-xs font-medium line-clamp-2">{item.caption}</p>
                                {item.photographer && (
                                  <p className="text-xs opacity-80 mt-1">📷 {item.photographer}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 3+ images: Use masonry layout */
                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                      {moodboardData.items.map((item: any, index: number) => {
                        const isFeatured = item.id === moodboardData.featured_image_id
                        return (
                          <div
                            key={index}
                            className="break-inside-avoid mb-4 group cursor-pointer"
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <div className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] ${
                              isFeatured ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                            }`}>
                              <img
                                src={item.thumbnail_url || item.url}
                                alt={item.caption || `Moodboard image ${index + 1}`}
                                className="w-full h-auto object-cover"
                                loading="lazy"
                              />
                              {isFeatured && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-medium">Featured</span>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 text-foreground bg-background/90 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-xs font-medium line-clamp-2">{item.caption}</p>
                                {item.photographer && (
                                  <p className="text-xs opacity-80 mt-1">📷 {item.photographer}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About this Gig</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">{gig.description}</p>
                </div>

                <Separator />

                {/* Location Section */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Shoot Location</h3>
                  <LocationMap
                    location={gig.location_text}
                    latitude={gig.location?.lat}
                    longitude={gig.location?.lng}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Gig Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Gig Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compensation</p>
                    <Badge variant="outline" className="mt-1">
                      {getCompensationType(gig.comp_type)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purpose</p>
                    <Badge variant="outline" className="mt-1">
                      {getPurposeLabel(gig.purpose)}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Usage Rights</p>
                  <p className="text-sm text-foreground">{gig.usage_rights}</p>
                </div>
              </CardContent>
            </Card>

            {/* Applications Bar */}
            {applicationCount > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Applications ({applicationCount})
                    </CardTitle>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/gigs/${gigId}/applications`)}
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {applications.slice(0, 6).map((application, index) => (
                        <Avatar key={application.id} className="w-8 h-8 border-2 border-background">
                          <AvatarImage 
                            src={application.users_profile?.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {application.users_profile?.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {applicationCount > 6 && (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">+{applicationCount - 6}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {applicationCount === 1 ? '1 person applied' : `${applicationCount} people applied`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Shoot Dates</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">Starts:</span>
                      <span>{formatDate(gig.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">Ends:</span>
                      <span>{formatDate(gig.end_time)}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Application Deadline</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm">{formatDate(gig.application_deadline)}</span>
                    {applicationDeadlinePassed && (
                      <Badge variant="destructive" className="text-xs">Closed</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Availability</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      {acceptedCount}/{gig.max_applicants} spots filled
                    </span>
                  </div>
                  {acceptedCount > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(acceptedCount / gig.max_applicants) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compatibility Score */}
            {user && userProfile && compatibilityData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Your Match
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCompatibilityModal(true)}
                    >
                      Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CompatibilityScore 
                    score={compatibilityData.score}
                    breakdown={compatibilityData.breakdown}
                    size="lg"
                    showBreakdown={true}
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    {compatibilityData.score >= 80 ? '🎯 Excellent match!' :
                     compatibilityData.score >= 60 ? '✨ Good match' :
                     compatibilityData.score >= 40 ? '👍 Fair match' :
                     '💡 Consider improving your profile'}
                  </p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Accepted Talent Section */}
        {acceptedCount > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Accepted Talent
                    </CardTitle>
                    <CardDescription>
                      {acceptedCount} of {gig.max_applicants} spots filled
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/gigs/${gigId}/applications`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Manage Applications
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {acceptedApplicants.map((application) => (
                    <div
                      key={application.id}
                      className="flex-shrink-0 group cursor-pointer"
                      onClick={() => router.push(`/users/${application.users_profile.handle}`)}
                    >
                      <div className="relative">
                        {/* Avatar */}
                        <Avatar className="w-20 h-20 border-2 border-primary group-hover:border-primary/70 transition-colors ring-2 ring-primary/20">
                          <AvatarImage
                            src={application.users_profile.avatar_url || undefined}
                            alt={application.users_profile.display_name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                            {application.users_profile.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Checkmark Badge - Overlay on top right */}
                        <div className="absolute -top-1 -right-1">
                          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg ring-2 ring-background">
                            <CheckCircle className="w-4 h-4 text-primary-foreground fill-current" />
                          </div>
                        </div>

                        {/* Name on hover */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-border shadow-lg">
                            <p className="text-xs font-medium text-foreground">
                              {application.users_profile.display_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Showcase Section */}
        {gig.status === 'COMPLETED' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      Gig Showcase
                    </CardTitle>
                    <CardDescription>
                      Share photos from this completed gig
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showcase ? (
                  <div className="space-y-4">
                    {/* Showcase Status */}
                    <div className="flex items-center gap-2">
                      {showcase.approval_status === 'approved' && (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      )}
                      {showcase.approval_status === 'pending_approval' && (
                        <Badge variant="info">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Approval
                        </Badge>
                      )}
                      {showcase.approval_status === 'blocked_by_changes' && (
                        <Badge variant="destructive">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Blocked by Changes
                        </Badge>
                      )}
                      {showcase.approval_status === 'changes_requested' && (
                        <Badge variant="warning">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Changes Requested
                        </Badge>
                      )}
                      {showcase.approval_status === 'draft' && (
                        <Badge variant="outline">
                          <Upload className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </div>

                    {/* Multi-Talent Approval Progress */}
                    {showcase.total_talents && showcase.total_talents > 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Approval Progress:</span>
                          <span className="font-semibold">
                            {showcase.approved_talents || 0}/{showcase.total_talents} talents approved
                          </span>
                        </div>
                        {showcase.change_requests && showcase.change_requests > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-orange-700 dark:text-orange-400">Change requests:</span>
                            <span className="font-semibold text-orange-700 dark:text-orange-400">
                              {showcase.change_requests}
                            </span>
                          </div>
                        )}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${((showcase.approved_talents || 0) / showcase.total_talents) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Showcase Info */}
                    <div>
                      <h4 className="font-semibold">{showcase.title}</h4>
                      {showcase.description && (
                        <p className="text-sm text-muted-foreground mt-1">{showcase.description}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isOwner && showcase.approval_status === 'draft' && (
                        <Button
                          onClick={() => setShowCreateShowcase(true)}
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Edit Showcase
                        </Button>
                      )}
                      
                      {isOwner && showcase.approval_status === 'draft' && (
                        <Button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/showcases/${showcase.id}/submit`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${session?.access_token}`
                                }
                              });
                              if (response.ok) {
                                fetchShowcase(); // Refresh showcase data
                              }
                            } catch (error) {
                              console.error('Error submitting showcase:', error);
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Submit for Approval
                        </Button>
                      )}

                      {isOwner && showcase.approval_status === 'changes_requested' && (
                        <Button
                          onClick={() => setShowCreateShowcase(true)}
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Make Changes
                        </Button>
                      )}

                      {isOwner && showcase.approval_status === 'blocked_by_changes' && (
                        <Button
                          onClick={() => setShowCreateShowcase(true)}
                          size="sm"
                          variant="destructive"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Address Feedback & Resubmit
                        </Button>
                      )}

                      {/* Talent can review pending showcases */}
                      {!isOwner && showcase.approval_status === 'pending_approval' && 
                       acceptedApplicants.some(app => app.users_profile.id === userProfile?.id) && (
                        <Button
                          onClick={() => setShowApprovalReview(true)}
                          size="sm"
                        >
                          <CheckSquare className="w-4 h-4 mr-2" />
                          Review & Approve
                        </Button>
                      )}

                      {showcase.approval_status === 'approved' && (
                        <Button
                          onClick={() => router.push(`/showcases/${showcase.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Showcase
                        </Button>
                      )}
                    </div>

                    {/* Show feedback if changes were requested */}
                    {showcase.approval_status === 'changes_requested' && showcase.approval_notes && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                          <strong>Feedback:</strong> {showcase.approval_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Showcase Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a showcase to share photos from this completed gig
                    </p>
                    {isOwner && (
                      <Button onClick={() => setShowCreateShowcase(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Create Showcase
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Similar Talent Section - Full Width */}
        <div className="mt-8">
          <SimilarTalentSlim gigId={gigId} />
        </div>

        {/* Similar Gigs Section */}
        {similarGigs.length > 0 && (
          <div className="mt-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Similar Gigs
                </CardTitle>
                <CardDescription>Other gigs that match your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarGigs.map((gig) => (
                    <MatchmakingCard
                      key={gig.id}
                      type={gig.type}
                      data={gig.data}
                      onViewDetails={() => router.push(`/gigs/${gig.id}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              {isOwner ? (
                <>
                  <Button
                    onClick={() => router.push(`/gigs/${gigId}/edit`)}
                    className="flex-1"
                    size="lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Gig
                  </Button>
                  <Button
                    onClick={() => router.push(`/gigs/${gigId}/applications`)}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Applications
                  </Button>
                </>
              ) : (
                <>
                  {isTalent && !applicationDeadlinePassed ? (
                    <Button className="flex-1" size="lg">
                      <Users className="w-4 h-4 mr-2" />
                      Apply to this Gig
                    </Button>
                  ) : !user ? (
                    <Button
                      onClick={() => router.push('/auth/signin')}
                      className="flex-1"
                      size="lg"
                    >
                      Sign in to Apply
                    </Button>
                  ) : applicationDeadlinePassed ? (
                    <Button disabled className="flex-1" size="lg">
                      Applications Closed
                    </Button>
                  ) : (
                    <Button disabled className="flex-1" size="lg">
                      Talent Role Required
                    </Button>
                  )}
                  <Button
                    onClick={() => router.push('/gigs')}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Gigs
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compatibility Breakdown Modal */}
      {showCompatibilityModal && compatibilityData && (
        <CompatibilityBreakdownModal
          isOpen={showCompatibilityModal}
          onClose={() => setShowCompatibilityModal(false)}
          compatibilityData={compatibilityData}
          userProfile={userProfile}
          gig={{
            ...gig,
            updated_at: gig.created_at // Use created_at as updated_at since we don't have it
          }}
        />
      )}

      {/* Create Showcase Modal - Temporarily disabled */}
      {/* {showCreateShowcase && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GigShowcaseUpload
              gigId={gigId}
              gigTitle={gig.title}
              onSuccess={(showcaseId) => {
                setShowCreateShowcase(false);
                fetchShowcase(); // Refresh showcase data
              }}
              onCancel={() => setShowCreateShowcase(false)}
            />
          </div>
        </div>
      )} */}

      {/* Showcase Approval Review Modal - Temporarily disabled */}
      {/* {showApprovalReview && showcase && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ShowcaseApprovalReview
              showcaseId={showcase.id}
              onApproved={() => {
                setShowApprovalReview(false);
                fetchShowcase(); // Refresh showcase data
              }}
              onChangesRequested={() => {
                setShowApprovalReview(false);
                fetchShowcase(); // Refresh showcase data
              }}
            />
          </div>
        </div>
      )} */}
    </div>
  )
}
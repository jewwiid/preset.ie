import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ExternalLink, Instagram, Globe } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

interface UserProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  bio?: string
  avatar_url?: string
  city?: string
  country?: string
  role_flags?: string[]
  style_tags?: string[]
  verified_id: boolean
  created_at: string
  updated_at: string
  years_experience?: number
  specializations?: string[]
  equipment_list?: string[]
  editing_software?: string[]
  languages?: string[]
  portfolio_url?: string
  website_url?: string
  instagram_handle?: string
  tiktok_handle?: string
  hourly_rate_min?: number
  hourly_rate_max?: number
  available_for_travel?: boolean
  has_studio?: boolean
  studio_name?: string
}

interface Showcase {
  id: string
  caption?: string
  tags?: string[]
  visibility: string
  created_at: string
  approved_by_creator_at?: string
  approved_by_talent_at?: string
  gig?: {
    id: string
    title: string
    location_text?: string
  }
}

interface Gig {
  id: string
  title: string
  description?: string
  location_text?: string
  comp_type?: string
  status: string
  created_at: string
}

interface ProfileData {
  profile: UserProfile
  showcases: Showcase[]
  createdGigs: Gig[]
  stats: {
    showcases_count: number
    gigs_created: number
    member_since: string
  }
}

async function resolveHandle(handle: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Use the resolve_current_handle function to get the current handle
    const { data, error } = await supabase
      .rpc('resolve_current_handle', { input_handle: handle })

    if (error) {
      console.error('Error resolving handle:', error)
      return handle // Fallback to original handle
    }

    return data || handle
  } catch (error) {
    console.error('Error in resolveHandle:', error)
    return handle
  }
}

async function getUserProfile(handle: string): Promise<ProfileData | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First resolve the handle to get the current handle
    const currentHandle = await resolveHandle(handle)
    
    // If the handle changed, redirect to the new handle
    if (currentHandle !== handle) {
      redirect(`/users/${currentHandle}`)
    }

    // Fetch public profile by current handle
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select(`
        id,
        user_id,
        display_name,
        handle,
        bio,
        avatar_url,
        city,
        country,
        role_flags,
        style_tags,
        verified_id,
        created_at,
        updated_at,
        years_experience,
        specializations,
        equipment_list,
        editing_software,
        languages,
        portfolio_url,
        website_url,
        instagram_handle,
        tiktok_handle,
        hourly_rate_min,
        hourly_rate_max,
        available_for_travel,
        has_studio,
        studio_name
      `)
      .eq('handle', currentHandle)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Fetch public showcases for this user
    const { data: showcases, error: showcasesError } = await supabase
      .from('showcases')
      .select(`
        id,
        caption,
        tags,
        visibility,
        created_at,
        approved_by_creator_at,
        approved_by_talent_at,
        gig:gigs!showcases_gig_id_fkey (
          id,
          title,
          location_text
        )
      `)
      .eq('visibility', 'PUBLIC')
      .or(`creator_user_id.eq.${profile.id},talent_user_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (showcasesError) {
      console.error('Error fetching showcases:', showcasesError);
    }

    // Fetch public gigs created by this user
    const { data: createdGigs, error: gigsError } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        description,
        location_text,
        comp_type,
        status,
        created_at
      `)
      .eq('owner_user_id', profile.user_id) // Corrected from creator_user_id to owner_user_id
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })
      .limit(10);

    if (gigsError) {
      console.error('Error fetching gigs:', gigsError);
    }

    // Get user stats
    const stats = {
      showcases_count: showcases?.length || 0,
      gigs_created: createdGigs?.length || 0,
      member_since: profile.created_at
    };

    return {
      profile,
      showcases: (showcases || []).map((s: any) => ({
        ...s,
        gig: Array.isArray(s.gig) ? s.gig[0] : s.gig
      })) as Showcase[],
      createdGigs: createdGigs || [],
      stats
    };
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ handle: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { handle } = await params
  const profileData = await getUserProfile(handle)

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
            <p className="text-muted-foreground mb-6">
              The profile you're looking for doesn't exist.
            </p>
            <Link
              href="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { profile, showcases, createdGigs, stats } = profileData

  const memberSinceDate = new Date(stats.member_since).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Home */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-muted-foreground">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {profile.display_name}
                  </h1>
                  <p className="text-muted-foreground text-lg mb-2">
                    @{profile.handle}
                  </p>
                </div>
              </div>

              {profile.city && profile.country && (
                <div className="flex items-center text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4 mr-2" />
                  {profile.city}, {profile.country}
                </div>
              )}

              <div className="flex items-center text-muted-foreground mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                Member since {memberSinceDate}
              </div>

              {profile.bio && (
                <p className="text-foreground mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Role Badges */}
              {profile.role_flags && profile.role_flags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {profile.role_flags.map((role: string, index: number) => (
                    <span
                      key={index}
                      className={`px-3 py-1 text-sm rounded-full ${
                        role === 'TALENT'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : role === 'CONTRIBUTOR'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : role === 'BOTH'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {role === 'BOTH' ? 'Both' : role}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-3">
                {profile.website_url && (
                  <Link href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </Link>
                )}
                {profile.instagram_handle && (
                  <Link href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram className="h-4 w-4 mr-1" />
                    Instagram
                  </Link>
                )}
                {profile.portfolio_url && (
                  <Link href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Portfolio
                  </Link>
                )}
                {/* TODO: Add TikTok and other social links */}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.showcases_count}</div>
            <div className="text-muted-foreground">Showcases</div>
          </div>
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.gigs_created}</div>
            <div className="text-muted-foreground">Gigs Created</div>
          </div>
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="text-2xl font-bold text-foreground">{profile.years_experience || 0}</div>
            <div className="text-muted-foreground">Years Experience</div>
          </div>
        </div>

        {/* Style Tags */}
        {profile.style_tags && profile.style_tags.length > 0 && (
          <div className="bg-card rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Style &amp; Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.style_tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-muted text-foreground rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div className="bg-card rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specializations.map((spec: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* TODO: Add sections for Showcases and Created Gigs */}
      </div>
    </div>
  );
}
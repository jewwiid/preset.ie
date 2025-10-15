import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ExternalLink, Instagram, Globe, Lock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { VerificationBadges } from '../../../components/VerificationBadges'
import { parseVerificationBadges } from '../../../lib/utils/verification-badges'
import { UserProfileActionButtons } from '../../../components/profile/UserProfileActionButtons'

interface VerificationBadge {
  badge_type: 'verified_age' | 'verified_email' | 'verified_identity' | 'verified_professional' | 'verified_business'
  issued_at: string
  expires_at: string | null
  revoked_at: string | null
}

interface UserProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  bio?: string
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string
  city?: string
  country?: string
  account_type?: string[]
  style_tags?: string[]
  verified_id: boolean
  created_at: string
  updated_at: string
  years_experience?: number
  primary_skill?: string
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
  availability_status?: string
  account_status?: string
  verification_badges?: VerificationBadge[]
  talent_categoriess?: string[]
  height_cm?: number
  eye_color?: string
  hair_color?: string
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
  isPrivate: boolean
}

async function checkAndRedirectIfRole(handle: string): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if this handle matches any role names
    const [contributorResult, talentResult] = await Promise.all([
      supabase
        .from('predefined_roles')
        .select('name')
        .eq('is_active', true),
      supabase
        .from('predefined_talent_categories')
        .select('category_name')
        .eq('is_active', true)
    ]);

    const allRoleNames = [
      ...(contributorResult.data || []).map(r => r.name),
      ...(talentResult.data || []).map(c => c.category_name)
    ];

    // Check if the handle matches any role (case-insensitive, with pluralization)
    const normalizedHandle = handle.toLowerCase().replace(/-/g, ' ');
    const isRole = allRoleNames.some(roleName => {
      const roleSlug = roleName.toLowerCase().replace(/\s+/g, '-');
      const pluralSlug = roleSlug.endsWith('s') ? roleSlug : roleSlug + 's';
      return roleSlug === normalizedHandle || pluralSlug === normalizedHandle || 
             roleName.toLowerCase() === normalizedHandle;
    });

    if (isRole) {
      // Redirect to the role page
      redirect(`/${handle}`);
    }
  } catch (error) {
    console.error('Error checking if handle is role:', error);
    // Don't redirect on error, let it proceed as a user handle
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

    // Check if this is a role name instead of a user handle
    await checkAndRedirectIfRole(handle)

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
        header_banner_url,
        header_banner_position,
        city,
        country,
        account_type,
        style_tags,
        verified_id,
        created_at,
        updated_at,
        years_experience,
        primary_skill,
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
        studio_name,
        availability_status,
        account_status,
        talent_categoriess,
        height_cm,
        eye_color,
        hair_color
      `)
      .eq('handle', currentHandle)
      .single();

    // Fetch verification badges separately (since it's a separate table)
    let verificationBadgesData: VerificationBadge[] = [];
    if (!profileError && profile) {
      const { data: badges } = await supabase
        .from('verification_badges')
        .select('badge_type, issued_at, expires_at, revoked_at')
        .eq('user_id', profile.user_id)
        .is('revoked_at', null); // Only get active badges
      
      verificationBadgesData = badges || [];
    }

    if (profileError) {
      console.error('Error fetching profile:', JSON.stringify(profileError, null, 2));
      return null;
    }

    if (!profile) {
      console.error('No profile found for handle:', currentHandle);
      return null;
    }

    // Block access to suspended/deactivated/banned accounts
    const blockedStatuses = ['suspended', 'deactivated', 'banned'];
    if (profile.account_status && blockedStatuses.includes(profile.account_status.toLowerCase())) {
      console.log(`Access blocked: account status is ${profile.account_status}`);
      return null;
    }

    // Fetch user settings to check profile visibility
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('profile_visibility')
      .eq('user_id', profile.user_id)
      .single();

    // Check if profile is private
    const isPrivate = userSettings?.profile_visibility?.toLowerCase() === 'private';

    // If private, return minimal data (just banner/avatar/name)
    if (isPrivate) {
      return {
        profile,
        showcases: [],
        createdGigs: [],
        stats: {
          showcases_count: 0,
          gigs_created: 0,
          member_since: profile.created_at
        },
        isPrivate: true
      };
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
    // NOTE: owner_user_id references users_profile.id (NOT user_id)
    const { data: createdGigs, error: gigsError } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        description,
        location_text,
        comp_type,
        status,
        created_at,
        application_deadline,
        start_time
      `)
      .eq('owner_user_id', profile.id)
      .in('status', ['PUBLISHED', 'APPLICATIONS_CLOSED', 'BOOKED'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (gigsError) {
      console.error('Error fetching gigs:', gigsError);
    }

    // Fetch featured images for gigs
    const gigsWithImages = await Promise.all(
      (createdGigs || []).map(async (gig: any) => {
        const { data: media } = await supabase
          .from('media')
          .select('url, type')
          .eq('gig_id', gig.id)
          .limit(1)
          .single();

        return {
          ...gig,
          featured_image: media?.url || null
        };
      })
    );

    // Get user stats
    const stats = {
      showcases_count: showcases?.length || 0,
      gigs_created: createdGigs?.length || 0,
      member_since: profile.created_at
    };

    // Attach verification badges to profile
    const profileWithBadges = {
      ...profile,
      verification_badges: verificationBadgesData
    };

    return {
      profile: profileWithBadges,
      showcases: (showcases || []).map((s: any) => ({
        ...s,
        gig: Array.isArray(s.gig) ? s.gig[0] : s.gig
      })) as Showcase[],
      createdGigs: gigsWithImages || [],
      stats,
      isPrivate: false
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

  const { profile, showcases, createdGigs, stats, isPrivate } = profileData

  const memberSinceDate = new Date(stats.member_since).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'});

  // Parse verification badges
  const verificationBadges = parseVerificationBadges(profile.verification_badges || [])

  // Parse banner position if available
  let bannerStyle: React.CSSProperties = {};
  if (profile.header_banner_position) {
    try {
      const position = JSON.parse(profile.header_banner_position);
      bannerStyle = {
        objectPosition: `${position.x || 50}% ${position.y || 50}%`,
        transform: `scale(${position.scale || 1})`
      };
    } catch (e) {
      console.error('Error parsing banner position:', e);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-80 overflow-hidden">
        {/* Banner Background */}
        {profile.header_banner_url ? (
          <>
            {/* User's custom banner */}
            <div className="absolute inset-0">
              <Image
                src={profile.header_banner_url}
                alt={`${profile.display_name}'s banner`}
                fill
                className="object-cover"
                style={bannerStyle}
                priority
              />
            </div>
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        ) : (
          <>
            {/* Gradient fallback */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          </>
        )}

        {/* Profile Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between py-6">
          {/* Top Bar - Back Button and Action Buttons */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Button variant="ghost" size="sm" asChild className="text-white hover:text-white hover:bg-white/10">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            
            {/* Action Buttons - Top Right */}
            <UserProfileActionButtons 
              profileId={profile.id}
              profileUserId={profile.user_id}
              profileHandle={profile.handle}
              profileDisplayName={profile.display_name}
              profileRoleFlags={profile.account_type}
            />
          </div>

          {/* Profile Info - At bottom */}
          <div className="flex items-center gap-6 w-full">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-background text-foreground">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name and Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-4xl font-bold text-white">
                  {profile.display_name}
                </h1>
                <VerificationBadges
                  verifiedIdentity={verificationBadges.identity}
                  verifiedProfessional={verificationBadges.professional}
                  verifiedBusiness={verificationBadges.business}
                  size="lg"
                />
              </div>
              <p className="text-base text-white/90 mb-3">
                @{profile.handle}
              </p>

              {/* Info Pills Row 1 - Location, Member, Specialization */}
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {!isPrivate && profile.city && profile.country && (
                  <div className="flex items-center gap-1.5 text-sm text-white bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.city}, {profile.country}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-sm text-white bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {memberSinceDate}</span>
                </div>

                {/* Primary Skill Badge */}
                {!isPrivate && profile.primary_skill && (
                  <span className="px-3 py-1 text-sm font-medium rounded-lg bg-primary text-primary-foreground">
                    {profile.primary_skill}
                  </span>
                )}

                {/* Additional Specializations */}
                {!isPrivate && profile.specializations && profile.specializations.length > 0 && (
                  <>
                    {profile.specializations.slice(0, 2).map((spec: string, index: number) => (
                      <span
                        key={`spec-${index}`}
                        className="px-3 py-1 text-sm font-medium rounded-lg bg-primary/10 text-primary border border-primary/20"
                      >
                        {spec}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Badges Row 2 - Style Tags */}
              <div className="flex flex-wrap gap-2 items-center">
                {!isPrivate && profile.style_tags && profile.style_tags.length > 0 && (
                  <>
                    {profile.style_tags.slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={`style-${index}`}
                        className="px-3 py-1 text-sm font-medium rounded-lg bg-muted text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isPrivate ? (
          // Private Profile Message
          <div className="bg-card rounded-lg border p-12 text-center">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-3">This profile is private</h2>
            <p className="text-muted-foreground">
              {profile.display_name} has set their profile to private.
            </p>
          </div>
        ) : (
          <>
            {/* Bio Section */}
            {profile.bio && (
              <div className="bg-card rounded-lg border p-6 mb-8">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="text-foreground leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Professional Details */}
            <div className="bg-card rounded-lg border p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Professional Information</h2>

              {/* Availability Status */}
              {profile.availability_status && (
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg font-medium ${
                      profile.availability_status === 'available'
                        ? 'bg-primary/20 text-primary'
                        : profile.availability_status === 'limited'
                        ? 'bg-secondary/20 text-secondary-foreground'
                        : profile.availability_status === 'busy'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      profile.availability_status === 'available'
                        ? 'bg-primary'
                        : profile.availability_status === 'limited'
                        ? 'bg-secondary'
                        : profile.availability_status === 'busy'
                        ? 'bg-destructive'
                        : 'bg-muted-foreground'
                    }`}></span>
                    {profile.availability_status === 'available' && 'Available'}
                    {profile.availability_status === 'limited' && 'Limited Availability'}
                    {profile.availability_status === 'busy' && 'Busy'}
                    {profile.availability_status === 'unavailable' && 'Unavailable'}
                  </span>
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-3 mb-6">
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

              {/* Additional Professional Details */}
              <div className="space-y-6">
                {/* Talent Categorys */}
                {profile.account_type?.includes('TALENT') && (profile as any).talent_categoriess && (profile as any).talent_categoriess.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Talent Categorys</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile as any).talent_categoriess.map((role: string, index: number) => (
                        <span
                          key={`role-${index}`}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary border border-primary/20"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Physical Attributes - For Talent */}
                {profile.account_type?.includes('TALENT') && ((profile as any).height_cm || (profile as any).eye_color || (profile as any).hair_color) && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Physical Attributes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(profile as any).height_cm && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Height:</span>{' '}
                          <span className="text-foreground font-medium">{(profile as any).height_cm}cm</span>
                        </div>
                      )}
                      {(profile as any).eye_color && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Eyes:</span>{' '}
                          <span className="text-foreground font-medium">{(profile as any).eye_color}</span>
                        </div>
                      )}
                      {(profile as any).hair_color && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Hair:</span>{' '}
                          <span className="text-foreground font-medium">{(profile as any).hair_color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {profile.languages && profile.languages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((language: string, index: number) => (
                        <span
                          key={`lang-${index}`}
                          className="px-3 py-1.5 text-sm rounded-lg bg-muted text-foreground"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel & Location Preferences */}
                {(typeof (profile as any).available_for_travel !== 'undefined' || (profile as any).has_studio) && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Work Preferences</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {typeof (profile as any).available_for_travel !== 'undefined' && (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${(profile as any).available_for_travel ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
                          <span className="text-foreground">
                            {(profile as any).available_for_travel ? 'Available for travel' : 'Local work only'}
                          </span>
                        </div>
                      )}
                      {(profile as any).has_studio && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span className="text-foreground">
                            {(profile as any).studio_name ? `Has studio: ${(profile as any).studio_name}` : 'Has studio'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Equipment - For Contributors */}
                {profile.account_type?.includes('CONTRIBUTOR') && profile.equipment_list && profile.equipment_list.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Equipment</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.equipment_list.map((equipment: string, index: number) => (
                        <span
                          key={`equip-${index}`}
                          className="px-3 py-1.5 text-sm rounded-lg bg-muted text-foreground"
                        >
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editing Software - For Contributors */}
                {profile.account_type?.includes('CONTRIBUTOR') && profile.editing_software && profile.editing_software.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Editing Software</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.editing_software.map((software: string, index: number) => (
                        <span
                          key={`software-${index}`}
                          className="px-3 py-1.5 text-sm rounded-lg bg-muted text-foreground"
                        >
                          {software}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rates */}
                {((profile as any).hourly_rate_min || (profile as any).hourly_rate_max) && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Rates</h3>
                    <div className="text-sm">
                      <span className="text-foreground font-medium">
                        {(profile as any).hourly_rate_min && (profile as any).hourly_rate_max
                          ? `€${(profile as any).hourly_rate_min} - €${(profile as any).hourly_rate_max}/hr`
                          : (profile as any).hourly_rate_min
                          ? `From €${(profile as any).hourly_rate_min}/hr`
                          : `Up to €${(profile as any).hourly_rate_max}/hr`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Active Gigs Carousel */}
            {createdGigs && createdGigs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Active Gigs ({createdGigs.length})</h2>

                {/* Horizontal scroll carousel */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4">
                  <div className="flex gap-4" style={{ width: 'max-content' }}>
                    {createdGigs.map((gig: any) => {
                      // Calculate days left until application deadline
                      const daysLeft = gig.application_deadline
                        ? Math.ceil((new Date(gig.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                      return (
                        <div
                          key={gig.id}
                          className="w-[340px] flex-shrink-0 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-all hover:shadow-md overflow-hidden"
                        >
                          {/* Featured Image */}
                          {gig.featured_image && (
                            <div className="relative h-40 w-full overflow-hidden">
                              <Image
                                src={gig.featured_image}
                                alt={gig.title}
                                fill
                                className="object-cover"
                              />
                              {/* Status Badge Overlay on Image */}
                              <div className="absolute top-3 left-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                                  gig.status === 'PUBLISHED'
                                    ? 'bg-primary/90 text-primary-foreground'
                                    : gig.status === 'APPLICATIONS_CLOSED'
                                    ? 'bg-destructive/90 text-destructive-foreground'
                                    : gig.status === 'BOOKED'
                                    ? 'bg-secondary/90 text-secondary-foreground'
                                    : 'bg-muted/90 text-muted-foreground'
                                }`}>
                                  {gig.status === 'PUBLISHED' && '✓ Open'}
                                  {gig.status === 'APPLICATIONS_CLOSED' && 'Closed'}
                                  {gig.status === 'BOOKED' && 'Booked'}
                                </span>
                              </div>
                              {/* Days Left Badge */}
                              {daysLeft !== null && daysLeft > 0 && gig.status === 'PUBLISHED' && (
                                <div className="absolute top-3 right-3">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background/80 text-foreground backdrop-blur-sm">
                                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="p-5">
                            {/* Status Badge (only show if no image) */}
                            {!gig.featured_image && (
                              <div className="mb-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  gig.status === 'PUBLISHED'
                                    ? 'bg-primary/10 text-primary'
                                    : gig.status === 'APPLICATIONS_CLOSED'
                                    ? 'bg-destructive/10 text-destructive'
                                    : gig.status === 'BOOKED'
                                    ? 'bg-secondary/10 text-secondary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {gig.status === 'PUBLISHED' && '✓ Accepting Applications'}
                                  {gig.status === 'APPLICATIONS_CLOSED' && 'Applications Closed'}
                                  {gig.status === 'BOOKED' && 'Booked'}
                                </span>
                              </div>
                            )}

                            {/* Title */}
                            <h3 className="font-semibold text-base text-foreground mb-2 line-clamp-2">
                              {gig.title}
                            </h3>

                            {/* Description */}
                            {gig.description && (
                              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                {gig.description}
                              </p>
                            )}

                            {/* Gig Details */}
                            <div className="space-y-1.5 mb-4">
                              {gig.location_text && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{gig.location_text}</span>
                                </div>
                              )}
                              {gig.comp_type && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>💰</span>
                                  <span className="capitalize">{gig.comp_type.toLowerCase()}</span>
                                </div>
                              )}
                              {/* Days left (only show if no image) */}
                              {!gig.featured_image && daysLeft !== null && daysLeft > 0 && gig.status === 'PUBLISHED' && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to apply</span>
                                </div>
                              )}
                            </div>

                            {/* CTA Button */}
                            {gig.status === 'PUBLISHED' ? (
                              <Link
                                href={`/gigs/${gig.id}`}
                                className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                              >
                                Apply Now
                              </Link>
                            ) : (
                              <Link
                                href={`/gigs/${gig.id}`}
                                className="block w-full text-center px-4 py-2 border border-border text-foreground rounded-lg font-medium text-sm hover:bg-muted/50 transition-colors"
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scroll hint */}
                {createdGigs.length > 1 && (
                  <div className="text-center text-xs text-muted-foreground mt-2">
                    Scroll to see all gigs →
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

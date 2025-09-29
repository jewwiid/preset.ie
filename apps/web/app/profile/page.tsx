'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  MapPin, 
  Calendar, 
  Camera, 
  Award, 
  Globe, 
  Instagram, 
  ExternalLink,
  Star,
  CheckCircle,
  Settings,
  Edit,
  Phone,
  Mail,
  Shield
} from 'lucide-react'

interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  country?: string;
  role_flags: string[];
  style_tags: string[];
  verified_id: boolean;
  created_at: string;
  updated_at: string;
  
  // Additional public fields
  years_experience?: number;
  specializations?: string[];
  equipment_list?: string[];
  editing_software?: string[];
  languages?: string[];
  portfolio_url?: string;
  website_url?: string;
  
  // Contact information
  phone_number?: string;
  email?: string;
  phone_public?: boolean;
  email_public?: boolean;
  instagram_handle?: string;
  tiktok_handle?: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  available_for_travel?: boolean;
  has_studio?: boolean;
  studio_name?: string;
}

// Main Profile Page - Shows user's own public profile with edit option
export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data: profileData, error: profileError } = await supabase
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
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found, redirect to profile creation
          router.push('/auth/create-profile');
          return;
        }
        throw profileError;
      }

      setProfile(profileData);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatRate = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${min} - $${max}/hour`;
    if (min) return `$${min}+/hour`;
    if (max) return `Up to $${max}/hour`;
    return null;
  };

  const handleEditProfile = () => {
    router.push('/profile/settings');
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "Your profile couldn't be loaded."}
            </p>
            <Button onClick={() => router.push('/auth/create-profile')}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-primary h-32 relative">
            {/* Action buttons positioned at top right of banner */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/${profile.handle}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Profile
                </a>
              </Button>
              <Button size="sm" onClick={handleEditProfile}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-16 mb-4">
              <Avatar className="w-24 h-24 border-4 border-border shadow-lg">
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                  {profile.verified_id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-lg text-muted-foreground">@{profile.handle}</p>
                {profile.city && (
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.city}{profile.country && `, ${profile.country}`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-foreground mb-4">{profile.bio}</p>
            )}

            {/* Role badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.role_flags.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role.toLowerCase().replace('_', ' ')}
                </Badge>
              ))}
            </div>

            {/* Style tags */}
            {profile.style_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.style_tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience & Specializations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.years_experience && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <strong>{profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'}</strong> of experience
                    </span>
                  </div>
                )}

                {formatRate(profile.hourly_rate_min, profile.hourly_rate_max) && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <strong>{formatRate(profile.hourly_rate_min, profile.hourly_rate_max)}</strong>
                    </span>
                  </div>
                )}

                {/* Specializations */}
                {profile.specializations && profile.specializations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {profile.languages && profile.languages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="space-y-2">
                  {profile.available_for_travel && (
                    <div className="flex items-center text-primary">
                      <Globe className="h-4 w-4 mr-2" />
                      <span className="text-sm">Available for travel</span>
                    </div>
                  )}
                  {profile.has_studio && (
                    <div className="flex items-center text-primary">
                      <Camera className="h-4 w-4 mr-2" />
                      <span className="text-sm">Has studio {profile.studio_name && `(${profile.studio_name})`}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment */}
            {profile.equipment_list && profile.equipment_list.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {profile.equipment_list.map((item) => (
                      <div key={item} className="flex items-center p-3 bg-background rounded-lg">
                        <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Software */}
            {profile.editing_software && profile.editing_software.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Software
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.editing_software.map((software) => (
                      <Badge key={software} variant="secondary">
                        {software}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Links */}
            {(profile.portfolio_url || profile.website_url || profile.instagram_handle || profile.tiktok_handle) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/90 text-sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Portfolio
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/90 text-sm"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  )}
                  {profile.instagram_handle && (
                    <a
                      href={`https://instagram.com/${profile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/90 text-sm"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      @{profile.instagram_handle}
                    </a>
                  )}
                  {profile.tiktok_handle && (
                    <a
                      href={`https://tiktok.com/@${profile.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-foreground hover:text-foreground text-sm"
                    >
                      <span className="mr-2">📱</span>
                      @{profile.tiktok_handle}
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone Number */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Phone Number</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {profile.phone_public ? 'Public' : 'Private'}
                      </span>
                      <Badge variant={profile.phone_public ? 'default' : 'secondary'} className="text-xs">
                        {profile.phone_public ? 'Shareable' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                  {profile.phone_number ? (
                    <div className="text-sm text-muted-foreground">
                      {profile.phone_public ? profile.phone_number : '••••••••••'}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No phone number provided
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Email Address</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {profile.email_public ? 'Public' : 'Private'}
                      </span>
                      <Badge variant={profile.email_public ? 'default' : 'secondary'} className="text-xs">
                        {profile.email_public ? 'Shareable' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                  {profile.email ? (
                    <div className="text-sm text-muted-foreground">
                      {profile.email_public ? profile.email : '••••••••••'}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No email address provided
                    </div>
                  )}
                </div>

                {/* Privacy Note */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Privacy Settings</p>
                      <p>
                        When you select "phone" or "email" as your preferred contact method in offers, 
                        your contact details will only be shared if they are marked as "Shareable" above.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member since */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  Member since {formatDate(profile.created_at)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

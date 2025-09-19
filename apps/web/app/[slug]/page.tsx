'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Eye,
  Heart,
  Share2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

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
  instagram_handle?: string;
  tiktok_handle?: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  available_for_travel?: boolean;
  has_studio?: boolean;
  studio_name?: string;
}

interface ShowcaseData {
  id: string;
  caption?: string;
  tags: string[];
  visibility: string;
  created_at: string;
  approved_by_creator_at?: string;
  approved_by_talent_at?: string;
  gig?: {
    id: string;
    title: string;
    location_text: string;
  }[];
}

// List of existing routes that should take precedence over user handles
const EXISTING_ROUTES = [
  'admin',
  'auth',
  'applications',
  'collaborate',
  'components',
  'credits',
  'dashboard',
  'debug-auth',
  'gigs',
  'hooks',
  'marketplace',
  'matchmaking',
  'messages',
  'playground',
  'playground-simple',
  'playground-test',
  'presets',
  'profile',
  'settings',
  'showcases',
  'styles',
  'subscription',
  'test-admin',
  'test-edit',
  'test-edit-sequential',
  'test-matchmaking',
  'test-playground',
  'test-sequential',
  'test-simple',
  'treatments',
  'user',
  'verify',
  'api',
  'favicon.ico',
  'fonts',
  'globals.css',
  'layout.tsx',
  'not-found.tsx',
  'page.tsx',
  'page.module.css'
];

export default function CatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUserProfile, setIsUserProfile] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [showcases, setShowcases] = useState<ShowcaseData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'showcases' | 'equipment'>('about');

  useEffect(() => {
    if (slug) {
      checkSlugAndLoad();
    }
  }, [slug]);

  const checkSlugAndLoad = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if this is an existing route
      if (EXISTING_ROUTES.includes(slug.toLowerCase())) {
        // Don't handle existing routes - let Next.js handle them naturally
        // Just set loading to false and let the parent layout handle the 404 if needed
        setIsLoading(false);
        setError(null);
        return;
      }

      // Check if supabase is available
      if (!supabase) {
        setError('Database connection not available');
        setIsLoading(false);
        return;
      }

      // Check if this slug corresponds to a user profile
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
        .eq('handle', slug)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No user found with this handle, show 404
          setError('Page not found');
          setIsUserProfile(false);
        } else {
          throw profileError;
        }
        return;
      }

      // User profile found
      setIsUserProfile(true);
      setProfile(profileData);

      // Fetch public showcases for this user
      const { data: showcasesData, error: showcasesError } = await supabase
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
        .or(`creator_user_id.eq.${profileData.id},talent_user_id.eq.${profileData.id}`)
        .order('created_at', { ascending: false })
        .limit(12);

      if (showcasesError) {
        console.error('Error fetching showcases:', showcasesError);
      } else {
        setShowcases(showcasesData || []);
      }

    } catch (err: any) {
      console.error('Error checking slug:', err);
      setError(err.message || 'Failed to load page');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not a user profile, show 404
  if (!isUserProfile || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The page you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Render user profile
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-16 mb-4">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile!.avatar_url} alt={profile!.display_name} />
                <AvatarFallback className="text-2xl">
                  {profile!.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile!.display_name}</h1>
                  {profile!.verified_id && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <p className="text-lg text-gray-600">@{profile!.handle}</p>
                {profile!.city && (
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile!.city}{profile!.country && `, ${profile!.country}`}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Bio */}
            {profile!.bio && (
              <p className="text-gray-700 mb-4">{profile!.bio}</p>
            )}

            {/* Role badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {profile!.role_flags.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role.toLowerCase().replace('_', ' ')}
                </Badge>
              ))}
            </div>

            {/* Style tags */}
            {profile!.style_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile!.style_tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'about', label: 'About', icon: User },
                { id: 'showcases', label: 'Showcases', icon: Camera },
                { id: 'equipment', label: 'Equipment', icon: Award }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Experience & Specializations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile!.years_experience && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Calendar className="h-5 w-5 mr-2" />
                          Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-blue-600">
                          {profile!.years_experience} {profile!.years_experience === 1 ? 'year' : 'years'}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {formatRate(profile!.hourly_rate_min, profile!.hourly_rate_max) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Star className="h-5 w-5 mr-2" />
                          Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-semibold text-green-600">
                          {formatRate(profile!.hourly_rate_min, profile!.hourly_rate_max)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Specializations */}
                {profile!.specializations && profile!.specializations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile!.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {profile!.languages && profile!.languages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile!.languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile!.available_for_travel && (
                    <div className="flex items-center text-blue-600">
                      <Globe className="h-4 w-4 mr-2" />
                      <span>Available for travel</span>
                    </div>
                  )}
                  {profile!.has_studio && (
                    <div className="flex items-center text-purple-600">
                      <Camera className="h-4 w-4 mr-2" />
                      <span>Has studio {profile!.studio_name && `(${profile!.studio_name})`}</span>
                    </div>
                  )}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4">
                  {profile!.portfolio_url && (
                    <a
                      href={profile!.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Portfolio
                    </a>
                  )}
                  {profile!.website_url && (
                    <a
                      href={profile!.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  )}
                  {profile!.instagram_handle && (
                    <a
                      href={`https://instagram.com/${profile!.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-pink-600 hover:text-pink-800"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      @{profile!.instagram_handle}
                    </a>
                  )}
                  {profile!.tiktok_handle && (
                    <a
                      href={`https://tiktok.com/@${profile!.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-800 hover:text-gray-900"
                    >
                      <span className="mr-2">📱</span>
                      @{profile!.tiktok_handle}
                    </a>
                  )}
                </div>

                {/* Member since */}
                <div className="text-sm text-gray-500">
                  Member since {formatDate(profile!.created_at)}
                </div>
              </div>
            )}

            {/* Showcases Tab */}
            {activeTab === 'showcases' && (
              <div>
                {showcases.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No showcases yet</h3>
                    <p className="text-gray-500">This user hasn't published any showcases yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {showcases.map((showcase) => (
                      <Card key={showcase.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {showcase.gig?.[0]?.title || 'Showcase'}
                          </CardTitle>
                          {showcase.gig?.[0]?.location_text && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              {showcase.gig[0].location_text}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          {showcase.caption && (
                            <p className="text-gray-600 mb-3">{showcase.caption}</p>
                          )}
                          {showcase.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {showcase.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-3">
                            {formatDate(showcase.created_at)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && (
              <div className="space-y-6">
                {profile!.equipment_list && profile!.equipment_list.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {profile!.equipment_list.map((item) => (
                        <div key={item} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Award className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No equipment information available.</p>
                  </div>
                )}

                {profile!.editing_software && profile!.editing_software.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Software</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile!.editing_software.map((software) => (
                        <Badge key={software} variant="secondary">
                          {software}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

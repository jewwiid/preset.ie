'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { MapPin, Calendar, Users, Heart, Clock, DollarSign, Camera, Video, Sparkles, Tag, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CompensationType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER';
type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER';

interface SavedGig {
  id: string;
  saved_at: string;
  gig: {
    id: string;
    title: string;
    description: string;
    purpose?: PurposeType;
    comp_type: CompensationType;
    location_text: string;
    start_time: string;
    end_time: string;
    application_deadline: string;
    max_applicants: number;
    current_applicants?: number;
    moodboard_urls?: string[];
    status: string;
    created_at: string;
    owner_user_id: string;
    users_profile?: {
      display_name: string;
      avatar_url?: string;
      handle: string;
      verified_id?: boolean;
    };
    palette_colors?: string[];
    style_tags?: string[];
    vibe_tags?: string[];
  };
}

export default function SavedGigsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [savedGigs, setSavedGigs] = useState<SavedGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingGigs, setRemovingGigs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    fetchSavedGigs();
  }, [user, authLoading]);

  const fetchSavedGigs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('saved_gigs')
        .select(`
          id,
          saved_at,
          gig:gigs (
            id,
            title,
            description,
            purpose,
            comp_type,
            location_text,
            start_time,
            end_time,
            application_deadline,
            max_applicants,
            status,
            created_at,
            owner_user_id,
            users_profile!owner_user_id (
              display_name,
              avatar_url,
              handle,
              verified_id
            ),
            moodboards (
              id,
              title,
              items,
              palette
            )
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved gigs:', error.message || error);
        // If table doesn't exist, show empty state
        if (error.code === '42P01') {
          setSavedGigs([]);
        }
      } else {
        // Filter out saved gigs where the gig no longer exists or is not published
        const validSavedGigs = (data || []).filter(
          savedGig => 
            savedGig.gig && 
            (savedGig.gig as any)?.status === 'PUBLISHED' &&
            new Date((savedGig.gig as any).application_deadline) > new Date()
        );
        setSavedGigs(validSavedGigs as any);
      }
    } catch (error) {
      console.error('Error fetching saved gigs:', error);
      setSavedGigs([]);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedGig = async (savedGigId: string, gigId: string) => {
    if (!user) return;

    try {
      setRemovingGigs(prev => new Set([...prev, gigId]));

      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { error } = await supabase
        .from('saved_gigs')
        .delete()
        .eq('id', savedGigId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setSavedGigs(prev => prev.filter(saved => saved.id !== savedGigId));
    } catch (error) {
      console.error('Error removing saved gig:', error);
    } finally {
      setRemovingGigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(gigId);
        return newSet;
      });
    }
  };

  const getCompTypeIcon = (type: CompensationType) => {
    switch (type) {
      case 'PAID':
        return <DollarSign className="w-4 h-4" />;
      case 'TFP':
        return <Camera className="w-4 h-4" />;
      case 'EXPENSES':
        return <Video className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getCompTypeColor = (type: CompensationType) => {
    switch (type) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'TFP':
        return 'bg-blue-100 text-blue-800';
      case 'EXPENSES':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSavedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-7 h-7 text-red-500" />
                My Saved Gigs
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Gigs you've saved for later • {savedGigs.length} saved
              </p>
            </div>
            <Link
              href="/gigs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Browse More Gigs
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedGigs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved gigs yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start browsing gigs and click the heart icon on any gig you'd like to save for later.
            </p>
            <Link
              href="/gigs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Browse Gigs
            </Link>
          </div>
        ) : (
          /* Saved Gigs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedGigs.map((savedGig) => (
              <div key={savedGig.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative">
                {/* Gig Image/Moodboard Preview */}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {savedGig.gig.moodboard_urls && savedGig.gig.moodboard_urls.length > 0 ? (
                    <img
                      src={savedGig.gig.moodboard_urls[0]}
                      alt={savedGig.gig.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                      <Camera className="w-12 h-12 text-indigo-400" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeSavedGig(savedGig.id, savedGig.gig.id)}
                    disabled={removingGigs.has(savedGig.gig.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:bg-red-50 group disabled:opacity-50"
                    title="Remove from saved"
                  >
                    {removingGigs.has(savedGig.gig.id) ? (
                      <div className="w-5 h-5 animate-spin border-2 border-red-500 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                    )}
                  </button>

                  {/* Compensation Badge */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCompTypeColor(savedGig.gig.comp_type)}`}>
                    {getCompTypeIcon(savedGig.gig.comp_type)}
                    {savedGig.gig.comp_type}
                  </div>

                  {/* Saved Date Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Saved {formatSavedDate(savedGig.saved_at)}
                  </div>
                </div>

                {/* Gig Details */}
                <div className="p-4">
                  {/* Title and Owner */}
                  <Link href={`/gigs/${savedGig.gig.id}`}>
                    <h3 className="font-semibold text-lg hover:text-indigo-600 transition-colors line-clamp-2">
                      {savedGig.gig.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={savedGig.gig.users_profile?.avatar_url || '/default-avatar.png'}
                      alt={savedGig.gig.users_profile?.display_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {savedGig.gig.users_profile?.display_name || 'Anonymous'}
                        </h4>
                        {savedGig.gig.users_profile?.verified_id && (
                          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </div>
                        )}
                      </div>
                      {savedGig.gig.users_profile?.handle && (
                        <p className="text-xs text-gray-500">@{savedGig.gig.users_profile.handle}</p>
                      )}
                    </div>
                  </div>

                  {/* Location and Date */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {savedGig.gig.location_text}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(savedGig.gig.start_time)}
                    </div>
                  </div>

                  {/* Purpose Tag */}
                  {savedGig.gig.purpose && (
                    <div className="mt-3">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {savedGig.gig.purpose.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Footer Stats */}
                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {savedGig.gig.current_applicants || 0}/{savedGig.gig.max_applicants}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getDaysUntilDeadline(savedGig.gig.application_deadline)}d left
                      </div>
                    </div>
                    <Link
                      href={`/gigs/${savedGig.gig.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
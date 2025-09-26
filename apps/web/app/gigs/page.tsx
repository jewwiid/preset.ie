'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { MapPin, Calendar, Users, Search, Filter, Heart, Clock, DollarSign, Camera, Video, Sparkles, ChevronLeft, ChevronRight, X, Tag, Eye, Shield, TrendingUp, Radius, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

type CompensationType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER';
type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER';
type UsageRightsType = 'PORTFOLIO_ONLY' | 'SOCIAL_MEDIA_PERSONAL' | 'SOCIAL_MEDIA_COMMERCIAL' | 'WEBSITE_PERSONAL' | 'WEBSITE_COMMERCIAL' | 'EDITORIAL_PRINT' | 'COMMERCIAL_PRINT' | 'ADVERTISING' | 'FULL_COMMERCIAL' | 'EXCLUSIVE_BUYOUT' | 'CUSTOM';

interface Gig {
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
  usage_rights?: string; // TEXT field, not enum
  status: string;
  created_at: string;
  owner_user_id: string;
  users_profile?: {
    display_name: string;
    avatar_url?: string;
    handle: string;
    verified_id?: boolean;
    years_experience?: number;
    specializations?: string[];
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    available_for_travel?: boolean;
    travel_radius_km?: number;
    has_studio?: boolean;
    studio_name?: string;
    instagram_handle?: string;
    tiktok_handle?: string;
    website_url?: string;
    portfolio_url?: string;
  };
  is_saved?: boolean;
  applications_count?: number;
  palette_colors?: string[];
  moodboards?: any[];
  // Simulated fields for enhanced filtering
  style_tags?: string[];
  vibe_tags?: string[];
  city?: string;
  country?: string;
}

export default function GigDiscoveryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompType, setSelectedCompType] = useState<CompensationType | 'ALL'>('ALL');
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeType | 'ALL'>('ALL');
  const [selectedUsageRights, setSelectedUsageRights] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [maxApplicantsFilter, setMaxApplicantsFilter] = useState<number | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<string[]>([]);
  const [availablePalettes, setAvailablePalettes] = useState<string[]>([]);
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>([]);
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([]);
  const [availableStyleTags, setAvailableStyleTags] = useState<string[]>([]);
  const [availableVibeTags, setAvailableVibeTags] = useState<string[]>([]);
  
  // New filters for creator profile data
  const [minExperienceFilter, setMinExperienceFilter] = useState<number | null>(null);
  const [maxExperienceFilter, setMaxExperienceFilter] = useState<number | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);
  const [minRateFilter, setMinRateFilter] = useState<number | null>(null);
  const [maxRateFilter, setMaxRateFilter] = useState<number | null>(null);
  const [travelOnlyFilter, setTravelOnlyFilter] = useState(false);
  const [studioOnlyFilter, setStudioOnlyFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedGigs, setSavedGigs] = useState<Set<string>>(new Set());
  const gigsPerPage = 12;

  useEffect(() => {
    fetchGigs();
    fetchSavedGigs(); // Will handle gracefully if table doesn't exist
    fetchAvailablePalettes();
    fetchAvailableSpecializations();
    initializeSimulatedData();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [searchTerm, selectedCompType, selectedPurpose, selectedUsageRights, locationFilter, selectedPalette, selectedStyleTags, selectedVibeTags, startDateFilter, endDateFilter, maxApplicantsFilter, minExperienceFilter, maxExperienceFilter, selectedSpecializations, minRateFilter, maxRateFilter, travelOnlyFilter, studioOnlyFilter, gigs]);

  const fetchGigs = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          users_profile!owner_user_id (
            display_name,
            avatar_url,
            handle,
            verified_id,
            years_experience,
            specializations,
            hourly_rate_min,
            hourly_rate_max,
            available_for_travel,
            travel_radius_km,
            has_studio,
            studio_name,
            instagram_handle,
            tiktok_handle,
            website_url,
            portfolio_url
          ),
          moodboards!gig_id (
            id,
            palette,
            moodboard_items (
              palette
            )
          )
        `)
        .eq('status', 'PUBLISHED')
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGigs = data?.map(gig => {
        const simulatedData = getSimulatedGigData(gig);
        return {
          ...gig,
          ...simulatedData,
          current_applicants: gig.applications?.[0]?.count || 0,
          is_saved: false,
          palette_colors: simulatedData.palette_colors || extractPaletteColors(gig.moodboards)
        };
      }) || [];

      setGigs(formattedGigs);
      setFilteredGigs(formattedGigs);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedGigs = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        setSavedGigs(new Set())
        return
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSavedGigs(new Set());
        return;
      }

      const { data, error } = await supabase
        .from('saved_gigs')
        .select('gig_id')
        .eq('user_id', user.id);

      if (error) {
        console.log('Saved gigs table not available yet');
        setSavedGigs(new Set());
      } else {
        const savedGigIds = new Set(data?.map(item => item.gig_id) || []);
        setSavedGigs(savedGigIds);
      }
    } catch (error) {
      console.log('Error fetching saved gigs:', error);
      setSavedGigs(new Set());
    }
  };


  const fetchAvailablePalettes = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // Get unique colors from all gig moodboards
      const { data, error } = await supabase.rpc('get_popular_palette_colors', { limit_count: 50 });
      
      if (error) {
        // Fallback: get colors from moodboards directly
        const { data: moodboardData, error: mbError } = await supabase
          .from('moodboards')
          .select('palette, moodboard_items(palette)')
          .not('palette', 'is', null);
        
        if (!mbError && moodboardData) {
          const colors = new Set<string>();
          moodboardData.forEach(mb => {
            // Add colors from moodboard palette
            if (mb.palette && Array.isArray(mb.palette)) {
              mb.palette.forEach((color: string) => colors.add(color));
            }
            // Add colors from moodboard items
            if (mb.moodboard_items) {
              mb.moodboard_items.forEach((item: any) => {
                if (item.palette && Array.isArray(item.palette)) {
                  item.palette.forEach((color: string) => colors.add(color));
                }
              });
            }
          });
          setAvailablePalettes(Array.from(colors).slice(0, 20)); // Limit to top 20
        } else {
          // If no moodboard data, provide popular demo colors for testing
          setAvailablePalettes([
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
            '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
            '#EE5A24', '#009432', '#0652DD', '#9C88FF', '#FFC312',
            '#C4E538', '#12CBC4', '#FDA7DF', '#ED4C67', '#F79F1F'
          ]);
        }
      } else {
        setAvailablePalettes(data || []);
      }
    } catch (error) {
      console.log('Error fetching palettes:', error);
      // Fallback to demo colors
      setAvailablePalettes([
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
        '#EE5A24', '#009432', '#0652DD', '#9C88FF', '#FFC312',
        '#C4E538', '#12CBC4', '#FDA7DF', '#ED4C67', '#F79F1F'
      ]);
    }
  };

  const fetchAvailableSpecializations = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // Get unique specializations from all creator profiles
      const { data, error } = await supabase
        .from('users_profile')
        .select('specializations')
        .not('specializations', 'is', null)
        .not('specializations', 'eq', '{}');

      if (error) {
        console.log('Error fetching specializations:', error);
        // Fallback to common specializations
        setAvailableSpecializations([
          'Portrait Photography', 'Fashion Photography', 'Wedding Photography',
          'Commercial Photography', 'Event Photography', 'Product Photography',
          'Architecture Photography', 'Street Photography', 'Documentary Photography',
          'Beauty Photography', 'Lifestyle Photography', 'Editorial Photography',
          'Fine Art Photography', 'Nature Photography', 'Sports Photography',
          'Food Photography', 'Real Estate Photography', 'Corporate Photography',
          'Headshot Photography', 'Family Photography', 'Newborn Photography',
          'Boudoir Photography', 'Pet Photography', 'Travel Photography'
        ]);
      } else {
        const specializations = new Set<string>();
        data?.forEach(profile => {
          if (profile.specializations && Array.isArray(profile.specializations)) {
            profile.specializations.forEach((spec: string) => {
              if (spec && spec.trim()) {
                specializations.add(spec.trim());
              }
            });
          }
        });
        setAvailableSpecializations(Array.from(specializations).sort());
      }
    } catch (error) {
      console.log('Error fetching specializations:', error);
      // Fallback to common specializations
      setAvailableSpecializations([
        'Portrait Photography', 'Fashion Photography', 'Wedding Photography',
        'Commercial Photography', 'Event Photography', 'Product Photography',
        'Architecture Photography', 'Street Photography', 'Documentary Photography',
        'Beauty Photography', 'Lifestyle Photography', 'Editorial Photography',
        'Fine Art Photography', 'Nature Photography', 'Sports Photography',
        'Food Photography', 'Real Estate Photography', 'Corporate Photography',
        'Headshot Photography', 'Family Photography', 'Newborn Photography',
        'Boudoir Photography', 'Pet Photography', 'Travel Photography'
      ]);
    }
  };

  const initializeSimulatedData = () => {
    // Available style tags
    setAvailableStyleTags([
      'fashion', 'portrait', 'urban', 'commercial', 'product', 'beauty',
      'wedding', 'documentary', 'event', 'lifestyle', 'headshots',
      'street', 'editorial', 'conceptual', 'nature', 'architecture'
    ]);

    // Available vibe tags  
    setAvailableVibeTags([
      'creative', 'professional', 'modern', 'clean', 'bright', 'romantic',
      'intimate', 'natural', 'confident', 'edgy', 'dynamic', 'moody',
      'minimalist', 'vintage', 'dramatic', 'warm', 'cool', 'artistic'
    ]);
  };

  const getSimulatedGigData = (gig: Gig): Partial<Gig> => {
    // Simulate data based on title and purpose
    const simulatedData: Partial<Gig> = {
      style_tags: [],
      vibe_tags: [],
      city: extractCityFromLocation(gig.location_text, undefined),
      country: extractCountryFromLocation(gig.location_text, undefined),
      palette_colors: gig.palette_colors || getSimulatedPaletteColors(gig.purpose, gig.title)
    };

    // Add style tags based on title and purpose
    const title = gig.title.toLowerCase();
    const purpose = gig.purpose?.toLowerCase() || '';
    
    if (title.includes('fashion') || purpose === 'fashion') simulatedData.style_tags?.push('fashion');
    if (title.includes('portrait') || purpose === 'portrait') simulatedData.style_tags?.push('portrait');
    if (title.includes('commercial') || purpose === 'commercial') simulatedData.style_tags?.push('commercial');
    if (title.includes('wedding') || purpose === 'wedding') simulatedData.style_tags?.push('wedding', 'documentary', 'event');
    if (title.includes('headshots') || title.includes('lifestyle')) simulatedData.style_tags?.push('headshots', 'lifestyle');
    if (title.includes('street') || title.includes('urban')) simulatedData.style_tags?.push('street', 'urban');
    if (title.includes('product')) simulatedData.style_tags?.push('product', 'commercial');
    if (title.includes('beauty')) simulatedData.style_tags?.push('beauty', 'commercial');

    // Add vibe tags based on context
    if (title.includes('creative')) simulatedData.vibe_tags?.push('creative');
    if (purpose === 'commercial' || title.includes('professional')) simulatedData.vibe_tags?.push('professional', 'clean');
    if (title.includes('modern') || title.includes('contemporary')) simulatedData.vibe_tags?.push('modern');
    if (purpose === 'wedding' || title.includes('wedding')) simulatedData.vibe_tags?.push('romantic', 'intimate', 'natural');
    if (title.includes('street') || title.includes('urban')) simulatedData.vibe_tags?.push('edgy', 'dynamic');
    if (title.includes('lifestyle') || title.includes('headshots')) simulatedData.vibe_tags?.push('confident', 'natural');

    return simulatedData;
  };

  const extractCityFromLocation = (locationText: string, locationData?: string): string | undefined => {
    // Try structured data first
    if (locationData) {
      try {
        const parsed = JSON.parse(locationData)
        if (parsed.city) return parsed.city
      } catch (e) {
        // Fall back to text parsing
      }
    }

    // Fall back to text parsing
    if (!locationText) return undefined
    const location = locationText.toLowerCase();
    if (location.includes('dublin')) return 'Dublin';
    if (location.includes('cork')) return 'Cork';
    if (location.includes('galway')) return 'Galway';
    if (location.includes('london')) return 'London';
    if (location.includes('manchester')) return 'Manchester';
    if (location.includes('birmingham')) return 'Birmingham';
    if (location.includes('new york')) return 'New York';
    return undefined;
  };

  const extractCountryFromLocation = (locationText: string, locationData?: string): string | undefined => {
    // Try structured data first
    if (locationData) {
      try {
        const parsed = JSON.parse(locationData)
        if (parsed.country) return parsed.country
      } catch (e) {
        // Fall back to text parsing
      }
    }

    // Fall back to text parsing
    if (!locationText) return undefined
    const location = locationText.toLowerCase();
    if (location.includes('ireland') || location.includes('dublin') || location.includes('cork') || location.includes('galway')) return 'Ireland';
    if (location.includes('uk') || location.includes('united kingdom') || location.includes('london') || location.includes('manchester')) return 'United Kingdom';
    if (location.includes('usa') || location.includes('united states') || location.includes('new york')) return 'United States';
    return undefined;
  };

  const getSimulatedPaletteColors = (purpose?: string, title?: string): string[] => {
    // Generate palette colors based on gig context
    if (purpose === 'FASHION' || title?.toLowerCase().includes('fashion')) {
      return ['#E8D5C4', '#C7B299', '#A08A7A', '#8B7267']; // warm fashion tones
    }
    if (purpose === 'COMMERCIAL' || title?.toLowerCase().includes('commercial')) {
      return ['#2D3748', '#4A5568', '#718096', '#A0AEC0']; // professional grays
    }
    if (purpose === 'WEDDING' || title?.toLowerCase().includes('wedding')) {
      return ['#FED7D7', '#FBB6CE', '#ED8936', '#DD6B20']; // romantic pastels
    }
    if (title?.toLowerCase().includes('lifestyle') || title?.toLowerCase().includes('headshots')) {
      return ['#E6FFFA', '#B2F5EA', '#4FD1C7', '#319795']; // fresh teals
    }
    return ['#F7FAFC', '#EDF2F7', '#CBD5E0', '#A0AEC0']; // neutral default
  };

  const extractPaletteColors = (moodboards: any[]): string[] => {
    const colors = new Set<string>();
    
    if (!moodboards || moodboards.length === 0) return [];
    
    moodboards.forEach(mb => {
      // Add colors from moodboard palette
      if (mb.palette && Array.isArray(mb.palette)) {
        mb.palette.forEach((color: string) => colors.add(color));
      }
      // Add colors from moodboard items
      if (mb.moodboard_items && Array.isArray(mb.moodboard_items)) {
        mb.moodboard_items.forEach((item: any) => {
          if (item.palette && Array.isArray(item.palette)) {
            item.palette.forEach((color: string) => colors.add(color));
          }
        });
      }
    });
    
    return Array.from(colors);
  };

  const filterGigs = () => {
    let filtered = [...gigs];

    if (searchTerm) {
      filtered = filtered.filter(gig =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.location_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCompType !== 'ALL') {
      filtered = filtered.filter(gig => gig.comp_type === selectedCompType);
    }

    if (selectedPurpose !== 'ALL') {
      filtered = filtered.filter(gig => gig.purpose === selectedPurpose);
    }

    if (selectedUsageRights !== 'ALL') {
      filtered = filtered.filter(gig => 
        gig.usage_rights && gig.usage_rights.toLowerCase().includes(selectedUsageRights.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(gig =>
        gig.location_text.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (startDateFilter) {
      filtered = filtered.filter(gig =>
        new Date(gig.start_time) >= new Date(startDateFilter)
      );
    }

    if (endDateFilter) {
      filtered = filtered.filter(gig =>
        new Date(gig.end_time) <= new Date(endDateFilter + 'T23:59:59')
      );
    }

    if (maxApplicantsFilter) {
      filtered = filtered.filter(gig =>
        gig.max_applicants <= maxApplicantsFilter
      );
    }

    if (selectedPalette.length > 0) {
      filtered = filtered.filter(gig =>
        gig.palette_colors && gig.palette_colors.some((color: string) => 
          selectedPalette.some(selectedColor => 
            colorDistance(color, selectedColor) < 30 // Color similarity threshold
          )
        )
      );
    }

    if (selectedStyleTags.length > 0) {
      filtered = filtered.filter(gig =>
        gig.style_tags && gig.style_tags.some(tag => 
          selectedStyleTags.includes(tag)
        )
      );
    }

    if (selectedVibeTags.length > 0) {
      filtered = filtered.filter(gig =>
        gig.vibe_tags && gig.vibe_tags.some(tag => 
          selectedVibeTags.includes(tag)
        )
      );
    }

    // New filters for creator profile data
    if (minExperienceFilter !== null) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.years_experience && gig.users_profile.years_experience >= minExperienceFilter
      );
    }

    if (maxExperienceFilter !== null) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.years_experience && gig.users_profile.years_experience <= maxExperienceFilter
      );
    }

    if (selectedSpecializations.length > 0) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.specializations && gig.users_profile.specializations.some(spec => 
          selectedSpecializations.includes(spec)
        )
      );
    }

    if (minRateFilter !== null) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.hourly_rate_min && gig.users_profile.hourly_rate_min >= minRateFilter
      );
    }

    if (maxRateFilter !== null) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.hourly_rate_max && gig.users_profile.hourly_rate_max <= maxRateFilter
      );
    }

    if (travelOnlyFilter) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.available_for_travel === true
      );
    }

    if (studioOnlyFilter) {
      filtered = filtered.filter(gig =>
        gig.users_profile?.has_studio === true
      );
    }

    setFilteredGigs(filtered);
    setCurrentPage(1);
  };

  // Helper function to calculate color distance (simple RGB difference)
  const colorDistance = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 999;
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  };

  const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const toggleSaveGig = async (gigId: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      if (savedGigs.has(gigId)) {
        await supabase
          .from('saved_gigs')
          .delete()
          .eq('gig_id', gigId)
          .eq('user_id', user.id);
        
        setSavedGigs(prev => {
          const newSet = new Set(prev);
          newSet.delete(gigId);
          return newSet;
        });
      } else {
        await supabase
          .from('saved_gigs')
          .insert({ gig_id: gigId, user_id: user.id });
        
        setSavedGigs(prev => new Set([...prev, gigId]));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
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
        return 'bg-primary/10 text-primary';
      case 'TFP':
        return 'bg-secondary/20 text-secondary-foreground';
      case 'EXPENSES':
        return 'bg-muted/50 text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Pagination
  const indexOfLastGig = currentPage * gigsPerPage;
  const indexOfFirstGig = indexOfLastGig - gigsPerPage;
  const currentGigs = filteredGigs.slice(indexOfFirstGig, indexOfLastGig);
  const totalPages = Math.ceil(filteredGigs.length / gigsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl p-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">Gigs</h1>
                <p className="text-xl text-muted-foreground">Discover creative opportunities and collaborate with talented professionals</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/gigs/create">
                <Button size="lg" className="px-8 py-3 text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Create Gig
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="sticky top-4 z-10 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search gigs, styles, or keywords..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

            {/* Filter Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              {/* First row on mobile: Type selector and Location */}
              <div className="flex gap-2 flex-1">
                <Select value={selectedCompType} onValueChange={(value) => setSelectedCompType(value as CompensationType | 'ALL')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="TFP">TFP</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="EXPENSES">Expenses</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="Location..."
                  className="flex-1 min-w-0"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Filter button - always visible */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filt</span>
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Purpose Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Purpose
                  </label>
                  <Select value={selectedPurpose} onValueChange={(value) => setSelectedPurpose(value as PurposeType | 'ALL')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Purposes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Purposes</SelectItem>
                      <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                      <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                      <SelectItem value="EDITORIAL">Editorial</SelectItem>
                      <SelectItem value="FASHION">Fashion</SelectItem>
                      <SelectItem value="BEAUTY">Beauty</SelectItem>
                      <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
                      <SelectItem value="WEDDING">Wedding</SelectItem>
                      <SelectItem value="EVENT">Event</SelectItem>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="ARCHITECTURE">Architecture</SelectItem>
                      <SelectItem value="STREET">Street</SelectItem>
                      <SelectItem value="CONCEPTUAL">Conceptual</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Usage Rights Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Usage Rights
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedUsageRights}
                    onChange={(e) => setSelectedUsageRights(e.target.value)}
                  >
                    <option value="ALL">All Usage Rights</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="social">Social Media</option>
                    <option value="commercial">Commercial</option>
                    <option value="editorial">Editorial</option>
                    <option value="print">Print</option>
                    <option value="web">Website</option>
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date From
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date Until
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>

                {/* Max Applicants Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Applicants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={maxApplicantsFilter || ''}
                    onChange={(e) => setMaxApplicantsFilter(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
              </div>


              {/* Style Tags Filter */}
              {availableStyleTags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Style Tags
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableStyleTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (selectedStyleTags.includes(tag)) {
                            setSelectedStyleTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setSelectedStyleTags(prev => [...prev, tag]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                          selectedStyleTags.includes(tag)
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-foreground border-2 border-border hover:border-primary/50'
                        }`}
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                  {selectedStyleTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedStyleTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() => setSelectedStyleTags(prev => prev.filter(t => t !== tag))}
                            className="hover:text-primary/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vibe Tags Filter */}
              {availableVibeTags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Vibe Tags
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableVibeTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (selectedVibeTags.includes(tag)) {
                            setSelectedVibeTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setSelectedVibeTags(prev => [...prev, tag]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                          selectedVibeTags.includes(tag)
                            ? 'bg-secondary/20 text-secondary-foreground border-2 border-secondary'
                            : 'bg-muted text-foreground border-2 border-border hover:border-primary/50'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                  {selectedVibeTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedVibeTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/20 text-secondary-foreground text-xs rounded-full"
                        >
                          <Sparkles className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() => setSelectedVibeTags(prev => prev.filter(t => t !== tag))}
                            className="hover:text-secondary-foreground/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Color Palette Filter */}
              {availablePalettes.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Color Palette
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availablePalettes.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (selectedPalette.includes(color)) {
                            setSelectedPalette(prev => prev.filter(c => c !== color));
                          } else {
                            setSelectedPalette(prev => [...prev, color]);
                          }
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          selectedPalette.includes(color)
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  {selectedPalette.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedPalette.map((color, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground text-xs rounded-full"
                        >
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: color }}
                          />
                          {color}
                          <button
                            onClick={() => setSelectedPalette(prev => prev.filter(c => c !== color))}
                            className="hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Creator Profile Filters */}
              <div className="mt-6 border-t border-border pt-4">
                <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-border shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Creator Profile Filters</h3>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Experience Range Filter */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Experience (Years)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={minExperienceFilter || ''}
                        onChange={(e) => setMinExperienceFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={maxExperienceFilter || ''}
                        onChange={(e) => setMaxExperienceFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                  </div>

                  {/* Rate Range Filter */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Hourly Rate ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={minRateFilter || ''}
                        onChange={(e) => setMinRateFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={maxRateFilter || ''}
                        onChange={(e) => setMaxRateFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                  </div>

                  {/* Availability Filters */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Availability
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={travelOnlyFilter}
                          onChange={(e) => setTravelOnlyFilter(e.target.checked)}
                          className="mr-3 w-4 h-4 text-primary bg-card border-primary/30 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Available for Travel</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={studioOnlyFilter}
                          onChange={(e) => setStudioOnlyFilter(e.target.checked)}
                          className="mr-3 w-4 h-4 text-primary bg-card border-primary/30 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground dark:text-muted-foreground-300">Has Studio</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Specializations Filter */}
                {availableSpecializations.length > 0 && (
                  <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Specializations
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableSpecializations.map((spec, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (selectedSpecializations.includes(spec)) {
                              setSelectedSpecializations(prev => prev.filter(s => s !== spec));
                            } else {
                              setSelectedSpecializations(prev => [...prev, spec]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                            selectedSpecializations.includes(spec)
                              ? 'bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 border-2 border-primary-500'
                              : 'bg-card dark:bg-muted-700 text-foreground dark:text-muted-foreground-300 border-2 border-primary-200 dark:border-primary-600 hover:border-primary-400'
                          }`}
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {spec}
                        </button>
                      ))}
                    </div>
                    {selectedSpecializations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {selectedSpecializations.map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {spec}
                            <button
                              onClick={() => setSelectedSpecializations(prev => prev.filter(s => s !== spec))}
                              className="hover:text-secondary-foreground/80 dark:hover:text-primary-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPurpose('ALL');
                    setSelectedUsageRights('ALL');
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setMaxApplicantsFilter(null);
                    setSelectedPalette([]);
                    setSelectedStyleTags([]);
                    setSelectedVibeTags([]);
                    setSelectedCompType('ALL');
                    setLocationFilter('');
                    setSearchTerm('');
                    setMinExperienceFilter(null);
                    setMaxExperienceFilter(null);
                    setSelectedSpecializations([]);
                    setMinRateFilter(null);
                    setMaxRateFilter(null);
                    setTravelOnlyFilter(false);
                    setStudioOnlyFilter(false);
                  }}
                  className="text-sm underline"
                >
                  Clear all filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="text-sm font-medium"
                >
                  Hide filters
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Found {filteredGigs.length} gigs
          {(() => {
            const hasFilters = selectedPalette.length > 0 || 
                              selectedStyleTags.length > 0 || 
                              selectedVibeTags.length > 0 || 
                              selectedPurpose !== 'ALL' || 
                              selectedUsageRights !== 'ALL' || 
                              startDateFilter || 
                              endDateFilter || 
                              maxApplicantsFilter || 
                              minExperienceFilter !== null || 
                              maxExperienceFilter !== null || 
                              selectedSpecializations.length > 0 || 
                              minRateFilter !== null || 
                              maxRateFilter !== null || 
                              travelOnlyFilter || 
                              studioOnlyFilter;
            
            return hasFilters ? (
              <span className="ml-2 text-primary">
                (filtered)
              </span>
            ) : null;
          })()}
        </div>

        {/* Main Content */}
        {/* Gig Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentGigs.map((gig) => (
            <div key={gig.id} className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Gig Image/Moodboard Preview */}
              <div className="relative h-48 bg-muted-200 rounded-t-lg overflow-hidden">
                {gig.moodboard_urls && gig.moodboard_urls.length > 0 ? (
                  <img
                    src={gig.moodboard_urls[0]}
                    alt={gig.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                    <Camera className="w-12 h-12 text-primary" />
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={() => toggleSaveGig(gig.id)}
                  className="absolute top-3 right-3 p-2 bg-card rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Heart
                    className={`w-5 h-5 ${savedGigs.has(gig.id) ? 'fill-destructive-primary text-destructive-500' : 'text-muted-foreground'}`}
                  />
                </button>

                {/* Compensation Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCompTypeColor(gig.comp_type)}`}>
                  {getCompTypeIcon(gig.comp_type)}
                  {gig.comp_type}
                </div>
              </div>

              {/* Gig Details */}
              <div className="p-4">
                {/* Title and Owner */}
                <Link href={`/gigs/${gig.id}`}>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                    {gig.title}
                  </h3>
                </Link>

                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={gig.users_profile?.avatar_url || '/default-avatar.png'}
                      alt={gig.users_profile?.display_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-muted-foreground-900 truncate">
                          {gig.users_profile?.display_name || 'Unknown User'}
                        </h4>
                        {gig.users_profile?.verified_id && (
                          <div className="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Creator Profile Information */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {gig.users_profile?.years_experience && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{gig.users_profile.years_experience} years experience</span>
                      </div>
                    )}
                    
                    {(gig.users_profile?.hourly_rate_min || gig.users_profile?.hourly_rate_max) && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>
                          ${gig.users_profile.hourly_rate_min || 0} - ${gig.users_profile.hourly_rate_max || '∞'} / hour
                        </span>
                      </div>
                    )}
                    
                    {gig.users_profile?.available_for_travel && (
                      <div className="flex items-center gap-1">
                        <Radius className="w-3 h-3" />
                        <span>Available for travel ({gig.users_profile.travel_radius_km || 50}km)</span>
                      </div>
                    )}
                    
                    {gig.users_profile?.has_studio && (
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>Has studio{gig.users_profile.studio_name ? `: ${gig.users_profile.studio_name}` : ''}</span>
                      </div>
                    )}
                    
                    {gig.users_profile?.specializations && gig.users_profile.specializations.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span className="truncate">
                          {gig.users_profile.specializations.slice(0, 2).join(', ')}
                          {gig.users_profile.specializations.length > 2 && ` +${gig.users_profile.specializations.length - 2} more`}
                        </span>
                      </div>
                    )}
                  </div>
                  {gig.users_profile?.handle && (
                    <p className="text-xs text-muted-foreground mt-0.5">@{gig.users_profile.handle}</p>
                  )}
                </div>

                {/* Location and Date */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {gig.location_text}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(gig.start_time)}
                  </div>
                </div>

                {/* Purpose Tag */}
                {gig.purpose && (
                  <div className="mt-3">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      {gig.purpose.replace('_', ' ')}
                    </span>
                  </div>
                )}

                {/* Style Tags */}
                {gig.style_tags && gig.style_tags.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {gig.style_tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                      {gig.style_tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{gig.style_tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Vibe Tags */}
                {gig.vibe_tags && gig.vibe_tags.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {gig.vibe_tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <Sparkles className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                      {gig.vibe_tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{gig.vibe_tags.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Color Palette Preview */}
                {gig.palette_colors && gig.palette_colors.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {gig.palette_colors.slice(0, 4).map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-border-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      {gig.palette_colors.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{gig.palette_colors.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Stats */}
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {gig.current_applicants}/{gig.max_applicants}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getDaysUntilDeadline(gig.application_deadline)}d left
                    </div>
                  </div>
                  <Link
                    href={`/gigs/${gig.id}`}
                    className="text-sm text-primary hover:text-primary-700 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGigs.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground-900 mb-2">No gigs found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index + 1}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
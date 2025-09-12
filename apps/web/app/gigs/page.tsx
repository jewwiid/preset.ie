'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { MapPin, Calendar, Users, Search, Filter, Heart, Clock, DollarSign, Camera, Video, Sparkles, ChevronLeft, ChevronRight, X, Tag, Eye, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedGigs, setSavedGigs] = useState<Set<string>>(new Set());
  const gigsPerPage = 12;

  useEffect(() => {
    fetchGigs();
    fetchSavedGigs(); // Will handle gracefully if table doesn't exist
    fetchAvailablePalettes();
    initializeSimulatedData();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [searchTerm, selectedCompType, selectedPurpose, selectedUsageRights, locationFilter, selectedPalette, selectedStyleTags, selectedVibeTags, startDateFilter, endDateFilter, maxApplicantsFilter, gigs]);

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          users_profile!owner_user_id (
            display_name,
            avatar_url,
            handle,
            verified_id
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search and Filters */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search gigs, styles, or keywords..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedCompType}
                onChange={(e) => setSelectedCompType(e.target.value as CompensationType | 'ALL')}
              >
                <option value="ALL">All Types</option>
                <option value="TFP">TFP</option>
                <option value="PAID">Paid</option>
                <option value="EXPENSES">Expenses</option>
                <option value="OTHER">Other</option>
              </select>

              <input
                type="text"
                placeholder="Location..."
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Purpose Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value as PurposeType | 'ALL')}
                  >
                    <option value="ALL">All Purposes</option>
                    <option value="PORTFOLIO">Portfolio</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="EDITORIAL">Editorial</option>
                    <option value="FASHION">Fashion</option>
                    <option value="BEAUTY">Beauty</option>
                    <option value="LIFESTYLE">Lifestyle</option>
                    <option value="WEDDING">Wedding</option>
                    <option value="EVENT">Event</option>
                    <option value="PRODUCT">Product</option>
                    <option value="ARCHITECTURE">Architecture</option>
                    <option value="STREET">Street</option>
                    <option value="CONCEPTUAL">Conceptual</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Usage Rights Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Rights
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date From
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date Until
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>

                {/* Max Applicants Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Applicants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={maxApplicantsFilter || ''}
                    onChange={(e) => setMaxApplicantsFilter(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
              </div>


              {/* Style Tags Filter */}
              {availableStyleTags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-gray-400'
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
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() => setSelectedStyleTags(prev => prev.filter(t => t !== tag))}
                            className="hover:text-indigo-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? 'bg-purple-100 text-purple-800 border-2 border-purple-500'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-gray-400'
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
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          <Sparkles className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() => setSelectedVibeTags(prev => prev.filter(t => t !== tag))}
                            className="hover:text-purple-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                            : 'border-gray-300 hover:border-gray-400'
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
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: color }}
                          />
                          {color}
                          <button
                            onClick={() => setSelectedPalette(prev => prev.filter(c => c !== color))}
                            className="hover:text-gray-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clear Filters */}
              <div className="mt-4 flex justify-between items-center">
                <button
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
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Hide filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Found {filteredGigs.length} gigs
            {(selectedPalette.length > 0 || selectedStyleTags.length > 0 || selectedVibeTags.length > 0 || selectedPurpose !== 'ALL' || selectedUsageRights !== 'ALL' || startDateFilter || endDateFilter || maxApplicantsFilter) && (
              <span className="ml-2 text-indigo-600">
                (filtered)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gig Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentGigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Gig Image/Moodboard Preview */}
              <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                {gig.moodboard_urls && gig.moodboard_urls.length > 0 ? (
                  <img
                    src={gig.moodboard_urls[0]}
                    alt={gig.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <Camera className="w-12 h-12 text-indigo-400" />
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={() => toggleSaveGig(gig.id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Heart
                    className={`w-5 h-5 ${savedGigs.has(gig.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
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
                  <h3 className="font-semibold text-lg hover:text-indigo-600 transition-colors">
                    {gig.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={gig.users_profile?.avatar_url || '/default-avatar.png'}
                    alt={gig.users_profile?.display_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {gig.users_profile?.display_name || 'Unknown User'}
                      </h4>
                      {gig.users_profile?.verified_id && (
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      )}
                    </div>
                    {gig.users_profile?.handle && (
                      <p className="text-xs text-gray-500 mt-0.5">@{gig.users_profile.handle}</p>
                    )}
                  </div>
                </div>

                {/* Location and Date */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {gig.location_text}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(gig.start_time)}
                  </div>
                </div>

                {/* Purpose Tag */}
                {gig.purpose && (
                  <div className="mt-3">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
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
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                      {gig.style_tags.length > 3 && (
                        <span className="text-xs text-gray-500">
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
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <Sparkles className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                      {gig.vibe_tags.length > 2 && (
                        <span className="text-xs text-gray-500">
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
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      {gig.palette_colors.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{gig.palette_colors.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Stats */}
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
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
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-indigo-600 text-white'
                    : 'border hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Gig } from '../types';
import { extractPaletteColors } from '../utils';

/**
 * Custom hook for managing gig data fetching and state
 * Handles fetching gigs, palettes, role types, and specializations
 */
export const useGigs = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [availablePalettes, setAvailablePalettes] = useState<string[]>([]);
  const [availableRoleTypes, setAvailableRoleTypes] = useState<string[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);

  /**
   * Fetches all published gigs with their related profile and moodboard data
   */
  const fetchGigs = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
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
            palette
          )
        `)
        .eq('status', 'PUBLISHED')
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGigs = data?.map(gig => ({
        ...gig,
        current_applicants: gig.applications?.[0]?.count || 0,
        is_saved: false,
        palette_colors: extractPaletteColors(gig.moodboards)
      })) || [];

      setGigs(formattedGigs);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches available palette colors from moodboards
   */
  const fetchAvailablePalettes = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      // Try to get colors using RPC function first
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
          setAvailablePalettes(Array.from(colors).slice(0, 20));
        } else {
          // Fallback to demo colors
          setAvailablePalettes(getDefaultPaletteColors());
        }
      } else {
        setAvailablePalettes(data || []);
      }
    } catch (error) {
      console.log('Error fetching palettes:', error);
      setAvailablePalettes(getDefaultPaletteColors());
    }
  };

  /**
   * Fetches available role types from all gigs
   */
  const fetchAvailableRoleTypes = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { data, error } = await supabase
        .from('gigs')
        .select('looking_for_types')
        .not('looking_for_types', 'is', null);

      if (!error && data) {
        const roleTypesSet = new Set<string>();
        data.forEach(gig => {
          if (gig.looking_for_types && Array.isArray(gig.looking_for_types)) {
            gig.looking_for_types.forEach(type => roleTypesSet.add(type));
          }
        });
        setAvailableRoleTypes(Array.from(roleTypesSet).sort());
      }
    } catch (error) {
      console.log('Error fetching role types:', error);
    }
  };

  /**
   * Fetches available specializations from user profiles
   */
  const fetchAvailableSpecializations = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { data, error } = await supabase
        .from('users_profile')
        .select('specializations')
        .not('specializations', 'is', null)
        .not('specializations', 'eq', '{}');

      if (error) {
        console.log('Error fetching specializations:', error);
        setAvailableSpecializations(getDefaultSpecializations());
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
      setAvailableSpecializations(getDefaultSpecializations());
    }
  };

  /**
   * Default palette colors for fallback
   */
  const getDefaultPaletteColors = (): string[] => [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#EE5A24', '#009432', '#0652DD', '#9C88FF', '#FFC312',
    '#C4E538', '#12CBC4', '#FDA7DF', '#ED4C67', '#F79F1F'
  ];

  /**
   * Default specializations for fallback
   */
  const getDefaultSpecializations = (): string[] => [
    'Portrait Photography', 'Fashion Photography', 'Wedding Photography',
    'Commercial Photography', 'Event Photography', 'Product Photography',
    'Architecture Photography', 'Street Photography', 'Documentary Photography',
    'Beauty Photography', 'Lifestyle Photography', 'Editorial Photography',
    'Fine Art Photography', 'Nature Photography', 'Sports Photography',
    'Food Photography', 'Real Estate Photography', 'Corporate Photography',
    'Headshot Photography', 'Family Photography', 'Newborn Photography',
    'Boudoir Photography', 'Pet Photography', 'Travel Photography'
  ];

  // Initialize data on mount
  useEffect(() => {
    fetchGigs();
    fetchAvailablePalettes();
    fetchAvailableRoleTypes();
    fetchAvailableSpecializations();
  }, []);

  return {
    gigs,
    loading,
    availablePalettes,
    availableRoleTypes,
    availableSpecializations,
    refetch: fetchGigs
  };
};

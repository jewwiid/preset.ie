import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Custom hook for managing saved gigs functionality
 * Handles fetching saved gigs and toggling save state
 */
export const useSavedGigs = () => {
  const [savedGigs, setSavedGigs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the list of gigs saved by the current user
   */
  const fetchSavedGigs = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        setSavedGigs(new Set());
        return;
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
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles the save state of a gig
   * @param gigId - The ID of the gig to toggle
   * @param onUnauthenticated - Callback when user is not authenticated
   */
  const toggleSaveGig = async (gigId: string, onUnauthenticated?: () => void) => {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onUnauthenticated?.();
        return;
      }

      if (savedGigs.has(gigId)) {
        // Unsave the gig
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
        // Save the gig
        await supabase
          .from('saved_gigs')
          .insert({ gig_id: gigId, user_id: user.id });

        setSavedGigs(prev => new Set([...prev, gigId]));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchSavedGigs();
  }, []);

  return {
    savedGigs,
    loading,
    toggleSaveGig,
    refetch: fetchSavedGigs
  };
};

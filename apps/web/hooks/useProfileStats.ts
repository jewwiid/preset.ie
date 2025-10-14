import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileStats {
  totalGigs: number;
  totalShowcases: number;
}

export function useProfileStats(profileId: string | undefined) {
  const [stats, setStats] = useState<ProfileStats>({
    totalGigs: 0,
    totalShowcases: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      fetchStats();
    }
  }, [profileId]);

  const fetchStats = async () => {
    if (!profileId || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch gig count (gigs where user is owner)
      const { data: gigsData, error: gigsError } = await (supabase as any)
        .from('gigs')
        .select('id', { count: 'exact' })
        .eq('owner_user_id', profileId);

      if (gigsError) {
        console.error('Error fetching gigs count:', gigsError);
      }

      // Fetch showcase count (showcases where user is creator or talent)
      const { data: showcasesData, error: showcasesError} = await (supabase as any)
        .from('showcases')
        .select('id', { count: 'exact' })
        .or(`creator_user_id.eq.${profileId},talent_user_id.eq.${profileId}`);

      if (showcasesError) {
        console.error('Error fetching showcases count:', showcasesError);
      }

      setStats({
        totalGigs: gigsData?.length || 0,
        totalShowcases: showcasesData?.length || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load profile statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchStats };
}

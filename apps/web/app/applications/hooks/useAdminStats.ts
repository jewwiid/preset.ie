/**
 * Applications Module - useAdminStats Hook
 *
 * Fetches and manages admin-level statistics.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AdminStats, ViewMode } from '../types';

interface UseAdminStatsReturn {
  stats: AdminStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminStats(viewMode: ViewMode): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats>({
    totalApplications: 0,
    pendingReview: 0,
    flaggedUsers: 0,
    recentBans: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    if (!supabase) {
      setError('Supabase client not configured');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Applications: Fetching admin stats...');

      // Get total applications count
      const { count: totalApps, error: totalError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      // Get pending applications count
      const { count: pendingApps, error: pendingError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Get banned users count
      const { data: allUsers, error: bannedError } = await supabase
        .from('users_profile')
        .select('role_flags');

      const bannedUsers = allUsers
        ? allUsers.filter(
            (user) => user.role_flags && user.role_flags.includes('BANNED')
          ).length
        : 0;

      if (totalError || pendingError || bannedError) {
        throw new Error('Error fetching admin stats');
      }

      const newStats = {
        totalApplications: totalApps || 0,
        pendingReview: pendingApps || 0,
        flaggedUsers: 0, // TODO: Implement flagged users system
        recentBans: bannedUsers || 0,
      };

      setStats(newStats);

      console.log('Applications: Admin stats loaded:', newStats);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'admin') {
      fetchAdminStats();
    }
  }, [viewMode]);

  return {
    stats,
    loading,
    error,
    refetch: fetchAdminStats,
  };
}

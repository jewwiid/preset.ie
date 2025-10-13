/**
 * Applications Module - useApplicationStats Hook
 *
 * Calculates statistics from applications.
 */

import { useMemo } from 'react';
import type { Application, ApplicationStats } from '../types';
import {
  getApplicationCountsByStatus,
  getApplicationCountsByType,
} from '../lib/applicationFilters';

interface UseApplicationStatsReturn {
  stats: ApplicationStats;
  successRate: number;
}

export function useApplicationStats(
  applications: Application[]
): UseApplicationStatsReturn {
  const stats = useMemo<ApplicationStats>(() => {
    const counts = getApplicationCountsByStatus(applications);
    const byType = getApplicationCountsByType(applications);

    return {
      total: counts.total || 0,
      pending: (counts.PENDING || 0) + (counts.pending || 0),
      shortlisted: counts.SHORTLISTED || 0,
      accepted: (counts.ACCEPTED || 0) + (counts.accepted || 0),
      declined: (counts.DECLINED || 0) + (counts.rejected || 0),
      withdrawn: counts.withdrawn || 0,
      byType,
    };
  }, [applications]);

  const successRate = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.accepted / stats.total) * 100);
  }, [stats]);

  return { stats, successRate };
}

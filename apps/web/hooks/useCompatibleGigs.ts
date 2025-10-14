import { useApiQuery } from './useApiQuery';
import { Recommendation } from '../lib/types/matchmaking';

export function useCompatibleGigs(profileId: string | undefined) {
  const { data, loading, error, refetch } = useApiQuery<{ recommendations: Recommendation[] }>({
    endpoint: `/api/matchmaking/recommendations?userId=${profileId}`,
    enabled: !!profileId,
    dependencies: [profileId],
    transform: (data) => data,
    onError: (err) => console.error('Error fetching compatible gigs:', err),
  });

  return {
    compatibleGigs: data?.recommendations || [],
    loading,
    error,
    refetch
  };
}

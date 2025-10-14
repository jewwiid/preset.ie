import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRating } from '../types/marketplace';

interface UseUserRatingOptions {
  userId?: string;      // If provided, fetch for specific user
  enabled?: boolean;    // Control when to fetch (replaces isOpen)
}

/**
 * Unified hook for fetching user ratings
 *
 * @param options.userId - Optional user ID to fetch rating for. If not provided, fetches current user's rating
 * @param options.enabled - Whether to fetch the rating. Defaults to true
 *
 * @example
 * // For current user (authenticated)
 * const { rating, loading } = useUserRating({ enabled: isModalOpen });
 *
 * @example
 * // For specific user profile
 * const { rating, loading } = useUserRating({ userId: profile.id });
 */
export function useUserRating({ userId, enabled = true }: UseUserRatingOptions = {}) {
  const [rating, setRating] = useState<UserRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    fetchRating();
  }, [userId, enabled]);

  const fetchRating = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint: string;
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (userId) {
        // Fetch rating for specific user (public endpoint)
        endpoint = `/api/user-rating?userId=${userId}`;
      } else {
        // Fetch rating for current user (authenticated endpoint)
        const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
        if (!session) {
          setLoading(false);
          return;
        }

        endpoint = '/api/user/rating';
        headers = {
          ...headers,
          'Authorization': `Bearer ${session.access_token}`,
        };
      }

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch rating');
      }

      const data = await response.json();

      // Handle both response formats
      const ratingData: UserRating = userId
        ? {
            average: data.average_rating || 0,
            total: data.total_reviews || 0,
          }
        : data; // Current user endpoint already returns correct format

      setRating(ratingData);
    } catch (err) {
      console.error('Error fetching user rating:', err);
      setError('Failed to load rating');
      setRating(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    rating,
    userRating: rating, // Backwards compatibility alias
    loading,
    error,
    refetch: fetchRating,
  };
}

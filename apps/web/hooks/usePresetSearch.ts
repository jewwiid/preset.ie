import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/auth-context';
import { useApiQuery } from './useApiQuery';

export interface PresetSearchOptions {
  category?: string;
  searchQuery?: string;
  sortBy?: string;
  limit?: number;
}

export interface PresetSearchResult {
  presets: any[];
  loading: boolean;
  error: string | null;
  fetchPresets: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface PresetsResponse {
  presets: any[];
}

export function usePresetSearch(options: PresetSearchOptions = {}): PresetSearchResult {
  const {
    category = 'all',
    searchQuery = '',
    sortBy = 'popular',
    limit = 20,
  } = options;

  const { session } = useAuth();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category);
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
    params.append('sort', sortBy);
    params.append('limit', limit.toString());
    return params.toString();
  }, [category, debouncedSearchQuery, sortBy, limit]);

  const { data, loading, error, refetch } = useApiQuery<PresetsResponse>({
    endpoint: `/api/presets?${queryParams}`,
    enabled: !!session?.access_token,
    dependencies: [session?.access_token, queryParams],
    headers: session?.access_token ? {
      Authorization: `Bearer ${session.access_token}`,
    } : undefined,
    onError: (err) => console.error('Error fetching presets:', err),
  });

  return {
    presets: data?.presets || [],
    loading,
    error,
    fetchPresets: refetch,
    refetch,
  };
}

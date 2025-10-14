'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Options for useApiQuery hook
 */
export interface UseApiQueryOptions<T> {
  /**
   * API endpoint URL or function that returns URL
   * Can be a string or a function for dynamic endpoints
   */
  endpoint: string | (() => string);

  /**
   * Transform function to convert raw API response to desired type
   * Useful for normalizing different API response formats
   */
  transform?: (data: any) => T;

  /**
   * Whether the query is enabled
   * If false, the query will not run
   * @default true
   */
  enabled?: boolean;

  /**
   * Dependencies array for useEffect
   * Query will re-run when any dependency changes
   * @default []
   */
  dependencies?: any[];

  /**
   * Custom headers for the fetch request
   */
  headers?: HeadersInit;

  /**
   * Called when the query encounters an error
   */
  onError?: (error: string) => void;

  /**
   * Called when the query succeeds
   */
  onSuccess?: (data: T) => void;

  /**
   * Fetch method (GET, POST, etc.)
   * @default 'GET'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Request body for POST/PUT/PATCH requests
   */
  body?: any;

  /**
   * Retry count for failed requests
   * @default 0
   */
  retry?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Cache time in milliseconds
   * If set, successful responses will be cached
   * @default undefined (no caching)
   */
  cacheTime?: number;

  /**
   * Initial data to use before first fetch
   */
  initialData?: T;
}

// Simple in-memory cache
const queryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Generic API query hook with support for caching, retries, and transformations
 *
 * Consolidates common data fetching patterns into a single reusable hook.
 * Eliminates boilerplate for API calls by providing built-in loading, error, and retry logic.
 *
 * @example
 * // Simple GET request
 * const { data, loading, error } = useApiQuery({
 *   endpoint: '/api/users',
 * });
 *
 * @example
 * // Conditional fetching with dependencies
 * const { data, loading } = useApiQuery({
 *   endpoint: `/api/user/${userId}`,
 *   enabled: !!userId,
 *   dependencies: [userId],
 * });
 *
 * @example
 * // With authentication headers and transform
 * const { data: profile } = useApiQuery({
 *   endpoint: '/api/profile',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *   },
 *   transform: (raw) => ({
 *     name: raw.display_name,
 *     email: raw.email_address,
 *   }),
 *   onError: (err) => showToast(err),
 * });
 *
 * @example
 * // With retry logic
 * const { data, loading, refetch } = useApiQuery({
 *   endpoint: '/api/flaky-endpoint',
 *   retry: 3,
 *   retryDelay: 2000,
 * });
 */
export function useApiQuery<T>({
  endpoint,
  transform,
  enabled = true,
  dependencies = [],
  headers,
  onError,
  onSuccess,
  method = 'GET',
  body,
  retry = 0,
  retryDelay = 1000,
  cacheTime,
  initialData,
}: UseApiQueryOptions<T>) {
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  /**
   * Fetch data from API with retry logic
   */
  const fetchData = useCallback(
    async (retryCount = 0): Promise<void> => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        // Get endpoint URL
        const url = typeof endpoint === 'function' ? endpoint() : endpoint;

        // Check cache if cacheTime is set
        if (cacheTime && method === 'GET') {
          const cached = queryCache.get(url);
          if (cached && Date.now() - cached.timestamp < cacheTime) {
            setData(cached.data);
            setLoading(false);
            setIsStale(false);
            return;
          }
        }

        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        };

        // Add body for non-GET requests
        if (body && method !== 'GET') {
          fetchOptions.body = JSON.stringify(body);
        }

        // Make the API call
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const rawData = await response.json();

        // Transform if transform function provided
        const transformedData = transform ? transform(rawData) : rawData;

        // Update state
        setData(transformedData);
        setIsStale(false);

        // Cache the result if cacheTime is set
        if (cacheTime && method === 'GET') {
          queryCache.set(url, {
            data: transformedData,
            timestamp: Date.now(),
          });
        }

        // Call success callback
        onSuccess?.(transformedData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';

        // Retry logic
        if (retryCount < retry) {
          setTimeout(() => {
            fetchData(retryCount + 1);
          }, retryDelay);
          return;
        }

        // Set error state
        setError(errorMsg);
        onError?.(errorMsg);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [
      enabled,
      endpoint,
      headers,
      transform,
      onError,
      onSuccess,
      method,
      body,
      retry,
      retryDelay,
      cacheTime,
    ]
  );

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  /**
   * Invalidate cache for this endpoint
   */
  const invalidateCache = useCallback(() => {
    const url = typeof endpoint === 'function' ? endpoint() : endpoint;
    queryCache.delete(url);
    setIsStale(true);
  }, [endpoint]);

  /**
   * Effect to fetch data when dependencies change
   */
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, ...dependencies]);

  return {
    /** The fetched and transformed data */
    data,
    /** Whether the query is currently loading */
    loading,
    /** Error message if the query failed */
    error,
    /** Whether the data is stale (cache invalidated but not refetched) */
    isStale,
    /** Manually trigger a refetch */
    refetch,
    /** Invalidate the cache for this endpoint */
    invalidateCache,
  };
}

/**
 * Clear all cached queries
 */
export function clearQueryCache() {
  queryCache.clear();
}

/**
 * Get cache size (for debugging)
 */
export function getQueryCacheSize() {
  return queryCache.size;
}

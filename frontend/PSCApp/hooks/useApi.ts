import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, ApiError, getAccessToken } from '../services/api/client';
import { cacheApiResponse, getCachedApiResponse } from '../services/storage';
import { isOnline } from './useNetwork';

type Status = 'idle' | 'loading' | 'success' | 'error';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface State<T> {
  data: T | null;
  error: string | null;
  status: Status;
  /** True when data was served from offline cache */
  isOfflineData: boolean;
}

interface UseApiOptions {
  method?: HttpMethod;
  /**
   * Cache TTL in ms for GET requests. Defaults to 5 minutes.
   * Set to 0 to disable caching for this endpoint.
   */
  cacheTtl?: number;
}

// Interface for paginated response from Django REST Framework
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
}

// Helper to check if response is paginated
function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'results' in response &&
    'count' in response
  );
}

/**
 * Hook for making API requests with automatic MMKV caching.
 *
 * GET requests are cached in MMKV. When offline:
 * - Returns cached data (with `isOfflineData: true`) if available
 * - Returns error if no cache exists
 *
 * When online:
 * - Fetches fresh data and updates cache
 * - On network error, falls back to stale cache
 *
 * @param endpoint - The API endpoint
 * @param lazy - If true, does not execute on mount
 * @param options - Optional configuration (e.g., { method: 'POST', cacheTtl: 60000 })
 */
export const useApi = <T>(endpoint: string, lazy = false, options?: UseApiOptions) => {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    status: 'idle',
    isOfflineData: false,
  });

  // Track whether this is a cacheable GET request
  const isCacheableRef = useRef(true);

  const execute = useCallback(
    async (body?: unknown) => {
      if (!endpoint) {
        const errorMsg = 'No endpoint provided to useApi hook.';
        setState({ data: null, error: errorMsg, status: 'error', isOfflineData: false });
        return Promise.reject(errorMsg);
      }

      const method = options?.method ?? (body ? 'POST' : 'GET');
      const isCacheable = method === 'GET' && (options?.cacheTtl ?? 5 * 60 * 1000) > 0;
      isCacheableRef.current = isCacheable;

      // If offline and this is a GET, try cache immediately
      if (!isOnline() && isCacheable) {
        const cached = getCachedApiResponse<T>(endpoint, true); // ignoreExpiry for offline
        if (cached !== null) {
          setState({ data: cached, error: null, status: 'success', isOfflineData: true });
          return cached;
        }
      }

      setState(prev => ({ ...prev, error: null, status: 'loading', isOfflineData: false }));

      try {
        const token = getAccessToken();
        const response = await apiRequest<T | PaginatedResponse<T>>(endpoint, {
          body,
          token,
          method,
        });

        // Handle paginated responses - extract results array
        let data: T;
        if (isPaginatedResponse<T>(response)) {
          data = response.results;
        } else {
          data = response as T;
        }

        // Cache successful GET responses
        if (isCacheable) {
          cacheApiResponse(endpoint, data, options?.cacheTtl);
        }

        setState({ data, error: null, status: 'success', isOfflineData: false });
        return data;
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred.';

        // On network error for GET, fall back to stale cache
        if (isCacheable) {
          const staleCache = getCachedApiResponse<T>(endpoint, true);
          if (staleCache !== null) {
            setState({ data: staleCache, error: null, status: 'success', isOfflineData: true });
            return staleCache;
          }
        }

        setState({ data: null, error: errorMessage, status: 'error', isOfflineData: false });
        return Promise.reject(errorMessage);
      }
    },
    [endpoint, options?.method, options?.cacheTtl],
  );

  useEffect(() => {
    if (!lazy && endpoint) {
      execute();
    }
  }, [execute, lazy, endpoint]);

  return { ...state, execute, refetch: execute };
};

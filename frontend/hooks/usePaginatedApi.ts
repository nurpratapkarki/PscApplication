
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, ApiError, getAccessToken } from '../services/api/client';
import { cacheApiResponse, getCachedApiResponse } from '../services/storage';
import { isOnline } from './useNetwork';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

interface State<T> {
  data: T[] | null;
  count: number;
  next: string | null;
  previous: string | null;
  error: string | null;
  status: Status;
  /** True when data was served from offline cache */
  isOfflineData: boolean;
}

/** Cache TTL for paginated responses (5 minutes) */
const PAGINATED_CACHE_TTL = 5 * 60 * 1000;

export const usePaginatedApi = <T>(endpoint: string, lazy = false) => {
  const [state, setState] = useState<State<T>>({
    data: null,
    count: 0,
    next: null,
    previous: null,
    error: null,
    status: 'idle',
    isOfflineData: false,
  });

  const lastCacheKey = useRef('');

  const execute = useCallback(
    async (queryParams = '') => {
      if (!endpoint) {
        setState({ data: null, count: 0, next: null, previous: null, error: 'No endpoint provided', status: 'error', isOfflineData: false });
        return Promise.reject('No endpoint provided');
      }

      const cacheKey = `paginated:${endpoint}${queryParams}`;
      lastCacheKey.current = cacheKey;

      // If offline, try cache immediately
      if (!isOnline()) {
        const cached = getCachedApiResponse<PaginatedResponse<T>>(cacheKey, true);
        if (cached !== null) {
          setState({
            data: cached.results ?? (cached as unknown as T[]),
            count: cached.count ?? 0,
            next: null, // Don't allow loadMore from cache
            previous: null,
            error: null,
            status: 'success',
            isOfflineData: true,
          });
          return cached;
        }
      }

      setState(prev => ({ ...prev, error: null, status: 'loading', isOfflineData: false }));
      try {
        const url = `${endpoint}${queryParams}`;
        const token = getAccessToken();
        const response = await apiRequest<PaginatedResponse<T>>(url, { token });

        // Cache the full paginated response
        cacheApiResponse(cacheKey, response, PAGINATED_CACHE_TTL);

        setState({
          data: response.results,
          count: response.count,
          next: response.next,
          previous: response.previous,
          error: null,
          status: 'success',
          isOfflineData: false,
        });
        return response;
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred.';

        // On network error, fall back to stale cache
        const staleCache = getCachedApiResponse<PaginatedResponse<T>>(cacheKey, true);
        if (staleCache !== null) {
          setState({
            data: staleCache.results ?? (staleCache as unknown as T[]),
            count: staleCache.count ?? 0,
            next: null,
            previous: null,
            error: null,
            status: 'success',
            isOfflineData: true,
          });
          return staleCache;
        }

        setState({ data: null, count: 0, next: null, previous: null, error: errorMessage, status: 'error', isOfflineData: false });
        return Promise.reject(errorMessage);
      }
    },
    [endpoint],
  );

  const loadMore = useCallback(async () => {
    if (!state.next) return;

    try {
      const token = getAccessToken();
      const response = await apiRequest<PaginatedResponse<T>>(state.next, { token });
      const mergedData = [...(state.data || []), ...response.results];

      setState(prev => ({
        ...prev,
        data: mergedData,
        next: response.next,
        previous: response.previous,
      }));

      // Update cache with accumulated data
      if (lastCacheKey.current) {
        cacheApiResponse(lastCacheKey.current, {
          count: state.count,
          next: response.next,
          previous: response.previous,
          results: mergedData,
        }, PAGINATED_CACHE_TTL);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
      setState(prev => ({ ...prev, error: errorMessage }));
      return Promise.reject(errorMessage);
    }
  }, [state.next, state.data, state.count]);

  useEffect(() => {
    if (!lazy && endpoint) {
      execute();
    }
  }, [execute, lazy, endpoint]);

  return {
    ...state,
    execute,
    refetch: execute,
    loadMore,
    hasMore: !!state.next,
  };
};

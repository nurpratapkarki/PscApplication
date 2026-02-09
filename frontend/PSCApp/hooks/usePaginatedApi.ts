
import { useState, useEffect, useCallback } from 'react';
import { apiRequest, ApiError, getAccessToken } from '../services/api/client';

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
}

export const usePaginatedApi = <T>(endpoint: string, lazy = false) => {
  const [state, setState] = useState<State<T>>({
    data: null,
    count: 0,
    next: null,
    previous: null,
    error: null,
    status: 'idle',
  });

  const execute = useCallback(
    async (queryParams = '') => {
      if (!endpoint) {
        setState({ data: null, count: 0, next: null, previous: null, error: 'No endpoint provided', status: 'error' });
        return Promise.reject('No endpoint provided');
      }
      
      setState(prev => ({ ...prev, error: null, status: 'loading' }));
      try {
        const url = `${endpoint}${queryParams}`;
        const token = getAccessToken();
        const response = await apiRequest<PaginatedResponse<T>>(url, { token });
        setState({ 
          data: response.results, 
          count: response.count, 
          next: response.next,
          previous: response.previous,
          error: null, 
          status: 'success' 
        });
        return response;
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
        setState({ data: null, count: 0, next: null, previous: null, error: errorMessage, status: 'error' });
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
      setState(prev => ({
        ...prev,
        data: [...(prev.data || []), ...response.results],
        next: response.next,
        previous: response.previous,
      }));
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
      setState(prev => ({ ...prev, error: errorMessage }));
      return Promise.reject(errorMessage);
    }
  }, [state.next]);

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

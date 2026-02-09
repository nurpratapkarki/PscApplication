import { useState, useEffect, useCallback } from 'react';
import { apiRequest, ApiError, getAccessToken } from '../services/api/client';

type Status = 'idle' | 'loading' | 'success' | 'error';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface State<T> {
  data: T | null;
  error: string | null;
  status: Status;
}

interface UseApiOptions {
  method?: HttpMethod;
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
 * Hook for making API requests.
 * @param endpoint - The API endpoint
 * @param lazy - If true, does not execute on mount
 * @param options - Optional configuration (e.g., { method: 'POST' })
 */
export const useApi = <T>(endpoint: string, lazy = false, options?: UseApiOptions) => {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    status: 'idle',
  });

  const execute = useCallback(
    async (body?: unknown) => {
      if (!endpoint) {
        const errorMsg = 'No endpoint provided to useApi hook.';
        setState({ data: null, error: errorMsg, status: 'error' });
        return Promise.reject(errorMsg);
      }

      setState({ data: null, error: null, status: 'loading' });
      try {
        const token = getAccessToken();
        // Use explicit method from options, or default based on body presence
        const method = options?.method ?? (body ? 'POST' : 'GET');
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

        setState({ data, error: null, status: 'success' });
        return data;
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
        setState({ data: null, error: errorMessage, status: 'error' });
        return Promise.reject(errorMessage);
      }
    },
    [endpoint, options?.method],
  );

  useEffect(() => {
    if (!lazy && endpoint) {
      execute();
    }
  }, [execute, lazy, endpoint]);

  return { ...state, execute, refetch: execute };
};

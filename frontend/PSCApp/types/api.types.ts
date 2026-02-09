// Generic API response helpers

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

// Default DRF-style paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Response Wrapper (matches README)
export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  data?: T;
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Common Timestamps
export interface Timestamps {
  created_at: string; // ISO 8601 datetime
  updated_at?: string; // ISO 8601 datetime
}

export type ListResponse<T> = T[];

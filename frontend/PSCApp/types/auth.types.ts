import type { UserProfile } from "./user.types";

// Authentication and session-related types

// JWT Token Response (matches README)
export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
}

export interface AuthUser {
  user: UserProfile;
  tokens: TokenResponse;
}

// Login Request (matches README)
export interface LoginRequest {
  email: string;
  password: string;
}

// Google OAuth Request (matches README)
export interface GoogleLoginRequest {
  access_token?: string;
  id_token?: string;
}

// Registration Request (matches README)
export interface RegistrationRequest {
  email: string;
  password1: string;
  password2: string;
  full_name?: string;
}

// Token Refresh Request (matches README)
export interface TokenRefreshRequest {
  refresh: string;
}

// Token Refresh Response
export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

// Alias for compatibility
export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

// User Session (matches README)
export interface UserSession {
  user: UserProfile;
  tokens: TokenResponse;
}

// User object returned from /api/auth/user/ endpoint
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

export interface LoginResponse extends AuthUser {}

// Dev login response mirrors src.api.auth.DevLoginView
export interface DevLoginUser {
  pk: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface DevLoginResponse {
  user: DevLoginUser;
  access: string;
  refresh: string;
}

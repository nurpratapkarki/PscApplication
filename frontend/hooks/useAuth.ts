import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  clearTokens
} from '../services/api/client';
import {
  login as apiLogin,
  googleLogin as apiGoogleLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../services/api/auth';
import { getCurrentUserProfile } from '../services/api/profile';
import type {
  LoginRequest,
  GoogleLoginRequest,
  RegistrationRequest,
  TokenResponse
} from '../types/auth.types';

export function useAuth() {
  const [error, setError] = useState<string | null>(null);

  // Get state from Zustand store
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  // Get actions from store
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getCurrentUserProfile(accessToken);
      setUser(profile);
      setLoading(false);
    } catch {
      clearAuth();
    }
  }, [accessToken, setLoading, setUser, clearAuth]);

  // Login with email and password
  const login = useCallback(async (credentials: LoginRequest): Promise<TokenResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiLogin(credentials);
      const profile = await getCurrentUserProfile(response.access);
      setAuth(profile, response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [setAuth, setLoading]);

  // Login with Google OAuth
  const googleLogin = useCallback(async (token: GoogleLoginRequest): Promise<TokenResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGoogleLogin(token);
      const profile = await getCurrentUserProfile(response.access);
      setAuth(profile, response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [setAuth, setLoading]);

  // Register and auto-login
  const register = useCallback(async (data: RegistrationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegister(data);
      const profile = await getCurrentUserProfile(response.access);
      setAuth(profile, response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [setAuth, setLoading]);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } catch {
      // Ignore logout errors, just clear local state
    }
    clearTokens();
  }, []);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (!accessToken) return;

    try {
      const profile = await getCurrentUserProfile(accessToken);
      setUser(profile);
    } catch {
      // Ignore refresh errors
    }
  }, [accessToken, setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    error,
    login,
    googleLogin,
    register,
    logout,
    refreshUser,
    checkAuth,
  };
}

import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, setTokens, clearTokens } from "./client";

import type {
	DevLoginResponse,
	RefreshTokenRequest,
	RefreshTokenResponse,
	LoginRequest,
	TokenResponse,
	GoogleLoginRequest,
	RegistrationRequest,
} from "../../types/auth.types";
import type { UserProfile } from "../../types/user.types";

// Authentication-related API helpers

// Email/password login
export async function login(credentials: LoginRequest): Promise<TokenResponse> {
	const response = await apiRequest<TokenResponse>(API_ENDPOINTS.auth.login, {
		method: "POST",
		body: credentials,
	});
	if (response.access) {
		setTokens(response.access, response.refresh);
	}
	return response;
}

// Google OAuth login
export async function googleLogin(token: GoogleLoginRequest): Promise<TokenResponse> {
	const response = await apiRequest<TokenResponse>(API_ENDPOINTS.auth.googleLogin, {
		method: "POST",
		body: token,
	});
	if (response.access) {
		setTokens(response.access, response.refresh);
	}
	return response;
}

// Registration
export async function register(data: RegistrationRequest): Promise<UserProfile> {
	return apiRequest<UserProfile>(API_ENDPOINTS.auth.registration, {
		method: "POST",
		body: data,
	});
}

// Dev login (for development only)
export async function devLogin(email: string, password?: string): Promise<DevLoginResponse> {
	const response = await apiRequest<DevLoginResponse>(API_ENDPOINTS.auth.devLogin, {
		method: "POST",
		body: { email, password },
	});
	if (response.access) {
		setTokens(response.access, response.refresh);
	}
	return response;
}

// Regular login for users who signed up with username/password
export async function regularLogin(email: string, password: string): Promise<DevLoginResponse> {
	const response = await apiRequest<DevLoginResponse>(API_ENDPOINTS.auth.regularLogin, {
		method: "POST",
		body: { email, password },
	});
	if (response.access) {
		setTokens(response.access, response.refresh);
	}
	return response;
}

// Direct JWT token obtain using SimpleJWT's TokenObtainPairView
export async function obtainTokenPair(
	credentials: { username?: string; email?: string; password: string },
): Promise<RefreshTokenResponse> {
	const response = await apiRequest<RefreshTokenResponse>(
		API_ENDPOINTS.auth.tokenObtainPair,
		{
			method: "POST",
			body: credentials,
		},
	);
	if (response.access) {
		setTokens(response.access, response.refresh);
	}
	return response;
}

export async function refreshToken(
	payload: RefreshTokenRequest,
): Promise<RefreshTokenResponse> {
	const response = await apiRequest<RefreshTokenResponse>(API_ENDPOINTS.auth.tokenRefresh, {
		method: "POST",
		body: payload,
	});
	if (response.access) {
		setTokens(response.access, response.refresh);
	}
	return response;
}

export async function blacklistToken(refresh: string): Promise<void> {
	await apiRequest<void>(API_ENDPOINTS.auth.tokenBlacklist, {
		method: "POST",
		body: { refresh },
	});
	clearTokens();
}

// dj-rest-auth logout endpoint. Works for both session and JWT setups
export async function logout(): Promise<void> {
	await apiRequest<void>(API_ENDPOINTS.auth.logout, {
		method: "POST",
	});
	clearTokens();
}

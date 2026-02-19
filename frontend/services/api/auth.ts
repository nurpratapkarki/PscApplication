import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, setTokens, clearTokens } from "./client";

import type {
	RefreshTokenRequest,
	RefreshTokenResponse,
	LoginRequest,
	TokenResponse,
	GoogleLoginRequest,
	RegistrationRequest,
} from "../../types/auth.types";

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

// Registration - dj-rest-auth returns tokens with USE_JWT=True
export async function register(data: RegistrationRequest): Promise<TokenResponse> {
	const response = await apiRequest<TokenResponse>(API_ENDPOINTS.auth.registration, {
		method: "POST",
		body: data,
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

// Forgot password - request OTP
export async function forgotPassword(email: string): Promise<{ detail: string; otp?: string }> {
	return apiRequest<{ detail: string; otp?: string }>(API_ENDPOINTS.auth.forgotPassword, {
		method: "POST",
		body: { email },
	});
}

// Verify OTP for password reset
export async function verifyOtp(email: string, otp: string): Promise<{ detail: string; reset_token: string }> {
	return apiRequest<{ detail: string; reset_token: string }>(API_ENDPOINTS.auth.verifyOtp, {
		method: "POST",
		body: { email, otp },
	});
}

// Reset password with token
export async function resetPassword(payload: {
	email: string;
	reset_token: string;
	new_password1: string;
	new_password2: string;
}): Promise<{ detail: string }> {
	return apiRequest<{ detail: string }>(API_ENDPOINTS.auth.resetPassword, {
		method: "POST",
		body: payload,
	});
}

// Change password via dj-rest-auth
export async function changePassword(payload: {
	old_password: string;
	new_password1: string;
	new_password2: string;
}): Promise<{ detail: string }> {
	return apiRequest<{ detail: string }>(API_ENDPOINTS.auth.passwordChange, {
		method: "POST",
		body: payload,
	});
}

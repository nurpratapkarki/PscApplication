import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type {
	MockTest,
	MockTestDetail,
	UserAttempt,
	UserAnswer,
	UserAnswerCreatePayload,
	UserAnswerSubmit,
	StartAttemptRequest,
	TimeConfiguration,
} from "../../types/test.types";

// ---- Mock tests ----

export interface MockTestListParams {
	page?: number;
	branch?: number;
	sub_branch?: number;
	test_type?: string;
	is_public?: boolean;
	search?: string;
}

export async function listMockTests(
	params: MockTestListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<MockTest>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<MockTest>>(
		`${API_ENDPOINTS.mockTests.list}${query}`,
		{ token: token ?? undefined },
	);
}

export async function getMockTest(
	id: number,
	token?: string | null,
): Promise<MockTest> {
	return apiRequest<MockTest>(API_ENDPOINTS.mockTests.detail(id), {
		token: token ?? undefined,
	});
}

// Get mock test with full question details
export async function getMockTestDetail(
	id: number,
	token?: string | null,
): Promise<MockTestDetail> {
	return apiRequest<MockTestDetail>(API_ENDPOINTS.mockTests.detail(id), {
		token: token ?? undefined,
	});
}

export interface GenerateMockTestPayload {
	title_en?: string;
	branch_id: number;
	category_distribution: Record<string, number>;
}

export async function generateMockTest(
	payload: GenerateMockTestPayload,
	token?: string | null,
): Promise<MockTest> {
	return apiRequest<MockTest>(API_ENDPOINTS.mockTests.generate, {
		method: "POST",
		body: payload,
		token: token ?? undefined,
	});
}

// ---- Attempts ----

export interface AttemptListParams {
	page?: number;
	status?: string;
	mode?: string;
	mock_test?: number;
}

export async function listAttempts(
	params: AttemptListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<UserAttempt>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<UserAttempt>>(
		`${API_ENDPOINTS.attempts.list}${query}`,
		{ token: token ?? undefined },
	);
}

// List current user's attempts
export async function listMyAttempts(
	params: AttemptListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<UserAttempt>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<UserAttempt>>(
		`${API_ENDPOINTS.attempts.myAttempts}${query}`,
		{ token: token ?? undefined },
	);
}

export async function getAttempt(
	id: number,
	token?: string | null,
): Promise<UserAttempt> {
	return apiRequest<UserAttempt>(API_ENDPOINTS.attempts.detail(id), {
		token: token ?? undefined,
	});
}

export async function startAttempt(
	payload: StartAttemptRequest,
	token?: string | null,
): Promise<UserAttempt> {
	return apiRequest<UserAttempt>(API_ENDPOINTS.attempts.start, {
		method: "POST",
		body: payload,
		token: token ?? undefined,
	});
}

export async function submitAttempt(
	id: number,
	token?: string | null,
): Promise<UserAttempt> {
	return apiRequest<UserAttempt>(API_ENDPOINTS.attempts.submit(id), {
		method: "POST",
		token: token ?? undefined,
	});
}

export async function getAttemptResults(
	id: number,
	token?: string | null,
): Promise<UserAttempt> {
	return apiRequest<UserAttempt>(API_ENDPOINTS.attempts.results(id), {
		method: "GET",
		token: token ?? undefined,
	});
}

// ---- Answers ----

export async function createUserAnswer(
	payload: UserAnswerCreatePayload | UserAnswerSubmit,
	token?: string | null,
): Promise<UserAnswer> {
	return apiRequest<UserAnswer>(API_ENDPOINTS.answers.list, {
		method: "POST",
		body: payload,
		token: token ?? undefined,
	});
}

export async function updateUserAnswer(
	id: number,
	payload: Partial<UserAnswerCreatePayload>,
	token?: string | null,
): Promise<UserAnswer> {
	return apiRequest<UserAnswer>(API_ENDPOINTS.answers.detail(id), {
		method: "PATCH",
		body: payload,
		token: token ?? undefined,
	});
}

// ---- Time configurations ----

export interface TimeConfigListParams {
	page?: number;
	branch?: number;
	sub_branch?: number;
	category?: number;
}

export async function listTimeConfigurations(
	params: TimeConfigListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<TimeConfiguration>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<TimeConfiguration>>(
		`${API_ENDPOINTS.timeConfigs.list}${query}`,
		{ token: token ?? undefined },
	);
}

import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type {
	PlatformStats,
	StudyCollection,
	StudyCollectionCreate,
} from "../../types/contribution.types";
import type { UserStatistics, UserProgress } from "../../types/user.types";

export interface UserProgressListParams {
	page?: number;
	category?: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
	return apiRequest<PlatformStats>(API_ENDPOINTS.stats.platform);
}

export async function getMyStatistics(
	token?: string | null,
): Promise<UserStatistics> {
	return apiRequest<UserStatistics>(API_ENDPOINTS.stats.statisticsMe, {
		token: token ?? undefined,
	});
}

export async function listUserProgress(
	params: UserProgressListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<UserProgress>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<UserProgress>>(
		`${API_ENDPOINTS.stats.progress}${query}`,
		{ token: token ?? undefined },
	);
}

// ---- Study Collections ----

export interface CreateCollectionPayload {
	name: string;
	description?: string | null;
	is_private?: boolean;
	icon?: string | null;
	color_code?: string | null;
}

export type UpdateCollectionPayload = Partial<CreateCollectionPayload>;

export async function listCollections(
	token?: string | null,
): Promise<PaginatedResponse<StudyCollection>> {
	return apiRequest<PaginatedResponse<StudyCollection>>(
		API_ENDPOINTS.stats.collections,
		{ token: token ?? undefined },
	);
}

export async function createCollection(
	payload: CreateCollectionPayload,
	token?: string | null,
): Promise<StudyCollection> {
	return apiRequest<StudyCollection>(API_ENDPOINTS.stats.collections, {
		method: "POST",
		body: payload,
		token: token ?? undefined,
	});
}

export async function updateCollection(
	id: number,
	payload: UpdateCollectionPayload,
	token?: string | null,
): Promise<StudyCollection> {
	return apiRequest<StudyCollection>(
		`${API_ENDPOINTS.stats.collections}${id}/`,
		{
			method: "PATCH",
			body: payload,
			token: token ?? undefined,
		},
	);
}

export async function deleteCollection(
	id: number,
	token?: string | null,
): Promise<void> {
	await apiRequest<void>(`${API_ENDPOINTS.stats.collections}${id}/`, {
		method: "DELETE",
		token: token ?? undefined,
	});
}

export async function addQuestionsToCollection(
	id: number,
	questionIds: number[],
	token?: string | null,
): Promise<void> {
	await apiRequest<void>(
		`${API_ENDPOINTS.stats.collections}${id}/add_questions/`,
		{
			method: "POST",
			body: { question_ids: questionIds },
			token: token ?? undefined,
		},
	);
}

export async function removeQuestionsFromCollection(
	id: number,
	questionIds: number[],
	token?: string | null,
): Promise<void> {
	await apiRequest<void>(
		`${API_ENDPOINTS.stats.collections}${id}/remove_questions/`,
		{
			method: "POST",
			body: { question_ids: questionIds },
			token: token ?? undefined,
		},
	);
}

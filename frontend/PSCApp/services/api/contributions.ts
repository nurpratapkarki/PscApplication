import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type {
	Contribution,
	DailyActivity,
} from "../../types/contribution.types";

export interface ContributionListParams {
	page?: number;
	status?: string;
	contribution_year?: number;
	contribution_month?: number;
}

export async function listContributions(
	params: ContributionListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<Contribution>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<Contribution>>(
		`${API_ENDPOINTS.analytics.contributions}${query}`,
		{ token: token ?? undefined },
	);
}

// List current user's contributions
export async function listMyContributions(
	params: ContributionListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<Contribution>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<Contribution>>(
		`${API_ENDPOINTS.analytics.myContributions}${query}`,
		{ token: token ?? undefined },
	);
}

// Get a single contribution
export async function getContribution(
	id: number,
	token?: string | null,
): Promise<Contribution> {
	return apiRequest<Contribution>(
		`${API_ENDPOINTS.analytics.contributions}${id}/`,
		{ token: token ?? undefined },
	);
}

// Admin-only detailed activity stats. Still useful for dashboards.
export interface DailyActivityListParams {
	page?: number;
}

export async function listDailyActivity(
	params: DailyActivityListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<DailyActivity>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<DailyActivity>>(
		`${API_ENDPOINTS.analytics.dailyActivity}${query}`,
		{ token: token ?? undefined },
	);
}

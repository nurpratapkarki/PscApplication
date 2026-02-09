import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type {
	LeaderboardEntry,
	LeaderboardTimePeriod,
} from "../../types/contribution.types";

export interface LeaderboardListParams {
	page?: number;
	time_period?: LeaderboardTimePeriod;
	branch?: number;
	sub_branch?: number;
}

export async function listLeaderboard(
	params: LeaderboardListParams = {},
): Promise<PaginatedResponse<LeaderboardEntry>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<LeaderboardEntry>>(
		`${API_ENDPOINTS.stats.leaderboard}${query}`,
	);
}

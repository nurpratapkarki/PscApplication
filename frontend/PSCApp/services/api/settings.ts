import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type { AppSetting } from "../../types/contribution.types";

export interface AppSettingsListParams {
	page?: number;
}

export async function listAppSettings(
	params: AppSettingsListParams = {},
): Promise<PaginatedResponse<AppSetting>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<AppSetting>>(
		`${API_ENDPOINTS.settings.list}${query}`,
	);
}

export async function getAppSetting(
	key: string,
): Promise<AppSetting> {
	return apiRequest<AppSetting>(API_ENDPOINTS.settings.detail(key));
}

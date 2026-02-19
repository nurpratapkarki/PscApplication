import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type { Notification } from "../../types/contribution.types";

export interface NotificationListParams {
	page?: number;
	is_read?: boolean;
}

export async function listNotifications(
	params: NotificationListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<Notification>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<Notification>>(
		`${API_ENDPOINTS.notifications.list}${query}`,
		{ token: token ?? undefined },
	);
}

export async function getNotification(
	id: number,
	token?: string | null,
): Promise<Notification> {
	return apiRequest<Notification>(API_ENDPOINTS.notifications.detail(id), {
		token: token ?? undefined,
	});
}

export async function markNotificationRead(
	id: number,
	token?: string | null,
): Promise<void> {
	await apiRequest<void>(API_ENDPOINTS.notifications.markRead(id), {
		method: "PATCH",
		token: token ?? undefined,
	});
}

export async function markAllNotificationsRead(
	token?: string | null,
): Promise<void> {
	await apiRequest<void>(API_ENDPOINTS.notifications.markAllRead, {
		method: "POST",
		token: token ?? undefined,
	});
}

export interface UnreadCountResponse {
	unread_count: number;
}

export async function getUnreadNotificationCount(
	token?: string | null,
): Promise<UnreadCountResponse> {
	return apiRequest<UnreadCountResponse>(
		API_ENDPOINTS.notifications.unreadCount,
		{ token: token ?? undefined },
	);
}

export async function registerPushToken(
	pushToken: string,
	token?: string | null,
): Promise<{ status: string; token: string }> {
	return apiRequest<{ status: string; token: string }>(
		API_ENDPOINTS.notifications.registerPushToken,
		{
			method: "POST",
			token: token ?? undefined,
			body: JSON.stringify({ token: pushToken }),
		},
	);
}

export async function unregisterPushToken(
	token?: string | null,
): Promise<{ status: string }> {
	return apiRequest<{ status: string }>(
		API_ENDPOINTS.notifications.unregisterPushToken,
		{
			method: "POST",
			token: token ?? undefined,
		},
	);
}

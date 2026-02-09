import type { UserProfile, UserProfileUpdate } from "../../types/user.types";
import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, uploadFile } from "./client";

/**
 * Fetch the currently authenticated user's profile.
 *
 * Supply a JWT access token if you're using header-based auth.
 * If your app relies on cookies, omit the token and ensure
 * the backend is configured for cookie-based authentication.
 */
export async function getCurrentUserProfile(
  token?: string | null,
): Promise<UserProfile> {
  return apiRequest<UserProfile>(API_ENDPOINTS.auth.user, {
    method: "GET",
    token: token ?? undefined,
  });
}

/**
 * Update the current user's profile.
 */
export async function updateUserProfile(
  updates: UserProfileUpdate,
  token?: string | null,
): Promise<UserProfile> {
  // If there's a profile picture file, we need to use FormData
  if (updates.profile_picture instanceof File) {
    const formData = new FormData();
    
    // Add all non-file fields
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "profile_picture" && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add the file
    formData.append("profile_picture", updates.profile_picture);
    
    return uploadFile<UserProfile>(API_ENDPOINTS.auth.user, formData, token);
  }
  
  // Regular JSON update
  return apiRequest<UserProfile>(API_ENDPOINTS.auth.user, {
    method: "PATCH",
    body: updates,
    token: token ?? undefined,
  });
}

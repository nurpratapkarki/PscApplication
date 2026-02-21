import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery, uploadFile } from "./client";
import { validateUploadFile } from "../../utils/fileValidation";

import type { PaginatedResponse } from "../../types/api.types";
import type { Branch, SubBranch, Category } from "../../types/category.types";
import type {
	Question,
	QuestionReport,
	QuestionCreatePayload,
	QuestionReportCreatePayload,
} from "../../types/question.types";

// ---- Branches & Categories ----

export interface BranchListParams {
	page?: number;
}

export interface SubBranchListParams {
	branch?: number;
	page?: number;
}

export interface CategoryListParams {
	scope_type?: string;
	target_branch?: number;
	target_sub_branch?: number;
	search?: string;
	page?: number;
}

export async function listBranches(
	params: BranchListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<Branch>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<Branch>>(
		`${API_ENDPOINTS.branches.list}${query}`,
		{ token: token ?? undefined },
	);
}

export async function getBranch(
	id: number,
	token?: string | null,
): Promise<Branch> {
	return apiRequest<Branch>(`${API_ENDPOINTS.branches.list}${id}/`, {
		token: token ?? undefined,
	});
}

export async function listSubBranches(
	params: SubBranchListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<SubBranch>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<SubBranch>>(
		`${API_ENDPOINTS.branches.subBranches}${query}`,
		{ token: token ?? undefined },
	);
}

export async function listCategories(
	params: CategoryListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<Category>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<Category>>(
		`${API_ENDPOINTS.branches.categories}${query}`,
		{ token: token ?? undefined },
	);
}

export async function getCategory(
	id: number,
	token?: string | null,
): Promise<Category> {
	return apiRequest<Category>(`${API_ENDPOINTS.branches.categories}${id}/`, {
		token: token ?? undefined,
	});
}

// ---- Questions ----

export interface QuestionListParams {
	page?: number;
	category?: number;
	difficulty_level?: string;
	question_type?: string;
	search?: string;
	ordering?: string;
}

export async function listQuestions(
	params: QuestionListParams = {},
	token?: string | null,
): Promise<PaginatedResponse<Question>> {
	const query = buildQuery(params);
	return apiRequest<PaginatedResponse<Question>>(
		`${API_ENDPOINTS.questions.list}${query}`,
		{ token: token ?? undefined },
	);
}

export async function getQuestion(
	id: number,
	token?: string | null,
): Promise<Question> {
	return apiRequest<Question>(`${API_ENDPOINTS.questions.list}${id}/`, {
		token: token ?? undefined,
	});
}

export async function createQuestion(
	payload: QuestionCreatePayload,
	token?: string | null,
): Promise<Question> {
	// If there's an image file, use FormData
	if (payload.image instanceof File) {
		const formData = new FormData();
		
		// Add all non-file fields
		formData.append("question_text_en", payload.question_text_en);
		formData.append("question_text_np", payload.question_text_np);
		formData.append("category", String(payload.category));
		formData.append("explanation_en", payload.explanation_en);
		formData.append("explanation_np", payload.explanation_np);
		formData.append("consent_given", String(payload.consent_given));
		
		if (payload.difficulty_level) {
			formData.append("difficulty_level", payload.difficulty_level);
		}
		if (payload.question_type) {
			formData.append("question_type", payload.question_type);
		}
		if (payload.source_reference) {
			formData.append("source_reference", payload.source_reference);
		}
		
		// Add answers as JSON
		formData.append("answers", JSON.stringify(payload.answers));
		
		// Add the image file
		formData.append("image", payload.image);
		
		return uploadFile<Question>(API_ENDPOINTS.questions.list, formData, token);
	}
	
	return apiRequest<Question>(API_ENDPOINTS.questions.list, {
		method: "POST",
		body: payload,
		token: token ?? undefined,
	});
}

export async function updateQuestion(
	id: number,
	payload: Partial<QuestionCreatePayload>,
	token?: string | null,
): Promise<Question> {
	return apiRequest<Question>(`${API_ENDPOINTS.questions.list}${id}/`, {
		method: "PATCH",
		body: payload,
		token: token ?? undefined,
	});
}

export async function deleteQuestion(
	id: number,
	token?: string | null,
): Promise<void> {
	await apiRequest<void>(`${API_ENDPOINTS.questions.list}${id}/`, {
		method: "DELETE",
		token: token ?? undefined,
	});
}

// ---- Bulk Upload (now used for note contributions) ----

export interface BulkUploadResponse {
	success: boolean;
	uploaded_count: number;
	failed_count: number;
	errors?: string[];
	note_id?: number;
	detail?: string;
}

export interface BulkUploadProgress {
	total: number;
	processed: number;
	success: number;
	failed: number;
}

/**
 * Upload a note file for review via the bulk-upload endpoint.
 * Allowed files: PDF (.pdf), Word (.doc, .docx), max 10MB.
 * 
 * @param file - The note file to upload
 * @param categoryId - The category to assign the note to
 * @param token - Optional auth token
 */
export async function bulkUploadQuestions(
	file: File,
	categoryId: number,
	token?: string | null,
): Promise<BulkUploadResponse> {
	// Validate file type using shared utility
	const validation = validateUploadFile({
		name: file.name,
		type: file.type,
		size: file.size,
	});
	
	if (!validation.isValid) {
		throw new Error(validation.error);
	}
	
	const formData = new FormData();
	formData.append("file", file);
	formData.append("category", String(categoryId));
	
	return uploadFile<BulkUploadResponse>(
		`${API_ENDPOINTS.questions.list}bulk-upload/`,
		formData,
		token,
	);
}

// ---- Question Reports ----

export async function listReports(
	token?: string | null,
): Promise<PaginatedResponse<QuestionReport>> {
	return apiRequest<PaginatedResponse<QuestionReport>>(
		API_ENDPOINTS.questions.reports,
		{ token: token ?? undefined },
	);
}

export async function getReport(
	id: number,
	token?: string | null,
): Promise<QuestionReport> {
	return apiRequest<QuestionReport>(`${API_ENDPOINTS.questions.reports}${id}/`, {
		token: token ?? undefined,
	});
}

export async function reportQuestion(
	payload: QuestionReportCreatePayload,
	token?: string | null,
): Promise<QuestionReport> {
	return apiRequest<QuestionReport>(API_ENDPOINTS.questions.reports, {
		method: "POST",
		body: payload,
		token: token ?? undefined,
	});
}

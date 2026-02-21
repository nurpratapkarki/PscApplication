import { API_ENDPOINTS } from "../../config/api.config";
import { apiRequest, buildQuery, uploadFile } from "./client";

import type { PaginatedResponse } from "../../types/api.types";
import type {
  Note,
  NoteAccessResponse,
  NoteCreatePayload,
  NoteUploadDocument,
} from "../../types/note.types";

const GOOGLE_DOCS_EMBED_VIEWER_BASE = "https://docs.google.com/gview?embedded=1&url=";

function isReactNativeUploadFile(value: unknown): value is NoteUploadDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "uri" in value &&
    "name" in value
  );
}

export interface NoteListParams {
  page?: number;
  category?: number;
  status?: string;
  ordering?: string;
  search?: string;
}

export async function listNotes(
  params: NoteListParams = {},
  token?: string | null,
): Promise<PaginatedResponse<Note>> {
  const query = buildQuery(params);
  return apiRequest<PaginatedResponse<Note>>(`${API_ENDPOINTS.notes.list}${query}`, {
    token: token ?? undefined,
  });
}

export async function getNote(id: number, token?: string | null): Promise<Note> {
  return apiRequest<Note>(API_ENDPOINTS.notes.detail(id), {
    token: token ?? undefined,
  });
}

export async function createNote(
  payload: NoteCreatePayload,
  token?: string | null,
): Promise<Note> {
  const formData = new FormData();
  formData.append("title_en", payload.title_en);
  formData.append("title_np", payload.title_np || payload.title_en);
  formData.append("description_en", payload.description_en || "");
  formData.append("description_np", payload.description_np || payload.description_en || "");
  formData.append("category", String(payload.category));
  if (isReactNativeUploadFile(payload.document)) {
    const filePart: { uri: string; name: string; type?: string } = {
      uri: payload.document.uri,
      name: payload.document.name,
    };
    if (payload.document.type) {
      filePart.type = payload.document.type;
    }
    formData.append("document", filePart as any);
  } else {
    formData.append("document", payload.document);
  }

  return uploadFile<Note>(API_ENDPOINTS.notes.list, formData, token);
}

export async function requestNoteAccess(
  noteId: number,
  token?: string | null,
): Promise<NoteAccessResponse> {
  return apiRequest<NoteAccessResponse>(API_ENDPOINTS.notes.requestAccess(noteId), {
    method: "POST",
    token: token ?? undefined,
  });
}

// Use Google Docs embedded viewer for Office docs that are not natively
// supported by WebView on mobile.
export function buildInAppNoteViewerUrl(rawViewerUrl: string): string {
  if (!rawViewerUrl) return "";
  return `${GOOGLE_DOCS_EMBED_VIEWER_BASE}${encodeURIComponent(rawViewerUrl)}`;
}

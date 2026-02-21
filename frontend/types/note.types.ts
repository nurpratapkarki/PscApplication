export type NoteStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type NoteDocumentType = "PDF" | "DOC" | "DOCX";
export interface NoteUploadDocument {
  uri: string;
  name: string;
  type?: string | null;
}

export interface Note {
  id: number;
  title_en: string;
  title_np: string;
  description_en: string;
  description_np: string;
  category: number;
  category_name?: string;
  document_type: NoteDocumentType;
  file_name: string;
  file_size: number;
  status: NoteStatus;
  is_public: boolean;
  created_by?: number | null;
  created_by_name?: string;
  review_notes?: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreatePayload {
  title_en: string;
  title_np?: string;
  description_en?: string;
  description_np?: string;
  category: number;
  document: File | NoteUploadDocument;
}

export interface NoteAccessResponse {
  note_id: number;
  viewer_url: string;
  expires_in_seconds: number;
}

// Question, answer and report types aligned with README exactly
// PSCApp/src/api/question_answer/serializers.py

// Difficulty Level (matches README)
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

// Question Type (matches README)
export type QuestionType = "MCQ";

// Question Status (matches README)
export type QuestionStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLIC" | "PRIVATE";

// Answer (matches README)
export interface Answer {
  id: number;
  question?: number;
  answer_text_en: string;
  answer_text_np: string;
  is_correct: boolean;
  display_order: number;
  created_at?: string;
}

// Alias for compatibility
export interface AnswerOption extends Answer {}

// Question (matches README exactly)
export interface Question {
  id: number;
  question_text_en: string;
  question_text_np: string;
  category: number;
  category_name?: string;
  difficulty_level?: DifficultyLevel | null;
  question_type: QuestionType;
  explanation_en: string;
  explanation_np: string;
  image?: string | null;
  status: QuestionStatus;
  created_by?: number | null;
  created_by_name?: string;
  is_public: boolean;
  consent_given: boolean;
  scheduled_public_date?: string | null;
  source_reference?: string | null;
  times_attempted: number;
  times_correct: number;
  reported_count?: number;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
  answers?: Answer[];
}

// Question Create/Update (matches README)
export interface QuestionCreate {
  question_text_en: string;
  question_text_np: string;
  category: number;
  difficulty_level?: DifficultyLevel | null;
  question_type?: QuestionType;
  explanation_en: string;
  explanation_np: string;
  image?: File | null;
  consent_given: boolean;
  source_reference?: string | null;
  answers: AnswerCreate[];
}

// Answer Create (matches README)
export interface AnswerCreate {
  answer_text_en: string;
  answer_text_np: string;
  is_correct: boolean;
  display_order: number;
}

// Alias for compatibility
export interface AnswerCreatePayload extends AnswerCreate {}
export interface QuestionCreatePayload extends QuestionCreate {}

// Question Report Reason (matches README)
export type ReportReason =
  | "INCORRECT_ANSWER"
  | "TYPO"
  | "INAPPROPRIATE"
  | "DUPLICATE"
  | "OTHER";

// Question Report Status (matches README)
export type ReportStatus = "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

// Question Report (matches README)
export interface QuestionReport {
  id: number;
  question: number;
  reported_by?: number | null;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reviewed_by?: number | null;
  admin_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

// Question Report Create (matches README)
export interface QuestionReportCreate {
  question: number;
  reason: ReportReason;
  description: string;
}

// Alias for compatibility
export interface QuestionReportCreatePayload extends QuestionReportCreate {}

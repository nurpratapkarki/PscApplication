// Mock test, attempts and time configuration types (matches README exactly)
// PSCApp/src/api/mocktest/serializers.py
// PSCApp/src/api/attempt_answer/serializers.py
// PSCApp/src/api/time_config/serializers.py

import type { Question } from "./question.types";

// Test Type (matches README)
export type TestType = "OFFICIAL" | "COMMUNITY" | "CUSTOM";

// Mock Test Question (matches README)
export interface MockTestQuestion {
  id: number;
  mock_test?: number;
  question: Question; // Always expanded Question object in the app
  question_order: number;
  marks_allocated: number;
  created_at?: string;
  question_data?: Question; // When expanded
}

// Mock Test (matches README)
export interface MockTest {
  id: number;
  title_en: string;
  title_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  test_type: TestType;
  branch: number;
  branch_name?: string;
  sub_branch?: number | null;
  total_questions: number;
  total_marks?: number;
  duration_minutes?: number | null;
  use_standard_duration: boolean;
  pass_percentage: number;
  created_by?: number | null;
  created_by_name?: string;
  is_public: boolean;
  is_active: boolean;
  attempt_count: number;
  test_questions?: MockTestQuestion[];
  created_at: string;
  updated_at?: string;
}

// Mock Test Detail (with questions) - matches README
export interface MockTestDetail extends MockTest {
  test_questions: MockTestQuestion[];
}

// Attempt Status (matches README)
export type AttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

// Attempt Mode (matches README)
export type AttemptMode = "MOCK_TEST" | "PRACTICE";

// Mock test summary for use in attempt results
export interface MockTestSummary {
  id: number;
  title_en: string;
  title_np?: string;
  pass_percentage: number;
  duration_minutes: number;
  total_questions: number;
}

// User Attempt (matches README)
export interface UserAttempt {
  id: number;
  user: number;
  mock_test?: number | MockTestSummary | null;
  mock_test_title?: string;
  start_time: string;
  end_time?: string | null;
  total_time_taken?: number | null;
  score_obtained: number;
  total_score: number;
  percentage?: number | null;
  status: AttemptStatus;
  mode: AttemptMode;
  user_answers?: UserAnswer[];
  created_at: string;
  updated_at?: string;
}

// User Attempt Create (matches README)
export interface UserAttemptCreate {
  mock_test?: number | null;
  mode: AttemptMode;
}

// User Answer (matches README)
export interface UserAnswer {
  id: number;
  user_attempt: number;
  question: number;
  question_text?: string;
  selected_answer?: number | null;
  selected_answer_text?: string;
  correct_answer_text?: string;
  is_correct: boolean;
  time_taken_seconds?: number | null;
  is_skipped: boolean;
  is_marked_for_review: boolean;
  created_at: string;
  updated_at?: string;
}

// User Answer Submit (matches README)
export interface UserAnswerSubmit {
  user_attempt: number;
  question: number;
  selected_answer?: number | null;
  time_taken_seconds?: number | null;
  is_marked_for_review?: boolean;
}

// Alias for compatibility
export interface UserAnswerCreatePayload extends UserAnswerSubmit {
  is_skipped?: boolean;
}

// Attempt Result (matches README)
export interface AttemptResult {
  attempt: UserAttempt;
  answers: UserAnswer[];
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  accuracy_percentage: number;
}

// Start Attempt Request
export interface StartAttemptRequest {
  mock_test_id?: number;
  mode?: AttemptMode;
}

// Time Configuration (matches README)
export interface TimeConfiguration {
  id: number;
  branch: number;
  sub_branch?: number | null;
  category?: number | null;
  standard_duration_minutes: number;
  questions_count: number;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

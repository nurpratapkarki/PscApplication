# 📱 React Native Mobile App - TypeScript Types & API Reference

This document provides TypeScript type definitions for the PSC App React Native mobile application, based on the Django backend models and API endpoints.

---

## 📋 Table of Contents

- [Base Configuration](#base-configuration)
- [Authentication Types](#authentication-types)
- [User Types](#user-types)
- [Branch & Category Types](#branch--category-types)
- [Question & Answer Types](#question--answer-types)
- [Mock Test Types](#mock-test-types)
- [Attempt & Progress Types](#attempt--progress-types)
- [Analytics Types](#analytics-types)
- [Notification Types](#notification-types)
- [API Endpoints Reference](#api-endpoints-reference)

---

## Base Configuration

```typescript
// Base API URL Configuration
export const API_BASE_URL = "https://your-domain.com/api";

// API Response Wrapper
export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  data?: T;
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Common Timestamps
export interface Timestamps {
  created_at: string; // ISO 8601 datetime
  updated_at?: string; // ISO 8601 datetime
}
```

---

## Authentication Types

```typescript
// JWT Token Response
export interface TokenResponse {
  access: string;
  refresh: string;
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Google OAuth Request
export interface GoogleLoginRequest {
  access_token?: string;
  id_token?: string;
}

// Registration Request
export interface RegistrationRequest {
  email: string;
  password1: string;
  password2: string;
  full_name?: string;
}

// Token Refresh Request
export interface TokenRefreshRequest {
  refresh: string;
}

// User Session
export interface UserSession {
  user: UserProfile;
  tokens: TokenResponse;
}
```

---

## User Types

```typescript
// Language Preference
export type LanguagePreference = "EN" | "NP";

// User Profile
export interface UserProfile {
  id: number;
  google_auth_user: number;
  full_name: string;
  email: string;
  phone_number?: string | null;
  preferred_language: LanguagePreference;
  target_branch?: number | null;
  target_sub_branch?: number | null;
  experience_points: number;
  level: number;
  total_contributions: number;
  total_questions_attempted: number;
  profile_picture?: string | null;
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

// User Profile Update
export interface UserProfileUpdate {
  full_name?: string;
  phone_number?: string | null;
  preferred_language?: LanguagePreference;
  target_branch?: number | null;
  target_sub_branch?: number | null;
  profile_picture?: File | null;
}

// User Statistics
export interface UserStatistics {
  id: number;
  user: number;
  questions_contributed: number;
  questions_made_public: number;
  questions_answered: number;
  correct_answers: number;
  mock_tests_completed: number;
  study_streak_days: number;
  longest_streak: number;
  last_activity_date?: string | null;
  badges_earned: Record<string, Badge>;
  contribution_rank?: number | null;
  accuracy_rank?: number | null;
  last_updated: string;
}

// Badge
export interface Badge {
  date: string;
  desc: string;
}

// User Progress (per category)
export interface UserProgress {
  id: number;
  user: number;
  category: number;
  questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_time_seconds?: number | null;
  last_attempted_date?: string | null;
  weak_topics?: string[] | null;
  updated_at: string;
}
```

---

## Branch & Category Types

```typescript
// Branch
export interface Branch {
  id: number;
  name_en: string;
  name_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  icon?: string | null;
  has_sub_branches: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Sub Branch
export interface SubBranch {
  id: number;
  branch: number;
  name_en: string;
  name_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  icon?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Category Scope Type
export type CategoryScopeType = "UNIVERSAL" | "BRANCH" | "SUBBRANCH";

// Category Type
export type CategoryType = "GENERAL" | "SPECIAL";

// Category
export interface Category {
  id: number;
  name_en: string;
  name_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  scope_type: CategoryScopeType;
  target_branch?: number | null;
  target_sub_branch?: number | null;
  category_type: CategoryType;
  is_public: boolean;
  created_by?: number | null;
  icon?: string | null;
  color_code?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Question & Answer Types

```typescript
// Difficulty Level
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

// Question Type
export type QuestionType = "MCQ";

// Question Status
export type QuestionStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLIC" | "PRIVATE";

// Question
export interface Question {
  id: number;
  question_text_en: string;
  question_text_np: string;
  category: number;
  difficulty_level?: DifficultyLevel | null;
  question_type: QuestionType;
  explanation_en: string;
  explanation_np: string;
  image?: string | null;
  status: QuestionStatus;
  created_by?: number | null;
  is_public: boolean;
  consent_given: boolean;
  scheduled_public_date?: string | null;
  source_reference?: string | null;
  times_attempted: number;
  times_correct: number;
  reported_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}

// Question Create/Update
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

// Answer
export interface Answer {
  id: number;
  question: number;
  answer_text_en: string;
  answer_text_np: string;
  is_correct: boolean;
  display_order: number;
  created_at: string;
}

// Answer Create
export interface AnswerCreate {
  answer_text_en: string;
  answer_text_np: string;
  is_correct: boolean;
  display_order: number;
}

// Question Report Reason
export type ReportReason =
  | "INCORRECT_ANSWER"
  | "TYPO"
  | "INAPPROPRIATE"
  | "DUPLICATE"
  | "OTHER";

// Question Report Status
export type ReportStatus = "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

// Question Report
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

// Question Report Create
export interface QuestionReportCreate {
  question: number;
  reason: ReportReason;
  description: string;
}
```

---

## Mock Test Types

```typescript
// Test Type
export type TestType = "OFFICIAL" | "COMMUNITY" | "CUSTOM";

// Mock Test
export interface MockTest {
  id: number;
  title_en: string;
  title_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  test_type: TestType;
  branch: number;
  sub_branch?: number | null;
  total_questions: number;
  duration_minutes?: number | null;
  use_standard_duration: boolean;
  pass_percentage: number;
  created_by?: number | null;
  is_public: boolean;
  is_active: boolean;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

// Mock Test Question
export interface MockTestQuestion {
  id: number;
  mock_test: number;
  question: number;
  question_order: number;
  marks_allocated: number;
  created_at: string;
  question_data?: Question; // When expanded
}

// Mock Test Detail (with questions)
export interface MockTestDetail extends MockTest {
  test_questions: MockTestQuestion[];
}

// Time Configuration
export interface TimeConfiguration {
  id: number;
  branch: number;
  sub_branch?: number | null;
  category?: number | null;
  standard_duration_minutes: number;
  questions_count: number;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Attempt & Progress Types

```typescript
// Attempt Status
export type AttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

// Attempt Mode
export type AttemptMode = "MOCK_TEST" | "PRACTICE";

// User Attempt
export interface UserAttempt {
  id: number;
  user: number;
  mock_test?: number | null;
  start_time: string;
  end_time?: string | null;
  total_time_taken?: number | null;
  score_obtained: number;
  total_score: number;
  percentage?: number | null;
  status: AttemptStatus;
  mode: AttemptMode;
  created_at: string;
  updated_at: string;
}

// User Attempt Create
export interface UserAttemptCreate {
  mock_test?: number | null;
  mode: AttemptMode;
}

// User Answer
export interface UserAnswer {
  id: number;
  user_attempt: number;
  question: number;
  selected_answer?: number | null;
  is_correct: boolean;
  time_taken_seconds?: number | null;
  is_skipped: boolean;
  is_marked_for_review: boolean;
  created_at: string;
  updated_at: string;
}

// User Answer Submit
export interface UserAnswerSubmit {
  user_attempt: number;
  question: number;
  selected_answer?: number | null;
  time_taken_seconds?: number | null;
  is_marked_for_review?: boolean;
}

// Attempt Result
export interface AttemptResult {
  attempt: UserAttempt;
  answers: UserAnswer[];
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  accuracy_percentage: number;
}

// Study Collection
export interface StudyCollection {
  id: number;
  name: string;
  description?: string | null;
  created_by: number;
  is_private: boolean;
  questions: number[];
  icon?: string | null;
  color_code?: string | null;
  created_at: string;
  updated_at: string;
}

// Study Collection Create
export interface StudyCollectionCreate {
  name: string;
  description?: string | null;
  is_private?: boolean;
  questions?: number[];
  icon?: string | null;
  color_code?: string | null;
}
```

---

## Analytics Types

```typescript
// Contribution Status
export type ContributionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MADE_PUBLIC";

// Contribution
export interface Contribution {
  id: number;
  user: number;
  question: number;
  contribution_month: number;
  contribution_year: number;
  status: ContributionStatus;
  is_featured: boolean;
  approval_date?: string | null;
  public_date?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

// Daily Activity
export interface DailyActivity {
  id: number;
  date: string;
  new_users: number;
  questions_added: number;
  questions_approved: number;
  mock_tests_taken: number;
  total_answers_submitted: number;
  active_users: number;
  created_at: string;
}

// Leaderboard Time Period
export type TimePeriod = "WEEKLY" | "MONTHLY" | "ALL_TIME";

// Leaderboard Entry
export interface LeaderBoardEntry {
  id: number;
  user: number;
  time_period: TimePeriod;
  branch: number;
  sub_branch?: number | null;
  rank: number;
  previous_rank?: number | null;
  total_score: number;
  tests_completed: number;
  accuracy_percentage: number;
  last_updated: string;
  // Expanded user info (when populated)
  user_name?: string;
  user_picture?: string | null;
}

// Platform Stats
export interface PlatformStats {
  id: number;
  total_questions_public: number;
  total_questions_pending: number;
  total_contributions_this_month: number;
  total_users_active: number;
  total_mock_tests_taken: number;
  total_answers_submitted: number;
  questions_added_today: number;
  top_contributor_this_month?: number | null;
  most_attempted_category?: number | null;
  last_updated: string;
}
```

---

## Notification Types

```typescript
// Notification Type
export type NotificationType =
  | "CONTRIBUTION_APPROVED"
  | "QUESTION_PUBLIC"
  | "LEADERBOARD_RANK"
  | "REPORT_RESOLVED"
  | "STREAK_ALERT"
  | "MILESTONE"
  | "GENERAL";

// Notification
export interface Notification {
  id: number;
  user: number;
  notification_type: NotificationType;
  title_en: string;
  title_np: string;
  message_en: string;
  message_np: string;
  related_question?: number | null;
  related_mock_test?: number | null;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

// App Settings
export interface AppSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string | null;
  is_active: boolean;
  updated_at: string;
}
```

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| POST | `/api/auth/login/` | Email/password login | `LoginRequest` | `TokenResponse` |
| POST | `/api/auth/google/` | Google OAuth login | `GoogleLoginRequest` | `TokenResponse` |
| POST | `/api/auth/registration/` | Register new user | `RegistrationRequest` | `UserProfile` |
| POST | `/token/refresh/` | Refresh access token | `TokenRefreshRequest` | `TokenResponse` |
| POST | `/token/blacklist/` | Logout (blacklist token) | `TokenRefreshRequest` | `void` |

### User Profile

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| GET | `/api/auth/user/` | Get current user profile | - | `UserProfile` |
| PATCH | `/api/auth/user/` | Update user profile | `UserProfileUpdate` | `UserProfile` |

### Branches & Categories

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/api/branches/` | List all branches | `ApiResponse<Branch>` |
| GET | `/api/branches/{id}/` | Get branch details | `Branch` |
| GET | `/api/sub-branches/` | List all sub-branches | `ApiResponse<SubBranch>` |
| GET | `/api/sub-branches/?branch={id}` | Filter sub-branches by branch | `ApiResponse<SubBranch>` |
| GET | `/api/categories/` | List all categories | `ApiResponse<Category>` |
| GET | `/api/categories/?scope_type=UNIVERSAL` | Filter by scope | `ApiResponse<Category>` |

### Questions

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| GET | `/api/questions/` | List public questions | - | `ApiResponse<Question>` |
| GET | `/api/questions/{id}/` | Get question details | - | `Question` |
| POST | `/api/questions/` | Create question (contribution) | `QuestionCreate` | `Question` |
| GET | `/api/questions/?category={id}` | Filter by category | - | `ApiResponse<Question>` |
| GET | `/api/questions/?difficulty_level=EASY` | Filter by difficulty | - | `ApiResponse<Question>` |

### Question Reports

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| GET | `/api/reports/` | List user's reports | - | `ApiResponse<QuestionReport>` |
| POST | `/api/reports/` | Submit a report | `QuestionReportCreate` | `QuestionReport` |
| GET | `/api/reports/{id}/` | Get report details | - | `QuestionReport` |

### Mock Tests

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/api/mock-tests/` | List available tests | `ApiResponse<MockTest>` |
| GET | `/api/mock-tests/{id}/` | Get test details | `MockTestDetail` |
| GET | `/api/mock-tests/?branch={id}` | Filter by branch | `ApiResponse<MockTest>` |
| GET | `/api/mock-tests/?test_type=OFFICIAL` | Filter by type | `ApiResponse<MockTest>` |

### Attempts & Answers

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| GET | `/api/attempts/` | List user's attempts | - | `ApiResponse<UserAttempt>` |
| POST | `/api/attempts/` | Start new attempt | `UserAttemptCreate` | `UserAttempt` |
| GET | `/api/attempts/{id}/` | Get attempt details | - | `AttemptResult` |
| PATCH | `/api/attempts/{id}/` | Complete/abandon attempt | `{ status: AttemptStatus }` | `UserAttempt` |
| POST | `/api/answers/` | Submit answer | `UserAnswerSubmit` | `UserAnswer` |
| PATCH | `/api/answers/{id}/` | Update answer | `UserAnswerSubmit` | `UserAnswer` |

### User Stats & Progress

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/api/statistics/` | Get user statistics | `UserStatistics` |
| GET | `/api/progress/` | Get user progress (all categories) | `ApiResponse<UserProgress>` |
| GET | `/api/progress/?category={id}` | Get progress for category | `UserProgress` |
| GET | `/api/leaderboard/` | Get leaderboard | `ApiResponse<LeaderBoardEntry>` |
| GET | `/api/leaderboard/?time_period=WEEKLY` | Filter by period | `ApiResponse<LeaderBoardEntry>` |
| GET | `/api/leaderboard/?branch={id}` | Filter by branch | `ApiResponse<LeaderBoardEntry>` |

### Study Collections

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| GET | `/api/collections/` | List user's collections | - | `ApiResponse<StudyCollection>` |
| POST | `/api/collections/` | Create collection | `StudyCollectionCreate` | `StudyCollection` |
| GET | `/api/collections/{id}/` | Get collection details | - | `StudyCollection` |
| PATCH | `/api/collections/{id}/` | Update collection | `StudyCollectionCreate` | `StudyCollection` |
| DELETE | `/api/collections/{id}/` | Delete collection | - | `void` |

### Analytics

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/api/platform-stats/` | Get platform statistics | `PlatformStats` |
| GET | `/api/daily-activity/` | Get daily activity data | `ApiResponse<DailyActivity>` |
| GET | `/api/contributions/` | Get user's contributions | `ApiResponse<Contribution>` |

### Notifications

| Method | Endpoint | Description | Request Type | Response Type |
|--------|----------|-------------|--------------|---------------|
| GET | `/api/notifications/` | List user's notifications | - | `ApiResponse<Notification>` |
| GET | `/api/notifications/?is_read=false` | Get unread notifications | - | `ApiResponse<Notification>` |
| PATCH | `/api/notifications/{id}/` | Mark as read | `{ is_read: true }` | `Notification` |
| POST | `/api/notifications/mark-all-read/` | Mark all as read | - | `void` |

### Settings & Time Configs

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| GET | `/api/settings/` | Get app settings | `ApiResponse<AppSetting>` |
| GET | `/api/time-configs/` | Get time configurations | `ApiResponse<TimeConfiguration>` |
| GET | `/api/time-configs/?branch={id}` | Filter by branch | `ApiResponse<TimeConfiguration>` |

---

## Usage Examples

### React Native API Service

```typescript
import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh logic
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>(
      "/auth/login/",
      credentials
    );
    return response.data;
  }

  async googleLogin(token: GoogleLoginRequest): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>(
      "/auth/google/",
      token
    );
    return response.data;
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    const response = await this.api.get<ApiResponse<Branch>>("/branches/");
    return response.data.results || [];
  }

  // Questions
  async getQuestions(params?: {
    category?: number;
    difficulty_level?: DifficultyLevel;
    page?: number;
  }): Promise<ApiResponse<Question>> {
    const response = await this.api.get<ApiResponse<Question>>("/questions/", {
      params,
    });
    return response.data;
  }

  // Mock Tests
  async startAttempt(
    mockTestId: number
  ): Promise<UserAttempt> {
    const response = await this.api.post<UserAttempt>("/attempts/", {
      mock_test: mockTestId,
      mode: "MOCK_TEST",
    });
    return response.data;
  }

  async submitAnswer(answer: UserAnswerSubmit): Promise<UserAnswer> {
    const response = await this.api.post<UserAnswer>("/answers/", answer);
    return response.data;
  }

  async completeAttempt(attemptId: number): Promise<UserAttempt> {
    const response = await this.api.patch<UserAttempt>(
      `/attempts/${attemptId}/`,
      { status: "COMPLETED" }
    );
    return response.data;
  }

  // Notifications
  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await this.api.get<ApiResponse<Notification>>(
      "/notifications/",
      { params: { is_read: false } }
    );
    return response.data.results || [];
  }
}

export const apiService = new ApiService();
```

### React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch branches
export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => apiService.getBranches(),
  });
}

// Fetch questions with filters
export function useQuestions(filters: {
  category?: number;
  difficulty_level?: DifficultyLevel;
}) {
  return useQuery({
    queryKey: ["questions", filters],
    queryFn: () => apiService.getQuestions(filters),
  });
}

// Submit answer mutation
export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answer: UserAnswerSubmit) => apiService.submitAnswer(answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attempts"] });
    },
  });
}

// Start mock test
export function useStartMockTest() {
  return useMutation({
    mutationFn: (mockTestId: number) => apiService.startAttempt(mockTestId),
  });
}
```

---

## WebSocket Events (Real-time Notifications)

```typescript
// WebSocket connection for notifications
const WS_URL = "wss://your-domain.com/ws/notifications/";

interface WebSocketMessage {
  type: "send_notification";
  data: {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string | null;
    created_at: string;
    is_read: boolean;
  };
}

// Usage with React Native
import { useEffect, useState } from "react";

export function useNotificationSocket(userId: number) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?user_id=${userId}`);

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === "send_notification") {
        setNotifications((prev) => [message.data as any, ...prev]);
      }
    };

    return () => ws.close();
  }, [userId]);

  return notifications;
}
```

---

## Error Handling Types

```typescript
// API Error Response
export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
}

// Handle API errors
export function handleApiError(error: any): string {
  if (error.response?.data) {
    const data = error.response.data as ApiError;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.non_field_errors) return data.non_field_errors.join(", ");
    if (data.errors) {
      return Object.values(data.errors).flat().join(", ");
    }
  }
  return "An unexpected error occurred";
}
```

---

## Notes

1. **All date/time fields** are in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`).
2. **Pagination** is handled via `page` and `page_size` query parameters.
3. **Authentication** uses JWT tokens with Bearer scheme.
4. **File uploads** (images) should use `multipart/form-data` content type.
5. **Language support**: The app supports both English (`_en`) and Nepali (`_np`) content.

---

*Last updated: January 2026*

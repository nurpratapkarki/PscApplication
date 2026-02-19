// Contribution, analytics, leaderboard, statistics and notification types (matches README exactly)
// Derived from serializers in PSCApp/src/api/{analytics,user_stats,platform_stats,notification,app_settings}

// Contribution Status (matches README)
export type ContributionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MADE_PUBLIC";

// Contribution (matches README)
export interface Contribution {
  id: number;
  user: number;
  user_name?: string;
  question: number;
  question_text?: string;
  contribution_month: number;
  contribution_year: number;
  status: ContributionStatus;
  is_featured: boolean;
  approval_date?: string | null;
  public_date?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

// Daily Activity (matches README)
export interface DailyActivity {
  id?: number;
  date: string;
  new_users: number;
  questions_added: number;
  questions_approved: number;
  mock_tests_taken: number;
  total_answers_submitted: number;
  active_users: number;
  created_at: string;
}

// Leaderboard Time Period (matches README)
export type LeaderboardTimePeriod = "WEEKLY" | "MONTHLY" | "ALL_TIME";

// Alias for compatibility
export type TimePeriod = LeaderboardTimePeriod;

// Leaderboard Entry (matches README)
export interface LeaderboardEntry {
  id?: number;
  user?: number;
  time_period: LeaderboardTimePeriod;
  branch: number;
  sub_branch?: number | null;
  rank: number;
  previous_rank?: number | null;
  total_score: number;
  tests_completed: number;
  accuracy_percentage: number;
  last_updated?: string;
  // Expanded user info (when populated)
  user_name?: string;
  profile_picture?: string | null;
}

// Re-export UserProgress and UserStatistics from user.types
export { UserProgress, UserStatistics } from "./user.types";

// Study Collection (matches README)
export interface StudyCollection {
  id: number;
  name: string;
  description?: string | null;
  created_by: number;
  is_private: boolean;
  questions: number[];
  icon?: string | null;
  color_code?: string | null;
  question_count?: number;
  created_at: string;
  updated_at?: string;
}

// Study Collection Create (matches README)
export interface StudyCollectionCreate {
  name: string;
  description?: string | null;
  is_private?: boolean;
  questions?: number[];
  icon?: string | null;
  color_code?: string | null;
}

// Badges Earned
export type BadgesEarned = Record<string, unknown>;

// Platform Stats (matches README)
export interface PlatformStats {
  id?: number;
  total_questions_public: number;
  total_questions_pending: number;
  total_contributions_this_month: number;
  total_users_active: number;
  total_mock_tests_taken: number;
  total_answers_submitted: number;
  questions_added_today: number;
  top_contributor_this_month?: number | null;
  top_contributor_name?: string | null;
  most_attempted_category?: number | null;
  most_attempted_category_name?: string | null;
  last_updated: string;
}

// Alias for compatibility with community stats screen
export interface PlatformStatistics {
  total_users: number;
  total_questions: number;
  total_mock_tests: number;
  total_categories: number;
  total_branches: number;
  active_users_today: number;
  questions_added_today: number;
  tests_taken_today: number;
}

// App Setting (matches README)
export interface AppSetting {
  id?: number;
  setting_key: string;
  setting_value: string;
  description?: string | null;
  is_active?: boolean;
  updated_at: string;
}

// Notification Type (extended to include app-specific types)
export type NotificationType =
  | "CONTRIBUTION_APPROVED"
  | "CONTRIBUTION_REJECTED"
  | "QUESTION_PUBLIC"
  | "LEADERBOARD_RANK"
  | "LEADERBOARD_UPDATE"
  | "REPORT_RESOLVED"
  | "STREAK_ALERT"
  | "STREAK_REMINDER"
  | "MILESTONE"
  | "NEW_ACHIEVEMENT"
  | "BADGE_EARNED"
  | "NEW_TEST"
  | "SYSTEM"
  | "ANNOUNCEMENT"
  | "GENERAL"
  | string; // Allow other notification types

// Notification (matches README)
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
export interface RankingEntry {
  rank: number;
  user_name: string;
  profile_picture: string | null;
  questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  questions_contributed: number;
  study_streak_days: number;
  mock_tests_completed: number;
}

export interface RankingsResponse {
  type: 'answers' | 'contributions';
  label: string;
  my_entry: RankingEntry | null;
  top_users: RankingEntry[];
}

export type RankingType = 'answers' | 'contributions';
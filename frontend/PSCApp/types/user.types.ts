// User & profile types aligned with Django's UserProfileSerializer
// PSCApp/src/api/user/serializers.py

// Language Preference (matches README)
export type LanguagePreference = "EN" | "NP";

// Alias for compatibility
export type LanguageCode = LanguagePreference;

// User Profile (matches README exactly)
export interface UserProfile {
  id: number;
  google_auth_user?: number;
  full_name: string;
  email: string;
  phone_number?: string | null;
  preferred_language: LanguagePreference;
  target_branch?: number | null;
  target_sub_branch?: number | null;
  experience_points: number;
  level: number;
  total_contributions: number;
  total_questions_attempted?: number;
  profile_picture?: string | null;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  // Extended fields from serializer
  branch?: number | null; // Alias for target_branch
  branch_name?: string;
  sub_branch_name?: string;
}

// User Profile Update (matches README)
export interface UserProfileUpdate {
  full_name?: string;
  phone_number?: string | null;
  preferred_language?: LanguagePreference;
  target_branch?: number | null;
  target_sub_branch?: number | null;
  profile_picture?: File | null;
}

// Badge (matches README)
export interface Badge {
  date: string;
  desc: string;
}

// User Statistics (matches README)
export interface UserStatistics {
  id?: number;
  user?: number;
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
  // Computed/additional fields
  total_correct_answers?: number;
  questions_correct?: number;
  accuracy_percentage?: number;
  tests_attempted?: number;
  tests_passed?: number;
  total_study_time?: number;
  featured_contributions?: number;
}

// User Progress per category (matches README)
export interface UserProgress {
  id: number;
  user?: number;
  category: number;
  category_name?: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_time_seconds?: number | null;
  last_attempted_date?: string | null;
  weak_topics?: string[] | null;
  updated_at?: string;
}